/**
 * 🌌 NEXUS-X AERO-LOGISTICS ERP - VAULT STOCK V20.0
 * 🛠️ ARQUITECTURA "TERMINATOR" PRO-2030 
 * 🏗️ SYSTEM: INVENTORY & SUPPLY CHAIN PROTOCOL
 * @author William Jeffry Urquijo Cubillos
 * @identity Nexus-X Starlink Logistics System
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
    let cacheInventario = []; // Optimización de búsqueda local

    /**
     * RENDER_CORE_LAYOUT
     * Interfaz Aeroespacial con estética Dark-Cyber
     */
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
                        VAULT <span class="text-cyan-400 relative">STOCK<span class="absolute -bottom-2 left-0 w-full h-1 bg-cyan-400/20"></span></span><span class="text-slate-700 text-2xl">.V20</span>
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
                    <div class="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                        <i class="fas fa-boxes text-4xl text-white"></i>
                    </div>
                    <p class="text-[9px] text-slate-500 orbitron uppercase mb-4 tracking-widest italic font-bold text-center lg:text-left">Unidades en Almacén</p>
                    <p id="statTotal" class="text-5xl font-black text-white orbitron text-center lg:text-left">0</p>
                    <div class="mt-4 h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div class="h-full bg-cyan-500 w-2/3 shadow-[0_0_15px_#06b6d4]"></div>
                    </div>
                </div>

                <div id="valTotalContainer" class="bg-[#0d1117] border border-white/5 p-10 rounded-[3.5rem] shadow-2xl group hover:border-emerald-500/30 transition-all duration-500 relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                        <i class="fas fa-hand-holding-usd text-4xl text-white"></i>
                    </div>
                    <p class="text-[9px] text-slate-500 orbitron uppercase mb-4 tracking-widest italic font-bold text-center lg:text-left">Valorización (PVP)</p>
                    <p id="statValor" class="text-4xl font-black text-emerald-400 orbitron text-center lg:text-left">$ 0</p>
                    <p class="text-[8px] text-emerald-900 orbitron mt-2 uppercase">Activos Circulantes</p>
                </div>

                <div class="bg-[#0d1117] border border-white/5 p-10 rounded-[3.5rem] shadow-2xl group hover:border-red-500/30 transition-all duration-500 relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                        <i class="fas fa-exclamation-triangle text-4xl text-white"></i>
                    </div>
                    <p class="text-[9px] text-slate-500 orbitron uppercase mb-4 tracking-widest italic font-bold text-center lg:text-left">Déficit Crítico</p>
                    <p id="statAlertas" class="text-5xl font-black text-red-500 orbitron text-center lg:text-left">0</p>
                    <p class="text-[8px] text-red-900 orbitron mt-2 uppercase animate-pulse">Reposición Inmediata</p>
                </div>

                <div class="bg-[#0d1117] border border-white/5 p-10 rounded-[3.5rem] shadow-2xl hidden lg:block relative overflow-hidden">
                    <p class="text-[9px] text-slate-500 orbitron uppercase mb-4 tracking-widest italic font-bold">Estado de Red</p>
                    <div class="flex items-center gap-3">
                        <div class="w-3 h-3 bg-cyan-500 rounded-full animate-ping"></div>
                        <p class="text-xs font-black text-cyan-400 orbitron tracking-tighter">PROTOCOLO_LINK_OK</p>
                    </div>
                    <p class="text-[7px] text-slate-700 orbitron mt-8 uppercase leading-relaxed">Sincronizado con Firebase Sentinel<br>Ubicación: Ibagué Global Node</p>
                </div>
            </div>

            <div class="mb-14 relative group">
                <div class="absolute inset-0 bg-cyan-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <input id="stockSearch" type="text" placeholder="ESCANEAR MEMORIA DEL ALMACÉN..." class="w-full bg-[#0d1117]/50 backdrop-blur-xl p-10 pl-24 rounded-[4rem] border border-white/5 text-white orbitron text-sm focus:border-cyan-500/50 outline-none transition-all shadow-[0_30px_60px_rgba(0,0,0,0.4)] placeholder:text-slate-700">
                <i class="fas fa-fingerprint absolute left-10 top-1/2 -translate-y-1/2 text-cyan-500 text-2xl"></i>
            </div>

            <div id="gridStock" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                </div>

            <button id="btnMainAdd" class="fixed bottom-12 right-12 w-28 h-28 bg-white text-black rounded-[3.5rem] shadow-[0_20px_80px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center z-50 hover:bg-cyan-400 hover:scale-110 active:scale-95 transition-all duration-700 group">
                <i class="fas fa-plus text-3xl mb-1 group-hover:rotate-180 transition-transform duration-700"></i>
                <span class="text-[7px] font-black orbitron uppercase">ADD_ITEM</span>
            </button>
        </div>`;

        // Vinculación de Eventos
        document.getElementById("tabPropio").onclick = () => switchTab("PROPIO");
        document.getElementById("tabCliente").onclick = () => switchTab("CLIENTE");
        document.getElementById("btnMainAdd").onclick = abrirModalCarga;
        document.getElementById("stockSearch").oninput = (e) => filtrarLocalmente(e.target.value);
        
        switchTab("PROPIO");
    };

    /**
     * SWITCH_TAB_LOGIC
     * Alterna entre inventario de taller y piezas de clientes
     */
    const switchTab = (tipo) => {
        filtroActual = tipo;
        escucharStock();
        const btnP = document.getElementById("tabPropio");
        const btnC = document.getElementById("tabCliente");
        const valCont = document.getElementById("valTotalContainer");
        
        const activeClass = "bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.1)] scale-105";
        const inactiveClass = "text-slate-500 hover:text-white hover:bg-white/5";
        
        if(btnP) btnP.className = `flex-1 lg:flex-none px-12 py-5 rounded-[2.5rem] text-[11px] font-black uppercase transition-all duration-500 orbitron ${tipo === 'PROPIO' ? activeClass : inactiveClass}`;
        if(btnC) btnC.className = `flex-1 lg:flex-none px-12 py-5 rounded-[2.5rem] text-[11px] font-black uppercase transition-all duration-500 orbitron ${tipo === 'CLIENTE' ? activeClass : inactiveClass}`;
        
        if(valCont) valCont.style.opacity = tipo === "PROPIO" ? "1" : "0.2";
        if(valCont) valCont.style.filter = tipo === "PROPIO" ? "grayscale(0)" : "grayscale(1)";
    };

    /**
     * FIREBASE_REALTIME_SYNC
     * Mantiene los datos sincronizados sin necesidad de recargar
     */
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
            cacheInventario = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            renderGrid(cacheInventario);
        }, (err) => {
            console.error("Critical Sync Failure:", err);
            // Si falla por falta de índice, ordenamos localmente
            fallbackSync();
        });
    }

    async function fallbackSync() {
        const q = query(collection(db, "inventario"), where("empresaId", "==", empresaId), where("origen", "==", filtroActual));
        const snap = await getDocs(q);
        cacheInventario = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => a.nombre.localeCompare(b.nombre));
        renderGrid(cacheInventario);
    }

    /**
     * RENDER_GRID_DYNAMIC
     * Genera las tarjetas de repuestos con lógica de stock crítico
     */
    const renderGrid = (data) => {
        const grid = document.getElementById("gridStock");
        let totalItems = 0, valorAcumulado = 0, alertas = 0;
        
        if (!grid) return;
        
        if (data.length === 0) {
            grid.innerHTML = `
            <div class="col-span-full py-60 text-center animate-pulse">
                <div class="w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5">
                    <i class="fas fa-microchip text-4xl text-slate-700"></i>
                </div>
                <p class="orbitron text-[10px] tracking-[0.6em] text-slate-600 uppercase italic">Awaiting supply chain data...</p>
            </div>`;
            actualizarEstadisticas(0, 0, 0);
            return;
        }

        grid.innerHTML = data.map(item => {
            const cant = Number(item.cantidad || 0);
            const min = Number(item.minimo || 2);
            const esCritico = cant <= min;
            
            totalItems += cant;
            if (filtroActual === "PROPIO") valorAcumulado += (Number(item.precioVenta || 0) * cant);
            if (esCritico) alertas++;

            const accent = filtroActual === 'PROPIO' ? 'cyan-400' : 'amber-400';
            const borderAccent = esCritico ? 'border-red-500/50' : 'border-white/5';

            return `
            <div class="bg-[#0d1117] p-10 rounded-[4rem] border ${borderAccent} relative group hover:scale-[1.02] transition-all duration-700 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
                <div class="absolute top-0 left-0 w-2 h-full bg-${accent}/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="flex justify-between items-start mb-8">
                    <div class="max-w-[75%]">
                        <span class="text-[8px] text-${accent} font-black uppercase tracking-[0.3em] orbitron italic">UNIT_ID: ${item.id.slice(-6).toUpperCase()}</span>
                        <h3 class="text-white text-xl font-black uppercase truncate group-hover:text-${accent} transition-colors mt-1">${item.nombre}</h3>
                    </div>
                    <button onclick="window.eliminarActivo('${item.id}')" class="w-10 h-10 rounded-full bg-red-500/5 text-slate-800 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-inner">
                        <i class="fas fa-trash-alt text-[10px]"></i>
                    </button>
                </div>

                <div class="grid grid-cols-2 gap-6">
                    <div class="bg-black/40 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
                        <p class="text-[8px] text-slate-500 orbitron mb-2 font-black tracking-widest uppercase text-center">In_Stock</p>
                        <p class="text-4xl font-black ${esCritico ? 'text-red-500 animate-pulse' : 'text-white'} orbitron text-center">${cant}</p>
                    </div>
                    <div class="bg-black/40 p-6 rounded-3xl border border-white/5 backdrop-blur-md flex flex-col justify-center items-center">
                        <p class="text-[8px] text-slate-500 orbitron mb-2 font-black tracking-widest uppercase text-center">${filtroActual === 'PROPIO' ? 'Price_PVP' : 'Link_ID'}</p>
                        <p class="text-[10px] font-black ${filtroActual === 'PROPIO' ? 'text-emerald-400' : 'text-amber-500'} orbitron truncate tracking-tighter">
                            ${filtroActual === 'PROPIO' ? '$'+Number(item.precioVenta || 0).toLocaleString() : (item.placa || 'LOG_ID_ERR')}
                        </p>
                    </div>
                </div>

                <div class="mt-8 flex gap-3">
                     <button onclick="window.ajustarStock('${item.id}', 1)" class="flex-1 py-5 bg-white/5 rounded-2xl border border-white/5 text-[10px] font-black orbitron hover:bg-${accent} hover:text-black transition-all duration-500 uppercase tracking-widest shadow-xl">
                        <i class="fas fa-arrow-up mr-2"></i>In
                     </button>
                     <button onclick="window.ajustarStock('${item.id}', -1)" class="flex-1 py-5 bg-white/5 rounded-2xl border border-white/5 text-[10px] font-black orbitron hover:bg-red-500 hover:text-white transition-all duration-500 uppercase tracking-widest shadow-xl">
                        <i class="fas fa-arrow-down mr-2"></i>Out
                     </button>
                </div>

                ${esCritico ? `<div class="absolute -bottom-2 -right-2 bg-red-500 text-white text-[7px] font-black px-4 py-2 rounded-tl-2xl orbitron tracking-widest animate-bounce">LOW_LEVEL</div>` : ''}
            </div>`;
        }).join("");
        
        actualizarEstadisticas(totalItems, valorAcumulado, alertas);
    };

    /**
     * UI_STATE_MANAGEMENT
     * Actualización de counters globales
     */
    const actualizarEstadisticas = (total, valor, alertas) => {
        const t = document.getElementById("statTotal");
        const v = document.getElementById("statValor");
        const a = document.getElementById("statAlertas");
        if(t) t.innerText = total;
        if(v) v.innerText = `$ ${valor.toLocaleString()}`;
        if(a) a.innerText = alertas;
    };

    /**
     * SEARCH_ALGORITHM
     * Filtrado local ultra-rápido en memoria
     */
    const filtrarLocalmente = (term) => {
        const busqueda = term.toLowerCase();
        const filtrados = cacheInventario.filter(it => 
            it.nombre.toLowerCase().includes(busqueda) || 
            it.id.toLowerCase().includes(busqueda) ||
            (it.placa && it.placa.toLowerCase().includes(busqueda))
        );
        renderGrid(filtrados);
    };

    /**
     * MODAL_TERMINATOR_ADD
     * Interfaz de carga con validaciones de tipo ERP
     */
    async function abrirModalCarga() {
        const isPropio = filtroActual === "PROPIO";
        const { value: f } = await window.Swal.fire({
            title: isPropio ? 'NUEVA ENTRADA BÓVEDA' : 'INGRESO REPUESTO CLIENTE',
            background: '#010409', 
            color: '#fff',
            customClass: { 
                popup: 'rounded-[4rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] backdrop-blur-xl',
                confirmButton: 'bg-white text-black orbitron font-black px-10 py-5 rounded-[2rem] hover:bg-cyan-400 transition-all',
                cancelButton: 'text-slate-500 orbitron font-black hover:text-white transition-all'
            },
            html: `
                <div class="space-y-6 p-6 mt-8 text-left">
                    <div class="relative">
                        <label class="text-[9px] orbitron font-black text-slate-500 ml-6 tracking-[0.2em] uppercase">Designación Técnica</label>
                        <input id="sw-nom" class="w-full bg-[#0d1117] p-8 rounded-[2.5rem] text-white border border-white/5 outline-none focus:border-cyan-500 uppercase font-bold text-sm tracking-tighter" placeholder="EJ: INYECTOR BOSCH V6">
                    </div>
                    <div class="grid grid-cols-2 gap-6">
                        <div>
                            <label class="text-[9px] orbitron font-black text-slate-500 ml-6 tracking-[0.2em] uppercase text-center">Cant. Inicial</label>
                            <input id="sw-can" type="number" class="w-full bg-[#0d1117] p-8 rounded-[2.5rem] text-white border border-white/5 outline-none text-center font-black" value="1">
                        </div>
                        <div>
                            <label class="text-[9px] orbitron font-black text-slate-500 ml-6 tracking-[0.2em] uppercase text-center">${isPropio ? 'Costo Neto' : 'Referencia OT'}</label>
                            <input id="sw-costo" type="${isPropio ? 'number' : 'text'}" class="w-full bg-[#0d1117] p-8 rounded-[2.5rem] text-white border border-white/5 outline-none text-center font-black" placeholder="${isPropio ? '0' : 'ABC-123'}">
                        </div>
                    </div>
                    ${isPropio ? `
                    <div class="grid grid-cols-2 gap-6">
                        <div>
                            <label class="text-[9px] orbitron font-black text-slate-500 ml-6 tracking-[0.2em] uppercase text-center">PVP Venta</label>
                            <input id="sw-venta" type="number" class="w-full bg-[#0d1117] p-8 rounded-[2.5rem] text-white border border-white/5 outline-none text-center font-black text-emerald-400" placeholder="0">
                        </div>
                        <div>
                            <label class="text-[9px] orbitron font-black text-slate-500 ml-6 tracking-[0.2em] uppercase text-center">Min. Alerta</label>
                            <input id="sw-min" type="number" class="w-full bg-[#0d1117] p-8 rounded-[2.5rem] text-white border border-white/5 outline-none text-center font-black text-red-500" value="2">
                        </div>
                    </div>` : ''}
                </div>`,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-save mr-2"></i> COMMITTING_DATA',
            preConfirm: () => {
                const nombre = document.getElementById('sw-nom').value.trim();
                if(!nombre) return window.Swal.showValidationMessage("Designación técnica obligatoria");
                return {
                    nombre: nombre.toUpperCase(),
                    cantidad: Number(document.getElementById('sw-can').value || 0),
                    costo: isPropio ? Number(document.getElementById('sw-costo').value || 0) : 0,
                    precioVenta: isPropio ? Number(document.getElementById('sw-venta').value || 0) : 0,
                    placa: !isPropio ? document.getElementById('sw-costo').value.toUpperCase() : 'NEXUS_INT',
                    minimo: isPropio ? Number(document.getElementById('sw-min').value || 0) : 1,
                    origen: filtroActual,
                    empresaId: empresaId,
                    creadoEn: serverTimestamp()
                }
            }
        });

        if (f) {
            try {
                await addDoc(collection(db, "inventario"), f);
                window.Swal.fire({ 
                    icon: 'success', 
                    title: 'DATOS SINCRONIZADOS', 
                    text: 'El núcleo de inventario ha sido actualizado.',
                    background: '#010409', color: '#fff', timer: 2000,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-[3rem] border border-cyan-500/20' }
                });
            } catch (e) { 
                console.error(e); 
                window.Swal.fire('FAIL', 'Fallo de enlace con el servidor central', 'error'); 
            }
        }
    }

    /**
     * NEXUS_ERP_LINK
     * Función global para vincular repuestos a Órdenes de Trabajo (OT)
     */
    window.buscarEnInventario = async (idx) => {
        try {
            const q = query(
                collection(db, "inventario"), 
                where("empresaId", "==", empresaId), 
                where("origen", "==", "PROPIO")
            );
            
            const snap = await getDocs(q);
            if (snap.empty) {
                return window.Swal.fire({ 
                    title: 'BÓVEDA SIN ACTIVOS', 
                    text: 'Debe cargar piezas en la bóveda del taller primero.',
                    icon: 'warning', background: '#010409', color: '#fff' 
                });
            }

            const items = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

            const options = {};
            items.forEach(it => {
                if(it.cantidad > 0) options[it.id] = `${it.nombre} [STOCK: ${it.cantidad}]`;
            });

            const { value: sid } = await window.Swal.fire({
                title: 'VINCULAR COMPONENTE', 
                background: '#010409', color: '#fff',
                input: 'select', 
                inputOptions: options, 
                showCancelButton: true,
                confirmButtonText: 'ASIGNAR A ORDEN', 
                customClass: { 
                    popup: 'rounded-[4rem] border border-white/10',
                    input: 'bg-[#0d1117] text-white orbitron rounded-2xl p-4'
                }
            });

            if (sid) {
                const isSnap = await getDoc(doc(db, "inventario", sid));
                const item = isSnap.data();
                
                // Disparo de evento global para ordenes.js
                window.dispatchEvent(new CustomEvent('piezaSeleccionada', { 
                    detail: { 
                        idx, 
                        item: { 
                            id: sid, 
                            nombre: item.nombre, 
                            costo: item.costo || 0, 
                            precioVenta: item.precioVenta || 0, 
                            cantidad: item.cantidad 
                        } 
                    } 
                }));
            }
        } catch (err) { 
            console.error("Link Failure:", err); 
        }
    };

    /**
     * STOCK_LEVEL_ADJUSTMENT
     * Modificación manual de niveles de stock
     */
    window.ajustarStock = async (id, cambio) => {
        try {
            const docRef = doc(db, "inventario", id);
            const snap = await getDoc(docRef);
            if (!snap.exists()) return;
            
            const data = snap.data();
            const nuevaCantidad = Math.max(0, (Number(data.cantidad) || 0) + cambio);
            
            await updateDoc(docRef, { cantidad: nuevaCantidad });
            
            // Log de movimiento para futuras auditorías
            console.log(`Stock Ajustado: ${data.nombre} -> ${nuevaCantidad}`);
        } catch (e) {
            console.error("Critical Update Fail:", e);
        }
    };

    /**
     * DATA_TERMINATION
     * Borrado físico del registro en la nube
     */
    window.eliminarActivo = async (id) => {
        const { isConfirmed } = await window.Swal.fire({ 
            title: '¿EJECUTAR ELIMINACIÓN?', 
            text: "Esta acción purgará el registro del núcleo de datos permanentemente.",
            icon: 'warning',
            background: '#010409', color: '#fff', 
            showCancelButton: true, 
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'PURGAR_REGISTRO',
            customClass: { popup: 'rounded-[3rem] border border-red-500/20' }
        });
        
        if(isConfirmed) {
            await deleteDoc(doc(db, "inventario", id));
            window.Swal.fire({ title: 'PURGADO', icon: 'success', background: '#010409', color: '#fff', timer: 1000, showConfirmButton: false });
        }
    };

    // Inicialización del Vórtice de Datos
    renderLayout();
}
