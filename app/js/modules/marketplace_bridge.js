/**
 * marketplace_bridge.js - NEXUS-X AEGIS V50.5 🛰️
 * NODO DE GESTIÓN AVANZADA: EDICIÓN, ELIMINACIÓN Y GEOLOCALIZACIÓN
 * Lanzamiento: 27 de Abril
 */
import { db } from "../core/firebase-config.js";
import { collection, query, onSnapshot, orderBy, limit, where, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function marketplace_bridge(container) {
    const plan = (localStorage.getItem("planTipo") || "ELITE").toUpperCase();
    const tallerCiudad = (localStorage.getItem("taller_ciudad") || "IBAGUE").toUpperCase();
    const empresaId = localStorage.getItem("empresaId"); // Para validar propiedad

    if (plan !== "PRO" && plan !== "ELITE") {
        renderLock(container);
        return;
    }

    container.innerHTML = `
    <div class="p-4 lg:p-10 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
        <header class="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 border-b border-white/5 pb-10 gap-6">
            <div class="relative pl-6">
                <div class="absolute left-0 top-0 h-full w-1 bg-cyan-500 shadow-[0_0_20px_#06b6d4]"></div>
                <h1 class="orbitron text-5xl font-black italic text-white tracking-tighter uppercase">Market<span class="text-cyan-400">X</span> Hub</h1>
                <p class="text-[9px] text-slate-500 orbitron tracking-[0.4em] mt-2 italic uppercase">Radar Activo en ${tallerCiudad}</p>
            </div>
            
            <div class="flex flex-wrap gap-4 w-full lg:w-auto">
                <div class="flex-1 min-w-[250px] bg-[#0d1117] border border-white/10 rounded-2xl p-2 flex items-center px-4">
                    <input type="text" id="global-search" placeholder="BUSCAR EN RED NEXUS..." class="bg-transparent border-none text-white orbitron text-[10px] w-full outline-none uppercase">
                </div>
                <button onclick="location.hash='#publish_mision'" class="px-8 py-5 bg-cyan-500 text-white orbitron text-[10px] font-black rounded-3xl hover:bg-white hover:text-black transition-all">
                    + PUBLICAR
                </button>
            </div>
        </header>

        <div id="grid-market" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8 pb-32"></div>
    </div>`;

    initMarketListener(null, empresaId);
}

function initMarketListener(filter = null, currentEmpresaId) {
    const grid = document.getElementById('grid-market');
    let q = query(collection(db, "marketplace"), orderBy("creadoEn", "desc"), limit(40));

    onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        grid.innerHTML = items.map(p => renderProductCard(p, currentEmpresaId)).join('');
    });
}

function renderProductCard(p, currentEmpresaId) {
    const isOwner = p.empresaId === currentEmpresaId;
    
    return `
    <div class="group relative bg-[#0d1117] rounded-[2.5rem] border border-white/5 hover:border-cyan-500/50 transition-all duration-500 flex flex-col overflow-hidden">
        
        ${isOwner ? `
        <div class="absolute top-4 right-4 z-30 flex gap-2">
            <button onclick="editarActivo('${p.id}')" class="w-8 h-8 bg-black/80 rounded-full border border-white/10 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all">
                <i class="fas fa-edit text-[10px]"></i>
            </button>
            <button onclick="eliminarActivo('${p.id}')" class="w-8 h-8 bg-black/80 rounded-full border border-white/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                <i class="fas fa-trash text-[10px]"></i>
            </button>
        </div>
        ` : ''}

        <div class="aspect-square bg-black relative">
            <img src="${p.imgUrl || p.images?.[0] || 'https://via.placeholder.com/400'}" class="w-full h-full object-contain p-6 opacity-80 group-hover:opacity-100 transition-all">
            <div class="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-transparent"></div>
        </div>

        <div class="p-6 mt-[-40px] relative z-10">
            <div class="bg-[#161b22] border border-white/10 p-5 rounded-3xl">
                <h3 class="orbitron text-[10px] font-black text-white uppercase truncate">${p.nombre}</h3>
                <p class="text-[9px] text-emerald-400 orbitron mt-2 font-black">$${Number(p.precio).toLocaleString()}</p>
                
                <div class="flex gap-2 mt-4">
                    <button onclick="window.open('https://wa.me/17049419163?text=Interes en ${p.nombre}')" class="flex-1 py-3 bg-white text-black orbitron text-[8px] font-black rounded-xl hover:bg-cyan-500 transition-all">
                        COMPRAR
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}

// 🛡️ PROTOCOLOS DE CONTROL (EDICIÓN Y ELIMINACIÓN)
window.eliminarActivo = async (id) => {
    if(confirm("¿CONFIRMA ELIMINACIÓN DEL ACTIVO? Esta acción es irreversible en la red Nexus-X.")){
        try {
            await deleteDoc(doc(db, "marketplace", id));
            alert("ACTIVO ELIMINADO");
        } catch (e) { alert("ERROR DE COMUNICACIÓN"); }
    }
};

window.editarActivo = async (id) => {
    const nuevoPrecio = prompt("INGRESE NUEVA VALUACIÓN (USD/COP):");
    if(nuevoPrecio) {
        await updateDoc(doc(db, "marketplace", id), {
            precio: nuevoPrecio,
            editadoEn: new Date()
        });
        alert("ACTIVO ACTUALIZADO EN LA RED");
    }
};
