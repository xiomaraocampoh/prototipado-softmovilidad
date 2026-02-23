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
        
        if(this.role !== 'EXTERNO' && this.role !== 'DOCENTE') {
            this.lockContactFields();
        }
        
        if(this.isDocPhase) {
            this.lockAllDataFields(); 
            this.stepIdx = 4;
            this.updateUI();
            alert("Postulación Aprobada. Se ha habilitado la carga de sus documentos definitivos de viaje.");
        } else {
            this.filterTypesByModality(); 
            if(this.draftId) this.loadDraft(this.draftId);
            this.updateUI(); 
        }
        
        if(typeof lucide !== 'undefined') lucide.createIcons();
    },

    setupUI: function() {
        const titleEl = document.getElementById('formTitle');
        if(titleEl) titleEl.innerText = this.role === 'DOCENTE' ? 'Registro de Salida Académica' : 'Solicitud de Movilidad';
        
        const dirEl = document.getElementById('mobilityDirection');
        if(dirEl) dirEl.value = (this.role === 'EXTERNO') ? 'ENTRANTE' : 'SALIENTE';
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

    filterTypesByModality: function() {
        const select = document.getElementById('mobilityType');
        const modEl = document.getElementById('mobilityModality');
        if(!select || !modEl) return;
        
        const mod = modEl.value;
        select.innerHTML = '<option value="">Seleccione...</option>';
        const types = [
            { t: "Intercambio Académico", m: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Práctica Empresarial - Pasantía", m: ["PRESENCIAL"] },
            { t: "Diplomado", m: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Curso Corto", m: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Estancia Investigación", m: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Rotación Médica", m: ["PRESENCIAL"] },
            { t: "Otro", m: ["PRESENCIAL", "VIRTUAL"] }
        ];
        
        if (this.role === 'DOCENTE') {
            select.innerHTML += `<option value="Visita/Salida Académica">Visita/Salida Académica</option>`;
            select.innerHTML += `<option value="Evento Académico/Investigativo">Evento Académico/Investigativo</option>`;
        } else {
            types.forEach(op => { if(op.m.includes(mod)) select.innerHTML += `<option value="${op.t}">${op.t}</option>`; });
        }
        this.updateFields();
    },

    updateFields: function() {
        const type = document.getElementById('mobilityType')?.value || '';
        const isPre = document.getElementById('mobilityModality')?.value === 'PRESENCIAL';
        
        document.querySelectorAll('.req-presencial').forEach(el => el.classList.toggle('hidden', !isPre));
        
        const dir = document.getElementById('mobilityDirection')?.value || 'SALIENTE';
        document.getElementById('origenContainer')?.classList.toggle('hidden', dir !== 'ENTRANTE');
        document.getElementById('destinoContainer')?.classList.toggle('hidden', dir !== 'SALIENTE');

        const noConv = ['Visita/Salida Académica', 'Evento Académico/Investigativo', 'Diplomado', 'Curso Corto', 'Otro'].includes(type);
        document.getElementById('destinoSearchContainer')?.classList.toggle('hidden', noConv);
        document.getElementById('destinoLibreContainer')?.classList.toggle('hidden', !noConv);
        if(!noConv) this.checkOtherEntity();

        document.getElementById('practiceDetailsContainer')?.classList.toggle('hidden', !['Práctica Empresarial - Pasantía', 'Práctica Integral', 'Rotación Médica', 'Estancia Investigación'].includes(type));
        
        const exCont = document.getElementById('extraFieldsContainer');
        if(exCont) {
            exCont.classList.toggle('hidden', !(type === 'Evento Académico/Investigativo' || type === 'Estancia Investigación'));
            document.getElementById('researchFields')?.classList.toggle('hidden', type !== 'Estancia Investigación');
            document.getElementById('eventFields')?.classList.toggle('hidden', type !== 'Evento Académico/Investigativo');
        }
        
        document.getElementById('transportContainer')?.classList.toggle('hidden', !(type === 'Visita/Salida Académica' && isPre));
        const hasT = document.getElementById('hiredTransport');
        document.getElementById('vehicleDetails')?.classList.toggle('hidden', !(hasT && hasT.checked));
    },

    step: function(dir) {
        // Validación corregida y blindada
        if(dir === 1 && this.stepIdx === 1) {
            const mType = document.getElementById('mobilityType');
            if(!mType || mType.value === "") {
                alert("Por favor, seleccione el Tipo Específico de Movilidad antes de continuar.");
                return; 
            }
        }
        
        this.stepIdx += dir;
        if(this.stepIdx === 4) this.loadDocs();
        
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

        const type = document.getElementById('mobilityType')?.value || '';
        document.getElementById('professorRosterData')?.classList.toggle('hidden', type !== 'Visita/Salida Académica');
        document.getElementById('studentPersonalData')?.classList.toggle('hidden', type === 'Visita/Salida Académica');

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
        let reqs = JSON.parse(localStorage.getItem('CUE_MY_REQUESTS')||'[]');
        const type = document.getElementById('mobilityType').value;
        
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
                status: dir === 'ENTRANTE' ? 'EN_REVISION_TOTAL' : 'EN_REVISION_POSTULACION',
                userEmail: this.user.email
            };
            if(this.draftId) reqs = reqs.map(r => r.id === this.draftId ? {...r, ...data} : r);
            else reqs.push(data);
            alert("Postulación Radicada exitosamente.");
        }
        localStorage.setItem('CUE_MY_REQUESTS', JSON.stringify(reqs));
        window.location.href='dashboard-estudiante.html';
    },

    loadProfile: function() {},
    calculateDuration: function() {},
    toggleFinance: function() {
        document.getElementById('montoCosto')?.classList.toggle('hidden', document.getElementById('hasCosto')?.value !== 'SI');
        document.getElementById('montoBeca')?.classList.toggle('hidden', document.getElementById('hasBeca')?.value !== 'SI');
    }
};

document.addEventListener('DOMContentLoaded', () => WizardLogic.init());