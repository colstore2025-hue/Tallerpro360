/**
 * marketplace_bridge.js - NEXUS-X 🛰️
 * Módulo de Integración Nativa para MarketX
 * Optimizado para TallerPRO360 ERP - 100% Case Sensitive Compatible
 */

export default async function marketplaceBridge(container) {
    // Normalizamos el plan a mayúsculas para la lógica interna
    const plan = (localStorage.getItem("nexus_plan") || "GRATI-CORE").toUpperCase();
    
    // 🛡️ Verificación de Seguridad de Capa ERP
    if (plan !== "PRO" && plan !== "ELITE") {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-[80vh] p-20 text-center animate-in zoom-in duration-500">
                <i class="fas fa-lock text-6xl text-cyan-500/20 mb-8"></i>
                <h2 class="orbitron text-2xl font-black text-white italic">MÓDULO DE ACTIVOS BLOQUEADO</h2>
                <p class="text-slate-500 mt-4 max-w-md">La vitrina comercial MarketX y la gestión de activos logística USA-LATAM requieren un nivel de enlace PRO o ELITE.</p>
                <button onclick="location.hash='#pagos'" class="mt-8 px-10 py-4 bg-cyan-600 text-white orbitron text-[10px] font-black rounded-2xl hover:bg-white hover:text-black transition-all">ELEVAR NIVEL DE ENLACE</button>
            </div>
        `;
        return;
    }

    // 🚀 Inyección de la terminal Marketplace
    // Nota: El src "marketplace.html" debe estar en la raíz o ruta relativa correcta
    container.innerHTML = `
        <div class="w-full h-[85vh] bg-[#010409] flex flex-col animate-in fade-in duration-700 relative rounded-[3rem] overflow-hidden border border-white/5">
            <div id="market-loader" class="absolute inset-0 flex items-center justify-center bg-[#010409] z-50 transition-opacity duration-1000">
                <div class="flex flex-col items-center">
                    <div class="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <p class="orbitron text-[8px] text-cyan-500 mt-4 tracking-[0.5em] animate-pulse">ENLAZANDO TERMINAL MARKETX...</p>
                </div>
            </div>

            <iframe 
                id="iframe-market"
                src="marketplace.html" 
                class="w-full h-full border-none opacity-0 transition-opacity duration-1000"
                title="Nexus-X Marketplace"
                allowfullscreen>
            </iframe>

            <div class="absolute bottom-0 left-0 w-full p-4 bg-black/80 backdrop-blur-md border-t border-white/5 flex justify-between items-center z-40">
                <div class="flex items-center gap-4">
                    <span class="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span class="orbitron text-[7px] text-slate-400 tracking-widest uppercase font-bold">Enlace Satelital Activo</span>
                </div>
                <p class="orbitron text-[7px] text-slate-600 tracking-tighter uppercase font-black italic">Logística USA-LATAM v3.5</p>
            </div>
        </div>
    `;

    const iframe = document.getElementById('iframe-market');
    const loader = document.getElementById('market-loader');

    // 🔄 Manejo de carga suave (Smooth Transition)
    if (iframe) {
        iframe.onload = () => {
            if (loader) {
                loader.classList.add('opacity-0');
                setTimeout(() => {
                    if(loader.parentNode) loader.remove();
                }, 1000);
            }
            iframe.classList.remove('opacity-0');
            iframe.classList.add('opacity-100');
        };

        // Fallback de seguridad (5 segundos) por si hay latencia en el servidor
        setTimeout(() => {
            if (loader && loader.parentNode) {
                loader.remove();
                iframe.classList.remove('opacity-0');
            }
        }, 5000);
    }
}
