/**
 * ordenes.js - NEXUS-X COMMAND CENTER V7.0 "CYBERDYNE EDITION" 🛰️
 * PROTOCOLO 2030 TERMINATOR - UI DE ALTO CONTRASTE Y MULTIMEDIA INTEGRADO
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
                        <h1 class="orbitron text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase leading-none">NEXUS_<span class="text-cyan-400">V7</span></h1>
                    </div>
                    <p class="text-[12px] orbitron text-cyan-500/70 tracking-[0.6em] uppercase italic font-bold">Logistics Neural Interface // Term-2030</p>
                </div>
                <button id="btnNewMission" class="group relative px-12 py-7 bg-cyan-500 text-black rounded-full orbitron text-sm font-black hover:bg-white hover:scale-110 transition-all duration-500 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                    <span class="relative z-10">INICIAR MISIÓN +</span>
                    <div class="absolute inset-0 bg-white rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 opacity-20"></div>
                </button>
            </header>

            <nav class="grid grid-cols-2 md:grid-cols-5 gap-5 mb-16">
                ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="fase-tab relative overflow-hidden p-8 rounded-[2.5rem] bg-[#0d1117] border-2 ${faseActual === fase ? 'border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.2)]' : 'border-white/5'} transition-all group" data-fase="${fase}">
                        <span class="orbitron text-[10px] ${faseActual === fase ? 'text-cyan-400' : 'text-slate-500'} group-hover:text-cyan-400 mb-3 block font-black tracking-widest">${fase}</span>
                        <h3 id="count-${fase}" class="text-5xl font-black text-white group-hover:scale-110 transition-all">0</h3>
                        ${faseActual === fase ? '<div class="absolute bottom-0 left-0 w-full h-1 bg-cyan-500"></div>' : ''}
                    </button>
                `).join('')}
            </nav>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl p-4 lg:p-12 overflow-y-auto border-4 border-cyan-500/20 m-2 rounded-[3rem]"></div>
        </div>`;
        
        vincularNavegacion();
        cargarEscuchaGlobal();
    };

    // --- 📡 REAL-TIME ENGINE ---
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
                <div onclick="window.abrirTerminalNexus('${o.id}')" class="bg-[#0d1117] p-10 rounded-[3.5rem] border-2 border-white/5 hover:border-cyan-400 transition-all cursor-pointer group animate-in zoom-in shadow-2xl relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 transition-opacity">
                        <i class="fas fa-microchip text-4xl text-cyan-400"></i>
                    </div>
                    <div class="flex justify-between items-center mb-6">
                         <span class="orbitron text-4xl font-black text-white group-hover:text-cyan-400 tracking-tighter">${o.placa}</span>
                         <div class="h-3 w-3 rounded-full ${o.estado === 'LISTO' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-cyan-500 shadow-[0_0_15px_#06b6d4]'}"></div>
                    </div>
                    <p class="text-[11px] text-cyan-500/50 orbitron font-black tracking-[0.3em] uppercase mb-8">${o.cliente || 'OBJECT_UNKNOWN'}</p>
                    <div class="flex justify-between items-end border-t border-white/10 pt-6">
                        <div>
                            <span class="text-[10px] text-slate-500 block uppercase mb-1 font-bold">Valor Misión</span>
                            <span class="text-2xl font-black text-white orbitron">$ ${Number(o.costos_totales?.gran_total || 0).toLocaleString()}</span>
                        </div>
                        <i class="fas fa-chevron-right text-cyan-400 transform group-hover:translate-x-2 transition-transform"></i>
                    </div>
                </div>`).join('');
            }
        });
    };

    // --- 🧮 FINANCIAL ALGORITHM 2030 ---
    const recalcularFinanzas = () => {
        let sumaVentaBruta = 0;
        let sumaCostoTaller = 0;

        ordenActiva.items.forEach(i => {
            sumaVentaBruta += Number(i.venta || 0);
            if (i.origen === "TALLER") { sumaCostoTaller += Number(i.costo || 0); }
        });

        const g_insumos = Number(document.getElementById("f-gastos-varios")?.value || 0); 
        const a_tecnico = Number(document.getElementById("f-adelanto-tecnico")?.value || 0); 
        const a_cliente = Number(document.getElementById("f-anticipo-cliente")?.value || 0); 
        
        let valorIVA = (ordenActiva.finanzas?.impuesto_tipo === 'IVA_19') ? (sumaVentaBruta + g_insumos) * 0.19 : 0;
        const granTotal = sumaVentaBruta + g_insumos + valorIVA;
        const utilidadNeta = (sumaVentaBruta + g_insumos) - (sumaCostoTaller + g_insumos + a_tecnico);
        const saldoPendiente = granTotal - a_cliente;

        ordenActiva.costos_totales = {
            total_venta: sumaVentaBruta + g_insumos,
            total_costo: sumaCostoTaller + g_insumos + a_tecnico,
            iva: valorIVA, gran_total: granTotal, utilidad: utilidadNeta, saldo_pendiente: saldoPendiente
        };

        const totalEl = document.getElementById("total-factura");
        if(totalEl) {
            totalEl.innerText = `$ ${granTotal.toLocaleString()}`;
            document.getElementById("saldo-display").innerHTML = `
                <span class="text-cyan-500/50 text-[10px] uppercase block tracking-widest font-black mb-1 italic">Saldo Pendiente</span>
                <span class="${saldoPendiente > 0 ? 'text-red-500' : 'text-emerald-400'}">$ ${saldoPendiente.toLocaleString()}</span>
            `;
        }
        renderItems();
    };

    // --- 🛠️ ITEM MANAGEMENT ---
    const renderItems = () => {
        const containerItems = document.getElementById("items-container");
        if(!containerItems) return;
        containerItems.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="grid grid-cols-1 md:grid-cols-12 items-center gap-4 bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 group hover:border-cyan-500/30 transition-all">
                <div class="md:col-span-1 flex justify-center">
                    <button onclick="window.toggleOrigenItem(${idx})" class="w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 ${item.origen === 'TALLER' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}">
                        <i class="fas ${item.origen === 'TALLER' ? 'fa-warehouse' : 'fa-user-tag'} text-sm"></i>
                        <span class="text-[7px] orbitron font-black mt-1 uppercase">${item.origen}</span>
                    </button>
                </div>
                <div class="md:col-span-4">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[9px] orbitron font-black ${item.tipo === 'REPUESTO' ? 'text-orange-500' : 'text-cyan-400'}">[${item.tipo}]</span>
                        <button onclick="window.buscarEnInventario(${idx})" class="text-white/20 hover:text-cyan-400 transition-all text-xs"><i class="fas fa-search-plus"></i></button>
                    </div>
                    <input onchange="window.editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" class="w-full bg-transparent border-b border-white/10 outline-none text-white text-md uppercase font-black focus:border-cyan-400" placeholder="DESCRIPCIÓN...">
                </div>
                <div class="md:col-span-3">
                    <label class="text-[9px] text-slate-500 block mb-1 uppercase font-black italic">Inversión (Costo)</label>
                    <div class="relative">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-red-500/50 text-xs">$</span>
                        <input type="number" onchange="window.editItemNexus(${idx}, 'costo', this.value)" value="${item.costo || 0}" class="w-full bg-black p-4 pl-8 rounded-2xl text-red-500 text-lg font-black border border-white/5 ${item.origen === 'CLIENTE' ? 'opacity-20' : ''}" ${item.origen === 'CLIENTE' ? 'disabled' : ''}>
                    </div>
                </div>
                <div class="md:col-span-3">
                    <label class="text-[9px] text-slate-500 block mb-1 uppercase font-black italic">Precio Cliente</label>
                    <div class="relative">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50 text-xs">$</span>
                        <input type="number" onchange="window.editItemNexus(${idx}, 'venta', this.value)" value="${item.venta || 0}" class="w-full bg-black p-4 pl-8 rounded-2xl text-emerald-400 text-lg font-black border border-white/5">
                    </div>
                </div>
                <div class="md:col-span-1 flex justify-end">
                    <button onclick="window.removeItemNexus(${idx})" class="w-10 h-10 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">✕</button>
                </div>
            </div>`).join('');
    };

    // --- 🎮 TERMINAL PENTAGON INTERFACE (OPTIMIZADO) ---
const renderTerminal = () => {
    const modal = document.getElementById("nexus-terminal");
    modal.innerHTML = `
    <div class="max-w-[1500px] mx-auto pb-20 animate-in slide-in-from-bottom-10 duration-500">
        <div id="camera-viewport" class="hidden fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
            <video id="video-feed" autoplay playsinline class="w-full max-w-2xl rounded-[3rem] border-4 border-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.5)]"></video>
            <canvas id="photo-canvas" class="hidden"></canvas>
            <div class="flex gap-6 mt-8">
                <button id="btnShutter" class="w-24 h-24 bg-white rounded-full border-8 border-slate-300 flex items-center justify-center shadow-xl active:scale-90 transition-all">
                    <div class="w-16 h-16 bg-red-600 rounded-full"></div>
                </button>
                <button id="btnCancelCam" class="w-24 h-24 bg-slate-800 text-white rounded-full text-4xl hover:bg-red-600 transition-all">✕</button>
            </div>
        </div>

        <div class="flex flex-wrap justify-between items-center gap-6 mb-12 bg-[#0d1117] p-10 rounded-[4rem] border-2 border-cyan-500/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] sticky top-0 z-50">
            <div class="flex items-center gap-8">
                <div class="bg-black p-4 rounded-3xl border border-white/10">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-transparent text-6xl font-black orbitron text-white outline-none w-64 uppercase text-center" placeholder="PLACA">
                </div>
                <select id="f-estado" class="bg-cyan-500 text-black orbitron text-xs font-black p-5 rounded-2xl outline-none cursor-pointer hover:bg-white transition-colors">
                    ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                </select>
            </div>
            <div class="flex gap-4">
                <button id="btnCapturePhoto" class="w-20 h-20 rounded-3xl bg-white/5 text-white border border-white/10 hover:border-cyan-400 hover:text-cyan-400 transition-all flex flex-col items-center justify-center gap-2">
                    <i class="fas fa-camera text-2xl"></i>
                    <span class="text-[8px] orbitron font-black">VISUAL</span>
                </button>
                <button id="btnWppDirect" class="w-20 h-20 rounded-3xl bg-emerald-500 text-black border-none hover:bg-white transition-all flex flex-col items-center justify-center gap-2">
                    <i class="fab fa-whatsapp text-2xl"></i>
                    <span class="text-[8px] orbitron font-black">REPORT</span>
                </button>
                <button id="btnCloseTerminal" class="w-20 h-20 rounded-3xl bg-red-600 text-white font-black text-3xl hover:scale-110 transition-all shadow-lg shadow-red-600/20">✕</button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4 space-y-8">
                <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5">
                    <label class="text-[10px] text-cyan-400 font-black uppercase mb-6 block tracking-[0.3em]">Owner ID & Contact</label>
                    <div class="space-y-6">
                        <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-black p-6 rounded-3xl border border-white/5 outline-none font-black text-white focus:border-cyan-500 uppercase" placeholder="NOMBRE COMPLETO">
                        <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-black p-6 rounded-3xl border border-white/5 outline-none font-black text-white focus:border-cyan-500" placeholder="TELÉFONO">
                    </div>
                </div>

                <div class="bg-black p-10 rounded-[3.5rem] border border-red-500/30">
                    <span class="orbitron text-[11px] text-red-500 font-black italic tracking-widest uppercase mb-6 block">AI Bitácora Neural</span>
                    <textarea id="ai-log-display" class="w-full bg-[#0d1117] p-6 rounded-3xl text-sm h-64 outline-none border border-white/5 italic text-slate-300 resize-none font-mono focus:border-red-500/50 transition-all">${ordenActiva.bitacora_ia || ''}</textarea>
                    <button id="btnDictar" class="w-full mt-6 py-6 bg-red-600 text-white rounded-2xl orbitron text-xs font-black hover:bg-white hover:text-black transition-all">🎤 CAPTURAR VOZ</button>
                </div>
            </div>

            <div class="lg:col-span-8 space-y-8">
                <div class="bg-[#0d1117] p-12 rounded-[4.5rem] border border-white/10 shadow-2xl">
                    <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
                        <div>
                            <p class="orbitron text-[14px] text-cyan-400 uppercase italic font-black tracking-[0.4em] mb-2">Total Misión Nexus</p>
                            <h2 id="total-factura" class="orbitron text-7xl md:text-9xl font-black text-white italic tracking-tighter">$ 0</h2>
                        </div>
                        <div class="bg-white/5 p-8 rounded-[3rem] border border-white/10 min-w-[300px] text-right">
                            <div id="saldo-display" class="text-4xl font-black orbitron italic mb-4 tracking-tighter"></div>
                            <div class="relative bg-black p-4 rounded-2xl border border-white/5">
                                <label class="text-[8px] text-slate-500 font-black uppercase absolute top-2 right-4">Abono Recibido</label>
                                <input type="number" id="f-anticipo-cliente" value="${ordenActiva.finanzas?.anticipo_cliente || 0}" class="bg-transparent text-right text-emerald-400 font-black outline-none w-full text-3xl pt-2" onchange="window.actualizarFinanzasDirecto()">
                            </div>
                        </div>
                    </div>
                    <div id="items-container" class="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar"></div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                        <button id="btnAddRepuesto" class="py-8 bg-white/5 rounded-3xl border-2 border-dashed border-white/10 orbitron text-xs font-black text-white hover:border-cyan-400 hover:text-cyan-400 transition-all">+ AÑADIR REPUESTO</button>
                        <button id="btnAddMano" class="py-8 bg-cyan-500/5 rounded-3xl border-2 border-dashed border-cyan-500/30 text-cyan-400 orbitron text-xs font-black hover:bg-cyan-500/20 transition-all">+ AÑADIR LABOR</button>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div class="bg-black p-8 rounded-[3rem] border border-white/5 grid grid-cols-2 gap-4">
                        <input type="number" id="f-gastos-varios" value="${ordenActiva.finanzas?.gastos_varios || 0}" class="bg-[#0d1117] p-4 rounded-xl text-white border border-white/5 text-center font-bold" onchange="window.actualizarFinanzasDirecto()" placeholder="GASTOS">
                        <input type="number" id="f-adelanto-tecnico" value="${ordenActiva.finanzas?.adelanto_tecnico || 0}" class="bg-[#0d1117] p-4 rounded-xl text-white border border-white/5 text-center font-bold" onchange="window.actualizarFinanzasDirecto()" placeholder="PAGO TEC">
                     </div>
                    <button id="btnSincronizar" class="py-10 bg-white text-black rounded-[3rem] orbitron font-black text-xl uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all shadow-2xl">🛰️ SYNC NEXUS</button>
                </div>
            </div>
        </div>
    </div>`;
    vincularAccionesTerminal();
    recalcularFinanzas();
};

    // --- 🔗 ACTION LINKS & SECURITY ---
    const vincularAccionesTerminal = () => {
        const safeClick = (id, fn) => { const el = document.getElementById(id); if(el) el.onclick = fn; };

        safeClick("btnSincronizar", ejecutarSincronizacionNexus);
        safeClick("btnCloseTerminal", () => document.getElementById("nexus-terminal").classList.add("hidden"));
        
        safeClick("btnDictar", () => {
            if(!isRecording) { 
                recognition?.start(); isRecording = true; 
                document.getElementById("rec-indicator").classList.remove("hidden");
                hablar("Escuchando misión");
            } else { 
                recognition?.stop(); isRecording = false; 
                document.getElementById("rec-indicator").classList.add("hidden"); 
            }
        });

        if(recognition) {
            recognition.onresult = (e) => { 
                const log = document.getElementById("ai-log-display");
                if(log) log.value += " " + e.results[0][0].transcript; 
            };
        }

// --- 📸 GESTIÓN DE CÁMARA Y DESCARGA LOCAL ---
const gestionarCamara = async (accion) => {
    const video = document.getElementById('video-feed');
    const viewport = document.getElementById('camera-viewport');
    const canvas = document.getElementById('photo-canvas');

    if (accion === 'INICIAR') {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
            video.srcObject = stream;
            viewport.classList.remove('hidden');
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Hardware Error', text: 'No se detectó cámara activa.', background: '#010409', color: '#ff0000' });
        }
    } else if (accion === 'CAPTURAR') {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Generar descarga automática
        const link = document.createElement('a');
        const placa = document.getElementById('f-placa').value || 'SIN_PLACA';
        link.download = `EVIDENCIA_${placa}_${new Date().getTime()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click(); // Dispara la descarga en el equipo

        // Limpieza y cierre
        video.srcObject.getTracks().forEach(t => t.stop());
        viewport.classList.add('hidden');
        hablar("Foto descargada al dispositivo");
        Swal.fire({ icon: 'success', title: 'DESCARGADA', text: 'La imagen se guardó en tu equipo.', background: '#010409', color: '#06b6d4', timer: 1500 });
    } else {
        if(video?.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
        viewport?.classList.add('hidden');
    }
};
        safeClick("btnWppDirect", () => {
            const tel = document.getElementById("f-telefono")?.value || "17049419163";
            const msg = `*NEXUS-X REPORT [${ordenActiva.placa}]*%0A✅ Status: ${ordenActiva.estado}%0A💰 Saldo: $${ordenActiva.costos_totales.saldo_pendiente.toLocaleString()}`;
            window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
        });

        safeClick("btnAddRepuesto", () => { 
            ordenActiva.items.push({ tipo: 'REPUESTO', desc: 'NUEVO REPUESTO', costo: 0, venta: 0, origen: 'TALLER', sku: '' }); 
            recalcularFinanzas(); 
        });
        
        safeClick("btnAddMano", () => { 
            ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: 'MANO DE OBRA', costo: 0, venta: 0, origen: 'TALLER' }); 
            recalcularFinanzas(); 
        });
    };

    // --- 💾 DATABASE SYNC ---
    const ejecutarSincronizacionNexus = async () => {
        const btn = document.getElementById("btnSincronizar");
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-satellite-dish animate-bounce"></i> UPLOADING...`;
        
        try {
            const placaLimpia = document.getElementById("f-placa").value.trim().toUpperCase();
            if(!placaLimpia) throw new Error("IDENTIFICADOR DE MISIÓN REQUERIDO");

            const docId = ordenActiva.id || `OT_${placaLimpia}_${Date.now()}`;
            const dataOrden = {
                ...ordenActiva,
                id: docId, empresaId,
                placa: placaLimpia,
                cliente: document.getElementById("f-cliente").value.trim().toUpperCase(),
                telefono: document.getElementById("f-telefono").value.trim(),
                estado: document.getElementById("f-estado").value,
                bitacora_ia: document.getElementById("ai-log-display").value,
                updatedAt: serverTimestamp()
            };

            await setDoc(doc(db, "ordenes", docId), dataOrden);

            // ERP Logic: Stock Control
            if (dataOrden.estado === "LISTO" || dataOrden.estado === "ENTREGADO") {
                for (const item of dataOrden.items) {
                    if (item.sku && item.origen === 'TALLER') {
                        await updateDoc(doc(db, "inventario", item.sku), { cantidad: increment(-1) });
                    }
                }
            }

            Swal.fire({ icon: 'success', title: 'MISSION SYNCED', background: '#010409', color: '#06b6d4', showConfirmButton: false, timer: 1500 });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'COMM LINK FAILURE', text: err.message, background: '#010409', color: '#ff0000' });
        } finally {
            btn.innerHTML = originalText;
        }
    };

    // --- 📦 VAULT INTEGRATION ---
    window.buscarEnInventario = async (idx) => {
        const { value: item } = await Swal.fire({
            title: 'BÓVEDA DE SUMINISTROS',
            background: '#0d1117', color: '#fff',
            html: `<select id="swal-sku" class="w-full bg-black p-5 rounded-2xl text-cyan-400 border border-cyan-500/30 orbitron text-xs"></select>`,
            didOpen: async () => {
                const snap = await getDocs(query(collection(db, "inventario"), where("empresaId", "==", empresaId)));
                const select = document.getElementById("swal-sku");
                select.innerHTML = '<option value="">SELECCIONAR SKU</option>' + snap.docs.map(d => `<option value='${JSON.stringify({id: d.id, n: d.data().nombre, c: d.data().costo, v: d.data().precioVenta})}'>${d.data().nombre} (${d.data().cantidad})</option>`).join('');
            },
            preConfirm: () => { const v = document.getElementById("swal-sku").value; return v ? JSON.parse(v) : null; }
        });
        if (item) {
            ordenActiva.items[idx] = { ...ordenActiva.items[idx], desc: item.n, costo: item.c, venta: item.v, sku: item.id };
            recalcularFinanzas();
        }
    };

    // --- 🧩 GLOBAL HELPERS ---
    window.abrirTerminalNexus = (id) => {
        const modal = document.getElementById("nexus-terminal");
        modal.classList.remove("hidden");
        if(id) {
            getDoc(doc(db, "ordenes", id)).then(s => { 
                ordenActiva = { id, ...s.data() }; 
                renderTerminal(); 
            });
        } else {
            ordenActiva = { placa: '', cliente: '', telefono: '', estado: 'INGRESO', items: [], bitacora_ia: '', finanzas: { gastos_varios: 0, adelanto_tecnico: 0, anticipo_cliente: 0, impuesto_tipo: 'IVA_19' }, costos_totales: { gran_total: 0, saldo_pendiente: 0 }};
            renderTerminal();
        }
    };

    window.toggleOrigenItem = (idx) => { 
        const it = ordenActiva.items[idx]; 
        it.origen = it.origen === 'TALLER' ? 'CLIENTE' : 'TALLER'; 
        if(it.origen === 'CLIENTE') it.costo = 0; 
        recalcularFinanzas(); 
    };

    window.editItemNexus = (idx, campo, val) => { 
        ordenActiva.items[idx][campo] = (campo === 'costo' || campo === 'venta') ? Number(val) : val; 
        recalcularFinanzas(); 
    };

    window.removeItemNexus = (idx) => { ordenActiva.items.splice(idx, 1); recalcularFinanzas(); };
    window.actualizarFinanzasDirecto = () => recalcularFinanzas();

    const vincularNavegacion = () => {
        document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus();
        document.querySelectorAll(".fase-tab").forEach(tab => { 
            tab.onclick = () => { faseActual = tab.dataset.fase; renderBase(); }; 
        });
    };

    renderBase();
}
