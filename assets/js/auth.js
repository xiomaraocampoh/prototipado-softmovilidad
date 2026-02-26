/**
 * Servicio de Autenticación y Gestión de Roles
 * Definición estricta según requerimientos del SRS y estructura jerárquica
 */

const ROLES = {
    // Solicitantes Internos (RF-01: en UI solo "Profesor"; code DOCENTE es interno)
    ESTUDIANTE: { code: 'ESTUDIANTE', redirect: 'dashboard-estudiante.html', name: 'Estudiante CUE' },
    DOCENTE: { code: 'DOCENTE', redirect: 'dashboard-estudiante.html', name: 'Profesor / Investigador' },
    COLABORADOR: { code: 'COLABORADOR', redirect: 'dashboard-estudiante.html', name: 'Colaborador Administrativo' },
    EGRESADO: { code: 'EGRESADO', redirect: 'dashboard-estudiante.html', name: 'Egresado' },
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
    { email: 'administrativo@cue.edu.co', pass: '123', role: ROLES.COLABORADOR, name: 'Colaborador CUE' },
    { email: 'egresado@cue.edu.co', pass: '123', role: ROLES.EGRESADO, name: 'Egresado CUE' },
    { email: 'rector@cue.edu.co', pass: '123', role: ROLES.RECTOR, name: 'Rectoría CUE' },
    { email: 'externo@unam.mx', pass: '123', role: ROLES.EXTERNO, name: 'Carlos (UNAM)' },
    { email: 'secretaria.ani@cue.edu.co', pass: 'admin', role: ROLES.ANI_SECRETARIA, name: 'Secretaría ANI' },
    { email: 'direccion.ani@cue.edu.co', pass: 'admin', role: ROLES.ANI_DIRECCION, name: 'Dirección ANI' },
    { email: 'coordinacion.acad@cue.edu.co', pass: 'admin', role: ROLES.COORD_ACAD, name: 'Coordinación Académica' },
    { email: 'sst@cue.edu.co', pass: 'admin', role: ROLES.SST, name: 'Gestor SST' },
    { email: 'registro@cue.edu.co', pass: 'admin', role: ROLES.REGISTRO, name: 'Registro y Control' }
];

const LS_KEYS = {
    authUser: 'CUE_AUTH_USER',
    portalCodes: 'CUE_PORTAL_CODES'
};

function safeParseObject(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return {};
        const data = JSON.parse(raw);
        return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    } catch {
        return {};
    }
}

function setAuthUser(user) {
    localStorage.setItem(LS_KEYS.authUser, JSON.stringify(user));
}

function gen4DigitCode() {
    return String(Math.floor(Math.random() * 9000) + 1000);
}

function isBackofficeRoleCode(code) {
    return [
        ROLES.ANI_SECRETARIA.code,
        ROLES.ANI_DIRECCION.code,
        ROLES.COORD_ACAD.code,
        ROLES.SST.code,
        ROLES.REGISTRO.code
    ].includes(code);
}

function inferPortalRoleByEmail(email) {
    const e = String(email || '').trim().toLowerCase();
    const mock = MOCK_USERS.find(u => u.email === e);
    if (mock) return mock.role;
    if (e.endsWith('@cue.edu.co')) return ROLES.ESTUDIANTE;
    return ROLES.EXTERNO;
}

const AuthService = {
    // =========================
    // 1) Portal CUE (Solicitantes) – código de acceso de 4 dígitos
    // =========================
    requestPortalCode: function(email, opts = {}) {
        const e = String(email || '').trim().toLowerCase();
        if (!e || !e.includes('@')) {
            return { success: false, message: 'Ingrese un correo válido' };
        }

        const codes = safeParseObject(LS_KEYS.portalCodes);
        const reuseLast = opts.reuseLast === true;
        if (reuseLast && codes[e]?.code) {
            return { success: true, code: codes[e].code, reused: true };
        }

        const code = gen4DigitCode();
        codes[e] = { code, createdAt: new Date().toISOString() };
        localStorage.setItem(LS_KEYS.portalCodes, JSON.stringify(codes));
        return { success: true, code, reused: false };
    },

    loginPortal: function(email, code) {
        const e = String(email || '').trim().toLowerCase();
        const c = String(code || '').trim();
        if (!e || !e.includes('@')) return { success: false, message: 'Ingrese un correo válido' };
        if (!/^\d{4}$/.test(c)) return { success: false, message: 'El código debe tener 4 dígitos' };

        const codes = safeParseObject(LS_KEYS.portalCodes);
        const stored = codes[e];
        if (!stored || stored.code !== c) {
            return { success: false, message: 'Código incorrecto o no generado' };
        }

        delete codes[e];
        localStorage.setItem(LS_KEYS.portalCodes, JSON.stringify(codes));

        const role = inferPortalRoleByEmail(e);
        const mock = MOCK_USERS.find(u => u.email === e);
        setAuthUser({
            email: e,
            name: mock?.name || e,
            role
        });
        return { success: true, redirect: role.redirect };
    },

    // =========================
    // 2) Back-office (Gestión) – credenciales
    // =========================
    loginBackoffice: function(email, password) {
        const e = String(email || '').trim().toLowerCase();
        const p = String(password || '').trim();
        const user = MOCK_USERS.find(u => u.email === e && u.pass === p && isBackofficeRoleCode(u.role.code));
        if (user) {
            setAuthUser({
                email: user.email,
                name: user.name,
                role: user.role
            });
            return { success: true, redirect: user.role.redirect };
        }
        return { success: false, message: 'Credenciales incorrectas' };
    },

    logout: function() {
        const userStr = localStorage.getItem(LS_KEYS.authUser);
        let isBackoffice = false;
        try {
            const u = userStr ? JSON.parse(userStr) : null;
            isBackoffice = Boolean(u?.role?.code && isBackofficeRoleCode(u.role.code));
        } catch {}

        localStorage.removeItem(LS_KEYS.authUser);
        const isInModules = window.location.pathname.indexOf('modules/') !== -1;
        const prefix = isInModules ? '../' : '';
        window.location.href = prefix + (isBackoffice ? 'index-sistema.html' : 'index.html');
    },

    checkAuth: function(opts = {}) {
        const userStr = localStorage.getItem(LS_KEYS.authUser);
        if (!userStr) {
            if (opts.redirectTo) window.location.href = opts.redirectTo;
            else window.location.href = '../index.html';
            return null;
        }
        return JSON.parse(userStr);
    }
};

window.AuthService = AuthService;