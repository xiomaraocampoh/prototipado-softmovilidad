/**
 * Lógica Reparada y Unificada del Wizard de Movilidad
 * Sin dependencias de módulos ES6 para garantizar compatibilidad local.
 */

// 1. BASE DE DATOS SIMULADA (Integrada para evitar errores de importación local)
const AcademicDB = {
  students: [
    {
      id: "1094001",
      name: "Maria Luisa Londoño",
      program: "ING_SOFTWARE",
      semester: "7",
      status: "ACTIVO",
    },
    {
      id: "1094002",
      name: "Derly Elena Quejada",
      program: "ING_SOFTWARE",
      semester: "7",
      status: "ACTIVO",
    },
    {
      id: "1094003",
      name: "Jeronimo Rodriguez",
      program: "ING_SOFTWARE",
      semester: "7",
      status: "ACTIVO",
    },
    {
      id: "1094004",
      name: "Sara Valentina Sanchez",
      program: "ING_SOFTWARE",
      semester: "7",
      status: "ACTIVO",
    },
    {
      id: "1094006",
      name: "Carlos Augusto Aranzazu",
      program: "MEDICINA",
      semester: "5",
      status: "ACTIVO",
    },
  ],
  getStudentsByCourse: function (program, semester) {
    return this.students.filter(
      (s) => s.program === program && s.semester === semester,
    );
  },
};

// 2. LÓGICA DEL ASISTENTE
const WizardLogic = {
  currentStep: 1,
  totalSteps: 4,
  userRole: null,
  tripRoster: [], // Para almacenar estudiantes seleccionados

  init: function () {
    const user = AuthService.checkAuth();
    this.userRole = user.role.code;

    // UI Inicial
    document.getElementById("userNameDisplay").textContent = user.name;
    document.getElementById("userRoleDisplay").textContent = user.role.name;

    this.setupMobilityOptions();

    // Cargar Borrador si existe (Requerimiento Histórico)
    this.checkIfEditingDraft();

    this.updateUI();
  },

  // 1. CARGA INICIAL DEL PERFIL (Llamar esto dentro de init())
  loadProfileData: function () {
    const saved = JSON.parse(localStorage.getItem("CUE_USER_PROFILE"));
    if (saved) {
      // Suponiendo que tienes inputs con ids: docIdentidad, numCelular, semActual, promAcumulado
      const docInput = document.getElementById("docIdentidad");
      const phoneInput = document.getElementById("numCelular");
      const semInput = document.getElementById("semActual");
      const promInput = document.getElementById("promAcumulado");

      if (docInput) docInput.value = saved.doc || "";
      if (phoneInput) phoneInput.value = saved.phone || "";
      if (semInput) semInput.value = saved.sem || "";
      if (promInput) promInput.value = saved.prom || "";
    }
  },

  // 2. CÁLCULO DE DURACIÓN (Meses y Días)
  calculateDuration: function () {
    const startVal = document.getElementById("fechaInicio").value;
    const endVal = document.getElementById("fechaFin").value;
    const durationInput = document.getElementById("duracionCalculada");

    if (startVal && endVal) {
      const start = new Date(startVal);
      const end = new Date(endVal);

      if (end >= start) {
        // Cálculo preciso de meses y días
        let months =
          (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth());
        let days = end.getDate() - start.getDate();

        if (days < 0) {
          months--;
          // Obtener días del mes anterior
          const prevMonth = new Date(
            end.getFullYear(),
            end.getMonth(),
            0,
          ).getDate();
          days += prevMonth;
        }

        let resultText = [];
        if (months > 0) resultText.push(`${months} mes(es)`);
        if (days > 0 || months === 0) resultText.push(`${days} día(s)`);

        durationInput.value = resultText.join(" y ");
        durationInput.classList.add("bg-green-50", "text-green-700");
      } else {
        durationInput.value = "Error: Fecha Fin debe ser mayor";
        durationInput.classList.remove("bg-green-50", "text-green-700");
      }
    }
  },

  // 3. MOSTRAR/OCULTAR CAMPOS FINANCIEROS ("Cuánto")
  toggleFinanceFields: function () {
    const hasCosto = document.getElementById("hasCosto").value === "SI";
    const montoCosto = document.getElementById("montoCosto");
    if (montoCosto) {
      montoCosto.classList.toggle("hidden", !hasCosto);
      if (hasCosto) montoCosto.focus();
    }

    const hasBeca = document.getElementById("hasBeca").value === "SI";
    const montoBeca = document.getElementById("montoBeca");
    if (montoBeca) {
      montoBeca.classList.toggle("hidden", !hasBeca);
    }
  },

  setupMobilityOptions: function () {
    const select = document.getElementById("mobilityType");
    select.innerHTML = '<option value="">Seleccione Modalidad...</option>';

    if (this.userRole === "DOCENTE") {
      select.innerHTML += `
                <option value="SALIDA_ACADEMICA">Visita/Salida Académica</option>
                <option value="ESTANCIA">Estancia de Investigación</option>
            `;
    } else {
      select.innerHTML += `
                <option value="INTERCAMBIO">Intercambio Académico</option>
                <option value="PRACTICA">Práctica Empresarial / Pasantía</option>
                <option value="DIPLOMADO">Diplomado Opción Grado</option>
                <option value="CURSO">Curso Corto / Idiomas</option>
                <option value="ROTACION">Rotación Médica</option>
            `;
    }
  },

  handleMobilityTypeChange: function () {
    const type = document.getElementById("mobilityType").value;
    const alert = document.getElementById("academicTripAlert");
    const transportSection = document.getElementById("transportSection");

    if (type === "SALIDA_ACADEMICA") {
      if (alert) alert.classList.remove("hidden");
      if (transportSection) transportSection.classList.remove("hidden");
    } else {
      if (alert) alert.classList.add("hidden");
      if (transportSection) transportSection.classList.add("hidden");
    }
  },

  toggleTransportDetails: function () {
    const check = document.getElementById("hiredTransport");
    const section = document.getElementById("vehicleDetails");
    if (check && check.checked) section.classList.remove("hidden");
    else if (section) section.classList.add("hidden");
  },

  changeStep: function (direction) {
    // Validación antes de avanzar
    if (direction === 1 && this.currentStep === 1) {
      if (!document.getElementById("mobilityType").value) {
        alert("Por favor seleccione un tipo de movilidad para continuar.");
        return;
      }
    }

    this.currentStep += direction;
    this.updateUI();
    window.scrollTo(0, 0);
  },

  updateUI: function () {
    // Mostrar/Ocultar Pasos
    for (let i = 1; i <= this.totalSteps; i++) {
      const stepDiv = document.getElementById(`step-${i}`);
      const indicator = document.querySelector(
        `.step-indicator[data-step="${i}"]`,
      );
      if (stepDiv) stepDiv.classList.toggle("hidden", i !== this.currentStep);

      if (indicator) {
        if (i === this.currentStep) indicator.classList.add("active");
        else indicator.classList.remove("active");
      }
    }

    // Condicionales Paso 3 (Dual List vs Estudiante Individual)
    if (this.currentStep === 3) {
      const isDocenteSalida =
        this.userRole === "DOCENTE" &&
        document.getElementById("mobilityType").value === "SALIDA_ACADEMICA";
      document
        .getElementById("professorRosterData")
        .classList.toggle("hidden", !isDocenteSalida);
      document
        .getElementById("studentPersonalData")
        .classList.toggle("hidden", isDocenteSalida);
    }

    // Botones Footer
    document
      .getElementById("prevBtn")
      .classList.toggle("hidden", this.currentStep === 1);
    if (this.currentStep === this.totalSteps) {
      document.getElementById("nextBtn").classList.add("hidden");
      document.getElementById("submitBtn").classList.remove("hidden");
    } else {
      document.getElementById("nextBtn").classList.remove("hidden");
      document.getElementById("submitBtn").classList.add("hidden");
    }
  },

  // Funciones Dual List (Docentes)
  searchStudents: function () {
    const prog = document.getElementById("searchProgram").value;
    const sem = document.getElementById("searchSemester").value;
    const listContainer = document.getElementById("sourceList");

    if (!prog) return alert("Seleccione un programa académico");

    const students = AcademicDB.getStudentsByCourse(prog, sem);
    listContainer.innerHTML = "";

    if (students.length === 0) {
      listContainer.innerHTML =
        '<div class="text-center text-xs text-red-500 p-4">Sin resultados.</div>';
      return;
    }

    students.forEach((student) => {
      if (this.tripRoster.some((s) => s.id === student.id)) return; // Saltar si ya está
      listContainer.innerHTML += `
                <div class="flex justify-between p-2 border-b hover:bg-gray-50 text-xs">
                    <div><b>${student.name}</b><br><span class="text-gray-400">ID: ${student.id}</span></div>
                    <button type="button" onclick="WizardLogic.addStudent('${student.id}', '${student.name}')" class="text-green-600 bg-green-50 px-2 rounded font-bold">+</button>
                </div>`;
    });
  },

  addStudent: function (id, name) {
    this.tripRoster.push({ id, name });
    this.renderSelectedList();
    this.searchStudents();
  },

  removeStudent: function (id) {
    this.tripRoster = this.tripRoster.filter((s) => s.id !== id);
    this.renderSelectedList();
    this.searchStudents();
  },

  renderSelectedList: function () {
    const targetList = document.getElementById("targetList");
    document.getElementById("countSelected").innerText = this.tripRoster.length;
    targetList.innerHTML = "";

    this.tripRoster.forEach((s) => {
      targetList.innerHTML += `
                <div class="flex justify-between p-2 bg-blue-50 mb-1 border border-blue-100 rounded text-xs">
                    <div><b>${s.name}</b></div>
                    <button type="button" onclick="WizardLogic.removeStudent('${s.id}')" class="text-red-600 font-bold px-2">X</button>
                </div>`;
    });
  },

  // GUARDADO Y BORRADOR
  saveDraft: function () {
    const data = {
      id: "REQ-" + Math.floor(Math.random() * 10000),
      date: new Date().toLocaleDateString(),
      type: document.getElementById("mobilityType").value,
      destination:
        document.getElementById("institutionInput")?.value || "Sin definir",
      status: "BORRADOR",
    };

    let requests = JSON.parse(localStorage.getItem("CUE_MY_REQUESTS") || "[]");

    // Si estamos editando un borrador, sobreescribimos
    const editingIndex = localStorage.getItem("CUE_EDITING_INDEX");
    if (editingIndex !== null) {
      requests[editingIndex] = data;
      localStorage.removeItem("CUE_EDITING_INDEX");
    } else {
      requests.push(data);
    }

    localStorage.setItem("CUE_MY_REQUESTS", JSON.stringify(requests));
    alert("Borrador guardado exitosamente.");
    window.location.href = "dashboard-estudiante.html";
  },

  submitFinal: function (e) {
    e.preventDefault();
    if (!document.getElementById("terms").checked) {
      alert(
        "Debe aceptar la declaración juramentada para radicar la solicitud.",
      );
      return;
    }

    const data = {
      id: "REQ-2026-" + Math.floor(Math.random() * 10000),
      date: new Date().toLocaleDateString(),
      type: document.getElementById("mobilityType").value,
      destination: document.getElementById("institutionInput")?.value,
      status: "EN_REVISION_ANI",
    };

    let requests = JSON.parse(localStorage.getItem("CUE_MY_REQUESTS") || "[]");
    const editingIndex = localStorage.getItem("CUE_EDITING_INDEX");

    if (editingIndex !== null) {
      requests[editingIndex] = data;
      localStorage.removeItem("CUE_EDITING_INDEX");
    } else {
      requests.push(data);
    }

    localStorage.setItem("CUE_MY_REQUESTS", JSON.stringify(requests));
    alert("Solicitud Radicada Exitosamente. Será redirigido a su panel.");
    window.location.href = "dashboard-estudiante.html";
  },

  checkIfEditingDraft: function () {
    const editingIndex = localStorage.getItem("CUE_EDITING_INDEX");
    if (editingIndex !== null) {
      // Rellenar datos mock (En prod se llena con los datos reales del borrador)
      console.log("Cargando borrador...");
    }
  },
};

// Exponer al objeto global para que funcionen los onclicks en el HTML
window.WizardLogic = WizardLogic;

// Inicializar al cargar
document.addEventListener("DOMContentLoaded", () => WizardLogic.init());
