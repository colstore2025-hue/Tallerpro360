/**
 * marketplace_bridge.js - NEXUS-X AEGIS V50.2 🛰️
 * NODO DE INTERCAMBIO GLOBAL & LOGÍSTICA DE REPUESTOS
 * Lanzamiento Oficial: 27 de Abril
 */
import { db } from "../core/firebase-config.js";
import { collection, query, onSnapshot, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function marketplace_bridge(container) {
    const plan = (localStorage.getItem("planTipo") || "ELITE").toUpperCase();
    const rol = (localStorage.getItem("rol") || "TECNICO").toUpperCase();

    if (plan !== "PRO" && plan !== "ELITE") {
        renderLock(container);
        return;
    }

    container.innerHTML = `
    <div class="p-4 lg:p-10 animate-in slide-in-from-bottom-10 duration-1000 max-w-[1600px] mx-auto">
        
        <header class="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 border-b border-white/10 pb-10 gap-6">
            <div class="relative pl-6">
                <div class="absolute left-0 top-0 h-full w-1 bg-cyan-500 shadow-[0_0_20px_#06b6d4]"></div>
                <h1 class="orbitron text-5xl font-black italic text-white tracking-tighter uppercase">Market<span class="text-cyan-400">X</span> Hub</h1>
                <div class="flex items-center gap-4 mt-2">
                    <p class="text-[9px] text-slate-500 orbitron tracking-[0.4em]">SISTEMA DE INTERCONEXIÓN DE REPUESTOS Y MARKETPLACE</p>
                    <span class="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[7px] orbitron">LOGISTICS READY</span>
                </div>
            </div>
            
            <div class="flex flex-wrap gap-4 w-full lg:w-auto">
                <div class="flex-1 min-w-[200px] bg-[#0d1117] border border-white/10 rounded-2xl p-2 flex items-center px-4">
                    <i class="fas fa-search text-slate-500 mr-3"></i>
                    <input type="text" id="global-search" placeholder="BUSCAR REPUESTO (LOCAL O GLOBAL)..." 
                           class="bg-transparent border-none text-white orbitron text-[10px] w-full focus:ring-0 outline-none">
                </div>
                <button onclick="location.hash='#publish_mision'" class="px-8 py-5 bg-cyan-500 text-white orbitron text-[10px] font-black rounded-3xl hover:bg-white hover:text-black transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                    <i class="fas fa-upload mr-2"></i> PUBLICAR MULTI-PLATAFORMA
                </button>
            </div>
        </header>

        <section class="mb-12">
            <div class="flex items-center gap-3 mb-6">
                <i class="fas fa-map-marker-alt text-cyan-400 animate-bounce"></i>
                <h2 class="orbitron text-xs font-black text-white uppercase tracking-widest">Proveedores y Talleres Aliados Cercanos</h2>
            </div>
            <div id="nearby-suppliers" class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="col-span-full py-10 border border-dashed border-white/10 rounded-3xl text-center">
                    <p class="orbitron text-[8px] text-slate-600">RASTREANDO NODOS EN TU GEOPOSICIÓN...</p>
                </div>
            </div>
        </section>

        <div id="grid-market" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8 pb-32">
            </div>
    </div>`;

    initMarketListener();
    initSearchEngine();
}

function initMarketListener(filter = null) {
    const grid = document.getElementById('grid-market');
    let q = query(collection(db, "marketplace"), orderBy("creadoEn", "desc"), limit(30));
    
    if(filter) {
        q = query(collection(db, "marketplace"), where("tags", "array-contains", filter.toLowerCase()), limit(30));
    }

    onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        grid.innerHTML = items.map(p => renderProductCard(p)).join('');
    });
}

function renderProductCard(p) {
    // Definición de iconos por plataforma origen
    const platformIcons = {
        'mercadolibre': 'fa-handshake',
        'amazon': 'fa-amazon',
        'nexus': 'fa-rocket',
        'facebook': 'fa-facebook-f'
    };

    return `
    <div class="group relative bg-[#0d1117] rounded-[2rem] border border-white/5 hover:border-cyan-500/50 transition-all duration-500 overflow-hidden flex flex-col shadow-2xl">
        <div class="absolute top-4 right-4 z-20 flex gap-2">
            <div class="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white text-[10px]">
                <i class="fab ${platformIcons[p.platform || 'nexus']}"></i>
            </div>
        </div>

        <div class="aspect-square bg-black overflow-hidden relative">
            <img src="${p.imgUrl || 'https://via.placeholder.com/400'}" 
                 alt="${p.nombre}"
                 class="w-full h-full object-contain p-4 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700">
            <div class="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-transparent"></div>
        </div>

        <div class="p-6 mt-[-30px] relative z-10">
            <div class="bg-[#161b22] border border-white/10 p-5 rounded-3xl">
                <p class="text-[6px] orbitron font-black text-cyan-500 mb-1 uppercase tracking-tighter">${p.categoria || 'Repuesto General'}</p>
                <h3 class="orbitron text-[11px] font-black text-white uppercase truncate">${p.nombre}</h3>
                
                <div class="mt-4 flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-black text-emerald-400 orbitron">$${Number(p.precio).toLocaleString()}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="distribuirProducto('${p.id}')" title="Enviar a Marketplaces" class="w-8 h-8 bg-white/5 border border-white/10 text-white rounded-xl flex items-center justify-center hover:bg-cyan-500 transition-all">
                            <i class="fas fa-share-nodes text-[10px]"></i>
                        </button>
                        <button onclick="contactarVendedor('${p.nombre}', '${p.id}')" class="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
                            <i class="fas fa-shopping-cart text-[10px]"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

function initSearchEngine() {
    const searchInput = document.getElementById('global-search');
    searchInput.addEventListener('keyup', (e) => {
        if(e.key === 'Enter') {
            initMarketListener(e.target.value);
        }
    });
}

// 🌐 Lógica de Interconexión Real
window.distribuirProducto = (id) => {
    // Aquí se dispara el nodo de publish_mision.js
    alert(`NEXUS-X ENGINE: Iniciando protocolo de exportación para activo ${id}. Conectando con API Amazon/ML...`);
    location.hash = `#publish_mision?id=${id}`;
};

// ... (renderLock y contactarVendedor se mantienen igual)
