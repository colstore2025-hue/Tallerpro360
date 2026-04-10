/**
 * ordenes.js - NEXUS-X COMMAND CENTER V6.0 "PENTAGON" 🛰️
 * SISTEMA DE GESTIÓN OPERATIVA CON ENLACE FINANCIERO, ALMACÉN Y MULTIMEDIA
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, 
    setDoc, deleteDoc, serverTimestamp, increment 
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

    // --- 🏗️ RENDER BASE ---
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

    // --- 🛰️ CARGA DE DATOS ---
    const cargarEscuchaGlobal = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const counts = { COTIZACION: 0, INGRESO: 0, DIAGNOSTICO: 0, REPARACION: 0, LISTO: 0 };
            const grilla = [];
            snap.docs.forEach(d => {
                const dt = d.data();
                if(counts.hasOwnProperty(dt.estado)) counts[dt.estado]++;
                if(dt.estado === faseActual) grilla.push({ id: d.id, ...dt });
            });
            
            Object.keys(counts).forEach(f => { 
                const el = document.getElementById(`count-${f}`);
                if(el) el.innerText = counts[f]; 
            });

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

        // --- 💰 MOTOR FINANCIERO CORREGIDO (NEXUS-X V6.1) ---
    const recalcularFinanzas = () => {
        let sumaVentaBruta = 0;
        let sumaCostoTaller = 0;

        // Sumar lo que viene de la lista de items (Repuestos y Mano de Obra)
        ordenActiva.items.forEach(i => {
            sumaVentaBruta += Number(i.venta || 0);
            if (i.origen === "TALLER") { sumaCostoTaller += Number(i.costo || 0); }
        });

        // 1. Capturamos los valores de las casillas de la terminal
        const g_insumos = Number(document.getElementById("f-gastos-varios")?.value || 0); // Silicona, terceros, etc.
        const a_tecnico = Number(document.getElementById("f-adelanto-tecnico")?.value || 0); // Nómina (Gasto interno)
        const a_cliente = Number(document.getElementById("f-anticipo-cliente")?.value || 0); // Lo que ya pagó el cliente
        
        // 2. Cálculo de Impuestos (Sobre la venta total + insumos si se cobran)
        let valorIVA = (ordenActiva.finanzas?.impuesto_tipo === 'IVA_19') ? (sumaVentaBruta + g_insumos) * 0.19 : 0;
        
        // 3. GRAN TOTAL (Lo que el cliente ve en factura)
        // Sumamos Insumos aquí porque el cliente debe pagar por el material usado
        const granTotal = sumaVentaBruta + g_insumos + valorIVA;

        // 4. UTILIDAD REAL (Venta - Costos - Insumos - Adelanto Técnico)
        // Aquí sí restamos el adelanto técnico porque sale de tu ganancia
        const utilidadNeta = (sumaVentaBruta + g_insumos) - (sumaCostoTaller + g_insumos + a_tecnico);

        // 5. SALDO DE MISIÓN (Lo que el cliente debe pagar en PAY_NEXUS)
        // Solo restamos lo que el cliente ha abonado.
        const saldoPendiente = granTotal - a_cliente;

        ordenActiva.costos_totales = {
            total_venta: sumaVentaBruta + g_insumos,
            total_costo: sumaCostoTaller + g_insumos + a_tecnico,
            iva: valorIVA,
            gran_total: granTotal,
            utilidad: utilidadNeta,
            saldo_pendiente: saldoPendiente
        };

        // Guardamos los valores en el objeto de finanzas para que persistan
        ordenActiva.finanzas = {
            ...ordenActiva.finanzas,
            gastos_varios: g_insumos,
            adelanto_tecnico: a_tecnico,
            anticipo_cliente: a_cliente
        };

        const totalEl = document.getElementById("total-factura");
        if(totalEl) {
            totalEl.innerText = `$ ${granTotal.toLocaleString()}`;
            document.getElementById("saldo-display").innerHTML = `
                <span class="text-slate-500 text-[10px] uppercase block tracking-widest font-black">Saldo de Misión</span>
                $ ${saldoPendiente.toLocaleString()}
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
                        <i class="fas ${item.origen === 'TALLER' ? 'fa-warehouse' : 'fa-user-tag'} text-xs"></i>
                        <span class="text-[6px] orbitron font-black mt-1">${item.origen || 'TALLER'}</span>
                    </button>
                </div>
                <div class="md:col-span-5">
                    <span class="text-[8px] orbitron ${item.tipo === 'REPUESTO' ? 'text-orange-400' : 'text-cyan-400'} uppercase font-black">${item.tipo}</span>
                    <input onchange="window.editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" class="w-full bg-transparent outline-none text-white text-sm uppercase font-bold mt-1" placeholder="Concepto...">
                </div>
                <div class="md:col-span-2">
                    <label class="text-[7px] text-slate-500 block mb-1 uppercase font-black italic">Costo Interno</label>
                    <input type="number" onchange="window.editItemNexus(${idx}, 'costo', this.value)" value="${item.costo || 0}" class="w-full bg-black/40 p-3 rounded-xl text-red-400 text-center text-xs font-bold border border-red-900/20 ${item.origen === 'CLIENTE' ? 'opacity-20 grayscale' : ''}" ${item.origen === 'CLIENTE' ? 'disabled' : ''}>
                </div>
                <div class="md:col-span-3">
                    <label class="text-[7px] text-slate-500 block mb-1 uppercase font-black italic">PVP Venta</label>
                    <input type="number" onchange="window.editItemNexus(${idx}, 'venta', this.value)" value="${item.venta || 0}" class="w-full bg-black/40 p-3 rounded-xl text-emerald-400 text-center text-sm font-black border border-emerald-900/20">
                </div>
                <div class="md:col-span-1 text-right">
                    <button onclick="window.removeItemNexus(${idx})" class="text-white/20 hover:text-red-500 transition-all p-2">✕</button>
                </div>
            </div>`).join('');
    };

    // --- 🎮 TERMINAL DE COMANDO ---
    const abrirTerminal = async (id = null) => {
        const modal = document.getElementById("nexus-terminal");
        modal.classList.remove("hidden");
        
        if (id) {
            const snap = await getDoc(doc(db, "ordenes", id));
            ordenActiva = { id, ...snap.data() };
        } else {
            ordenActiva = {
                placa: '', cliente: '', telefono: '', estado: 'INGRESO', items: [], 
                bitacora_ia: '', 
                finanzas: { gastos_varios: 0, adelanto_tecnico: 0, anticipo_cliente: 0, impuesto_tipo: 'IVA_19' },
                costos_totales: { total_venta: 0, total_costo: 0, utilidad: 0, iva: 0, gran_total: 0, saldo_pendiente: 0 }
            };
        }
        renderTerminal();
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1400px] mx-auto pb-20 animate-in zoom-in duration-300">
            <div class="flex flex-wrap justify-between items-center gap-6 mb-10 bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                <div class="flex items-center gap-6">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-transparent text-5xl font-black orbitron text-cyan-400 outline-none w-52 uppercase focus:border-b-2 border-cyan-500" placeholder="PLACA">
                    <div class="h-10 w-[1px] bg-white/10 mx-4"></div>
                    <select id="f-estado" class="bg-black text-cyan-400 orbitron text-[10px] p-4 rounded-2xl border border-cyan-500/20 outline-none">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                </div>
                <div class="flex gap-3">
                    <button id="btnCapturePhoto" class="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 hover:bg-cyan-500 hover:text-white transition-all"><i class="fas fa-camera text-xl"></i></button>
                    <button id="btnCaptureVideo" class="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-all"><i class="fas fa-video text-xl"></i></button>
                    <button id="btnWppDirect" class="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"><i class="fab fa-whatsapp text-xl"></i></button>
                    <button id="btnCloseTerminal" class="w-14 h-14 rounded-[1.5rem] bg-white/10 text-white font-black text-2xl hover:bg-white hover:text-black transition-all">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div class="lg:col-span-4 space-y-8">
                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 shadow-xl">
                        <label class="text-[9px] text-slate-500 font-black uppercase mb-4 block tracking-[0.2em]">Expediente del Propietario</label>
                        <div class="space-y-4">
                            <div class="relative">
                                <i class="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                                <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-white/5 p-6 pl-14 rounded-3xl border border-white/5 outline-none font-bold uppercase focus:border-cyan-500/30" placeholder="NOMBRE DEL CLIENTE">
                            </div>
                            <div class="relative">
                                <i class="fas fa-phone absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                                <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-white/5 p-6 pl-14 rounded-3xl border border-white/5 outline-none focus:border-cyan-500/30" placeholder="MÓVIL / WHATSAPP">
                            </div>
                        </div>
                    </div>

                    <div class="bg-black p-10 rounded-[3.5rem] border border-cyan-500/20 shadow-glow-cyan">
                        <div class="flex justify-between items-center mb-6">
                            <span class="orbitron text-[10px] text-cyan-400 font-black italic tracking-widest uppercase">Nexus AI Voice Log</span>
                            <div id="rec-indicator" class="flex gap-1 items-center hidden">
                                <div class="h-2 w-2 bg-red-600 rounded-full animate-pulse"></div>
                                <span class="text-[7px] text-red-500 font-black orbitron">DICTANDO</span>
                            </div>
                        </div>
                        <textarea id="ai-log-display" class="w-full bg-white/5 p-6 rounded-3xl text-xs h-44 outline-none border border-white/5 italic text-slate-300 leading-relaxed resize-none focus:border-cyan-500/50 transition-all custom-scrollbar">${ordenActiva.bitacora_ia || ''}</textarea>
                        <button id="btnDictar" class="w-full mt-6 py-5 bg-cyan-500 text-black rounded-2xl orbitron text-[9px] font-black hover:bg-white transition-all shadow-lg">🎤 INICIAR ESCUCHA NEURAL</button>
                    </div>

                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 space-y-6">
                        <p class="orbitron text-[9px] text-slate-500 font-black text-center mb-4 italic uppercase">Conciliación de Egresos</p>
                        <div>
                            <label class="text-[8px] text-red-400 font-black uppercase mb-2 block tracking-widest">Insumos / Terceros</label>
                            <input type="number" id="f-gastos-varios" value="${ordenActiva.finanzas?.gastos_varios || 0}" class="w-full bg-black/50 p-5 rounded-2xl text-white border border-white/5 text-xl font-bold" onchange="window.actualizarFinanzasDirecto()">
                        </div>
                        <div>
                            <label class="text-[8px] text-red-400 font-black uppercase mb-2 block tracking-widest">Nómina Técnica (Adelantos)</label>
                            <input type="number" id="f-adelanto-tecnico" value="${ordenActiva.finanzas?.adelanto_tecnico || 0}" class="w-full bg-black/50 p-5 rounded-2xl text-white border border-white/5 text-xl font-bold" onchange="window.actualizarFinanzasDirecto()">
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
                        <div class="absolute top-0 right-0 p-8 opacity-5">
                            <i class="fas fa-satellite text-white text-8xl"></i>
                        </div>
                        <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-8 relative z-10">
                            <div>
                                <p class="orbitron text-[12px] text-cyan-400 uppercase italic font-black tracking-[0.3em]">Total de Liquidación</p>
                                <h2 id="total-factura" class="orbitron text-7xl md:text-9xl font-black text-white italic tracking-tighter">$ 0</h2>
                            </div>
                            <div class="bg-emerald-500/5 p-8 rounded-[2.5rem] border border-emerald-500/20 text-right min-w-[250px] shadow-inner">
                                <div id="saldo-display" class="text-3xl font-black text-emerald-400 orbitron italic"></div>
                                <label class="text-[8px] text-slate-500 font-black uppercase mt-2 block italic tracking-tighter">Anticipo recibido:</label>
                                <input type="number" id="f-anticipo-cliente" value="${ordenActiva.finanzas?.anticipo_cliente || 0}" class="bg-transparent text-right text-white font-bold outline-none w-full" onchange="window.actualizarFinanzasDirecto()">
                            </div>
                        </div>

                        <div id="items-container" class="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar"></div>
                        
                        <div class="grid grid-cols-2 gap-6 mt-12">
                            <button id="btnAddRepuesto" class="py-7 bg-white/5 rounded-3xl border border-white/10 orbitron text-[11px] font-black hover:bg-white/10 transition-all">+ AÑADIR PIEZA</button>
                            <button id="btnAddMano" class="py-7 bg-cyan-500/5 rounded-3xl border border-cyan-500/20 text-cyan-400 orbitron text-[11px] font-black hover:bg-cyan-500/10 transition-all">+ MANO DE OBRA</button>
                        </div>
                    </div>

                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button id="btnCierreFinanciero" class="py-10 bg-gradient-to-br from-red-600 to-red-900 text-white rounded-[2.5rem] orbitron font-black text-[12px] uppercase shadow-[0_0_40px_rgba(220,38,38,0.2)] hover:scale-[1.02] transition-transform">
                                <i class="fas fa-bolt mr-3"></i> EJECUTAR CIERRE FINANCIERO
                            </button>
                            
                            <button id="btnSincronizar" class="group relative py-10 bg-white text-black rounded-[2.5rem] orbitron font-black text-[15px] uppercase tracking-[0.3em] overflow-hidden hover:scale-[1.02] transition-transform">
                                <span class="relative z-10">🛰️ SINCRONIZAR NEXUS</span>
                                <div class="absolute inset-0 bg-cyan-400 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    // --- 📱 MOTOR DE COMUNICACIÓN NEXUS-X (CORREGIDO) ---
    const ejecutarProtocoloSalida = async (orden) => {
        // Limpieza de datos para evitar errores en WhatsApp
        const placa = (orden.placa || "").trim().toUpperCase();
        const cliente = (orden.cliente || "CLIENTE").trim().toUpperCase();
        const telefono = (orden.telefono || "").trim().replace(/\s+/g, '');
        const saldo = orden.costos_totales?.saldo_pendiente || 0;
        
        // Link de Bold (Sin ID de orden para evitar el 404 que tenías)
        const linkPago = `https://bold.co/pay/tallerpro360`; 
        
        const mensaje = `*NEXUS-X AEGIS: INFORME DE MISIÓN*%0A%0A` +
                        `Hola *${cliente}*, la misión con el vehículo *[${placa}]* ha finalizado.%0A%0A` +
                        `💰 *Resumen Financiero:*%0A` +
                        `- Total Servicio: $${orden.costos_totales.gran_total.toLocaleString()}%0A` +
                        `- Saldo a Pagar: *$${saldo.toLocaleString()}*%0A%0A` +
                        `✅ *Paga aquí de forma segura:* ${linkPago}%0A%0A` +
                        `_Generado por Nexus-X Command Center_`;

        if(telefono) {
            window.open(`https://wa.me/57${telefono}?text=${mensaje}`, '_blank');
        } else {
            Swal.fire('ERROR', 'No hay teléfono registrado para enviar el informe.', 'error');
        }
    };

    // --- 🔄 SINCRONIZACIÓN TRANSVERSAL ---
    const actualizarEcosistemaNexus = async (data) => {
        try {
            const batch = [];
            // Replicar en Clientes
            const clienteRef = doc(db, "clientes", data.telefono);
            batch.push(setDoc(clienteRef, {
                nombre: data.cliente,
                telefono: data.telefono,
                ultima_placa: data.placa,
                updatedAt: serverTimestamp()
            }, { merge: true }));

            // Replicar en Vehículos
            const vehiculoRef = doc(db, "vehiculos", data.placa);
            batch.push(setDoc(vehiculoRef, {
                placa: data.placa,
                propietario: data.cliente,
                ultima_visita: serverTimestamp()
            }, { merge: true }));

            await Promise.all(batch);
        } catch (e) { console.error("⚠️ Error en replicación cruzada:", e); }
    };

    // --- 📸 PROTOCOLO MULTIMEDIA (EVIDENCIA RÁPIDA) ---
    const capturarEvidencia = (tipo) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = tipo === 'FOTO' ? 'image/*' : 'video/*';
        input.capture = 'environment'; 

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                hablar(`Preparando evidencia de ${tipo.toLowerCase()} para el cliente.`);
                const mensaje = `*EVIDENCIA DE MISIÓN [${ordenActiva.placa}]*:%0ASe adjunta reporte de ${tipo.toLowerCase()} del estado técnico actual.`;
                window.open(`https://wa.me/57${ordenActiva.telefono}?text=${mensaje}`, '_blank');
            }
        };
        input.click();
    };

    const vincularAccionesTerminal = () => {
        document.getElementById("btnCloseTerminal").onclick = () => {
            document.getElementById("nexus-terminal").classList.add("hidden");
            if(isRecording) recognition?.stop();
        };

                // 🛰️ ACCIÓN: SINCRONIZACIÓN STARLINK - PROTOCOLO CIRCULAR V5.0
document.getElementById("btnSincronizar").onclick = async () => {
    const btn = document.getElementById("btnSincronizar");
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-sync fa-spin"></i> ENLAZANDO...`;
    
    try {
        // 1. Identidad y Limpieza
        const placaLimpia = document.getElementById("f-placa").value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const idEmpresaFinal = localStorage.getItem("nexus_empresaId") || empresaId;
        const estadoOrden = document.getElementById("f-estado").value;
        
        // 2. Metadata Técnica
        const marca = document.getElementById("f-marca")?.value.trim().toUpperCase() || "UNIDAD";
        const linea = document.getElementById("f-linea")?.value.trim().toUpperCase() || "";
        const kmActual = Number(document.getElementById("f-km")?.value || 0);
        
        // 3. Cálculos Financieros
        const gastosVarios = Number(document.getElementById("f-gastos-varios").value || 0);
        const anticipoCliente = Number(document.getElementById("f-anticipo-cliente").value || 0);
        const subtotalServicios = (ordenActiva.items || []).reduce((acc, item) => acc + Number(item.precio || 0), 0);
        const totalBruto = subtotalServicios + gastosVarios;
        const saldoFinal = totalBruto - anticipoCliente;

        // 4. DATA ORDEN (Alianza con pagosTaller.js)
        const dataOrden = {
            ...ordenActiva,
            empresaId: idEmpresaFinal,
            placa: placaLimpia,
            cliente: document.getElementById("f-cliente").value.trim().toUpperCase(),
            telefono: document.getElementById("f-telefono").value.trim().replace(/\s+/g, ''),
            estado: estadoOrden,
            bitacora_ia: document.getElementById("ai-log-display").value,
            finanzas: {
                ...ordenActiva.finanzas,
                gastos_varios: gastosVarios,
                anticipo_cliente: anticipoCliente,
            },
            costos_totales: {
                total_servicios: subtotalServicios,
                total_general: totalBruto,
                saldo_pendiente: saldoFinal
            },
            updatedAt: serverTimestamp()
        };

        // --- ⚙️ OPTIMIZACIÓN DE LOGICA CRM Y TRAZABILIDAD ---
const dataVehiculo = {
    placa: placaLimpia,
    empresaId: idEmpresaFinal,
    marca: marca,
    linea: linea,
    modelo: document.getElementById("f-modelo")?.value || "",
    kilometraje: kmActual,
    clienteNombre: dataOrden.cliente,
    ultimaActualizacion: serverTimestamp(),
    
    // 🧠 BITÁCORA PARA CRM (Esto alimenta el historial en vehiculos.js)
    ultimoServicio: {
        descripcion: dataOrden.descripcion || "Mantenimiento General",
        tecnico: dataOrden.tecnico || "S/N",
        fecha: new Date().toISOString(),
        idOrden: docId // Vínculo directo para auditoría
    },
    
    // Status para Radar
    ultima_mision: estadoOrden === 'LISTO' ? 'COMPLETADA' : 'EN PROCESO',
    status: estadoOrden === 'GARANTIA' ? 'RE-INGRESO POR GARANTÍA' : 'OPERATIVO'
};

// 💰 GESTIÓN FINANCIERA (Evita duplicados en contabilidad si es garantía)
let dataFinanciera = null;
if ((estadoOrden === "LISTO" || anticipoCliente > 0) && estadoOrden !== "GARANTIA") {
    dataFinanciera = {
        empresaId: idEmpresaFinal,
        fecha: serverTimestamp(),
        monto: anticipoCliente,
        tipo: "INGRESO_ORDEN",
        referencia: placaLimpia,
        concepto: `Pago OT: ${placaLimpia} - ${marca} ${linea}`
    };
} else if (estadoOrden === "GARANTIA") {
    // Si es garantía, registramos un movimiento de $0 o un gasto de materiales si aplica
    dataFinanciera = {
        empresaId: idEmpresaFinal,
        fecha: serverTimestamp(),
        monto: 0, 
        tipo: "GARANTIA_INTERNA",
        referencia: placaLimpia,
        concepto: `RE-INGRESO SIN COSTO: OT original ${docId}`
    };
}

        // --- EJECUCIÓN ATÓMICA ---
        const docId = ordenActiva.id || `OT_${placaLimpia}_${Date.now().toString().slice(-4)}`;
        const batch = [
            setDoc(doc(db, "ordenes", docId), dataOrden),
            setDoc(doc(db, "vehiculos", placaLimpia), dataVehiculo, { merge: true })
        ];

        // Solo inyectamos a contabilidad si hay dinero real fluyendo
        if (dataFinanciera) {
            const entryId = `ING_${Date.now()}`;
            batch.push(setDoc(doc(db, "contabilidad", entryId), dataFinanciera));
        }

        await Promise.all(batch);

        hablar(`Sincronía total aplicada. Activo ${placaLimpia} actualizado y caja alimentada.`);

        Swal.fire({ 
            icon: 'success', 
            title: 'NEXUS_FULL_SYNC', 
            text: `Ecosistema actualizado: Orden, Radar y Contabilidad.`,
            background: '#0d1117', color: '#fff', timer: 2000, showConfirmButton: false
        });
        
        btn.innerHTML = originalText;

    } catch (err) {
        console.error("⚠️ FALLO DE NODO:", err);
        btn.innerHTML = originalText;
        Swal.fire('ERROR DE SINCRONÍA', 'El ecosistema no pudo cerrarse.', 'error');
    }
};

        // 🎤 LÓGICA DE VOZ
        document.getElementById("btnDictar").onclick = () => {
            if(!isRecording) {
                recognition?.start();
                isRecording = true;
                document.getElementById("rec-indicator").classList.remove("hidden");
                document.getElementById("btnDictar").innerText = "🛑 DETENER ESCUCHA";
            } else {
                recognition?.stop();
                isRecording = false;
                document.getElementById("rec-indicator").classList.add("hidden");
                document.getElementById("btnDictar").innerText = "🎤 INICIAR ESCUCHA NEURAL";
            }
        };

        if(recognition) {
            recognition.onresult = (e) => {
                const text = Array.from(e.results).map(r => r[0].transcript).join('');
                document.getElementById("ai-log-display").value = text;
            };
        }

        // 📸 ACCIONES MULTIMEDIA Y WHATSAPP
        document.getElementById("btnCapturePhoto").onclick = () => capturarEvidencia('FOTO');
        document.getElementById("btnCaptureVideo").onclick = () => capturarEvidencia('VIDEO');
        document.getElementById("btnWppDirect").onclick = () => ejecutarProtocoloSalida(ordenActiva);

        document.getElementById("btnAddRepuesto").onclick = () => { 
            ordenActiva.items.push({ tipo: 'REPUESTO', desc: 'NUEVA PIEZA', costo: 0, venta: 0, origen: 'TALLER' }); 
            recalcularFinanzas(); 
        };
        document.getElementById("btnAddMano").onclick = () => { 
            ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: 'SERVICIO TÉCNICO', costo: 0, venta: 0, origen: 'TALLER' }); 
            recalcularFinanzas(); 
        };
    };

    // --- 🌍 FUNCIONES GLOBALES DE VENTANA ---
    window.toggleOrigenItem = (idx) => {
        const item = ordenActiva.items[idx];
        item.origen = item.origen === 'TALLER' ? 'CLIENTE' : 'TALLER';
        if(item.origen === 'CLIENTE') item.costo = 0;
        recalcularFinanzas();
    };

    window.editItemNexus = (idx, campo, valor) => { 
        ordenActiva.items[idx][campo] = valor; 
        recalcularFinanzas(); 
    };

    window.removeItemNexus = (idx) => { 
        ordenActiva.items.splice(idx, 1); 
        recalcularFinanzas(); 
    };

    window.abrirTerminalNexus = (id) => abrirTerminal(id);
    window.actualizarFinanzasDirecto = () => recalcularFinanzas();

    const vincularNavegacion = () => {
        document.getElementById("btnNewMission").onclick = () => abrirTerminal();
        document.querySelectorAll(".fase-tab").forEach(tab => {
            tab.onclick = () => {
                faseActual = tab.dataset.fase;
                renderBase(); 
            };
        });
    };

    renderBase();
}
