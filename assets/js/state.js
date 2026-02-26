/**
 * Estados estandarizados del flujo de movilidad (CUE).
 * Referencia única para wizard, ANI, Coordinación, SST y Registro.
 * Evita desfases entre "lo que guarda el wizard" y "lo que filtra cada bandeja".
 */
const STATUS = {
    // Radicado: lo ve Coordinación (Paz y Salvo)
    PENDIENTE_PAZ_SALVO: 'PENDIENTE_PAZ_SALVO',
    // Sinónimos usados en código actual (mapeo para compatibilidad)
    APROBADA_POSTULACION: 'APROBADA_POSTULACION',   // ANI aprobó → Coord revisa académicamente
    EN_REVISION_DIRECCION_ANI: 'EN_REVISION_DIRECCION_ANI',
    // Revisión ANI
    EN_REVISION_SECRETARIA_ANI: 'EN_REVISION_SECRETARIA_ANI',
    EN_REVISION_TOTAL: 'EN_REVISION_TOTAL',
    // Post-aprobación
    PENDIENTE_MATRICULA: 'PENDIENTE_MATRICULA',     // Entrante → Registro matricula
    APROBADA_POSTULACION_FASE2: 'APROBADA_POSTULACION', // Saliente → Fase 2 documentos
    MOVILIDAD_ACTIVA: 'MOVILIDAD_ACTIVA',
    EN_REVISION_LEGALIZACION: 'EN_REVISION_LEGALIZACION',
    BORRADOR: 'BORRADOR',
    RECHAZADO: 'RECHAZADO'
};

/** Estados que muestra Coordinación en Paz y Salvo (solicitudes salientes ya aprobadas por ANI) */
const STATUS_COORD_PAZ_SALVO = [STATUS.APROBADA_POSTULACION, STATUS.EN_REVISION_DIRECCION_ANI];

/** Estados que muestra Secretaría ANI */
const STATUS_ANI_SECRETARIA = [STATUS.EN_REVISION_SECRETARIA_ANI];

/** Estados que muestra Dirección ANI */
const STATUS_ANI_DIRECCION = [STATUS.EN_REVISION_DIRECCION_ANI, STATUS.EN_REVISION_TOTAL];

if (typeof window !== 'undefined') {
    window.STATUS = STATUS;
    window.STATUS_COORD_PAZ_SALVO = STATUS_COORD_PAZ_SALVO;
    window.STATUS_ANI_SECRETARIA = STATUS_ANI_SECRETARIA;
    window.STATUS_ANI_DIRECCION = STATUS_ANI_DIRECCION;
}
