# Desplegar Mini Timesheets en una EC2, a mano (sin Docker)

Guía paso a paso para alguien que **nunca ha usado AWS**. Lo harás con clicks en la consola web de
AWS y comandos en una terminal dentro del servidor. Cada paso dice **qué hacer** y **cómo
comprobar** que salió bien. No sigas al siguiente paso hasta que la comprobación del actual
funcione.

**Cómo leer esta guía:** cada elección importante lleva un bloque como este:

> **¿Por qué…?** Qué elegimos, qué alternativa descartamos y el motivo.

Léelos: son la parte que te enseña a decidir por tu cuenta en el próximo despliegue.

> La consola de AWS cambia de diseño a menudo. Si un botón no se llama exactamente igual, busca
> uno con un nombre parecido en la misma pantalla.

---

## Qué vas a montar

```
Internet ──► timesheet.mateocabrera.space (HTTPS, puerto 443)
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

> **¿Por qué todo en una máquina y sin Docker?** Es la forma más barata y la que más te enseña: ves
> e instalas cada pieza (sistema, base de datos, proxy, servicios, certificado) con tus manos.
> La alternativa "de empresa" (contenedores en ECS, base de datos en RDS, balanceador de carga)
> es más robusta, pero esconde justo lo que quieres aprender y cuesta varias veces más. Será una
> práctica posterior, reutilizando lo que aprendas aquí.

> **¿Por qué la API va en `/backend` del mismo dominio y no en `api.mateocabrera.space`?** La
> cookie de sesión la crea la API. Con un subdominio aparte, la cookie sería solo de
> `api.mateocabrera.space` y la web no la vería, así que te echaría al login aunque estuvieras
> dentro. Con un solo dominio la cookie es de ese dominio, la ven las dos, y además el navegador
> no necesita CORS.

## Antes de empezar: lo que necesitas

1. **Una cuenta de AWS** con un método de pago.
2. **El dominio `mateocabrera.space`**, gestionado en **Cloudflare**. La app vivirá en el
   subdominio **`timesheet.mateocabrera.space`**.
3. **En tu Mac**: el repo clonado, `pnpm install` hecho y
   [agent-browser](https://github.com/vercel-labs/agent-browser) instalado
   (`npm i -g agent-browser && agent-browser install`) para la verificación final.

> **¿Por qué hace falta un dominio?** Sin dominio no hay certificado HTTPS (Let's Encrypt no los
> da para una IP suelta), y sin HTTPS el login no funciona: en producción las cookies de sesión
> llevan el flag `Secure`, y el navegador solo las guarda por HTTPS.

> **¿Por qué un subdominio (`timesheet.`) y no `mateocabrera.space` directamente?** Deja el
> dominio raíz libre (por ejemplo, para un portafolio) y cada práctica puede tener su propio
> subdominio sin pisarse. Para el certificado y el DNS funciona exactamente igual.

En la guía, sustituye estos textos por tus valores:

| Texto en la guía | Por |
|---|---|
| `TU_IP_ELASTICA` | la IP elástica que crearás en la parte 2 |
| `CONTRASEÑA_BD` | una contraseña larga que inventes para la base de datos (solo letras y números) |
| `~/.ssh/timesheet-key.pem` | la ruta donde guardes tu clave en la parte 1 |

> **¿Por qué la contraseña solo con letras y números?** Va dentro de una URL
> (`postgres://usuario:contraseña@...`). Símbolos como `@`, `/`, `:` o `#` tienen significado en
> una URL y la romperían. Con una contraseña larga (24 o más caracteres) sigue siendo muy segura.

---

## Parte 0 — Protégete del gasto y elige región (5 minutos, hazlo primero)

**0.1 Presupuesto con aviso por correo.**

1. Arriba a la derecha, haz click en el nombre de tu cuenta → **Billing and Cost Management**.
2. Menú izquierdo → **Budgets** → **Create budget**.
3. Elige **Use a template (simplified)** → **Monthly cost budget**.
4. Pon un importe (por ejemplo **10 USD**) y tu correo en **Email recipients** → **Create budget**.

**Comprueba:** el presupuesto aparece en la lista de **Budgets**.

> **¿Por qué un presupuesto?** En AWS pagas (o gastas créditos) por lo que tienes encendido, aunque
> no lo uses. El presupuesto no corta nada: solo te avisa por correo cuando el gasto real o el
> previsto del mes supera el importe. La plantilla *Monthly cost budget* crea tres alertas: al 85%
> y al 100% del gasto real, y al 100% del **previsto**. Es normal que a principios de mes salte la
> previsión, porque extrapola pocos días.

**0.2 Elige la región `us-east-1` (N. Virginia).** Entra en el servicio **EC2** y, arriba a la
derecha, selecciona **United States (N. Virginia) us-east-1**. En pantallas de servicios globales
(como Billing) el selector sale bloqueado con un candado y pone **Global**: es normal, porque esos
servicios no van por región.

> **¿Por qué `us-east-1` viviendo en Colombia?** Es la región más barata y la que tiene todos los
> servicios; la mayoría de tutoriales la usan, así que lo que veas coincidirá con lo que busques.
> La latencia desde Colombia es baja (el tráfico suele salir por Miami hacia la costa este de
> EE. UU.). **São Paulo (`sa-east-1`)** parece más cerca pero suele tener **más** latencia desde
> Colombia y es notablemente más cara. **México (`mx-central-1`)** hay que activarla a mano, es
> más cara y tiene menos servicios.

> **Importante:** crea **todo** en la misma región. Los recursos de una región no se ven desde otra:
> si un día "desaparece" tu servidor, casi siempre es que estás mirando otra región.

---

## Parte 1 — Lanzar el servidor (la instancia EC2)

**Qué es:** una EC2 es un ordenador virtual en los centros de datos de AWS. Vas a alquilar uno
con Ubuntu.

1. En el buscador de arriba escribe **EC2** y entra (con **us-east-1** seleccionada).
2. Botón naranja **Launch instance**.

**1.1 Name and tags → Name:** `timesheet-server`.

> **¿Por qué solo el nombre?** El campo *Name* ya es una etiqueta (`Name = timesheet-server`) y es
> lo que verás en la lista de instancias. Opcionalmente puedes añadir `Project = timesheet` con
> **Add additional tags**: las empresas usan etiquetas para saber de qué proyecto es cada recurso y
> repartir la factura. Para esta práctica no hace falta.

**1.2 Application and OS Images (AMI):** **Ubuntu** → **Ubuntu Server 24.04 LTS**, y en
**Architecture**: **64-bit (Arm)**.

> **¿Por qué Ubuntu y no Amazon Linux?** Ubuntu es el Linux más usado en servidores: casi cualquier
> error que busques está resuelto para Ubuntu, y los comandos de esta guía (`apt`, `ufw`) son los
> suyos. Amazon Linux 2023 funciona bien, pero usa otro gestor de paquetes (`dnf`) y tiene menos
> documentación fuera de AWS.

> **¿Por qué 24.04 LTS y no 26.04 LTS?** *LTS* (*Long Term Support*) significa 5 años de parches de
> seguridad; las versiones no-LTS solo 9 meses. La 26.04 también es válida y su soporte dura más,
> pero la 24.04 tiene dos años y medio de uso (más ayuda escrita) e instala **PostgreSQL 16**, la
> misma versión que usas en local. Con la 26.04 los pasos son los mismos, salvo que PostgreSQL será
> más nuevo.

> **¿Por qué Arm (Graviton) y no x86 (Intel/AMD)?** Las instancias Arm de AWS (`t4g`, la "g" es de
> **Graviton**) cuestan en torno a un 20% menos que las equivalentes Intel (`t3`) con rendimiento
> similar, y todo lo que usamos (Node, PostgreSQL, nginx, las dependencias del proyecto) existe
> para Arm. Si tu Mac tiene chip M, también es Arm: llevas todo este tiempo ejecutando el proyecto
> en Arm. x86 solo compensa si necesitas un programa que únicamente existe para Intel/AMD.
> **La arquitectura y el tipo de instancia deben encajar:** Arm → `t4g`; x86 → `t3`/`t2`.

**1.3 Instance type:** `t4g.small` (2 vCPU, 2 GB de RAM).

> **¿Por qué `t4g.small`?** Compilar la web (`next build`) necesita más de 1 GB de memoria: con
> `t4g.micro` (1 GB) se quedaría sin memoria aunque añadiéramos swap. `t4g.medium` (4 GB) sobra
> para esta app y cuesta el doble. Las instancias **`t`** son "*burstable*": acumulan créditos de
> CPU cuando están tranquilas y los gastan en picos (como el build), ideal para apps con poco
> tráfico.

**1.4 Key pair (login)** → **Create new key pair**:

- **Name:** `timesheet-key`
- **Key pair type:** **ED25519**
- **Private key file format:** **.pem**
- **Create key pair** → se descarga `timesheet-key.pem`. Muévelo a `~/.ssh/` en tu Mac
  (`mv ~/Downloads/timesheet-key.pem ~/.ssh/`). **AWS no te lo vuelve a dar** y **nunca lo subas a
  GitHub**.

> **¿Por qué ED25519 y no RSA?** Las dos son algoritmos de criptografía para tu clave SSH. ED25519
> es el moderno: igual o más seguro con una clave mucho más corta, y más rápido. RSA solo hace falta
> para sistemas o herramientas muy antiguos; tu Mac y Ubuntu 24.04 soportan ED25519 sin problemas.

> **¿Por qué `.pem` y no `.ppk`?** Es el formato del archivo. `.pem` lo usa el comando `ssh` de
> macOS, Linux y Windows moderno; `.ppk` es solo para **PuTTY**, un programa antiguo de Windows.

> **¿Y si lo pierdo?** Podrás seguir entrando desde el navegador con EC2 Instance Connect
> (parte 4, opción A), que no usa este archivo.

**1.5 Network settings** → botón **Edit**:

- **VPC** y **Subnet**: deja los de por defecto. **Auto-assign public IP**: **Enable**.
- **Firewall (security groups)** → **Create security group** → nombre `timesheet-sg`.
- **Inbound Security Group Rules.** Ya hay una de SSH; ajústala y añade las demás con
  **Add security group rule**:

  | Type | Port | Source type | Para qué |
  |---|---|---|---|
  | SSH | 22 | **My IP** | Solo tú puedes conectarte por SSH desde tu terminal |
  | SSH | 22 | **Custom** → escribe `ec2-instance-connect` y elige la lista `com.amazonaws.us-east-1.ec2-instance-connect` | Conectarte desde el navegador (parte 4, opción A) |
  | HTTP | 80 | **Anywhere** | La web y la validación del certificado |
  | HTTPS | 443 | **Anywhere** | La web con HTTPS |

> **¿Por qué la VPC por defecto?** Una VPC es tu red privada dentro de AWS. La que trae la cuenta
> ya tiene subredes públicas con salida a internet: perfecta para un servidor que debe ser
> accesible. Diseñar una VPC propia (subredes privadas, NAT…) es un tema avanzado para más
> adelante, y algunas piezas, como el NAT gateway, cuestan dinero por hora.

> **¿Por qué SSH solo desde "My IP" y no "Anywhere"?** El 22 es la puerta de administración del
> servidor. Abierto a todo internet, recibirías intentos automáticos de acceso a todas horas. Con
> *My IP* solo tu conexión de casa puede intentarlo. La segunda regla de SSH tampoco abre el 22 a
> todo el mundo: solo a las direcciones que AWS usa para la terminal del navegador (una
> *prefix list* que mantiene AWS).

> **¿Por qué 80 y 443 desde "Anywhere"?** Son la web: tiene que poder visitarla cualquiera. El 80
> además lo necesita Let's Encrypt para comprobar que el dominio es tuyo; luego nginx redirige el
> 80 al 443.

> **¿Por qué NO abrir 3000, 3333 ni 5432?** Son la web, la API y la base de datos **por dentro**.
> Solo nginx habla con la web y la API desde la propia máquina, y la base de datos nunca debe verse
> desde internet. Cada puerto abierto de más es una puerta que defender.

**1.6 Configure storage:** **20** GiB, tipo **gp3**.

> **¿Por qué 20 GB y no los 8 que vienen?** Ubuntu ocupa unos 3 GB, `node_modules` y los builds del
> proyecto otros 2-3 GB, más PostgreSQL, logs, el swap de 2 GB y las actualizaciones. Con 8 GB
> te quedarías sin espacio enseguida; 20 GB da margen y cuesta muy poco más.

> **¿Por qué gp3 y no gp2?** Son tipos de disco SSD. gp3 es la generación nueva: más barato por GB
> que gp2 y con un rendimiento base fijo, sin depender del tamaño del disco.

**1.7** Botón **Launch instance** → **View all instances**.

**Comprueba:** en **Instances**, `timesheet-server` pasa a **Instance state: Running** y
**Status check: 2/2 checks passed** (puede tardar 2-3 minutos; pulsa el botón de refrescar).

---

## Parte 2 — Darle una IP fija (IP elástica)

1. EC2 → menú izquierdo **Network & Security → Elastic IPs** → **Allocate Elastic IP address**
   → **Allocate**.
2. Selecciona la IP nueva → **Actions → Associate Elastic IP address**.
3. **Resource type: Instance** → en **Instance** elige `timesheet-server` → **Associate**.

**Comprueba:** en **Instances**, la columna **Public IPv4 address** de tu servidor muestra la IP
elástica. Apúntala: es tu `TU_IP_ELASTICA`.

> **¿Por qué una IP elástica?** La IP pública que AWS asigna por defecto **cambia** cada vez que
> paras y vuelves a encender la instancia, y tu DNS dejaría de apuntar al servidor. La IP elástica
> es fija: se queda contigo hasta que la liberes. La alternativa sería actualizar el DNS a mano
> cada vez que enciendes la máquina, propenso a errores.

> Las IP públicas se cobran por hora mientras existen, también una IP elástica sin asociar. Cuando
> termines la práctica, libérala (sección "Apagar y borrar todo", al final).

---

## Parte 3 — Apuntar tu dominio al servidor (DNS en Cloudflare)

1. Entra en [dash.cloudflare.com](https://dash.cloudflare.com) y haz click en
   **mateocabrera.space**.
2. Menú izquierdo → **DNS** → **Records** → botón **Add record**.
3. Rellena:

   | Campo | Valor |
   |---|---|
   | **Type** | `A` |
   | **Name** | `timesheet` (Cloudflare completa el resto: `timesheet.mateocabrera.space`) |
   | **IPv4 address** | `TU_IP_ELASTICA` |
   | **Proxy status** | **DNS only** — la nube debe quedar **gris**, no naranja |
   | **TTL** | `Auto` |

4. **Save**.

> **¿Por qué un registro `A`?** El DNS traduce nombres a direcciones. Un registro **A** dice "este
> nombre es esta IPv4", justo lo que necesitamos. Un **CNAME** apunta un nombre a *otro nombre*;
> sirve cuando el destino es un nombre (por ejemplo, un balanceador de AWS), no una IP.

> **¿Por qué la nube gris (DNS only) y no naranja (Proxied)?** Con la nube naranja, las visitas
> pasarían primero por los servidores de Cloudflare y luego llegarían a tu EC2. Eso cambiaría tres
> cosas que esta guía da por hechas: certbot no podría validar el dominio como explica la parte 13,
> nginx y la API verían la IP de Cloudflare en vez de la del visitante, y el HTTPS lo gestionaría
> Cloudflare con sus propios ajustes. Con la nube gris, Cloudflare solo responde "este nombre es
> esta IP" y el navegador habla directamente con tu servidor. El proxy de Cloudflare es un buen tema
> para una práctica posterior.

> **¿Por qué TTL Auto?** El TTL es cuánto tiempo pueden recordar otros servidores la respuesta. En
> modo *DNS only*, `Auto` en Cloudflare son 5 minutos: si cambias la IP, el cambio llega rápido.

**Comprueba** desde la terminal de tu Mac (con Cloudflare suele tardar menos de un minuto):

```bash
dig +short timesheet.mateocabrera.space @1.1.1.1
```

Debe imprimir `TU_IP_ELASTICA`. Si imprime otras IPs (las de Cloudflare, que suelen empezar por
`104.` o `172.`), la nube está en naranja: edita el registro y ponla en gris. `@1.1.1.1` pregunta
directamente al DNS de Cloudflare, sin la caché de tu proveedor de internet. Mientras no responda
bien, sigue con las partes 4 a 11, que no dependen del dominio.

---

## Parte 4 — Conectarte al servidor

**Qué es:** una terminal remota y cifrada dentro del servidor. Lo que escribas se ejecuta allí, no
en tu Mac. Tienes dos formas de abrirla; elige una.

### Opción A — Desde el navegador (EC2 Instance Connect) — recomendada para empezar

1. En la web de AWS: **EC2 → Instances** → marca la casilla de `timesheet-server`.
2. Botón **Connect** (arriba).
3. Pestaña **EC2 Instance Connect** → deja **Connect using a Public IP** y el usuario `ubuntu`
   → botón **Connect**.
4. Se abre una pestaña nueva con una terminal dentro del servidor.

Para pegar comandos usa `Cmd + V` (o click derecho → pegar).

> **¿Por qué recomendar el navegador para empezar?** No necesitas el archivo `.pem` ni configurar
> nada en tu Mac: AWS envía una clave temporal al servidor cada vez que te conectas. Si tu IP de
> casa cambia, sigue funcionando. La opción B es la habitual en el trabajo diario y conviene
> aprenderla, pero no es imprescindible el primer día.

### Opción B — Desde la terminal de tu Mac (ssh)

```bash
chmod 400 ~/.ssh/timesheet-key.pem
ssh -i ~/.ssh/timesheet-key.pem ubuntu@TU_IP_ELASTICA
```

- `chmod 400` deja la clave legible solo por ti; SSH se niega a usar claves con permisos abiertos.
- `ubuntu` es el usuario que traen las instancias de Ubuntu en AWS.
- La primera vez te pregunta `Are you sure you want to continue connecting?` → escribe `yes`.

**Comprueba (cualquiera de las dos):** el prompt cambia a algo como `ubuntu@ip-172-31-...:~$`.
**Desde aquí, todos los comandos hasta la parte 13 se ejecutan en el servidor**, no en tu Mac.

> Si la opción A falla: revisa que existe la regla SSH con la lista `ec2-instance-connect`
> (parte 1.5) y que la instancia está en **Running** con **2/2 checks passed**.
> Si la opción B no conecta: la regla SSH tiene **My IP**; si tu IP de casa cambió (pasa a
> menudo), edita esa regla y vuelve a elegir **My IP**.

---

## Parte 5 — Preparar el sistema

**5.1 Actualizar los paquetes** (como "buscar actualizaciones" en tu Mac):

```bash
sudo apt update && sudo apt upgrade -y
```

`sudo` ejecuta como administrador; `apt` es el gestor de paquetes de Ubuntu (como Homebrew).
Si al final pide reiniciar, ejecuta `sudo reboot`, espera un minuto y vuelve a conectarte como en
la parte 4.

> **¿Por qué actualizar lo primero?** La imagen de Ubuntu se publicó hace semanas o meses; desde
> entonces han salido parches de seguridad. Un servidor expuesto a internet debe tenerlos antes de
> instalar nada más.

**5.2 Añadir memoria de intercambio (swap) de 2 GB.** Es espacio en disco que el sistema usa como
RAM de emergencia.

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

La última línea hace que el swap siga activo tras reiniciar.
**Comprueba:** `free -h` muestra una fila `Swap:` con `2.0Gi`.

> **¿Por qué swap si ya tenemos 2 GB de RAM?** Durante `next build` la memoria puede tocar techo un
> momento, y el sistema mata el proceso (`Killed`). El swap es mucho más lento que la RAM, pero
> solo se usa en esos picos y evita el fallo. 2 GB (igual que la RAM) es la regla habitual para
> servidores pequeños.

**5.3 Firewall del propio servidor (ufw):**

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

**Importante:** permite el 22 **antes** de activar el firewall, o te quedarías fuera de tu propia
conexión.
**Comprueba:** `sudo ufw status` muestra `Status: active` y las reglas 22, 80 y 443.

> **¿Por qué otro firewall si ya está el security group?** El security group es el firewall de AWS,
> **por fuera** de la máquina; `ufw` es el de Ubuntu, **por dentro**. Si un día alguien abre por
> error un puerto en el security group (por ejemplo el 3000), `ufw` lo sigue bloqueando. Es la
> **defensa en profundidad**: varias capas, por si una falla.

---

## Parte 6 — Instalar Node.js 22, pnpm y git

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git
sudo corepack enable
```

**Comprueba:**

```bash
node -v     # v22.x.x
which node  # /usr/bin/node   ← es la ruta que usan los archivos .service
git --version
```

> **¿Por qué Node 22?** Es la versión que pide el proyecto (archivo `.nvmrc`) y la que usas en
> local. Usar la misma versión en local y en el servidor evita errores del tipo "en mi máquina
> funciona".

> **¿Por qué NodeSource y no el Node de Ubuntu ni `nvm`?** El `nodejs` que trae Ubuntu con `apt` es
> una versión antigua. `nvm` es cómodo en tu Mac, pero instala Node dentro de la carpeta personal
> de un usuario, y los servicios de systemd necesitan una ruta fija para todos: `/usr/bin/node`.
> NodeSource es el repositorio oficial de paquetes de Node para Ubuntu: da la versión que pedimos,
> en `/usr/bin/node`, y se actualiza con `apt` como el resto del sistema.

> **¿Por qué corepack y no `npm install -g pnpm`?** El `package.json` del proyecto fija la versión
> exacta de pnpm (`packageManager`). Corepack viene con Node y usa justo esa versión, la misma que
> en tu Mac. Con `npm install -g` instalarías la última, que podría comportarse distinto.

---

## Parte 7 — Instalar PostgreSQL y crear la base de datos

```bash
sudo apt install -y postgresql
```

Ubuntu 24.04 instala PostgreSQL 16 y lo deja arrancado y configurado para iniciarse con el
servidor (eso lo hace systemd, como hará con tu app).

Crea un usuario y una base de datos para la app. `postgres` es el administrador de PostgreSQL;
`sudo -u postgres` ejecuta el comando como él:

```bash
sudo -u postgres psql -c "CREATE USER timesheet WITH PASSWORD 'CONTRASEÑA_BD';"
sudo -u postgres psql -c "CREATE DATABASE timesheet OWNER timesheet;"
```

**Comprueba** que puedes entrar con ese usuario:

```bash
psql "postgres://timesheet:CONTRASEÑA_BD@localhost:5432/timesheet" -c "select 1;"
```

Debe imprimir una tabla con un `1`.

> **¿Por qué PostgreSQL en la misma máquina y no Amazon RDS?** RDS es PostgreSQL gestionado por AWS
> (copias de seguridad, parches y alta disponibilidad automáticos), y es lo que usarías en una
> empresa. Pero cuesta bastante más que el servidor entero y te ahorra justo lo que aquí quieres
> aprender: instalar y configurar una base de datos. Pasar a RDS es un buen siguiente paso:
> solo cambiaría `DATABASE_URL`.

> **¿Por qué un usuario `timesheet` y no usar `postgres` directamente?** `postgres` es el
> superusuario: puede hacer cualquier cosa en cualquier base de datos. La app solo necesita su
> propia base de datos. Si alguien encontrara un fallo en la app, con el usuario `timesheet` solo
> podría tocar esa base de datos (**principio de mínimo privilegio**).

> **¿Está expuesta la base de datos?** No: PostgreSQL solo escucha dentro de la máquina
> (`localhost`) por defecto, y además el puerto 5432 está cerrado en el security group y en `ufw`.

---

## Parte 8 — Crear el usuario de la app y descargar el código

**8.1 Un usuario sin privilegios para la app:**

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin timesheet
```

- `--system`: usuario de servicio, no de persona.
- `--shell /usr/sbin/nologin`: nadie puede iniciar sesión con él.
- `--create-home`: le da una carpeta personal, donde pnpm guarda su caché.

> **¿Por qué un usuario propio y no `ubuntu` o `root`?** La app no debe correr como administrador.
> Si alguien encontrara un fallo en la API, solo tendría los permisos de `timesheet`: no podría
> instalar programas, leer archivos de otros usuarios ni tomar el control de la máquina. Es el
> mismo principio de mínimo privilegio que con la base de datos.

**8.2 Descargar el código en `/opt` y dárselo a ese usuario:**

```bash
sudo git clone https://github.com/MATREYcr/timesheet-tracker.git /opt/timesheet-tracker
sudo chown -R timesheet:timesheet /opt/timesheet-tracker
```

A partir de aquí, los comandos de la app se ejecutan **como el usuario `timesheet`** con
`sudo -u timesheet -H ...`, para que todos los archivos le pertenezcan (`-H` hace que use su
propia carpeta personal para cachés).

**Comprueba:** `ls -la /opt/timesheet-tracker` muestra los archivos del repo con dueño
`timesheet`.

> **¿Por qué `git clone` y no copiar los archivos desde tu Mac?** Con git, actualizar la app es un
> `git pull` (ver "Actualizar la app" al final) y en el servidor hay exactamente lo que está en
> GitHub. Copiar a mano (por ejemplo con `scp`) es fácil de hacer mal: archivos olvidados o
> versiones mezcladas. Como el repo es público, basta con la URL HTTPS, sin claves de GitHub.

> **¿Por qué `/opt`?** Es la carpeta que Linux reserva por convención para aplicaciones instaladas
> a mano, fuera de las carpetas personales y de las del sistema.

---

## Parte 9 — Configurar las variables de entorno

Son la configuración de producción: tu dominio, la base de datos y el secreto de las sesiones.

**9.1 Genera el secreto de sesiones** y cópialo (lo pegarás enseguida):

```bash
openssl rand -base64 32
```

> **¿Por qué generarlo así?** El secreto firma las cookies de sesión: quien lo conozca podría
> fabricar sesiones falsas. `openssl rand` genera 32 bytes aleatorios de verdad, imposibles de
> adivinar. Nunca uses el secreto de ejemplo del repo en producción.

**9.2 Crea el `.env` de la API** con el editor `nano`:

```bash
sudo -u timesheet nano /opt/timesheet-tracker/apps/api/.env
```

Pega esto, sustituyendo los valores:

```dotenv
DATABASE_URL=postgres://timesheet:CONTRASEÑA_BD@localhost:5432/timesheet
PORT=3333
CORS_ORIGIN=https://timesheet.mateocabrera.space
BETTER_AUTH_SECRET=EL_SECRETO_DEL_PASO_9.1
BETTER_AUTH_URL=https://timesheet.mateocabrera.space/backend
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
NEXT_PUBLIC_API_URL=https://timesheet.mateocabrera.space/backend
```

> **Esta URL se copia dentro del código al compilar** (parte 10). Si algún día la cambias, tienes
> que volver a compilar la web.

**9.4 Protege los archivos** (contienen contraseñas): solo su dueño puede leerlos.

```bash
sudo chmod 600 /opt/timesheet-tracker/apps/api/.env /opt/timesheet-tracker/apps/web/.env.local
```

**Comprueba:** `sudo -u timesheet cat /opt/timesheet-tracker/apps/api/.env` muestra tus valores,
sin espacios alrededor del `=` ni comillas de más.

> **¿Por qué archivos `.env` y no AWS Secrets Manager?** Secrets Manager guarda secretos cifrados
> y controla quién los lee; es lo correcto en una empresa, pero añade permisos de IAM y código para
> leerlos. Para un solo servidor, un `.env` con permisos `600` (solo lo lee su dueño) es seguro y
> sencillo, y es como funciona la app en local.

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

> **¿Por qué compilar en el servidor y no en tu Mac?** Algunas dependencias incluyen código nativo
> compilado para cada sistema operativo: lo instalado en macOS no sirve en Linux. Compilando en el
> servidor, todo se genera para el sistema donde se va a ejecutar. (Con Docker se resuelve
> compilando dentro de la imagen; será la siguiente práctica.)

```bash
sudo -u timesheet -H pnpm db:migrate
```

Crea las tablas en tu base de datos. **Comprueba:** `migrations applied successfully!`

> **¿Por qué migraciones y no crear las tablas a mano?** Las migraciones son archivos del repo que
> describen cada cambio de la base de datos, en orden. El mismo comando deja tu base de datos local
> y la del servidor exactamente iguales, y en cada actualización aplica solo lo nuevo.

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
en `deploy/ec2/` (ábrelos: son cortos y se leen casi como una lista de instrucciones).

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
- La API responde `{"status":"ok"}` en `/backend/health`: ya monta sus rutas bajo `/backend`.
- La web responde `200`.

**Ver los logs** (lo primero que mirar si algo falla; `Ctrl + C` para salir):

```bash
journalctl -u timesheet-api -f
journalctl -u timesheet-web -f
```

> **¿Por qué systemd y no PM2?** PM2 es un gestor de procesos para Node muy popular, pero es otra
> herramienta que instalar y mantener. systemd ya viene en Ubuntu, es el que arranca todo el
> sistema (incluidos PostgreSQL y nginx) y te da logs (`journalctl`), reinicio automático y
> arranque al encender sin instalar nada. Lo que aprendas aquí sirve para cualquier programa, no
> solo Node.

> **¿Por qué la API escucha solo en `127.0.0.1` y la web no?** El `.service` de la API pone
> `HOST=127.0.0.1`: solo se puede llegar a ella desde la propia máquina, es decir, a través de
> nginx. La web no se puede limitar así: con `--hostname 127.0.0.1`, Next.js convierte la
> redirección interna de idioma en una petición externa y `/login` entra en un bucle (lo
> descubrimos al ensayar en local). Su puerto 3000 queda protegido por el security group y `ufw`.

---

## Parte 12 — nginx: la puerta de entrada

**Qué es:** el proxy inverso. Recibe todo lo que llega de internet por el 80 y el 443 y lo reparte:
`/backend/...` a la API y el resto a la web. Además gestionará el HTTPS.

```bash
sudo apt install -y nginx
sudo cp /opt/timesheet-tracker/deploy/ec2/nginx.conf /etc/nginx/sites-available/timesheet
sudo sed -i 's/example.com/timesheet.mateocabrera.space/' /etc/nginx/sites-available/timesheet
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

**Comprueba** desde el navegador de tu Mac: `http://timesheet.mateocabrera.space` muestra la
pantalla de login.

> Todavía **no inicies sesión**: sin HTTPS el navegador no guarda la cookie de sesión y el login
> parece no hacer nada. Es lo esperado hasta la parte 13.

> **¿Por qué nginx y no Caddy o Apache?** nginx es el proxy inverso más usado del mundo: es lo que
> encontrarás en la mayoría de empresas y tutoriales, y certbot sabe configurarlo solo. **Caddy**
> es más sencillo (pide el certificado HTTPS automáticamente), pero es menos común y te ahorraría
> aprender cómo funciona HTTPS. **Apache** es más antiguo y más pesado para este uso.

> **¿Por qué no exponer directamente la web y la API sin nginx?** Necesitaríamos dos puertos
> públicos, cada app tendría que gestionar su propio certificado HTTPS, y no tendríamos un único
> sitio donde poner las cabeceras de seguridad (como la IP real del visitante, que nginx fija para
> que nadie pueda falsearla).

---

## Parte 13 — HTTPS con Let's Encrypt (certbot)

**Qué es:** un certificado demuestra que tu servidor es de verdad `timesheet.mateocabrera.space` y
permite cifrar la conexión. Let's Encrypt los da gratis, y **certbot** los pide y los configura en
nginx.

Requisitos: `dig +short timesheet.mateocabrera.space @1.1.1.1` ya devuelve tu IP (parte 3), con la
nube **gris** en Cloudflare, y el puerto 80 está abierto.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d timesheet.mateocabrera.space --redirect
```

- Te pide un correo (para avisos de caducidad) y que aceptes los términos.
- `--nginx` edita tu configuración de nginx para usar el certificado en el 443.
- `--redirect` hace que `http://` redirija a `https://`.

**Comprueba:**

- `https://timesheet.mateocabrera.space` muestra el candado en el navegador.
- La renovación automática está programada (los certificados duran 90 días):

  ```bash
  systemctl list-timers | grep certbot
  sudo certbot renew --dry-run
  ```

> **¿Por qué Let's Encrypt y no AWS Certificate Manager (ACM)?** ACM da certificados gratis, pero
> **solo se pueden usar en servicios de AWS como el balanceador de carga o CloudFront**, no
> instalarlos en tu propio servidor. Como aquí no hay balanceador (costaría bastante más que la
> instancia), el certificado tiene que vivir en nginx, y Let's Encrypt es la opción gratuita y
> automática estándar para eso.

> **¿Por qué dejar que certbot edite nginx (`--nginx`)?** Añade el bloque del puerto 443 con la
> configuración TLS recomendada y la redirección de HTTP a HTTPS, y deja la renovación automática
> programada. Hacerlo a mano es fácil de hacer mal (versiones de TLS antiguas, olvidar renovar).

---

## Parte 14 — Verificar que todo funciona

**14.1 En el navegador:** entra en `https://timesheet.mateocabrera.space`, inicia sesión con la
cuenta demo (si ejecutaste el seed) o crea una cuenta, y recorre Empleados, Horas y Resumen
semanal.

**14.2 Prueba automática del flujo completo**, desde la terminal **de tu Mac** (no del servidor),
en la carpeta del repo:

```bash
BASE_URL=https://timesheet.mateocabrera.space API_URL=https://timesheet.mateocabrera.space/backend pnpm verify:auth
```

Debe terminar con `All 31 steps passed.`

> **¿Por qué desde tu Mac?** Así la prueba entra como un visitante real: por internet, con HTTPS y
> pasando por DNS, el security group y nginx. Desde el propio servidor te saltarías justo las capas
> que más fallan.

**14.3 Comprobaciones rápidas:**

```bash
curl -s https://timesheet.mateocabrera.space/backend/health     # {"status":"ok"}
curl -s https://timesheet.mateocabrera.space/backend/employees  # 401 sin sesión: correcto
curl -s -m 5 http://TU_IP_ELASTICA:3333/backend/health         # no debe responder: la API no es pública
```

Y la documentación de la API en `https://timesheet.mateocabrera.space/backend/docs`.

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

> **¿Por qué en este orden?** Primero el código nuevo, luego sus dependencias, luego compilar con
> ellas, luego adaptar la base de datos al código nuevo y, por último, reiniciar para que los
> servicios usen lo compilado. Reiniciar antes de compilar dejaría corriendo la versión vieja (o
> una a medias).

---

## Si algo falla

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| `ssh` se queda colgado o da *timeout* | Tu IP cambió y la regla SSH solo permite la antigua | Security group → editar la regla SSH → **My IP** |
| EC2 Instance Connect: *Failed to connect to your instance* | Falta la regla SSH con la lista `ec2-instance-connect`, o la instancia aún arranca | Revisa el security group (parte 1.5) y espera a **2/2 checks passed** |
| No puedes elegir región: todas con candado y pone **Global** | Estás en un servicio global (Billing, IAM…) | Entra en **EC2** y elige la región allí |
| `next build` termina con `Killed` | Sin memoria | Comprueba el swap (parte 5.2) con `free -h` |
| **502 Bad Gateway** en el navegador | La web o la API no están corriendo | `systemctl status timesheet-api timesheet-web` y `journalctl -u timesheet-api -n 50` |
| La API no arranca: `Invalid environment variables` | Falta o está mal una variable en `apps/api/.env` | El log dice cuál; revisa la parte 9.2 |
| Inicias sesión y vuelves al login | Estás en `http://`, o `CORS_ORIGIN` / `BETTER_AUTH_URL` no coinciden con tu dominio | Usa `https://`; revisa la parte 9.2 |
| El registro o login da **404** | `BETTER_AUTH_URL` sin `/backend`, o la web compilada con otra `NEXT_PUBLIC_API_URL` | Corrige los `.env`, recompila (`pnpm build`) y reinicia los servicios |
| `/login` entra en un bucle de redirecciones | Alguien añadió `--hostname` al `.service` de la web | Quítalo (ver el comentario del archivo), `daemon-reload` y `restart` |
| certbot falla en la validación | El DNS no apunta a tu IP, la nube de Cloudflare está en naranja, o el puerto 80 está cerrado | `dig +short timesheet.mateocabrera.space @1.1.1.1`; pon la nube en gris; revisa el security group y `sudo ufw status` |
| La consola de AWS "no muestra" tu servidor | Estás en otra región | Cambia la región arriba a la derecha a **us-east-1** |

---

## Apagar y borrar todo (para no gastar)

**Entre sesiones de práctica:** EC2 → **Instances** → `timesheet-server` → **Instance state → Stop**.
Al volver, **Start**. La IP elástica se mantiene, así que el DNS sigue funcionando.

> **¿Por qué *Stop* entre sesiones?** Una instancia parada no cobra la máquina, solo el disco y la
> IP, que son mucho más baratos. Tus créditos duran bastante más.

**Cuando termines la práctica del todo**, en la consola de EC2:

1. **Instances** → selecciona `timesheet-server` → **Instance state → Terminate instance**.
   *Terminate* **borra** la máquina y su disco para siempre.
2. **Elastic IPs** → selecciona tu IP → **Actions → Release Elastic IP addresses**.
3. **Security Groups** → borra `timesheet-sg` (cuando la instancia ya esté terminada).
4. En Cloudflare → **mateocabrera.space** → **DNS → Records**, borra el registro `timesheet`.

> **¿Por qué borrar también el registro DNS?** Al liberar la IP, AWS puede dársela a otra persona.
> Si tu registro siguiera apuntando a ella, `timesheet.mateocabrera.space` mostraría el servidor de
> un desconocido (esto tiene nombre: *subdomain takeover*).

Revisa **Billing and Cost Management** unos días después para confirmar que el gasto se detuvo.
