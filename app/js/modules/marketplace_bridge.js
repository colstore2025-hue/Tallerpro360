/**
 * marketplace_bridge.js - NEXUS-X 🛰️
 * Módulo de Visualización de Activos
 */
import { db } from "../core/firebase-config.js";
import { collection, query, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function marketplaceBridge(container) {
    const plan = (localStorage.getItem("nexus_plan") || "GRATI-CORE").toUpperCase();
    
    // Verificación de Plan
    if (plan !== "PRO" && plan !== "ELITE") {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-[70vh] text-center p-10">
                <i class="fas fa-lock text-5xl text-slate-800 mb-6"></i>
                <h2 class="orbitron text-xl font-black text-white italic">NIVEL DE ENLACE INSUFICIENTE</h2>
                <p class="text-slate-500 mt-2 text-xs">MarketX requiere plan PRO o ELITE.</p>
                <button onclick="location.hash='#pagos'" class="mt-8 px-8 py-3 bg-cyan-600 text-white orbitron text-[9px] font-black rounded-xl">UPGRADE</button>
            </div>`;
        return;
    }

    // Estructura de la Terminal
    container.innerHTML = `
    <div class="p-6 lg:p-10 animate-in fade-in duration-500">
        <header class="flex justify-between items-end mb-10 border-b border-white/5 pb-8">
            <div>
                <h1 class="orbitron text-4xl font-black italic text-white">MARKET<span class="text-cyan-400">X</span></h1>
                <p class="text-[9px] text-slate-500 orbitron tracking-[0.4em] mt-2">TERMINAL DE ACTIVOS GLOBAL</p>
            </div>
            <button onclick="location.hash='#publish_mision'" class="px-6 py-4 bg-white text-black orbitron text-[9px] font-black rounded-xl hover:bg-cyan-500 hover:text-white transition-all">
                <i class="fas fa-plus mr-2"></i> PUBLICAR
            </button>
        </header>

        <div id="grid-market" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
            <div class="col-span-full text-center py-20"><i class="fas fa-satellite animate-spin text-cyan-500 text-2xl"></i></div>
        </div>
    </div>`;

    const grid = document.getElementById('grid-market');
    const q = query(collection(db, "marketplace"), orderBy("creadoEn", "desc"));

    // Listener de Firebase
    onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if(items.length === 0) {
            grid.innerHTML = `<div class="col-span-full py-20 text-center orbitron text-slate-700 italic">SIN SEÑALES COMERCIALES...</div>`;
            return;
        }

        grid.innerHTML = items.map(p => `
            <div class="bg-[#0d1117] p-5 rounded-[2rem] border border-white/5 hover:border-cyan-500/40 transition-all group">
                <div class="aspect-square bg-black rounded-[1.5rem] mb-4 overflow-hidden relative">
                    <img src="${p.imgUrl || 'https://via.placeholder.com/400'}" class="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all">
                </div>
                <h3 class="text-xs font-black text-white uppercase truncate mb-3">${p.nombre}</h3>
                <div class="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                    <span class="text-cyan-400 font-black orbitron text-sm">${p.precio}</span>
                    <button onclick="window.open('https://wa.me/17049419163?text=Nexus-X: Info sobre ${p.nombre}')" class="text-white hover:text-cyan-400">
                        <i class="fas fa-external-link-alt text-xs"></i>
                    </button>
                </div>
            </div>
        `).join('');
    });
}
