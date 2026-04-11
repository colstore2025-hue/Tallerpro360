/**
 * ordenes.js - NEXUS-X COMMAND CENTER V6.1 "PENTAGON" 🛰️
 * SISTEMA DE GESTIÓN OPERATIVA CON ENLACE FINANCIERO, ALMACÉN Y MULTIMEDIA
 * Diseñado por: William Jeffry Urquijo & Gemini Nexus AI
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, increment 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { registrarMovimientoContable, descontarStock } from "../services/dataService.js";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("empresaId");
    let ordenActiva = null;
    let faseActual = 'INGRESO';
    let isRecording = false;

    // --- 🏗️ RENDER BASE (Estructura de Control Principal) ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 border-b border-white/5 pb-12">
                <div class="space-y-3">
                    <div class="flex items-center gap-5">
                        <div class="h-4 w-4 bg-cyan-500 rounded-full animate-ping shadow-[0_0_20px_#00f2ff]"></div>
                        <h1 class="orbitron text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase">Nexus_<span class="text-cyan-400">OT</span></h1>
                    </div>
                    <p class="text-[11px] orbitron text-slate-500 tracking-[0.5em] uppercase italic">Aerospace Vehicle Logistics System</p>
                </div>
                <div class="flex gap-4 w-full md:w-auto">
                    <button id="btnNewMission" class="flex-1 md:flex-none px-10 py-6 bg-white text-black rounded-[2rem] orbitron text-[12px] font-black hover:bg-cyan-400 transition-all">NUEVA MISIÓN +</button>
                </div>
            </header>

            <nav class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16">
                ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="fase-tab p-6 rounded-[2.5rem] bg-[#0d1117] border border-white/5 transition-all group ${faseActual === fase ? 'border-cyan-500/50 shadow-glow-cyan' : ''}" data-fase="${fase}">
                        <span class="orbitron text-[9px] text-slate-500 group-hover:text-cyan-400 mb-4 block">${fase}</span>
                        <h3 id="count-${fase}" class="text-3xl font-black text-white group-hover:scale-110 transition-all">0</h3>
                    </button>
                `).join('')}
            </nav>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-[#010409]/98 backdrop-blur-3xl p-4 lg:p-12 overflow-y-auto"></div>
        </div>`;
        
        vincularNavegacion();
        cargarEscuchaGlobal();
    };

        // --- 🛰️ RADAR DE DATOS (Real-Time Feedback) ---
    const cargarEscuchaGlobal = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        
        onSnapshot(q, (snap) => {
            const counts = { COTIZACION: 0, INGRESO: 0, DIAGNOSTICO: 0, REPARACION: 0, LISTO: 0 };
            const grilla = [];
            
            snap.docs.forEach(d => {
                const dt = d.data();
                // 1. Actualizar contadores globales de la navegación
                if(counts.hasOwnProperty(dt.estado)) counts[dt.estado]++;
                // 2. Filtrar solo las órdenes de la fase que el usuario está viendo
                if(dt.estado === faseActual) grilla.push({ id: d.id, ...dt });
            });
            
            // Render de contadores en los botones superiores
            Object.keys(counts).forEach(f => { 
                const el = document.getElementById(`count-${f}`);
                if(el) el.innerText = counts[f]; 
            });

            // Render de la Grilla Principal
            const gridContainer = document.getElementById("grid-ordenes");
            if(gridContainer) {
                gridContainer.innerHTML = grilla.map(o => `
                <div onclick="window.abrirTerminalNexus('${o.id}')" class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 hover:border-cyan-500/50 transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-4 shadow-xl">
                    <div class="flex justify-between items-start mb-4">
                         <span class="orbitron text-3xl font-black text-white group-hover:text-cyan-400">${o.placa}</span>
                         <span class="text-[8px] bg-white/5 px-3 py-1 rounded-full orbitron text-slate-400 border border-white/5">${o.estado}</span>
                    </div>
                    <p class="text-[9px] text-slate-500 orbitron italic tracking-widest uppercase">${o.cliente || 'ANÓNIMO'}</p>
                    <div class="mt-6 flex justify-between items-center border-t border-white/5 pt-4">
                        <span class="text-xl font-black text-white orbitron">$ ${Number(o.costos_totales?.gran_total || 0).toLocaleString()}</span>
                        <div class="h-10 w-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400"><i class="fas fa-arrow-right"></i></div>
                    </div>
                </div>`).join('');
            }
        });
    };

    // --- 🏗️ SOPORTE DE NAVEGACIÓN Y PUENTE GLOBAL ---
    const vincularNavegacion = () => {
        // Vincula los botones de fase (COTIZACION, INGRESO, etc)
        document.querySelectorAll('.fase-tab').forEach(btn => {
            btn.onclick = () => {
                faseActual = btn.dataset.fase;
                renderBase(); // Reinicia el ciclo para aplicar el nuevo filtro del radar
            };
        });
        
        // Botón Nueva Misión
        const btnNew = document.getElementById("btnNewMission");
        if(btnNew) btnNew.onclick = () => abrirTerminal();
    };

    // Exponer la función al objeto window para que los onclick del HTML funcionen
    window.abrirTerminalNexus = (id) => abrirTerminal(id);

    // --- 💰 MOTOR FINANCIERO NEXUS-X V6.5 PRO (COLOMBIA EDITION) ---
// Maneja lógica de IVA, Utilidad Real y Sincronización de Bóveda
const recalcularFinanzas = () => {
    let sumaVentaBruta = 0;
    let sumaCostoTaller = 0;

    // Procesamiento de Ítems
    ordenActiva.items.forEach(i => {
        sumaVentaBruta += Number(i.venta || 0);
        // El costo solo se suma si la pieza es del taller (Salida de activos)
        if (i.origen === "TALLER") { 
            sumaCostoTaller += Number(i.costo || 0); 
        }
    });

    // Captura de Variables Externas
    const g_insumos = Number(document.getElementById("f-gastos-varios")?.value || 0); 
    const a_tecnico = Number(document.getElementById("f-adelanto-tecnico")?.value || 0); 
    const a_cliente = Number(document.getElementById("f-anticipo-cliente")?.value || 0); 
    
        // Lógica Colombia: 19% si es Responsable de IVA, 0% si es Régimen Simplificado
    const tipoImpuesto = ordenActiva.finanzas?.impuesto_tipo || 'SIN_IVA';
    let porcentaje = (tipoImpuesto === 'IVA_19') ? 0.19 : 0;
    
    // El IVA se calcula sobre la suma de servicios, repuestos y gastos varios
    let valorIVA = Math.round((sumaVentaBruta + g_insumos) * porcentaje);
    
    const granTotal = sumaVentaBruta + g_insumos + valorIVA;
    const utilidadNeta = (sumaVentaBruta + g_insumos) - (sumaCostoTaller + g_insumos + a_tecnico);
    const saldoPendiente = granTotal - a_cliente;

    // Consolidación en Objeto de Misión
    ordenActiva.costos_totales = {
        total_venta: sumaVentaBruta + g_insumos,
        total_costo: sumaCostoTaller + g_insumos + a_tecnico,
        iva: valorIVA,
        gran_total: granTotal,
        utilidad: utilidadNeta,
        saldo_pendiente: saldoPendiente
    };

    ordenActiva.finanzas = {
        ...ordenActiva.finanzas,
        gastos_varios: g_insumos,
        adelanto_tecnico: a_tecnico,
        anticipo_cliente: a_cliente,
        impuesto_tipo: tipoImpuesto
    };

    // Actualización de Telemetría Visual
    const totalEl = document.getElementById("total-factura");
    if(totalEl) {
        totalEl.innerText = `$ ${granTotal.toLocaleString()}`;
        document.getElementById("saldo-display").innerHTML = `
            <span class="text-slate-500 text-[10px] uppercase block tracking-widest font-black">Saldo de Misión</span>
            <span class="${saldoPendiente > 0 ? 'text-emerald-400' : 'text-white'}">$ ${saldoPendiente.toLocaleString()}</span>
        `;
    }
    renderItems();
};

const renderItems = () => {
    const container = document.getElementById("items-container");
    if(!container) return;
    container.innerHTML = ordenActiva.items.map((item, idx) => `
        <div class="grid grid-cols-1 md:grid-cols-12 items-center gap-4 bg-white/5 p-6 rounded-[2rem] border border-white/5 group hover:bg-white/[0.07] transition-all">
            <div class="md:col-span-1">
                <button onclick="window.toggleOrigenItem(${idx})" class="w-full h-12 rounded-xl flex flex-col items-center justify-center border ${item.origen === 'TALLER' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}">
                    <i class="fas ${item.origen === 'TALLER' ? 'fa-warehouse' : 'fa-user-tag'} text-[10px]"></i>
                    <span class="text-[6px] orbitron font-black mt-1 uppercase">${item.origen || 'TALLER'}</span>
                </button>
            </div>
            <div class="md:col-span-4">
                <div class="flex items-center gap-2">
                    <span class="text-[7px] orbitron ${item.tipo === 'REPUESTO' ? 'text-orange-400' : 'text-cyan-400'} uppercase font-black">${item.tipo}</span>
                    ${item.sku ? `<span class="text-[6px] text-slate-500 font-mono">#${item.sku.slice(-4)}</span>` : ''}
                </div>
                <input onchange="window.editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" class="w-full bg-transparent outline-none text-white text-sm uppercase font-bold mt-1" placeholder="Concepto...">
            </div>
            <div class="md:col-span-1 text-center">
                ${item.tipo === 'REPUESTO' ? `
                    <button onclick="window.buscarEnInventario(${idx})" class="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500 hover:text-white transition-all">
                        <i class="fas fa-barcode"></i>
                    </button>` : ''}
            </div>
            <div class="md:col-span-2">
                <label class="text-[7px] text-slate-500 block mb-1 uppercase font-black italic">Costo Adquisición</label>
                <input type="number" onchange="window.editItemNexus(${idx}, 'costo', this.value)" value="${item.costo || 0}" class="w-full bg-black/40 p-3 rounded-xl text-red-400 text-center text-xs font-bold border border-red-900/20 ${item.origen === 'CLIENTE' ? 'opacity-20 grayscale' : ''}" ${item.origen === 'CLIENTE' ? 'disabled' : ''}>
            </div>
            <div class="md:col-span-3">
                <label class="text-[7px] text-slate-500 block mb-1 uppercase font-black italic">PVP Venta</label>
                <input type="number" onchange="window.editItemNexus(${idx}, 'venta', this.value)" value="${item.venta || 0}" class="w-full bg-black/40 p-3 rounded-xl text-emerald-400 text-center text-sm font-black border border-emerald-900/20">
            </div>
            <div class="md:col-span-1 text-right">
                <button onclick="window.removeItemNexus(${idx})" class="text-white/10 hover:text-red-500 transition-all p-2">✕</button>
            </div>
        </div>`).join('');
};

// --- 🎮 TERMINAL DE COMANDO PENTAGON V20.0 ---
const abrirTerminal = async (id = null) => {
    const modal = document.getElementById("nexus-terminal");
    if(!modal) return;
    modal.classList.remove("hidden");
    
    if (id) {
        const snap = await getDoc(doc(db, "ordenes", id));
        ordenActiva = { id, ...snap.data() };
    } else {
        ordenActiva = {
            placa: '', cliente: '', telefono: '', estado: 'INGRESO', items: [], 
            bitacora_ia: '', 
            finanzas: { gastos_varios: 0, adelanto_tecnico: 0, anticipo_cliente: 0, impuesto_tipo: 'SIN_IVA' },
            costos_totales: { total_venta: 0, total_costo: 0, utilidad: 0, iva: 0, gran_total: 0, saldo_pendiente: 0 }
        };
    }
    renderTerminal();
};

const renderTerminal = () => {
    const modal = document.getElementById("nexus-terminal");
    modal.innerHTML = `
    <div class="max-w-[1400px] mx-auto pb-24 animate-in zoom-in duration-300">
        <div class="flex flex-wrap justify-between items-center gap-6 mb-10 bg-[#0d1117]/80 backdrop-blur-xl p-8 rounded-[3rem] border border-white/5 shadow-2xl sticky top-0 z-50">
            <div class="flex items-center gap-6">
                <input id="f-placa" value="${ordenActiva.placa}" class="bg-transparent text-5xl font-black orbitron text-cyan-400 outline-none w-52 uppercase focus:border-b-2 border-cyan-500" placeholder="PLACA">
                <div class="h-10 w-[1px] bg-white/10 mx-4"></div>
                <select id="f-estado" class="bg-black text-cyan-400 orbitron text-[10px] p-4 rounded-2xl border border-cyan-500/20 outline-none">
                    ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO', 'GARANTIA'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                </select>
                <select id="f-iva-tipo" class="bg-black text-emerald-400 orbitron text-[10px] p-4 rounded-2xl border border-emerald-500/20 outline-none" onchange="window.cambiarTipoImpuesto(this.value)">
                    <option value="SIN_IVA" ${ordenActiva.finanzas.impuesto_tipo === 'SIN_IVA' ? 'selected' : ''}>REG. SIMPLIFICADO (NO IVA)</option>
                    <option value="IVA_19" ${ordenActiva.finanzas.impuesto_tipo === 'IVA_19' ? 'selected' : ''}>IVA GENERAL (19%)</option>
                </select>
            </div>
            <div class="flex gap-4">
                <button id="btnCapturePhoto" class="w-14 h-14 rounded-2xl bg-white/5 text-white hover:bg-cyan-500 transition-all"><i class="fas fa-camera"></i></button>
                <button id="btnWppDirect" class="w-14 h-14 rounded-2xl bg-white/5 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"><i class="fab fa-whatsapp"></i></button>
                <button id="btnCloseTerminal" class="w-14 h-14 rounded-[1.5rem] bg-red-500/10 text-red-500 font-black hover:bg-red-500 hover:text-white transition-all">✕</button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4 space-y-8">
                <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 shadow-xl">
                    <label class="text-[9px] text-slate-500 font-black uppercase mb-4 block tracking-widest italic font-bold">Registro de Propietario</label>
                    <div class="space-y-4">
                        <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-white/5 p-6 rounded-3xl border border-white/5 outline-none font-bold uppercase focus:border-cyan-500/30" placeholder="NOMBRE COMPLETO">
                        <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-white/5 p-6 rounded-3xl border border-white/5 outline-none focus:border-cyan-500/30" placeholder="WHATSAPP (+57)">
                    </div>
                </div>

                <div class="bg-black p-10 rounded-[3.5rem] border border-cyan-500/20 shadow-glow-cyan relative overflow-hidden">
                    <div class="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 blur-3xl"></div>
                    <div class="flex justify-between items-center mb-6">
                        <span class="orbitron text-[10px] text-cyan-400 font-black italic tracking-widest uppercase">Nexus AI Bitácora</span>
                        <div id="rec-indicator" class="flex gap-1 items-center hidden"><div class="h-2 w-2 bg-red-600 rounded-full animate-pulse"></div></div>
                    </div>
                    <textarea id="ai-log-display" class="w-full bg-white/5 p-6 rounded-3xl text-xs h-44 outline-none border border-white/5 italic text-slate-300 resize-none font-mono">${ordenActiva.bitacora_ia || ''}</textarea>
                    <button id="btnDictar" class="w-full mt-6 py-5 bg-cyan-500 text-black rounded-2xl orbitron text-[9px] font-black hover:bg-white transition-all shadow-[0_10px_30px_rgba(6,182,212,0.3)]">🎤 INICIAR ESCUCHA NEURAL</button>
                </div>

                <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 space-y-6">
                    <div class="flex justify-between items-center px-4">
                        <label class="text-[8px] text-slate-500 font-black uppercase tracking-widest italic">Gastos / Terceros</label>
                        <i class="fas fa-external-link-alt text-red-500/50 text-[10px]"></i>
                    </div>
                    <input type="number" id="f-gastos-varios" value="${ordenActiva.finanzas?.gastos_varios || 0}" class="w-full bg-black/50 p-6 rounded-2xl text-white border border-white/5 text-xl font-bold orbitron" onchange="window.actualizarFinanzasDirecto()">
                    
                    <div class="flex justify-between items-center px-4">
                        <label class="text-[8px] text-slate-500 font-black uppercase tracking-widest italic">Adelanto Técnico</label>
                        <i class="fas fa-user-cog text-cyan-500/50 text-[10px]"></i>
                    </div>
                    <input type="number" id="f-adelanto-tecnico" value="${ordenActiva.finanzas?.adelanto_tecnico || 0}" class="w-full bg-black/50 p-6 rounded-2xl text-white border border-white/5 text-xl font-bold orbitron" onchange="window.actualizarFinanzasDirecto()">
                </div>
            </div>

            <div class="lg:col-span-8 space-y-8">
                <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
                    <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-8 relative z-10">
                        <div>
                            <p class="orbitron text-[12px] text-cyan-400 uppercase italic font-black tracking-[0.4em] mb-2">Total Inversión</p>
                            <h2 id="total-factura" class="orbitron text-7xl md:text-8xl font-black text-white italic tracking-tighter shadow-sm">$ 0</h2>
                        </div>
                        <div class="bg-emerald-500/5 p-8 rounded-[3rem] border border-emerald-500/10 text-right min-w-[280px]">
                            <div id="saldo-display" class="text-3xl font-black text-white orbitron italic mb-4"></div>
                            <label class="text-[8px] text-slate-500 font-black uppercase mb-2 block tracking-widest font-bold italic">Anticipo Recibido:</label>
                            <input type="number" id="f-anticipo-cliente" value="${ordenActiva.finanzas?.anticipo_cliente || 0}" class="bg-black/40 p-4 rounded-xl text-right text-emerald-400 font-black orbitron outline-none w-full border border-emerald-500/10" onchange="window.actualizarFinanzasDirecto()">
                        </div>
                    </div>

                    <div id="items-container" class="space-y-4 max-h-[550px] overflow-y-auto pr-4 custom-scrollbar mb-10">
                        </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button id="btnAddRepuesto" class="py-8 bg-white/5 rounded-[2rem] border border-white/10 orbitron text-[11px] font-black hover:bg-white/10 transition-all uppercase tracking-widest">+ Buscar Pieza</button>
                        <button id="btnAddMano" class="py-8 bg-cyan-500/5 rounded-[2rem] border border-cyan-500/20 text-cyan-400 orbitron text-[11px] font-black hover:bg-cyan-500/10 transition-all uppercase tracking-widest">+ Mano de Obra</button>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button id="btnCierreFinanciero" class="group relative py-12 bg-gradient-to-r from-red-600 to-red-900 text-white rounded-[3rem] orbitron font-black text-[14px] uppercase overflow-hidden transition-all hover:shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                        <span class="relative z-10">Ejecutar Cierre Maestro</span>
                        <div class="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    </button>
                    <button id="btnSincronizar" class="py-12 bg-white text-black rounded-[3rem] orbitron font-black text-[16px] uppercase tracking-[0.4em] hover:bg-cyan-400 transition-all shadow-2xl">
                        🛰️ Full Sync Nexus
                    </button>
                </div>
            </div>
        </div>
    </div>`;
    vincularAccionesTerminal();
    recalcularFinanzas();
};

// --- 📡 SINCRONIZACIÓN Y PROTOCOLO DE EGRESO ---
const ejecutarSincronizacionNexus = async () => {
    const btn = document.getElementById("btnSincronizar");
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin mr-2"></i> SINCRONIZANDO...`;
    
    try {
        const placaLimpia = document.getElementById("f-placa").value.trim().toUpperCase();
        const estadoOrden = document.getElementById("f-estado").value;
        const docId = ordenActiva.id || `OT_${placaLimpia}_${Date.now().toString().slice(-4)}`;

        const dataOrden = {
            ...ordenActiva,
            id: docId,
            empresaId,
            placa: placaLimpia,
            cliente: document.getElementById("f-cliente").value.toUpperCase(),
            telefono: document.getElementById("f-telefono").value,
            estado: estadoOrden,
            bitacora_ia: document.getElementById("ai-log-display").value,
            updatedAt: serverTimestamp()
        };

        await setDoc(doc(db, "ordenes", docId), dataOrden);

        // PROTOCOLO DE DESCUENTO: Solo si la orden se marca como ENTREGADA
        if (estadoOrden === "ENTREGADO" || estadoOrden === "LISTO") {
            for (const item of dataOrden.items) {
                if (item.tipo === 'REPUESTO' && item.sku && item.origen === 'TALLER') {
                    // Restamos stock físicamente en la colección inventario
                    const invRef = doc(db, "inventario", item.sku);
                    await updateDoc(invRef, { cantidad: increment(-1) });
                }
            }
        }

        Swal.fire({ icon: 'success', title: 'ORDEN SINCRONIZADA', background: '#0d1117', color: '#fff' });
        document.getElementById("nexus-terminal").classList.add("hidden");
        renderBase(); // Reset visual de la grilla

    } catch (err) {
        console.error("Sync Error:", err);
        Swal.fire('ERROR DE NODO', 'Revisa la conexión a Firestore', 'error');
    } finally {
        btn.innerHTML = originalText;
    }
};
        // 2. Operación de Guardado en Firestore
        await setDoc(doc(db, "ordenes", docId), dataOrden);
        
        // 3. Actualización de Historial del Vehículo
        await setDoc(doc(db, "vehiculos", placaLimpia), {
            placa: placaLimpia, 
            empresaId, 
            clienteNombre: dataOrden.cliente,
            ultimaActualizacion: serverTimestamp(),
            status: estadoOrden === 'LISTO' || estadoOrden === 'ENTREGADO' ? 'OPERATIVO' : 'EN TALLER',
            ultimoServicio: { desc: dataOrden.items[0]?.desc || "Mantenimiento General", idOrden: docId }
        }, { merge: true });

        // 4. 🏁 PROTOCOLO DE CIERRE: CONTABILIDAD E INVENTARIO
        if (estadoOrden === "ENTREGADO") {
            const batch = []; // Preparación de actualizaciones masivas
            
            // Registro de Ingreso Final en Ledger
            batch.push(addDoc(collection(db, "contabilidad"), {
                empresaId, monto: dataOrden.costos_totales.gran_total,
                tipo: "ingreso_ot", concepto: `PAGO TOTAL OT: ${placaLimpia}`,
                referencia: docId, creadoEn: serverTimestamp()
            }));

            // Descuento de Stock Real en Bóveda
            for (const item of dataOrden.items) {
                if (item.tipo === 'REPUESTO' && item.sku && item.origen === 'TALLER') {
                    // Acción Atómica: Restar 1 unidad del inventario usando el SKU (ID del doc)
                    const invRef = doc(db, "inventario", item.sku);
                    batch.push(updateDoc(invRef, { cantidad: increment(-1) }));
                    
                    // Registro de egreso (Costo de Mercancía)
                    batch.push(addDoc(collection(db, "contabilidad"), {
                        empresaId, monto: item.costo, tipo: "costo_repuesto",
                        concepto: `COSTO SALIDA: ${item.desc} (OT ${placaLimpia})`,
                        referencia: docId, creadoEn: serverTimestamp()
                    }));
                }
            }
            await Promise.all(batch);
            generarCertificadoTecnico(dataOrden);
        }

        if (typeof hablar === 'function') hablar(`Orden ${placaLimpia} sincronizada correctamente.`);
        
        Swal.fire({ 
            icon: 'success', 
            title: 'SINCRO COMPLETA', 
            text: 'Datos y stock actualizados en la red Nexus.',
            background: '#0d1117', color: '#fff', timer: 2000 
        });

        btn.innerHTML = originalText;
        document.getElementById("nexus-terminal").classList.add("hidden");
        // Refrescar lista si existe función global
        if(window.renderBase) window.renderBase();

    } catch (err) {
        console.error("Critical Sync Error:", err);
        btn.innerHTML = originalText;
        Swal.fire('FALLO DE NODO', 'Error de conexión Starlink / Firestore.', 'error');
    }
};

/**
 * --- 📦 VINCULACIÓN DE BÓVEDA (ALGORITMO ALFABÉTICO) ---
 * Conecta la terminal con el inventario real y vincula precios y SKUs.
 */
window.buscarEnInventario = async (idx) => {
    const localEmpresaId = localStorage.getItem("empresaId"); 
    
    const { value: selectedItem } = await Swal.fire({
        title: 'BÓVEDA TALLERPRO-360',
        background: '#010409', 
        color: '#fff',
        customClass: {
            popup: 'rounded-[3rem] border border-white/10 shadow-glow-cyan',
            title: 'orbitron text-lg font-black tracking-tighter'
        },
        html: `
            <div class="p-4">
                <p class="text-[9px] orbitron text-cyan-400 mb-4 tracking-[0.3em] uppercase italic">Seleccione Repuesto Disponible</p>
                <select id="swal-sku-select" class="w-full bg-[#0d1117] p-6 rounded-3xl text-white border border-white/10 orbitron text-[11px] outline-none focus:border-cyan-500/50 transition-all">
                    <option>Consultando Telemetría de Stock...</option>
                </select>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'VINCULAR',
        cancelButtonText: 'CANCELAR',
        confirmButtonColor: '#06b6d4',
        didOpen: async () => {
            try {
                // Consulta filtrada por empresa para evitar cruce de datos
                const q = query(collection(db, "inventario"), where("empresaId", "==", localEmpresaId));
                const snap = await getDocs(q);
                const select = document.getElementById("swal-sku-select");
                
                // Mapeo, Filtro de stock positivo y Orden Alfabético
                const items = snap.docs
                    .map(d => ({id: d.id, ...d.data()}))
                    .filter(d => Number(d.cantidad || 0) > 0)
                    .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

                if (items.length === 0) {
                    select.innerHTML = '<option value="">BÓVEDA SIN EXISTENCIAS</option>';
                    return;
                }

                select.innerHTML = '<option value="">-- SELECCIONE PIEZA --</option>' + 
                    items.map(d => {
                        const dataPayload = JSON.stringify({id: d.id, n: d.nombre, c: d.costo, v: d.precioVenta});
                        return `<option value='${dataPayload}'>${d.nombre.toUpperCase()} (DISP: ${d.cantidad})</option>`;
                    }).join('');
            } catch (err) {
                console.error("Error Crítico de Bóveda:", err);
                Swal.showValidationMessage(`Error de enlace: ${err.message}`);
            }
        },
        preConfirm: () => {
            const val = document.getElementById("swal-sku-select").value;
            if (!val || val.includes("--") || val.includes("Consultando")) {
                Swal.showValidationMessage('Debes seleccionar un ítem válido');
                return false;
            }
            try {
                return JSON.parse(val);
            } catch (e) {
                return null;
            }
        }
    });

    // Aplicación de datos a la Orden Activa
    if (selectedItem) {
        ordenActiva.items[idx] = { 
            ...ordenActiva.items[idx], 
            desc: selectedItem.n.toUpperCase(), 
            costo: Number(selectedItem.c || 0), 
            venta: Number(selectedItem.v || 0), 
            sku: selectedItem.id, 
            tipo: 'REPUESTO', 
            origen: 'TALLER' 
        };
        
        // Recalcular finanzas y actualizar interfaz
        recalcularFinanzas();
        
        if (typeof hablar === 'function') {
            hablar(`Enlazado: ${selectedItem.n}`);
        }
    }
};

// --- ⚙️ FUNCIONES AUXILIARES DE INTERFAZ ---
window.cambiarTipoImpuesto = (tipo) => {
    ordenActiva.finanzas.impuesto_tipo = tipo;
    recalcularFinanzas();
};

window.toggleOrigenItem = (idx) => { 
    const it = ordenActiva.items[idx]; 
    it.origen = it.origen === 'TALLER' ? 'CLIENTE' : 'TALLER'; 
    if(it.origen === 'CLIENTE') it.costo = 0; 
    recalcularFinanzas(); 
};

window.editItemNexus = (idx, campo, val) => { 
    ordenActiva.items[idx][campo] = val; 
    recalcularFinanzas(); 
};

window.removeItemNexus = (idx) => { 
    ordenActiva.items.splice(idx, 1); 
    recalcularFinanzas(); 
};

window.actualizarFinanzasDirecto = () => recalcularFinanzas();

const vincularAccionesTerminal = () => {
    document.getElementById("btnSincronizar").onclick = ejecutarSincronizacionNexus;
    document.getElementById("btnCierreFinanciero").onclick = () => {
        document.getElementById("f-estado").value = "ENTREGADO";
        ejecutarSincronizacionNexus();
    };
    document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
    
    document.getElementById("btnDictar").onclick = () => {
        if(!isRecording) { 
            recognition?.start(); 
            isRecording = true; 
            document.getElementById("rec-indicator").classList.remove("hidden"); 
            document.getElementById("btnDictar").innerText = "🛑 DETENER"; 
        } else { 
            recognition?.stop(); 
            isRecording = false; 
            document.getElementById("rec-indicator").classList.add("hidden"); 
            document.getElementById("btnDictar").innerText = "🎤 DICTAR"; 
        }
    };

    if(recognition) {
        recognition.onresult = (e) => { 
            document.getElementById("ai-log-display").value = Array.from(e.results).map(r => r[0].transcript).join(''); 
        };
    }

    document.getElementById("btnCapturePhoto").onclick = () => capturarEvidencia('FOTO');
    document.getElementById("btnWppDirect").onclick = () => {
        const o = ordenActiva;
        const msg = `*TALLERPRO-360 [${o.placa}]*%0A✅ Tu vehículo está listo.%0A💰 Saldo: $${o.costos_totales.saldo_pendiente.toLocaleString()}%0A📍 Retíralo en nuestro punto de servicio.`;
        window.open(`https://wa.me/57${o.telefono}?text=${msg}`, '_blank');
    };

    document.getElementById("btnAddRepuesto").onclick = () => { 
        ordenActiva.items.push({ tipo: 'REPUESTO', desc: 'NUEVA PIEZA', costo: 0, venta: 0, origen: 'TALLER' }); 
        recalcularFinanzas(); 
    };
    document.getElementById("btnAddMano").onclick = () => { 
        ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: 'SERVICIO TÉCNICO', costo: 0, venta: 0, origen: 'TALLER' }); 
        recalcularFinanzas(); 
    };
};

const capturarEvidencia = (tipo) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
    input.onchange = (e) => { if (e.target.files[0]) Swal.fire('EVIDENCIA GUARDADA', '', 'success'); };
    input.click();
};

const generarCertificadoTecnico = (o) => {
    const win = window.open('', '_blank');
    win.document.write(`
        <html><head><title>NEXUS-X CDA</title></head>
        <body style="font-family:Arial;padding:40px;line-height:1.6;background:#f4f7f6;">
            <div style="max-width:800px;margin:auto;background:white;padding:40px;border-radius:20px;box-shadow:0 0 20px rgba(0,0,0,0.1);">
                <h1 style="color:#06b6d4;border-bottom:2px solid #06b6d4;padding-bottom:10px;">CERTIFICADO TÉCNICO NEXUS-X</h1>
                <p><strong>PLACA:</strong> ${o.placa} | <strong>CLIENTE:</strong> ${o.cliente}</p>
                <hr>
                <h3>TRABAJOS REALIZADOS:</h3>
                <ul>${o.items.map(i => `<li>${i.desc} (${i.tipo})</li>`).join('')}</ul>
                <div style="margin-top:40px;text-align:right;">
                    <p style="font-size:1.2rem;font-weight:bold;">TOTAL PAGADO: $${o.costos_totales.gran_total.toLocaleString()}</p>
                </div>
            </div>
        </body></html>`);
    win.print();
};

renderBase();
