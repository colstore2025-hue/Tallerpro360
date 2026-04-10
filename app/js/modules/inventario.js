/**
 * inventario.js - NEXUS-X STOCK CONTROL V20.0 📦
 * ARQUITECTURA TIPO ERP PRO-2030 TERMINATOR - CORREGIDO
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

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in zoom-in duration-700 pb-40 min-h-screen bg-[#010409]">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-16 border-b border-white/5 pb-10">
                <div class="relative group">
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        VAULT <span class="text-cyan-400">STOCK</span><span class="text-slate-700 text-xl">.V20</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-4">
                        <div class="h-2 w-2 bg-cyan-500 rounded-full animate-ping"></div>
                        <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.5em] orbitron italic">Monitor de Suministros en Tiempo Real</p>
                    </div>
                </div>

                <div class="flex bg-[#0d1117] p-2 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl w-full lg:w-auto shadow-2xl">
                    <button id="tabPropio" class="flex-1 lg:flex-none px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all duration-500 orbitron tracking-widest">
                        BÓVEDA TALLER
                    </button>
                    <button id="tabCliente" class="flex-1 lg:flex-none px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all duration-500 orbitron tracking-widest">
                        REPUESTO CLIENTE
                    </button>
                </div>
            </header>

            <div id="statsRow" class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                <div class="bg-[#0d1117] border border-white/5 p-8 rounded-[3rem] shadow-xl group hover:border-cyan-500/30 transition-all">
                    <p class="text-[8px] text-slate-500 orbitron uppercase mb-2 italic">Unidades Totales</p>
                    <p id="statTotal" class="text-4xl font-black text-white orbitron">0</p>
                </div>
                <div id="valTotalContainer" class="bg-[#0d1117] border border-white/5 p-8 rounded-[3rem] shadow-xl group hover:border-emerald-500/30 transition-all">
                    <p class="text-[8px] text-slate-500 orbitron uppercase mb-2 italic">Valorización (PVP)</p>
                    <p id="statValor" class="text-4xl font-black text-emerald-400 orbitron">$ 0</p>
                </div>
                <div class="bg-[#0d1117] border border-white/5 p-8 rounded-[3rem] group hover:border-red-500/30 transition-all">
                    <p class="text-[8px] text-slate-500 orbitron uppercase mb-2 italic">Alertas Stock Crítico</p>
                    <p id="statAlertas" class="text-4xl font-black text-red-500 orbitron">0</p>
                </div>
                <div class="bg-[#0d1117] border border-white/5 p-8 rounded-[3rem] hidden lg:block">
                    <p class="text-[8px] text-slate-500 orbitron uppercase mb-2 italic">Estado Sincronía</p>
                    <p class="text-xs font-black text-cyan-400 orbitron">LIVE_STREAM_ON</p>
                </div>
            </div>

            <div class="mb-10 relative">
                <input id="stockSearch" type="text" placeholder="BUSCAR EN EL ALMACÉN..." class="w-full bg-[#0d1117] p-8 pl-20 rounded-[3rem] border border-white/5 text-white orbitron text-xs focus:border-cyan-500/50 outline-none transition-all shadow-2xl">
                <i class="fas fa-search absolute left-8 top-1/2 -translate-y-1/2 text-slate-500"></i>
            </div>

            <div id="gridStock" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"></div>

            <button id="btnMainAdd" class="fixed bottom-10 right-10 w-24 h-24 bg-white text-black rounded-[3rem] shadow-[0_0_50px_rgba(255,255,255,0.2)] flex items-center justify-center z-50 hover:bg-cyan-400 hover:scale-110 active:scale-95 transition-all duration-500">
                <i class="fas fa-plus text-3xl"></i>
            </button>
        </div>`;

        document.getElementById("tabPropio").onclick = () => switchTab("PROPIO");
        document.getElementById("tabCliente").onclick = () => switchTab("CLIENTE");
        document.getElementById("btnMainAdd").onclick = abrirModalCarga;
        document.getElementById("stockSearch").oninput = (e) => filtrarLocalmente(e.target.value);
        
        switchTab("PROPIO");
    };

    const switchTab = (tipo) => {
        filtroActual = tipo;
        escucharStock();
        
        const btnP = document.getElementById("tabPropio");
        const btnC = document.getElementById("tabCliente");
        const valCont = document.getElementById("valTotalContainer");
        
        const active = "bg-white text-black shadow-2xl scale-105";
        const inactive = "text-slate-500 hover:text-white";

        if(btnP) btnP.className = `flex-1 lg:flex-none px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all orbitron ${tipo === 'PROPIO' ? active : inactive}`;
        if(btnC) btnC.className = `flex-1 lg:flex-none px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all orbitron ${tipo === 'CLIENTE' ? active : inactive}`;
        if(valCont) valCont.style.opacity = tipo === "PROPIO" ? "1" : "0.2";
    };

    function escucharStock() {
        if (unsubscribe) unsubscribe();
        if (!empresaId) return;

        const q = query(
            collection(db, "inventario"),
            where("empresaId", "==", empresaId),
            where("origen", "==", filtroActual),
            orderBy("nombre", "asc")
        );

        unsubscribe = onSnapshot(q, (snap) => {
            renderGrid(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (error) => {
            console.error("Error en Snapshot:", error);
        });
    }

    const renderGrid = (data) => {
        const grid = document.getElementById("gridStock");
        let totalItems = 0;
        let valorAcumulado = 0;
        let alertas = 0;

        if (!grid) return;

        if (data.length === 0) {
            grid.innerHTML = `<div class="col-span-full py-40 text-center opacity-20"><i class="fas fa-box-open text-6xl mb-6"></i><p class="orbitron text-[10px] tracking-widest uppercase italic">Vórtice de datos vacío</p></div>`;
            actualizarEstadisticas(0, 0, 0);
            return;
        }

        grid.innerHTML = data.map(item => {
            // UNIFICACIÓN: Usamos siempre 'cantidad'
            const cant = Number(item.cantidad || 0);
            const min = Number(item.minimo || 2);
            const esCritico = cant <= min;
            
            totalItems += cant;
            if (filtroActual === "PROPIO") valorAcumulado += (Number(item.precioVenta || 0) * cant);
            if (esCritico) alertas++;

            const accent = filtroActual === 'PROPIO' ? 'cyan-400' : 'amber-400';

            return `
            <div class="bg-[#0d1117] p-8 rounded-[3.5rem] border border-white/5 relative group hover:border-${accent}/40 transition-all duration-500 shadow-2xl">
                <div class="flex justify-between items-start mb-6">
                    <div class="max-w-[70%]">
                        <span class="text-[7px] text-${accent} font-black uppercase tracking-widest orbitron">SKU: ${item.id.slice(-6).toUpperCase()}</span>
                        <h3 class="text-white text-lg font-black uppercase truncate group-hover:text-${accent} transition-colors">${item.nombre}</h3>
                    </div>
                    <button onclick="window.eliminarActivo('${item.id}')" class="text-slate-800 hover:text-red-500 transition-colors p-2"><i class="fas fa-trash-alt text-xs"></i></button>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-black/40 p-5 rounded-2xl border border-white/5">
                        <p class="text-[7px] text-slate-500 orbitron mb-1 font-black">STOCK</p>
                        <p class="text-3xl font-black ${esCritico ? 'text-red-500 animate-pulse' : 'text-white'} orbitron">${cant}</p>
                    </div>
                    <div class="bg-black/40 p-5 rounded-2xl border border-white/5">
                        <p class="text-[7px] text-slate-500 orbitron mb-1 font-black">${filtroActual === 'PROPIO' ? 'PVP VENTA' : 'REF VEHÍCULO'}</p>
                        <p class="text-xs font-black ${filtroActual === 'PROPIO' ? 'text-emerald-400' : 'text-amber-500'} orbitron truncate mt-2">
                            ${filtroActual === 'PROPIO' ? '$'+Number(item.precioVenta || 0).toLocaleString() : (item.placa || 'N/A')}
                        </p>
                    </div>
                </div>

                <div class="mt-6 flex gap-2">
                     <button onclick="window.ajustarStock('${item.id}', 1)" class="flex-1 py-4 bg-white/5 rounded-xl border border-white/5 text-[9px] font-black orbitron hover:bg-${accent}/10 transition-all">+ IN</button>
                     <button onclick="window.ajustarStock('${item.id}', -1)" class="flex-1 py-4 bg-white/5 rounded-xl border border-white/5 text-[9px] font-black orbitron hover:bg-red-500/10 transition-all">- OUT</button>
                </div>
            </div>`;
        }).join("");

        actualizarEstadisticas(totalItems, valorAcumulado, alertas);
    };

    const actualizarEstadisticas = (total, valor, alertas) => {
        const t = document.getElementById("statTotal");
        const v = document.getElementById("statValor");
        const a = document.getElementById("statAlertas");
        if(t) t.innerText = total;
        if(v) v.innerText = `$ ${valor.toLocaleString()}`;
        if(a) a.innerText = alertas;
    };

    async function abrirModalCarga() {
        const isPropio = filtroActual === "PROPIO";
        const { value: f } = await window.Swal.fire({
            title: isPropio ? 'NUEVA CARGA TALLER' : 'SUMINISTRO CLIENTE',
            background: '#010409', color: '#fff',
            customClass: { popup: 'rounded-[3.5rem] border border-white/10' },
            html: `
                <div class="space-y-4 p-4 mt-4 text-left">
                    <div>
                        <label class="text-[9px] orbitron font-black text-slate-500 ml-4 italic uppercase">Descripción de la Pieza</label>
                        <input id="sw-nom" class="w-full bg-[#0d1117] p-6 rounded-3xl text-white border border-white/5 outline-none focus:border-cyan-500 uppercase font-bold" placeholder="EJ: KIT REPARTICIÓN">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[9px] orbitron font-black text-slate-500 ml-4">STOCK INICIAL</label>
                            <input id="sw-can" type="number" class="w-full bg-[#0d1117] p-6 rounded-3xl text-white border border-white/5 outline-none" value="1">
                        </div>
                        <div>
                            <label class="text-[9px] orbitron font-black text-slate-500 ml-4">${isPropio ? 'COSTO COMPRA' : 'PLACA ASOCIADA'}</label>
                            <input id="sw-costo" type="${isPropio ? 'number' : 'text'}" class="w-full bg-[#0d1117] p-6 rounded-3xl text-white border border-white/5 outline-none" placeholder="${isPropio ? 'VALOR NETO' : 'AAA000'}">
                        </div>
                    </div>
                    ${isPropio ? `
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[9px] orbitron font-black text-slate-500 ml-4">PRECIO VENTA</label>
                            <input id="sw-venta" type="number" class="w-full bg-[#0d1117] p-6 rounded-3xl text-white border border-white/5 outline-none" placeholder="PVP">
                        </div>
                        <div>
                            <label class="text-[9px] orbitron font-black text-slate-500 ml-4">STOCK ALERTA</label>
                            <input id="sw-min" type="number" class="w-full bg-[#0d1117] p-6 rounded-3xl text-white border border-white/5 outline-none" value="2">
                        </div>
                    </div>` : ''}
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'GRABAR EN MEMORIA',
            preConfirm: () => {
                const nombre = document.getElementById('sw-nom').value.trim();
                if(!nombre) return window.Swal.showValidationMessage("Nombre requerido");
                return {
                    nombre: nombre.toUpperCase(),
                    cantidad: Number(document.getElementById('sw-can').value),
                    costo: isPropio ? Number(document.getElementById('sw-costo').value) : 0,
                    precioVenta: isPropio ? Number(document.getElementById('sw-venta').value) : 0,
                    placa: !isPropio ? document.getElementById('sw-costo').value.toUpperCase() : 'INTERNO',
                    minimo: isPropio ? Number(document.getElementById('sw-min').value) : 2,
                    origen: filtroActual,
                    empresaId: empresaId,
                    creadoEn: serverTimestamp()
                }
            }
        });

        if (f) {
            try {
                await addDoc(collection(db, "inventario"), f);
                window.Swal.fire({ icon: 'success', title: 'SINCRONIZADO', background: '#010409', color: '#fff', timer: 1500 });
            } catch (e) {
                console.error(e);
                window.Swal.fire('ERROR', 'Fallo de núcleo', 'error');
            }
        }
    }

    // --- 🔍 VINCULACIÓN CON ORDENES.JS ---
    window.buscarEnInventario = async (idx) => {
        const q = query(
            collection(db, "inventario"), 
            where("empresaId", "==", empresaId), 
            where("origen", "==", "PROPIO"), 
            orderBy("nombre", "asc")
        );
        
        const snap = await getDocs(q); // 👈 CORREGIDO: getDocs para la lista

        if (snap.empty) {
            window.Swal.fire('BÓVEDA VACÍA', 'No hay repuestos registrados.', 'warning');
            return;
        }

        const options = {};
        snap.docs.forEach(d => {
            const data = d.data();
            options[d.id] = `${data.nombre} [Cant: ${data.cantidad}]`;
        });

        const { value: selectedId } = await window.Swal.fire({
            title: 'SELECCIONAR REPUESTO',
            background: '#010409', color: '#fff',
            input: 'select',
            inputOptions: options,
            inputPlaceholder: 'Elija una pieza...',
            showCancelButton: true,
            confirmButtonText: 'VINCULAR A OT'
        });

        if (selectedId) {
            const itemSnap = await getDoc(doc(db, "inventario", selectedId));
            const item = itemSnap.data();
            if (Number(item.cantidad) <= 0) {
                window.Swal.fire('SIN STOCK', 'Esta pieza está agotada.', 'error');
                return;
            }
            // Emitir evento para que ordenes.js capture la pieza
            window.dispatchEvent(new CustomEvent('piezaSeleccionada', { 
                detail: { idx, item: { ...item, id: selectedId } } 
            }));
        }
    };

    window.ajustarStock = async (id, cambio) => {
        const docRef = doc(db, "inventario", id);
        const snap = await getDoc(docRef);
        const data = snap.data();
        const nuevaCantidad = Math.max(0, (Number(data.cantidad) || 0) + cambio);
        await updateDoc(docRef, { cantidad: nuevaCantidad });
    };

    window.eliminarActivo = async (id) => {
        const { isConfirmed } = await window.Swal.fire({
            title: '¿BORRAR REGISTRO?',
            background: '#010409', color: '#fff',
            showCancelButton: true, confirmButtonColor: '#ef4444'
        });
        if(isConfirmed) await deleteDoc(doc(db, "inventario", id));
    };

    renderLayout();
}
