/**
 * Máquina de Estados de Movilidad CUE
 * Patrón: Chain of Responsibility (Secuencial)
 */

const STATES = {
    DRAFT: 'BORRADOR',
    SUBMITTED: 'ENVIADO',
    REVIEW_ANI: 'EN_REVISION_ANI',       // Paso 1: Secretaría
    REVIEW_ACAD: 'EN_REVISION_ACADEMICA', // Paso 2: Coordinador
    REVIEW_SST: 'EN_REVISION_SST',       // Paso 3: Opcional (Solo si hay transporte/riesgo)
    REVIEW_FIN: 'EN_REVISION_FINANCIERA', // Paso 4: Final (Viáticos)
    APPROVED: 'APROBADO',
    REJECTED: 'NO_APROBADO',
    ACTIVE: 'EN_EJECUCION',
    CLOSED: 'CERRADA'
};

class MobilityRequest {
    constructor(data) {
        this.data = data;
        this.status = STATES.SUBMITTED; // Estado inicial al enviar
        this.logs = []; // Para auditoría (RNF-07)
    }

    // El motor que mueve la solicitud
    approve(reviewerRole) {
        this.addLog(`Aprobado por ${reviewerRole}`, 'APROBAR');

        switch (this.status) {
            case STATES.SUBMITTED:
                // Paso 1: ANI aprueba -> Pasa a Académico
                this.status = STATES.REVIEW_ACAD; 
                break;

            case STATES.REVIEW_ACAD:
                // Paso 2: Académico aprueba -> ¿Requiere SST o Pasa a Financiera?
                if (this.requiresSST()) {
                    this.status = STATES.REVIEW_SST;
                } else {
                    this.status = STATES.REVIEW_FIN;
                }
                break;

            case STATES.REVIEW_SST:
                // Paso 3: SST aprueba -> Pasa a Financiera
                this.status = STATES.REVIEW_FIN;
                break;

            case STATES.REVIEW_FIN:
                // Paso 4: Financiera aprueba -> FIN
                this.status = STATES.APPROVED;
                break;
        }
        
        return this.status;
    }

    // Lógica para determinar si entra al bucket de SST
    requiresSST() {
        // Regla: Si es Salida Académica CON Transporte Contratado
        return (this.data.type === 'SALIDA_ACADEMICA' && this.data.hasHiredTransport);
    }

    addLog(action, type) {
        this.logs.push({
            date: new Date(),
            action: action,
            type: type
        });
    }
}