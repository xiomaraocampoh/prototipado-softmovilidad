/**
 * Autenticacion y roles — punto unico de entrada de sesion para todo el prototipo.
 *
 * Flujo portal: requestPortalCode genera un codigo de 4 digitos por correo (localStorage CUE_PORTAL_CODES);
 * loginPortal valida el codigo, elimina el token de un solo uso y guarda CUE_AUTH_USER.
 * Correos externos (no @cue.edu.co) solo reciben codigo y sesion si estan en MOCK_USERS o fueron aprobados
 * en la bandeja ANI (CUE_PORTAL_USUARIOS_EXTERNO), alineado con el formulario de solicitud en index.html.
 *
 * Flujo backoffice: loginBackoffice compara email/contrasena con MOCK_USERS y solo acepta roles
 * ANI_*, COORD_ACAD, SST, REGISTRO (isBackofficeRoleCode). Tras login, mismo CUE_AUTH_USER.
 *
 * La app no usa cookies ni servidor; cualquier dashboard comprueba la sesion leyendo CUE_AUTH_USER
 * o llamando checkAuth({ redirectTo: '...' }).
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
    REGISTRO: { code: 'REGISTRO', redirect: 'dashboard-miscelanea.html', name: 'Control y Registro Académico' }
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
    portalCodes: 'CUE_PORTAL_CODES',
    // Usuarios externos aprobados por ANI (bandeja en dashboard-ani); sin esto, correos no @cue.edu.co no entran al portal salvo MOCK_USERS.
    portalApprovedExternos: 'CUE_PORTAL_USUARIOS_EXTERNO'
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

function safeParseArray(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

/** Listado persistente de externos con acceso al portal (rol EXTERNO, estado_activo 1). */
function getPortalApprovedExternos() {
    return safeParseArray(LS_KEYS.portalApprovedExternos);
}

/**
 * Resuelve si el correo puede iniciar sesión en el portal con código de 4 dígitos.
 * Internos @cue.edu.co sin ficha en MOCK siguen como ESTUDIANTE por defecto.
 * Externos solo entran si están en MOCK_USERS o en la lista aprobada por ANI.
 */
function resolvePortalLoginRole(email) {
    const e = String(email || '').trim().toLowerCase();
    const mock = MOCK_USERS.find(u => u.email === e);
    if (mock) return { ok: true, role: mock.role };

    if (e.endsWith('@cue.edu.co')) {
        return { ok: true, role: ROLES.ESTUDIANTE };
    }

    const approved = getPortalApprovedExternos().find(
        u => String(u.email || '').toLowerCase() === e && Number(u.estado_activo) === 1
    );
    if (approved) return { ok: true, role: ROLES.EXTERNO };

    return {
        ok: false,
        message:
            'Su correo no tiene acceso autorizado. Si es usuario externo, solicite acceso desde el portal y espere la aprobación de la oficina ANI.'
    };
}

function setAuthUser(user) {
    localStorage.setItem(LS_KEYS.authUser, JSON.stringify(user));
}

/**
 * Tipo de vínculo con la institución: INTERNO (@cue y roles de planta) vs EXTERNO (portal entrante).
 * Certificados académicos de movilidad solo aplican a ESTUDIANTE + INTERNO.
 */
function inferUserTypeFromRole(roleCode) {
    return roleCode === ROLES.EXTERNO.code ? 'EXTERNO' : 'INTERNO';
}

function getUserType(user) {
    if (!user || typeof user !== 'object') return 'INTERNO';
    if (user.userType === 'EXTERNO' || user.role?.code === ROLES.EXTERNO.code) return 'EXTERNO';
    if (user.userType === 'INTERNO') return 'INTERNO';
    return inferUserTypeFromRole(user.role?.code);
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

const AuthService = {
    // =========================
    // 1) Portal CUE (Solicitantes) – código de acceso de 4 dígitos
    // =========================
    requestPortalCode: function(email, opts = {}) {
        const e = String(email || '').trim().toLowerCase();
        if (!e || !e.includes('@')) {
            return { success: false, message: 'Ingrese un correo válido' };
        }

        const gate = resolvePortalLoginRole(e);
        if (!gate.ok) {
            return { success: false, message: gate.message };
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

        const resolved = resolvePortalLoginRole(e);
        if (!resolved.ok) {
            return { success: false, message: resolved.message };
        }
        const role = resolved.role;
        const mock = MOCK_USERS.find(u => u.email === e);
        const approved = getPortalApprovedExternos().find(
            x => String(x.email || '').toLowerCase() === e && Number(x.estado_activo) === 1
        );
        const displayName = mock?.name || approved?.name || e;
        const userType = inferUserTypeFromRole(role.code);
        const baseUser = {
            email: e,
            name: displayName,
            role,
            userType
        };
        if (approved && approved.rolInstitucionOrigen) {
            baseUser.rolInstitucionOrigen = approved.rolInstitucionOrigen;
        }
        setAuthUser(baseUser);
        return { success: true, redirect: role.redirect };
    },

    /**
     * Registra o actualiza un externo aprobado para que pueda usar loginPortal.
     * Lo invoca el dashboard ANI al aprobar una fila de CUE_SOLICITUDES_ACCESO.
     */
    registerApprovedExternalUser: function(payload) {
        const email = String(payload?.email || '').trim().toLowerCase();
        const name = String(payload?.name || payload?.nombresApellidos || '').trim();
        if (!email || !email.includes('@')) {
            return { success: false, message: 'Correo inválido' };
        }
        let users = getPortalApprovedExternos();
        const idx = users.findIndex(u => String(u.email || '').toLowerCase() === email);
        const record = {
            email,
            name: name || email,
            roleCode: ROLES.EXTERNO.code,
            estado_activo: 1,
            updatedAt: new Date().toISOString(),
            rolInstitucionOrigen: payload.rolInstitucionOrigen ? String(payload.rolInstitucionOrigen).trim() : undefined
        };
        if (!record.rolInstitucionOrigen) delete record.rolInstitucionOrigen;
        if (idx >= 0) {
            users[idx] = { ...users[idx], ...record };
        } else {
            record.createdAt = record.updatedAt;
            users.push(record);
        }
        localStorage.setItem(LS_KEYS.portalApprovedExternos, JSON.stringify(users));
        return { success: true };
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
                role: user.role,
                userType: inferUserTypeFromRole(user.role.code)
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

AuthService.getUserType = getUserType;
AuthService.inferUserTypeFromRole = inferUserTypeFromRole;

window.AuthService = AuthService;
window.getUserType = getUserType;