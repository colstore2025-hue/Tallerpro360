/**
 * marketplace_bridge.js - NEXUS-X AEGIS V50.4 🛰️
 * NODO DE INTELIGENCIA GEOLOCALIZADA & RADAR DE NODOS ALIADOS
 * Lanzamiento Crítico: 27 de Abril
 */
import { db } from "../core/firebase-config.js";
import { collection, query, onSnapshot, orderBy, limit, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function marketplace_bridge(container) {
    const plan = (localStorage.getItem("planTipo") || "ELITE").toUpperCase();
    const tallerCiudad = (localStorage.getItem("taller_ciudad") || "IBAGUE").toUpperCase(); // Ciudad base del taller

    if (plan !== "PRO" && plan !== "ELITE") {
        renderLock(container);
        return;
    }

    container.innerHTML = `
    <div class="p-4 lg:p-10 animate-in fade-in duration-1000 max-w-[1600px] mx-auto">
        
        <header class="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 border-b border-white/5 pb-10 gap-6">
            <div class="relative pl-6">
                <div class="absolute left-0 top-0 h-full w-1 bg-cyan-500 shadow-[0_0_20px_#06b6d4]"></div>
                <h1 class="orbitron text-5xl font-black italic text-white tracking-tighter uppercase">Market<span class="text-cyan-400">X</span> Hub</h1>
                <div class="flex items-center gap-4 mt-2">
                    <p class="text-[9px] text-slate-500 orbitron tracking-[0.4em]">RADAR DE ACTIVOS: <span class="text-white">${tallerCiudad}</span> & NODOS GLOBALES</p>
                    <span class="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-[7px] orbitron animate-pulse">SCANNING NODES</span>
                </div>
            </div>
            
            <div class="flex flex-wrap gap-4 w-full lg:w-auto">
                <div class="flex-1 min-w-[250px] bg-[#0d1117] border border-white/10 rounded-2xl p-2 flex items-center px-4">
                    <i class="fas fa-satellite text-cyan-500 mr-3 animate-pulse"></i>
                    <input type="text" id="global-search" placeholder="BUSCAR EN RED NEXUS O ALIADOS..." 
                           class="bg-transparent border-none text-white orbitron text-[10px] w-full focus:ring-0 outline-none uppercase">
                </div>
                <button onclick="location.hash='#publish_mision'" class="px-8 py-5 bg-white text-black orbitron text-[10px] font-black rounded-3xl hover:bg-cyan-500 hover:text-white transition-all shadow-xl active:scale-95">
                    <i class="fas fa-plus-circle mr-2"></i> PUBLICAR ACTIVO
                </button>
            </div>
        </header>

        <section class="mb-16">
            <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                    <h2 class="orbitron text-xs font-black text-white uppercase tracking-widest">Proveedores y Nodos en ${tallerCiudad}</h2>
                </div>
                <p class="text-[7px] orbitron text-slate-500 uppercase">Filtro Automático: Proximidad Nivel 1</p>
            </div>
            <div id="nearby-suppliers" class="grid grid-cols-1 md:grid-cols-4 gap-6">
                ${[1,2,3,4].map(() => `<div class="h-24 bg-white/5 rounded-3xl animate-pulse"></div>`).join('')}
            </div>
        </section>

        <div class="flex items-center gap-3 mb-8">
            <i class="fas fa-globe text-slate-700"></i>
            <h2 class="orbitron text-xs font-black text-slate-500 uppercase tracking-widest">Feed de Activos Globales (Red Nexus-X)</h2>
        </div>
        
        <div id="grid-market" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8 pb-32">
            </div>
    </div>`;

    loadNearbyNodes(tallerCiudad);
    initMarketListener();
    initSearchEngine();
}

/**
 * 🛰️ Motor de Búsqueda de Nodos Cercanos
 * Consulta talleres que tengan stock activo en la misma ciudad
 */
async function loadNearbyNodes(ciudad) {
    const nearbyContainer = document.getElementById('nearby-suppliers');
    
    // Consulta a la colección de empresas/talleres que están cerca
    const q = query(
        collection(db, "empresas"), 
        where("ciudad", "==", ciudad), 
        limit(4)
    );

    const snap = await getDocs(q);
    
    if (snap.empty) {
        nearbyContainer.innerHTML = `
            <div class="col-span-full p-8 bg-amber-500/5 border border-amber-500/10 rounded-3xl flex items-center gap-4">
                <i class="fas fa-exclamation-triangle text-amber-500"></i>
                <p class="orbitron text-[9px] text-amber-500/80 uppercase">No se detectan otros talleres Nexus en ${ciudad} hoy. Expandiendo radar...</p>
            </div>`;
        return;
    }

    nearbyContainer.innerHTML = snap.docs.map(doc => {
        const d = doc.data();
        return `
        <div class="bg-[#0d1117] border border-white/5 p-5 rounded-[2rem] hover:border-cyan-500/50 transition-all cursor-pointer group">
            <div class="flex justify-between items-start mb-4">
                <div class="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                    <i class="fas fa-warehouse text-cyan-500 text-xs"></i>
                </div>
                <span class="text-[6px] orbitron text-emerald-500">ONLINE</span>
            </div>
            <h4 class="orbitron text-[9px] font-black text-white uppercase truncate">${d.nombre}</h4>
            <p class="text-[7px] text-slate-500 uppercase mt-1 italic">${d.direccion || 'Ubicación Verificada'}</p>
            <div class="mt-4 pt-4 border-t border-white/5 flex justify-between">
                <button onclick="window.open('https://wa.me/${d.telefono}')" class="text-[7px] orbitron text-cyan-500 font-bold uppercase hover:tracking-widest transition-all">Contactar Nodo</button>
                <i class="fas fa-chevron-right text-[8px] text-slate-700"></i>
            </div>
        </div>
        `;
    }).join('');
}

function initMarketListener(filter = null) {
    const grid = document.getElementById('grid-market');
    let q = query(collection(db, "marketplace"), orderBy("creadoEn", "desc"), limit(40));
    
    if(filter) {
        // Búsqueda por tags o nombre
        q = query(collection(db, "marketplace"), where("nombre", ">=", filter.toUpperCase()), where("nombre", "<=", filter.toUpperCase() + '\uf8ff'), limit(40));
    }

    onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if(items.length === 0) {
            grid.innerHTML = `<div class="col-span-full py-20 text-center orbitron text-slate-800 text-xs uppercase tracking-widest">Sin señales comerciales en este sector...</div>`;
            return;
        }
        grid.innerHTML = items.map(p => renderProductCard(p)).join('');
    });
}

function renderProductCard(p) {
    const platformIcons = { 'mercadolibre': 'fa-handshake', 'amazon': 'fa-amazon', 'nexus': 'fa-rocket', 'facebook': 'fa-facebook-f' };
    
    // Si el item viene de una ciudad diferente, mostramos el badge de "Logística Requerida"
    const isLocal = (p.ubicacion || '').toUpperCase().includes(localStorage.getItem("taller_ciudad") || "NULL");

    return `
    <div class="group relative bg-[#0d1117] rounded-[2.5rem] border border-white/5 hover:border-cyan-500/50 transition-all duration-500 flex flex-col shadow-2xl">
        <div class="absolute top-4 left-4 z-20 flex gap-2">
            <div class="px-3 py-1 bg-black/80 backdrop-blur-md rounded-full border border-white/10">
                <p class="text-[6px] orbitron font-black ${isLocal ? 'text-emerald-400' : 'text-cyan-500'} tracking-widest uppercase">
                    ${isLocal ? 'CERCA DE TI' : (p.ubicacion || 'NEXUS NODE')}
                </p>
            </div>
        </div>

        <div class="aspect-square bg-black overflow-hidden relative group-hover:bg-cyan-900/10 transition-all">
            <img src="${p.imgUrl || 'https://via.placeholder.com/400'}" 
                 class="w-full h-full object-contain p-6 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700">
            <div class="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-transparent"></div>
        </div>

        <div class="p-6 mt-[-40px] relative z-10">
            <div class="bg-[#161b22] border border-white/10 p-5 rounded-3xl shadow-2xl">
                <h3 class="orbitron text-[10px] font-black text-white uppercase truncate mb-1">${p.nombre}</h3>
                <p class="text-[8px] text-slate-500 h-8 overflow-hidden line-clamp-2">${p.descripcion || 'Ficha técnica encriptada...'}</p>
                
                <div class="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                        <p class="text-[10px] font-black text-emerald-400 orbitron">$${Number(p.precio).toLocaleString()}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="distribuirProducto('${p.id}')" class="w-8 h-8 bg-white/5 border border-white/10 text-white rounded-xl flex items-center justify-center hover:bg-cyan-500 transition-all">
                            <i class="fas fa-share-nodes text-[9px]"></i>
                        </button>
                        <button onclick="contactarVendedor('${p.nombre}', '${p.id}', '${p.operador}')" class="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-lg active:scale-90">
                            <i class="fas fa-shopping-cart text-[9px]"></i>
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
        if(e.key === 'Enter') initMarketListener(e.target.value);
    });
}

window.contactarVendedor = (nombre, id, operador) => {
    const msg = `NEXUS-X RADAR: Interés en [${nombre}] del taller [${operador}]. Solicito estado y logística. REF: ${id}`;
    window.open(`https://wa.me/17049419163?text=${encodeURIComponent(msg)}`);
};
