//**Lógica de Negocio: Movilidad CUE (Modelo Profesional por Etapas SRS)**//

const WizardLogic = {
    stepIdx: 1,
    role: null,
    isDocPhase: false, 
    draftId: null,

    init: function() {
        console.log("Inicializando WizardLogic...");
        
        // Evita que el código se rompa si el archivo auth.js falla
        let user = null;
        try {
            user = typeof AuthService !== 'undefined' ? AuthService.checkAuth() : { role: { code: 'ESTUDIANTE' }, email: 'test@cue.edu.co' };
        } catch(e) {
            console.warn("Fallo en Auth, usando usuario por defecto.", e);
            user = { role: { code: 'ESTUDIANTE' }, email: 'test@cue.edu.co' };
        }
        
        if (!user) return;
        
        this.user = user;
        this.role = user.role.code;
        
        const urlParams = new URLSearchParams(window.location.search);
        this.isDocPhase = urlParams.get('mode') === 'docs';
        this.draftId = urlParams.get('draft');

        this.setupUI();
        this.loadProfile();
        this.loadAgreements();
        this.toggleExternoForm();
        
        if(this.role !== 'EXTERNO' && this.role !== 'DOCENTE') {
            this.lockContactFields();
        }
        if (this.role === 'EXTERNO') this.prefillExternoFields();
        
        if(this.isDocPhase) {
            this.lockAllDataFields(); 
            this.stepIdx = 4;
            this.updateUI();
            alert("Postulación Aprobada. Se ha habilitado la carga de sus documentos definitivos de viaje.");
        } else {
            this.filterTypesByModality(); 
            if(this.draftId) this.loadDraft(this.draftId);
            this.updateUI();
            this.calculateDuration();
        }
        
        if(typeof lucide !== 'undefined') lucide.createIcons();
    },

    setupUI: function() {
        const titleEl = document.getElementById('formTitle');
        if (titleEl) titleEl.innerText = 'Solicitud de Movilidad';
        
        const dirEl = document.getElementById('mobilityDirection');
        if(dirEl) dirEl.value = (this.role === 'EXTERNO') ? 'ENTRANTE' : 'SALIENTE';
    },

    // REQ-06: Mostrar formulario integral para EXTERNO, perfil solo lectura para internos
    toggleExternoForm: function() {
        const interno = document.getElementById('studentPersonalData');
        const externo = document.getElementById('externalFormData');
        if (this.role === 'EXTERNO') {
            if (interno) interno.classList.add('hidden');
            if (externo) externo.classList.remove('hidden');
        } else {
            if (interno) interno.classList.remove('hidden');
            if (externo) externo.classList.add('hidden');
        }
    },

    prefillExternoFields: function() {
        const emailEl = document.getElementById('extCorreo');
        if (emailEl && this.user?.email) emailEl.value = this.user.email;
    },

    loadDocs: function() {
        const list = document.getElementById('docsList');
        if(!list) return;

        const type = document.getElementById('mobilityType').value;
        const dir = document.getElementById('mobilityDirection').value;
        const modalityEl = document.getElementById('mobilityModality');
        const isPresencial = modalityEl ? modalityEl.value === 'PRESENCIAL' : true;
        let docs = [];

        if (type === 'Visita/Salida Académica') {
            list.innerHTML = `<div class="bg-blue-50 p-4 rounded text-sm text-gray-600"><strong>NO requiere adjuntar documentos del vehículo aquí.</strong><br>SST verificará SOAT, Tecnomecánica, Pólizas.</div>`;
            return; 
        }

        if (!this.isDocPhase) {
            docs.push({n:"Documento de Identidad", d:"Ambas caras"});
            if (dir === 'ENTRANTE') {
                docs.push({n:"Carta de Postulación", d:"De su Institución de Origen"});
                docs.push({n:"Notas", d:"Expedido por su Universidad"});
            } else if (this.role !== 'DOCENTE') {
                docs.push({n:"Carta de Motivación", d:"Motivos personales"});
            }
        } else {
            if (dir === 'SALIENTE') docs.push({n:"Carta de Aceptación Oficial", d:"Emitido por destino"});
            if (['Práctica Empresarial - Pasantía', 'Rotación Médica', 'Práctica Integral'].includes(type)) docs.push({n:"Certificado de ARL", d:"Riesgos Laborales"});
            if (isPresencial) {
                docs.push({n:"Seguro Médico", d:"Cobertura específica"});
                const scopeEl = document.getElementById('mobilityScope');
                if ((scopeEl && scopeEl.value === 'INTERNACIONAL') || dir === 'ENTRANTE') docs.push({n:"Tiquetes y/o Visa", d:"Soporte de viaje"});
            }
        }

        list.innerHTML = docs.map(d => `
            <div class="flex justify-between items-center p-3 border bg-white rounded-lg mb-2">
                <div><p class="text-sm font-bold text-[#03045e]">${d.n}</p><p class="text-[10px] text-gray-500">${d.d}</p></div>
                <input type="file" class="text-xs file:bg-blue-50 file:text-blue-700 cursor-pointer">
            </div>`).join('');
    },

    lockAllDataFields: function() {
        document.querySelectorAll('input, select').forEach(i => {
            if(i.type !== 'file' && i.id !== 'termsCheck') { i.disabled = true; i.classList.add('bg-gray-50', 'cursor-not-allowed', 'opacity-70'); }
        });
    },

    lockContactFields: function() {
        const fields = ['sstContactName', 'sstContactRel', 'sstContactPhone', 'sstEps'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if(el) { el.readOnly = true; el.classList.add('bg-gray-100', 'cursor-not-allowed'); }
        });
    },

    loadAgreements: function() {
        const selectDestino = document.getElementById('entity_select');
        const selectOrigen = document.getElementById('entity_select_origin');
        
        let convenios = [];
        try { convenios = JSON.parse(localStorage.getItem('CUE_CONVENIOS') || '[]'); } catch(e) {}
        
        if (convenios.length === 0) {
            convenios = [{ nombre: "UNAM", pais: "México", ciudad: "CDMX", vigencia: "2027-12-31" }];
        }

        let opts = '<option value="" selected disabled>Seleccione Institución...</option>';
        convenios.forEach(c => {
            const isExp = new Date(c.vigencia) < new Date();
            opts += `<option value="${c.nombre}" data-pais="${c.pais}" data-ciudad="${c.ciudad}" ${isExp ? 'disabled class="text-red-500 bg-red-50"' : ''}>${c.nombre} ${isExp ? '[VENCIDO]' : ''}</option>`;
        });
        opts += `<option value="OTRA" class="font-bold text-[#0077b6]">-- OTRA (Manual) --</option>`;

        if(selectDestino) selectDestino.innerHTML = opts;
        if(selectOrigen) selectOrigen.innerHTML = opts;
    },

    checkOtherEntity: function() {
        const s = document.getElementById('entity_select');
        const c = document.getElementById('destinoLibreContainer');
        if(!s || !c) return;
        
        if (s.value === 'OTRA') {
            c.classList.remove('hidden');
        } else {
            c.classList.add('hidden');
            const o = s.options[s.selectedIndex];
            if (o && o.getAttribute('data-pais')) {
                document.getElementById('field_country').value = o.getAttribute('data-pais');
                document.getElementById('field_city').value = o.getAttribute('data-ciudad');
            }
        }
    },

    checkOtherEntityOrigin: function() {
        const s = document.getElementById('entity_select_origin');
        const c = document.getElementById('origenLibreContainer');
        if(s && c) { c.classList.toggle('hidden', s.value !== 'OTRA'); }
    },

    // REQ-01: Catálogo estricto FO-IN-012 (texto exacto)
    filterTypesByModality: function() {
        const select = document.getElementById('mobilityType');
        const modEl = document.getElementById('mobilityModality');
        if(!select || !modEl) return;
        
        const mod = modEl.value;
        select.innerHTML = '<option value="">Seleccione...</option>';
        
        const types = [
            { t: "Intercambio Académico (Semestre - Asignaturas)", m: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Práctica Empresarial - Pasantía", m: ["PRESENCIAL"] },
            { t: "Diplomado Opción de Grado", m: ["PRESENCIAL"] },
            { t: "Curso Corto", m: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Estancia Investigación", m: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Rotación Médica", m: ["PRESENCIAL"] },
            { t: "Visita/Salida Académica", m: ["PRESENCIAL"] },
            { t: "Evento Académico/Investigativo", m: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Voluntariado", m: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Doble Titulación", m: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Práctica Integral", m: ["PRESENCIAL"] },
            { t: "Curso Idiomas", m: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Otro", m: ["PRESENCIAL", "VIRTUAL"] }
        ];
        
        types.forEach(op => { 
            if(op.m.includes(mod)) select.innerHTML += `<option value="${op.t}">${op.t}</option>`; 
        });
        
        this.updateFields();
    },

    updateFields: function() {
        const type = document.getElementById('mobilityType')?.value || '';
        const isPre = document.getElementById('mobilityModality')?.value === 'PRESENCIAL';
        
        // 1. Ocultar o mostrar campos que exigen presencialidad (Vuelos, Residencia, SST Médico)
        document.querySelectorAll('.req-presencial').forEach(el => el.classList.toggle('hidden', !isPre));
        
        const dir = document.getElementById('mobilityDirection')?.value || 'SALIENTE';
        document.getElementById('origenContainer')?.classList.toggle('hidden', dir !== 'ENTRANTE');
        document.getElementById('destinoContainer')?.classList.toggle('hidden', dir !== 'SALIENTE');

        // REQ-02: Selector de institución destino siempre visible. Solo mostrar campos OTRA cuando value === 'OTRA'
        document.getElementById('destinoSearchContainer')?.classList.remove('hidden');
        const isOtra = document.getElementById('entity_select')?.value === 'OTRA';
        const destLibre = document.getElementById('destinoLibreContainer');
        if (destLibre) destLibre.classList.toggle('hidden', !isOtra);
        this.checkOtherEntity();

        document.getElementById('practiceDetailsContainer')?.classList.toggle('hidden', !['Práctica Empresarial - Pasantía', 'Práctica Integral', 'Rotación Médica', 'Estancia Investigación'].includes(type));
        
        const exCont = document.getElementById('extraFieldsContainer');
        if(exCont) {
            exCont.classList.toggle('hidden', !(type === 'Evento Académico/Investigativo' || type === 'Estancia Investigación'));
            document.getElementById('researchFields')?.classList.toggle('hidden', type !== 'Estancia Investigación');
            document.getElementById('eventFields')?.classList.toggle('hidden', type !== 'Evento Académico/Investigativo');
        }
        // Tipos que no exigen convenio: pueden dejar selector en blanco o elegir OTRA
        const noConv = ['Evento Académico/Investigativo', 'Diplomado Opción de Grado', 'Curso Corto', 'Curso Idiomas', 'Voluntariado', 'Otro'].includes(type);
        document.getElementById('entity_select')?.toggleAttribute('required', !noConv);
        
        // 3. Eliminamos la lógica de preguntar por transporte aquí. 
        // El contenedor 'transportContainer' debe estar oculto siempre en el wizard del solicitante.
        const transCont = document.getElementById('transportContainer');
        if(transCont) transCont.classList.add('hidden');
    },

    step: function(dir) {
        if(dir === 1 && this.stepIdx === 1) {
            const mType = document.getElementById('mobilityType');
            if(!mType || mType.value === "") {
                alert("Por favor, seleccione el Tipo Específico de Movilidad antes de continuar.");
                return; 
            }
        }
        // REQ-02: Al avanzar desde paso 2, si institución es OTRA validar Nombre, País y Ciudad
        if(dir === 1 && this.stepIdx === 2) {
            const sel = document.getElementById('entity_select');
            const dirVal = document.getElementById('mobilityDirection')?.value;
            if (dirVal === 'SALIENTE' && sel?.value === 'OTRA') {
                const name = (document.getElementById('other_entity_name')?.value || '').trim();
                const country = (document.getElementById('field_country')?.value || '').trim();
                const city = (document.getElementById('field_city')?.value || '').trim();
                if (!name || !country || !city) {
                    alert("Al seleccionar OTRA institución debe completar: Nombre de la Entidad, País y Ciudad.");
                    return;
                }
            }
        }
        // REQ-06: Al avanzar desde paso 3, si EXTERNO validar datos desagregados y FO-IN-012
        if(dir === 1 && this.stepIdx === 3 && this.role === 'EXTERNO') {
            const required = [
                { id: 'extPrimerNombre', msg: 'Primer Nombre' },
                { id: 'extPrimerApellido', msg: 'Primer Apellido' },
                { id: 'extSexo', msg: 'Sexo' },
                { id: 'extDireccion', msg: 'Dirección' },
                { id: 'extDepartamento', msg: 'Departamento' },
                { id: 'extMunicipio', msg: 'Municipio' },
                { id: 'extTipoDoc', msg: 'Tipo de documento' },
                { id: 'extNumDoc', msg: 'Número de documento' },
                { id: 'extCelular', msg: 'Celular' },
                { id: 'extCorreo', msg: 'Correo electrónico' },
                { id: 'extActividadesMaterias', msg: 'Actividades a realizar o materias a cursar' }
            ];
            for (const r of required) {
                const el = document.getElementById(r.id);
                const v = (el?.value || '').trim();
                if (!el || !v) {
                    alert("Complete el campo obligatorio: " + r.msg + ".");
                    if (el) el.focus();
                    return;
                }
            }
        }
        
        this.stepIdx += dir;
        if(this.stepIdx === 4) this.loadDocs();
        if(this.stepIdx === 2 || this.stepIdx === 3) this.calculateDuration();
        
        this.updateUI();
        window.scrollTo(0,0);
    },

    updateUI: function() {
        for(let i=1; i<=4; i++) {
            const el = document.getElementById(`step-${i}`);
            if(el) el.classList.toggle('hidden', i !== this.stepIdx);
            
            const ind = document.querySelector(`.step-indicator[data-step="${i}"]`);
            if(ind) {
                if(i === this.stepIdx) ind.classList.add('active'); 
                else ind.classList.remove('active');
            }
        }

        // Las Salidas Académicas con grupos NO se crean desde este wizard (se crean desde Coordinación Académica).
        // Por lo tanto, no se muestra el UI especial de “salida” aquí.
        document.getElementById('professorRosterData')?.classList.add('hidden');
        this.toggleExternoForm();

        const prev = document.getElementById('prevBtn');
        const next = document.getElementById('nextBtn');
        const sub = document.getElementById('submitBtn');

        if(prev) prev.classList.toggle('hidden', this.stepIdx === 1 || this.isDocPhase);
        if(next) next.classList.toggle('hidden', this.stepIdx === 4);
        
        if(sub) {
            sub.classList.toggle('hidden', this.stepIdx !== 4);
            const subTxt = document.getElementById('submitText');
            if(subTxt) subTxt.innerText = this.isDocPhase ? 'FINALIZAR' : 'RADICAR POSTULACIÓN';
        }
    },

    save: function() {
        const type = document.getElementById('mobilityType')?.value;
        if(!type) return alert("Seleccione un 'Tipo Específico de Movilidad' en el Paso 1 para guardar.");

        let reqs = JSON.parse(localStorage.getItem('CUE_MY_REQUESTS') || '[]');
        const draftData = {
            id: this.draftId || "REQ-" + Math.floor(Math.random()*10000),
            date: new Date().toLocaleDateString(),
            type: type,
            dir: document.getElementById('mobilityDirection')?.value || 'SALIENTE',
            dest: document.getElementById('entity_select')?.value || 'Por definir',
            status: 'BORRADOR',
            userEmail: this.user.email
        };

        if(this.draftId) {
            reqs = reqs.map(r => r.id === this.draftId ? { ...r, ...draftData } : r);
        } else {
            reqs.push(draftData);
        }

        localStorage.setItem('CUE_MY_REQUESTS', JSON.stringify(reqs));
        alert("Borrador guardado. Puede retomarlo desde su panel.");
        window.location.href = 'dashboard-estudiante.html';
    },

    loadDraft: function(id) {
        const reqs = JSON.parse(localStorage.getItem('CUE_MY_REQUESTS') || '[]');
        const draft = reqs.find(r => r.id === id);
        if(draft && document.getElementById('mobilityType')) {
            document.getElementById('mobilityType').value = draft.type;
            this.updateFields();
        }
    },

    submit: function(e) {
        e.preventDefault();
        // REQ-05: Checkbox obligatorio política de tratamiento de datos personales
        const termsCheck = document.getElementById('termsCheck');
        if (!termsCheck?.checked) {
            alert("Debe aceptar la política de tratamiento de datos personales para radicar la solicitud.");
            return;
        }
        let reqs = JSON.parse(localStorage.getItem('CUE_MY_REQUESTS')||'[]');
        const type = document.getElementById('mobilityType').value;
        if (type === 'Visita/Salida Académica') {
            alert("Las Salidas Académicas con grupos se crean únicamente desde el panel de Coordinación Académica.");
            return;
        }
        
        if (this.isDocPhase) {
            alert("Anexos cargados con éxito.");
            const reqId = new URLSearchParams(window.location.search).get('id');
            reqs = reqs.map(r => { if(r.id === reqId) r.status = 'EN_REVISION_LEGALIZACION'; return r; });
        } else {
            const dir = document.getElementById('mobilityDirection')?.value || 'SALIENTE';
            const data = {
                id: this.draftId || "REQ-" + Math.floor(Math.random()*10000),
                date: new Date().toLocaleDateString(),
                type: type,
                dir: dir,
                status: dir === 'ENTRANTE' ? 'EN_REVISION_TOTAL' : 'EN_REVISION_SECRETARIA_ANI',
                userEmail: this.user.email
            };
            data.expedienteData = this.gatherExpedienteData();
            if (this.role === 'EXTERNO') {
                data.externoFOIN012 = this.gatherExternoFormData();
            }
            if(this.draftId) reqs = reqs.map(r => r.id === this.draftId ? {...r, ...data} : r);
            else reqs.push(data);
            alert("Postulación Radicada exitosamente.");
        }
        localStorage.setItem('CUE_MY_REQUESTS', JSON.stringify(reqs));
        window.location.href='dashboard-estudiante.html';
    },

    gatherExpedienteData: function() {
        const get = (id) => (document.getElementById(id)?.value || '').trim();
        return {
            tipo: get('mobilityType'),
            modalidad: document.getElementById('mobilityModality')?.value || '',
            alcance: document.getElementById('mobilityScope')?.value || '',
            direccion: document.getElementById('mobilityDirection')?.value || '',
            institucionDestino: document.getElementById('entity_select')?.value || '',
            otraEntidad: get('other_entity_name'),
            pais: get('field_country'),
            ciudad: get('field_city'),
            fechaInicio: get('fechaInicio'),
            fechaFin: get('fechaFin'),
            duracion: get('duracionMovilidad'),
            hasCosto: document.getElementById('hasCosto')?.value || '',
            montoCosto: get('montoCosto'),
            hasBeca: document.getElementById('hasBeca')?.value || '',
            montoBeca: get('montoBeca'),
            actividadesDesc: get('actividadesMovilidad'),
            documento: get('autoDoc'),
            programa: get('autoPrograma'),
            semestrePromedio: get('autoSem'),
            eps: get('sstEps'),
            alergiasMeds: get('sstMeds'),
            contactoNombre: get('sstContactName'),
            contactoParentesco: get('sstContactRel'),
            contactoTel: get('sstContactPhone')
        };
    },

    gatherExternoFormData: function() {
        const get = (id) => (document.getElementById(id)?.value || '').trim();
        return {
            primerNombre: get('extPrimerNombre'),
            segundoNombre: get('extSegundoNombre'),
            primerApellido: get('extPrimerApellido'),
            segundoApellido: get('extSegundoApellido'),
            sexo: get('extSexo'),
            direccion: get('extDireccion'),
            departamento: get('extDepartamento'),
            municipio: get('extMunicipio'),
            tipoDoc: get('extTipoDoc'),
            numDoc: get('extNumDoc'),
            fecExpedicion: get('extFecExpedicion'),
            fecNacimiento: get('extFecNacimiento'),
            nacionalidad: get('extNacionalidad'),
            celular: get('extCelular'),
            correo: get('extCorreo'),
            contactoNombre: get('extContactoNombre'),
            contactoParentesco: get('extContactoParentesco'),
            contactoTelefono: get('extContactoTelefono'),
            contactoCorreo: get('extContactoCorreo'),
            necesidadesMedicas: get('extNecesidadesMedicas'),
            actividadesMaterias: get('extActividadesMaterias')
        };
    },

    // REQ-04: Perfil solo lectura para Estudiante, Profesor, Administrativo CUE; vacío → "N/A (Actualizar en perfil)"
    loadProfile: function() {
        const NA = 'N/A (Actualizar en perfil)';
        const isInterno = ['ESTUDIANTE', 'DOCENTE', 'COLABORADOR'].includes(this.role);
        let profile = {};
        try {
            const raw = localStorage.getItem('CUE_USER_PROFILE');
            if (raw) profile = JSON.parse(raw);
        } catch (e) {}
        if (!isInterno) return; // Externos diligencian sus datos en el formulario (REQ-06 Módulo 2)
        const docNumber = profile.docNumber ?? profile.numDoc ?? this.user?.docNumber ?? '';
        const programa = profile.programa ?? profile.program ?? this.user?.programa ?? '';
        const semester = profile.semester != null ? profile.semester : this.user?.semester;
        const promedio = profile.promedio != null ? profile.promedio : this.user?.promedio;
        const semText = (semester != null && semester !== '') ? (promedio != null && promedio !== '' ? `Sem ${semester} / Prom ${promedio}` : `Sem ${semester}`) : (promedio != null && promedio !== '' ? `Prom ${promedio}` : '');
        const eps = profile.eps ?? profile.EPS ?? this.user?.eps ?? '';
        const alergias = profile.alergias ?? profile.alergiasMeds ?? this.user?.alergias ?? '';
        const contactName = profile.contactoEmergenciaNombre ?? this.user?.contactoEmergenciaNombre ?? '';
        const contactRel = profile.contactoEmergenciaParentesco ?? this.user?.contactoEmergenciaParentesco ?? '';
        const contactPhone = profile.contactoEmergenciaTelefono ?? this.user?.contactoEmergenciaTelefono ?? '';

        const setReadonlyAndNA = (el, value) => {
            if (!el) return;
            el.readOnly = true;
            el.classList.add('bg-gray-100');
            el.value = (value === undefined || value === null || String(value).trim() === '') ? NA : String(value).trim();
        };
        setReadonlyAndNA(document.getElementById('autoDoc'), docNumber);
        setReadonlyAndNA(document.getElementById('autoPrograma'), programa);
        setReadonlyAndNA(document.getElementById('autoSem'), semText);
        setReadonlyAndNA(document.getElementById('sstEps'), eps);
        setReadonlyAndNA(document.getElementById('sstMeds'), alergias);
        setReadonlyAndNA(document.getElementById('sstContactName'), contactName);
        setReadonlyAndNA(document.getElementById('sstContactRel'), contactRel);
        setReadonlyAndNA(document.getElementById('sstContactPhone'), contactPhone);
    },
    // REQ-03: Cálculo automático Duración de la movilidad (días o meses), campo solo lectura
    calculateDuration: function() {
        const inicio = document.getElementById('fechaInicio')?.value;
        const fin = document.getElementById('fechaFin')?.value;
        const out = document.getElementById('duracionMovilidad');
        if (!out) return;
        if (!inicio || !fin) {
            out.value = '';
            return;
        }
        const a = new Date(inicio);
        const b = new Date(fin);
        if (isNaN(a.getTime()) || isNaN(b.getTime()) || b < a) {
            out.value = 'Verifique fechas';
            return;
        }
        const diffMs = b - a;
        const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
        const months = (diffDays / 30).toFixed(1);
        const weeks = Math.round(diffDays / 7 * 10) / 10;
        if (diffDays <= 0) out.value = '0 días';
        else if (diffDays >= 30) out.value = `${months} meses (${diffDays} días)`;
        else if (diffDays >= 7) out.value = `${weeks} semanas (${diffDays} días)`;
        else out.value = `${diffDays} días`;
    },
    toggleFinance: function() {
        document.getElementById('montoCosto')?.classList.toggle('hidden', document.getElementById('hasCosto')?.value !== 'SI');
        document.getElementById('montoBeca')?.classList.toggle('hidden', document.getElementById('hasBeca')?.value !== 'SI');
    }
};

document.addEventListener('DOMContentLoaded', () => WizardLogic.init());