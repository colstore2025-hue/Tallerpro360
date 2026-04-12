/**
 * marketplace_bridge.js - NEXUS-X 🛰️
 * Módulo de Interfaz de Puente para Marketplace Global
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

export default async function marketplaceBridge(container) {
    // 1. Limpieza de contenedores previos y preparación de fondo
    container.innerHTML = `
        <div class="w-full h-screen bg-[#010409] overflow-hidden flex flex-col animate-in fade-in duration-700">
            
            <div class="w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

            <iframe 
                src="marketplace.html" 
                class="w-full h-full border-none shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                title="Nexus-X Marketplace"
                allowfullscreen
                loading="lazy">
            </iframe>

            <div class="fixed bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#010409] to-transparent pointer-events-none"></div>
        </div>
    `;

    // 2. Lógica de Redimensión Dinámica (Opcional por si el dashboard tiene paddings)
    const adjustIframe = () => {
        const headerOffset = 0; // Ajustar si el dashboard tiene top bar fija
        const h = window.innerHeight - headerOffset;
        container.style.height = `${h}px`;
    };

    window.addEventListener('resize', adjustIframe);
    adjustIframe();
}
