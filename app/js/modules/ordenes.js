/**
 * ordenes.js - TallerPRO360 NEXUS-X V30.0 🛰️
 * EDICIÓN MUNDIAL: IA VOICE-DRIVEN & WHATSAPP CLOUD ECOSYSTEM
 * @author William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, onSnapshot, doc, updateDoc, getDoc, 
    setDoc, serverTimestamp, runTransaction 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

// --- MOTORES DE INTELIGENCIA ---
import { diagnosticarProblema } from "../ai/iaMecanica.js";
import { VoiceMechanicAI } from "../ai/voiceMechanicAI.js";
import InventoryAI from "../ai/inventoryAI.js";
import VehicleScanner from "../ai/vehicleScanner.js";

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const voiceAI = new VoiceMechanicAI();
    let unsubscribe = null;
    let ordenActiva = null;

    // --- INTERFAZ BASE (SOLUCIÓN BOTONES 1 Y 2) ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-8 bg-[#010409] min-h-screen text-slate-100 font-sans animate-in fade-in duration-700">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-6 mb-12 border-b border-white/5 pb-10">
                <div class="space-y-2">
                    <div class="flex items-center gap-4">
                        <div class="h-3 w-3 bg-orange-500 rounded-full animate-pulse shadow-[0_0_15px_#f97316]"></div>
                        <h1 class="orbitron text-5xl font-black italic tracking-tighter text-white">NEXUS_<span class="text-orange-500">OT</span></h1>
                    </div>
                    <p class="text-[10px] orbitron text-slate-500 tracking-[0.4em]">SISTEMA DE FUERZA OPERACIONAL V30.0</p>
                </div>
                <div class="flex gap-4">
                    <button id="btnNewCotiza" class="px-6 py-4 border border-white/10 rounded-2xl orbitron text-[10px] font-black hover:bg-white/5 transition-all text-cyan-400">NUEVA COTIZACIÓN</button>
                    <button id="btnNewMission" class="px-10 py-4 bg-orange-600 rounded-2xl orbitron text-[11px] font-black text-black hover:scale-105 transition-all shadow-2xl">INGRESAR VEHÍCULO</button>
                </div>
            </header>

            <nav id="pipeline-nav" class="flex gap-4 mb-12 overflow-x-auto no-scrollbar pb-4">
                ${['COTIZACION', 'INGRESO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="fase-tab flex-1 min-w-[200px] p-8 rounded-[2.5rem] bg-[#0d1117] border border-white/5 transition-all group" data-fase="${fase}">
                        <div class="flex justify-between items-start">
                            <span class="orbitron text-[9px] text-slate-500 group-hover:text-orange-500">${fase}</span>
                        </div>
                        <h3 class="fase-count text-4xl font-black mt-4 text-white">0</h3>
                        <div class="h-1 w-0 bg-orange-500 mt-4 group-hover:w-full transition-all duration-500"></div>
                    </button>
                `).join('')}
            </nav>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-[#010409] p-4 lg:p-10 overflow-y-auto animate-in slide-in-from-bottom-10"></div>
        </div>`;

        vincularNavegacion();
    };

    // --- TERMINAL DE OPERACIONES ---
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
                evidencia: { fotos: [], audio_diagnostico: null }
            };
        }
        renderTerminal();
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1700px] mx-auto space-y-8 pb-20">
            <div class="flex justify-between items-center bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5">
                <div class="flex items-center gap-6">
                    <h2 class="orbitron text-3xl font-black text-orange-500 italic">${ordenActiva.placa || 'NUEVA_MISION'}</h2>
                    <select id="f-estado" class="bg-black text-slate-400 orbitron text-[10px] border border-white/10 p-2 rounded-lg">
                        ${['COTIZACION', 'INGRESO', 'REPARACION', 'LISTO'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                </div>
                <div class="flex gap-3">
                    <button id="btnWhatsApp" class="w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-600 transition-all"><i class="fab fa-whatsapp"></i></button>
                    <button onclick="document.getElementById('nexus-terminal').classList.add('hidden')" class="w-14 h-14 rounded-2xl bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600 transition-all">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div class="lg:col-span-3 space-y-6">
                    <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 space-y-4 shadow-xl">
                        <p class="orbitron text-[9px] text-slate-500">IDENTIDAD VEHICULAR</p>
                        <input id="f-placa" value="${ordenActiva.placa}" class="w-full bg-transparent text-5xl font-black orbitron uppercase focus:text-orange-500 outline-none" placeholder="ABC123">
                        <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-white/5 p-4 rounded-xl text-sm border border-white/5" placeholder="CLIENTE">
                        <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-white/5 p-4 rounded-xl text-sm border border-white/5" placeholder="CELULAR">
                    </div>

                    <div class="bg-orange-600/5 p-8 rounded-[2.5rem] border border-orange-500/20">
                        <p class="orbitron text-[9px] text-orange-500 font-bold mb-4 italic">NEXUS AI SCANNER</p>
                        <div id="preview-scanner" class="aspect-video bg-black/40 rounded-2xl mb-4 border border-dashed border-white/10 flex items-center justify-center text-center p-4 text-[10px] text-slate-500">
                            ${ordenActiva.evidencia.audio_diagnostico || 'SISTEMA LISTO: CAPTURE FOTO O AUDIO'}
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <button id="btnScanFoto" class="p-4 bg-white/5 rounded-xl text-[9px] orbitron border border-white/10 hover:bg-white/10 transition-all">📸 FOTO PIEZA</button>
                            <button id="btnScanVoz" class="p-4 bg-orange-600/20 rounded-xl text-[9px] orbitron border border-orange-500/30 text-orange-500 hover:bg-orange-600 hover:text-black transition-all">🎤 DICTAR SÍNTOMA</button>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-6 space-y-6">
                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative">
                        <div class="flex justify-between items-end mb-10">
                            <div>
                                <p class="orbitron text-[10px] text-emerald-500 mb-2">PRESUPUESTO TOTAL</p>
                                <h2 id="total-final" class="orbitron text-7xl font-black italic">$ 0</h2>
                            </div>
                            <button id="btnVoiceCommand" class="w-16 h-16 bg-cyan-500 text-black rounded-full shadow-[0_0_20px_#06b6d4] hover:scale-110 transition-all"><i class="fas fa-microphone"></i></button>
                        </div>

                        <div id="items-list" class="space-y-4 h-[450px] overflow-y-auto custom-scrollbar pr-4">
                            </div>

                        <div class="mt-8 flex gap-4">
                            <button id="btnAddRepuesto" class="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl orbitron text-[9px] font-black hover:bg-emerald-600/20 hover:text-emerald-500 transition-all">+ REPUESTO</button>
                            <button id="btnAddOro" class="flex-1 py-4 bg-amber-600/10 border border-amber-600/20 text-amber-500 rounded-2xl orbitron text-[9px] font-black">+ MANO OBRA</button>
                            <button id="btnAddGasto" class="flex-1 py-4 bg-red-600/10 border border-red-600/20 text-red-500 rounded-2xl orbitron text-[9px] font-black">+ GASTO IND.</button>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-3 space-y-6">
                    <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                        <p class="orbitron text-[9px] text-slate-500 uppercase tracking-widest">Balance de Misión</p>
                        <div class="space-y-4">
                            <div class="flex justify-between border-b border-white/5 pb-2">
                                <span class="text-xs text-slate-400 italic">Inversión Repuestos:</span>
                                <span id="res-costo" class="font-bold text-white">$ 0</span>
                            </div>
                            <div class="flex justify-between border-b border-white/5 pb-2">
                                <span class="text-xs text-slate-400 italic">Comisión Staff:</span>
                                <span id="res-staff" class="font-bold text-amber-500">$ 0</span>
                            </div>
                            <div class="flex justify-between border-b border-white/5 pb-2">
                                <span class="text-xs text-slate-400 italic">Gastos / Insumos:</span>
                                <span id="res-gastos" class="font-bold text-red-400">$ 0</span>
                            </div>
                            <div class="flex justify-between pt-4">
                                <span class="text-xs font-black orbitron text-emerald-500">UTILIDAD NETA:</span>
                                <span id="res-utilidad" class="font-black text-xl text-emerald-500">$ 0</span>
                            </div>
                        </div>
                    </div>

                    <button id="btnSaveMission" class="w-full py-10 bg-orange-600 rounded-[2.5rem] shadow-[0_20px_50px_rgba(234,88,12,0.3)] text-black orbitron font-black text-sm hover:scale-[1.02] transition-all">
                        SINCRONIZAR MISION <br><span class="text-[9px] opacity-60 italic">GLOBAL NEXUS-X</span>
                    </button>
                </div>
            </div>
        </div>`;

        vincularAccionesTerminal();
        recalcularTotales();
    };

    // --- LÓGICA DE CÁLCULO INDUSTRIAL (PUNTO 1.1) ---
    const recalcularTotales = () => {
        let venta = 0, costo = 0, staff = 0, gastos = 0;

        ordenActiva.items.forEach(it => {
            const pv = Number(it.precio_venta || 0);
            const ct = Number(it.costo_taller || 0);
            const cs = Number(it.comision_staff || 0);

            venta += pv;
            if(it.tipo === 'REPUESTO' && it.origen === 'TALLER') costo += ct;
            if(it.tipo === 'ORO') staff += cs;
            if(it.tipo === 'GASTO_VARIO') gastos += ct;
        });

        const utilidad = venta - costo - staff - gastos;
        ordenActiva.costos_totales = { venta, costo_taller: costo, comision_staff: staff, utilidad, gastos_insumos: gastos };

        document.getElementById("total-final").innerText = `$ ${venta.toLocaleString()}`;
        document.getElementById("res-costo").innerText = `$ ${costo.toLocaleString()}`;
        document.getElementById("res-staff").innerText = `$ ${staff.toLocaleString()}`;
        document.getElementById("res-gastos").innerText = `$ ${gastos.toLocaleString()}`;
        document.getElementById("res-utilidad").innerText = `$ ${utilidad.toLocaleString()}`;

        renderItems();
    };

    const renderItems = () => {
        const list = document.getElementById("items-list");
        list.innerHTML = ordenActiva.items.map((it, idx) => `
            <div class="bg-white/5 p-6 rounded-[2rem] border-l-4 ${it.tipo === 'ORO' ? 'border-amber-500' : it.tipo === 'GASTO_VARIO' ? 'border-red-500' : 'border-emerald-500'} group relative">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                    <div class="col-span-1">
                        <p class="text-[8px] orbitron text-slate-500 mb-1">${it.tipo} / ${it.origen || 'TALLER'}</p>
                        <input onchange="window.editItemNexus(${idx}, 'descripcion', this.value)" value="${it.descripcion}" class="bg-transparent text-sm font-bold text-white w-full border-none outline-none">
                    </div>
                    
                    <div class="text-right">
                        <p class="text-[8px] orbitron text-slate-500 uppercase">Venta Cliente</p>
                        <input type="number" onchange="window.editItemNexus(${idx}, 'precio_venta', this.value)" value="${it.precio_venta}" class="w-full bg-black/40 p-2 rounded-lg text-right font-black text-white text-xs">
                    </div>

                    ${it.tipo === 'ORO' ? `
                    <div class="text-right">
                        <p class="text-[8px] orbitron text-amber-500 uppercase">Comisión Técnico ($)</p>
                        <input type="number" onchange="window.editItemNexus(${idx}, 'comision_staff', this.value)" value="${it.comision_staff || 0}" class="w-full bg-amber-500/10 p-2 rounded-lg text-right font-black text-amber-500 text-xs">
                    </div>
                    ` : `
                    <div class="text-right">
                        <p class="text-[8px] orbitron text-emerald-500 uppercase">Costo Interno</p>
                        <input type="number" onchange="window.editItemNexus(${idx}, 'costo_taller', this.value)" value="${it.costo_taller || 0}" class="w-full bg-emerald-500/10 p-2 rounded-lg text-right font-black text-emerald-500 text-xs">
                    </div>
                    `}

                    <div class="flex justify-end gap-2">
                         <button onclick="window.delItemNexus(${idx})" class="text-red-500 hover:scale-125 transition-all p-2">✕</button>
                    </div>
                </div>
            </div>
        `).join("");
    };

    // --- ACCIONES TÉCNICAS (WHATSAPP, VOZ, STORAGE) ---
    const vincularAccionesTerminal = () => {
        // REPARACIÓN BOTÓN WHATSAPP (PUNTO 3)
        document.getElementById("btnWhatsApp").onclick = () => {
            const { venta, utilidad } = ordenActiva.costos_totales;
            const msj = `*TallerPRO360 - Reporte de Misión*\n\nVehículo: [${ordenActiva.placa}]\nEstado: ${ordenActiva.estado}\nPresupuesto: $${venta.toLocaleString()}\n\nPor favor, confirme su autorización para proceder.`;
            window.open(`https://wa.me/${ordenActiva.telefono}?text=${encodeURIComponent(msj)}`);
        };

        // REPARACIÓN BOTONES AGREGAR (PUNTO 2)
        document.getElementById("btnAddRepuesto").onclick = () => {
            ordenActiva.items.push({ tipo: 'REPUESTO', origen: 'TALLER', descripcion: 'NUEVO REPUESTO', costo_taller: 0, precio_venta: 0 });
            recalcularTotales();
        };
        document.getElementById("btnAddOro").onclick = () => {
            ordenActiva.items.push({ tipo: 'ORO', origen: 'TALLER', descripcion: 'MANO DE OBRA', comision_staff: 0, precio_venta: 0 });
            recalcularTotales();
        };
        document.getElementById("btnAddGasto").onclick = () => {
            ordenActiva.items.push({ tipo: 'GASTO_VARIO', origen: 'TALLER', descripcion: 'INSUMO / TERCEROS', costo_taller: 0, precio_venta: 0 });
            recalcularTotales();
        };

        // SCANNER DE VOZ (PUNTO 2.2)
        document.getElementById("btnScanVoz").onclick = () => {
            voiceAI.start(async (comando, texto) => {
                const diag = await diagnosticarProblema(texto);
                ordenActiva.evidencia.audio_diagnostico = diag;
                document.getElementById("preview-scanner").innerText = `IA DETECTÓ: ${diag}`;
                hablar("Diagnóstico de inteligencia completado.");
            });
        };

        // COMANDO DE VOZ PARA ÍTEMS (NIVEL MUNDIAL)
        document.getElementById("btnVoiceCommand").onclick = () => {
            hablar("¿Qué item desea agregar?");
            voiceAI.start((c, texto) => {
                ordenActiva.items.push({ tipo: 'REPUESTO', origen: 'TALLER', descripcion: texto.toUpperCase(), costo_taller: 0, precio_venta: 0 });
                recalcularTotales();
            });
        };

        // SINCRONIZACIÓN FINAL
        document.getElementById("btnSaveMission").onclick = async () => {
            const btn = document.getElementById("btnSaveMission");
            btn.innerHTML = `SINCRONIZANDO NODO...`;
            
            ordenActiva.placa = document.getElementById("f-placa").value.toUpperCase();
            ordenActiva.cliente = document.getElementById("f-cliente").value;
            ordenActiva.telefono = document.getElementById("f-telefono").value;
            ordenActiva.estado = document.getElementById("f-estado").value;
            ordenActiva.empresaId = empresaId;

            try {
                const docRef = ordenActiva.id ? doc(db, "ordenes", ordenActiva.id) : doc(collection(db, "ordenes"));
                await setDoc(docRef, { ...ordenActiva, updatedAt: serverTimestamp() }, { merge: true });
                
                hablar("Misión guardada con éxito.");
                document.getElementById("nexus-terminal").classList.add("hidden");
            } catch (e) {
                console.error("Firestore Error:", e);
                btn.innerHTML = `FALLA EN FIREBASE`;
            }
        };

        // FUNCIONES GLOBALES PARA ÍTEMS
        window.editItemNexus = (idx, campo, valor) => {
            ordenActiva.items[idx][campo] = valor;
            recalcularTotales();
        };
        window.delItemNexus = (idx) => {
            ordenActiva.items.splice(idx, 1);
            recalcularTotales();
        };
    };

    const vincularNavegacion = () => {
        document.querySelectorAll('.fase-tab').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.fase-tab').forEach(t => t.classList.remove('border-orange-500', 'bg-white/5'));
                tab.classList.add('border-orange-500', 'bg-white/5');
                cargarGrid(tab.dataset.fase);
            };
        });
        
        // REPARACIÓN BOTÓN NUEVA COTIZACIÓN (PUNTO 1)
        document.getElementById("btnNewCotiza").onclick = () => abrirTerminal(null, 'COTIZACION');
        document.getElementById("btnNewMission").onclick = () => abrirTerminal(null, 'INGRESO');
        
        document.querySelector('[data-fase="INGRESO"]').click();
    };

    const cargarGrid = (fase) => {
        if (unsubscribe) unsubscribe();
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", fase));
        
        unsubscribe = onSnapshot(q, (snap) => {
            document.querySelector(`[data-fase="${fase}"] .fase-count`).innerText = snap.size;
            const grid = document.getElementById("grid-ordenes");
            grid.innerHTML = snap.docs.map(ds => {
                const o = ds.data();
                return `
                <div onclick="window.loadOT('${ds.id}')" class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 hover:border-orange-500/50 transition-all cursor-pointer group">
                    <div class="flex justify-between mb-6">
                        <h4 class="orbitron text-2xl font-black group-hover:text-orange-500">${o.placa}</h4>
                        <span class="text-[8px] orbitron bg-white/5 px-2 py-1 rounded-md text-slate-500">${o.estado}</span>
                    </div>
                    <p class="text-xs text-slate-400 mb-6">${o.cliente}</p>
                    <div class="flex justify-between items-center border-t border-white/5 pt-4">
                        <span class="orbitron text-[9px] text-slate-500 italic">BALANCE</span>
                        <span class="font-bold text-white">$ ${(o.costos_totales?.venta || 0).toLocaleString()}</span>
                    </div>
                </div>`;
            }).join("");
        });
        window.loadOT = (id) => abrirTerminal(id);
    };

    renderBase();
}
