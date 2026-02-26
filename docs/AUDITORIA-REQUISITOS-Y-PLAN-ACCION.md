# Auditoría de Requisitos Funcionales – Sistema de Gestión de Movilidad CUE

**Fecha:** 26/02/2026  
**Alcance:** Prototipo de alta fidelidad (HTML5, Tailwind, Vanilla JS, localStorage)  
**Referencia:** SRS, actas y normativa MINEDUCACIÓN / CNA  

---

## 1. CHECKLIST DE REQUISITOS CUMPLIDOS

| ID | Requisito | Estado | Evidencia en código |
|----|-----------|--------|---------------------|
| **RF-02** | Gestión de roles (Solicitantes vs Gestores) y accesos automáticos | ✅ **Cumplido** | `auth.js`: ROLES (ESTUDIANTE, DOCENTE, COLABORADOR, EGRESADO, RECTOR, EXTERNO, ANI_SECRETARIA, ANI_DIRECCION, COORD_ACAD, SST, REGISTRO). Login Portal y Backoffice asignan rol; redirección por rol. |
| **RF-03** | Asignación automática de rol por correo; dominio ≠ @cue.edu.co → EXTERNO | ✅ **Cumplido** | `auth.js`: `inferPortalRoleByEmail()` — si no está en MOCK_USERS y no termina en `@cue.edu.co` → ROLES.EXTERNO. |
| **RF-04** | Formulario dinámico: modalidad Virtual oculta seguro, vuelos, alojamiento, contacto emergencia | ✅ **Cumplido** | `wizard-logic.js` `updateFields()`: `document.querySelectorAll('.req-presencial').forEach(el => el.classList.toggle('hidden', !isPre))`. `mobility-wizard.html`: bloques con clase `req-presencial` (Fecha Ida/Regreso, Dir. Residencia, Riesgos/EPS, Contacto Emergencia). |
| **RF-05** | Certificados desde dashboard; movilidad activa → costo $0 COP | ✅ **Parcial** | `dashboard-estudiante.html`: modal de certificados, texto "Al tener una movilidad en estado ACTIVO... $0 COP". Botón "Pedir Certificado" según estado. Lógica no diferencia precio según estado (siempre se muestra $0); mensaje de beneficio sí está. |
| **RF-06** | Aval académico (Paz y Salvo): coordinador aprueba plan homologación antes de ANI | ✅ **Cumplido** | `dashboard-acad.html`: pestaña "Movilidad viable académicamente", tabla de solicitudes con `academicReview.estado` (PENDIENTE/APROBADO/RECHAZADO), modal con plan de homologación y observaciones. Flujo: solicitudes EN APROBADA_POSTULACION pendientes de revisión académica. |
| **RF-07** | Solo Coordinación Académica crea Salidas Académicas; asigna profesor y lista estudiantes | ✅ **Cumplido** | `dashboard-acad.html`: pestaña "Salidas Académicas", formulario de creación (nombre, tipo, destino, fechas, profesor responsable, participantes). `wizard-logic.js` y wizard impiden crear "Visita/Salida Académica" desde solicitante. |
| **RF-08** | Al crear Salida Académica: pregunta "¿Transporte suministrado por la Universidad?" | ✅ **Cumplido** | `dashboard-acad.html`: radio "Suministrado por la universidad" / "Medios propios" con textos que indican activación de SST o no. |
| **RF-09** | Si transporte SÍ: salida a revisión SST con checklist (SOAT, tecnomecánica, pólizas, licencia) | ✅ **Cumplido** | `dashboard-acad.html` `createSalida()`: `requiereSST = transporte === 'UNIVERSIDAD'`, `estadoAcad: requiereSST ? 'EN_REVISION_SST' : 'APROBADA'`. `dashboard-sst.html`: checklist SOAT, Revisión Tecnomecánica, Póliza RC, Licencia y Planilla SS Conductor; aprobación/rechazo con trazabilidad. |
| **RF-10** | Si transporte NO: bypass SST; salida aprobada académicamente | ✅ **Cumplido** | `dashboard-acad.html`: `estadoAcad: requiereSST ? 'EN_REVISION_SST' : 'APROBADA'`; mensaje "Al ser por medios propios, no requiere revisión SST.". SST solo filtra `requiereSST === true`. |
| **RF-11** | Secretaría ANI: revisión documental; catálogo programas, tipos movilidad, convenios | ✅ **Parcial** | Bandeja documental y pestañas Convenios, Programas, Tipos Movilidad en `dashboard-ani.html`. Tabla ANI filtra por rol. Convenios: formulario "Nuevo Convenio" hace `alert('Convenio registrado.')` y `preventDefault` — **no persiste en localStorage**. Programas/Tipos usan `CUE_PROGRAMAS` y `CUE_TIPOS_MOVILIDAD` (listas con IDs que no coinciden con el HTML actual de la tabla estática). |
| **RF-12** | Secretaría ANI: "Generar credenciales" para externos (simula envío usuario/clave temporal) | ✅ **Cumplido** | `dashboard-ani.html`: pestaña "Accesos Externos", formulario nombre/correo/institución; función `generarAccesoExterno` (en script) genera contraseña aleatoria y alert con mensaje simulado de envío. Formulario en tab-credenciales usa `onsubmit` con alert; existe también lógica JS con `extName`, `extEmail`, `extInst` (IDs no vinculados al form actual). |
| **RF-13** | Dirección ANI: aprobación final → Fase 2 (Legalización) o aprobación total; entrante → Registro | ✅ **Cumplido** | `dashboard-ani.html` `openReview()`: Dirección ANI ve botón "Aprobar y Enviar a Registro (Matrícula)" si `dir === 'ENTRANTE'` (status → PENDIENTE_MATRICULA) o "Aprobar Postulación (Pasa a Fase 2)" si saliente (→ APROBADA_POSTULACION). `processRequest()` actualiza `CUE_MY_REQUESTS`. |
| **RF-14** | Entrantes aprobados por Dirección ANI llegan a bandeja de Control y Registro | ✅ **Cumplido** | `dashboard-registro.html`: `loadRegistroDashboards()` filtra `req.status === 'PENDIENTE_MATRICULA' && req.dir === 'ENTRANTE'` y muestra "Entrantes por Matricular" con botón "Confirmar Matrícula Exitosa en Q10". |
| **RF-15** | Registro: interfaz para recibir entrantes y simular creación en módulo Movilidad Q10 | ✅ **Cumplido** | `dashboard-registro.html`: `confirmMatricula(id)` pide código Q10, actualiza request a MOVILIDAD_ACTIVA y guarda `registroInfo` (codigoQ10, fechaCreacionQ10). Texto "Creación de usuario en Q10 y asignación de materias". |
| **RF-16** | Reportes estadísticos exportables (salientes vs entrantes, por programa) para CNA | ❌ **No implementado** | No existe vista ni submódulo de reportes. README menciona RF-16 y CNA; no hay tabla, gráficos ni export (CSV/Excel) en el código. |

---

## 2. CHECKLIST DE REQUISITOS NO CUMPLIDOS O INCOMPLETOS

| ID | Requisito | Estado | Detalle |
|----|-----------|--------|---------|
| **RF-01** | **Nunca usar "Docente"; usar "Profesor" | ❌ **Incumplido** | Encontrado: `auth.js` ROLES.DOCENTE y MOCK_USERS `docente@cue.edu.co`; `dashboard-estudiante.html` "Salida Académica / Eventos (Docente)", "guiada por un docente", opción "Docente / Investigador" en perfil; `dashboard-sst.html` "el docente responsable"; `portal-cue.html` array `portalCodes` incluye `'DOCENTE'`. `index.html` botón demo ya dice "Profesor" (correcto). |
| **RF-05** | Certificados: costo $0 solo si movilidad activa | ⚠️ **Incompleto** | El modal siempre muestra "$ 0 COP". No hay lógica que calcule monto según estado (ej. otro valor cuando no está activa) ni validación que restrinja el beneficio $0 a movilidades activas. |
| **RF-11** | Catálogo convenios operativo | ⚠️ **Incompleto** | Formulario de nuevo convenio no persiste en `CUE_CONVENIOS`. Wizard lee `CUE_CONVENIOS`; si está vacío usa array por defecto. Falta: submit que haga `localStorage.setItem('CUE_CONVENIOS', ...)` y liste convenios desde storage. |
| **RF-11** | Flujo Solicitud → Bandeja ANI | ⚠️ **Incompleto** | Wizard asigna al radicar: saliente → `EN_REVISION_POSTULACION`, entrante → `EN_REVISION_TOTAL`. ANI Secretaría filtra `status === 'EN_REVISION_SECRETARIA_ANI'`. Las solicitudes nuevas nunca aparecen en bandeja Secretaría. Opciones: (a) al radicar saliente usar `EN_REVISION_SECRETARIA_ANI`, o (b) en ANI incluir también `EN_REVISION_POSTULACION` para Secretaría. |
| **RF-16** | Reportes CNA | ❌ **No implementado** | Ver tabla anterior. |

---

## 3. RESUMEN EJECUTIVO

- **Totalmente cumplidos:** 11 requisitos (RF-02, RF-03, RF-04, RF-06, RF-07, RF-08, RF-09, RF-10, RF-12, RF-13, RF-14, RF-15).
- **Parcialmente cumplidos / pequeños ajustes:** 3 (RF-05 precio según estado; RF-11 persistencia convenios + flujo de estados ANI).
- **Incumplidos:** 2 (RF-01 terminología "Docente"; RF-16 reportes estadísticos).

---

## 4. PLAN DE ACCIÓN (ORDEN TÉCNICO RECOMENDADO)

### Fase 1: Cumplimiento normativo y consistencia (RF-01)

1. **auth.js**  
   - Mantener código interno `DOCENTE` si se desea (clave técnica), pero en todo lo que ve el usuario usar "Profesor".  
   - Cambiar `ROLES.DOCENTE.name` a `"Profesor / Investigador"` (o "Profesor no docente").  
   - En MOCK_USERS se puede mantener `docente@cue.edu.co` como valor de login; no se muestra como etiqueta.

2. **dashboard-estudiante.html**  
   - Reemplazar "Salida Académica / Eventos (Docente)" → "Salida Académica / Eventos (Profesor)".  
   - Reemplazar "guiada por un docente" → "guiada por un profesor".  
   - En select de rol externo: cambiar opción "Docente / Investigador" → "Profesor / Investigador" o "Profesor no docente / Investigador".

3. **dashboard-sst.html**  
   - Reemplazar en el texto del alert "el docente responsable" → "el profesor responsable".

4. **portal-cue.html**  
   - En el array de códigos de rol, si se usa para etiquetas, evitar mostrar "Docente"; si es solo código, dejar `DOCENTE` y asegurar que en ningún otro lugar se muestre "Docente" al usuario.

5. **Búsqueda global**  
   - Ejecutar búsqueda por "Docente" y "docente" en interfaces (HTML, textos de alert, placeholders) y reemplazar por "Profesor" o "Profesor no docente" según contexto. No cambiar correos de demo (`docente@cue.edu.co`) si son solo identificadores.

---

### Fase 2: Flujo ANI y catálogos (RF-11)

6. **Estados al radicar (wizard)**  
   - En `wizard-logic.js`, en `submit()`, para solicitudes **salientes** usar estado inicial para ANI: p. ej. `EN_REVISION_SECRETARIA_ANI` en lugar de `EN_REVISION_POSTULACION`, **o** en `dashboard-ani.html` en `loadTable()` incluir para ANI_SECRETARIA: `req.status === 'EN_REVISION_SECRETARIA_ANI' || req.status === 'EN_REVISION_POSTULACION'`.  
   - Definir en un único lugar la secuencia de estados (ej. documento de flujo o constante en `state.js`) para no duplicar cadenas.

7. **Persistencia de convenios (dashboard-ani.html)**  
   - Dar IDs al formulario de "Nuevo Convenio" (ej. `extName` no aplica; usar `convNombre`, `convPais`, `convCiudad`, `convVigencia`).  
   - En el `onsubmit`: leer valores, armar objeto `{ nombre, pais, ciudad, vigencia }`, leer `CUE_CONVENIOS` de localStorage (array), hacer push y `localStorage.setItem('CUE_CONVENIOS', JSON.stringify(...))`.  
   - Cargar la tabla de convenios desde `CUE_CONVENIOS` (y opcionalmente datos por defecto si está vacío) para que la lista sea dinámica.

8. **Opcional: programas y tipos**  
   - Si las tablas de Programas y Tipos Movilidad deben ser editables desde ANI, conectar con `CUE_PROGRAMAS` y `CUE_TIPOS_MOVILIDAD` y asegurar que los IDs del HTML (ej. `listaProgramas`, `listaTiposMovilidad`) existan y que `cargarProgramas()` y `cargarTiposMovilidad()` se ejecuten en la pestaña correspondiente.

---

### Fase 3: Certificados (RF-05)

9. **dashboard-estudiante.html**  
   - En `confirmCertRequest()`: antes de fijar "PAGADO", comprobar si la solicitud asociada tiene `status === 'MOVILIDAD_ACTIVA'`.  
   - Si está activa: mantener total $0 y mensaje actual.  
   - Si no está activa: opcionalmente mostrar otro monto (ej. desde constante o campo) y guardar en el objeto de la solicitud un campo `certMonto` para trazabilidad.  
   - En el modal de certificados: si se abre con `reqId`, leer de `CUE_MY_REQUESTS` el estado de esa solicitud y mostrar "Total: $ 0 COP (movilidad activa)" o "Total: $ X COP" según corresponda.

---

### Fase 4: Reportes CNA (RF-16)

10. **Nueva vista de reportes**  
    - Crear `modules/reportes-movilidad.html` (o `dashboard-reportes.html`) accesible solo para roles permitidos (ej. Dirección ANI, o un rol "REPORTES").  
    - Incluir:  
      - Contadores o tarjetas: total salientes, total entrantes, por tipo de movilidad, por programa (si está en el modelo de datos).  
      - Origen de datos: `CUE_MY_REQUESTS` y, si aplica, `CUE_SALIDAS_ACADEMICAS`.  
      - Filtros por rango de fechas, tipo, dirección (entrante/saliente).  

11. **Exportación**  
    - Añadir botón "Exportar CSV" (o "Exportar Excel" con librería ligera): construir tabla a partir de los datos filtrados (id, fecha, tipo, dirección, estado, usuario, programa si existe) y descargar archivo (Data URI o Blob).  
    - Opcional: segundo botón "Exportar resumen" con totales por tipo/dirección/programa para pares CNA.

12. **Menú**  
    - En `menu-sistema.html` (y/o en dashboard ANI) añadir enlace "Reportes de movilidad" → `modules/reportes-movilidad.html`.  
    - En la página de reportes, usar `AuthService.checkAuth()` y comprobar rol; si no autorizado, redirigir a menú o login.

---

### Fase 5: Pruebas y cierre

13. **Flujo completo**  
    - Recorrer: Portal CUE → Nueva postulación (saliente) → Radicar → Acceso Backoffice Secretaría ANI → Ver solicitud en bandeja → Pre-aprobar → Dirección ANI → Aprobar Fase 2 → Coordinación Académica → Paz y Salvo → (opcional) Salida con transporte → SST.  
    - Recorrer: Entrante → Dirección ANI → Aprobar a Registro → Control y Registro → Confirmar matrícula Q10.  
    - Verificar que no quede texto "Docente" visible y que certificados y reportes se comporten según lo implementado.

14. **Documentación**  
    - Actualizar README o documento de despliegue con: enlace a reportes, roles que los ven, y que RF-01 está cubierto en interfaz.

---

## 5. DEPENDENCIAS ENTRE TAREAS

- Fase 1 (RF-01) es independiente; puede hacerse primero.  
- Fase 2 (RF-11) desbloquea que las solicitudes lleguen a ANI y que los convenios estén operativos.  
- Fase 3 (RF-05) depende solo del dashboard del solicitante.  
- Fase 4 (RF-16) puede desarrollarse en paralelo; solo requiere leer los mismos localStorage.  
- Fase 5 aplica al final.

---

*Documento generado a partir del análisis del código en el repositorio cue-movilidad-root (index.html, index-sistema.html, portal-cue.html, menu-sistema.html, modules/*.html, assets/js/auth.js, state.js, wizard-logic.js, dashboard-*.html, AgreementService.js).*
