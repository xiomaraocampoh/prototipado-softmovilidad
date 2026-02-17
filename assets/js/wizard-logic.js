/**
 * Lógica Core del Wizard de Movilidad CUE
 */

const WizardLogic = {
    stepIdx: 1,
    role: null,

    init: function() {
        const user = AuthService.checkAuth();
        this.role = user.role.code;
        document.getElementById('mobilityDirection').value = (this.role === 'EXTERNO') ? 'ENTRANTE' : 'SALIENTE';
        
        // Bloquear SST si es Saliente (Estudiante interno)
        if(this.role !== 'EXTERNO' && this.role !== 'DOCENTE') {
            this.lockSSTFields();
        }

        this.filterTypesByModality(); // Carga inicial
        this.loadAgreements(); 
        this.loadProfile();
        this.updateFields();
        this.updateUI();
        lucide.createIcons();
    },

    // 1. FILTRADO DE LISTA SEGÚN MODALIDAD (Virtual vs Presencial)
    filterTypesByModality: function() {
        const select = document.getElementById('mobilityType');
        const modality = document.getElementById('mobilityModality').value; // PRESENCIAL o VIRTUAL
        select.innerHTML = '<option value="">Seleccione...</option>';
        
        // Matriz de Tipos (Basada en Excel e inferencia lógica)
        const allTypes = [
            { t: "Intercambio Académico", modes: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Evento Académico/Investigativo", modes: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Práctica Empresarial - Pasantía", modes: ["PRESENCIAL"] }, // Usualmente presencial
            { t: "Diplomado", modes: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Curso Corto", modes: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Estancia Investigación", modes: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Curso Idiomas", modes: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Voluntariado", modes: ["PRESENCIAL"] },
            { t: "Rotación Médica", modes: ["PRESENCIAL"] }, // Estrictamente presencial
            { t: "Práctica Integral", modes: ["PRESENCIAL"] },
            { t: "Otro", modes: ["PRESENCIAL", "VIRTUAL"] }
        ];

        if (this.role === 'DOCENTE') {
            select.innerHTML += `<option value="Visita/Salida Académica">Visita/Salida Académica</option>`;
            select.innerHTML += `<option value="Evento Académico/Investigativo">Evento Académico/Investigativo</option>`;
        } else {
            allTypes.forEach(op => {
                if(op.modes.includes(modality)) {
                    select.innerHTML += `<option value="${op.t}">${op.t}</option>`;
                }
            });
        }
        this.updateFields(); // Refrescar campos al cambiar
    },

    // 2. BLOQUEO DE CAMPOS SST (Para Salientes)
    lockSSTFields: function() {
        // Datos simulados que vendrían de la BD de Bienestar
        document.getElementById('sstEps').value = "Sanitas EPS (Activo)";
        document.getElementById('sstEps').readOnly = true;
        document.getElementById('sstEps').classList.add('bg-gray-100', 'cursor-not-allowed');

        document.getElementById('sstMeds').value = "Ninguna reportada";
        document.getElementById('sstMeds').readOnly = true;
        document.getElementById('sstMeds').classList.add('bg-gray-100', 'cursor-not-allowed');

        document.getElementById('sstContactName').value = "Maria Pérez (Madre)";
        document.getElementById('sstContactName').readOnly = true;
        document.getElementById('sstContactName').classList.add('bg-gray-100', 'cursor-not-allowed');

        document.getElementById('sstContactRel').value = "Madre";
        document.getElementById('sstContactRel').readOnly = true;
        document.getElementById('sstContactRel').classList.add('bg-gray-100', 'cursor-not-allowed');

        document.getElementById('sstContactPhone').value = "3001234567";
        document.getElementById('sstContactPhone').readOnly = true;
        document.getElementById('sstContactPhone').classList.add('bg-gray-100', 'cursor-not-allowed');
    },

    loadAgreements: function() {
        const select = document.getElementById('entity_select');
        if(!select) return;
        const convenios = [
            { nombre: "UNAM", pais: "México", ciudad: "Ciudad de México" },
            { nombre: "BERUFSAKADEMIE MOSBACH", pais: "Alemania", ciudad: "Mosbach" },
            { nombre: "CORHUILA", pais: "Colombia", ciudad: "Neiva" },
            { nombre: "DHBW RAVENSBURG", pais: "Alemania", ciudad: "Ravensburg" },
            { nombre: "ISEP", pais: "España", ciudad: "Madrid" },
            { nombre: "UNIVERSIDAD DE SALAMANCA", pais: "España", ciudad: "Salamanca" }
        ];
        select.innerHTML = '<option value="" selected disabled>Seleccione una Institución...</option>';
        convenios.forEach(c => select.innerHTML += `<option value="${c.nombre}" data-pais="${c.pais}" data-ciudad="${c.ciudad}">${c.nombre} (${c.pais})</option>`);
        select.innerHTML += `<option value="OTRA" class="font-bold text-[#0077b6]">-- OTRA (Ingresar Manualmente) --</option>`;
    },

    checkOtherEntity: function() {
        const select = document.getElementById('entity_select');
        const libreContainer = document.getElementById('destinoLibreContainer');
        const otherInput = document.getElementById('other_entity_name');
        const country = document.getElementById('field_country');
        const city = document.getElementById('field_city');
        
        if(!select) return;
        if (select.value === 'OTRA') {
            libreContainer.classList.remove('hidden');
            otherInput.focus();
            country.readOnly = false; city.readOnly = false;
            country.value = ""; city.value = "";
            country.classList.remove('bg-gray-100', 'cursor-not-allowed');
            city.classList.remove('bg-gray-100', 'cursor-not-allowed');
        } else {
            libreContainer.classList.add('hidden');
            const opt = select.options[select.selectedIndex];
            if (opt && opt.getAttribute('data-pais')) {
                country.value = opt.getAttribute('data-pais');
                city.value = opt.getAttribute('data-ciudad');
                country.readOnly = true; city.readOnly = true;
                country.classList.add('bg-gray-100', 'cursor-not-allowed');
                city.classList.add('bg-gray-100', 'cursor-not-allowed');
            }
        }
    },

    loadProfile: function() {
        const saved = JSON.parse(localStorage.getItem('CUE_USER_PROFILE') || '{}');
        if(document.getElementById('autoDoc')) document.getElementById('autoDoc').value = saved.doc || '1094...';
        if(document.getElementById('autoSem')) document.getElementById('autoSem').value = saved.sem || '7';
        if(document.getElementById('autoProm')) document.getElementById('autoProm').value = saved.prom || '4.2';
    },

    calculateDuration: function() {
        const d1 = document.getElementById('fechaInicio').value;
        const d2 = document.getElementById('fechaFin').value;
        const out = document.getElementById('duracionCalculada');
        if(d1 && d2) {
            const start = new Date(d1); const end = new Date(d2);
            if(end >= start) {
                let m = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                let d = end.getDate() - start.getDate();
                if(d < 0) { m--; d += new Date(end.getFullYear(), end.getMonth(), 0).getDate(); }
                let res = [];
                if(m > 0) res.push(`${m} Mes(es)`);
                if(d > 0 || m === 0) res.push(`${d} Día(s)`);
                out.value = res.join(' y ');
                out.classList.add('bg-green-100', 'text-green-800');
            } else {
                out.value = "Error: Fecha fin menor";
                out.classList.remove('bg-green-100', 'text-green-800');
            }
        }
    },

    toggleFinance: function() {
        document.getElementById('montoCosto').classList.toggle('hidden', document.getElementById('hasCosto').value !== 'SI');
        document.getElementById('montoBeca').classList.toggle('hidden', document.getElementById('hasBeca').value !== 'SI');
    },

    updateFields: function() {
        const isPresencial = document.getElementById('mobilityModality').value === 'PRESENCIAL';
        const direction = document.getElementById('mobilityDirection').value;
        const type = document.getElementById('mobilityType').value;
        const isSalida = type === 'Visita/Salida Académica';
        
        document.querySelectorAll('.req-presencial').forEach(el => el.classList.toggle('hidden', !isPresencial));
        
        document.getElementById('origenContainer').classList.toggle('hidden', direction !== 'ENTRANTE');
        document.getElementById('destinoContainer').classList.toggle('hidden', direction !== 'SALIENTE');

        const searchCont = document.getElementById('destinoSearchContainer');
        const freeCont = document.getElementById('destinoLibreContainer');
        const practiceCont = document.getElementById('practiceDetailsContainer');
        const extraCont = document.getElementById('extraFieldsContainer');
        
        if (searchCont && freeCont) {
            const noConvenioReq = ['Visita/Salida Académica', 'Evento Académico/Investigativo', 'Diplomado', 'Curso Corto', 'Curso Idiomas', 'Voluntariado', 'Otro'].includes(type);
            
            if (noConvenioReq) {
                searchCont.classList.add('hidden');
                freeCont.classList.remove('hidden');
                // Desbloquear para escritura libre si no hay convenio
                const c = document.getElementById('field_country');
                const ci = document.getElementById('field_city');
                if(c) { c.readOnly = false; c.classList.remove('bg-gray-100', 'cursor-not-allowed'); c.value=""; }
                if(ci) { ci.readOnly = false; ci.classList.remove('bg-gray-100', 'cursor-not-allowed'); ci.value=""; }
            } else {
                searchCont.classList.remove('hidden');
                this.checkOtherEntity(); 
            }
        }

        if (practiceCont) {
            const showPracticeDetails = ['Práctica Empresarial - Pasantía', 'Práctica Integral', 'Rotación Médica', 'Estancia Investigación'].includes(type);
            practiceCont.classList.toggle('hidden', !showPracticeDetails);
        }

        if(extraCont) {
            const showEvent = type === 'Evento Académico/Investigativo';
            const showResearch = type === 'Estancia Investigación';
            extraCont.classList.toggle('hidden', !(showEvent || showResearch));
            document.getElementById('researchFields').classList.toggle('hidden', !showResearch);
            document.getElementById('eventFields').classList.toggle('hidden', !showEvent);
        }
        
        const transCont = document.getElementById('transportContainer');
        if(transCont) {
            transCont.classList.toggle('hidden', !(isSalida && isPresencial));
            const hasT = document.getElementById('hiredTransport')?.checked;
            document.getElementById('vehicleDetails').classList.toggle('hidden', !hasT);
        }
    },

    step: function(dir) {
        if(dir===1 && this.stepIdx===1 && !document.getElementById('mobilityType').value) return alert("Seleccione el Tipo Específico.");
        this.stepIdx += dir;
        if(this.stepIdx === 4) this.loadDocs();
        this.updateUI();
        window.scrollTo(0,0);
    },

    updateUI: function() {
        for(let i=1; i<=4; i++) {
            document.getElementById(`step-${i}`).classList.toggle('hidden', i !== this.stepIdx);
            const ind = document.querySelector(`.step-indicator[data-step="${i}"]`);
            if(i === this.stepIdx) ind.classList.add('active'); else ind.classList.remove('active');
        }

        const isSalida = document.getElementById('mobilityType').value === 'Visita/Salida Académica';
        document.getElementById('professorRosterData').classList.toggle('hidden', !isSalida);
        document.getElementById('studentPersonalData').classList.toggle('hidden', isSalida);

        document.getElementById('prevBtn').classList.toggle('hidden', this.stepIdx === 1);
        document.getElementById('nextBtn').classList.toggle('hidden', this.stepIdx === 4);
        document.getElementById('submitBtn').classList.toggle('hidden', this.stepIdx !== 4);
    },

    loadDocs: function() {
        const list = document.getElementById('docsList');
        const isPresencial = document.getElementById('mobilityModality').value === 'PRESENCIAL';
        const isInternacional = document.getElementById('mobilityScope').value === 'INTERNACIONAL';
        const dir = document.getElementById('mobilityDirection').value;
        const type = document.getElementById('mobilityType').value;
        const hasTransport = document.getElementById('hiredTransport')?.checked;
        
        // Documentos Transversales
        let docs = [];
        
        // NOTA: Para salientes (internos) ya NO pedimos Documento de Identidad (Feedback Usuario)
        // Solo se pide si es Entrante
        if(dir === 'ENTRANTE') {
            docs.push({n:"Documento de Identidad (Pasaporte/Cédula)", d:"PDF"});
            docs.push({n:"Carta Postulación Institución Origen", d:"Obligatorio"});
        } else {
            if(this.role !== 'DOCENTE') docs.push({n:"Historial Académico (Q10)", d:"PDF"});
            if(type !== 'Visita/Salida Académica') docs.push({n:"Carta de Motivación", d:"PDF Personal"});
        }
        
        if(isPresencial) docs.push({n:"Certificado EPS / Seguro Médico Vigente", d:"PDF"});
        if(isInternacional && isPresencial) docs.push({n:"Pasaporte y Seguro Médico Internacional", d:"PDF"});

        // Específicos por Tipo
        if(dir === 'SALIENTE') {
            if(type === 'Intercambio Académico') docs.push({n:"Formato Homologación Asignaturas", d:"Firmado"});
            if(type === 'Práctica Empresarial - Pasantía' || type === 'Rotación Médica') docs.push({n:"Carta Aceptación Entidad", d:"PDF"}, {n:"Certificado ARL", d:"Riesgos Laborales"});
            if(type === 'Estancia Investigación') docs.push({n:"Carta Aceptación Tutor", d:"PDF"});
            if(type === 'Evento Académico/Investigativo') docs.push({n:"Soporte Inscripción/Invitación", d:"PDF"});
            if(type === 'Doble Titulación') docs.push({n:"Plan de Estudios Aprobado", d:"Firma Decanatura"});
        }

        if(type === 'Visita/Salida Académica' && hasTransport && isPresencial) {
            docs.push(
                {n:"SOAT y Revisión Tecnomecánica", d:"SST Transporte"}, 
                {n:"Póliza Contractual y Extracontractual", d:"SST Seguros"}, 
                {n:"Licencia y ARL Conductor", d:"Legal Conductor"},
                {n:"Tarjeta Propiedad", d:"Vehículo"}
            );
        }

        list.innerHTML = docs.map(d => `
            <div class="flex justify-between items-center p-3 border border-gray-200 bg-gray-50 rounded mb-2 hover:bg-blue-50 transition">
                <div class="flex gap-3 items-center">
                    <div class="bg-white p-2 rounded shadow-sm text-[#0077b6]"><i data-lucide="file-up"></i></div>
                    <div><p class="text-sm font-bold text-[#03045e]">${d.n}</p><p class="text-[10px] text-gray-500 uppercase">${d.d}</p></div>
                </div>
                <input type="file" multiple class="text-xs file:bg-[#0077b6] file:text-white file:border-0 file:px-3 file:py-1 file:rounded cursor-pointer">
            </div>`).join('');
        lucide.createIcons();
    },

    save: function() { alert("Borrador guardado localmente."); window.location.href='dashboard-estudiante.html'; },
    submit: function(e) {
        e.preventDefault();
        if(!document.getElementById('termsCheck').checked) return alert("Debe aceptar los términos de la política de datos.");
        let r = JSON.parse(localStorage.getItem('CUE_MY_REQUESTS')||'[]');
        r.push({id:"REQ-"+Math.floor(Math.random()*1000), date: new Date().toLocaleDateString(), type: document.getElementById('mobilityType').value, status:'EN_REVISION_ANI'});
        localStorage.setItem('CUE_MY_REQUESTS', JSON.stringify(r));
        alert("Formulario FO-IN-012 Radicado Exitosamente."); window.location.href='dashboard-estudiante.html';
    }
};

document.addEventListener('DOMContentLoaded', () => WizardLogic.init());