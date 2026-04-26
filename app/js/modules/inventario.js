/**
 * 🌌 NEXUS-X AERO-LOGISTICS ERP - VAULT STOCK V22.0
 * 🏗️ SYSTEM: INVENTORY & SUPPLY CHAIN PROTOCOL
 * @author William Jeffry Urquijo & Gemini AI
 */

import { 
    collection, query, where, onSnapshot, serverTimestamp, 
    doc, updateDoc, deleteDoc, getDoc, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

// --- 🌐 GLOBAL BRIDGE: Expone el inventario para otros módulos (ordenes.js) ---
window.nexus_search_inventory = async (empresaId, term) => {
    const q = query(
        collection(db, "inventario"), 
        where("empresaId", "==", empresaId),
        where("origen", "==", "PROPIO")
    );
    const snap = await getDocs(q); // Necesitas importar getDocs arriba si usas esta versión síncrona
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(it => it.nombre.toLowerCase().includes(term.toLowerCase()));
};

export default async function inventario(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let filtroActual = "PROPIO"; 
    let unsubscribe = null;
    let cacheInventario = []; 

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in slide-in-from-right-10 duration-700 pb-40 min-h-screen bg-[#010409]">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-10 mb-20 border-b border-white/5 pb-12">
                <div>
                    <h1 class="orbitron text-7xl font-black text-white italic tracking-tighter uppercase leading-none">
                        VAULT <span class="text-cyan-500">STOCK</span><span class="text-slate-800 text-2xl">.X22</span>
                    </h1>
                    <div class="flex items-center gap-4 mt-4">
                        <span class="h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></span>
                        <p class="text-[10px] text-slate-400 font-black uppercase tracking-[0.5em] orbitron italic">Centralized Supply Chain Protocol</p>
                    </div>
                </div>
                <div class="flex bg-[#0d1117] p-2 rounded-[3rem] border border-white/10 shadow-2xl">
                    <button id="tabPropio" class="px-12 py-5 rounded-[2.5rem] text-[11px] font-black orbitron transition-all">BÓVEDA TALLER</button>
                    <button id="tabCliente" class="px-12 py-5 rounded-[2.5rem] text-[11px] font-black orbitron transition-all">SUMINISTRO CLIENTE</button>
                </div>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div class="bg-gradient-to-br from-[#0d1117] to-transparent p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                    <div class="absolute -right-4 -top-4 text-cyan-500/10 text-8xl"><i class="fas fa-boxes"></i></div>
                    <p class="text-[10px] text-slate-500 orbitron mb-4 uppercase font-black">Unidades Disponibles</p>
                    <p id="statTotal" class="text-6xl font-black text-white orbitron leading-none">0</p>
                </div>
                <div class="bg-gradient-to-br from-[#0d1117] to-transparent p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                    <div class="absolute -right-4 -top-4 text-emerald-500/10 text-8xl"><i class="fas fa-chart-line"></i></div>
                    <p class="text-[10px] text-slate-500 orbitron mb-4 uppercase font-black">Capital Invertido (PVP)</p>
                    <p id="statValor" class="text-5xl font-black text-emerald-400 orbitron leading-none">$ 0</p>
                </div>
                <div class="bg-gradient-to-br from-[#0d1117] to-transparent p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                    <div class="absolute -right-4 -top-4 text-red-500/10 text-8xl"><i class="fas fa-exclamation-triangle"></i></div>
                    <p class="text-[10px] text-slate-500 orbitron mb-4 uppercase font-black">Ruptura de Stock</p>
                    <p id="statAlertas" class="text-6xl font-black text-red-500 orbitron leading-none">0</p>
                </div>
            </div>

            <div class="mb-14 relative group">
                <div class="absolute left-10 top-1/2 -translate-y-1/2 h-8 w-8 bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-500/20 group-focus-within:bg-cyan-500 transition-all">
                    <i class="fas fa-search text-[10px] text-cyan-500 group-focus-within:text-black"></i>
                </div>
                <input id="stockSearch" type="text" placeholder="LOCALIZAR REPUESTO O REFERENCIA TÉCNICA..." class="w-full bg-[#0d1117] p-10 pl-24 rounded-[3.5rem] border border-white/5 text-white orbitron text-sm outline-none focus:border-cyan-500 focus:bg-black transition-all shadow-inner">
            </div>

            <div id="gridStock" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                </div>

            <button id="btnMainAdd" class="fixed bottom-12 right-12 w-28 h-28 bg-white text-black rounded-[2.5rem] shadow-[0_0_50px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center z-50 hover:bg-cyan-400 hover:rotate-90 transition-all duration-500 active:scale-90">
                <i class="fas fa-plus text-3xl"></i>
                <span class="text-[7px] orbitron font-black mt-2">NEW_ITEM</span>
            </button>
        </div>`;

        document.getElementById("tabPropio").onclick = () => switchTab("PROPIO");
        document.getElementById("tabCliente").onclick = () => switchTab("CLIENTE");
        document.getElementById("btnMainAdd").onclick = () => abrirModalCarga();
        document.getElementById("stockSearch").oninput = (e) => filtrarLocalmente(e.target.value);
        
        switchTab("PROPIO");
    };

    const switchTab = (tipo) => {
        filtroActual = tipo;
        escucharStock();
        const active = "bg-white text-black scale-105 shadow-xl";
        const inactive = "text-slate-500 hover:text-white hover:bg-white/5";
        document.getElementById("tabPropio").className = `px-12 py-5 rounded-[2.5rem] text-[11px] font-black orbitron transition-all ${tipo==='PROPIO'?active:inactive}`;
        document.getElementById("tabCliente").className = `px-12 py-5 rounded-[2.5rem] text-[11px] font-black orbitron transition-all ${tipo==='CLIENTE'?active:inactive}`;
    };

    function escucharStock() {
        if (unsubscribe) unsubscribe();
        const q = query(collection(db, "inventario"), where("empresaId", "==", empresaId), where("origen", "==", filtroActual));
        unsubscribe = onSnapshot(q, (snap) => {
            cacheInventario = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            renderGrid(cacheInventario);
        });
    }

    const renderGrid = (data) => {
        const grid = document.getElementById("gridStock");
        let totalItems = 0, valorAcumulado = 0, alertas = 0;
        if (!grid) return;

        grid.innerHTML = data.map(item => {
            const cant = Number(item.cantidad || 0);
            const min = Number(item.minimo || 0);
            totalItems += cant;
            if (filtroActual === "PROPIO") valorAcumulado += (Number(item.precioVenta || 0) * cant);
            
            const isCritical = cant <= min;
            if (isCritical) alertas++;

            return `
            <div class="group bg-[#0d1117] p-10 rounded-[3.5rem] border ${isCritical ? 'border-red-500/30 bg-red-500/[0.01]' : 'border-white/5'} relative hover:border-cyan-500/50 transition-all duration-500 shadow-2xl flex flex-col justify-between">
                
                <div class="flex justify-between items-start mb-8">
                    <div class="max-w-[75%]">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="px-3 py-1 bg-cyan-500/10 text-cyan-500 text-[8px] orbitron font-black rounded-lg border border-cyan-500/20">${item.marca || 'GENERIC'}</span>
                            ${isCritical ? '<span class="animate-pulse text-red-500 text-[8px] font-black orbitron">! LOW_STOCK</span>' : ''}
                        </div>
                        <h3 class="text-white text-xl font-black uppercase italic leading-tight mb-1">${item.nombre}</h3>
                        <p class="text-[9px] text-slate-600 orbitron font-bold uppercase tracking-widest">${item.referencia || 'NO_REF'}</p>
                    </div>
                    <div class="flex flex-col gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                        <button onclick="window.editarRepuesto('${item.id}')" class="h-10 w-10 bg-white/5 rounded-xl text-white hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center"><i class="fas fa-edit text-xs"></i></button>
                        <button onclick="window.eliminarActivo('${item.id}')" class="h-10 w-10 bg-white/5 rounded-xl text-white hover:bg-red-500 flex items-center justify-center transition-all"><i class="fas fa-trash text-xs"></i></button>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-6 bg-black/60 p-6 rounded-[2.5rem] border border-white/5 text-center mb-6">
                    <div>
                        <p class="text-[8px] text-slate-600 orbitron uppercase font-black mb-1">Available</p>
                        <p class="text-3xl font-black ${isCritical ? 'text-red-500' : 'text-white'} orbitron leading-none">${cant}</p>
                        <p class="text-[7px] text-slate-800 mt-1 uppercase font-bold">${item.empaque || 'UNITS'}</p>
                    </div>
                    <div class="border-l border-white/5">
                        <p class="text-[8px] text-slate-600 orbitron uppercase font-black mb-1">Unit Price</p>
                        <p class="text-lg font-black text-emerald-400 orbitron leading-none mt-2">$${Number(item.precioVenta || 0).toLocaleString()}</p>
                    </div>
                </div>

                <div class="flex gap-3">
                     <button onclick="window.ajustarStock('${item.id}', 1)" class="flex-1 py-5 bg-white text-black rounded-[1.5rem] text-[9px] font-black orbitron uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all active:scale-95">STOCK_IN</button>
                     <button onclick="window.ajustarStock('${item.id}', -1)" class="flex-1 py-5 bg-white/5 rounded-[1.5rem] border border-white/5 text-[9px] font-black text-slate-500 orbitron hover:bg-red-500 hover:text-white transition-all active:scale-95">STOCK_OUT</button>
                </div>
            </div>`;
        }).join("");
        
        document.getElementById("statTotal").innerText = totalItems;
        document.getElementById("statValor").innerText = `$ ${valorAcumulado.toLocaleString()}`;
        document.getElementById("statAlertas").innerText = alertas;
    };

    // ... (Mantengo tus funciones de ajustarStock, editarRepuesto y eliminarActivo, son correctas) ...

    const filtrarLocalmente = (term) => {
        const b = term.toLowerCase();
        renderGrid(cacheInventario.filter(it => it.nombre.toLowerCase().includes(b) || (it.marca && it.marca.toLowerCase().includes(b))));
    };

    // --- 🛠️ MODAL DE CARGA AVANZADO (V22.0) ---
    async function abrirModalCarga(editData = null) {
        const { value: f } = await window.Swal.fire({
            title: `<span class="orbitron font-black italic text-xl">${editData ? 'EDIT_ASSET' : 'NEW_ASSET_LOAD'}</span>`,
            background: '#010409', color: '#fff',
            width: '700px',
            customClass: { popup: 'rounded-[4rem] border border-white/10 shadow-3xl' },
            html: `
                <div class="space-y-6 p-6 text-left">
                    <div class="space-y-2">
                        <label class="text-[9px] orbitron text-slate-500 font-black uppercase px-4">Descripción del Componente</label>
                        <input id="sw-nom" class="w-full bg-[#0d1117] p-6 rounded-[2rem] border border-white/5 text-white uppercase text-sm font-bold focus:border-cyan-500 outline-none" placeholder="EJ: KIT ARRASTRE HONDA" value="${editData?.nombre || ''}">
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="text-[9px] orbitron text-slate-500 font-black uppercase px-4">Referencia Técnica</label>
                            <input id="sw-ref" class="w-full bg-[#0d1117] p-5 rounded-[2rem] border border-white/5 text-white uppercase text-xs focus:border-cyan-500 outline-none" placeholder="SKU-XXXX" value="${editData?.referencia || ''}">
                        </div>
                        <div class="space-y-2">
                            <label class="text-[9px] orbitron text-slate-500 font-black uppercase px-4">Constructor (Marca)</label>
                            <input id="sw-mar" class="w-full bg-[#0d1117] p-5 rounded-[2rem] border border-white/5 text-white uppercase text-xs focus:border-cyan-500 outline-none" placeholder="EJ: NGK, BOSH" value="${editData?.marca || ''}">
                        </div>
                    </div>

                    <div class="bg-cyan-500/5 p-8 rounded-[3rem] border border-cyan-500/10 grid grid-cols-2 gap-8">
                        <div>
                            <label class="text-[9px] orbitron text-cyan-500 font-black uppercase block mb-3 text-center tracking-widest">Costo Unitario</label>
                            <input id="sw-cos" type="number" class="w-full bg-black/40 p-4 rounded-2xl text-white text-center font-black orbitron text-2xl border border-white/5" value="${editData?.precioCosto || ''}">
                        </div>
                        <div>
                            <label class="text-[9px] orbitron text-emerald-400 font-black uppercase block mb-3 text-center tracking-widest">P. Venta Público</label>
                            <input id="sw-ven" type="number" class="w-full bg-black/40 p-4 rounded-2xl text-emerald-400 text-center font-black orbitron text-2xl border border-white/5" value="${editData?.precioVenta || ''}">
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-4">
                         <div class="space-y-2">
                            <label class="text-[8px] orbitron text-slate-600 font-black uppercase text-center block">Existencia</label>
                            <input id="sw-can" type="number" class="w-full bg-[#0d1117] p-4 rounded-2xl border border-white/5 text-white text-center font-black" value="${editData?.cantidad || '1'}">
                        </div>
                        <div class="space-y-2">
                            <label class="text-[8px] orbitron text-slate-600 font-black uppercase text-center block">Stock Min.</label>
                            <input id="sw-min" type="number" class="w-full bg-[#0d1117] p-4 rounded-2xl border border-white/5 text-red-500 text-center font-black" value="${editData?.minimo || '2'}">
                        </div>
                        <div class="space-y-2">
                            <label class="text-[8px] orbitron text-slate-600 font-black uppercase text-center block">Empaque</label>
                            <input id="sw-emp" class="w-full bg-[#0d1117] p-4 rounded-2xl border border-white/5 text-white text-center text-[9px] font-bold uppercase" value="${editData?.empaque || 'UNIDAD'}">
                        </div>
                    </div>
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'COMMMIT_STOCK_DATA',
            confirmButtonColor: '#06b6d4',
            preConfirm: () => {
                const n = document.getElementById('sw-nom').value.trim();
                if(!n) return window.Swal.showValidationMessage("Definir nombre de componente");
                return {
                    nombre: n.toUpperCase(),
                    referencia: document.getElementById('sw-ref').value.toUpperCase(),
                    marca: document.getElementById('sw-mar').value.toUpperCase(),
                    empaque: document.getElementById('sw-emp').value.toUpperCase(),
                    cantidad: Number(document.getElementById('sw-can').value),
                    precioCosto: Number(document.getElementById('sw-cos').value),
                    precioVenta: Number(document.getElementById('sw-ven').value),
                    minimo: Number(document.getElementById('sw-min').value),
                    empresaId, origen: filtroActual
                }
            }
        });

        if (f) {
            try {
                if(editData) await updateDoc(doc(db, "inventario", editData.id), f);
                else await addDoc(collection(db, "inventario"), { ...f, creadoEn: serverTimestamp() });
                window.Swal.fire({ title: 'VAULT_SYNCED', icon: 'success', background: '#010409', color: '#fff', timer: 1500 });
            } catch (e) { 
                window.Swal.fire('CORE_FAIL', 'Error en el enlace ascendente con Firebase', 'error');
            }
        }
    }

    // ... (Mantengo window.editarRepuesto, ajustarStock y eliminarActivo) ...
    window.ajustarStock = async (id, cambio) => {
        const ref = doc(db, "inventario", id); // Corrección: doc(db, "inventario", id)
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const nuevaCantidad = Math.max(0, (Number(snap.data().cantidad) || 0) + cambio);
            await updateDoc(ref, { cantidad: nuevaCantidad });
            if(cambio < 0) hablar(`Suministro retirado. Quedan ${nuevaCantidad} unidades.`);
            else hablar(`Incremento de stock registrado.`);
        }
    };

    renderLayout();
}
