/**
 * Auth & Router Service - CUE Movilidad
 * Gestiona sesiones y redirecciona según el rol.
 */

const ROLES = {
    CSI: { code: 'ADMIN', redirect: 'dashboard-csi.html', name: 'Admin Técnico' },
    ANI: { code: 'ANI', redirect: 'dashboard-ani.html', name: 'Secretaría Movilidad' },
    ACAD: { code: 'COORDINADOR', redirect: 'dashboard-acad.html', name: 'Coord. Académico' },
    DOCENTE: { code: 'DOCENTE', redirect: 'dashboard-estudiante.html', name: 'Docente Líder' }, // Redirige al dashboard también
    ESTUDIANTE: { code: 'ESTUDIANTE', redirect: 'dashboard-estudiante.html', name: 'Estudiante' } // <--- CAMBIO CLAVE AQUÍ
};

// Base de usuarios simulada 
const MOCK_USERS = [
    { email: 'ani@cue.edu.co', pass: 'admin', role: ROLES.ANI },
    { email: 'coord@cue.edu.co', pass: 'admin', role: ROLES.ACAD, faculty: 'Ingeniería' },
    { email: 'juan@cue.edu.co', pass: '123', role: ROLES.ESTUDIANTE, name: 'Juan Pérez' }
];

const AuthService = {
    login: (email, password) => {
        const user = MOCK_USERS.find(u => u.email === email && u.pass === password);
        
        if (user) {
            // Guardar sesión
            localStorage.setItem('CUE_SESSION', JSON.stringify(user));
            return { success: true, redirect: user.role.redirect };
        }
        return { success: false, message: 'Credenciales inválidas' };
    },

    logout: () => {
        localStorage.removeItem('CUE_SESSION');
        // Ajustar la ruta dependiendo de si estamos en /modules o en la raíz
        const path = window.location.pathname.includes('/modules/') ? '../index.html' : 'index.html';
        window.location.href = path;
    },

    // Verifica si hay sesión al cargar la página
    checkAuth: () => {
        const session = JSON.parse(localStorage.getItem('CUE_SESSION'));
        if (!session) {
            // Si no hay sesión y no estamos en el login, sacar al usuario
            if (!window.location.href.includes('index.html')) {
                window.location.href = '../index.html';
            }
        }
        return session;
    }
};