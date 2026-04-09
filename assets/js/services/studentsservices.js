/**
 * Simulacion de base academica (estudiantes por programa y semestre).
 *
 * Modulo ES6 no enlazado actualmente en las paginas HTML. dashboard-acad.html usa su propia lista
 * dbTotalEstudiantes en script inline para el buscador de participantes en salidas.
 */

export const AcademicDB = {
    // Base de datos simulada de estudiantes matriculados
    students: [
        { id: '1094001', name: 'Maria Luisa Londoño', program: 'ING_SOFTWARE', semester: '5', status: 'ACTIVO' },
        { id: '1094002', name: 'Derly Elena Quejada', program: 'ING_SOFTWARE', semester: '7', status: 'ACTIVO' },
        { id: '1094003', name: 'Jeronimo Rodriguez', program: 'ING_SOFTWARE', semester: '5', status: 'ACTIVO' },
        { id: '1094004', name: 'Sara Valentina Sanchez', program: 'ING_SOFTWARE', semester: '5', status: 'ACTIVO' },
        { id: '1094005', name: 'Juan Jose naranjo', program: 'ING_SOFTWARE', semester: '7', status: 'CONDICIONAL' },
        { id: '1094006', name: 'Carlos Augusto Aranzazu', program: 'MEDICINA', semester: '5', status: 'CONDICIONAL' },
        { id: '1094007', name: 'Nicolas Cuervo Ríos', program: 'MEDICINA', semester: '5', status: 'ACTIVO' },
        { id: '1094008', name: 'Valentina Geraldine Barreto', program: 'DERECHO', semester: '8', status: 'ACTIVO' }
    ],

    /**
     * Busca estudiantes por filtro
     */
    getStudentsByCourse: (program, semester) => {
        return new Promise((resolve) => {
            // Simulamos delay de red (500ms)
            setTimeout(() => {
                const results = AcademicDB.students.filter(s => 
                    s.program === program && s.semester === semester
                );
                resolve(results);
            }, 2000);
        });
    }
};