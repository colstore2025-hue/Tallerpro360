/**
 * ordenes.js - NEXUS-X COMMAND CENTER V31.2 🛰️
 * Nivel: Aeroespacial / Automatización Total
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
    collection, query, where, onSnapshot, doc, getDoc, 
    setDoc, serverTimestamp, runTransaction 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

// --- NÚCLEO DE INTELIGENCIA SUPERIOR ---
import WorkshopBrain from "../ai/workshopBrain.js";
import { VoiceMechanicAI } from "../ai/voiceMechanicAI.js";

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const brain = new WorkshopBrain();
    const voiceAI = new VoiceMechanicAI();
    let ordenActiva = null;

    // --- RENDERIZADO DE INTERFAZ DE COMANDO ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans animate-in fade-in duration-1000">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 border-b border-white/5 pb-12">
                <div class="space-y-3">
                    <div class="flex items-center gap-5">
                        <div class="h-4 w-4 bg-orange-500 rounded-full animate-ping shadow-[0_0_20px_#f97316]"></div>
                        <h1 class="orbitron text-6xl font-black italic tracking-tighter text-white">NEXUS_<span class="text-orange-500">OT</span></h1>
                    </div>
                    <p class="text-[11px] orbitron text-slate-500 tracking-[0.5em]">SISTEMA DE FUERZA OPERACIONAL V31.2 · ULTRA</p>
                </div>
                <div class="flex gap-5">
                    <button id="btnNewMission" class="px-12 py-5 bg-orange-600 rounded-[2rem] orbitron text-[12px] font-black text-black hover:scale-105 hover:rotate-1 transition-all shadow-[0_20px_50px_rgba(234,88,12,0.4)]">INGRESAR VEHÍCULO</button>
                </div>
            </header>

            <nav id="pipeline-nav" class="flex gap-6 mb-16 overflow-x-auto no-scrollbar pb-6">
                ${['COTIZACION', 'INGRESO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="fase-tab flex-1 min-w-[250px] p-10 rounded-[3rem] bg-[#0d1117] border border-white/5 transition-all group hover:bg-white/5" data-fase="${fase}">
                        <div class="flex justify-between items-start">
                            <span class="orbitron text-[10px] text-slate-500 group-hover:text-orange-500">${fase}</span>
                            <i class="fas fa-microchip text-slate-800 group-hover:text-orange-500/30 transition-all"></i>
                        </div>
                        <h3 id="count-${fase}" class="fase-count text-5xl font-black mt-6 text-white group-hover:scale-110 transition-all">0</h3>
                        <div class="h-1.5 w-0 bg-orange-500 mt-6 group-hover:w-full transition-all duration-700 shadow-[0_0_15px_#f97316]"></div>
                    </button>
                `).join('')}
            </nav>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-[#010409]/95 backdrop-blur-xl p-4 lg:p-12 overflow-y-auto"></div>
        </div>`;

        vincularNavegacion();
        cargarGrid();
    };

    const abrirTerminal = async (id = null, faseDefault = 'INGRESO') => {
        const modal = document.getElementById("nexus-terminal");
        modal.classList.remove("hidden");
        
        if (id) {
            const snap = await getDoc(doc(db, "ordenes", id));
            ordenActiva = { id, ...snap.data() };
        } else {
            ordenActiva = {
                placa: '', cliente: '', telefono: '', estado: faseDefault,
                items: [], 
                costos_totales: { venta: 0, costo_taller: 0, comision_staff: 0, utilidad: 0 },
                evidencia: { audio_diagnostico: null }
            };
        }
        renderTerminal();
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1700px] mx-auto space-y-10">
            <div class="flex justify-between items-center bg-[#0d1117] p-8 rounded-[3rem] border border-white/10 shadow-2xl">
                <div class="flex items-center gap-8">
                    <div class="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20">
                        <h2 class="orbitron text-4xl font-black text-orange-500 italic leading-none">${ordenActiva.placa || 'NUEVA_MISION'}</h2>
                    </div>
                    <select id="f-estado" class="bg-black text-slate-300 orbitron text-[11px] border border-white/10 p-4 rounded-2xl outline-none focus:border-orange-500 transition-all">
                        ${['COTIZACION', 'INGRESO', 'REPARACION', 'LISTO'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                </div>
                <div class="flex gap-4">
                    <button id="btnImprimir" class="w-16 h-16 rounded-3xl bg-cyan-600/10 text-cyan-500 border border-cyan-500/20 hover:bg-cyan-600 hover:text-black transition-all shadow-lg"><i class="fas fa-print"></i></button>
                    <button onclick="document.getElementById('nexus-terminal').classList.add('hidden')" class="w-16 h-16 rounded-3xl bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white transition-all">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div class="lg:col-span-3 space-y-8">
                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 space-y-6 shadow-2xl">
                        <p class="orbitron text-[10px] text-slate-500 tracking-widest uppercase">Identidad Vehicular</p>
                        <input id="f-placa" value="${ordenActiva.placa}" class="w-full bg-transparent text-6xl font-black orbitron uppercase focus:text-orange-500 outline-none transition-all" placeholder="ABC123">
                        <div class="space-y-4">
                            <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-white/5 p-5 rounded-2xl text-sm border border-white/5 outline-none focus:border-orange-500/50" placeholder="NOMBRE DEL CLIENTE">
                            <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-white/5 p-5 rounded-2xl text-sm border border-white/5 outline-none focus:border-orange-500/50" placeholder="WHATSAPP (+57)">
                        </div>
                    </div>

                    <div class="bg-orange-600/5 p-10 rounded-[3.5rem] border border-orange-500/20 relative overflow-hidden group">
                        <div class="absolute -right-10 -top-10 text-orange-500/5 text-9xl rotate-12"><i class="fas fa-brain"></i></div>
                        <p class="orbitron text-[10px] text-orange-500 font-bold mb-6 italic tracking-widest">NEXUS AI · DOCTOR MODE</p>
                        <div id="preview-scanner" class="aspect-video bg-black/60 rounded-3xl mb-6 border border-dashed border-white/10 flex items-center justify-center overflow-hidden text-center p-6 text-[11px] text-slate-400 italic">
                             SISTEMA LISTO PARA DIAGNÓSTICO POR VOZ
                        </div>
                        <div class="grid grid-cols-1 gap-3">
                            <button id="btnScanVoz" class="w-full py-5 bg-orange-600 text-black rounded-2xl orbitron text-[11px] font-black hover:scale-[1.02] transition-all shadow-xl">🎤 DICTAR SÍNTOMA (IA)</button>
                            <button id="btnScanFoto" class="w-full py-4 bg-white/5 text-slate-400 rounded-2xl orbitron text-[9px] font-bold border border-white/10 hover:bg-white/10 transition-all">📸 CAPTURAR EVIDENCIA</button>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-6 space-y-8">
                    <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative">
                        <div class="flex justify-between items-end mb-12">
                            <div>
                                <p class="orbitron text-[12px] text-emerald-500 mb-3 font-bold tracking-widest">PRESUPUESTO GLOBAL</p>
                                <h2 id="total-final" class="orbitron text-8xl font-black italic text-white tracking-tighter">$ 0</h2>
                            </div>
                        </div>
                        <div id="items-list" class="space-y-5 h-[500px] overflow-y-auto pr-6 custom-scrollbar"></div>
                        <div class="mt-10 flex gap-5">
                            <button id="btnAddRepuesto" class="flex-1 py-5 bg-white/5 border border-white/10 rounded-3xl orbitron text-[10px] font-black hover:bg-emerald-600/20 hover:text-emerald-500 hover:border-emerald-500/30 transition-all">+ REPUESTO</button>
                            <button id="btnAddOro" class="flex-1 py-5 bg-amber-600/5 border border-amber-600/20 text-amber-500 rounded-3xl orbitron text-[10px] font-black hover:bg-amber-600 hover:text-black transition-all">+ MANO DE OBRA</button>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-3 space-y-8">
                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 space-y-8 shadow-2xl">
                        <p class="orbitron text-[10px] text-slate-500 uppercase tracking-widest italic">Análisis de Rentabilidad</p>
                        <div id="balance-results" class="space-y-6">
                            </div>
                    </div>
                    <button id="btnSaveMission" class="group w-full py-12 bg-orange-600 rounded-[3.5rem] text-black orbitron font-black text-sm hover:scale-[1.02] transition-all shadow-[0_25px_60px_rgba(234,88,12,0.4)] relative overflow-hidden">
                        <span class="relative z-10">SINCRONIZAR MISIÓN <br><span class="text-[10px] opacity-70 italic tracking-widest">ECOSISTEMA GLOBAL NEXUS-X</span></span>
                        <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    </button>
                </div>
            </div>
        </div>`;

        vincularAccionesTerminal();
        recalcularTotales();
    };

    const recalcularTotales = () => {
        let tVenta = 0, tCosto = 0, tStaff = 0;
        ordenActiva.items.forEach(item => {
            tVenta += Number(item.precio_venta || 0);
            tCosto += Number(item.costo_taller || 0);
            tStaff += Number(item.comision_staff || 0);
        });

        ordenActiva.costos_totales = {
            venta: tVenta,
            costo_taller: tCosto,
            comision_staff: tStaff,
            utilidad: tVenta - tCosto - tStaff
        };

        document.getElementById("total-final").innerText = `$ ${tVenta.toLocaleString()}`;
        document.getElementById("balance-results").innerHTML = `
            <div class="flex justify-between items-center text-slate-400">
                <span class="text-xs italic">Costo Insumos:</span>
                <span class="font-bold text-white">$ ${tCosto.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center text-slate-400">
                <span class="text-xs italic">Comisión Staff:</span>
                <span class="font-bold text-amber-500">$ ${tStaff.toLocaleString()}</span>
            </div>
            <div class="pt-6 border-t border-white/5">
                <div class="flex justify-between items-center">
                    <span class="orbitron text-[10px] font-black text-emerald-500">UTILIDAD NETA:</span>
                    <span class="orbitron text-2xl font-black text-emerald-500">$ ${ordenActiva.costos_totales.utilidad.toLocaleString()}</span>
                </div>
                <div class="h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                    <div class="h-full bg-emerald-500" style="width: ${tVenta > 0 ? (ordenActiva.costos_totales.utilidad/tVenta)*100 : 0}%"></div>
                </div>
            </div>
        `;
        renderItems();
    };

    const renderItems = () => {
        const list = document.getElementById("items-list");
        list.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="group bg-white/5 p-6 rounded-[2rem] border border-white/5 flex flex-wrap gap-5 items-center hover:bg-white/[0.08] transition-all">
                <div class="flex-1 min-w-[200px]">
                    <span class="text-[9px] orbitron text-orange-500/70 font-bold mb-2 block tracking-widest">${item.tipo}</span>
                    <input onchange="editItemNexus(${idx}, 'descripcion', this.value)" value="${item.descripcion}" 
                           class="w-full bg-transparent outline-none text-sm font-bold text-white focus:text-orange-500 transition-all uppercase">
                </div>
                <div class="flex gap-4">
                    <div class="text-center">
                        <span class="text-[8px] text-slate-500 orbitron block mb-1">COSTO/COM</span>
                        <input type="number" onchange="editItemNexus(${idx}, '${item.tipo === 'ORO' ? 'comision_staff' : 'costo_taller'}', this.value)" 
                               value="${item.tipo === 'ORO' ? item.comision_staff : item.costo_taller}" 
                               class="w-24 bg-black/40 p-3 rounded-xl text-[11px] text-red-400 text-center border border-white/5 outline-none focus:border-red-500/50 font-bold">
                    </div>
                    <div class="text-center">
                        <span class="text-[8px] text-slate-500 orbitron block mb-1">PRECIO VENTA</span>
                        <input type="number" onchange="editItemNexus(${idx}, 'precio_venta', this.value)" 
                               value="${item.precio_venta}" 
                               class="w-32 bg-black/40 p-3 rounded-xl text-sm text-emerald-500 text-center border border-emerald-500/20 outline-none focus:border-emerald-500 font-black">
                    </div>
                </div>
                <button onclick="delItemNexus(${idx})" class="w-12 h-12 rounded-2xl bg-red-600/5 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-lg">✕</button>
            </div>
        `).join('');
    };

    const vincularAccionesTerminal = () => {
        // --- MOTOR IA: DIAGNÓSTICO POR VOZ (BRAIN INTEGRATION) ---
        // ... dentro de vincularAccionesTerminal en ordenes.js ...

document.getElementById("btnScanVoz").onclick = async () => {
    const display = document.getElementById("preview-scanner");
    display.innerText = "🛰️ ESCUCHANDO NÚCLEO...";
    hablar("William, describe el síntoma.");

    try {
        const sintoma = await voiceAI.listen();
        
        // 1. Ejecutar el Escáner Técnico primero (Detección de patrones)
        const scanner = new VehicleScanner();
        const hallazgosTecnicos = scanner.scanVehicle({}, [sintoma]); 

        // 2. Ejecutar el WorkshopBrain para repuestos
        const diagnosticoIA = await brain.runDiagnosis({
            problem: sintoma,
            placa: document.getElementById("f-placa").value
        });

        // 3. Renderizar Hallazgos en la Terminal
        let htmlHallazgos = hallazgosTecnicos.map(h => 
            `<div class="flex items-center gap-2 ${h.gravedad === 'alta' ? 'text-red-500' : 'text-orange-400'} font-bold">
                ${h.icon} <span>${h.problema}</span>
            </div>`
        ).join('');

        display.innerHTML = `
            <div class="text-left space-y-2">
                <div class="text-white border-b border-white/10 pb-2 mb-2 font-black">HALLAZGOS TÉCNICOS:</div>
                ${htmlHallazgos || '<p class="text-slate-500">Sin fallos críticos detectados</p>'}
                <div class="text-orange-500 text-[10px] mt-4 uppercase font-black">Resumen IA:</div>
                <p class="text-[11px] text-slate-300">${diagnosticoIA.diagnosis}</p>
            </div>
        `;

        hablar(`Escaneo finalizado. Detecté ${hallazgosTecnicos.length} posibles fallas.`);
        
        // Auto-llenado de repuestos (opcional)
        diagnosticoIA.partsNeeded.forEach(part => {
            ordenActiva.items.push({ tipo: 'REPUESTO', descripcion: part.toUpperCase(), costo_taller: 0, precio_venta: 0 });
        });
        recalcularTotales();

    } catch (e) {
        display.innerText = "ERROR EN VÍNCULO NEURAL";
    }
};

        document.getElementById("btnAddRepuesto").onclick = () => {
            ordenActiva.items.push({ tipo: 'REPUESTO', descripcion: 'NUEVO REPUESTO', costo_taller: 0, precio_venta: 0 });
            recalcularTotales();
        };

        document.getElementById("btnAddOro").onclick = () => {
            ordenActiva.items.push({ tipo: 'ORO', descripcion: 'MANO DE OBRA ESPECIALIZADA', comision_staff: 0, precio_venta: 0 });
            recalcularTotales();
        };

        // --- SINCRONIZACIÓN ATÓMICA GLOBAL (TRIGGER SYSTEM) ---
        document.getElementById("btnSaveMission").onclick = async () => {
            const btn = document.getElementById("btnSaveMission");
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `<i class="fas fa-sync fa-spin"></i> DESPLEGANDO TRANSACCIÓN...`;
            
            const placa = document.getElementById("f-placa").value.toUpperCase();
            if(!placa) { hablar("William, la placa es el identificador de misión obligatorio."); btn.innerHTML = originalHTML; return; }

            const missionData = {
                placa,
                cliente: document.getElementById("f-cliente").value || "CLIENTE GENERAL",
                telefono: document.getElementById("f-telefono").value || "",
                estado: document.getElementById("f-estado").value,
                empresaId,
                items: ordenActiva.items,
                costos_totales: ordenActiva.costos_totales,
                updatedAt: serverTimestamp()
            };

            try {
                // TRANSACCIÓN GLOBAL: OT + CONTABILIDAD + NÓMINA
                await runTransaction(db, async (transaction) => {
                    const otRef = ordenActiva.id ? doc(db, "ordenes", ordenActiva.id) : doc(collection(db, "ordenes"));
                    transaction.set(otRef, missionData);

                    // 1. Trigger Contabilidad (Finanzas.js)
                    const contRef = doc(db, "contabilidad", `MOV_${Date.now()}_${placa}`);
                    transaction.set(contRef, {
                        tipo: 'ORDEN_TRABAJO',
                        monto: missionData.costos_totales.venta,
                        utilidad: missionData.costos_totales.utilidad,
                        referencia: placa,
                        empresaId,
                        timestamp: serverTimestamp()
                    });

                    // 2. Trigger Nómina (Staff.js)
                    missionData.items.filter(i => i.tipo === 'ORO').forEach((item, idx) => {
                        const staffRef = doc(db, "nominas", `COM_${placa}_${idx}`);
                        transaction.set(staffRef, {
                            mecanico: "TECNICO_LIDER", // Enlazable a staffId
                            monto: item.comision_staff,
                            ot: placa,
                            empresaId,
                            status: 'PROCESADO'
                        });
                    });
                });

                hablar("Misión sincronizada. Ecosistema Nexus X actualizado.");
                document.getElementById("nexus-terminal").classList.add("hidden");
            } catch (e) {
                console.error(e);
                btn.innerHTML = "FALLO DE DESPLIEGUE";
                hablar("Error de persistencia en el núcleo de datos.");
            }
        };

        window.editItemNexus = (idx, campo, valor) => { ordenActiva.items[idx][campo] = valor; recalcularTotales(); };
        window.delItemNexus = (idx) => { ordenActiva.items.splice(idx, 1); recalcularTotales(); };
    };

    const vincularNavegacion = () => {
        document.getElementById("btnNewMission").onclick = () => abrirTerminal();
        document.querySelectorAll(".fase-tab").forEach(tab => {
            tab.onclick = () => cargarGrid(tab.dataset.fase);
        });
    };

    const cargarGrid = (fase = 'INGRESO') => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", fase));
        onSnapshot(q, (snap) => {
            const grid = document.getElementById("grid-ordenes");
            grid.innerHTML = snap.docs.map(d => {
                const data = d.data();
                return `
                <div onclick="abrirTerminalNexus('${d.id}')" class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 hover:border-orange-500/50 hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden">
                    <div class="absolute -right-4 -top-4 text-orange-500/5 text-8xl group-hover:text-orange-500/10 transition-all"><i class="fas fa-car"></i></div>
                    <div class="relative z-10">
                        <div class="flex justify-between mb-6">
                            <span class="orbitron text-3xl font-black text-white group-hover:text-orange-500 transition-all">${data.placa}</span>
                            <span class="bg-orange-500/10 text-orange-500 text-[8px] orbitron px-3 py-1 rounded-full border border-orange-500/20">${data.estado}</span>
                        </div>
                        <p class="text-xs text-slate-400 mb-6 font-bold uppercase tracking-widest">${data.cliente}</p>
                        <div class="flex justify-between items-end">
                            <span class="text-[9px] orbitron text-slate-600">PRESUPUESTO</span>
                            <span class="text-2xl font-black text-emerald-500">$ ${data.costos_totales?.venta.toLocaleString() || 0}</span>
                        </div>
                    </div>
                </div>`;
            }).join('');
            document.getElementById(`count-${fase}`).innerText = snap.size;
        });
    };

    window.abrirTerminalNexus = (id) => abrirTerminal(id);
    renderBase();
}
