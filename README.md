# Sistema de Gestión de Movilidad Académica y Laboral - CUE

**Prototipo de alta fidelidad — Corporación Universitaria Empresarial Alexander von Humboldt**

## Descripción del proyecto

Prototipo funcional para digitalizar y unificar procesos de movilidad académica (entrante y saliente, nacional e internacional) y salidas académicas. La persistencia es **solo en el navegador** (`localStorage`): no hay API ni base de datos en este repositorio; sirve para demostración, pruebas de flujo y alineación con requisitos (SRS, CNA, MINEDUCACIÓN).

## Stack tecnológico

- **Frontend:** HTML5, Tailwind CSS (CDN).
- **Lógica:** JavaScript en el navegador (ES6+), sin framework.
- **Datos:** `localStorage` como sustituto de backend.
- **Iconos:** Lucide (CDN).
- **Exportación Excel (donde aplica):** SheetJS (CDN), p. ej. en `modules/dashboard-ani.html`.

---

## Estructura del repositorio

| Ruta | Contenido |
|------|-----------|
| `index.html` | Portal de solicitantes: correo + código de 4 dígitos (`AuthService.requestPortalCode` / `loginPortal`). |
| `index-sistema.html` | Login de **backoffice** (ANI, Coordinación, SST, Registro): email + contraseña (`loginBackoffice`). |
| `menu-sistema.html` | Menú intermedio tras el login de gestores; enlaces a cada dashboard según rol. |
| `portal-cue.html` | Shell tipo intranet; enlace a Movilidad y sesión. |
| `seed-datos-prueba.html` | Rellena `localStorage` con datos de ejemplo para probar todos los módulos. |
| `modules/dashboard-estudiante.html` | Panel del solicitante (solicitudes, borradores, certificados, salidas). |
| `modules/mobility-wizard.html` | Formulario multipaso FO-IN-012; lógica en `assets/js/wizard-logic.js`. |
| `modules/dashboard-ani.html` | Secretaría y Dirección ANI (bandeja, convenios, reportes, credenciales). |
| `modules/dashboard-acad.html` | Coordinación académica (Paz y Salvo, salidas académicas). |
| `modules/dashboard-sst.html` | Revisión SST para salidas con transporte institucional. |
| `modules/dashboard-miscelanea.html` | Vista de Registro (certificados pendientes; HTML simple). |
| `assets/js/auth.js` | Roles, usuarios demo, sesión (`CUE_AUTH_USER`), portal y backoffice. |
| `assets/js/wizard-logic.js` | Reglas del wizard: pasos, borradores, radicación en `CUE_MY_REQUESTS`. |
| `assets/js/cue-core.js` | Notificaciones en campana (`CUE_NOTIFICATIONS`) y utilidades de escape. |
| `assets/js/state.js` | Constantes de estado del flujo y listas usadas por bandejas (compatibilidad). |
| `assets/css/style.css` | Variables de color CUE y estilos compartidos. |
| `assets/js/AgreementService.js` | Módulo ES (convenios simulados); no está enlazado aún en páginas HTML. |
| `assets/js/services/studentsservices.js` | Módulo ES (estudiantes simulados); reservado para integraciones futuras. |
| `docs/` | Diccionario de datos, auditoría de requisitos, etc. |

Los comentarios en el código (HTML y JS) describen **qué hace cada parte** y **qué claves de almacenamiento tocan**. Prioridad: archivos en `modules/` y `assets/js/auth.js`, `wizard-logic.js`, `cue-core.js`.

---

## Autenticación

1. **Portal (solicitantes):** el usuario ingresa correo; el sistema genera un código de 4 dígitos guardado en `CUE_PORTAL_CODES` (en producción sería un envío real por email). Tras validar el código, se guarda `CUE_AUTH_USER` y se redirige al dashboard del rol inferido por dominio (`inferPortalRoleByEmail`).
2. **Backoffice:** usuarios listados en `MOCK_USERS` dentro de `auth.js` con rol en `ANI_*`, `COORD_ACAD`, `SST`, `REGISTRO`. Tras login, `CUE_AUTH_USER` y redirección a `menu-sistema.html` o al módulo correspondiente.

`AuthService.logout()` borra la sesión y devuelve a `index.html` o `index-sistema.html` según si el rol era de gestor o no.

---

## Persistencia (`localStorage`) — referencia rápida

| Clave | Uso |
|-------|-----|
| `CUE_AUTH_USER` | Usuario en sesión (email, nombre, rol). |
| `CUE_PORTAL_CODES` | Códigos de un solo uso por correo (portal). |
| `CUE_MY_REQUESTS` | Solicitudes de movilidad radicadas o cargadas en demo. |
| `CUE_USER_PROFILE` | Perfil académico simulado para autollenado en el wizard. |
| `CUE_CONVENIOS` | Convenios institucionales (ANI). |
| `CUE_TIPOS_MOVILIDAD` | Catálogo de tipos de movilidad. |
| `CUE_NOTIFICATIONS` | Cola de mensajes para la campana (CUECore). |

Puede haber más claves creadas por `seed-datos-prueba.html` o por módulos concretos; el código que las escribe suele nombrarlas en comentarios o al lado del `setItem`.

---

## Cómo ejecutar en local

1. Clonar el repositorio.
2. Abrir `index.html` o `index-sistema.html` con un servidor estático (recomendado: **Live Server** en VS Code) para evitar restricciones de algunos navegadores con `file://` y `localStorage`.
3. Usar las credenciales de `assets/js/auth.js` (correos y contraseñas de demo en comentarios del propio archivo y en la UI de demo).
4. Opcional: abrir `seed-datos-prueba.html` y pulsar **Cargar datos de prueba** antes de recorrer ANI, Coordinación, SST y Registro.
5. Para resetear: consola del navegador → `localStorage.clear()` y recargar.

---

## Documentación adicional

- `docs/diccionario-datos-movilidad.md` — campos y correspondencias.
- `docs/AUDITORIA-REQUISITOS-Y-PLAN-ACCION.md` — estado de requisitos frente al prototipo.

---

## Roles del sistema (resumen)

1. **Solicitante interno:** estudiante, profesor, administrativo, egresado (datos base simulados tipo Q10).
2. **Solicitante externo:** otras instituciones; acceso puede simularse desde ANI.
3. **Coordinación académica:** aval "Paz y Salvo" y creación de salidas académicas.
4. **Secretaría / Dirección ANI:** revisión documental, convenios, aprobación final, reportes (Dirección).
5. **SST:** revisión condicional cuando hay transporte institucional.
6. **Registro:** cola de certificados y trámites relacionados en la vista miscelánea.

---

## Requisitos funcionales (RF) y no funcionales (RNF)

Los listados detallados de RF/RNF, máquina de estados y cumplimiento normativo se mantienen como referencia de negocio en las secciones siguientes (heredadas del documento original del proyecto).

### Módulo del solicitante (Fase 1 y Fase 2)

- **RF-01** Registro de solicitud saliente y entrante.
- **RF-02** Documentación según modalidad, dirección y tipo.
- **RF-03** Modalidad virtual: ocultar seguro, vuelos y contacto de emergencia cuando aplica.
- **RF-04** Trazabilidad y borradores.
- **RF-05** Certificados con costo simulado $0 COP si la movilidad está activa.
- **RF-06** Consentimiento informado y política de datos.

### Coordinación académica

- **RF-07** Aval académico antes de ANI.
- **RF-08** Creación exclusiva de salidas académicas grupales y transporte.

### Oficina ANI

- **RF-09** Pre-aprobación (Secretaría).
- **RF-10** Accesos externos simulados.
- **RF-11** Catálogos (convenios, tipos de movilidad; la pestaña Programas fue retirada del dashboard ANI en la versión actual del código).
- **RF-12** Aprobación final (Dirección).

### SST

- **RF-13** Intervención solo si aplica transporte institucional.
- **RF-14** Checklist de vehículos y documentación.

### Control y registro

- **RF-15** Integración Q10 simulada para entrantes.

### CNA

- **RF-16** Reportes para métricas (parcialmente cubierto en Dirección ANI vía Excel).

### RNF

- **RNF-01** RBAC por rol.
- **RNF-02** Terminología: preferir "Profesor" frente a "Docente" en interfaz (convivencia con códigos internos `DOCENTE` en datos).
- **RNF-03** Diseño responsive.
- **RNF-04** Disponibilidad esperada en especificación.
- **RNF-05** Tratamiento de datos personales.

---

## Máquina de estados (referencia)

Estados usados de forma dispersa en el prototipo incluyen, entre otros: `BORRADOR`, `EN_REVISION_COORDINACION`, `EN_REVISION_POSTULACION`, `EN_REVISION_SECRETARIA_ANI`, `EN_REVISION_DIRECCION_ANI`, `EN_REVISION_TOTAL`, `APROBADA_POSTULACION`, `EN_REVISION_LEGALIZACION`, `PENDIENTE_MATRICULA`, `MOVILIDAD_ACTIVA`. La fuente unificada de constantes está en `assets/js/state.js`; el wizard y cada dashboard pueden usar variantes según evolución del código.

---

## Guía rápida para nuevos desarrolladores

1. Leer este README y `docs/diccionario-datos-movilidad.md` si vas a tocar datos de solicitud o expediente.
2. Trazar el flujo desde `mobility-wizard.js` → `CUE_MY_REQUESTS` → dashboard que filtra por `status`.
3. No asumir backend: toda regla debe implementarse en cliente o documentarse como pendiente.
4. Mantener comentarios en español claro, sin iconos decorativos; explicar claves `localStorage` al añadir nuevas.
5. Si añades páginas nuevas, enlázalas desde `menu-sistema.html` o el portal según el rol y documenta la ruta en esta tabla de estructura.
