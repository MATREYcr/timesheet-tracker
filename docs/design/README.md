# Handoff: Mini Timesheets

> Paquete de entrega de diseño para implementar en código real con Claude Code.

## Overview

**Mini Timesheets** es una herramienta interna de nómina/administración para gestionar **empleados por hora**. Hace tres cosas:

1. **Empleados** — roster de empleados (nombre + tarifa por hora), con estado activo/inactivo.
2. **Registros de tiempo (Time entries)** — registrar horas trabajadas por empleado (fecha + horas) en una semana.
3. **Resumen semanal (Weekly summary)** — desglose de horas normales vs. extra y de pago, donde un revisor **aprueba o rechaza** la semana de cada empleado. Las semanas aprobadas quedan **bloqueadas (solo lectura)**.

Audiencia: un revisor de RR.HH./nómina en un escritorio. Prioridad: **legibilidad, tablas escaneables y estado claro** por encima de la decoración.

Alcance cerrado: **solo estas 3 pantallas**. Sin login, sin ajustes, sin navegación adicional. Bilingüe (EN/ES), modo claro + oscuro.

---

## About the Design Files

El archivo de este bundle (`Mini Timesheets.dc.html`) es una **referencia de diseño hecha en HTML** — un prototipo que muestra la apariencia y el comportamiento previstos, **no código de producción para copiar tal cual**.

La tarea es **recrear este diseño en el entorno del codebase destino** usando sus patrones y librerías establecidas. El brief original indica que el build real usa **shadcn/ui + Tailwind CSS** (React). Si ese entorno ya existe, recrea la UI con sus primitivas (`Table`, `Dialog`, `Select`, `Switch`, `Badge`, `Button`, `Alert`, `Toast`). Si no existe entorno aún, React + Tailwind + shadcn/ui es la elección recomendada.

> Nota técnica: el archivo `.dc.html` es un "Design Component" — corre en un runtime propio de la herramienta de diseño. **No lo importes como dependencia**. Ábrelo en el navegador como referencia visual e interactiva, y lee su lógica (la clase `Component`) para entender los cálculos (overtime, pago, formato de moneda por locale). Toda la lógica de negocio está documentada abajo, así que el README es autosuficiente.

---

## Fidelity

**Alta fidelidad (hi-fi).** Colores, tipografía, espaciado e interacciones son finales. Recrea la UI pixel-perfect usando las librerías/patrones existentes del codebase. Los valores exactos (hex, tamaños, radios) están en **Design Tokens**.

---

## Mapeo a primitivas shadcn/ui

| Elemento del diseño | Primitiva sugerida |
|---|---|
| Tabla de datos (header + filas + acciones) | `Table` |
| Diálogo agregar/editar empleado y registrar/editar hora | `Dialog` |
| Confirmación de borrado | `AlertDialog` |
| Selector de empleado, selector de fecha | `Select` |
| "Mostrar inactivos" | `Switch` |
| Badges de estado (Active/Inactive, Pending/Approved/Rejected) | `Badge` (variantes) |
| Banners de semana bloqueada / empleado inactivo | `Alert` (inline) |
| Botones primario/secundario/ghost | `Button` (variantes) |
| Feedback de acciones | `Toast` / `Sonner` |
| Selector de semana ( ◀ etiqueta ▶ ) | Composición custom (2 `Button` icon + label) |
| Estados vacío / carga / error | Empty state custom + `Skeleton` + `Alert` |

---

## Shell global (compartido por las 3 pantallas)

- **Header sticky**, altura **60px**, fondo `--card`, borde inferior `1px solid --border`. Tres zonas con `flex`:
  - **Izquierda** (`flex:1`): logo (rayo morado, SVG, 22px) + título "Mini Timesheets" (15px / 700).
  - **Centro**: nav segmentado dentro de un contenedor `--muted-bg` con `padding:4px`, `border-radius:9px`, borde `--border`. Tres items: **Employees · Time entries · Weekly summary** (en ES: **Empleados · Registros · Resumen semanal**). Item activo = fondo `--card` + sombra suave `0 1px 2px rgba(0,0,0,.10)` + texto `--fg` (peso 600); inactivo = transparente, texto `--fg-muted` (peso 500), hover → `--fg`.
  - **Derecha** (`flex:1`, `justify-content:flex-end`, `gap:8px`): toggle **EN/ES** (segmentado), botón **tema** (sol/luna, 34×34), botón **preview de estados** (icono matraz, 34×34 — herramienta de demo, ver más abajo).
- **Contenido**: contenedor centrado, `max-width:1024px`, `margin:0 auto`, `padding:32px 24px 96px`.
- Cada pantalla: **encabezado (h1 24px/700) + subtítulo (14px, --fg-muted)**, luego **toolbar**, luego una **card** que contiene la tabla (fondo `--card`, borde `--border`, `border-radius:12px`, `overflow:hidden`, sombra `0 1px 3px rgba(0,0,0,.04)`).

---

## Screens / Views

### Pantalla 1 — Empleados (Employees)

**Propósito:** gestionar el roster y las tarifas.

**Toolbar:** a la izquierda el encabezado + subtítulo ("Manage your hourly staff and their pay rates." / "Gestiona tu personal por hora y sus tarifas."); a la derecha un **Switch "Show inactive" / "Mostrar inactivos"** y un botón primario **"Add employee" / "Agregar empleado"** (con icono `+`).

**Tabla** — columnas: **Name | Hourly rate | Status | Actions**.
- `Name`: alineado a la izquierda, 14px / 600.
- `Hourly rate`: **alineado a la derecha**, `font-variant-numeric: tabular-nums`, formato moneda por locale.
- `Status`: badge. **Active** = pill `--primary-soft` + texto `--primary` + punto `--primary`. **Inactive** = pill `--muted-bg` + texto `--fg-muted` + borde `--border` + punto `--fg-subtle`.
- `Actions`: alineado a la derecha. Enlaces: **Edit** (color `--primary`, hover subraya) · separador `·` · **Deactivate/Reactivate** (color `--fg-muted`, hover `--fg`).
- Las filas inactivas **solo se muestran** cuando el Switch está activado.

**Datos de referencia (usar estos valores en mocks):**
| Name | Hourly rate | Status |
|---|---|---|
| Jane Doe | $22.50 | Active |
| John Smith | $18.00 | Active |
| Ana Ruiz | $20.00 | Inactive |

**Diálogo Agregar/Editar** (`Dialog`, max-width 440px): campos **First name**, **Last name** (en una fila de dos columnas) y **Hourly rate** (input numérico con prefijo `$`, step 0.01). Errores de validación **inline bajo cada campo** en `--danger` (12px). Footer: **Cancel** (secundario) + **Create/Save changes** (primario).

**Estados:**
- *Loading* = filas skeleton (barras con shimmer).
- *Empty* = estado amigable centrado: icono usuarios + "No employees yet" / "Aún no hay empleados" + descripción + botón "Add employee".
- *Error* = `Alert` destructivo inline con título "Something went wrong" + botón **Retry**.

---

### Pantalla 2 — Registros de tiempo (Time entries)

**Propósito:** registrar y revisar horas de **un** empleado en **una** semana.

**Toolbar:** a la izquierda un **Select de empleado** (incluye inactivos, marcados " (Inactive)") + un **selector de semana** ( ◀ *Jun 16 – 22, 2026* ▶ , lunes–domingo). A la derecha un botón primario **"Log time" / "Registrar tiempo"**.

**Tabla** — columnas: **Date | Hours | Actions**.
- `Date`: ej. "Mon, Jun 16" (EN) / "lun, 16 jun" (ES).
- `Hours`: **derecha**, tabular, 2 decimales (ej. `8.00`, `5.50`; en ES `8,00`).
- `Actions`: Edit · Delete (Delete en color `--danger`).

**Banners contextuales (Alert inline, arriba de la tabla):**
- **Semana aprobada → bloqueada**: banner ámbar (`--amber-bg` / borde `--amber-border` / texto `--amber`) con icono candado: "Week approved & locked — This week was approved, entries are read-only." Las filas pasan a **solo lectura** (Edit/Delete deshabilitados, en gris `--fg-subtle` opacidad .55) y **Log time** se muestra **deshabilitado** (pill gris con candado).
- **Empleado inactivo**: banner neutro (`--muted-bg` / borde `--border`): "Inactive employee — Past entries are viewable, but you can't log new time." Entradas pasadas visibles pero sin Log time.

**Diálogo Registrar/Editar** (`Dialog`, max-width 420px): **Date** (Select restringido a los 7 días de la semana seleccionada) + **Hours** (input numérico, **step 0.25**, min 0, max 24). Validación inline. **Delete** pide confirmación (modal destructivo `AlertDialog`: "Delete this entry? — This can't be undone.").

**Estados:**
- *Sin empleado seleccionado* = prompt centrado: "Pick an employee" / "Elige un empleado".
- *Loading / Empty / Error* como en la pantalla 1. Empty (semana sin horas) = "No hours this week".

**Datos de referencia (semana Jun 16–22, 2026):**
- Jane (e1): Mon 8, Tue 8, Wed 8, Thu 8, Fri 8, Sat 5.5 → **45.5 h** (editable, pendiente).
- John (e2): Mon 8, Tue 8, Wed 8, Thu 8 → **32 h** (semana **aprobada/bloqueada**).
- Ana (e3, inactiva): Mon 6, Tue 4 → visibles pero sin poder registrar.

---

### Pantalla 3 — Resumen semanal (Weekly summary) — la pantalla núcleo

**Propósito:** revisar y aprobar/rechazar el pago de la semana. Es la pantalla más importante.

**Toolbar:** encabezado + el mismo **selector de semana** a la derecha.

**Tabla** — una fila por empleado **con horas esa semana** (solo activos con horas). Columnas: **Employee | Regular h | Overtime h | Total h | Pay | Status | Actions**.
- `Regular h` / `Total h`: derecha, tabular.
- `Overtime h`: cuando **> 0**, resaltar con pill ámbar (`--amber-bg` / borde `--amber-border` / texto `--amber` / 700) con un pequeño chevron-up. Cuando = 0, mostrar `0` en `--fg-subtle`. **Es el insight clave — debe destacar.**
- `Pay`: **total grande** (15px / 700, tabular) + debajo un desglose muted (11.5px, `--fg-muted`): `regular  +  overtime`.
- `Status` (aprobación): **Pending** = badge neutro (`--muted-bg`/`--fg-muted`/borde). **Approved** = badge éxito (`--success-bg`/`--success`/borde + check). **Rejected** = badge destructivo (`--danger-bg`/`--danger`/borde + ✕).
- `Actions` según estado: **Pending/Rejected → Approve + Reject** (Approve = botón suave verde `--success-bg`/`--success`; Reject = ghost que en hover se vuelve `--danger`). **Approved → icono candado + "Reopen"** (botón ghost con borde).
- Números a la derecha, tabular, fáciles de escanear por columna.

**Cálculo del pago (client-side):**
```
total   = suma de horas de la semana
regular = min(total, 40)
overtime= max(0, total - 40)         // horas > 40/semana
regPay  = rate * regular
otPay   = rate * 1.5 * overtime      // overtime pagado a 1.5×
pay     = regPay + otPay
// redondear cada monto a 2 decimales
```

**Datos de referencia (deben coincidir exactamente):**
| Employee | Regular h | Overtime h | Total h | Pay | Status | Actions |
|---|---|---|---|---|---|---|
| Jane Doe | 40 | **5.5** | 45.5 | **$1,085.63** · $900.00 + $185.63 | Pending | Approve · Reject |
| John Smith | 32 | 0 | 32 | **$576.00** · $576.00 + $0.00 | Approved | 🔒 Reopen |

**Estados:** loading skeleton; empty = "No hours this week"; error = alert + retry. Aprobar/Rechazar se sienten instantáneos (optimistic update).

---

## Interactions & Behavior

- **Navegación**: el nav del header cambia entre las 3 pantallas (estado activo en el item). Al cambiar de pantalla o de semana se dispara un **skeleton de carga breve (~450ms)** antes de mostrar datos (simula fetch).
- **Show inactive**: el switch alterna la visibilidad de las filas inactivas en la tabla de empleados.
- **Add/Edit empleado**: abre Dialog; al guardar valida y, si ok, agrega/actualiza y muestra toast.
- **Deactivate/Reactivate**: alterna `active` directamente (sin confirmación) + toast.
- **Selector de empleado** (pantalla 2): cambia el empleado mostrado; reconstruye filas y banners (bloqueado/inactivo).
- **Selector de semana**: ◀ ▶ cambian la semana mostrada. En el prototipo solo la semana **Jun 16–22, 2026** tiene datos; otras semanas muestran el estado vacío (útil para demostrar empty states). En producción, conectar a datos reales por semana (lunes–domingo).
- **Log time / Edit / Delete**: Dialogs con validación; Delete pide confirmación destructiva.
- **Approve / Reject / Reopen**: actualización optimista del estado de aprobación + toast. Approve→Approved (bloquea), Reject→Rejected, Reopen→Pending.
- **EN/ES**: cambia todo el copy y el formato de números/fechas/moneda según locale.
- **Tema claro/oscuro**: alterna el set de tokens semánticos.

**Validación**
- Empleado: First name y Last name requeridos; Hourly rate requerido, numérico y **> 0**.
- Registro: Date requerido; Hours requerido, numérico, **> 0**, **≤ 24** y múltiplo de **0.25**.
- Mensajes inline bajo el campo, en `--danger`, 12px.

**Animaciones / transiciones**
- Dialogs: `mt-pop` — `scale .97→1` + `translateY 4px→0`, ~180ms ease.
- Toasts: `mt-toast` — fade + `translateY 10px→0`, ~200ms ease; auto-dismiss a los **2800ms**; aparecen abajo-derecha, apilados, con borde-izquierdo de 3px del color del tipo (éxito `--success`, error `--danger`, info `--primary`).
- Skeleton: gradiente con `mt-shimmer` (1.2s lineal infinito).
- Switch/knob: transición `left .15s` y `background .15s`.
- Hover de botón primario: `filter: brightness(1.08)`; active: `translateY(1px)`.
- Hover de fila de tabla: fondo `--muted-bg`.
- *Nota*: evitar animaciones de entrada que partan de `opacity:0` para el contenido principal (si el tab está en segundo plano, la animación se pausa en el frame 0 y el contenido queda invisible). Para fades, usar `animation-fill-mode: forwards` o no gatear el contenido tras opacity 0.

**Toasts (copys)**
Employee added / Changes saved / Employee deactivated / Employee reactivated / Time logged / Entry updated / Entry deleted / Week approved / Week rejected / Week reopened. (ES: Empleado agregado / Cambios guardados / Empleado desactivado / Empleado reactivado / Horas registradas / Registro actualizado / Registro eliminado / Semana aprobada / Semana rechazada / Semana reabierta.)

**Herramienta de demo (icono matraz)**
Solo para revisión: cicla el estado de la pantalla actual entre `live → loading → empty → error`. **No incluir en producción.**

---

## State Management

Estado necesario (en el prototipo vive en una clase; en React serían `useState`/store + queries):
- `lang`: 'en' | 'es'
- `theme`: 'light' | 'dark'
- `screen`: 'employees' | 'entries' | 'summary' (en el build real será ruteo)
- `showInactive`: boolean
- `weekOffset` / semana seleccionada (rango lunes–domingo)
- `employees[]`: `{ id, first, last, rate, active }`
- `entries[]`: `{ id, empId, day(0=lun..6=dom) | date, hours }`
- `approvals`: `{ [empId]: 'pending' | 'approved' | 'rejected' }` por semana
- `selectedEmpId` (pantalla 2)
- Estado efímero de diálogos: `empDialog`, `entryDialog`, `confirm` (con sus campos y `errors`)
- `toasts[]`

**Data fetching (build real):** empleados (lista), entradas por (empleado, semana), y estado de aprobación por (empleado, semana). El resumen se **calcula en cliente** a partir de las entradas + la tarifa. Aprobar/Rechazar/Reabrir → mutación optimista.

---

## Design Tokens

Tokens semánticos (cambian con el tema). Implementar como CSS variables / theme de Tailwind.

### Modo claro
| Token | Valor |
|---|---|
| `--bg` (fondo página) | `#f7f7f8` |
| `--card` | `#ffffff` |
| `--fg` (texto principal) | `#09090b` |
| `--fg-muted` | `#71717a` |
| `--fg-subtle` | `#a1a1aa` |
| `--border` | `#e4e4e7` |
| `--input` (borde input) | `#d4d4d8` |
| `--muted-bg` | `#f4f4f5` |
| `--success` | `#15803d` |
| `--success-bg` | `#dcfce7` |
| `--success-border` | `#bbf7d0` |
| `--danger` (destructive) | `#dc2626` |
| `--danger-bg` | `#fef2f2` |
| `--danger-border` | `#fecaca` |
| `--amber` (overtime) | `#b45309` |
| `--amber-bg` | `#fffbeb` |
| `--amber-border` | `#fde68a` |

### Modo oscuro
| Token | Valor |
|---|---|
| `--bg` | `#0a0a0b` |
| `--card` | `#161618` |
| `--fg` | `#fafafa` |
| `--fg-muted` | `#a1a1aa` |
| `--fg-subtle` | `#71717a` |
| `--border` | `#27272a` |
| `--input` | `#26262a` |
| `--muted-bg` | `#1c1c1f` |
| `--success` | `#4ade80` |
| `--success-bg` | `rgba(74,222,128,.13)` |
| `--success-border` | `rgba(74,222,128,.30)` |
| `--danger` | `#f87171` |
| `--danger-bg` | `rgba(248,113,113,.13)` |
| `--danger-border` | `rgba(248,113,113,.30)` |
| `--amber` | `#fbbf24` |
| `--amber-bg` | `rgba(251,191,36,.12)` |
| `--amber-border` | `rgba(251,191,36,.32)` |

### Primario / acento (default = purple, de la marca Monedín)
| Token | Claro | Oscuro |
|---|---|---|
| `--primary` | `#7c3aed` | `#9d6bff` |
| `--primary-fg` | `#ffffff` | `#ffffff` |
| `--primary-soft` (fondo badge activo) | `rgba(124,58,237,.11)` | `rgba(157,107,255,.20)` |
| `--ring` (focus) | `rgba(124,58,237,.35)` | `rgba(157,107,255,.35)` |

> El prototipo soporta acentos alternativos (blue `#2563eb`/`#5b8cff`, slate `#475569`/`#94a3b8`). Default = purple.

### Tipografía
- Familia: **Geist** (`'Geist', system-ui, sans-serif`). Variable, pesos 400/500/600/700/800.
- Escala usada: h1 **24px / 700** (letter-spacing -0.02em) · subtítulo 14px · headers de tabla **11px / 600**, uppercase, letter-spacing .05em, color `--fg-subtle` · celdas 14px · pago total 15px / 700 · desglose 11.5px · badges 12px / 600 · labels de form 13px / 600 · errores 12px.
- Números: `font-variant-numeric: tabular-nums` en moneda y horas.

### Radios
- Card / tabla: **12px** · inputs, botones, selects, banners: **8px** · badges/pills: **9999px** · iconos-botón: 6–7px · dialogs: 14px.

### Espaciado
- Padding de celda: **comfortable 13px 16px** (default) / **compact 8px 16px** (configurable).
- Padding de contenido: 24px horizontal. Header: 0 24px, altura 60px.
- Gaps de toolbar: 12–18px.

### Sombras
- Card: `0 1px 3px rgba(0,0,0,.04)` · botón primario: `0 1px 2px rgba(0,0,0,.12)` · dialog: `0 24px 60px rgba(0,0,0,.30)` · toast: `0 10px 30px rgba(0,0,0,.20)`.

### Formato de moneda y números (por locale)
- **en**: separador de miles `,`, decimal `.`, símbolo `$` → `$1,085.63`.
- **es**: separador de miles `.`, decimal `,`, símbolo `$` → `$1.085,63`.
- Horas: 2 decimales en la tabla de registros (`8.00` / `8,00`); naturales en el resumen (`40`, `5.5`, `45.5`).
- Fechas día: en `Mon, Jun 16`; es `lun, 16 jun`. Semana: en `Jun 16 – 22, 2026`; es `16 – 22 jun 2026`. Semana = lunes–domingo.

---

## Assets

- **Logo**: rayo (lightning bolt) morado, dibujado como SVG inline (path `M13 2 4.5 13.5H11L9 22 18 9.5H11.5L13 2Z`, `fill: var(--primary)`), 22px. Proviene del sistema de diseño Monedín (`assets/logo.svg`). En el codebase, usar el logo de marca existente.
- **Iconos**: estilo Lucide (stroke `currentColor`, 1.8–2px). Usados: chevron-left/right, plus, lock, sun, moon, beaker(matraz), trash, alert-triangle, check, x, clock, users. En React usar `lucide-react`.
- **Fuente**: Geist (Google Fonts / `@fontsource-variable/geist`).
- No hay imágenes raster ni fotografía.

---

## Screenshots

Capturas de referencia en `screenshots/` (claro + oscuro + estados):

| Archivo | Pantalla / estado |
|---|---|
| `01-employees.png` | Empleados — modo **claro** (con inactivos visibles) |
| `02-employees.png` | Empleados — modo **oscuro** |
| `01-time-entries.png` | Registros de tiempo — empleado activo, semana editable (Jane) |
| `02-time-entries.png` | Registros de tiempo — **semana aprobada/bloqueada** (John): banner ámbar, acciones deshabilitadas, "Log time" deshabilitado |
| `01-weekly-summary.png` | Resumen semanal — **claro** (overtime ámbar, desglose de pago, Pending/Approved) |
| `02-weekly-summary.png` | Resumen semanal — **oscuro** |
| `03-weekly-summary-empty.png` | Resumen semanal — **estado vacío** (semana sin horas) |

> Nota: en las capturas, los `<select>` aparecen mostrando el placeholder por un artefacto del motor de captura; en la app en vivo muestran el nombre seleccionado (los datos de la tabla debajo reflejan el empleado correcto).

## Files

- `Mini Timesheets.dc.html` — prototipo de referencia (las 3 pantallas, ambos temas, EN/ES, todos los estados y diálogos). Ábrelo en el navegador. La clase `Component` al final contiene la lógica de cálculo, i18n y formato; úsala como fuente de verdad para overtime, pago y formato por locale.

---

## Out of scope (no implementar)

Login/auth, ajustes de usuario, centro de notificaciones, páginas de detalle de empleado, descripciones/proyectos en las entradas, reportes/gráficas, vistas multi-semana. Solo las 3 pantallas anteriores.
