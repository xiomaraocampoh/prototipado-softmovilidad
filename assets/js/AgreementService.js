/**
 * Servicio de Gestión de Convenios
 * Simula la lectura del archivo CONVENIOS.xlsx y aplica reglas de negocio.
 */
class AgreementService {
    constructor() {
        // Datos simulados basados en tu archivo 'CONVENIOS.xlsx - Base de datos.csv'
        this.agreements = [
            { id: 1, entity: 'BERUFSAKADEMIE MOSBACH', country: 'ALEMANIA', type: 'Convenio', status: 'Activo', renewal: 'SI', programs: ['AEM', 'ING DUAL'] },
            { id: 2, entity: 'UNAM', country: 'MEXICO', type: 'Convenio', status: 'Vencido', renewal: 'NO', programs: ['TODOS'] },
            { id: 3, entity: 'CORHUILA', country: 'COLOMBIA', type: 'Alianza', status: 'Activo', renewal: 'Por Escrito', programs: ['VET', 'ING IND'] }
        ];
    }

    /**
     * Busca instituciones habilitadas
     * Regla: Solo muestra 'Activos' o 'Pendiente Firma' (con advertencia)
     */
    searchInstitutions(query) {
        return this.agreements.filter(a => 
            a.entity.toLowerCase().includes(query.toLowerCase()) && 
            a.status !== 'Inoperado'
        );
    }

    /**
     * Valida si un estudiante de un programa específico puede aplicar
     * Basado en las columnas AEM, MED, VET, ING del Excel
     */
    validateEligibility(institutionId, studentProgramCode) {
        const agreement = this.agreements.find(a => a.id === institutionId);
        
        if (!agreement) return { valid: false, message: "Institución no encontrada" };
        
        if (agreement.status === 'Vencido') {
            return { valid: false, warning: true, message: "Convenio Vencido: Requiere gestión previa de la ORI." };
        }

        // Lógica mock para programas (se expandirá con la data real)
        if (!agreement.programs.includes('TODOS') && !agreement.programs.includes(studentProgramCode)) {
            return { valid: false, message: "Este convenio no aplica para su programa académico." };
        }

        return { valid: true };
    }
}

export const agreementService = new AgreementService();