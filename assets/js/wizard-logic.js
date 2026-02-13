let currentStep = 1;
const totalSteps = 4;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Simular lectura de usuario autenticado
    const userType = localStorage.getItem('userRole') || 'ESTUDIANTE';
    document.getElementById('applicantType').value = userType;
    updateUI();
});

function updateUI() {
    // Mostrar/Ocultar Pasos
    for (let i = 1; i <= totalSteps; i++) {
        const stepDiv = document.getElementById(`step-${i}`);
        const indicator = document.querySelector(`.step-indicator[data-step="${i}"] div`);
        
        if (i === currentStep) {
            stepDiv.classList.remove('hidden');
            indicator.classList.remove('bg-gray-300', 'text-gray-600');
            indicator.classList.add('bg-[#03045e]', 'text-white');
        } else {
            stepDiv.classList.add('hidden');
            if (i < currentStep) {
                // Pasos completados
                indicator.classList.add('bg-[#0077b6]', 'text-white');
                indicator.innerHTML = '✓';
            } else {
                // Pasos futuros
                indicator.classList.add('bg-gray-300', 'text-gray-600');
                indicator.classList.remove('bg-[#03045e]', 'text-white', 'bg-[#0077b6]');
                indicator.innerHTML = i;
            }
        }
    }

    // Botones
    document.getElementById('prevBtn').classList.toggle('hidden', currentStep === 1);
    
    if (currentStep === totalSteps) {
        document.getElementById('nextBtn').classList.add('hidden');
        document.getElementById('submitBtn').classList.remove('hidden');
    } else {
        document.getElementById('nextBtn').classList.remove('hidden');
        document.getElementById('submitBtn').classList.add('hidden');
    }
}

function changeStep(direction) {
    // Aquí irían las validaciones (validateStep(currentStep))
    currentStep += direction;
    updateUI();
    window.scrollTo(0, 0);
}

// LÓGICA DE NEGOCIO: CONVENIOS (Pregunta 2)
function checkInstitutionStatus() {
    const input = document.getElementById('institutionInput').value;
    const alertDiv = document.getElementById('alertVencido');
    const manualDiv = document.getElementById('manualInstitutionFields');
    
    // Reset
    alertDiv.classList.add('hidden');
    manualDiv.classList.add('hidden');

    if (input.includes("VENCIDO")) {
        alertDiv.classList.remove('hidden');
    } else if (input.includes("Otra") || (input.length > 3 && !input.includes("Colombia") && !input.includes("Alemania"))) {
        // Lógica simplificada: Si selecciona "Otra" o escribe algo nuevo
        manualDiv.classList.remove('hidden');
    }
}

// LÓGICA DE NEGOCIO: TRANSPORTE Y SST (Pregunta 4)
function toggleTransportFields() {
    const type = document.getElementById('mobilityType').value;
    const section = document.getElementById('transportSection');
    
    if (type === 'SALIDA_ACADEMICA') {
        section.classList.remove('hidden');
    } else {
        section.classList.add('hidden');
        // Resetear checkbox si oculta
        document.getElementById('hiredTransport').checked = false;
        toggleVehicleDetails();
    }
}

function toggleVehicleDetails() {
    const isHired = document.getElementById('hiredTransport').checked;
    const details = document.getElementById('vehicleDetails');
    
    if (isHired) {
        details.classList.remove('hidden');
    } else {
        details.classList.add('hidden');
    }
}