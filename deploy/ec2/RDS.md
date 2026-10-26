# Mover la base de datos a Amazon RDS

Continuación de la [guía de EC2](README.md). Al terminarla, tu app sigue en el mismo servidor, pero
la base de datos ya no vive dentro de él: la gestiona AWS.

**Antes de empezar:** la app funciona en `https://timesheet.mateocabrera.space` (partes 0–14 de la
guía) y puedes conectarte al servidor (parte 4).

**Tiempo:** unos 45 minutos, de los que unos 10 son esperar a que AWS cree la base de datos.

---

## Qué vas a montar

Ahora mismo, todo está en una sola máquina:

```
EC2 ─┬─ nginx
     ├─ web
     ├─ API ──► PostgreSQL (en la misma máquina, localhost:5432)
```

Al terminar:

```
EC2 ─┬─ nginx                                   RDS (otra máquina, gestionada por AWS)
     ├─ web                                     └─ PostgreSQL
     └─ API ──────── red privada de AWS ───────►   (sin acceso desde internet)
```

**Qué es RDS:** *Relational Database Service*. Es PostgreSQL, el mismo que ya usas, pero AWS se
encarga de la máquina donde corre: copias de seguridad diarias, parches de seguridad, discos y
recuperación si el hardware falla. Tú solo te conectas a él con una dirección.

> **¿Por qué mover la base de datos si ya funciona?** Hoy, si tu servidor se rompe o lo borras por
> error, **pierdes todos los datos** con él: no hay copias. Además, servidor y base de datos
> compiten por los mismos 2 GB de RAM. Separarlos es lo que se hace en cualquier empresa: los
> servidores de la app se pueden tirar y volver a crear; los datos no.

> **Lo más importante que vas a aprender:** la app no cambia **ni una línea de código**. Solo cambia
> `DATABASE_URL` en el `.env`. Por eso la configuración va en variables de entorno y no dentro del
> código.

### Las piezas, en orden

| Paso | Qué haces | Dónde |
|---|---|---|
| 1 | Crear un security group para la base de datos | Consola web (clicks) |
| 2 | Crear la base de datos RDS | Consola web (clicks) |
| 3 | Crear el usuario y la base de datos de la app | Servidor (comandos) |
| 4 | Apuntar la API a RDS y preparar las tablas | Servidor (comandos) |
| 5 | Apagar el PostgreSQL local y comprobar | Servidor (comandos) |
| 6 | Coste y cómo apagar | Consola web (clicks) |

---

## Parte 1 — El firewall de la base de datos (security group)

### Qué vas a hacer y por qué

Recuerda la parte 1.5 de la guía de EC2: un **security group** es el **portero** de AWS. Decide
quién puede llamar a qué puerta (puerto) de una máquina. Tu servidor ya tiene el suyo,
`timesheet-sg`, que deja pasar las visitas web (80 y 443) y tu SSH (22).

La base de datos RDS será **otra máquina**, así que necesita **su propio portero**. Y su regla será
la más estricta de todas:

```
Internet ──────────────────────────► RDS        ✗ bloqueado
Tu Mac ────────────────────────────► RDS        ✗ bloqueado
Tu servidor (lleva timesheet-sg) ──► RDS :5432  ✓ permitido
```

**Solo tu servidor puede hablar con la base de datos.** Es el único que la necesita: la API vive
ahí. Ni los visitantes de la web ni tú desde tu Mac tienen por qué llegar a ella.

**¿Por qué se crea primero?** Al crear la base de datos (parte 2), AWS te pedirá que elijas su
portero. Si ya existe, solo tienes que seleccionarlo de una lista.

### Los clicks

1. En la web de AWS, busca **EC2** en la barra de arriba. En el menú de la izquierda, baja hasta
   **Network & Security → Security Groups** → botón **Create security group** (arriba a la
   derecha).

   > **¿Por qué en EC2 si es para RDS?** Los security groups son de la **red** de AWS, no de un
   > servicio concreto. Se gestionan todos desde la pantalla de EC2, aunque los use RDS.

2. **Basic details** (los datos básicos):

   | Campo | Qué escribes | Qué es |
   |---|---|---|
   | **Security group name** | `timesheet-db-sg` | El nombre, para reconocerlo luego en las listas. `db` = base de datos, `sg` = security group |
   | **Description** | `PostgreSQL solo desde timesheet-sg` | Una nota para ti (o para quien venga después) de para qué sirve. Es obligatoria |
   | **VPC** | Deja la que viene | La **red privada** donde vive. Tiene que ser la misma que la de tu servidor; si no, no podrían verse. La que viene por defecto es la misma que eligió tu servidor |

   > **¿Qué es una VPC?** *Virtual Private Cloud*: tu red privada dentro de AWS, como la red wifi
   > de tu casa. Las máquinas de la misma VPC pueden hablar entre ellas por direcciones privadas,
   > sin pasar por internet. AWS crea una por defecto en cada región, y ahí está tu servidor.

3. **Inbound rules** (reglas de entrada: **quién puede entrar**) → botón **Add rule**. Aparece una
   fila con varios campos:

   | Campo | Qué eliges | Qué es |
   |---|---|---|
   | **Type** | `PostgreSQL` | El tipo de servicio. Al elegirlo, AWS rellena solo **Protocol** `TCP` y **Port range** `5432`, la puerta por la que habla PostgreSQL |
   | **Source** | `Custom`, y en la caja de al lado escribe el principio del ID (`sg-`) o del nombre, y **elige de la lista desplegable** el security group de tu servidor (aparece como `sg-0abc… \| su-nombre`) | **Quién** puede llamar a esa puerta: las máquinas que lleven puesto el portero de tu servidor |

   **¿Cuál es el security group de tu servidor?** En otra pestaña: **EC2 → Instances** → marca tu
   servidor → pestaña **Security** → **Security groups**. Verás su ID (`sg-…`) y su nombre. Puede
   llamarse `timesheet-sg` si le pusiste ese nombre en la parte 1.5 de la guía de EC2, o tener uno
   automático como `launch-wizard-1`. En esta guía lo llamamos `timesheet-sg`.

   > **Si sale en rojo `CIDR block, a security group ID or a prefix list has to be specified`**,
   > escribiste un texto pero no elegiste ninguna opción de la lista. Borra lo escrito con la `X`,
   > vuelve a escribir y **haz click en la opción** `sg-… | nombre`. No pulses Enter.
   | **Description** | `API en EC2` | Nota de para qué es la regla (opcional) |

   > **¿Por qué el origen es otro security group y no una IP?** Es como decir *"deja pasar a
   > cualquiera con la tarjeta de empleado de `timesheet-sg`"* en lugar de *"deja pasar a la
   > persona de esta foto"*. Si mañana creas un servidor nuevo, o añades un segundo, le pones
   > `timesheet-sg` y ya tiene acceso, sin tocar esta regla. Con una IP tendrías que editarla cada
   > vez, porque la IP privada de un servidor cambia si lo vuelves a crear.

   > **¿Por qué no añadir también tu IP, para conectarte desde tu Mac?** La base de datos es lo que
   > un atacante quiere alcanzar, así que cuantos menos caminos, mejor. Cuando necesites entrar,
   > lo harás **desde el servidor**, que ya tiene acceso (parte 3).

4. **Outbound rules** (reglas de salida: **a dónde puede llamar** la base de datos): déjalas como
   están.

   > **¿Por qué no tocarlas?** Por defecto permiten que la máquina salga a cualquier sitio. Una base
   > de datos no inicia conexiones, solo responde a las que le llegan. Y las respuestas siempre
   > pueden salir: el security group recuerda quién llamó y deja volver la respuesta, aunque no
   > haya regla de salida para ella.

5. **Tags:** nada. Botón **Create security group** (abajo a la derecha).

**Comprueba:** en la lista de **Security Groups** aparece `timesheet-db-sg`. Selecciónalo → pestaña
**Inbound rules**: una sola regla, `PostgreSQL`, `TCP`, `5432`, con el origen `sg-0abc…` de
`timesheet-sg`.

Por ahora este portero **no está vigilando nada**: es un portero contratado, sin puerta asignada.
En la parte 2 lo pondrás en la puerta de la base de datos.

---

## Parte 2 — Crear la base de datos (RDS)

### Qué vas a hacer y por qué

Vas a pedirle a AWS que te monte **una máquina con PostgreSQL ya instalado**. Es como la parte 1
de la guía de EC2 (crear el servidor), pero AWS se encarga de todo lo de dentro: instalar
PostgreSQL, actualizarlo, hacer copias. Tú solo eliges **el tamaño, la red y las protecciones**.

Unas palabras que verás en el formulario:

| Palabra | Qué significa |
|---|---|
| **Engine** (motor) | El programa de base de datos: PostgreSQL, MySQL… Tú usas PostgreSQL |
| **DB instance** (instancia) | La máquina donde corre la base de datos. Igual que una instancia EC2, pero gestionada por AWS |
| **Master user** (usuario maestro) | El administrador de PostgreSQL, como el `postgres` de la parte 7 de la guía de EC2 |
| **AZ** (*Availability Zone*) | Un centro de datos de AWS. Una región (N. Virginia) tiene varios, separados entre sí |
| **Endpoint** | La dirección para conectarse a la base de datos, como tu dominio lo es para la web |

El formulario es largo, pero **la mayoría de opciones se quedan como vienen**. Abajo tienes, sección
por sección, qué cambiar y por qué.

> La consola de AWS cambia de vez en cuando: si un nombre no coincide exactamente, busca el más
> parecido. Lo que importa es el valor que eliges y por qué.

### Llegar al formulario

1. Arriba a la derecha, comprueba que la región es **N. Virginia (us-east-1)**, la misma que tu
   servidor. Si no, la base de datos estaría en otra parte del mundo y tu servidor no podría verla.
2. Busca **RDS** en la barra de arriba → menú izquierdo **Databases** → botón
   **Create database**.

### 2.1 Choose a database creation method (cómo quieres crearla)

Elige `Full configuration` (en versiones anteriores de la consola, `Standard create`). Por
defecto suele venir marcada la otra opción: haz click en `Full configuration`.

> **¿Por qué no *Easy create*?** Elige por ti valores razonables, pero te los esconde. Aquí quieres
> ver cada opción y saber qué hace.

### 2.2 Engine options (qué base de datos)

| Campo | Qué eliges | Por qué |
|---|---|---|
| **Engine type** | `PostgreSQL` | Es la que usa tu app. Cambiar a otra (MySQL) obligaría a cambiar código |
| **Engine version** | La que viene marcada | La versión más reciente recomendada por AWS |

> **¿Por qué PostgreSQL y no Aurora (PostgreSQL Compatible)?** Aurora es un PostgreSQL rediseñado
> por AWS: más rápido y resistente, pero bastante más caro y sin opción gratuita. Para una app
> pequeña no lo necesitas, y PostgreSQL normal es exactamente el mismo motor que ya conoces.

> **¿Importa que la versión sea más nueva que la 16 de tu servidor?** No. La app y Drizzle funcionan
> igual, y una versión reciente tiene más años de soporte antes de tener que actualizar.

### 2.3 Templates (plantillas)

Elige `Free tier` (si no aparece, `Dev/Test`).

> **¿Qué es una plantilla?** Un conjunto de valores ya rellenados para el resto del formulario.
> *Free tier* deja marcadas las opciones baratas e **impide elegir por error las caras**.
> *Production* activaría máquinas grandes y copias en otro centro de datos: en una cuenta de
> prácticas podría costar decenas de dólares al mes.

### 2.4 Availability and durability (cuántas copias de la máquina)

Elige `Single-AZ DB instance deployment` (1 instancia).

> **¿Qué significa?** Tu base de datos vivirá en **un solo** centro de datos. La alternativa,
> *Multi-AZ*, mantiene **una copia exacta en otro centro de datos** que toma el relevo sola si el
> principal falla. Es lo que se usa en producción, pero **cuesta el doble**. Para practicar no lo
> necesitas: las copias de seguridad diarias (2.11) ya protegen tus datos.

### 2.5 Settings (nombre y administrador)

| Campo | Qué escribes | Qué es |
|---|---|---|
| **DB instance identifier** | `timesheet-db` | El nombre de **la máquina** en la consola de AWS. No es el nombre de la base de datos de la app (esa la creas en la parte 3) |
| **Master username** | `postgres` | El nombre del administrador de PostgreSQL |
| **Credentials management** | `Self managed` | Quién guarda la contraseña del administrador: tú |
| **Master password** y **Confirm password** | Una contraseña generada (abajo) | La contraseña del administrador |

**Para generar la contraseña**, en el servidor o en la terminal de tu Mac:

```bash
openssl rand -hex 16
```

Da 32 letras y números al azar, del tipo `9f2c4e…`. Pégala en los dos campos y **guárdala en tu
gestor de contraseñas**: AWS no te la vuelve a enseñar.

> **¿Por qué una contraseña generada así?** Es imposible de adivinar, y `-hex` solo usa `0-9` y
> `a-f`. Así no tiene símbolos como `@`, `/` o `#`, que romperían la dirección de conexión
> (`postgres://usuario:contraseña@servidor…`), porque en ella tienen un significado especial.

> **¿Por qué *Self managed* y no *Managed in AWS Secrets Manager*?** Secrets Manager guarda la
> contraseña y **la cambia sola** cada cierto tiempo. Es la buena práctica en empresas, pero tu app
> lee la contraseña de un `.env` y no se enteraría del cambio: un día dejaría de conectarse.
> Además cuesta unos 0,40 USD al mes. Es un buen tema para más adelante.

> **¿Para qué un administrador si la app usará otro usuario?** El administrador solo lo usarás una
> vez, en la parte 3, para crear el usuario de la app. Es como la llave maestra de un edificio: no
> se la das a cada inquilino.

### 2.6 Instance configuration (el tamaño de la máquina)

Elige `Burstable classes` → `db.t4g.micro`.

> **¿Cómo se lee `db.t4g.micro`?** `db` = máquina de base de datos; `t` = familia *burstable*;
> `4` = generación; `g` = procesador Graviton (Arm), igual que tu servidor `t4g.small`; `micro` =
> el tamaño (2 vCPU y 1 GB de RAM).

> **¿Por qué esta?** Es la más pequeña y barata, y de sobra para esta app. *Burstable* significa
> que normalmente usa poca CPU y puede acelerar en momentos de carga: justo lo que hace una app
> pequeña. Graviton es más barato que el equivalente Intel (`db.t3.micro`).

### 2.7 Storage (el disco)

| Campo | Qué eliges | Qué es |
|---|---|---|
| **Storage type** | `General Purpose SSD (gp3)` | El tipo de disco. gp3 es el SSD normal, el más equilibrado en precio |
| **Allocated storage** | `20` GiB | El tamaño del disco |
| **Enable storage autoscaling** (en *Additional storage configuration*) | **Desmárcalo** | Que el disco crezca solo si se llena |

> **¿Por qué 20 GB y sin autoscaling?** 20 GB es el mínimo, y tu base de datos ocupa unos pocos MB.
> El crecimiento automático es útil en producción, pero aquí prefieres que el coste sea fijo y
> predecible. Además, un disco de RDS **solo puede crecer, nunca encoger**.

### 2.8 Connectivity (la red: la sección más importante)

Aquí decides **dónde vive** la base de datos y **quién puede llegar** a ella.

| Campo | Qué eliges | Qué es |
|---|---|---|
| **Compute resource** | `Don't connect to an EC2 compute resource` | Si quieres que AWS conecte la base de datos a un servidor por ti. Lo haces tú (parte 1) |
| **Network type** (si aparece; si no, ya usa IPv4) | `IPv4` | El tipo de direcciones de red, el mismo que tu servidor |
| **Virtual private cloud (VPC)** | La *default* | La red privada. **Tiene que ser la misma que la de tu servidor** |
| **DB subnet group** | Deja lo que viene (`default` o *Automatic setup*) | En qué partes de la VPC puede vivir la base de datos. AWS lo resuelve solo |
| **Public access** | `No` | Si la base de datos tiene una dirección accesible desde internet |
| **VPC security group (firewall)** | `Choose existing` → quita `default` (con su `X`) y elige `timesheet-db-sg` | El portero que creaste en la parte 1 |
| **Availability Zone** | `No preference` | En qué centro de datos. Da igual |
| **RDS Proxy** | Sin marcar | Un intermediario para apps con miles de conexiones. No lo necesitas |
| **Certificate authority** | Deja la que viene | Quién firma el certificado para cifrar las conexiones (lo mismo que Let's Encrypt para tu web) |
| **Additional configuration → Database port** | `5432` | La puerta de PostgreSQL. La misma de la regla de la parte 1 |

> **¿Por qué *Public access: No*?** La base de datos solo tendrá una dirección **privada**, dentro de
> tu VPC. Desde internet **ni siquiera existe**, aunque alguien se equivocara con el security
> group: son dos protecciones a la vez. Tu servidor está en la misma red privada, así que llega sin
> problema.

> **¿Por qué quitar el security group `default`?** Si se queda, la base de datos tendría dos
> porteros, y `default` deja pasar a otras máquinas de tu cuenta. Con `timesheet-db-sg` solo,
> sabes exactamente quién puede entrar.

> **¿Por qué *Don't connect* y no *Connect to an EC2 compute resource*?** Esa opción crea dos
> security groups y la regla entre ellos automáticamente. Funciona, pero es justo lo que hiciste a
> mano en la parte 1, y así entiendes qué está pasando. En el futuro puedes usar el atajo.

### 2.9 Database authentication (cómo se identifica quien se conecta)

Elige `Password authentication`: usuario y contraseña, lo mismo que con tu PostgreSQL local.

### 2.10 Monitoring (gráficas y métricas)

| Campo | Qué eliges | Qué es |
|---|---|---|
| **Database Insights** (si aparece) | `Standard` | Gráficas de uso (CPU, memoria, conexiones) en la consola. Gratis |
| **Enable Enhanced monitoring** (en *Additional monitoring settings*) | **Desmárcalo** | Métricas cada pocos segundos, que se cobran aparte en CloudWatch |

> **¿Por qué?** Con *Standard* ya ves lo necesario para una app pequeña sin pagar más.

### 2.11 Additional configuration (plegada al final: ábrela)

| Campo | Qué eliges | Qué es |
|---|---|---|
| **Initial database name** | **Vacío** | AWS podría crear una base de datos al arrancar. La crearás tú en la parte 3, con su propio usuario |
| **DB parameter group** | Deja el que viene | La configuración interna de PostgreSQL (memoria, límites…). Los valores de AWS están bien |
| **Enable automated backups** | Marcado | Copias de seguridad automáticas |
| **Backup retention period** | Lo que permita la plantilla (1 a 7 días) | Cuántos días se guardan las copias |
| **Enable encryption** | Marcado (clave `aws/rds`) | Cifrar los datos en el disco |
| **Enable auto minor version upgrade** | Marcado | Instalar parches de seguridad automáticamente |
| **Enable deletion protection** | Sin marcar | Impedir que se pueda borrar |

> **¿Por qué copias automáticas?** Es la razón principal para usar RDS. Cada día AWS guarda una
> copia, y además registra cada cambio, así que puedes **volver la base de datos a cualquier
> minuto** de esos días (*point-in-time recovery*). Si a las 15:42 alguien borra todos los
> empleados, la restauras tal como estaba a las 15:41. El espacio es gratis hasta el tamaño de tu
> disco.

> **¿Por qué cifrado?** Los datos quedan cifrados en el disco de AWS y en las copias. No cuesta
> nada, no vas a notar diferencia de velocidad, y **solo se puede activar al crear la base de
> datos**: después ya no.

> **¿Por qué parches automáticos?** Las versiones menores (por ejemplo 17.4 → 17.5) solo traen
> correcciones y parches de seguridad. AWS las aplica en la ventana de mantenimiento, con un
> reinicio de pocos minutos. Es justo el trabajo que quieres delegar.

> **¿Por qué sin *Deletion protection*?** En producción debería estar **siempre** marcada. Aquí la
> dejamos sin marcar para poder borrar todo fácilmente al terminar la práctica.

### 2.12 Crear y esperar

1. Revisa el cuadro **Estimated monthly costs** (coste estimado al mes) al final. Con estas opciones
   ronda los **15 USD al mes** si está encendida todo el mes, y lo cubren los créditos del plan
   gratuito (parte 6).
2. Botón **Create database**. Si aparece una ventana con *add-ons* sugeridos, ciérrala.
3. La base de datos aparece con estado **Creating**. Tarda **entre 5 y 15 minutos**: AWS está
   preparando la máquina, instalando PostgreSQL y haciendo la primera copia. Espera a que ponga
   **Available**.

### 2.13 Copiar la dirección (endpoint)

Haz click en `timesheet-db` → pestaña **Connectivity & security** → **Endpoint**. Es algo como:

```
timesheet-db.c1a2b3c4d5e6.us-east-1.rds.amazonaws.com
```

Cópiala: es la dirección de tu base de datos. En el resto de la guía la llamaremos
`TU_ENDPOINT_RDS`.

> **¿Por qué un nombre y no una IP?** La IP de una base de datos RDS **cambia** cuando AWS la
> reinicia o la mueve a otro hardware, y el nombre siempre apunta a la IP actual. Es el mismo motivo
> por el que se usa un CNAME y no un registro A para los servicios de AWS.

**Comprueba** en esa misma pestaña: **Publicly accessible** = `No`, y en **VPC security groups**
solo aparece `timesheet-db-sg`.

---

## Parte 3 — Crear el usuario y la base de datos de la app

### Qué vas a hacer y por qué

RDS ya tiene PostgreSQL funcionando, pero **vacío**: solo existe el administrador `postgres`. Vas a
repetir lo que hiciste en la parte 7 de la guía de EC2 (crear el usuario `timesheet` y su base de
datos), pero esta vez en RDS.

Lo haces **desde tu servidor** porque es la única máquina que puede llegar a la base de datos
(parte 1). Conéctate a él como en la parte 4 de la guía de EC2. Desde aquí, **todos los comandos
van en el servidor**.

### 3.1 Comprueba que el servidor llega a la base de datos

```bash
nc -vz -w 5 TU_ENDPOINT_RDS 5432
```

`nc` (*netcat*) **llama a una puerta sin decir nada**, solo para ver si alguien contesta. `-z` =
solo comprobar, `-v` = contar el resultado, `-w 5` = esperar como mucho 5 segundos.

Debe decir `succeeded`. Si da *timed out*, el portero no te deja pasar: revisa que la regla de la
parte 1 tiene como origen `timesheet-sg` (el security group **del servidor**) y la parte 2.8.

### 3.2 Entra como administrador

```bash
psql "host=TU_ENDPOINT_RDS port=5432 user=postgres dbname=postgres sslmode=require"
```

- `psql` es la **terminal de PostgreSQL**: te deja escribir órdenes a la base de datos. Ya está
  instalado: vino con PostgreSQL en la parte 7 de la guía de EC2.
- `host` = dónde está, `user` = con qué usuario, `dbname=postgres` = la base de datos que trae
  PostgreSQL de serie, para entrar mientras aún no existe la tuya.
- `sslmode=require` = cifra la conexión. RDS **rechaza** las conexiones sin cifrar.

Te pide la contraseña del administrador (paso 2.5). Al escribirla **no se ve nada en pantalla**, es
normal: escríbela o pégala y pulsa Enter. Si avisa de que `psql` y el servidor tienen versiones
distintas, puedes ignorarlo.

Sabrás que estás dentro porque el prompt cambia a `postgres=>`. A partir de aquí ya no escribes
comandos de Linux, sino órdenes de **SQL**, el idioma de las bases de datos.

### 3.3 Crea el usuario y la base de datos de la app

Genera **otra** contraseña para el usuario de la app (`openssl rand -hex 16` en otra terminal) y
guárdala también. Después escribe estas órdenes **una a una**, pulsando Enter tras cada una:

```sql
CREATE USER timesheet WITH PASSWORD 'CONTRASEÑA_APP';
GRANT timesheet TO postgres;
CREATE DATABASE timesheet OWNER timesheet;
\q
```

| Orden | Qué hace | Respuesta esperada |
|---|---|---|
| `CREATE USER timesheet …` | Crea el usuario con el que se conectará la app | `CREATE ROLE` |
| `GRANT timesheet TO postgres;` | Permite al administrador **actuar como** `timesheet` (lo explicamos abajo) | `GRANT ROLE` |
| `CREATE DATABASE timesheet OWNER timesheet;` | Crea la base de datos de la app con `timesheet` como **dueño**, para que pueda crear sus tablas | `CREATE DATABASE` |
| `\q` | Sale de `psql` (*quit*) y vuelves a la terminal de Linux | El prompt vuelve a `ubuntu@…` |

- Las órdenes de SQL terminan en **`;`**. Si se te olvida, `psql` cree que no has terminado y espera
  más (el prompt cambia a `postgres->`). Escribe `;` y Enter.
- Las comillas de la contraseña son simples (`'`), no dobles.

> **¿Por qué el `GRANT`?** En RDS el administrador **no** es un superusuario completo: AWS se guarda
> algunos poderes para sí. Y PostgreSQL solo deja crear una base de datos para otro dueño si puedes
> actuar como ese dueño. Sin esta línea, la siguiente falla con `must be able to SET ROLE
> "timesheet"`. En tu PostgreSQL local no hizo falta porque allí `postgres` sí es superusuario.

> **¿Por qué un usuario para la app y no usar `postgres`?** Es el **principio de mínimo
> privilegio** de la parte 7 de la guía de EC2: si alguien encontrara un fallo en la app, solo
> podría tocar la base de datos `timesheet`, no administrar todo el servidor de base de datos.

### 3.4 Comprueba que el usuario de la app entra

```bash
psql "postgres://timesheet:CONTRASEÑA_APP@TU_ENDPOINT_RDS:5432/timesheet?sslmode=require" -c "select 1;"
```

Es otra forma de escribir lo mismo que en el 3.2, en formato dirección (**la misma que usará la app**
en la parte 4). `-c` ejecuta una sola orden y sale. Debe imprimir una tablita con un `1`.

---

## Parte 4 — Apuntar la API a RDS

### Qué vas a hacer y por qué

Tu API sabe dónde está la base de datos por **una sola línea** de su `.env`: `DATABASE_URL`. Ahora
apunta a `localhost` (el PostgreSQL del propio servidor). Vas a cambiarla para que apunte a RDS,
crear las tablas en la base de datos nueva (está vacía) y reiniciar la API para que lea el cambio.

```
Antes:  API ──► localhost:5432        (PostgreSQL del servidor)
Después: API ──► TU_ENDPOINT_RDS:5432 (RDS)
```

**Ni una línea de código cambia.** Solo la configuración.

### 4.1 Cambia la dirección de la base de datos

```bash
sudo -u timesheet nano /opt/timesheet-tracker/apps/api/.env
```

Cambia **solo** la línea `DATABASE_URL` (borra la antigua y escribe esta, con tus valores):

```dotenv
DATABASE_URL=postgres://timesheet:CONTRASEÑA_APP@TU_ENDPOINT_RDS:5432/timesheet?sslmode=require
```

Guarda con `Ctrl + O` y `Enter`, y sal con `Ctrl + X`. El resto del archivo no se toca.

Cómo se lee esa dirección:

```
postgres://  timesheet  :  CONTRASEÑA_APP  @  TU_ENDPOINT_RDS  :  5432  /  timesheet  ?sslmode=require
  tipo       usuario        contraseña        servidor            puerto    base de datos   opciones
```

> **¿Por qué `?sslmode=require` al final?** RDS solo acepta conexiones cifradas, y el programa que
> usa la app para hablar con PostgreSQL **no cifra** si no se lo pides. Sin esto, la API no arranca
> y en los logs verás `no pg_hba.conf entry … no encryption`.

> **¿Cifra pero no comprueba el certificado?** Exacto: `require` cifra la conexión, pero no verifica
> que el certificado sea de AWS. Como la conexión nunca sale de la red privada de AWS, el riesgo es
> muy bajo. El nivel máximo es `sslmode=verify-full`, que además exige instalar en el servidor el
> certificado raíz de RDS; queda como ejercicio para más adelante.

### 4.2 Crea las tablas y carga los datos de ejemplo

```bash
cd /opt/timesheet-tracker
sudo -u timesheet -H pnpm db:migrate
sudo -u timesheet -H pnpm db:seed
```

- `db:migrate` lee la `DATABASE_URL` nueva y **crea las tablas** en RDS (empleados, horas,
  usuarios…), igual que en la parte 10 de la guía de EC2. **Comprueba:**
  `migrations applied successfully!`
- `db:seed` carga los empleados de ejemplo y la cuenta demo (`demo@timesheet.dev` / `Demo1234!`).

> **Las cuentas que registraste en la base de datos local no se copian.** Para practicar es lo más
> sencillo: empiezas limpio. En el [anexo](#anexo--copiar-los-datos-de-la-base-local-a-rds)
> tienes cómo copiar los datos tal cual, que es lo que harías con datos reales.

### 4.3 Reinicia la API

La API solo lee el `.env` **al arrancar**, así que hay que reiniciarla:

```bash
sudo systemctl restart timesheet-api
journalctl -u timesheet-api -n 20 --no-pager
```

`journalctl -n 20` enseña las últimas 20 líneas de su log. Debe aparecer
`API listening on http://127.0.0.1:3333` y ningún error.

> **¿Por qué no hace falta tocar la web?** La web no habla con la base de datos: habla con la API.
> La API es la única que sabe dónde están los datos.

### 4.4 Comprueba en el navegador

Entra en `https://timesheet.mateocabrera.space` con la cuenta demo. Si ves los empleados, la app ya
está leyendo de RDS.

---

## Parte 5 — Apagar el PostgreSQL local y comprobar

### Qué vas a hacer y por qué

El PostgreSQL de tu servidor **sigue encendido**, aunque la app ya no lo use. Vas a apagarlo por dos
motivos:

1. **Para demostrarlo:** si lo apagas y la app sigue funcionando, es la prueba de que los datos
   vienen de RDS.
2. **Para liberar memoria:** deja de ocupar RAM en el servidor.

### 5.1 Quita la dependencia de la API con el PostgreSQL local

El archivo `.service` de la API (la "ficha" de la parte 11 de la guía de EC2) tiene estas dos
líneas:

```ini
After=network.target postgresql.service   # arráncame DESPUÉS de PostgreSQL
Wants=postgresql.service                  # y arranca PostgreSQL si no lo está
```

Tenían sentido cuando la base de datos estaba en el servidor. Ahora sobran, y `Wants=` **volvería a
encender** el PostgreSQL local cada vez que arranque la API. Quítalas de la ficha instalada:

```bash
sudo sed -i -e 's/ postgresql.service//' -e '/^Wants=postgresql.service/d' /etc/systemd/system/timesheet-api.service
sudo systemctl daemon-reload
grep -E '^(After|Wants)' /etc/systemd/system/timesheet-api.service
```

- `sed` es el buscar y reemplazar de la parte 12 de la guía de EC2. El primer `-e` borra
  ` postgresql.service` de la línea `After=`; el segundo borra la línea `Wants=` entera
  (`d` = *delete*).
- `daemon-reload`: systemd vuelve a leer la ficha, como en la parte 11.
- `grep` enseña cómo han quedado esas líneas. **Debe mostrar solo** `After=network.target`.

### 5.2 Apaga el PostgreSQL local

```bash
sudo systemctl disable --now postgresql
```

Es lo contrario de `enable --now` (parte 11 de la guía de EC2): `disable` = que no arranque al
encender el servidor; `--now` = y apágalo ya.

### 5.3 La prueba definitiva: reinicia el servidor

```bash
sudo reboot
```

Se cortará tu conexión: es normal. Espera un minuto, vuelve a conectarte y ejecuta:

```bash
systemctl is-active postgresql timesheet-api timesheet-web
```

Responde una palabra por servicio, en ese orden. Debe salir:

```
inactive    ← PostgreSQL local: apagado
active      ← API: funcionando
active      ← web: funcionando
```

Entra en la web e inicia sesión. Si funciona con el PostgreSQL local apagado, **tus datos vienen de
RDS**. 🎉

> **¿Por qué no desinstalar el PostgreSQL local?** Déjalo apagado unos días como **plan de vuelta
> atrás**: si algo fallara con RDS, vuelves en un minuto (abajo). Cuando estés seguro, puedes
> quitarlo con `sudo apt purge -y 'postgresql*'` y liberar disco.

**Si necesitas volver atrás:** vuelve a poner en `DATABASE_URL` la dirección `localhost` de la
parte 9 de la guía de EC2, y ejecuta:

```bash
sudo systemctl enable --now postgresql
sudo systemctl restart timesheet-api
```

---

## Parte 6 — Coste y cómo apagar

### Qué cuesta

Precios aproximados en us-east-1:

| Pieza | Precio | Al mes, si está encendida siempre |
|---|---|---|
| Máquina `db.t4g.micro` | ~0,016 USD por hora | ~12 USD |
| Disco de 20 GB gp3 | ~0,115 USD por GB al mes | ~2,30 USD |
| Copias de seguridad | Gratis hasta 20 GB | 0 USD |

Lo cubren los créditos del plan gratuito, pero **gastan créditos**. Los presupuestos de la parte 0
de la guía de EC2 te avisarán si algo se dispara.

### Entre sesiones de práctica: párala

**RDS → Databases** → selecciona `timesheet-db` → **Actions → Stop temporarily** → confirma. Al
volver: **Actions → Start** (tarda unos minutos). Para también el servidor, como en la guía de EC2.

Parada, la máquina **no cobra**, pero el disco sí (unos céntimos al día).

> **Ojo:** AWS vuelve a encender sola una base de datos parada **a los 7 días**, para aplicarle
> parches. Si vas a estar más tiempo sin practicar, vuelve a pararla o bórrala.

### Cuando termines la práctica del todo: bórrala

1. **RDS → Databases** → `timesheet-db` → **Actions → Delete**:
   - **Create final snapshot:** desmárcalo si no quieres guardar los datos. Un *snapshot* es una
     copia completa guardada; cobra su espacio cada mes mientras exista.
   - **Retain automated backups:** desmárcalo, por el mismo motivo.
   - Marca la casilla de confirmación, escribe `delete me` y confirma.
2. Cuando la base de datos haya desaparecido de la lista: **EC2 → Security Groups** → selecciona
   `timesheet-db-sg` → **Actions → Delete security groups**. No se puede borrar antes, mientras
   la base de datos lo use.
3. Sigue con [Apagar y borrar todo](README.md#apagar-y-borrar-todo-para-no-gastar) de la guía de
   EC2 para el servidor.

---

## Si algo falla

| Síntoma | Qué significa | Solución |
|---|---|---|
| `nc` o `psql` se quedan esperando y dan *timed out* | El portero no deja pasar a tu servidor | Revisa la regla de la parte 1 (origen `timesheet-sg`) y en **RDS → timesheet-db → Connectivity & security** que el único security group es `timesheet-db-sg` |
| `could not translate host name` | La dirección (endpoint) está mal escrita | Cópiala de nuevo desde **Connectivity & security** (2.13) |
| `password authentication failed for user "timesheet"` | La contraseña no coincide con la del 3.3 | Entra como `postgres` (3.2) y ponle una nueva: `ALTER USER timesheet WITH PASSWORD '…';` |
| `no pg_hba.conf entry … no encryption` | Intentas conectar sin cifrar | Añade `?sslmode=require` al final de `DATABASE_URL` (4.1) |
| `must be able to SET ROLE "timesheet"` | Faltó el `GRANT` | Como `postgres`: `GRANT timesheet TO postgres;` y repite el `CREATE DATABASE` |
| `permission denied for schema public` en `db:migrate` | La base de datos tiene como dueño a `postgres` en vez de a `timesheet` | Como `postgres`: `ALTER DATABASE timesheet OWNER TO timesheet;` |
| El prompt de `psql` se queda en `postgres->` | Falta el `;` al final de la orden | Escribe `;` y Enter |
| La API no arranca tras el cambio | Algo está mal en el `.env` | `journalctl -u timesheet-api -n 50 --no-pager` muestra el motivo exacto |

---

## Anexo — Copiar los datos de la base local a RDS

### Qué es y cuándo hacerlo

En el paso 4.2 empiezas con la base de datos limpia (tablas nuevas + datos de ejemplo). Con datos
reales eso no vale: tendrías que **mudar** lo que ya hay, incluidas las cuentas de usuario. Esta es
la forma de hacerlo.

Hazlo **en lugar del 4.2**, **antes** de apagar el PostgreSQL local (parte 5), y con la base de
datos de RDS recién creada y vacía (parte 3).

### Los comandos

```bash
sudo systemctl stop timesheet-api
pg_dump --no-owner --no-acl "postgres://timesheet:CONTRASEÑA_BD@localhost:5432/timesheet" > /tmp/timesheet.sql
psql "postgres://timesheet:CONTRASEÑA_APP@TU_ENDPOINT_RDS:5432/timesheet?sslmode=require" -v ON_ERROR_STOP=1 -f /tmp/timesheet.sql
rm /tmp/timesheet.sql
```

| Comando | Qué hace |
|---|---|
| `systemctl stop timesheet-api` | Para la API mientras copias, para que nadie escriba datos a mitad de la mudanza |
| `pg_dump … > /tmp/timesheet.sql` | **Empaqueta** toda la base de datos local en un archivo de órdenes SQL. `CONTRASEÑA_BD` es la de la parte 7 de la guía de EC2 |
| `--no-owner --no-acl` | No copia quién es dueño de cada tabla ni sus permisos: en RDS todo será del usuario que carga los datos (`timesheet`) |
| `psql … -f /tmp/timesheet.sql` | **Desempaqueta**: ejecuta ese archivo contra RDS y recrea todo allí |
| `-v ON_ERROR_STOP=1` | Para en el primer error, en lugar de seguir y dejar la mudanza a medias |
| `rm /tmp/timesheet.sql` | Borra el archivo: tiene datos de usuarios y no debe quedarse por ahí |

Después sigue con el **4.1** (cambiar `DATABASE_URL`) y el **4.3** (que vuelve a arrancar la API).
No hace falta `db:migrate`: el archivo ya incluye las tablas y el registro de migraciones. Comprueba
en el navegador que tus cuentas y datos siguen ahí.
