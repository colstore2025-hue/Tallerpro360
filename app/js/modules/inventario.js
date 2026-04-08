/**
 * inventario.js - NEXUS-X STOCK CONTROL V18.0 📦
 * SISTEMA DE GESTIÓN DE ACTIVOS Y LOGÍSTICA DE SUMINISTROS
 * Integrado con el Ecosistema de Órdenes y SuperAI
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function inventario(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let filtroActual = "PROPIO"; 
    let unsubscribe = null;

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in zoom-in duration-700 pb-40 min-h-screen bg-[#010409]">
            <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16 border-b border-white/5 pb-10">
                <div class="relative group">
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        STOCK <span class="text-cyan-400">CORE</span><span class="text-slate-700 text-xl">.NXS</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-4">
                        <div class="h-2 w-2 bg-cyan-500 rounded-full animate-pulse"></div>
                        <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.5em] orbitron italic">Bóveda de Suministros Aeroespaciales</p>
                    </div>
                </div>

                <div class="flex bg-[#0d1117] p-2 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl w-full lg:w-auto shadow-2xl">
                    <button id="tabPropio" class="flex-1 lg:flex-none px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all duration-500 orbitron tracking-widest">
                        ALMACÉN TALLER
                    </button>
                    <button id="tabCliente" class="flex-1 lg:flex-none px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all duration-500 orbitron tracking-widest">
                        SUMINISTRO EXTERNO
                    </button>
                </div>
            </header>

            <div id="statsRow" class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                <div class="bg-[#0d1117] border border-white/5 p-8 rounded-[3rem] shadow-xl">
                    <p class="text-[8px] text-slate-500 orbitron uppercase mb-2 italic">Unidades en Bóveda</p>
                    <p id="statTotal" class="text-4xl font-black text-white orbitron">0</p>
                </div>
                <div id="valTotalContainer" class="bg-[#0d1117] border border-white/5 p-8 rounded-[3rem] shadow-xl">
                    <p class="text-[8px] text-slate-500 orbitron uppercase mb-2 italic">Valorización de Activos (Venta)</p>
                    <p id="statValor" class="text-4xl font-black text-emerald-400 orbitron">$ 0</p>
                </div>
                <div class="bg-[#0d1117] border border-white/5 p-8 rounded-[3rem] hidden lg:block">
                    <p class="text-[8px] text-slate-500 orbitron uppercase mb-2 italic">Nivel de Salud</p>
                    <p id="statSalud" class="text-xs font-black text-cyan-400 orbitron">OPERATIVO</p>
                </div>
            </div>

            <div id="gridStock" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"></div>

            <button id="btnMainAdd" class="fixed bottom-10 right-10 w-24 h-24 bg-white text-black rounded-[3rem] shadow-[0_0_50px_rgba(255,255,255,0.2)] flex items-center justify-center z-50 hover:bg-cyan-400 hover:scale-110 active:scale-95 transition-all duration-500">
                <i class="fas fa-plus text-3xl"></i>
            </button>
        </div>`;

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
        
        const activeClass = "bg-white text-black shadow-2xl scale-105";
        const inactiveClass = "text-slate-500 hover:text-white";

        if(tipo === "PROPIO") {
            btnP.className = `flex-1 lg:flex-none px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all orbitron ${activeClass}`;
            btnC.className = `flex-1 lg:flex-none px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all orbitron ${inactiveClass}`;
            valCont.style.opacity = "1";
        } else {
            btnC.className = `flex-1 lg:flex-none px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all orbitron ${activeClass}`;
            btnP.className = `flex-1 lg:flex-none px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all orbitron ${inactiveClass}`;
            valCont.style.opacity = "0.2"; 
        }
        escucharStock();
    };

    function escucharStock() {
        if (unsubscribe) unsubscribe();
        
        const grid = document.getElementById("gridStock");
        const q = query(
            collection(db, "inventario"),
            where("empresaId", "==", empresaId),
            where("origen", "==", filtroActual),
            orderBy("creadoEn", "desc")
        );

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-40 text-center opacity-20"><i class="fas fa-microchip text-6xl mb-6 text-slate-500 animate-pulse"></i><p class="orbitron text-[10px] tracking-[0.5em] uppercase italic">Esperando Suministros...</p></div>`;
                actualizarEstadisticas(0, 0);
                return;
            }

            let totalItems = 0;
            let valorAcumulado = 0;

            grid.innerHTML = snap.docs.map(docSnap => {
                const item = { id: docSnap.id, ...docSnap.data() };
                const color = filtroActual === 'PROPIO' ? 'cyan-400' : 'amber-400';
                const esCritico = Number(item.cantidad) <= (Number(item.minimo) || 2);
                
                totalItems += Number(item.cantidad || 0);
                valorAcumulado += (Number(item.precioVenta || 0) * Number(item.cantidad || 0));

                return `
                <div class="bg-[#0d1117] p-8 rounded-[3.5rem] border border-white/5 relative group hover:border-${color}/40 transition-all duration-500 overflow-hidden shadow-2xl">
                    ${esCritico ? '<div class="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse"></div>' : ''}
                    
                    <div class="flex justify-between items-start mb-8">
                        <div class="space-y-2">
                            <span class="text-[7px] text-${color} font-black uppercase tracking-[0.3em] orbitron italic">ID: ${item.id.slice(-5)}</span>
                            <h3 class="text-white text-xl font-black uppercase leading-tight group-hover:text-${color} transition-colors">${item.nombre}</h3>
                        </div>
                        <button onclick="window.eliminarActivo('${item.id}')" class="w-10 h-10 bg-white/5 rounded-full text-slate-700 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center">
                            <i class="fas fa-trash-alt text-xs"></i>
                        </button>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-black/40 p-5 rounded-2xl border border-white/5 relative">
                            <p class="text-[7px] text-slate-600 font-black orbitron mb-1 uppercase tracking-widest">STOCK</p>
                            <p class="text-3xl font-black ${esCritico ? 'text-red-500' : 'text-white'} orbitron">${item.cantidad}</p>
                            ${esCritico ? '<span class="absolute top-2 right-2 text-[6px] text-red-500 font-bold animate-bounce">BAJO</span>' : ''}
                        </div>
                        <div class="bg-black/40 p-5 rounded-2xl border border-white/5">
                            <p class="text-[7px] text-slate-600 font-black orbitron mb-1 uppercase tracking-widest">${filtroActual === 'PROPIO' ? 'PVP VENTA' : 'PLACA'}</p>
                            <p class="text-sm font-black ${filtroActual === 'PROPIO' ? 'text-emerald-400' : 'text-amber-500'} orbitron truncate uppercase mt-2">
                                ${filtroActual === 'PROPIO' ? '$'+Number(item.precioVenta).toLocaleString() : item.placa}
                            </p>
                        </div>
                    </div>

                    <div class="mt-6 flex gap-2">
                         <button onclick="window.ajustarStock('${item.id}', 1)" class="flex-1 py-4 bg-white/5 rounded-xl border border-white/5 text-[9px] font-black orbitron hover:bg-white/10 transition-all">+ UNIDAD</button>
                         <button onclick="window.ajustarStock('${item.id}', -1)" class="flex-1 py-4 bg-white/5 rounded-xl border border-white/5 text-[9px] font-black orbitron hover:bg-white/10 transition-all">- UNIDAD</button>
                    </div>
                </div>`;
            }).join("");

            actualizarEstadisticas(totalItems, valorAcumulado);
        });
    }

    const actualizarEstadisticas = (total, valor) => {
        document.getElementById("statTotal").innerText = total;
        document.getElementById("statValor").innerText = `$ ${valor.toLocaleString()}`;
    };

    async function abrirModalCarga() {
        const isPropio = filtroActual === "PROPIO";
        const accent = isPropio ? '#00f2ff' : '#f59e0b';

        const { value: f } = await window.Swal.fire({
            title: isPropio ? 'NUEVO ACTIVO DE TALLER' : 'VINCULAR INSUMO CLIENTE',
            background: '#010409', 
            color: '#fff',
            customClass: { popup: 'rounded-[3.5rem] border border-white/10 shadow-3xl' },
            html: `
                <div class="space-y-4 p-4 mt-4 text-left">
                    <label class="text-[9px] orbitron font-black text-slate-500 ml-4">DESCRIPCIÓN TÉCNICA</label>
                    <input id="sw-nom" class="w-full bg-[#0d1117] p-6 rounded-3xl text-white border border-white/5 outline-none focus:border-[${accent}] uppercase font-bold" placeholder="EJ: DISCOS DE FRENO BREMBO">
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-2">
                            <label class="text-[9px] orbitron font-black text-slate-500 ml-4">CANTIDAD INICIAL</label>
                            <input id="sw-can" type="number" class="w-full bg-[#0d1117] p-6 rounded-3xl text-white border border-white/5 outline-none" placeholder="0">
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-[9px] orbitron font-black text-slate-500 ml-4">${isPropio ? 'PRECIO COSTO' : 'PLACA'}</label>
                            <input id="sw-costo" type="number" class="w-full bg-[#0d1117] p-6 rounded-3xl text-white border border-white/5 outline-none" placeholder="${isPropio ? 'VALOR COMPRA' : 'ABC-123'}">
                        </div>
                    </div>

                    ${isPropio ? `
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-2">
                            <label class="text-[9px] orbitron font-black text-slate-500 ml-4">PRECIO VENTA</label>
                            <input id="sw-venta" type="number" class="w-full bg-[#0d1117] p-6 rounded-3xl text-white border border-white/5 outline-none" placeholder="VALOR CLIENTE">
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-[9px] orbitron font-black text-slate-500 ml-4">STOCK MÍNIMO</label>
                            <input id="sw-min" type="number" class="w-full bg-[#0d1117] p-6 rounded-3xl text-white border border-white/5 outline-none" placeholder="ALERTA">
                        </div>
                    </div>` : ''}
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'DESPLEGAR EN BÓVEDA',
            preConfirm: () => {
                const nombre = document.getElementById('sw-nom').value;
                if(!nombre) return window.Swal.showValidationMessage("La descripción es obligatoria");
                
                return {
                    nombre: nombre.toUpperCase(),
                    cantidad: Number(document.getElementById('sw-can').value || 0),
                    precioCosto: isPropio ? Number(document.getElementById('sw-costo').value || 0) : 0,
                    precioVenta: isPropio ? Number(document.getElementById('sw-venta').value || 0) : 0,
                    placa: !isPropio ? document.getElementById('sw-costo').value.toUpperCase() : 'INTERNO',
                    minimo: isPropio ? Number(document.getElementById('sw-min').value || 2) : 0,
                    origen: filtroActual,
                    empresaId: empresaId,
                    creadoEn: serverTimestamp()
                }
            }
        });

        if(f) { 
            try {
                const { addDoc, collection } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
                await addDoc(collection(db, "inventario"), f);
                window.Swal.fire({ icon: 'success', title: 'SINCRONIZADO', background: '#010409', color: '#fff', timer: 1500 });
            } catch (e) {
                console.error("Error guardando inventario:", e);
                window.Swal.fire('ERROR', 'Fallo en la conexión neural', 'error');
            }
        }
    }

    window.ajustarStock = async (id, cambio) => {
        const docRef = doc(db, "inventario", id);
        const snap = await getDoc(docRef);
        if(snap.exists()) {
            const nuevaCantidad = Math.max(0, (snap.data().cantidad || 0) + cambio);
            await updateDoc(docRef, { cantidad: nuevaCantidad });
        }
    };

    window.eliminarActivo = async (id) => {
        const { isConfirmed } = await window.Swal.fire({
            title: '¿ELIMINAR ACTIVO?',
            text: "Esta acción es irreversible en el núcleo de datos.",
            icon: 'warning',
            background: '#010409', color: '#fff',
            showCancelButton: true, confirmButtonColor: '#ef4444'
        });
        if(isConfirmed) await deleteDoc(doc(db, "inventario", id));
    };

    renderLayout();
}
