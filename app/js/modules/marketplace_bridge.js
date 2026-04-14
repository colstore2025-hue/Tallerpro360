/**
 * marketplace_bridge.js - NEXUS-X 🛰️
 * Módulo de Integración Nativa Total (Sin Iframe)
 */
import { db } from "../core/firebase-config.js";
import { collection, query, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function marketplaceBridge(container) {
    const plan = (localStorage.getItem("nexus_plan") || "GRATI-CORE").toUpperCase();
    
    if (plan !== "PRO" && plan !== "ELITE") {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-[80vh] p-20 text-center animate-in zoom-in duration-500">
                <i class="fas fa-lock text-6xl text-cyan-500/20 mb-8"></i>
                <h2 class="orbitron text-2xl font-black text-white italic">MÓDULO DE ACTIVOS BLOQUEADO</h2>
                <button onclick="location.hash='#pagos'" class="mt-8 px-10 py-4 bg-cyan-600 text-white orbitron text-[10px] font-black rounded-2xl">ELEVAR NIVEL DE ENLACE</button>
            </div>`;
        return;
    }

    // Inyectamos la estructura base
    container.innerHTML = `
    <div class="p-4 md:p-10 animate-in fade-in duration-700">
        <header class="max-w-7xl mx-auto mb-16">
            <div class="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                <div class="relative pl-8">
                    <div class="absolute left-0 top-0 h-full w-1.5 bg-cyan-500 shadow-[0_0_20px_#06b6d4]"></div>
                    <h1 class="orbitron text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-white">MARKET<span class="text-cyan-400">X</span></h1>
                    <p class="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-3 italic">LOGÍSTICA: USA <i class="fas fa-random text-cyan-500 mx-2"></i> LATAM</p>
                </div>
                <button onclick="location.hash='#publish'" class="px-10 py-5 bg-white text-black orbitron text-[10px] font-black rounded-2xl uppercase hover:bg-cyan-500 hover:text-white transition-all">
                    <i class="fas fa-upload mr-3"></i> Publicar Activo
                </button>
            </div>
        </header>

        <main id="productGrid" class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8 pb-32">
            <div class="col-span-full text-center py-20"><i class="fas fa-satellite animate-spin text-cyan-500 text-3xl"></i></div>
        </main>
    </div>`;

    // Lógica de Renderizado
    const grid = document.getElementById('productGrid');
    const q = query(collection(db, "marketplace"), orderBy("creadoEn", "desc"));

    onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if(items.length === 0) {
            grid.innerHTML = `<div class="col-span-full py-40 text-center orbitron text-slate-800 uppercase tracking-[1em] italic">Buscando señales...</div>`;
            return;
        }

        grid.innerHTML = items.map(p => `
            <div class="group bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 hover:border-cyan-500/50 transition-all">
                <div class="aspect-square bg-black rounded-[2rem] mb-6 overflow-hidden relative">
                    <img src="${p.imgUrl || 'https://via.placeholder.com/400'}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all">
                </div>
                <h3 class="text-[14px] font-black text-white uppercase italic mb-4">${p.nombre}</h3>
                <div class="flex items-center justify-between bg-white/5 p-4 rounded-2xl">
                    <p class="text-white font-black orbitron text-lg italic">${p.precio}</p>
                    <button onclick="window.open('https://wa.me/17049419163?text=Interes en: ${p.nombre}')" class="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center">
                        <i class="fas fa-crosshairs"></i>
                    </button>
                </div>
            </div>
        `).join('');
    });
}
