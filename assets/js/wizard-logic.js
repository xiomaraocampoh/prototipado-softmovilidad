/**
 * Lógica de Negocio: Movilidad CUE (Modelo Profesional por Etapas SRS)
 */

const WizardLogic = {
    stepIdx: 1,
    role: null,
    isDocPhase: false, // false = Etapa 1 (Postulación), true = Etapa 2 (Carga de Anexos Finales)

    init: function() {
        const user = AuthService.checkAuth();
        this.user = user;
        this.role = user.role.code;
        
        // Detectar si estamos en ETAPA 2 (Aprobado inicial, requiere anexos)
        const urlParams = new URLSearchParams(window.location.search);
        this.isDocPhase = urlParams.get('mode') === 'docs';

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
        }
        
        lucide.createIcons();
    },

    setupUI: function() {
        const title = this.role === 'DOCENTE' ? 'Registro de Salida Académica' : 'Solicitud de Movilidad';
        const titleEl = document.getElementById('formTitle');
        if(titleEl) titleEl.innerText = title;
        document.getElementById('mobilityDirection').value = (this.role === 'EXTERNO') ? 'ENTRANTE' : 'SALIENTE';
    },

    // =========================================================
    // MOTOR DOCUMENTAL INTELIGENTE (2 PASOS PARA TODOS)
    // =========================================================
    loadDocs: function() {
        const list = document.getElementById('docsList');
        const type = document.getElementById('mobilityType').value;
        const dir = document.getElementById('mobilityDirection').value;
        const isPresencial = document.getElementById('mobilityModality').value === 'PRESENCIAL';
        let docs = [];

        // --- EXCEPCIÓN: SALIDA ACADÉMICA (SST) ---
        if (type === 'Visita/Salida Académica') {
            list.innerHTML = `
                <div class="bg-blue-50 p-4 rounded border border-blue-200">
                    <h4 class="font-bold text-[#03045e] mb-2"> Gestión de Transporte (SST)</h4>
                    <p class="text-sm text-gray-600">Como líder de la salida, <strong>NO requiere adjuntar documentos del vehículo aquí.</strong><br>
                    El área de SST verificará los documentos reglamentarios (SOAT, Tecnomecánica, Pólizas).</p>
                </div>`;
            return; 
        }

        // ==========================================
        // ETAPA 1: POSTULACIÓN (Permiso inicial)
        // ==========================================
        if (!this.isDocPhase) {
            docs.push({n:"Documento de Identidad", d:"Cédula, TI o Pasaporte (Ambas caras)"});
            
            if (dir === 'ENTRANTE') {
                // Externos SÍ suben notas y postulación
                docs.push({n:"Carta de Postulación", d:"Emitida por su Institución de Origen"});
                docs.push({n:"Historial Académico / Notas", d:"Expedido por su Universidad de Origen"});
            } else {
                // Internos (Salientes) NO suben notas, el sistema ya tiene su promedio.
                if (this.role !== 'DOCENTE') {
                    docs.push({n:"Carta de Motivación", d:"Exposición de motivos personales"});
                }
            }
        } 
        // ==========================================
        // ETAPA 2: DOCUMENTACIÓN FINAL (Ya fue aprobado)
        // ==========================================
        else {
            // Aceptación oficial (Los salientes la traen de afuera, los entrantes la reciben de la CUE)
            if (dir === 'SALIENTE') {
                docs.push({n:"Carta de Aceptación Oficial", d:"Documento emitido por la entidad o institución destino"});
            }

            if (['Práctica Empresarial - Pasantía', 'Rotación Médica', 'Práctica Integral'].includes(type)) {
                docs.push({n:"Certificado de ARL", d:"Afiliación a Riesgos Laborales"});
            }

            if (isPresencial) {
                docs.push({n:"Póliza o Seguro Médico", d:"Cobertura específica para el viaje (EPS o Internacional)"});
                
                if (document.getElementById('mobilityScope').value === 'INTERNACIONAL' || dir === 'ENTRANTE') {
                    docs.push({n:"Tiquetes y/o Visa", d:"Soporte de viaje (Si aplica)"});
                }
            }
        }

        // Renderizar Lista
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
                i.disabled = true;
                i.classList.add('bg-gray-50', 'cursor-not-allowed', 'opacity-70');
            }
        });
    },

    lockContactFields: function() {
        const fields = ['sstContactName', 'sstContactRel', 'sstContactPhone', 'sstEps'];
        document.getElementById('sstContactName').value = "Maria Pérez (Madre)";
        document.getElementById('sstContactRel').value = "Madre";
        document.getElementById('sstContactPhone').value = "3001234567";
        document.getElementById('sstEps').value = "Sanitas EPS";

        fields.forEach(id => {
            const el = document.getElementById(id);
            if(el) { el.readOnly = true; el.classList.add('bg-gray-100', 'cursor-not-allowed'); }
        });
    },

  // =========================================================
    // GESTIÓN DE CONVENIOS (CONEXIÓN CON SECRETARÍA ANI)
    // =========================================================
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
        // Lógica para Salientes (Destino)
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
        // Lógica para Entrantes (Origen)
        const select = document.getElementById('entity_select_origin');
        const libreContainer = document.getElementById('origenLibreContainer');
        const otherInput = document.getElementById('other_origin_name');
        const country = document.getElementById('field_country_origin');
        const city = document.getElementById('field_city_origin');
        
        if(!select || !libreContainer) return;
        
        if (select.value === 'OTRA') {
            libreContainer.classList.remove('hidden');
            if(otherInput) otherInput.focus();
        } else {
            libreContainer.classList.add('hidden');
            const opt = select.options[select.selectedIndex];
            if (opt && opt.getAttribute('data-pais') && country && city) {
                country.value = opt.getAttribute('data-pais');
                city.value = opt.getAttribute('data-ciudad');
                // Al ser el origen de un convenio, bloqueamos la edición del país y ciudad
                country.readOnly = true; city.readOnly = true;
                country.classList.add('bg-gray-100', 'cursor-not-allowed');
                city.classList.add('bg-gray-100', 'cursor-not-allowed');
            }
        }
    },

    filterTypesByModality: function() {
        const select = document.getElementById('mobilityType');
        const modality = document.getElementById('mobilityModality').value;
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
        const isPresencial = document.getElementById('mobilityModality').value === 'PRESENCIAL';
        const direction = document.getElementById('mobilityDirection').value;
        const type = document.getElementById('mobilityType').value;
        
        document.querySelectorAll('.req-presencial').forEach(el => el.classList.toggle('hidden', !isPresencial));
        document.getElementById('origenContainer').classList.toggle('hidden', direction !== 'ENTRANTE');
        document.getElementById('destinoContainer').classList.toggle('hidden', direction !== 'SALIENTE');

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
                if(typeof AgreementService !== 'undefined') this.checkOtherEntity();
            }
        }

        if (practiceCont) practiceCont.classList.toggle('hidden', !['Práctica Empresarial - Pasantía', 'Práctica Integral', 'Rotación Médica', 'Estancia Investigación'].includes(type));
        
        if(extraCont) {
            const showEvent = type === 'Evento Académico/Investigativo';
            const showResearch = type === 'Estancia Investigación';
            extraCont.classList.toggle('hidden', !(showEvent || showResearch));
            document.getElementById('researchFields').classList.toggle('hidden', !showResearch);
            document.getElementById('eventFields').classList.toggle('hidden', !showEvent);
        }
        
        const transCont = document.getElementById('transportContainer');
        if(transCont) {
            transCont.classList.toggle('hidden', !(type === 'Visita/Salida Académica' && isPresencial));
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

        document.getElementById('prevBtn').classList.toggle('hidden', this.stepIdx === 1 || this.isDocPhase);
        document.getElementById('nextBtn').classList.toggle('hidden', this.stepIdx === 4);
        
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.classList.toggle('hidden', this.stepIdx !== 4);
        submitBtn.innerHTML = this.isDocPhase 
            ? `FINALIZAR CARGA DE DOCUMENTOS <i data-lucide="check-circle" class="w-4 h-4 ml-2 inline"></i>`
            : `RADICAR POSTULACIÓN <i data-lucide="send" class="w-4 h-4 ml-2 inline"></i>`;
    },

    submit: function(e) {
        e.preventDefault();
        if(!document.getElementById('termsCheck').checked) return alert("Debe aceptar los términos institucionales.");
        
        let reqs = JSON.parse(localStorage.getItem('CUE_MY_REQUESTS')||'[]');
        
        if (this.role === 'RECTOR') {
            alert("Movilidad Registrada Automáticamente (Perfil Directivo).");
        } else if (this.isDocPhase) {
            alert("Anexos Documentales cargados. Su movilidad pasará a estado ACTIVO.");
        } else {
            const dir = document.getElementById('mobilityDirection').value;
            const initialStatus = (dir === 'ENTRANTE') ? 'EN_REVISION_TOTAL' : 'EN_REVISION_POSTULACION';
            
            // Captura universal de la descripción de actividades
            const actividadesInput = document.getElementById('actividadesMovilidad');
            const actividadesTexto = actividadesInput && actividadesInput.value.trim() !== '' 
                ? actividadesInput.value 
                : 'Actividades por definir según revisión académica.';

            alert("Postulación Radicada. Será notificado cuando el área encargada revise su solicitud.");
            reqs.push({
                id: "REQ-"+Math.floor(Math.random()*10000),
                date: new Date().toLocaleDateString(),
                type: document.getElementById('mobilityType').value,
                dir: dir,
                materias: actividadesTexto, // Guardado universal para que llegue a Registro y ANI
                status: initialStatus,
                userEmail: this.user.email
            });
            localStorage.setItem('CUE_MY_REQUESTS', JSON.stringify(reqs));
        }
        window.location.href='dashboard-estudiante.html';
    },
    
    loadProfile: function() {}, calculateDuration: function() {}, toggleFinance: function() {}
};

document.addEventListener('DOMContentLoaded', () => WizardLogic.init());