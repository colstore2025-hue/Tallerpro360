/**
 * ordenes.js - TallerPRO360 NEXUS-X V30.1 🛰️
 * REPARACIÓN DE PERMISOS Y MOTOR DE IMPRESIÓN EXTERNO
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

    // --- INTERFAZ BASE ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-8 bg-[#010409] min-h-screen text-slate-100 font-sans animate-in fade-in duration-700">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-6 mb-12 border-b border-white/5 pb-10">
                <div class="space-y-2">
                    <div class="flex items-center gap-4">
                        <div class="h-3 w-3 bg-orange-500 rounded-full animate-pulse shadow-[0_0_15px_#f97316]"></div>
                        <h1 class="orbitron text-5xl font-black italic tracking-tighter text-white">NEXUS_<span class="text-orange-500">OT</span></h1>
                    </div>
                    <p class="text-[10px] orbitron text-slate-500 tracking-[0.4em]">SISTEMA DE FUERZA OPERACIONAL V30.1</p>
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
                evidencia: { fotos_locales: [], audio_diagnostico: null } // Nota: fotos_locales no se suben a Firestore
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
                    <button id="btnImprimir" class="w-14 h-14 rounded-2xl bg-cyan-600/10 text-cyan-500 border border-cyan-500/20 hover:bg-cyan-600 transition-all"><i class="fas fa-print"></i></button>
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
                        <div id="preview-scanner" class="aspect-video bg-black/40 rounded-2xl mb-4 border border-dashed border-white/10 flex items-center justify-center overflow-hidden text-center p-4 text-[10px] text-slate-500">
                            ${ordenActiva.evidencia.audio_diagnostico || 'SISTEMA LISTO'}
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
                        <div id="items-list" class="space-y-4 h-[450px] overflow-y-auto custom-scrollbar pr-4"></div>
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

    const vincularAccionesTerminal = () => {
        // --- CÁMARA REAL (VINCULADA CORRECTAMENTE) ---
        document.getElementById("btnScanFoto").onclick = () => {
            const scannerInput = document.createElement('input');
            scannerInput.type = 'file';
            scannerInput.accept = 'image/*';
            scannerInput.capture = 'environment';
            scannerInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    document.getElementById("preview-scanner").innerText = "🔄 PROCESANDO...";
                    reader.onload = (ev) => {
                        const imgData = ev.target.result;
                        // Guardamos localmente para previsualizar/PDF, NO en el objeto que va a Firestore
                        ordenActiva.temp_foto = imgData; 
                        document.getElementById("preview-scanner").innerHTML = `<img src="${imgData}" class="h-full w-full object-cover">`;
                        hablar("Evidencia capturada.");
                    };
                    reader.readAsDataURL(file);
                }
            };
            scannerInput.click();
        };

        // --- IMPRESIÓN PDF ---
        document.getElementById("btnImprimir").onclick = async () => {
            const { jsPDF } = window.jspdf ? window.jspdf : { jsPDF: null };
            if (!jsPDF) {
                const s = document.createElement('script');
                s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
                document.head.appendChild(s);
                hablar("Cargando motor PDF...");
                return;
            }
            const docPdf = new jsPDF();
            docPdf.text(`ORDEN: ${ordenActiva.placa}`, 20, 20);
            docPdf.text(`CLIENTE: ${ordenActiva.cliente}`, 20, 30);
            let y = 50;
            ordenActiva.items.forEach(i => {
                docPdf.text(`${i.descripcion} - $${Number(i.precio_venta).toLocaleString()}`, 20, y);
                y += 10;
            });
            docPdf.save(`OT_${ordenActiva.placa}.pdf`);
            hablar("PDF generado.");
        };

        // --- WHATSAPP ---
        document.getElementById("btnWhatsApp").onclick = () => {
            const msj = `*TallerPRO360 - ${ordenActiva.placa}*\nPresupuesto: $${ordenActiva.costos_totales.venta.toLocaleString()}`;
            window.open(`https://wa.me/${ordenActiva.telefono}?text=${encodeURIComponent(msj)}`);
        };

        // ... (btnAddRepuesto, btnAddOro, btnAddGasto se mantienen igual)

        // --- SINCRONIZACIÓN (REPARADO PERMISOS) ---
        document.getElementById("btnSaveMission").onclick = async () => {
            const btn = document.getElementById("btnSaveMission");
            btn.innerText = "SINCRONIZANDO...";
            
            // LIMPIEZA CRÍTICA: Eliminamos datos pesados antes de subir a Firestore
            const datosParaSubir = { ...ordenActiva };
            delete datosParaSubir.temp_foto; // NO subimos la foto base64 a Firestore para evitar el error de permisos
            delete datosParaSubir.id;

            datosParaSubir.placa = document.getElementById("f-placa").value.toUpperCase();
            datosParaSubir.cliente = document.getElementById("f-cliente").value;
            datosParaSubir.telefono = document.getElementById("f-telefono").value;
            datosParaSubir.estado = document.getElementById("f-estado").value;
            datosParaSubir.empresaId = empresaId;

            try {
                const docRef = ordenActiva.id ? doc(db, "ordenes", ordenActiva.id) : doc(collection(db, "ordenes"));
                await setDoc(docRef, { ...datosParaSubir, updatedAt: serverTimestamp() }, { merge: true });
                hablar("Misión sincronizada en la nube.");
                document.getElementById("nexus-terminal").classList.add("hidden");
            } catch (e) {
                console.error("Firestore Error:", e);
                btn.innerText = "ERROR DE RED";
            }
        };

        // Vincular el resto de funciones de edición...
        window.editItemNexus = (idx, campo, valor) => { ordenActiva.items[idx][campo] = valor; recalcularTotales(); };
        window.delItemNexus = (idx) => { ordenActiva.items.splice(idx, 1); recalcularTotales(); };
    };

    // ... (recalcularTotales, renderItems, vincularNavegacion, cargarGrid se mantienen igual)

    renderBase();
}
