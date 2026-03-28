/**
 * inventario.js - TallerPRO360 V17.0 📦
 * Motor de Almacén Nexus-X: Gestión de Activos (Arquitectura Raíz)
 * @author William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { createDocument, saveLog } from "../services/dataService.js";

export default async function inventario(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const mode = localStorage.getItem("nexus_mode");
    let filtroActual = "PROPIO"; 
    let unsubscribe = null;

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16 px-4">
                <div class="relative group">
                    <h1 class="orbitron text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                        STOCK <span class="text-cyan-400">CONTROL</span><span class="text-slate-700 text-xl">.NEXUS</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-4">
                        <span class="flex h-2 w-2">
                            <span class="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-cyan-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                        <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.6em] orbitron">Logística de Suministros V17.0</p>
                    </div>
                </div>

                <div class="flex bg-slate-900/60 p-2 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl w-full lg:w-auto shadow-2xl">
                    <button id="tabPropio" class="flex-1 lg:flex-none px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all duration-500 orbitron tracking-widest">
                        INVENTARIO TALLER
                    </button>
                    <button id="tabCliente" class="flex-1 lg:flex-none px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all duration-500 orbitron tracking-widest">
                        INSUMOS CLIENTE
                    </button>
                </div>
            </header>

            <div id="statsRow" class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16 px-4">
                <div class="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem]">
                    <p class="text-[7px] text-slate-500 orbitron uppercase mb-1">Items Totales</p>
                    <p id="statTotal" class="text-xl font-black text-white orbitron">0</p>
                </div>
                <div id="valTotalContainer" class="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem]">
                    <p class="text-[7px] text-slate-500 orbitron uppercase mb-1">Valorización</p>
                    <p id="statValor" class="text-xl font-black text-emerald-400 orbitron">$0</p>
                </div>
            </div>

            <div id="gridStock" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-4">
                </div>

            <button id="btnMainAdd" class="fixed bottom-32 right-10 w-24 h-24 bg-cyan-500 rounded-[3rem] text-black shadow-[0_25px_60px_rgba(0,242,255,0.4)] flex items-center justify-center z-50 hover:rotate-90 hover:scale-110 active:scale-90 transition-all duration-700">
                <i class="fas fa-plus text-3xl"></i>
            </button>
        </div>
        `;

        document.getElementById("tabPropio").onclick = () => switchTab("PROPIO");
        document.getElementById("tabCliente").onclick = () => switchTab("CLIENTE");
        document.getElementById("btnMainAdd").onclick = abrirModalCarga;
        
        switchTab("PROPIO");
    };

    const switchTab = (tipo) => {
        filtroActual = tipo;
        const btnP = document.getElementById("tabPropio");
        const btnC = document.getElementById("tabCliente");
        const valCont = document.getElementById("valTotalContainer");
        
        const activePropio = "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20";
        const activeCliente = "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20";
        const inactive = "text-slate-500 hover:text-white";

        if(tipo === "PROPIO") {
            btnP.className = `flex-1 lg:flex-none px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all orbitron ${activePropio}`;
            btnC.className = `flex-1 lg:flex-none px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all orbitron ${inactive}`;
            valCont.classList.remove('hidden');
        } else {
            btnC.className = `flex-1 lg:flex-none px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all orbitron ${activeCliente}`;
            btnP.className = `flex-1 lg:flex-none px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all orbitron ${inactive}`;
            valCont.classList.add('hidden'); 
        }
        escucharStock();
    };

    function escucharStock() {
        if (unsubscribe) unsubscribe();
        
        const grid = document.getElementById("gridStock");
        
        // 🛰️ IGUAL QUE CLIENTES: Consulta a COLECCIÓN RAÍZ con filtro empresaId
        const q = query(
            collection(db, "inventario"),
            where("empresaId", "==", empresaId),
            where("origen", "==", filtroActual),
            orderBy("creadoEn", "desc")
        );

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-40 text-center opacity-10"><i class="fas fa-box-open text-6xl mb-6 text-slate-500"></i><p class="orbitron text-[10px] tracking-[0.5em] uppercase italic">Bóveda sin registros</p></div>`;
                actualizarEstadisticas(0, 0);
                return;
            }

            let totalItems = 0;
            let valorAcumulado = 0;

            grid.innerHTML = snap.docs.map(docSnap => {
                const item = docSnap.data();
                const color = filtroActual === 'PROPIO' ? 'cyan-400' : 'yellow-500';
                
                totalItems += Number(item.cantidad || 0);
                valorAcumulado += (Number(item.precioVenta || 0) * Number(item.cantidad || 0));

                return `
                <div class="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[3.5rem] border border-white/5 relative group hover:border-${color}/30 transition-all duration-700">
                    <div class="flex justify-between items-start mb-8">
                        <div class="space-y-2">
                            <span class="text-[7px] text-${color} font-black uppercase tracking-[0.3em] orbitron italic">CARGA ${filtroActual}</span>
                            <h3 class="text-white text-md font-black uppercase tracking-tight leading-tight">${item.nombre}</h3>
                        </div>
                        <div class="w-12 h-12 bg-black rounded-2xl flex items-center justify-center border border-white/10">
                            <i class="fas ${filtroActual === 'PROPIO' ? 'fa-box-open' : 'fa-tools'} text-${color} text-sm"></i>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-black/40 p-5 rounded-2xl border border-white/5">
                            <p class="text-[7px] text-slate-600 font-black orbitron mb-1">CANTIDAD</p>
                            <p class="text-2xl font-black text-white orbitron">${item.cantidad}</p>
                        </div>
                        <div class="bg-black/40 p-5 rounded-2xl border border-white/5">
                            <p class="text-[7px] text-slate-600 font-black orbitron mb-1">${filtroActual === 'PROPIO' ? 'P. VENTA' : 'REF_PLACA'}</p>
                            <p class="text-xs font-black ${filtroActual === 'PROPIO' ? 'text-emerald-400' : 'text-yellow-500'} orbitron truncate uppercase">
                                ${filtroActual === 'PROPIO' ? '$'+Number(item.precioVenta).toLocaleString() : item.placa}
                            </p>
                        </div>
                    </div>
                </div>`;
            }).join("");

            actualizarEstadisticas(totalItems, valorAcumulado);
        });
    }

    const actualizarEstadisticas = (total, valor) => {
        document.getElementById("statTotal").innerText = total;
        document.getElementById("statValor").innerText = `$${valor.toLocaleString()}`;
    };

    async function abrirModalCarga() {
        const isPropio = filtroActual === "PROPIO";
        const color = isPropio ? '#00f2ff' : '#f59e0b';

        const { value: f } = await window.Swal.fire({
            title: isPropio ? 'LOGÍSTICA INTERNA' : 'INSUMO EXTERNO',
            background: '#020617', 
            color: '#fff',
            customClass: { popup: 'rounded-[4rem] border border-white/10 backdrop-blur-3xl' },
            html: `
                <div class="space-y-4 p-4 mt-4">
                    <input id="sw-nom" class="w-full bg-black/40 p-6 rounded-[2rem] text-white border border-white/5 outline-none focus:border-[${color}]" placeholder="DESCRIPCIÓN">
                    <div class="grid grid-cols-2 gap-4">
                        <input id="sw-can" type="number" class="w-full bg-black/40 p-6 rounded-[2rem] text-white border border-white/5" placeholder="CANT">
                        <input id="sw-val" class="w-full bg-black/40 p-6 rounded-[2rem] text-white border border-white/5" placeholder="${isPropio ? '$ PRECIO' : 'PLACA'}">
                    </div>
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'DESPLEGAR ACTIVO',
            preConfirm: () => {
                const n = document.getElementById('sw-nom').value;
                const v = document.getElementById('sw-val').value;
                if(!n) return window.Swal.showValidationMessage("Nombre requerido");
                return {
                    nombre: n.toUpperCase(),
                    cantidad: Number(document.getElementById('sw-can').value || 1),
                    precioVenta: isPropio ? Number(v) : 0,
                    placa: !isPropio ? v.toUpperCase() : 'INTERNO',
                    origen: filtroActual,
                    creadoEn: serverTimestamp()
                }
            }
        });

        if(f) { 
            // 🚀 createDocument se encarga de inyectar el empresaId (Colección Raíz)
            await createDocument("inventario", f); 
            saveLog("CARGA_STOCK", { item: f.nombre, origen: f.origen });
            window.Swal.fire({ icon: 'success', title: 'ACTIVO VINCULADO', background: '#020617', color: '#fff' });
        }
    }

    renderLayout();
}
