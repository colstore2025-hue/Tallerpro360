/**
 * TallerPRO360 - Technical Assistant Satellite
 * Integración Independiente con AllData Repair
 */

(function() {
    // 1. Crear el contenedor del asistente técnico
    const assistantContainer = document.createElement('div');
    assistantContainer.id = 'nexus-technical-assistant';
    assistantContainer.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
    `;

    // 2. Botón de activación (Estética Orbitron/Nexus)
    const techButton = document.createElement('button');
    techButton.innerHTML = `
        <div style="background: #0ea5e9; padding: 12px; border-radius: 50%; box-shadow: 0 0 15px #0ea5e9;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.83 2.83l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.83 2.83l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.83 2.83l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0"></path><path d="m10 14-5-5L1.3 12.7a2 2 0 0 0 0 2.8l3.2 3.2a2 2 0 0 0 2.8 0L10 14Z"></path><path d="m14 10 5 5 3.7-3.7a2 2 0 0 0 0-2.8l-3.2-3.2a2 2 0 0 0-2.8 0L14 10Z"></path></svg>
        </div>
        <span style="display:block; font-family:'Orbitron'; font-size:8px; color:#0ea5e9; font-weight:bold; margin-top:5px;">ALLDATA_REF</span>
    `;
    techButton.style.cssText = "background:none; border:none; cursor:pointer; outline:none;";

    // 3. Lógica de apertura
    techButton.onclick = function() {
        // Intentamos capturar la placa o unidad desde el DOM de ordenes.js si está disponible
        const unidadElement = document.querySelector('.unidad-telemetria') || {innerText: ''};
        const unidad = unidadElement.innerText;
        
        console.log("🛰️ NEXUS_X: Abriendo asistente técnico para unidad " + unidad);
        
        // Abrir AllData en una pestaña nueva para no perder el progreso de la orden
        window.open("https://www.alldata.com/es-mx/repair", "_blank", "width=1200,height=800");
    };

    assistantContainer.appendChild(techButton);
    document.body.appendChild(assistantContainer);
})();
