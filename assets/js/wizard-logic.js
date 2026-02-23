/**
 * Lógica de Negocio: Movilidad CUE (Modelo Profesional por Etapas SRS)
 */

const WizardLogic = {
    stepIdx: 1,
    role: null,
    isDocPhase: false, 
    draftId: null, // NUEVO: Variable para rastrear si estamos editando un borrador

    init: function() {
        const user = AuthService.checkAuth();
        if (!user) return; // Evita que el sistema colapse si no hay sesión
        
        this.user = user;
        this.role = user.role.code;
        
        // Detectar si estamos en ETAPA 2 o cargando un BORRADOR
        const urlParams = new URLSearchParams(window.location.search);
        this.isDocPhase = urlParams.get('mode') === 'docs';
        this.draftId = urlParams.get('draft'); // NUEVO: Captura el ID del borrador de la URL

        this.setupUI();
        this.loadProfile();
        this.loadAgreements();
        
        // Bloqueo de SST para Salientes (Internos)
        if(this.role !== 'EXTERNO' && this.role !== 'DOCENTE') {
            this.lockContactFields();
        }
        
        if(this.isDocPhase) {
            this.lockAllDataFields(); 
            this.stepIdx = 4; // Saltar directo al repositorio documental
            this.updateUI();
            alert("Postulación Aprobada. Se ha habilitado la carga de sus documentos definitivos de viaje (Seguros, Aceptación, etc).");
        } else {
            this.filterTypesByModality(); 
            
            // NUEVO: Cargar datos si existe un borrador
            if(this.draftId) {
                this.loadDraft(this.draftId);
            }
            
            // NUEVO: Forzar actualización de UI para que los botones aparezcan siempre
            this.updateUI(); 
        }
        
        lucide.createIcons();
    },

    setupUI: function() {
        const title = this.role === 'DOCENTE' ? 'Registro de Salida Académica' : 'Solicitud de Movilidad';
        const titleEl = document.getElementById('formTitle');
        if(titleEl) titleEl.innerText = title;
        
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
            list.innerHTML = `
                <div class="bg-blue-50 p-4 rounded border border-blue-200">
                    <h4 class="font-bold text-[#03045e] mb-2"> Gestión de Transporte (SST)</h4>
                    <p class="text-sm text-gray-600">Como líder de la salida, <strong>NO requiere adjuntar documentos del vehículo aquí.</strong><br>
                    El área de SST verificará los documentos reglamentarios (SOAT, Tecnomecánica, Pólizas).</p>
                </div>`;
            return; 
        }

        if (!this.isDocPhase) {
            docs.push({n:"Documento de Identidad", d:"Cédula, TI o Pasaporte (Ambas caras)"});
            if (dir === 'ENTRANTE') {
                docs.push({n:"Carta de Postulación", d:"Emitida por su Institución de Origen"});
                docs.push({n:"Historial Académico / Notas", d:"Expedido por su Universidad de Origen"});
            } else {
                if (this.role !== 'DOCENTE') docs.push({n:"Carta de Motivación", d:"Exposición de motivos personales"});
            }
        } else {
            if (dir === 'SALIENTE') docs.push({n:"Carta de Aceptación Oficial", d:"Documento emitido por la entidad o institución destino"});
            if (['Práctica Empresarial - Pasantía', 'Rotación Médica', 'Práctica Integral'].includes(type)) {
                docs.push({n:"Certificado de ARL", d:"Afiliación a Riesgos Laborales"});
            }
            if (isPresencial) {
                docs.push({n:"Póliza o Seguro Médico", d:"Cobertura específica para el viaje (EPS o Internacional)"});
                const scopeEl = document.getElementById('mobilityScope');
                if ((scopeEl && scopeEl.value === 'INTERNACIONAL') || dir === 'ENTRANTE') {
                    docs.push({n:"Tiquetes y/o Visa", d:"Soporte de viaje (Si aplica)"});
                }
            }
        }

        list.innerHTML = docs.map(d => `
            <div class="flex justify-between items-center p-3 border border-gray-200 bg-white rounded-lg mb-2 shadow-sm hover:border-[#0077b6] transition-all">
                <div class="flex gap-3 items-center">
                    <div class="bg-blue-50 p-2 rounded text-[#0077b6]"><i data-lucide="file-up"></i></div>
                    <div><p class="text-sm font-bold text-[#03045e]">${d.n}</p><p class="text-[10px] text-gray-500 uppercase">${d.d}</p></div>
                </div>
                <input type="file" class="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer">
            </div>`).join('');
        lucide.createIcons();
    },

    lockAllDataFields: function() {
        document.querySelectorAll('input, select').forEach(i => {
            if(i.type !== 'file' && i.id !== 'termsCheck') {
                i.disabled = true; i.classList.add('bg-gray-50', 'cursor-not-allowed', 'opacity-70');
            }
        });
    },

    lockContactFields: function() {
        const fields = ['sstContactName', 'sstContactRel', 'sstContactPhone', 'sstEps'];
        const cName = document.getElementById('sstContactName');
        const cRel = document.getElementById('sstContactRel');
        const cPhone = document.getElementById('sstContactPhone');
        const cEps = document.getElementById('sstEps');
        
        if(cName) cName.value = "Maria Pérez (Madre)";
        if(cRel) cRel.value = "Madre";
        if(cPhone) cPhone.value = "3001234567";
        if(cEps) cEps.value = "Sanitas EPS";

        fields.forEach(id => {
            const el = document.getElementById(id);
            if(el) { el.readOnly = true; el.classList.add('bg-gray-100', 'cursor-not-allowed'); }
        });
    },

    loadAgreements: function() {
        const selectDestino = document.getElementById('entity_select');
        const selectOrigen = document.getElementById('entity_select_origin');
        
        let convenios = JSON.parse(localStorage.getItem('CUE_CONVENIOS'));
        if (!convenios || convenios.length === 0) {
            convenios = [
                { nombre: "UNAM", pais: "México", ciudad: "Ciudad de México", vigencia: "2027-12-31" },
                { nombre: "BERUFSAKADEMIE MOSBACH", pais: "Alemania", ciudad: "Mosbach", vigencia: "2028-06-30" },
                { nombre: "ISEP", pais: "España", ciudad: "Madrid", vigencia: "2029-01-01" }
            ];
            localStorage.setItem('CUE_CONVENIOS', JSON.stringify(convenios));
        }

        let optionsHTML = '<option value="" selected disabled>Seleccione una Institución...</option>';
        convenios.forEach(c => {
            const isExpired = new Date(c.vigencia) < new Date();
            const optionText = isExpired ? `${c.nombre} (${c.pais}) - [CONVENIO VENCIDO]` : `${c.nombre} (${c.pais})`;
            optionsHTML += `<option value="${c.nombre}" data-pais="${c.pais}" data-ciudad="${c.ciudad}" ${isExpired ? 'disabled class="text-red-500 bg-red-50"' : ''}>${optionText}</option>`;
        });
        optionsHTML += `<option value="OTRA" class="font-bold text-[#0077b6]">-- OTRA INSTITUCIÓN / EMPRESA (Ingresar Manualmente) --</option>`;

        if(selectDestino) selectDestino.innerHTML = optionsHTML;
        if(selectOrigen) selectOrigen.innerHTML = optionsHTML;
    },

    checkOtherEntity: function() {
        const select = document.getElementById('entity_select');
        const libreContainer = document.getElementById('destinoLibreContainer');
        const otherInput = document.getElementById('other_entity_name');
        const country = document.getElementById('field_country');
        const city = document.getElementById('field_city');
        
        if(!select || !libreContainer) return;
        
        if (select.value === 'OTRA') {
            libreContainer.classList.remove('hidden');
            if(otherInput) otherInput.focus();
            if(country && city) {
                country.readOnly = false; city.readOnly = false;
                country.value = ""; city.value = "";
                country.classList.remove('bg-gray-100', 'cursor-not-allowed');
                city.classList.remove('bg-gray-100', 'cursor-not-allowed');
            }
        } else {
            libreContainer.classList.add('hidden');
            const opt = select.options[select.selectedIndex];
            if (opt && opt.getAttribute('data-pais') && country && city) {
                country.value = opt.getAttribute('data-pais');
                city.value = opt.getAttribute('data-ciudad');
                country.readOnly = true; city.readOnly = true;
                country.classList.add('bg-gray-100', 'cursor-not-allowed');
                city.classList.add('bg-gray-100', 'cursor-not-allowed');
            }
        }
    },

    checkOtherEntityOrigin: function() {
        const select = document.getElementById('entity_select_origin');
        const libreContainer = document.getElementById('origenLibreContainer');
        const otherInput = document.getElementById('other_origin_name');
        const country = document.getElementById('field_country_origin');
        const city = document.getElementById('field_city_origin');
        
        if(!select || !libreContainer) return;
        
        if (select.value === 'OTRA') {
            libreContainer.classList.remove('hidden');
            if(otherInput) otherInput.focus();
            if(country && city) {
                country.readOnly = false; city.readOnly = false;
                country.classList.remove('bg-gray-100', 'cursor-not-allowed');
                city.classList.remove('bg-gray-100', 'cursor-not-allowed');
            }
        } else {
            libreContainer.classList.add('hidden');
            const opt = select.options[select.selectedIndex];
            if (opt && opt.getAttribute('data-pais') && country && city) {
                country.value = opt.getAttribute('data-pais');
                city.value = opt.getAttribute('data-ciudad');
                country.readOnly = true; city.readOnly = true;
                country.classList.add('bg-gray-100', 'cursor-not-allowed');
                city.classList.add('bg-gray-100', 'cursor-not-allowed');
            }
        }
    },

    filterTypesByModality: function() {
        const select = document.getElementById('mobilityType');
        const modalityEl = document.getElementById('mobilityModality');
        if(!select || !modalityEl) return;
        
        const modality = modalityEl.value;
        select.innerHTML = '<option value="">Seleccione...</option>';
        const allTypes = [
            { t: "Intercambio Académico", modes: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Práctica Empresarial - Pasantía", modes: ["PRESENCIAL"] },
            { t: "Diplomado", modes: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Curso Corto", modes: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Estancia Investigación", modes: ["PRESENCIAL", "VIRTUAL"] },
            { t: "Rotación Médica", modes: ["PRESENCIAL"] },
            { t: "Voluntariado", modes: ["PRESENCIAL"] },
            { t: "Otro", modes: ["PRESENCIAL", "VIRTUAL"] }
        ];
        if (this.role === 'DOCENTE') {
            select.innerHTML += `<option value="Visita/Salida Académica">Visita/Salida Académica</option>`;
            select.innerHTML += `<option value="Evento Académico/Investigativo">Evento Académico/Investigativo</option>`;
        } else {
            allTypes.forEach(op => { if(op.modes.includes(modality)) select.innerHTML += `<option value="${op.t}">${op.t}</option>`; });
        }
        this.updateFields();
    },

    updateFields: function() {
        const modalityEl = document.getElementById('mobilityModality');
        const isPresencial = modalityEl ? modalityEl.value === 'PRESENCIAL' : true;
        const directionEl = document.getElementById('mobilityDirection');
        const direction = directionEl ? directionEl.value : 'SALIENTE';
        const typeEl = document.getElementById('mobilityType');
        const type = typeEl ? typeEl.value : '';
        
        document.querySelectorAll('.req-presencial').forEach(el => el.classList.toggle('hidden', !isPresencial));
        
        const origenCont = document.getElementById('origenContainer');
        const destinoCont = document.getElementById('destinoContainer');
        if(origenCont) origenCont.classList.toggle('hidden', direction !== 'ENTRANTE');
        if(destinoCont) destinoCont.classList.toggle('hidden', direction !== 'SALIENTE');

        const searchCont = document.getElementById('destinoSearchContainer');
        const freeCont = document.getElementById('destinoLibreContainer');
        const practiceCont = document.getElementById('practiceDetailsContainer');
        const extraCont = document.getElementById('extraFieldsContainer');
        
        if (searchCont && freeCont) {
            const noConvenioReq = ['Visita/Salida Académica', 'Evento Académico/Investigativo', 'Diplomado', 'Curso Corto', 'Curso Idiomas', 'Voluntariado', 'Otro'].includes(type);
            searchCont.classList.toggle('hidden', noConvenioReq);
            freeCont.classList.toggle('hidden', !noConvenioReq);
            if (noConvenioReq) {
                const c = document.getElementById('field_country'); const ci = document.getElementById('field_city');
                if(c) { c.readOnly = false; c.classList.remove('bg-gray-100', 'cursor-not-allowed'); }
                if(ci) { ci.readOnly = false; ci.classList.remove('bg-gray-100', 'cursor-not-allowed'); }
            } else {
                this.checkOtherEntity();
            }
        }

        if (practiceCont) practiceCont.classList.toggle('hidden', !['Práctica Empresarial - Pasantía', 'Práctica Integral', 'Rotación Médica', 'Estancia Investigación'].includes(type));
        
        if(extraCont) {
            const showEvent = type === 'Evento Académico/Investigativo';
            const showResearch = type === 'Estancia Investigación';
            extraCont.classList.toggle('hidden', !(showEvent || showResearch));
            
            const rf = document.getElementById('researchFields');
            const ef = document.getElementById('eventFields');
            if(rf) rf.classList.toggle('hidden', !showResearch);
            if(ef) ef.classList.toggle('hidden', !showEvent);
        }
        
        const transCont = document.getElementById('transportContainer');
        if(transCont) {
            transCont.classList.toggle('hidden', !(type === 'Visita/Salida Académica' && isPresencial));
            const hasT = document.getElementById('hiredTransport');
            const vDetails = document.getElementById('vehicleDetails');
            if(hasT && vDetails) vDetails.classList.toggle('hidden', !hasT.checked);
        }
    },

    step: function(dir) {
        // NUEVO: Validación estricta que evita avanzar sin seleccionar el tipo, pero sin congelarse.
        if(dir === 1 && this.stepIdx === 1) {
            const mType = document.getElementById('mobilityType');
            if(!mType || mType.value === "") {
                alert("Por favor, seleccione el Tipo Específico de Movilidad antes de continuar.");
                return; // Detiene el avance sin romper el código
            }
        }
        
        this.stepIdx += dir;
        if(this.stepIdx === 4) this.loadDocs();
        
        this.updateUI();
        window.scrollTo(0,0);
    },

    updateUI: function() {
        for(let i=1; i<=4; i++) {
            const stepEl = document.getElementById(`step-${i}`);
            const fallbackEl = document.getElementById(`step${i}`); 
            if(stepEl) stepEl.classList.toggle('hidden', i !== this.stepIdx);
            else if (fallbackEl) fallbackEl.classList.toggle('hidden', i !== this.stepIdx);

            const ind = document.querySelector(`.step-indicator[data-step="${i}"]`);
            if(ind) {
                if(i === this.stepIdx) ind.classList.add('active'); 
                else ind.classList.remove('active');
            }
        }

        const typeEl = document.getElementById('mobilityType');
        const isSalida = typeEl ? typeEl.value === 'Visita/Salida Académica' : false;
        
        const profRoster = document.getElementById('professorRosterData');
        const studPers = document.getElementById('studentPersonalData');
        if(profRoster) profRoster.classList.toggle('hidden', !isSalida);
        if(studPers) studPers.classList.toggle('hidden', isSalida);

        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        if(prevBtn) prevBtn.classList.toggle('hidden', this.stepIdx === 1 || this.isDocPhase);
        if(nextBtn) nextBtn.classList.toggle('hidden', this.stepIdx === 4);
        
        if(submitBtn) {
            submitBtn.classList.toggle('hidden', this.stepIdx !== 4);
            submitBtn.innerHTML = this.isDocPhase 
                ? `FINALIZAR CARGA DE DOCUMENTOS <i data-lucide="check-circle" class="w-4 h-4 ml-2 inline"></i>`
                : `RADICAR POSTULACIÓN <i data-lucide="send" class="w-4 h-4 ml-2 inline"></i>`;
        }
    },

    // =========================================================
    // NUEVO: SISTEMA DE GUARDADO Y CARGA DE BORRADORES
    // =========================================================
    save: function() {
        const mType = document.getElementById('mobilityType')?.value;
        if(!mType || mType === "") {
            alert("Para poder guardar un borrador, debe al menos seleccionar el 'Tipo Específico de Movilidad' en el Paso 1.");
            return;
        }

        let reqs = JSON.parse(localStorage.getItem('CUE_MY_REQUESTS') || '[]');
        
        const entitySelect = document.getElementById('entity_select');
        const destValue = entitySelect && entitySelect.value === 'OTRA' ? document.getElementById('other_entity_name').value : (entitySelect ? entitySelect.value : '');

        const draftData = {
            id: this.draftId || "REQ-" + Math.floor(Math.random()*10000),
            date: new Date().toLocaleDateString(),
            type: mType,
            dir: document.getElementById('mobilityDirection')?.value || 'SALIENTE',
            dest: destValue || 'Por definir',
            status: 'BORRADOR',
            userEmail: this.user.email,
            fechaInicio: document.getElementById('fechaInicio')?.value || '',
            fechaFin: document.getElementById('fechaFin')?.value || ''
        };

        if(this.draftId) {
            reqs = reqs.map(r => r.id === this.draftId ? { ...r, ...draftData } : r);
        } else {
            reqs.push(draftData);
            this.draftId = draftData.id;
        }

        localStorage.setItem('CUE_MY_REQUESTS', JSON.stringify(reqs));
        alert("Borrador guardado exitosamente. Puede retomarlo más tarde desde su panel de control.");
        window.location.href = 'dashboard-estudiante.html';
    },

    loadDraft: function(id) {
        const reqs = JSON.parse(localStorage.getItem('CUE_MY_REQUESTS') || '[]');
        const draft = reqs.find(r => r.id === id);
        if(draft) {
            const typeEl = document.getElementById('mobilityType');
            if(typeEl) typeEl.value = draft.type;
            
            const inicioEl = document.getElementById('fechaInicio');
            const finEl = document.getElementById('fechaFin');
            if(inicioEl && draft.fechaInicio) inicioEl.value = draft.fechaInicio;
            if(finEl && draft.fechaFin) finEl.value = draft.fechaFin;
            
            this.updateFields();
            this.calculateDuration();
        }
    },

    submit: function(e) {
        e.preventDefault();
        const terms = document.getElementById('termsCheck');
        if(terms && !terms.checked) return alert("Debe aceptar los términos institucionales.");
        
        let reqs = JSON.parse(localStorage.getItem('CUE_MY_REQUESTS')||'[]');
        
        if (this.role === 'RECTOR') {
            alert("Movilidad Registrada Automáticamente (Perfil Directivo).");
        } else if (this.isDocPhase) {
            alert("Anexos Documentales cargados. Su movilidad pasará a estado ACTIVO.");
            const urlParams = new URLSearchParams(window.location.search);
            const reqId = urlParams.get('id');
            if(reqId) {
                reqs = reqs.map(r => {
                    if(r.id === reqId) r.status = 'EN_REVISION_LEGALIZACION';
                    return r;
                });
                localStorage.setItem('CUE_MY_REQUESTS', JSON.stringify(reqs));
            }
        } else {
            const dirEl = document.getElementById('mobilityDirection');
            const dir = dirEl ? dirEl.value : 'SALIENTE';
            const initialStatus = (dir === 'ENTRANTE') ? 'EN_REVISION_TOTAL' : 'EN_REVISION_POSTULACION';
            
            const actividadesInput = document.getElementById('actividadesMovilidad');
            const actividadesTexto = actividadesInput && actividadesInput.value.trim() !== '' ? actividadesInput.value : 'Actividades por definir según revisión académica.';

            const entitySelect = document.getElementById('entity_select');
            const destValue = entitySelect && entitySelect.value === 'OTRA' ? document.getElementById('other_entity_name').value : (entitySelect ? entitySelect.value : '');

            // NUEVO: Si existía como borrador, lo actualizamos y cambiamos el estado. Si es nuevo, lo creamos.
            if(this.draftId) {
                reqs = reqs.map(r => {
                    if(r.id === this.draftId) {
                        r.status = initialStatus; r.dest = destValue; r.materias = actividadesTexto;
                    }
                    return r;
                });
            } else {
                reqs.push({
                    id: "REQ-"+Math.floor(Math.random()*10000),
                    date: new Date().toLocaleDateString(),
                    type: document.getElementById('mobilityType').value,
                    dir: dir,
                    dest: destValue,
                    materias: actividadesTexto, 
                    status: initialStatus,
                    userEmail: this.user.email
                });
            }

            localStorage.setItem('CUE_MY_REQUESTS', JSON.stringify(reqs));
            alert("Postulación Radicada. Será notificado cuando el área encargada revise su solicitud.");
        }
        window.location.href='dashboard-estudiante.html';
    },
    
    loadProfile: function() {
        if (this.role !== 'EXTERNO') {
            const doc = document.getElementById('autoDoc');
            const sem = document.getElementById('autoSem');
            const prom = document.getElementById('autoProm');
            if(doc) doc.value = "1094000000"; 
            if(sem) sem.value = "7";
            if(prom) prom.value = "4.2";
        }
    },

    calculateDuration: function() {
        const start = document.getElementById('fechaInicio')?.value;
        const end = document.getElementById('fechaFin')?.value;
        const out = document.getElementById('duracionCalculada');
        
        if(start && end && out) {
            const d1 = new Date(start);
            const d2 = new Date(end);
            if(d2 >= d1) {
                const diffTime = Math.abs(d2 - d1);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const months = Math.floor(diffDays / 30);
                const days = diffDays % 30;
                
                let result = [];
                if (months > 0) result.push(`${months} Mes(es)`);
                if (days > 0 || months === 0) result.push(`${days} Día(s)`);
                
                out.value = result.join(' y ');
            } else {
                out.value = "Error: Fechas inválidas";
            }
        }
    },

    toggleFinance: function() {
        const hasCosto = document.getElementById('hasCosto');
        const hasBeca = document.getElementById('hasBeca');
        const montoCosto = document.getElementById('montoCosto');
        const montoBeca = document.getElementById('montoBeca');
        
        if (hasCosto && montoCosto) {
            montoCosto.classList.toggle('hidden', hasCosto.value !== 'SI');
            if (hasCosto.value === 'SI') montoCosto.focus();
        }
        
        if (hasBeca && montoBeca) {
            montoBeca.classList.toggle('hidden', hasBeca.value !== 'SI');
            if (hasBeca.value === 'SI') montoBeca.focus();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => WizardLogic.init());