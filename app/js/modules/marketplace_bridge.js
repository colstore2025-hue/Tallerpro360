/**
 * marketplace_bridge.js - NEXUS-X AEGIS V50.1 🛰️
 * NODO DE ACTIVOS GLOBALES & INTERCONEXIÓN LOGÍSTICA
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { db } from "../core/firebase-config.js";
import { collection, query, onSnapshot, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function marketplace_bridge(container) {
    const plan = (localStorage.getItem("planTipo") || "ELITE").toUpperCase();
    const rol = (localStorage.getItem("rol") || "TECNICO").toUpperCase();

    // 🛡️ PROTOCOLO DE ACCESO NIVEL 5
    if (plan !== "PRO" && plan !== "ELITE") {
        renderLock(container);
        return;
    }

    // 🏗️ ESTRUCTURA DE COMANDO TÁCTICO
    container.innerHTML = `
    <div class="p-4 lg:p-10 animate-in zoom-in-95 duration-700 max-w-[1600px] mx-auto">
        
        <header class="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 border-b border-white/5 pb-10 gap-6">
            <div class="relative pl-6">
                <div class="absolute left-0 top-0 h-full w-1 bg-cyan-500 shadow-[0_0_20px_#06b6d4]"></div>
                <h1 class="orbitron text-5xl font-black italic text-white tracking-tighter">MARKET<span class="text-cyan-400">X</span></h1>
                <div class="flex items-center gap-4 mt-2">
                    <p class="text-[9px] text-slate-500 orbitron tracking-[0.4em]">SISTEMA DE ADQUISICIÓN GLOBAL</p>
                    <span class="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-[7px] orbitron animate-pulse">BRIDGE ACTIVE</span>
                </div>
            </div>
            
            <div class="flex gap-4 w-full lg:w-auto">
                <div class="bg-[#0d1117] border border-white/5 p-4 rounded-2xl hidden md:block">
                    <p class="text-[7px] orbitron text-slate-500 uppercase mb-1">USA-COL Corridor</p>
                    <p class="text-[10px] orbitron font-black text-emerald-400">CHARLOTTE HUB: ONLINE</p>
                </div>
                <button onclick="location.hash='#publish_mision'" class="flex-1 lg:flex-none px-8 py-5 bg-white text-black orbitron text-[10px] font-black rounded-3xl hover:bg-cyan-500 hover:text-white transition-all shadow-xl active:scale-95">
                    <i class="fas fa-satellite-dish mr-2"></i> INICIAR MISIÓN DE VENTA
                </button>
            </div>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            ${renderIntelligenceCard('OPORTUNIDAD DE IMPORTACIÓN', 'Harley Parts - 22% OFF vs Local', 'fa-plane-import', 'text-cyan-400')}
            ${renderIntelligenceCard('DEMANDA ACTIVA', '7 Motores en búsqueda en la red', 'fa-chart-line', 'text-emerald-400')}
            ${renderIntelligenceCard('NEXUS FREIGHT', 'Próximo contenedor: 15 de Mayo', 'fa-container-storage', 'text-amber-400')}
        </div>

        <div id="grid-market" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8 pb-32">
            <div class="col-span-full flex flex-col items-center py-20">
                <div class="w-12 h-12 border-2 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin"></div>
                <p class="orbitron text-[8px] text-slate-500 mt-6 tracking-[0.5em]">SYNCING GLOBAL ASSETS...</p>
            </div>
        </div>
    </div>`;

    initMarketListener();
}

function initMarketListener() {
    const grid = document.getElementById('grid-market');
    const q = query(collection(db, "marketplace"), orderBy("creadoEn", "desc"), limit(20));

    onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if(items.length === 0) {
            grid.innerHTML = `<div class="col-span-full py-40 text-center orbitron text-slate-800 italic text-sm">NO SE DETECTAN SEÑALES COMERCIALES EN EL RADAR...</div>`;
            return;
        }

        grid.innerHTML = items.map(p => `
            <div class="group relative bg-[#0d1117] rounded-[2.5rem] border border-white/5 hover:border-cyan-500/30 transition-all duration-500 overflow-hidden flex flex-col">
                <div class="absolute top-4 left-4 z-20 px-3 py-1 bg-black/80 backdrop-blur-md rounded-full border border-white/10">
                    <p class="text-[6px] orbitron font-black text-cyan-500 tracking-widest uppercase">
                        ${p.ubicacion || 'NEXUS-X CORE'}
                    </p>
                </div>

                <div class="aspect-[4/5] bg-black overflow-hidden relative">
                    <img src="${p.imgUrl || 'https://via.placeholder.com/400'}" 
                         class="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-transparent"></div>
                </div>

                <div class="p-6 mt-[-40px] relative z-10 flex-grow">
                    <div class="bg-[#161b22] border border-white/5 p-4 rounded-3xl shadow-2xl">
                        <h3 class="orbitron text-[10px] font-black text-white uppercase truncate mb-1">${p.nombre}</h3>
                        <p class="text-[8px] text-slate-500 mb-4 h-8 overflow-hidden line-clamp-2">${p.descripcion || 'Sin descripción técnica disponible.'}</p>
                        
                        <div class="flex items-center justify-between pt-4 border-t border-white/5">
                            <div>
                                <p class="text-[6px] orbitron text-slate-600 uppercase">Precio Nexus</p>
                                <p class="text-sm font-black text-emerald-400 orbitron">$${Number(p.precio).toLocaleString()}</p>
                            </div>
                            <button onclick="contactarVendedor('${p.nombre}', '${p.id}')" 
                                    class="w-10 h-10 bg-white text-black rounded-2xl flex items-center justify-center hover:bg-cyan-500 hover:text-white transition-all shadow-lg active:scale-90">
                                <i class="fas fa-shopping-cart text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="px-6 pb-6 flex justify-between items-center text-[7px] orbitron text-slate-600 font-bold uppercase tracking-tighter">
                    <span><i class="fas fa-shield-check mr-1"></i> Verificado</span>
                    <span><i class="fas fa-box mr-1"></i> Stock: ${p.stock || 1}</span>
                </div>
            </div>
        `).join('');
    });
}

function renderIntelligenceCard(title, value, icon, colorClass) {
    return `
    <div class="bg-[#0d1117] p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
        <div class="absolute -right-4 -bottom-4 opacity-[0.03] text-6xl group-hover:scale-110 transition-transform">
            <i class="fas ${icon}"></i>
        </div>
        <p class="text-[7px] orbitron font-black text-slate-600 uppercase mb-2 tracking-[0.2em]">${title}</p>
        <p class="text-xs font-black text-white orbitron italic">${value}</p>
        <div class="mt-4 flex items-center gap-2">
            <span class="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></span>
            <span class="text-[6px] orbitron text-emerald-500 uppercase">Live Intelligence</span>
        </div>
    </div>`;
}

function renderLock(container) {
    container.innerHTML = `
    <div class="flex flex-col items-center justify-center h-[80vh] text-center p-10 animate-in fade-in zoom-in-95">
        <div class="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
            <i class="fas fa-lock-keyhole text-4xl text-red-500"></i>
        </div>
        <h2 class="orbitron text-2xl font-black text-white italic tracking-tighter">ENLACE RESTRINGIDO</h2>
        <p class="text-slate-500 mt-4 text-xs max-w-xs leading-relaxed uppercase orbitron tracking-widest">
            El MarketX requiere autorización de nivel <span class="text-cyan-500">PRO</span> o <span class="text-cyan-500">ELITE</span> para acceder al corredor global.
        </p>
        <button onclick="location.hash='#pagos'" class="mt-10 px-10 py-4 bg-white text-black orbitron text-[9px] font-black rounded-2xl hover:bg-cyan-500 hover:text-white transition-all shadow-2xl">
            ADQUIRIR CREDENCIALES
        </button>
    </div>`;
}

window.contactarVendedor = (nombre, id) => {
    const msg = `NEXUS-X BRIDGE: Interés detectado en el activo [${nombre}]. Solicito estado de disponibilidad y logística de envío. (REF: ${id})`;
    window.open(`https://wa.me/17049419163?text=${encodeURIComponent(msg)}`);
};
