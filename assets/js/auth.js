/**
 * Servicio de Autenticación y Gestión de Roles
 * Definición estricta según requerimientos del SRS y estructura jerárquica
 */

const ROLES = {
    // Solicitantes Internos
    ESTUDIANTE: { code: 'ESTUDIANTE', redirect: 'dashboard-estudiante.html', name: 'Estudiante CUE' },
    DOCENTE: { code: 'DOCENTE', redirect: 'dashboard-estudiante.html', name: 'Profesor / Investigador' },
    COLABORADOR: { code: 'COLABORADOR', redirect: 'dashboard-estudiante.html', name: 'Colaborador Administrativo' },
    RECTOR: { code: 'RECTOR', redirect: 'dashboard-estudiante.html', name: 'Rectoría' },
    
    // Solicitantes Externos
    EXTERNO: { code: 'EXTERNO', redirect: 'dashboard-estudiante.html', name: 'Usuario Externo (Entrante)' },
    
    // Perfiles Administrativos (Revisores)
    ANI_SECRETARIA: { code: 'ANI_SECRETARIA', redirect: 'dashboard-ani.html', name: 'Secretaría ANI (Pre-revisión)' },
    ANI_DIRECCION: { code: 'ANI_DIRECCION', redirect: 'dashboard-ani.html', name: 'Dirección ANI (Aprobación Final)' },
    COORD_ACAD: { code: 'COORD_ACAD', redirect: 'dashboard-acad.html', name: 'Coordinación Académica' },
    SST: { code: 'SST', redirect: 'dashboard-sst.html', name: 'Seguridad y Salud en el Trabajo' },
    REGISTRO: { code: 'REGISTRO', redirect: 'dashboard-registro.html', name: 'Control y Registro Académico' }
};

const MOCK_USERS = [
    { email: 'estudiante@cue.edu.co', pass: '123', role: ROLES.ESTUDIANTE, name: 'Xiomara Ocampo' },
    { email: 'docente@cue.edu.co', pass: '123', role: ROLES.DOCENTE, name: 'Ing. Arlex' },
    { email: 'rector@cue.edu.co', pass: '123', role: ROLES.RECTOR, name: 'Rectoría CUE' },
    { email: 'externo@unam.mx', pass: '123', role: ROLES.EXTERNO, name: 'Carlos (UNAM)' },
    { email: 'secretaria.ani@cue.edu.co', pass: 'admin', role: ROLES.ANI_SECRETARIA, name: 'Secretaría ANI' },
    { email: 'direccion.ani@cue.edu.co', pass: 'admin', role: ROLES.ANI_DIRECCION, name: 'Dirección ANI' },
    { email: 'coordinacion.acad@cue.edu.co', pass: 'admin', role: ROLES.COORD_ACAD, name: 'Coordinación Académica' },
    { email: 'sst@cue.edu.co', pass: 'admin', role: ROLES.SST, name: 'Gestor SST' },
    { email: 'registro@cue.edu.co', pass: 'admin', role: ROLES.REGISTRO, name: 'Registro y Control' }
];

const AuthService = {
    login: function(email, password) {
        const user = MOCK_USERS.find(u => u.email === email && u.pass === password);
        if (user) {
            localStorage.setItem('CUE_AUTH_USER', JSON.stringify({
                email: user.email,
                name: user.name,
                role: user.role
            }));
            return { success: true, redirect: user.role.redirect };
        }
        return { success: false, message: 'Credenciales institucionales incorrectas' };
    },

    logout: function() {
        localStorage.removeItem('CUE_AUTH_USER');
        window.location.href = '../index.html';
    },

    checkAuth: function() {
        const userStr = localStorage.getItem('CUE_AUTH_USER');
        if (!userStr) {
            window.location.href = '../index.html';
            return null;
        }
        return JSON.parse(userStr);
    }
};

window.AuthService = AuthService;