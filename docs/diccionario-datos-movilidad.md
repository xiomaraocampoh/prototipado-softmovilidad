## Diccionario de Datos – Movilidad CUE

### 1. Tabla lógica `USUARIO`

- **Descripción**: Personas que interactúan con el sistema (estudiantes, profesores, personal ANI, SST, Registro).
- **Claves de negocio**: El correo institucional es el identificador práctico en el prototipo.
- **Correspondencia**: `CUE_AUTH_USER` en `localStorage`.

| Columna      | Tipo lógico     | Reglas de negocio                                                                 | Mapeo prototipo                                  |
|--------------|-----------------|-----------------------------------------------------------------------------------|--------------------------------------------------|
| id           | INT             | PK lógico. Opcional en prototipo (se deriva).                                     | No se persiste; se asume por contexto.          |
| tipo         | VARCHAR(20)     | `INTERNO` / `EXTERNO`. Obligatorio.                                              | Derivado de `role.code` o prefijo de email.     |
| rol          | VARCHAR(50)     | Catálogo: `ESTUDIANTE`, `DOCENTE`, `ANI_SECRETARIA`, `ANI_DIRECCION`, `SST`, `REGISTRO`. | `CUE_AUTH_USER.role.code` / `.name`.            |
| nombre       | VARCHAR(150)    | Obligatorio.                                                                      | `CUE_AUTH_USER.name`.                           |
| email        | VARCHAR(150)    | Obligatorio, único (lógico).                                                     | `CUE_AUTH_USER.email`.                          |
| documento    | VARCHAR(50)     | Opcional; viene de Q10 para internos.                                            | Campo opcional en el JSON de usuario.           |
| telefono     | VARCHAR(50)     | Opcional.                                                                         | Campo opcional en el JSON de usuario.           |
| programa     | VARCHAR(150)    | Programa académico principal (internos).                                         | Campo opcional en el JSON de usuario.           |

---

### 2. Tabla lógica `SOLICITUD`

- **Descripción**: Solicitudes de movilidad individual (no salidas masivas) a lo largo del flujo completo.
- **Correspondencia**: Arreglo `CUE_MY_REQUESTS` en `localStorage`.

| Columna              | Tipo lógico      | Reglas de negocio                                                                                                                  | Mapeo prototipo / JSON                                             |
|----------------------|------------------|------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| id                   | VARCHAR(30)      | PK lógica. Formato `REQ-####`. Obligatorio.                                                                                        | `request.id`.                                                      |
| fecha_creacion       | DATETIME         | Obligatoria. Fecha/hora en que se radica la postulación.                                                                           | `request.date` (string) o `createdAt`.                             |
| tipo_movil           | VARCHAR(100)     | Catálogo (`Intercambio Académico`, `Práctica Empresarial - Pasantía`, etc.). Obligatorio.                                         | `request.type`.                                                    |
| direccion            | VARCHAR(10)      | `ENTRANTE` / `SALIENTE`. Obligatorio.                                                                                              | `request.dir`.                                                     |
| estado               | VARCHAR(50)      | Estados: `BORRADOR`, `EN_REVISION_POSTULACION`, `EN_REVISION_TOTAL`, `EN_REVISION_LEGALIZACION`, `MOVILIDAD_ACTIVA`, etc.         | `request.status`.                                                  |
| usuario_id           | INT              | FK a `USUARIO`. En prototipo se aproxima con email.                                                                               | `request.userEmail`.                                               |
| convenio_id          | INT              | FK a `CONVENIO`. Opcional si el tipo de movilidad no exige convenio.                                                              | `request.convenioId` o `request.dest` (nombre convenio).           |
| programa_origen_id   | INT              | FK a `PROGRAMA`. Obligatorio para entrantes.                                                                                      | `request.programaOrigenId`.                                       |
| programa_destino_id  | INT              | FK a `PROGRAMA`. Obligatorio para salientes.                                                                                      | `request.programaDestinoId`.                                      |
| es_salida_academica  | BOOLEAN          | `TRUE` si proviene de una `SALIDA_ACADEMICA`.                                                                                     | `request.isSalidaAcademica` / `es_salida_academica`.               |
| salida_academica_id  | INT              | FK a `SALIDA_ACADEMICA`. Opcional.                                                                                                | `request.salidaAcademicaId`.                                      |
| academicReview       | JSON             | Subdocumento `HOMOLOGACION_ACAD`.                                                                                                 | `request.academicReview` (ver tabla específica).                   |
| sstReviewFlag        | BOOLEAN          | Derivado: si requiere validación SST por ser parte de una salida con transporte de universidad.                                  | `request.requiereSST` (opcional).                                  |
| registroInfo         | JSON             | Subdocumento `REGISTRO_MOVILIDAD` para Q10 y certificados.                                                                        | `request.registroInfo` (ver tabla específica).                     |
| certRequested        | BOOLEAN          | `TRUE` cuando el usuario crea un ticket de certificado desde su panel.                                                           | `request.certRequested`.                                          |
| certType             | VARCHAR(150)     | Tipo de certificado solicitado.                                                                                                   | `request.certType`.                                               |
| certObs              | VARCHAR(500)     | Observaciones del usuario.                                                                                                        | `request.certObs`.                                                |
| certStatus           | VARCHAR(30)      | `PENDIENTE`, `PAGADO`, `ENTREGADO`. En Registro se usa para controlar la bandeja.                                                | `request.certStatus`.                                             |

---

### 3. Catálogos: `CONVENIO`, `PROGRAMA`, `TIPO_MOVILIDAD`

#### 3.1 Tabla lógica `CONVENIO`

- **Descripción**: Convenios institucionales con instituciones aliadas.
- **Correspondencia**: `CUE_CONVENIOS` (array).

| Columna        | Tipo lógico   | Reglas de negocio                                         | Mapeo prototipo            |
|----------------|---------------|-----------------------------------------------------------|----------------------------|
| id             | INT           | PK lógica.                                                | Índice o `c.id` si existe. |
| nombre         | VARCHAR(150)  | Obligatorio.                                              | `c.nombre`.                |
| pais           | VARCHAR(100)  | Obligatorio.                                              | `c.pais`.                  |
| ciudad         | VARCHAR(100)  | Obligatorio.                                              | `c.ciudad`.                |
| vigencia_hasta | DATE          | Obligatorio; define si se permite usar el convenio.      | `c.vigencia`.              |

#### 3.2 Tabla lógica `PROGRAMA`

- **Descripción**: Programas académicos internos.
- **Correspondencia**: `CUE_PROGRAMAS` (array).

| Columna   | Tipo lógico    | Reglas de negocio                            | Mapeo prototipo   |
|-----------|----------------|----------------------------------------------|-------------------|
| id        | INT            | PK lógica.                                   | `p.id`.           |
| nombre    | VARCHAR(150)   | Obligatorio.                                 | `p.nombre`.       |
| nivel     | VARCHAR(20)    | `PREGRADO` / `POSGRADO`.                     | `p.nivel`.        |
| facultad  | VARCHAR(150)   | Obligatorio.                                 | `p.facultad`.     |

#### 3.3 Tabla lógica `TIPO_MOVILIDAD`

- **Descripción**: Catálogo funcional de tipos de movilidad.
- **Correspondencia**: `CUE_TIPOS_MOVILIDAD` (si se mantiene) y opciones en el wizard.

| Columna   | Tipo lógico    | Reglas de negocio                                  | Mapeo prototipo                |
|-----------|----------------|----------------------------------------------------|--------------------------------|
| codigo    | VARCHAR(30)    | PK lógica; p.ej. `INTERCAMBIO`, `PRACTICA`.       | `t.codigo` (si existe).        |
| nombre    | VARCHAR(150)   | Obligatorio.                                      | `t.nombre` o texto de opción.  |
| modalidad | VARCHAR(20)    | `PRESENCIAL` / `VIRTUAL` / ambas.                 | `t.m` en `WizardLogic.types`.  |

---

### 4. Tabla lógica `SALIDA_ACADEMICA`

- **Descripción**: Salidas grupales (visitas, salidas de campo, etc.) creadas por Coordinación Académica.
- **Correspondencia**: `CUE_SALIDAS_ACADEMICAS` en `localStorage`, consumida por `dashboard-acad.html` y `dashboard-sst.html`.

| Columna          | Tipo lógico    | Reglas de negocio                                                                                                     | Mapeo prototipo / JSON                        |
|------------------|----------------|-----------------------------------------------------------------------------------------------------------------------|-----------------------------------------------|
| id               | VARCHAR(30)    | PK lógica. Formato `SAL-####`.                                                                                       | `salida.id`.                                  |
| coordinador_id   | INT            | FK a `USUARIO` (profesor responsable).                                                                               | `salida.profesorResponsable.email` como clave |
| nombre           | VARCHAR(200)   | Obligatorio.                                                                                                          | `salida.nombre`.                              |
| tipo             | VARCHAR(50)    | Catálogo (`VISITA_EMPRESARIAL`, `SALIDA_CAMPO`, etc.).                                                               | `salida.tipo`.                                |
| fecha_inicio     | DATE           | Obligatorio.                                                                                                          | `salida.fechaInicio`.                         |
| fecha_fin        | DATE           | Obligatorio.                                                                                                          | `salida.fechaFin`.                            |
| destino          | VARCHAR(200)   | Obligatorio.                                                                                                          | `salida.destino`.                             |
| transporte       | VARCHAR(30)    | `"UNIVERSIDAD"` / `"PROPIO"`. Define si requiere SST.                                                                | `salida.transporte`.                          |
| requiereSST      | BOOLEAN        | `TRUE` si `transporte === "UNIVERSIDAD"`. Filtra qué aparece en `dashboard-sst.html`.                               | `salida.requiereSST`.                         |
| estado_acad      | VARCHAR(30)    | `EN_DISENO`, `EN_REVISION_SST`, `APROBADA`, `CANCELADA`.                                                             | `salida.estadoAcad`.                          |
| participantes    | JSON (array)   | Lista de participantes (`PARTICIPANTE_SALIDA`).                                                                      | `salida.participantes`.                       |
| sstReview        | JSON           | Subdocumento de revisión SST.                                                                                         | `salida.sstReview` (ver tabla específica).    |
| updatedAt        | DATETIME       | Fecha/hora de última actualización.                                                                                  | `salida.updatedAt`.                           |

---

### 5. Tabla lógica `PARTICIPANTE_SALIDA`

- **Descripción**: Relación N:M entre `SALIDA_ACADEMICA` y `USUARIO`.
- **Correspondencia**: Elementos del arreglo `salida.participantes`.

| Columna         | Tipo lógico | Reglas de negocio                                         | Mapeo prototipo                   |
|-----------------|------------|-----------------------------------------------------------|-----------------------------------|
| id              | INT        | PK lógica (puede ser índice).                            | Índice del array o `p.id`.        |
| salida_id       | INT        | FK a `SALIDA_ACADEMICA`.                                 | Implicado por pertenencia al array|
| usuario_id      | INT        | FK a `USUARIO`.                                          | `p.email` como clave práctica.    |
| solicitud_id    | INT        | FK opcional a `SOLICITUD` si se generan solicitudes.     | `p.solicitudId`.                  |
| rol_participante| VARCHAR(20)| `ESTUDIANTE` / `DOCENTE`. Obligatorio.                   | `p.rol`.                          |

---

### 6. Subtabla lógica `HOMOLOGACION_ACAD` (dentro de `SOLICITUD`)

- **Descripción**: Resultado de la **aprobación académica de la movilidad** (verifica que la movilidad sea académicamente viable).
- **Correspondencia**: `request.academicReview`.

| Columna              | Tipo lógico    | Reglas de negocio                                                                                      | Mapeo prototipo                     |
|----------------------|----------------|--------------------------------------------------------------------------------------------------------|-------------------------------------|
| solicitud_id         | INT            | FK a `SOLICITUD`.                                                                                     | Clave externa lógica (no explícita).|
| estado_aprobacion_acad | VARCHAR(20) | `PENDIENTE`, `APROBADO`, `RECHAZADO`. Obligatorio tras revisión de viabilidad académica de la movilidad. | `academicReview.estado`.            |
| observaciones        | VARCHAR(1000)  | Obligatorio si `RECHAZADO`.                                                                           | `academicReview.observaciones`.     |
| plan_homologacion    | TEXT           | Plan detallado de homologación.                                                                       | `academicReview.planHomologacion`.  |
| fecha_revision       | DATETIME       | Fecha/hora de la revisión.                                                                            | `academicReview.fecha`.             |
| coordinador_id       | INT            | FK a `USUARIO` (coordinador académico).                                                               | `academicReview.coordinatorEmail`.  |

---

### 7. Subtabla lógica `REVISION_SST` (dentro de `SALIDA_ACADEMICA`)

- **Descripción**: Resultado de la revisión de Seguridad y Salud en el Trabajo para salidas con transporte suministrado por la Universidad.
- **Correspondencia**: `salida.sstReview`, gestionada en `dashboard-sst.html`.

| Columna            | Tipo lógico   | Reglas de negocio                                                                 | Mapeo prototipo                         |
|--------------------|---------------|-----------------------------------------------------------------------------------|-----------------------------------------|
| salida_id          | INT           | FK a `SALIDA_ACADEMICA`.                                                         | Clave externa lógica.                  |
| estado             | VARCHAR(20)   | `PENDIENTE`, `APROBADO`, `RECHAZADO`.                                            | `sstReview.estado`.                    |
| observaciones      | VARCHAR(1000) | Obligatorio si `RECHAZADO`.                                                      | `sstReview.observaciones`.             |
| placa_vehiculo     | VARCHAR(20)   | Obligatorio si se aprueba.                                                       | `sstReview.placaVehiculo`.            |
| entidad_aseguradora| VARCHAR(150)  | Obligatoria si se aprueba.                                                       | `sstReview.entidadAseguradora`.       |
| numero_poliza      | VARCHAR(50)   | Obligatoria si se aprueba.                                                       | `sstReview.numeroPoliza`.             |
| checklist          | JSON          | Flags de SOAT, tecnomecánica, póliza RC, licencia conductor.                     | `sstReview.checklist.{soat,...}`      |
| reviewedAt         | DATETIME      | Fecha/hora de la revisión SST.                                                   | `sstReview.reviewedAt`.               |
| reviewerEmail      | VARCHAR(150)  | Revisor SST.                                                                      | `sstReview.reviewerEmail`.            |

**Regla de flujo**:  
Cuando `sstReview.estado = 'APROBADO'` ⇒ `salida.estadoAcad = 'APROBADA'`.  
Cuando `sstReview.estado = 'RECHAZADO'` ⇒ `salida.estadoAcad = 'CANCELADA'`.  
Solo se listan en `dashboard-sst.html` las salidas con `requiereSST === true`.

---

### 8. Subtabla lógica `REGISTRO_MOVILIDAD` (dentro de `SOLICITUD`)

- **Descripción**: Información de creación y certificación en Q10 para estudiantes externos entrantes.
- **Correspondencia**: `request.registroInfo`, gestionada en `dashboard-registro.html`.

| Columna            | Tipo lógico   | Reglas de negocio                                                                                             | Mapeo prototipo                        |
|--------------------|---------------|---------------------------------------------------------------------------------------------------------------|----------------------------------------|
| solicitud_id       | INT           | FK a `SOLICITUD`.                                                                                             | Clave externa lógica.                 |
| codigo_q10         | VARCHAR(50)   | Obligatorio para solicitudes entrantes una vez matriculadas.                                                 | `registroInfo.codigoQ10`.             |
| fecha_creacion_q10 | DATETIME      | Fecha/hora en que se crea el estudiante/curso en Q10.                                                        | `registroInfo.fechaCreacionQ10`.      |
| estado_certificado | VARCHAR(20)   | `PENDIENTE`, `EN_PROCESO`, `ENTREGADO`. Inicialmente `PENDIENTE` tras la matrícula.                          | `registroInfo.estadoCertificado`.     |
| tipo_certificado   | VARCHAR(50)   | Tipo principal asociado a la movilidad (`MATRICULA` por defecto).                                            | `registroInfo.tipoCertificado`.       |

**Regla de flujo en Registro (`dashboard-registro.html`)**:

- Bandeja de matrículas:  
  - Fuente: `CUE_MY_REQUESTS` ∪ mocks.  
  - Filtro: `status = 'PENDIENTE_MATRICULA'` y `dir = 'ENTRANTE'`.
  - Acción "Confirmar Matrícula en Q10":  
    - Solicita `codigoQ10` al usuario.  
    - Actualiza la solicitud a:  
      - `status = 'MOVILIDAD_ACTIVA'`.  
      - `registroInfo = { codigoQ10, fechaCreacionQ10: now, estadoCertificado: 'PENDIENTE', tipoCertificado: 'MATRICULA' }`.

- Bandeja de certificados:  
  - Fuente: `CUE_MY_REQUESTS` consolidado.  
  - Filtro: `certRequested === true` y `certStatus !== 'ENTREGADO'`.  
  - Acción "Enviar a Usuario":  
    - Marca `certReady = true`, `certStatus = 'ENTREGADO'`.  
    - Si existe `registroInfo`, actualiza `registroInfo.estadoCertificado = 'ENTREGADO'`.

---

### 9. Resumen de flujos de paneles

- **`dashboard-sst.html`** (SST):
  - Lee `CUE_SALIDAS_ACADEMICAS`.
  - Muestra solo salidas con `requiereSST === true`.  
  - Permite registrar checklist de documentos, datos del vehículo/póliza y estado (`APROBADO` / `RECHAZADO`).  
  - Persiste en `salida.sstReview` y actualiza `salida.estadoAcad` según la regla de flujo anterior.

- **`dashboard-registro.html`** (Registro/Q10):
  - Bandeja 1 – Entrantes por matricular: consume `CUE_MY_REQUESTS` para `ENTRANTE` con `status = 'PENDIENTE_MATRICULA'`.  
  - Al confirmar matrícula: actualiza `status` a `MOVILIDAD_ACTIVA` y crea/actualiza `registroInfo`.  
  - Bandeja 2 – Tickets de certificados: usa `certRequested`, `certStatus`, `certType`, `certObs` y refleja el despacho en `certStatus` y `registroInfo.estadoCertificado`.

