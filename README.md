# Sistema de Gestión de Movilidad Académica y Laboral - CUE
**Prototipo de Alta Fidelidad - Corporación Universitaria Empresarial Alexander von Humboldt**

## 📖 Descripción del Proyecto
Prototipo funcional diseñado para digitalizar, centralizar y optimizar los procesos de movilidad académica (entrante y saliente, nacional e internacional) y salidas académicas de la institución. Este sistema reemplaza la gestión manual, asegura el cumplimiento normativo exigido por el Ministerio de Educación Nacional y facilita la recopilación de datos para el Consejo Nacional de Acreditación (CNA).

## 🛠️ Stack Tecnológico (Prototipo)
- **Frontend:** HTML5 Semántico, Tailwind CSS (CDN).
- **Lógica / Interacciones:** Vanilla JavaScript (ES6+).
- **Persistencia de Datos:** `localStorage` (Simulación de Base de Datos y Backend).
- **Iconografía:** Lucide Icons.

---

## 👥 Roles del Sistema
Según las últimas definiciones operativas, el sistema maneja los siguientes perfiles:

1. **Solicitante Interno:** Estudiante, Profesor no docente, Administrativo, Egresado (Sus datos base vienen de Q10).
2. **Solicitante Externo:** Usuarios de otras instituciones (Sus credenciales son generadas por ANI).
3. **Coordinación Académica:** Encargado de dar el aval académico ("Paz y Salvo") y de *crear* las Salidas Académicas en el sistema.
4. **Secretaría ANI:** Filtro operativo. Realiza pre-aprobación documental, gestiona convenios y crea accesos a externos.
5. **Dirección ANI:** Autoridad de aprobación estratégica y pase a Fase 2 (Legalización) o a Registro (Matrícula).
6. **SST (Seguridad y Salud en el Trabajo):** Validador condicional exclusivo para Salidas Académicas con transporte contratado por la CUE.
7. **Control y Registro:** Ejecutor de creación de estudiantes en módulo Q10 y expedición de certificados (Costo $0).

---

## 📋 Requisitos Funcionales (RF)

### Módulo del Solicitante (Fase 1 y Fase 2)
- **RF-01 Registro de Solicitud:** Permitir registrar solicitudes de movilidad académica saliente y entrante.
- **RF-02 Documentación Inteligente:** Permitir cargar documentación digital filtrada automáticamente según modalidad (Presencial/Virtual), dirección (Entrante/Saliente) y tipo de movilidad.
- **RF-03 Exclusión Virtual (NUEVO):** El sistema debe ocultar campos de seguro médico, vuelos y contactos de emergencia si la movilidad es "Virtual" (Aplica solo para Intercambio y Estancia de Investigación).
- **RF-04 Trazabilidad:** Permitir al solicitante consultar el estado de su trámite en tiempo real y guardar "Borradores".
- **RF-05 Solicitud de Certificados:** Permitir solicitar certificados académicos (notas, estudio) marcándolos automáticamente con un valor de $0 COP si la movilidad está "ACTIVA".
- **RF-06 Consentimiento Informado:** Obligar la aceptación de la política de datos y la descarga/carga del formato de responsabilidad firmado.

### Módulo de Coordinación Académica
- **RF-07 Aval Académico (NUEVO):** El sistema debe requerir la validación ("Paz y Salvo") del Director/Coordinador de programa antes de que la solicitud pase a la oficina ANI.
- **RF-08 Creación de Salidas Académicas (NUEVO):** El Coordinador debe ser el único rol con capacidad de "Crear" una salida académica grupal, indicando si requiere o no transporte de la universidad.

### Módulo de Oficina ANI (Secretaría y Dirección)
- **RF-09 Pre-Aprobación (Secretaría):** Permitir a la Secretaría realizar una revisión documental inicial, devolviendo (subsanación) o pasando el expediente a Dirección.
- **RF-10 Accesos Externos (NUEVO):** Permitir a la Secretaría generar un acceso temporal (usuario y contraseña aleatoria) que simule un envío por correo electrónico a aspirantes externos.
- **RF-11 Gestión de Catálogos:** Permitir a ANI administrar (crear/inhabilitar) la base de datos de Instituciones con Convenio, Programas Académicos y Tipos de Movilidad.
- **RF-12 Aprobación Final (Dirección):** Permitir a la Dirección ANI otorgar el visto bueno definitivo para derivar el proceso a Fase 2 (Legalización) o a Control y Registro.

### Módulo de Riesgos / SST
- **RF-13 Intervención Condicional (NUEVO):** El sistema solo debe notificar y requerir aprobación de SST si el tipo de movilidad es "Visita/Salida Académica" Y el transporte es suministrado/contratado por la Universidad. Si el viaje es por medios propios, SST no interviene.
- **RF-14 Checklist Operativo:** Permitir a SST validar documentación de vehículos (SOAT, Tecnomecánica, Pólizas, Licencia) cargada por la coordinación o secretaría.

### Módulo de Control y Registro
- **RF-15 Integración Q10 (Simulada):** Notificar al área cuando una movilidad entrante es aprobada por Dirección ANI para que el estudiante sea creado manualmente en el módulo "Movilidad" de Q10, permitiéndole matricular materias sin prerrequisitos.

### Aseguramiento de la Calidad (CNA)
- **RF-16 Reportes Estadísticos:** Permitir la extracción de métricas de movilidad segmentadas por programa, tipo (nacional/internacional) y rol (estudiantes, profesores no docentes) para reportes del CNA.

---

## ⚙️ Requisitos No Funcionales (RNF)
- **RNF-01 Seguridad y Roles:** Autenticación y autorización estricta basada en roles (RBAC).
- **RNF-02 Terminología Legal (NUEVO):** Todo texto en la interfaz debe ajustarse a las normativas del Ministerio, reemplazando el uso de "Docente" por "Profesor" o "Profesor no docente".
- **RNF-03 Accesibilidad:** Acceso vía navegador web compatible con dispositivos móviles y escritorio (Responsive Design).
- **RNF-04 Disponibilidad:** El sistema debe estar disponible 24/7 (99.5% de Uptime) para no bloquear postulaciones internacionales por diferencias horarias.
- **RNF-05 Cumplimiento:** Adherencia estricta a la Política de Tratamiento de Datos Personales (Acuerdo No. 001 de 2017).

---

## 🔄 Máquina de Estados del Proceso
Las solicitudes fluyen a través de los siguientes estados principales almacenados en el motor del sistema:
1. `BORRADOR` (Incompleto por el usuario).
2. `EN_REVISION_COORDINACION` (Aval de homologación).
3. `EN_REVISION_POSTULACION` (Bandeja Secretaría ANI).
4. `PENDIENTE_DIRECCION_ANI` (Bandeja Dirección ANI).
5. `APROBADA_POSTULACION` (Habilita Fase 2 para Salientes).
6. `EN_REVISION_LEGALIZACION` (Documentos finales de viaje).
7. `PENDIENTE_MATRICULA` (Para Entrantes en Control y Registro).
8. `MOVILIDAD_ACTIVA` (Aprobación total y ejecución).

---

## 🚀 Guía de Ejecución (Local)
Para levantar este prototipo en una máquina local:
1. Clonar el repositorio.
2. Abrir el archivo `index.html` en cualquier navegador moderno (preferiblemente usando una extensión como *Live Server* en VSCode).
3. Utilizar las credenciales de prueba pre-configuradas en el archivo `assets/js/auth.js` para acceder a los distintos perfiles de usuario.
4. *Nota:* Para limpiar los datos, borre la caché local (`localStorage.clear()`) en las herramientas de desarrollador del navegador.