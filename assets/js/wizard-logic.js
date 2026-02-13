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
        
        this.setupTypes();
        this.loadAgreements(); // Cargar base de datos de convenios
        this.loadProfile();
        this.updateFields();
        this.updateUI();
        lucide.createIcons();
    },

    setupTypes: function() {
        const select = document.getElementById('mobilityType');
        select.innerHTML = '<option value="">Seleccione...</option>';
        const opciones = [
            "Intercambio Académico", "Evento Académico/Investigativo", 
            "Práctica Empresarial - Pasantía", "Diplomado", "Curso Corto", 
            "Estancia Investigación", "Curso Idiomas", "Voluntariado", 
            "Rotación Médica", "Práctica Integral", "Otro"
        ];

        if (this.role === 'DOCENTE') {
            select.innerHTML += `<option value="Visita/Salida Académica">Visita/Salida Académica</option>`;
            select.innerHTML += `<option value="Evento Académico/Investigativo">Evento Académico/Investigativo</option>`;
        } else {
            opciones.forEach(op => select.innerHTML += `<option value="${op}">${op}</option>`);
        }
    },

    // ==========================================
    // NUEVA LÓGICA DE CONVENIOS Y AUTOCOMPLETADO
    // ==========================================
    loadAgreements: function() {
        const select = document.getElementById('entity_select');
        if(!select) return;

        // Base de datos de convenios simulada
        const convenios = [
            { nombre: "UNAM", pais: "México", ciudad: "Ciudad de México" },
            { nombre: "BERUFSAKADEMIE MOSBACH", pais: "Alemania", ciudad: "Mosbach" },
            { nombre: "CORHUILA", pais: "Colombia", ciudad: "Neiva" },
            { nombre: "DHBW RAVENSBURG", pais: "Alemania", ciudad: "Ravensburg" },
            { nombre: "ISEP", pais: "España", ciudad: "Madrid" },
            { nombre: "UNIVERSIDAD DE SALAMANCA", pais: "España", ciudad: "Salamanca" },
            { nombre: "SAN MARTÍN DE PORRES", pais: "Perú", ciudad: "Lima" }
        ];
        
        select.innerHTML = '<option value="" selected disabled>Seleccione una Institución...</option>';
        convenios.forEach(c => {
            select.innerHTML += `<option value="${c.nombre}" data-pais="${c.pais}" data-ciudad="${c.ciudad}">${c.nombre} (${c.pais})</option>`;
        });
        select.innerHTML += `<option value="OTRA" class="font-bold text-[#0077b6]">-- OTRA (Ingresar Manualmente) --</option>`;
    },

    checkOtherEntity: function() {
        const select = document.getElementById('entity_select');
        const libreContainer = document.getElementById('destinoLibreContainer');
        const otherInput = document.getElementById('other_entity_name');
        const country = document.getElementById('field_country');
        const city = document.getElementById('field_city');
        
        if(!select || !country || !city) return;
        const option = select.options[select.selectedIndex];
        
        if (select.value === 'OTRA') {
            // Mostrar input libre y habilitar país/ciudad
            libreContainer.classList.remove('hidden');
            otherInput.focus();
            country.value = ''; city.value = '';
            country.readOnly = false; city.readOnly = false;
            country.classList.remove('bg-gray-100', 'text-gray-500'); 
            city.classList.remove('bg-gray-100', 'text-gray-500');
        } else {
            // Ocultar input libre, autocompletar y bloquear país/ciudad
            libreContainer.classList.add('hidden');
            if (option && option.getAttribute('data-pais')) {
                country.value = option.getAttribute('data-pais');
                city.value = option.getAttribute('data-ciudad');
                
                // Efecto visual de bloqueo
                country.readOnly = true; city.readOnly = true;
                country.classList.add('bg-gray-100', 'text-gray-500'); 
                city.classList.add('bg-gray-100', 'text-gray-500');
            }
        }
    },
    // ==========================================

    loadProfile: function() {
        const saved = JSON.parse(localStorage.getItem('CUE_USER_PROFILE') || '{}');
        if(document.getElementById('autoDoc')) document.getElementById('autoDoc').value = saved.doc || 'Sin registrar';
        if(document.getElementById('autoSem')) document.getElementById('autoSem').value = saved.sem || '';
        if(document.getElementById('autoProm')) document.getElementById('autoProm').value = saved.prom || '';
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

        // LÓGICA DE DESTINO
        const searchCont = document.getElementById('destinoSearchContainer');
        const freeCont = document.getElementById('destinoLibreContainer');
        const extraCont = document.getElementById('extraFieldsContainer');
        
        if (searchCont && freeCont) {
            const noConvenioReq = ['Visita/Salida Académica', 'Evento Académico/Investigativo', 'Diplomado', 'Curso Corto', 'Curso Idiomas', 'Voluntariado'].includes(type);
            
            if (noConvenioReq) {
                // Si no exige convenio, oculta el Select de convenios y abre los campos libres
                searchCont.classList.add('hidden');
                freeCont.classList.remove('hidden');
                
                // Desbloquea país y ciudad
                const country = document.getElementById('field_country');
                const city = document.getElementById('field_city');
                country.readOnly = false; city.readOnly = false;
                country.classList.remove('bg-gray-100', 'text-gray-500'); 
                city.classList.remove('bg-gray-100', 'text-gray-500');
            } else {
                // Si exige convenio, muestra el Select y ejecuta la validación actual
                searchCont.classList.remove('hidden');
                this.checkOtherEntity(); 
            }
        }

        if(extraCont) {
            const showResearch = type === 'Estancia Investigación';
            const showEvent = type === 'Evento Académico/Investigativo';
            extraCont.classList.toggle('hidden', !(showResearch || showEvent));
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
        if(dir===1 && this.stepIdx===1 && !document.getElementById('mobilityType').value) return alert("Seleccione el Tipo Específico de Movilidad.");
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
        
        let docs = [{n:"Documento de Identidad", d:"PDF Ambas Caras"}];
        
        if(this.role !== 'DOCENTE') docs.push({n:"Historial Académico (Descarga de Q10)", d:"PDF"});
        if(isPresencial) docs.push({n:"Certificado EPS / Seguro Médico Vigente", d:"PDF"});
        if(isInternacional && isPresencial) docs.push({n:"Pasaporte y Seguro Médico Internacional", d:"PDF"}, {n:"Visa y Tiquetes (Pueden subirse luego)", d:"Opcional en esta fase"});

        if(dir === 'ENTRANTE') {
            docs.push({n:"Carta Postulación Institución Origen", d:"Obligatorio"});
        } else {
            if(type === 'Intercambio Académico') docs.push({n:"Formato Homologación Asignaturas", d:"Firmado por Programa"});
            if(type === 'Práctica Empresarial - Pasantía' || type === 'Rotación Médica' || type === 'Práctica Integral') docs.push({n:"Carta de Aceptación Entidad", d:"PDF"}, {n:"Certificado ARL", d:"PDF Riesgos Laborales"});
            if(type === 'Estancia Investigación') docs.push({n:"Carta Aceptación Tutor/Investigador", d:"PDF"});
            if(type === 'Evento Académico/Investigativo') docs.push({n:"Soporte Inscripción o Invitación al Evento", d:"PDF"});
            if(type === 'Diplomado' || type === 'Curso Corto' || type === 'Curso Idiomas') docs.push({n:"Soporte Inscripción/Pago", d:"PDF"});
            if(type === 'Doble Titulación') docs.push({n:"Plan de Estudios Aprobado", d:"Firma Decanatura"});
            if(type === 'Voluntariado') docs.push({n:"Carta Aceptación ONG/Fundación", d:"PDF"});
            if(type !== 'Visita/Salida Académica') docs.push({n:"Carta de Motivación", d:"PDF Personal"});
        }

        if(type === 'Visita/Salida Académica' && hasTransport && isPresencial) {
            docs.push(
                {n:"SOAT y Revisión Tecnomecánica", d:"Obligatorio SST Transporte"}, 
                {n:"Póliza Contractual y Extracontractual", d:"Obligatorio SST Seguros"}, 
                {n:"Licencia y ARL Conductor", d:"Obligatorio Legal"},
                {n:"Tarjeta Propiedad / Ficha Técnica", d:"Vehículo"}
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