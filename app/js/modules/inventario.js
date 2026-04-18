/**
 * 🌌 NEXUS-X AERO-LOGISTICS ERP - VAULT STOCK V21.0
 * 🛠️ ARQUITECTURA "TERMINATOR" PRO-2030 - ALMACÉN DE ALTA PRECISIÓN
 * 🏗️ SYSTEM: INVENTORY & SUPPLY CHAIN PROTOCOL
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, 
    doc, updateDoc, deleteDoc, getDoc, getDocs, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function inventario(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let filtroActual = "PROPIO"; 
    let unsubscribe = null;
    let cacheInventario = []; 

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-40 min-h-screen bg-[#010409] selection:bg-cyan-500 selection:text-black">
            
            <header class="flex flex-col lg:flex-row justify-between items-start gap-10 mb-20 border-b border-white/5 pb-12 relative">
                <div class="absolute -top-10 -left-10 w-64 h-64 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>
                
                <div class="relative group z-10">
                    <div class="flex items-center gap-4 mb-2">
                        <span class="bg-cyan-500 text-[8px] font-black px-3 py-1 rounded-full text-black orbitron animate-pulse">SISTEMA ACTIVO</span>
                        <span class="text-slate-600 text-[8px] orbitron tracking-[0.3em]">REF: NEXUS-X-LOGISTICS-2030</span>
                    </div>
                    <h1 class="orbitron text-6xl lg:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">
                        VAULT <span class="text-cyan-400 relative">STOCK<span class="absolute -bottom-2 left-0 w-full h-1 bg-cyan-400/20"></span></span><span class="text-slate-700 text-2xl">.V21</span>
                    </h1>
                    <div class="flex items-center gap-4 mt-6">
                        <div class="h-[1px] w-12 bg-slate-800"></div>
                        <p class="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] orbitron italic">Control de Activos & Micro-Logística de Precisión</p>
                    </div>
                </div>

                <div class="flex bg-[#0d1117]/80 backdrop-blur-3xl p-2 rounded-[3rem] border border-white/10 w-full lg:w-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10">
                    <button id="tabPropio" class="flex-1 lg:flex-none px-12 py-5 rounded-[2.5rem] text-[11px] font-black uppercase transition-all duration-700 orbitron tracking-[0.2em]">
                        <i class="fas fa-warehouse mr-2"></i> BÓVEDA TALLER
                    </button>
                    <button id="tabCliente" class="flex-1 lg:flex-none px-12 py-5 rounded-[2.5rem] text-[11px] font-black uppercase transition-all duration-700 orbitron tracking-[0.2em]">
                        <i class="fas fa-truck-loading mr-2"></i> REPUESTO CLIENTE
                    </button>
                </div>
            </header>

            <div id="statsRow" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                <div class="bg-[#0d1117] border border-white/5 p-10 rounded-[3.5rem] shadow-2xl group hover:border-cyan-500/30 transition-all duration-500 relative overflow-hidden">
                    <p class="text-[9px] text-slate-500 orbitron uppercase mb-4 tracking-widest italic font-bold">Unidades en Almacén</p>
                    <p id="statTotal" class="text-5xl font-black text-white orbitron">0</p>
                    <div class="mt-4 h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div class="h-full bg-cyan-500 w-2/3 shadow-[0_0_15px_#06b6d4]"></div>
                    </div>
                </div>

                <div id="valTotalContainer" class="bg-[#0d1117] border border-white/5 p-10 rounded-[3.5rem] shadow-2xl group hover:border-emerald-500/30 transition-all duration-500 relative overflow-hidden">
                    <p class="text-[9px] text-slate-500 orbitron uppercase mb-4 tracking-widest italic font-bold">Valorización (PVP)</p>
                    <p id="statValor" class="text-4xl font-black text-emerald-400 orbitron">$ 0</p>
                </div>

                <div class="bg-[#0d1117] border border-white/5 p-10 rounded-[3.5rem] shadow-2xl group hover:border-red-500/30 transition-all duration-500 relative overflow-hidden">
                    <p class="text-[9px] text-slate-500 orbitron uppercase mb-4 tracking-widest italic font-bold">Déficit Crítico</p>
                    <p id="statAlertas" class="text-5xl font-black text-red-500 orbitron">0</p>
                </div>

                <div class="bg-[#0d1117] border border-white/5 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden hidden lg:block">
                    <p class="text-[9px] text-slate-500 orbitron uppercase mb-4 tracking-widest italic font-bold">Estado del Almacén</p>
                    <div class="flex items-center gap-3">
                        <div class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                        <p class="text-xs font-black text-emerald-400 orbitron tracking-tighter">SINC_OK_V21</p>
                    </div>
                </div>
            </div>

            <div class="mb-14 relative group">
                <input id="stockSearch" type="text" placeholder="BUSCAR POR NOMBRE, MARCA O VEHÍCULO..." class="w-full bg-[#0d1117]/50 backdrop-blur-xl p-10 pl-24 rounded-[4rem] border border-white/5 text-white orbitron text-sm focus:border-cyan-500/50 outline-none transition-all shadow-[0_30px_60px_rgba(0,0,0,0.4)] placeholder:text-slate-700">
                <i class="fas fa-search absolute left-10 top-1/2 -translate-y-1/2 text-cyan-500 text-2xl"></i>
            </div>

            <div id="gridStock" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10"></div>

            <button id="btnMainAdd" class="fixed bottom-12 right-12 w-28 h-28 bg-white text-black rounded-[3.5rem] shadow-[0_20px_80px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center z-50 hover:bg-cyan-400 hover:rotate-12 transition-all duration-500 group">
                <i class="fas fa-plus text-3xl mb-1"></i>
                <span class="text-[7px] font-black orbitron">NEW_ITEM</span>
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
        const btnP = document.getElementById("tabPropio");
        const btnC = document.getElementById("tabCliente");
        const activeClass = "bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.1)] scale-105";
        const inactiveClass = "text-slate-500 hover:text-white";
        
        if(btnP) btnP.className = `flex-1 lg:flex-none px-12 py-5 rounded-[2.5rem] text-[11px] font-black uppercase transition-all duration-500 orbitron ${tipo === 'PROPIO' ? activeClass : inactiveClass}`;
        if(btnC) btnC.className = `flex-1 lg:flex-none px-12 py-5 rounded-[2.5rem] text-[11px] font-black uppercase transition-all duration-500 orbitron ${tipo === 'CLIENTE' ? activeClass : inactiveClass}`;
    };

    function escucharStock() {
        if (unsubscribe) unsubscribe();
        const q = query(collection(db, "inventario"), where("empresaId", "==", empresaId), where("origen", "==", filtroActual), orderBy("nombre", "asc"));
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
            const min = Number(item.minimo || 2);
            const esCritico = cant <= min;
            totalItems += cant;
            if (filtroActual === "PROPIO") valorAcumulado += (Number(item.precioVenta || 0) * cant);
            if (esCritico) alertas++;

            return `
            <div class="bg-[#0d1117] p-8 rounded-[3.5rem] border ${esCritico ? 'border-red-500/40' : 'border-white/5'} relative group hover:bg-[#161b22] transition-all duration-500 shadow-2xl overflow-hidden">
                <div class="flex justify-between items-start mb-6">
                    <div class="max-w-[80%]">
                        <span class="text-[7px] text-cyan-400 orbitron uppercase font-bold tracking-widest">${item.marca || 'GENÉRICO'} | REF: ${item.referencia || 'N/A'}</span>
                        <h3 class="text-white text-lg font-black uppercase truncate mt-1">${item.nombre}</h3>
                        <p class="text-[8px] text-slate-500 orbitron italic mt-1 uppercase">${item.compatibilidad || 'MULTIVH'}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="window.editarRepuesto('${item.id}')" class="w-8 h-8 rounded-full bg-white/5 text-slate-400 hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center">
                            <i class="fas fa-edit text-[10px]"></i>
                        </button>
                        <button onclick="window.eliminarActivo('${item.id}')" class="w-8 h-8 rounded-full bg-white/5 text-slate-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                            <i class="fas fa-trash text-[10px]"></i>
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-black/40 p-5 rounded-3xl border border-white/5 text-center">
                        <p class="text-[7px] text-slate-500 orbitron mb-1 uppercase">Stock</p>
                        <p class="text-3xl font-black ${esCritico ? 'text-red-500' : 'text-white'} orbitron">${cant}</p>
                    </div>
                    <div class="bg-black/40 p-5 rounded-3xl border border-white/5 text-center">
                        <p class="text-[7px] text-slate-500 orbitron mb-1 uppercase">PVP</p>
                        <p class="text-sm font-black text-emerald-400 orbitron mt-2">$${Number(item.precioVenta || 0).toLocaleString()}</p>
                    </div>
                </div>

                <div class="flex gap-2">
                     <button onclick="window.ajustarStock('${item.id}', 1)" class="flex-1 py-4 bg-white/5 rounded-2xl border border-white/5 text-[9px] font-black orbitron hover:bg-cyan-500 hover:text-black transition-all uppercase">ENTRADA</button>
                     <button onclick="window.ajustarStock('${item.id}', -1)" class="flex-1 py-4 bg-white/5 rounded-2xl border border-white/5 text-[9px] font-black orbitron hover:bg-red-500 hover:text-white transition-all uppercase">SALIDA</button>
                </div>
                ${esCritico ? `<div class="absolute top-0 right-10 bg-red-500 text-white text-[6px] font-black px-3 py-1 rounded-b-xl orbitron animate-pulse">STOCK_BAJO</div>` : ''}
            </div>`;
        }).join("");
        
        actualizarEstadisticas(totalItems, valorAcumulado, alertas);
    };

    const actualizarEstadisticas = (t, v, a) => {
        document.getElementById("statTotal").innerText = t;
        document.getElementById("statValor").innerText = `$ ${v.toLocaleString()}`;
        document.getElementById("statAlertas").innerText = a;
    };

    const filtrarLocalmente = (term) => {
        const b = term.toLowerCase();
        const f = cacheInventario.filter(it => 
            it.nombre.toLowerCase().includes(b) || 
            (it.marca && it.marca.toLowerCase().includes(b)) ||
            (it.referencia && it.referencia.toLowerCase().includes(b)) ||
            (it.compatibilidad && it.compatibilidad.toLowerCase().includes(b))
        );
        renderGrid(f);
    };

    async function abrirModalCarga(datosEdicion = null) {
        const isEdit = !!datosEdicion;
        const { value: f } = await window.Swal.fire({
            title: isEdit ? 'ACTUALIZAR PROTOCOLO' : 'NUEVO INGRESO BÓVEDA',
            background: '#010409', color: '#fff',
            customClass: { popup: 'rounded-[3rem] border border-white/10' },
            html: `
                <div class="space-y-4 p-4 text-left">
                    <input id="sw-nom" class="w-full bg-[#0d1117] p-5 rounded-2xl border border-white/5 text-white uppercase text-sm" placeholder="NOMBRE DEL REPUESTO" value="${isEdit ? datosEdicion.nombre : ''}">
                    <div class="grid grid-cols-2 gap-4">
                        <input id="sw-ref" class="bg-[#0d1117] p-5 rounded-2xl border border-white/5 text-white uppercase text-[10px]" placeholder="# REFERENCIA" value="${isEdit ? (datosEdicion.referencia || '') : ''}">
                        <input id="sw-mar" class="bg-[#0d1117] p-5 rounded-2xl border border-white/5 text-white uppercase text-[10px]" placeholder="MARCA" value="${isEdit ? (datosEdicion.marca || '') : ''}">
                    </div>
                    <input id="sw-vh" class="w-full bg-[#0d1117] p-5 rounded-2xl border border-white/5 text-white uppercase text-[10px]" placeholder="VEHÍCULOS COMPATIBLES (EJ: TOYOTA HILUX, FORD F150)" value="${isEdit ? (datosEdicion.compatibilidad || '') : ''}">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[8px] orbitron text-slate-500 ml-2">CANTIDAD</label>
                            <input id="sw-can" type="number" class="w-full bg-[#0d1117] p-5 rounded-2xl border border-white/5 text-white text-center font-black" value="${isEdit ? datosEdicion.cantidad : '1'}">
                        </div>
                        <div>
                            <label class="text-[8px] orbitron text-slate-500 ml-2">PVP VENTA</label>
                            <input id="sw-ven" type="number" class="w-full bg-[#0d1117] p-5 rounded-2xl border border-white/5 text-emerald-400 text-center font-black" value="${isEdit ? datosEdicion.precioVenta : '0'}">
                        </div>
                    </div>
                    <div>
                        <label class="text-[8px] orbitron text-slate-500 ml-2">STOCK MÍNIMO (ALERTA)</label>
                        <input id="sw-min" type="number" class="w-full bg-[#0d1117] p-5 rounded-2xl border border-white/5 text-red-500 text-center font-black" value="${isEdit ? datosEdicion.minimo : '2'}">
                    </div>
                </div>`,
            showCancelButton: true,
            confirmButtonText: isEdit ? 'RE-SYNC_CORE' : 'COMMIT_VAULT',
            preConfirm: () => {
                const n = document.getElementById('sw-nom').value.trim();
                if(!n) return window.Swal.showValidationMessage("Nombre obligatorio");
                return {
                    nombre: n.toUpperCase(),
                    referencia: document.getElementById('sw-ref').value.toUpperCase(),
                    marca: document.getElementById('sw-mar').value.toUpperCase(),
                    compatibilidad: document.getElementById('sw-vh').value.toUpperCase(),
                    cantidad: Number(document.getElementById('sw-can').value),
                    precioVenta: Number(document.getElementById('sw-ven').value),
                    minimo: Number(document.getElementById('sw-min').value),
                    empresaId, origen: filtroActual,
                    actualizadoEn: serverTimestamp()
                }
            }
        });

        if (f) {
            if(isEdit) await updateDoc(doc(db, "inventario", datosEdicion.id), f);
            else await addDoc(collection(db, "inventario"), { ...f, creadoEn: serverTimestamp() });
            window.Swal.fire({ title: 'SINCRONIZADO', icon: 'success', background: '#010409', color: '#fff', timer: 1500 });
        }
    }

    window.editarRepuesto = async (id) => {
        const snap = await getDoc(doc(db, "inventario", id));
        if(snap.exists()) abrirModalCarga({ id: snap.id, ...snap.data() });
    };

    window.ajustarStock = async (id, cambio) => {
        const ref = doc(db, "inventario", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const nuevaC = Math.max(0, (Number(snap.data().cantidad) || 0) + cambio);
            await updateDoc(ref, { cantidad: nuevaC });
        }
    };

    window.eliminarActivo = async (id) => {
        const { isConfirmed } = await window.Swal.fire({ 
            title: '¿PURGAR REGISTRO?', 
            text: "Se eliminará del núcleo de datos.", 
            icon: 'warning', background: '#010409', color: '#fff', 
            showCancelButton: true, confirmButtonColor: '#ef4444' 
        });
        if(isConfirmed) await deleteDoc(doc(db, "inventario", id));
    };

    renderLayout();
}
