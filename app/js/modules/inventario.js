/**
 * 🌌 NEXUS-X AERO-LOGISTICS ERP - VAULT STOCK V21.5
 * 🛠️ ARQUITECTURA "TERMINATOR" - RECONSTRUCCIÓN DE NÚCLEO ESTABLE
 * 🏗️ SYSTEM: INVENTORY & SUPPLY CHAIN PROTOCOL
 */

import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, 
    doc, updateDoc, deleteDoc, getDoc, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function inventario(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let filtroActual = "PROPIO"; 
    let unsubscribe = null;
    let cacheInventario = []; 

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in duration-700 pb-40 min-h-screen bg-[#010409]">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-10 mb-20 border-b border-white/5 pb-12">
                <div>
                    <h1 class="orbitron text-6xl font-black text-white italic tracking-tighter uppercase">
                        VAULT <span class="text-cyan-400">STOCK</span><span class="text-slate-700 text-2xl">.V21.5</span>
                    </h1>
                    <p class="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] orbitron mt-4">Logística de Precisión / Almacén Central</p>
                </div>
                <div class="flex bg-[#0d1117] p-2 rounded-[3rem] border border-white/10 shadow-2xl">
                    <button id="tabPropio" class="px-10 py-4 rounded-[2.5rem] text-[10px] font-black orbitron transition-all">BÓVEDA TALLER</button>
                    <button id="tabCliente" class="px-10 py-4 rounded-[2.5rem] text-[10px] font-black orbitron transition-all">REPUESTO CLIENTE</button>
                </div>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                    <p class="text-[9px] text-slate-500 orbitron mb-4 uppercase">Stock Total</p>
                    <p id="statTotal" class="text-5xl font-black text-white orbitron">0</p>
                </div>
                <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                    <p class="text-[9px] text-slate-500 orbitron mb-4 uppercase">Valorización Inventario</p>
                    <p id="statValor" class="text-4xl font-black text-emerald-400 orbitron">$ 0</p>
                </div>
                <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                    <p class="text-[9px] text-slate-500 orbitron mb-4 uppercase">Alertas Críticas</p>
                    <p id="statAlertas" class="text-5xl font-black text-red-500 orbitron">0</p>
                </div>
            </div>

            <div class="mb-14 relative">
                <input id="stockSearch" type="text" placeholder="ESCANEAR MEMORIA..." class="w-full bg-[#0d1117] p-8 pl-20 rounded-[3rem] border border-white/5 text-white orbitron text-sm outline-none focus:border-cyan-500 transition-all">
                <i class="fas fa-search absolute left-8 top-1/2 -translate-y-1/2 text-cyan-500"></i>
            </div>

            <div id="gridStock" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"></div>

            <button id="btnMainAdd" class="fixed bottom-12 right-12 w-24 h-24 bg-white text-black rounded-full shadow-2xl flex items-center justify-center z-50 hover:bg-cyan-400 transition-all">
                <i class="fas fa-plus text-2xl"></i>
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
        const active = "bg-white text-black scale-105";
        const inactive = "text-slate-500 hover:text-white";
        document.getElementById("tabPropio").className = `px-10 py-4 rounded-[2.5rem] text-[10px] font-black orbitron transition-all ${tipo==='PROPIO'?active:inactive}`;
        document.getElementById("tabCliente").className = `px-10 py-4 rounded-[2.5rem] text-[10px] font-black orbitron transition-all ${tipo==='CLIENTE'?active:inactive}`;
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
            if (cant <= min) alertas++;

            return `
            <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative group hover:bg-[#161b22] transition-all duration-300">
                <div class="flex justify-between items-start mb-4">
                    <div class="max-w-[70%]">
                        <span class="text-[7px] text-cyan-400 orbitron font-bold uppercase">${item.marca || 'GENÉRICO'} | ${item.referencia || 'REF-X'}</span>
                        <h3 class="text-white text-lg font-black uppercase truncate">${item.nombre}</h3>
                        <p class="text-[7px] text-slate-600 orbitron">EMPAQUE: ${item.empaque || 'UNIDAD'}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="window.editarRepuesto('${item.id}')" class="text-slate-500 hover:text-cyan-400"><i class="fas fa-edit"></i></button>
                        <button onclick="window.eliminarActivo('${item.id}')" class="text-slate-500 hover:text-red-500"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 text-center">
                    <div><p class="text-[7px] text-slate-500 orbitron uppercase">Stock</p><p class="text-2xl font-black text-white orbitron">${cant}</p></div>
                    <div><p class="text-[7px] text-slate-500 orbitron uppercase">Venta Uni.</p><p class="text-xs font-black text-emerald-400 orbitron mt-2">$${Number(item.precioVenta || 0).toLocaleString()}</p></div>
                </div>
                <div class="flex gap-2 mt-4">
                     <button onclick="window.ajustarStock('${item.id}', 1)" class="flex-1 py-3 bg-white/5 rounded-xl border border-white/5 text-[8px] font-black orbitron hover:bg-cyan-500 hover:text-black transition-all">IN</button>
                     <button onclick="window.ajustarStock('${item.id}', -1)" class="flex-1 py-3 bg-white/5 rounded-xl border border-white/5 text-[8px] font-black orbitron hover:bg-red-500 hover:text-white transition-all">OUT</button>
                </div>
            </div>`;
        }).join("");
        
        document.getElementById("statTotal").innerText = totalItems;
        document.getElementById("statValor").innerText = `$ ${valorAcumulado.toLocaleString()}`;
        document.getElementById("statAlertas").innerText = alertas;
    };

    const filtrarLocalmente = (term) => {
        const b = term.toLowerCase();
        renderGrid(cacheInventario.filter(it => it.nombre.toLowerCase().includes(b) || (it.marca && it.marca.toLowerCase().includes(b))));
    };

    async function abrirModalCarga(editData = null) {
        const { value: f } = await window.Swal.fire({
            title: editData ? 'EDITAR PROTOCOLO' : 'NUEVO INGRESO',
            background: '#010409', color: '#fff',
            customClass: { popup: 'rounded-[3rem] border border-white/10' },
            html: `
                <div class="space-y-3 p-2 text-left">
                    <input id="sw-nom" class="w-full bg-[#0d1117] p-4 rounded-xl border border-white/5 text-white uppercase text-sm" placeholder="NOMBRE" value="${editData?.nombre || ''}">
                    <div class="grid grid-cols-2 gap-3">
                        <input id="sw-ref" class="bg-[#0d1117] p-4 rounded-xl border border-white/5 text-white uppercase text-[10px]" placeholder="REF" value="${editData?.referencia || ''}">
                        <input id="sw-mar" class="bg-[#0d1117] p-4 rounded-xl border border-white/5 text-white uppercase text-[10px]" placeholder="MARCA" value="${editData?.marca || ''}">
                    </div>
                    <input id="sw-emp" class="w-full bg-[#0d1117] p-4 rounded-xl border border-white/5 text-white uppercase text-[10px]" placeholder="UNIDAD DE EMPAQUE (CAJA X 10, UNIDAD, GALÓN)" value="${editData?.empaque || ''}">
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-black/20 p-2 rounded-xl border border-white/5">
                            <label class="text-[7px] orbitron text-slate-500 block mb-1">COSTO TOTAL COMPRA</label>
                            <input id="sw-cos" type="number" class="w-full bg-transparent text-white text-center font-black" placeholder="0" value="${editData?.precioCosto || ''}">
                        </div>
                        <div class="bg-black/20 p-2 rounded-xl border border-white/5">
                            <label class="text-[7px] orbitron text-slate-500 block mb-1">STOCK INICIAL</label>
                            <input id="sw-can" type="number" class="w-full bg-transparent text-white text-center font-black" value="${editData?.cantidad || '1'}">
                        </div>
                    </div>
                    <div class="bg-cyan-500/10 p-4 rounded-xl border border-cyan-500/20">
                        <label class="text-[8px] orbitron text-cyan-400 block mb-1 font-black">PRECIO DE VENTA (POR UNIDAD)</label>
                        <input id="sw-ven" type="number" class="w-full bg-transparent text-emerald-400 text-center text-xl font-black" placeholder="0" value="${editData?.precioVenta || ''}">
                        <p class="text-[6px] text-slate-500 text-center mt-2 italic">Si compraste varios, divide el costo y pon aquí el valor de venta de una sola unidad.</p>
                    </div>
                    <input id="sw-min" type="number" class="w-full bg-[#0d1117] p-4 rounded-xl border border-white/5 text-red-500 text-center text-xs" placeholder="ALERTA STOCK MÍNIMO" value="${editData?.minimo || '2'}">
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'GUARDAR REGISTRO',
            preConfirm: () => {
                const n = document.getElementById('sw-nom').value.trim();
                if(!n) return window.Swal.showValidationMessage("Nombre es vital");
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
                window.Swal.fire({ title: 'SINC_OK', icon: 'success', background: '#010409', color: '#fff', timer: 1000 });
            } catch (e) { 
                console.error("Firestore Error:", e);
                window.Swal.fire('ERROR', 'No se pudo guardar en la nube', 'error');
            }
        }
    }

    window.editarRepuesto = async (id) => {
        const snap = await getDoc(doc(db, "inventario", id));
        if(snap.exists()) abrirModalCarga({ id: snap.id, ...snap.data() });
    };

    window.ajustarStock = async (id, cambio) => {
        const ref = doc(doc(db, "inventario", id));
        const snap = await getDoc(ref);
        if (snap.exists()) await updateDoc(ref, { cantidad: Math.max(0, (Number(snap.data().cantidad) || 0) + cambio) });
    };

    window.eliminarActivo = async (id) => {
        const { isConfirmed } = await window.Swal.fire({ title: '¿ELIMINAR?', icon: 'warning', background: '#010409', color: '#fff', showCancelButton: true });
        if(isConfirmed) await deleteDoc(doc(db, "inventario", id));
    };

    renderLayout();
}
