# Desplegar Mini Timesheets en una EC2, a mano (sin Docker)

Guía paso a paso para alguien que **nunca ha usado AWS**. Lo harás con clicks en la consola de
AWS y comandos por SSH. Cada paso dice **qué hacer**, **por qué** y **cómo comprobar** que salió
bien. No sigas al siguiente paso hasta que la comprobación del actual funcione.

> La consola de AWS cambia de diseño a menudo. Si un botón no se llama exactamente igual, busca
> uno con un nombre parecido en la misma pantalla.

---

## Qué vas a montar

```
Internet ──► tu-dominio.com (HTTPS, puerto 443)
                 │
          ┌──────┴────── EC2 (un servidor Ubuntu) ───────────────────────┐
          │  nginx  ─┬─ /          → web  (Next.js, puerto 3000)         │
          │          └─ /backend/  → API  (Hono,    puerto 3333)         │
          │                               └─► PostgreSQL (puerto 5432)   │
          │  systemd mantiene vivas la web y la API                      │
          └──────────────────────────────────────────────────────────────┘
```

Todo vive en **una sola máquina**. Solo los puertos 22 (SSH, solo para ti), 80 y 443 están abiertos
a internet.

## Antes de empezar: lo que necesitas

1. **Una cuenta de AWS** con un método de pago.
2. **Un dominio** (por ejemplo `mi-timesheets.com`). Puedes comprarlo en Route 53 (dentro de AWS)
   o en cualquier registrador (Namecheap, GoDaddy, Cloudflare…). **Es obligatorio**: sin dominio
   no hay certificado HTTPS, y sin HTTPS el login no funciona, porque las cookies de sesión de
   producción solo se guardan por HTTPS.
3. **En tu Mac**: el repo clonado, `pnpm install` hecho y
   [agent-browser](https://github.com/vercel-labs/agent-browser) instalado
   (`npm i -g agent-browser && agent-browser install`) para la verificación final.

En toda la guía sustituye:

| Texto en la guía | Por |
|---|---|
| `TU_DOMINIO` | tu dominio, por ejemplo `mi-timesheets.com` (sin `https://` ni `/` al final) |
| `TU_IP_ELASTICA` | la IP elástica que crearás en la parte 2 |
| `CONTRASEÑA_BD` | una contraseña larga que inventes para la base de datos (solo letras y números para evitar problemas en la URL) |
| `~/Downloads/timesheet-key.pem` | la ruta donde se descargó tu clave en la parte 1 |

---

## Parte 0 — Protégete del gasto (5 minutos, hazlo primero)

**Por qué:** en AWS pagas por lo que tienes encendido. Si olvidas algo encendido, se cobra. Un
presupuesto te avisa por correo antes de llevarte un susto.

1. Arriba a la derecha, haz click en el nombre de tu cuenta → **Billing and Cost Management**.
2. Menú izquierdo → **Budgets** → **Create budget**.
3. Elige **Use a template (simplified)** → **Monthly cost budget**.
4. Pon un importe (por ejemplo **10 USD**) y tu correo en **Email recipients** → **Create budget**.

**Comprueba:** el presupuesto aparece en la lista de **Budgets**.

Elige también una **región** y úsala siempre (arriba a la derecha, junto al nombre de tu cuenta;
por ejemplo **US East (N. Virginia) us-east-1**). Los recursos de una región no se ven desde otra:
si un día "desaparece" tu servidor, casi siempre es que estás mirando otra región.

---

## Parte 1 — Lanzar el servidor (la instancia EC2)

**Qué es:** una EC2 es un ordenador virtual en los centros de datos de AWS. Vas a alquilar uno
con Ubuntu.

1. En el buscador de arriba escribe **EC2** y entra.
2. Botón naranja **Launch instance**.
3. **Name**: `timesheet-server`.
4. **Application and OS Images (AMI)**: elige **Ubuntu** → **Ubuntu Server 24.04 LTS**.
   En **Architecture** elige **64-bit (Arm)**.
   *Por qué Arm:* las instancias `t4g` (procesador Graviton de AWS) son más baratas que las
   equivalentes Intel, y todo lo que usamos (Node, PostgreSQL, nginx) funciona en Arm.
5. **Instance type**: `t4g.small` (2 GB de RAM).
   *Por qué no `t4g.micro`:* compilar la web (`next build`) necesita más de 1 GB de memoria.
   Igualmente añadiremos memoria de intercambio (*swap*) en la parte 5.2 por seguridad.
6. **Key pair (login)** → **Create new key pair**:
   - Name: `timesheet-key`
   - Key pair type: **ED25519**
   - Format: **.pem**
   - **Create key pair** → se descarga `timesheet-key.pem`. **Guárdalo bien**: es la única forma
     de entrar al servidor y AWS no te lo vuelve a dar.
7. **Network settings** → botón **Edit**:
   - Deja la VPC y la subred por defecto. Comprueba que **Auto-assign public IP** está en
     **Enable**.
   - **Firewall (security groups)** → **Create security group**.
   - Security group name: `timesheet-sg`.
   - Reglas (**Inbound Security Group Rules**). Ya hay una de SSH; ajústala y añade dos más con
     **Add security group rule**:

     | Type | Port | Source type | Para qué |
     |---|---|---|---|
     | SSH | 22 | **My IP** | Solo tú puedes conectarte por SSH |
     | HTTP | 80 | **Anywhere** | La web (y la validación del certificado) |
     | HTTPS | 443 | **Anywhere** | La web con HTTPS |

     **No abras el 3000, el 3333 ni el 5432.** Solo nginx habla con la web y la API, por dentro
     de la máquina, y la base de datos no debe verse desde internet.
8. **Configure storage**: cambia a **20** GiB, tipo **gp3**.
9. Botón **Launch instance** → **View all instances**.

**Comprueba:** en **Instances**, `timesheet-server` pasa a **Instance state: Running** y
**Status check: 2/2 checks passed** (puede tardar 2-3 minutos; pulsa el botón de refrescar).

---

## Parte 2 — Darle una IP fija (IP elástica)

**Por qué:** la IP pública que AWS da por defecto **cambia** si apagas y enciendes la instancia.
Tu dominio tiene que apuntar a una IP que no cambie: eso es una **IP elástica**.

1. EC2 → menú izquierdo **Network & Security → Elastic IPs** → **Allocate Elastic IP address**
   → **Allocate**.
2. Selecciona la IP nueva → **Actions → Associate Elastic IP address**.
3. **Resource type: Instance** → en **Instance** elige `timesheet-server` → **Associate**.

**Comprueba:** en **Instances**, la columna **Public IPv4 address** de tu servidor muestra la IP
elástica. Apúntala: es tu `TU_IP_ELASTICA`.

> Las IP públicas se cobran mientras existen, y una IP elástica sin asociar también. Cuando
> termines la práctica, libérala (sección "Apagar y borrar todo", al final).

---

## Parte 3 — Apuntar tu dominio al servidor (DNS)

**Por qué:** el DNS traduce `TU_DOMINIO` a `TU_IP_ELASTICA`. Sin esto, nadie llega a tu servidor
por el nombre y no podrás pedir el certificado.

**Si el dominio está en Route 53:**
1. Busca **Route 53** → **Hosted zones** → haz click en tu dominio.
2. **Create record**:
   - Record name: vacío (es el dominio raíz).
   - Record type: **A**.
   - Value: `TU_IP_ELASTICA`.
   - TTL: `300`.
   - **Create records**.

**Si está en otro registrador:** en su panel, sección **DNS**, crea un registro **A** con
**Host/Name** `@` y **Value/Points to** `TU_IP_ELASTICA`.

**Comprueba** desde la terminal de tu Mac (puede tardar de unos minutos a una hora):

```bash
dig +short TU_DOMINIO
```

Debe imprimir `TU_IP_ELASTICA`. Mientras no lo haga, sigue con las partes 4 a 11, que no
dependen del dominio.

---

## Parte 4 — Conectarte al servidor por SSH

**Qué es SSH:** una terminal remota y cifrada. Lo que escribas se ejecuta en el servidor.

En la terminal de tu Mac:

```bash
chmod 400 ~/Downloads/timesheet-key.pem
ssh -i ~/Downloads/timesheet-key.pem ubuntu@TU_IP_ELASTICA
```

- `chmod 400` deja la clave legible solo por ti; SSH se niega a usar claves con permisos abiertos.
- `ubuntu` es el usuario que traen las instancias de Ubuntu en AWS.
- La primera vez te pregunta `Are you sure you want to continue connecting?` → escribe `yes`.

**Comprueba:** el prompt cambia a algo como `ubuntu@ip-172-31-...:~$`. **Desde aquí, todos los
comandos hasta la parte 13 se ejecutan en el servidor**, no en tu Mac.

> Si no conecta: en el security group, la regla SSH tiene **My IP**. Si tu IP de casa cambió
> (pasa a menudo), edita esa regla y vuelve a elegir **My IP**.

---

## Parte 5 — Preparar el sistema

**5.1 Actualizar los paquetes** (como "buscar actualizaciones" en tu Mac):

```bash
sudo apt update && sudo apt upgrade -y
```

`sudo` ejecuta como administrador; `apt` es el gestor de paquetes de Ubuntu (como Homebrew).
Si al final pide reiniciar, ejecuta `sudo reboot`, espera un minuto y vuelve a conectarte con el
mismo `ssh`.

**5.2 Añadir memoria de intercambio (swap) de 2 GB.** Es espacio en disco que el sistema usa como
RAM de emergencia. Evita que `next build` se quede sin memoria y muera.

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

La última línea hace que el swap siga activo tras reiniciar.
**Comprueba:** `free -h` muestra una fila `Swap:` con `2.0Gi`.

**5.3 Firewall del propio servidor (ufw).** El security group es el firewall de AWS, por fuera;
`ufw` es el de Ubuntu, por dentro. Con los dos, si uno se configura mal, el otro sigue
protegiendo (*defensa en profundidad*).

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

**Importante:** permite el 22 **antes** de activar el firewall, o te quedarías fuera de tu propia
conexión SSH.
**Comprueba:** `sudo ufw status` muestra `Status: active` y las reglas 22, 80 y 443.

---

## Parte 6 — Instalar Node.js 22, pnpm y git

El proyecto pide Node 22 (archivo `.nvmrc` del repo). La versión de Node que trae Ubuntu es
antigua, así que usamos el repositorio oficial de NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git
```

pnpm viene incluido en Node a través de **corepack**; solo hay que activarlo:

```bash
sudo corepack enable
```

**Comprueba:**

```bash
node -v     # v22.x.x
which node  # /usr/bin/node   ← es la ruta que usan los archivos .service
git --version
```

---

## Parte 7 — Instalar PostgreSQL y crear la base de datos

```bash
sudo apt install -y postgresql
```

Ubuntu 24.04 instala PostgreSQL 16 (la misma versión que usas en local) y lo deja arrancado y
configurado para iniciarse con el servidor (eso lo hace systemd, como hará con tu app).

Crea un usuario y una base de datos para la app. `postgres` es el administrador de PostgreSQL;
`sudo -u postgres` ejecuta el comando como él:

```bash
sudo -u postgres psql -c "CREATE USER timesheet WITH PASSWORD 'CONTRASEÑA_BD';"
sudo -u postgres psql -c "CREATE DATABASE timesheet OWNER timesheet;"
```

**Comprueba** que puedes entrar con ese usuario (`\q` para salir):

```bash
psql "postgres://timesheet:CONTRASEÑA_BD@localhost:5432/timesheet" -c "select 1;"
```

Debe imprimir una tabla con un `1`. PostgreSQL solo escucha dentro de la máquina (`localhost`)
por defecto, y además el puerto 5432 está cerrado en el security group y en `ufw`.

---

## Parte 8 — Crear el usuario de la app y descargar el código

**8.1 Un usuario sin privilegios para la app.** La app no debe correr como administrador: si
alguien encontrara un fallo en ella, solo tendría los permisos de este usuario.

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin timesheet
```

- `--system`: usuario de servicio, no de persona.
- `--shell /usr/sbin/nologin`: nadie puede iniciar sesión con él.
- `--create-home`: le da una carpeta personal, donde pnpm guarda su caché.

**8.2 Descargar el código en `/opt`** (la carpeta habitual para apps instaladas a mano) y dárselo
a ese usuario:

```bash
sudo git clone https://github.com/MATREYcr/timesheet-tracker.git /opt/timesheet-tracker
sudo chown -R timesheet:timesheet /opt/timesheet-tracker
```

A partir de aquí, los comandos de la app se ejecutan **como el usuario `timesheet`** con
`sudo -u timesheet -H ...`, para que todos los archivos le pertenezcan (`-H` hace que use su
propia carpeta personal para cachés).

**Comprueba:** `ls -la /opt/timesheet-tracker` muestra los archivos del repo con dueño
`timesheet`.

---

## Parte 9 — Configurar las variables de entorno

Son la configuración de producción: tu dominio, la base de datos y el secreto de las sesiones.

**9.1 Genera el secreto de sesiones** y cópialo (lo pegarás enseguida):

```bash
openssl rand -base64 32
```

**9.2 Crea el `.env` de la API** con el editor `nano`:

```bash
sudo -u timesheet nano /opt/timesheet-tracker/apps/api/.env
```

Pega esto, sustituyendo los valores:

```dotenv
DATABASE_URL=postgres://timesheet:CONTRASEÑA_BD@localhost:5432/timesheet
PORT=3333
CORS_ORIGIN=https://TU_DOMINIO
BETTER_AUTH_SECRET=EL_SECRETO_DEL_PASO_9.1
BETTER_AUTH_URL=https://TU_DOMINIO/backend
```

Guarda con `Ctrl + O` y `Enter`, y sal con `Ctrl + X`.

- `BETTER_AUTH_URL` es la URL pública de la API. Su ruta (`/backend`) hace que la API monte todas
  sus rutas bajo `/backend`, que es donde nginx le pasa las peticiones.
- `CORS_ORIGIN` es la URL de la web: el único origen desde el que se aceptan logins.
- `NODE_ENV=production` y `HOST=127.0.0.1` no van aquí: los pone el archivo `.service`.

**9.3 Crea el `.env.local` de la web:**

```bash
sudo -u timesheet nano /opt/timesheet-tracker/apps/web/.env.local
```

```dotenv
NEXT_PUBLIC_API_URL=https://TU_DOMINIO/backend
```

> **Esta URL se copia dentro del código al compilar** (parte 10). Si algún día la cambias, tienes
> que volver a compilar la web.

**9.4 Protege los archivos** (contienen contraseñas): solo su dueño puede leerlos.

```bash
sudo chmod 600 /opt/timesheet-tracker/apps/api/.env /opt/timesheet-tracker/apps/web/.env.local
```

**Comprueba:** `sudo -u timesheet cat /opt/timesheet-tracker/apps/api/.env` muestra tus valores,
sin espacios alrededor del `=` ni comillas de más.

---

## Parte 10 — Instalar dependencias, compilar y preparar la base de datos

Todo como el usuario `timesheet`, desde la carpeta del repo:

```bash
cd /opt/timesheet-tracker
sudo -u timesheet -H env COREPACK_ENABLE_DOWNLOAD_PROMPT=0 pnpm install --frozen-lockfile
```

- `--frozen-lockfile` instala **exactamente** las versiones de `pnpm-lock.yaml`, las mismas que
  probaste en local.
- `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` evita que corepack se pare a preguntar si descarga la
  versión de pnpm que pide el proyecto.

```bash
sudo -u timesheet -H pnpm build
```

Compila `shared`, la API (`apps/api/dist/main.js`) y la web (`apps/web/.next`). Tarda unos
minutos. **Comprueba:** termina con `Successfully ran target build for 3 projects`.

```bash
sudo -u timesheet -H pnpm db:migrate
```

Crea las tablas en tu base de datos. **Comprueba:** `migrations applied successfully!`

```bash
sudo -u timesheet -H pnpm db:seed
```

**Opcional, y solo la primera vez:** carga datos de ejemplo y crea la cuenta demo
(`demo@timesheet.dev` / `Demo1234!`). **Borra y vuelve a crear los empleados y las horas**, así
que no lo ejecutes cuando ya tengas datos reales. Las cuentas de usuario no las toca.

---

## Parte 11 — Arrancar la API y la web como servicios (systemd)

**Qué es systemd:** el "encargado" de Ubuntu que arranca los programas al encender la máquina y
los reinicia si se caen. Le describes cada programa con un archivo `.service`; los nuestros están
en `deploy/ec2/`.

```bash
sudo cp /opt/timesheet-tracker/deploy/ec2/timesheet-api.service /etc/systemd/system/
sudo cp /opt/timesheet-tracker/deploy/ec2/timesheet-web.service /etc/systemd/system/
sudo systemd-analyze verify /etc/systemd/system/timesheet-api.service /etc/systemd/system/timesheet-web.service
```

`systemd-analyze verify` revisa los archivos: si no imprime nada, están bien.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now timesheet-api timesheet-web
```

- `daemon-reload`: systemd vuelve a leer sus archivos y descubre los nuevos.
- `enable --now`: los arranca ahora **y** en cada encendido.

**Comprueba:**

```bash
systemctl status timesheet-api timesheet-web --no-pager
curl -s http://127.0.0.1:3333/backend/health
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/login
```

- Los dos servicios muestran `Active: active (running)`.
- La API responde `{"status":"ok"}`. Fíjate en la ruta `/backend/health`: la API ya monta sus
  rutas bajo `/backend`.
- La web responde `200`.

**Ver los logs** (lo primero que mirar si algo falla; `Ctrl + C` para salir):

```bash
journalctl -u timesheet-api -f
journalctl -u timesheet-web -f
```

---

## Parte 12 — nginx: la puerta de entrada

**Qué es:** el proxy inverso. Recibe todo lo que llega de internet por el 80 y el 443 y lo reparte:
`/backend/...` a la API y el resto a la web. Además gestionará el HTTPS.

```bash
sudo apt install -y nginx
sudo cp /opt/timesheet-tracker/deploy/ec2/nginx.conf /etc/nginx/sites-available/timesheet
sudo sed -i 's/example.com/TU_DOMINIO/' /etc/nginx/sites-available/timesheet
sudo ln -s /etc/nginx/sites-available/timesheet /etc/nginx/sites-enabled/timesheet
sudo rm /etc/nginx/sites-enabled/default
```

- `sites-available` guarda las configuraciones; `sites-enabled` tiene enlaces a las que están
  activas. Por eso se crea un enlace (`ln -s`) en vez de copiar dos veces.
- `sed` sustituye `example.com` por tu dominio dentro del archivo.
- Quitamos el sitio `default` de bienvenida de nginx para que no se mezcle con el nuestro.

```bash
sudo nginx -t
sudo systemctl reload nginx
```

`nginx -t` revisa la configuración **antes** de aplicarla. Si falla, te dice el archivo y la línea,
y el nginx en marcha sigue con la configuración anterior. Ejecútalo siempre antes de `reload`.

**Comprueba** desde el navegador de tu Mac: `http://TU_DOMINIO` muestra la pantalla de login.

> Todavía **no inicies sesión**: sin HTTPS el navegador no guarda la cookie de sesión y el login
> parece no hacer nada. Es lo esperado hasta la parte 13.

---

## Parte 13 — HTTPS con Let's Encrypt (certbot)

**Qué es:** un certificado demuestra que tu servidor es de verdad `TU_DOMINIO` y permite cifrar
la conexión. Let's Encrypt los da gratis, y **certbot** los pide y los configura en nginx.

Requisitos: `dig +short TU_DOMINIO` ya devuelve tu IP (parte 3) y el puerto 80 está abierto.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d TU_DOMINIO --redirect
```

- Te pide un correo (para avisos de caducidad) y que aceptes los términos.
- `--nginx` edita tu configuración de nginx para usar el certificado en el 443.
- `--redirect` hace que `http://` redirija a `https://`.

**Comprueba:**
- `https://TU_DOMINIO` muestra el candado en el navegador.
- La renovación automática está programada (los certificados duran 90 días):

  ```bash
  systemctl list-timers | grep certbot
  sudo certbot renew --dry-run
  ```

---

## Parte 14 — Verificar que todo funciona

**14.1 En el navegador:** entra en `https://TU_DOMINIO`, inicia sesión con la cuenta demo (si
ejecutaste el seed) o crea una cuenta, y recorre Empleados, Horas y Resumen semanal.

**14.2 Prueba automática del flujo completo**, desde la terminal **de tu Mac** (no del servidor),
en la carpeta del repo:

```bash
BASE_URL=https://TU_DOMINIO API_URL=https://TU_DOMINIO/backend pnpm verify:auth
```

Debe terminar con `All 31 steps passed.`

**14.3 Comprobaciones rápidas:**

```bash
curl -s https://TU_DOMINIO/backend/health              # {"status":"ok"}
curl -s https://TU_DOMINIO/backend/employees           # 401 UNAUTHORIZED sin sesión: correcto
curl -s -m 5 http://TU_IP_ELASTICA:3333/backend/health  # no debe responder: la API no es pública
```

Y la documentación de la API en `https://TU_DOMINIO/backend/docs`.

---

## Actualizar la app cuando cambies el código

En el servidor:

```bash
cd /opt/timesheet-tracker
sudo -u timesheet -H git pull
sudo -u timesheet -H env COREPACK_ENABLE_DOWNLOAD_PROMPT=0 pnpm install --frozen-lockfile
sudo -u timesheet -H pnpm build
sudo -u timesheet -H pnpm db:migrate
sudo systemctl restart timesheet-api timesheet-web
```

Y repite la verificación de la parte 14.

---

## Si algo falla

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| `ssh` se queda colgado o da *timeout* | Tu IP cambió y la regla SSH solo permite la antigua | Security group → editar la regla SSH → **My IP** |
| `next build` termina con `Killed` | Sin memoria | Comprueba el swap (parte 5.2) con `free -h` |
| **502 Bad Gateway** en el navegador | La web o la API no están corriendo | `systemctl status timesheet-api timesheet-web` y `journalctl -u timesheet-api -n 50` |
| La API no arranca: `Invalid environment variables` | Falta o está mal una variable en `apps/api/.env` | El log dice cuál; revisa la parte 9.2 |
| Inicias sesión y vuelves al login | Estás en `http://`, o `CORS_ORIGIN` / `BETTER_AUTH_URL` no coinciden con tu dominio | Usa `https://`; revisa la parte 9.2 |
| El registro o login da **404** | `BETTER_AUTH_URL` sin `/backend`, o la web compilada con otra `NEXT_PUBLIC_API_URL` | Corrige los `.env`, recompila (`pnpm build`) y reinicia los servicios |
| `/login` entra en un bucle de redirecciones | Alguien añadió `--hostname` al `.service` de la web | Quítalo (ver el comentario del archivo), `daemon-reload` y `restart` |
| certbot falla en la validación | El DNS aún no apunta a tu IP, o el puerto 80 está cerrado | `dig +short TU_DOMINIO`; revisa el security group y `sudo ufw status` |
| La consola de AWS "no muestra" tu servidor | Estás en otra región | Cambia la región arriba a la derecha |

---

## Apagar y borrar todo (para no pagar)

Cuando termines la práctica, en la consola de EC2:

1. **Instances** → selecciona `timesheet-server` → **Instance state → Terminate instance**.
   Terminar **borra** la máquina y su disco. (*Stop* solo la apaga: deja de cobrar la máquina,
   pero sigue cobrando el disco y la IP.)
2. **Elastic IPs** → selecciona tu IP → **Actions → Release Elastic IP addresses**.
3. **Security Groups** → borra `timesheet-sg` (cuando la instancia ya esté terminada).
4. Si creaste el registro DNS en Route 53, bórralo. La *hosted zone* también tiene un pequeño
   coste mensual si ya no la vas a usar.

Revisa **Billing and Cost Management** unos días después para confirmar que el gasto se detuvo.
