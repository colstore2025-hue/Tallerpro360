/**
 * ordenes.js - NEXUS-X COMMAND CENTER V8.0 "PRO-EVO" 🛰️
 * MISIÓN: AUTOMATIZACIÓN TOTAL TALLERPRO360
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, updateDoc, serverTimestamp, increment 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    let ordenActiva = null;
    let faseActual = 'INGRESO';
    let isRecording = false;

    // --- 🖥️ RENDER CORE UI ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32 selection:bg-cyan-500 selection:text-black">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 border-b border-white/10 pb-12">
                <div class="space-y-3">
                    <div class="flex items-center gap-5">
                        <div class="h-5 w-5 bg-red-600 rounded-full animate-pulse shadow-[0_0_25px_#ff0000]"></div>
                        <h1 class="orbitron text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase leading-none">NEXUS_<span class="text-cyan-400">V8</span></h1>
                    </div>
                    <p class="text-[12px] orbitron text-cyan-500/70 tracking-[0.6em] uppercase italic font-bold">Logistics Neural Interface // TALLER-PRO-EVO</p>
                </div>
                <button id="btnNewMission" class="group relative px-12 py-7 bg-cyan-500 text-black rounded-full orbitron text-sm font-black hover:bg-white hover:scale-110 transition-all duration-500 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                    <span class="relative z-10">INICIAR MISIÓN +</span>
                </button>
            </header>

            <nav class="grid grid-cols-2 md:grid-cols-5 gap-5 mb-16">
                ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(fase => `
                    <button class="fase-tab relative overflow-hidden p-8 rounded-[2.5rem] bg-[#0d1117] border-2 ${faseActual === fase ? 'border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.2)]' : 'border-white/5'} transition-all group" data-fase="${fase}">
                        <span class="orbitron text-[10px] ${faseActual === fase ? 'text-cyan-400' : 'text-slate-500'} group-hover:text-cyan-400 mb-3 block font-black tracking-widest">${fase}</span>
                        <h3 id="count-${fase}" class="text-5xl font-black text-white group-hover:scale-110 transition-all">0</h3>
                    </button>
                `).join('')}
            </nav>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl p-4 lg:p-12 overflow-y-auto border-4 border-cyan-500/20 m-2 rounded-[3rem]"></div>
        </div>`;
        
        vincularNavegacion();
        cargarEscuchaGlobal();
    };

    // --- 📡 REAL-TIME ENGINE ---
    const cargarEscuchaGlobal = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const counts = { COTIZACION: 0, INGRESO: 0, DIAGNOSTICO: 0, REPARACION: 0, LISTO: 0, ENTREGADO: 0 };
            const grilla = [];
            snap.docs.forEach(d => {
                const dt = d.data();
                if(counts.hasOwnProperty(dt.estado)) counts[dt.estado]++;
                if(dt.estado === faseActual) grilla.push({ id: d.id, ...dt });
            });
            
            Object.keys(counts).forEach(f => { if(document.getElementById(`count-${f}`)) document.getElementById(`count-${f}`).innerText = counts[f]; });

            const gridContainer = document.getElementById("grid-ordenes");
            if(gridContainer) {
                gridContainer.innerHTML = grilla.map(o => `
                <div onclick="window.abrirTerminalNexus('${o.id}')" class="bg-[#0d1117] p-10 rounded-[3.5rem] border-2 border-white/5 hover:border-cyan-400 transition-all cursor-pointer group animate-in zoom-in relative overflow-hidden">
                    <div class="flex justify-between items-center mb-6">
                         <span class="orbitron text-4xl font-black text-white group-hover:text-cyan-400 tracking-tighter">${o.placa}</span>
                         <div class="h-3 w-3 rounded-full ${o.estado === 'LISTO' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-cyan-500 shadow-[0_0_15px_#06b6d4]'}"></div>
                    </div>
                    <p class="text-[11px] text-cyan-500/50 orbitron font-black uppercase mb-8">${o.cliente || 'NO_NAME'}</p>
                    <div class="flex justify-between items-end border-t border-white/10 pt-6">
                        <div>
                            <span class="text-[10px] text-slate-500 block uppercase mb-1 font-bold">Total Misión</span>
                            <span class="text-2xl font-black text-white orbitron">$ ${Number(o.costos_totales?.gran_total || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>`).join('');
            }
        });
    };

    // --- 🧮 AUDITORÍA FINANCIERA FORENSE V8.0 ---
    const recalcularFinanzas = () => {
        let subtotalConIVA = 0;
        let costoTotalTaller = 0;

        ordenActiva.items.forEach(i => {
            const valorVenta = Number(i.venta || 0);
            subtotalConIVA += valorVenta;
            if (i.origen === "TALLER") costoTotalTaller += Number(i.costo || 0);
        });

        // Captura de Inputs
        const g_insumos = Number(document.getElementById("f-gastos-varios")?.value || 0); 
        const pago_tecnico = Number(document.getElementById("f-adelanto-tecnico")?.value || 0); 
        const anticipo = Number(document.getElementById("f-anticipo-cliente")?.value || 0); 
        
        // Lógica Fiscal: El valor ingresado ya tiene el 19%
        const granTotal = subtotalConIVA; // Gastos varios no se cobran al cliente según auditoría
        const baseGravable = granTotal / 1.19;
        const totalIVA = granTotal - baseGravable;

        // Utilidad: (Venta - IVA) - (Costo + Pago Técnico + Gastos Varios)
        const utilidadNeta = baseGravable - (costoTotalTaller + pago_tecnico + g_insumos);
        const saldoPendiente = granTotal - anticipo;

        ordenActiva.costos_totales = {
            base_gravable: baseGravable,
            iva_19: totalIVA,
            gran_total: granTotal,
            utilidad: utilidadNeta,
            saldo_pendiente: saldoPendiente,
            adelanto_tecnico: pago_tecnico,
            gastos_operativos: g_insumos
        };

        const totalEl = document.getElementById("total-factura");
        if(totalEl) {
            totalEl.innerText = `$ ${granTotal.toLocaleString()}`;
            document.getElementById("saldo-display").innerHTML = `
                <span class="text-cyan-500/50 text-[10px] uppercase block tracking-widest font-black mb-1">Saldo a Pagar</span>
                <span class="${saldoPendiente > 0 ? 'text-red-500' : 'text-emerald-400'} animate-pulse">$ ${saldoPendiente.toLocaleString()}</span>
            `;
        }
        renderItems();
    };

    // --- 🛠️ ITEM MANAGEMENT (UI AVANZADA) ---
    const renderItems = () => {
        const containerItems = document.getElementById("items-container");
        if(!containerItems) return;
        containerItems.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="grid grid-cols-1 md:grid-cols-12 items-center gap-4 bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 group hover:border-cyan-500/30 transition-all">
                <div class="md:col-span-1">
                    <button onclick="window.toggleOrigenItem(${idx})" class="w-14 h-14 rounded-2xl border-2 ${item.origen === 'TALLER' ? 'border-cyan-500/30 text-cyan-400' : 'border-amber-500/30 text-amber-400'}">
                        <i class="fas ${item.origen === 'TALLER' ? 'fa-warehouse' : 'fa-user-tag'}"></i>
                    </button>
                </div>
                <div class="md:col-span-4">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[9px] orbitron font-black ${item.tipo === 'REPUESTO' ? 'text-orange-500' : 'text-cyan-400'}">${item.tipo}</span>
                        <button onclick="window.buscarEnInventario(${idx})" class="text-white/20 hover:text-cyan-400"><i class="fas fa-search-plus"></i></button>
                    </div>
                    <input onchange="window.editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" class="w-full bg-transparent border-b border-white/10 outline-none text-white font-black uppercase" placeholder="DESCRIPCIÓN">
                </div>
                <div class="md:col-span-3">
                    <label class="text-[9px] text-slate-500 block uppercase font-black">Inversión (IVA Incl)</label>
                    <input type="number" onchange="window.editItemNexus(${idx}, 'costo', this.value)" value="${item.costo || ''}" class="w-full bg-black p-4 rounded-2xl text-red-500 font-black border border-white/5" placeholder="0">
                </div>
                <div class="md:col-span-3">
                    <label class="text-[9px] text-slate-500 block uppercase font-black">Venta Final</label>
                    <input type="number" onchange="window.editItemNexus(${idx}, 'venta', this.value)" value="${item.venta || ''}" class="w-full bg-black p-4 rounded-2xl text-emerald-400 font-black border border-white/5" placeholder="0">
                </div>
                <div class="md:col-span-1">
                    <button onclick="window.removeItemNexus(${idx})" class="text-red-500 hover:scale-125 transition-all">✕</button>
                </div>
            </div>`).join('');
    };

    // --- 🎮 TERMINAL PENTAGON PRO ---
    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1500px] mx-auto pb-20 animate-in slide-in-from-bottom-10">
            <div id="camera-viewport" class="hidden fixed inset-0 z-[110] bg-black flex flex-col items-center justify-center">
                <video id="video-feed" autoplay playsinline class="w-full max-w-2xl rounded-[3rem] border-4 border-cyan-500"></video>
                <div class="flex gap-10 mt-10">
                    <button id="btnShutter" class="w-24 h-24 bg-white rounded-full border-8 border-slate-700 shadow-2xl"></button>
                    <button id="btnCancelCam" class="w-24 h-24 bg-red-600 text-white rounded-full text-4xl">✕</button>
                </div>
            </div>

            <div class="flex flex-wrap justify-between items-center gap-6 mb-12 bg-[#0d1117] p-10 rounded-[4rem] border-2 border-cyan-500/20 sticky top-0 z-50">
                <div class="flex items-center gap-8">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-6xl font-black orbitron text-white w-64 uppercase text-center rounded-3xl border border-white/10" placeholder="PLACA">
                    <select id="f-estado" class="bg-cyan-500 text-black orbitron text-xs font-black p-6 rounded-2xl outline-none">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                </div>
                <div class="flex gap-4">
                    <button id="btnCaptureVisual" class="w-20 h-20 rounded-3xl bg-white/5 text-white border border-white/10 flex flex-col items-center justify-center gap-1">
                        <i class="fas fa-video text-2xl"></i>
                        <span class="text-[8px] orbitron font-black">VIDEO</span>
                    </button>
                    <button id="btnWppDirect" class="w-20 h-20 rounded-3xl bg-emerald-500 text-black flex flex-col items-center justify-center gap-1">
                        <i class="fab fa-whatsapp text-2xl"></i>
                        <span class="text-[8px] orbitron font-black">REPORTE</span>
                    </button>
                    <button id="btnCloseTerminal" class="w-20 h-20 rounded-3xl bg-red-600 text-white font-black text-3xl">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div class="lg:col-span-4 space-y-8">
                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5">
                        <label class="text-[10px] text-cyan-400 font-black uppercase block mb-6">Información Cliente</label>
                        <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-black p-6 rounded-3xl border border-white/5 mb-4 text-white uppercase font-bold" placeholder="NOMBRE CLIENTE">
                        <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-black p-6 rounded-3xl border border-white/5 text-white font-bold" placeholder="TELÉFONO">
                    </div>

                    <div class="bg-black p-10 rounded-[3.5rem] border border-red-500/30 relative">
                        <div id="rec-indicator" class="hidden absolute top-6 right-10 flex items-center gap-2">
                            <div class="h-2 w-2 bg-red-600 rounded-full animate-ping"></div>
                            <span class="text-[8px] orbitron text-red-500 font-black">AI REC</span>
                        </div>
                        <span class="orbitron text-[11px] text-red-500 font-black uppercase mb-6 block">AI Neural Log</span>
                        <textarea id="ai-log-display" class="w-full bg-[#0d1117] p-6 rounded-3xl text-sm h-64 outline-none border border-white/5 text-slate-300 font-mono italic">${ordenActiva.bitacora_ia || ''}</textarea>
                        <button id="btnDictar" class="w-full mt-6 py-6 bg-red-600 text-white rounded-2xl orbitron text-xs font-black">🎤 CAPTURAR VOZ</button>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 rounded-[4.5rem] border border-white/10 shadow-2xl relative">
                        <div class="flex justify-between items-end mb-12">
                            <div>
                                <p class="orbitron text-[14px] text-cyan-400 uppercase font-black mb-2">Gran Total Factura</p>
                                <h2 id="total-factura" class="orbitron text-7xl md:text-8xl font-black text-white italic tracking-tighter">$ 0</h2>
                            </div>
                            <div id="saldo-display" class="bg-white/5 p-8 rounded-[3rem] border border-white/10 text-right min-w-[250px]"></div>
                        </div>

                        <div id="items-container" class="space-y-6 max-h-[500px] overflow-y-auto pr-4"></div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                            <button id="btnAddRepuesto" class="py-6 bg-white/5 rounded-3xl border-2 border-dashed border-white/10 font-black text-xs">+ REPUESTO</button>
                            <button id="btnAddMano" class="py-6 bg-cyan-500/5 rounded-3xl border-2 border-dashed border-cyan-500/30 text-cyan-400 font-black text-xs">+ MANO DE OBRA</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="bg-black p-8 rounded-[3rem] border border-white/5 grid grid-cols-3 gap-4">
                            <div class="flex flex-col gap-2">
                                <label class="text-[8px] orbitron text-slate-500">ANTICIPO</label>
                                <input type="number" id="f-anticipo-cliente" value="${ordenActiva.finanzas?.anticipo_cliente || ''}" class="bg-emerald-500/10 p-4 rounded-xl text-emerald-400 font-bold border border-emerald-500/20" onchange="window.actualizarFinanzasDirecto()" placeholder="BOLD/EFECT">
                            </div>
                            <div class="flex flex-col gap-2">
                                <label class="text-[8px] orbitron text-slate-500">GASTOS</label>
                                <input type="number" id="f-gastos-varios" value="${ordenActiva.finanzas?.gastos_varios || ''}" class="bg-white/5 p-4 rounded-xl text-white font-bold border border-white/10" onchange="window.actualizarFinanzasDirecto()" placeholder="GASTOS">
                            </div>
                            <div class="flex flex-col gap-2">
                                <label class="text-[8px] orbitron text-slate-500 text-red-500">PAGO TÉCNICO</label>
                                <input type="number" id="f-adelanto-tecnico" value="${ordenActiva.finanzas?.adelanto_tecnico || ''}" class="bg-red-500/10 p-4 rounded-xl text-red-500 font-bold border border-red-500/20" onchange="window.actualizarFinanzasDirecto()" placeholder="NOMINA">
                            </div>
                        </div>
                        <button id="btnSincronizar" class="py-10 bg-white text-black rounded-[3rem] orbitron font-black text-xl hover:bg-cyan-400 transition-all shadow-2xl">🛰️ SYNC NEXUS</button>
                    </div>
                </div>
            </div>
        </div>`;
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    // --- 🔗 ACTION LINKS & SECURITY V8.0 ---
    const vincularAccionesTerminal = () => {
        const safeClick = (id, fn) => { const el = document.getElementById(id); if(el) el.onclick = fn; };

        safeClick("btnSincronizar", ejecutarSincronizacionNexus);
        safeClick("btnCloseTerminal", () => document.getElementById("nexus-terminal").classList.add("hidden"));
        safeClick("btnCaptureVisual", () => gestionarMultimedia('INICIAR'));
        safeClick("btnShutter", () => gestionarMultimedia('CAPTURAR'));
        safeClick("btnCancelCam", () => gestionarMultimedia('CANCELAR'));

        safeClick("btnDictar", () => {
            if(!isRecording) { 
                recognition?.start(); isRecording = true; 
                document.getElementById("rec-indicator")?.classList.remove("hidden");
                hablar("Nexus escuchando");
            } else { 
                recognition?.stop(); isRecording = false; 
                document.getElementById("rec-indicator")?.classList.add("hidden"); 
            }
        });

        if(recognition) {
            recognition.onresult = (e) => { 
                const log = document.getElementById("ai-log-display");
                if(log) log.value += " " + e.results[0][0].transcript; 
            };
        }

        safeClick("btnWppDirect", () => {
            const nombre = document.getElementById("f-cliente").value;
            const tel = document.getElementById("f-telefono").value.replace(/\D/g, '');
            const placa = document.getElementById("f-placa").value;
            const msg = `*TALLER PRO 360 REPORT*\nVehículo: ${placa}\nHola ${nombre}, su vehículo se encuentra en estado: ${document.getElementById("f-estado").value}.\n\nReporte Técnico:\n${document.getElementById("ai-log-display").value}`;
            if(tel) window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
        });

        safeClick("btnAddRepuesto", () => { 
            ordenActiva.items.push({ tipo: 'REPUESTO', desc: 'REPUESTO NUEVO', costo: 0, venta: 0, origen: 'TALLER', sku: '' }); 
            recalcularFinanzas(); 
        });
        
        safeClick("btnAddMano", async () => { 
            // Invocación a Módulo de Técnicos (Auditoría Punto 8)
            const { value: tecnico } = await Swal.fire({
                title: 'ASIGNAR ESPECIALISTA',
                background: '#0d1117', color: '#fff',
                input: 'text', inputLabel: 'Nombre del Técnico',
                inputPlaceholder: 'Escriba o busque...',
                showCancelButton: true
            });
            ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: `LABOR: ${tecnico || 'GENERAL'}`, costo: 0, venta: 0, origen: 'TALLER', tecnico: tecnico || 'GENERAL' }); 
            recalcularFinanzas(); 
        });
    };

    // --- 📹 MULTIMEDIA ENGINE (OFF-CLOUD) ---
    const gestionarMultimedia = async (accion) => {
        const video = document.getElementById('video-feed');
        const viewport = document.getElementById('camera-viewport');
        const canvas = document.createElement('canvas');

        if (accion === 'INICIAR') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                video.srcObject = stream;
                viewport.classList.remove('hidden');
            } catch (err) { alert("Error de cámara"); }
        } else if (accion === 'CAPTURAR') {
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            const link = document.createElement('a');
            link.download = `PRO360_EV_${ordenActiva.placa}_${Date.now()}.jpg`;
            link.href = canvas.toDataURL('image/jpeg');
            link.click();
            gestionarMultimedia('CANCELAR');
        } else {
            if(video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
            viewport.classList.add('hidden');
        }
    };

                 // --- 💾 DATABASE SYNC (INTEGRACIÓN RADICAL FINANCE CORE V21) ---
const ejecutarSincronizacionNexus = async () => {
    const btn = document.getElementById("btnSincronizar");
    if (btn) btn.disabled = true;
    
    try {
        // 1. CAPTURA DE IDENTIDAD (Evita el Protocol Broken)
        const placa = document.getElementById("f-placa")?.value.trim().toUpperCase();
        if(!placa) throw new Error("IDENTIFICADOR REQUERIDO");

        // Recuperación de ID de empresa (Doble verificación para Finance Core)
        const empresaIdActual = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
        if(!empresaIdActual) throw new Error("EMPRESA NO IDENTIFICADA");

        const docId = ordenActiva.id || `OT_${placa}_${Date.now()}`;
        
        // 2. EXTRACCIÓN FINANCIERA (Limpieza de datos DOM)
        const anticipoVal = Number(document.getElementById("f-anticipo-cliente")?.value) || 0;
        const gastosVal = Number(document.getElementById("f-gastos-varios")?.value) || 0;
        const adelantoVal = Number(document.getElementById("f-adelanto-tecnico")?.value) || 0;
        
        // Captura el total de la factura (El de $155.000 que se ve en tu captura)
        const totalTexto = document.getElementById("total-factura")?.innerText || "$ 0";
        const granTotalCalculado = Number(totalTexto.replace(/[^0-9.-]+/g,"")) || 0;

        const finalData = {
            ...ordenActiva,
            id: docId, 
            empresaId: empresaIdActual,
            placa,
            cliente: document.getElementById("f-cliente")?.value.toUpperCase() || "CLIENTE",
            telefono: document.getElementById("f-telefono")?.value || "",
            estado: document.getElementById("f-estado")?.value || "INGRESO",
            bitacora_ia: document.getElementById("ai-log-display")?.value || "",
            totalMision: granTotalCalculado,
            finanzas: {
                anticipo_cliente: anticipoVal,
                gastos_varios: gastosVal,
                adelanto_tecnico: adelantoVal
            },
            updatedAt: serverTimestamp(),
            creadoEn: serverTimestamp() 
        };

        // 3. PERSISTENCIA EN FIREBASE (Misión + Auditoría Contable)
        await setDoc(doc(db, "ordenes", docId), finalData);

        // DISPARADOR DE INGRESOS: Si hay anticipo o está terminada, va a Contabilidad
        if(anticipoVal > 0 || ['LISTO', 'ENTREGADO'].includes(finalData.estado)) {
            const montoARegistrar = ['LISTO', 'ENTREGADO'].includes(finalData.estado) ? granTotalCalculado : anticipoVal;
            
            await setDoc(doc(db, "contabilidad", `ING_${docId}`), {
                empresaId: empresaIdActual,
                tipo: 'ingreso_ot', // Filtro Clase 4 para el Finance Core
                monto: montoARegistrar,
                concepto: `OT ${placa}: ${finalData.cliente}`,
                ordenId: docId,
                creadoEn: serverTimestamp()
            });
        }

        // DISPARADOR DE EGRESOS (Nómina y Gastos Operativos)
        if(adelantoVal > 0) {
            await setDoc(doc(db, "contabilidad", `NOM_${docId}`), {
                empresaId: empresaIdActual,
                tipo: 'nomina_pago',
                monto: adelantoVal,
                concepto: `ADELANTO TÉCNICO OT: ${placa}`,
                ordenId: docId,
                creadoEn: serverTimestamp()
            });
        }

        if(gastosVal > 0) {
            await setDoc(doc(db, "contabilidad", `GAS_${docId}`), {
                empresaId: empresaIdActual,
                tipo: 'gasto_operativo',
                monto: gastosVal,
                concepto: `GASTOS/INSUMOS OT: ${placa}`,
                ordenId: docId,
                creadoEn: serverTimestamp()
            });
        }

        // 4. CIERRE SEGURO DE PROTOCOLO
        Swal.fire({ 
            icon: 'success', 
            title: 'NEXUS SYNC COMPLETED', 
            text: 'FINANCE CORE V21 ONLINE',
            background: '#010409', color: '#06b6d4', timer: 2000 
        }).then(() => {
            document.getElementById("nexus-terminal")?.classList.add("hidden");
            // Refresco forzado para limpiar el estado de memoria y evitar el Broken Link
            window.location.reload(); 
        });

    } catch (err) {
        console.error("Falla Crítica Nexus:", err);
        Swal.fire({ icon: 'error', title: 'SYNC FAILURE', text: err.message, background: '#010409', color: '#ff4444' });
    } finally { 
        if (btn) btn.disabled = false; 
    }
};

// Exponer función al alcance global para los botones del DOM
window.ejecutarSincronizacionNexus = ejecutarSincronizacionNexus;
