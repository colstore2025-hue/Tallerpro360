/**
 * ordenes.js - NEXUS-X COMMAND CENTER V5.3 "GALAXY" 🛰️
 * Nivel: Aeroespacial / Enterprise
 * Integración: Voice AI Pro, VehicleScanner (Multi-Media), CRM WhatsApp & Bold Fix.
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, 
    setDoc, deleteDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if(recognition) { 
    recognition.lang = 'es-CO'; 
    recognition.continuous = true; // Flujo constante para evitar distorsión
    recognition.interimResults = true; 
}

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;
    let faseActual = 'INGRESO';
    let isRecording = false;

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
                <button id="btnNewMission" class="w-full md:w-auto px-10 py-6 bg-white text-black rounded-[2rem] orbitron text-[12px] font-black shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-cyan-400 transition-all">NUEVA MISIÓN +</button>
            </header>

            <nav class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16 overflow-x-auto no-scrollbar">
                ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="fase-tab p-6 rounded-[2.5rem] bg-[#0d1117] border border-white/5 transition-all group" data-fase="${fase}">
                        <span class="orbitron text-[9px] text-slate-500 group-hover:text-cyan-400 mb-4 block">${fase}</span>
                        <h3 id="count-${fase}" class="text-3xl font-black text-white group-hover:scale-110 transition-all">0</h3>
                    </button>
                `).join('')}
            </nav>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-[#010409]/98 backdrop-blur-3xl p-4 lg:p-12 overflow-y-auto"></div>
        </div>`;
        vincularNavegacion();
        cargarGrid(faseActual);
    };

    const abrirTerminal = async (id = null) => {
        const modal = document.getElementById("nexus-terminal");
        modal.classList.remove("hidden");
        if (id) {
            const snap = await getDoc(doc(db, "ordenes", id));
            ordenActiva = { id, ...snap.data() };
        } else {
            ordenActiva = {
                placa: '', cliente: '', telefono: '', estado: 'INGRESO', items: [], 
                bitacora_ia: '', gastos_varios: { cafeteria: 0, adelanto_tecnico: 0 },
                abonos: 0, costos_totales: { total: 0, costo: 0, utilidad: 0, saldo_pendiente: 0 },
                evidencias: []
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
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-transparent text-5xl font-black orbitron text-cyan-400 outline-none w-52 uppercase" placeholder="PLACA">
                    <div class="h-10 w-[2px] bg-white/10 mx-4 hidden md:block"></div>
                    <select id="f-estado" class="bg-black text-cyan-400 orbitron text-[10px] p-4 rounded-2xl border border-cyan-500/20 outline-none">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                </div>
                <div class="flex gap-3">
                    <button id="btnWppDirect" class="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xl"><i class="fab fa-whatsapp"></i></button>
                    <button id="btnDescargarOT" class="w-14 h-14 rounded-2xl bg-white/5 text-white border border-white/10 text-xl"><i class="fas fa-download"></i></button>
                    <button id="btnEliminarOT" class="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 text-xl"><i class="fas fa-trash"></i></button>
                    <button onclick="document.getElementById('nexus-terminal').classList.add('hidden')" class="w-14 h-14 rounded-2xl bg-white/10 text-white font-black text-2xl">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div class="lg:col-span-4 space-y-8">
                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 shadow-xl">
                        <p class="orbitron text-[10px] text-slate-500 mb-8 uppercase tracking-widest italic">Expediente del Propietario</p>
                        <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-white/5 p-6 rounded-3xl mb-6 border border-white/5 outline-none font-bold uppercase focus:border-cyan-500" placeholder="NOMBRE COMPLETO">
                        <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-white/5 p-6 rounded-3xl border border-white/5 outline-none focus:border-cyan-500" placeholder="WHATSAPP (+57)">
                    </div>

                    <div class="bg-black p-10 rounded-[3.5rem] border border-cyan-500/20 shadow-glow-cyan relative overflow-hidden">
                        <div class="flex justify-between items-center mb-6">
                            <span class="orbitron text-[10px] text-cyan-400 font-black">VEHICLE SCANNER & AI</span>
                            <div id="rec-indicator" class="h-3 w-3 bg-red-600 rounded-full hidden animate-pulse"></div>
                        </div>
                        <div id="ai-log-display" class="bg-white/5 p-6 rounded-3xl text-xs h-48 overflow-y-auto mb-6 italic text-slate-300 leading-relaxed border border-white/5">
                            ${ordenActiva.bitacora_ia || 'Inicie el dictado para documentar fallas técnicos...'}
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <button id="btnDictar" class="py-5 bg-cyan-500 text-black rounded-2xl orbitron text-[9px] font-black shadow-lg">🎤 DICTAR</button>
                            <button id="btnCapturaFalla" class="py-5 bg-white/10 text-white rounded-2xl border border-white/20 orbitron text-[9px] font-black"><i class="fas fa-camera-retro mr-2"></i> MULTIMEDIA</button>
                        </div>
                    </div>

                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-emerald-500/10">
                        <p class="orbitron text-[9px] text-emerald-500 mb-6 font-black uppercase italic">Flujo Financiero</p>
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div class="space-y-2">
                                <label class="text-[8px] orbitron text-slate-500">CAFETERÍA</label>
                                <input type="number" id="f-cafeteria" value="${ordenActiva.gastos_varios?.cafeteria || 0}" class="w-full bg-black/50 p-4 rounded-2xl text-white border border-white/5 outline-none">
                            </div>
                            <div class="space-y-2">
                                <label class="text-[8px] orbitron text-slate-500">ADELANTO TÉC.</label>
                                <input type="number" id="f-adelanto" value="${ordenActiva.gastos_varios?.adelanto_tecnico || 0}" class="w-full bg-black/50 p-4 rounded-2xl text-white border border-white/5 outline-none">
                            </div>
                        </div>
                        <label class="text-[8px] orbitron text-emerald-400 mb-2 block">ABONO CLIENTE ($)</label>
                        <input type="number" id="f-abono" value="${ordenActiva.abonos || 0}" class="w-full bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-[2rem] text-3xl font-black text-emerald-400 orbitron outline-none">
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative">
                        <div class="flex justify-between items-end mb-12">
                            <div>
                                <p class="orbitron text-[12px] text-cyan-400 uppercase italic font-black mb-4">Total Misión</p>
                                <h2 id="total-factura" class="orbitron text-7xl md:text-9xl font-black text-white italic tracking-tighter shadow-text-glow">$ 0</h2>
                            </div>
                            <div class="text-right pb-4">
                                <p class="text-[10px] text-orange-500 orbitron font-black mb-2 uppercase">Saldo Pendiente</p>
                                <p id="saldo-display" class="text-4xl font-black text-white orbitron italic">$ 0</p>
                            </div>
                        </div>

                        <div id="items-container" class="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar"></div>

                        <div class="grid grid-cols-2 gap-6 mt-12">
                            <button id="btnAddRepuesto" class="py-7 bg-white/5 rounded-3xl border border-white/10 orbitron text-[11px] font-black hover:bg-cyan-500/10 transition-all">+ AGREGAR REPUESTO</button>
                            <button id="btnAddMano" class="py-7 bg-cyan-500/5 rounded-3xl border border-cyan-500/20 text-cyan-400 orbitron text-[11px] font-black hover:bg-cyan-500 hover:text-black transition-all">+ AGREGAR MANO OBRA</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button id="btnPagarBold" class="py-10 bg-gradient-to-br from-red-600 to-red-900 text-white rounded-[2.5rem] orbitron font-black text-[12px] shadow-2xl uppercase tracking-widest hover:scale-[1.02] transition-all">
                            <i class="fas fa-bolt mr-3"></i> LINK DE PAGO BOLD
                        </button>
                        <button id="btnSincronizar" class="py-10 bg-white text-black rounded-[2.5rem] orbitron font-black text-[12px] shadow-2xl uppercase tracking-widest hover:scale-[1.02] transition-all">
                            🛰️ SINCRONIZACIÓN NEXUS-X
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    const recalcularFinanzas = () => {
        let total = 0;
        ordenActiva.items.forEach(i => total += Number(i.venta || 0));
        
        const caf = Number(document.getElementById("f-cafeteria")?.value || 0);
        const ade = Number(document.getElementById("f-adelanto")?.value || 0);
        const abo = Number(document.getElementById("f-abono")?.value || 0);

        ordenActiva.gastos_varios = { cafeteria: caf, adelanto_tecnico: ade };
        ordenActiva.abonos = abo;
        ordenActiva.costos_totales = {
            total,
            costo: ordenActiva.items.reduce((acc, curr) => acc + Number(curr.costo || 0), 0) + caf + ade,
            saldo_pendiente: total - abo
        };

        document.getElementById("total-factura").innerText = `$ ${total.toLocaleString()}`;
        document.getElementById("saldo-display").innerText = `$ ${ordenActiva.costos_totales.saldo_pendiente.toLocaleString()}`;
        renderItems();
    };

    const renderItems = () => {
        const container = document.getElementById("items-container");
        container.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="flex flex-wrap items-center gap-6 bg-white/5 p-6 rounded-[2.5rem] border border-white/5 group hover:border-cyan-500/30 transition-all">
                <div class="flex-1 min-w-[200px]">
                    <span class="text-[9px] orbitron text-cyan-500 uppercase font-black italic mb-2 block">${item.tipo}</span>
                    <input onchange="editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" class="w-full bg-transparent border-none outline-none text-white font-bold text-sm uppercase">
                </div>
                <div class="flex gap-4 items-center">
                    <div class="text-center">
                        <span class="text-[8px] text-slate-500 block mb-1">COSTO</span>
                        <input type="number" onchange="editItemNexus(${idx}, 'costo', this.value)" value="${item.costo}" class="w-24 bg-black/40 p-4 rounded-2xl text-[11px] text-red-400 text-center border border-white/5 outline-none">
                    </div>
                    <div class="text-center">
                        <span class="text-[8px] text-slate-500 block mb-1">VENTA</span>
                        <input type="number" onchange="editItemNexus(${idx}, 'venta', this.value)" value="${item.venta}" class="w-32 bg-black/40 p-4 rounded-2xl text-sm text-emerald-400 text-center border border-emerald-500/20 outline-none font-bold">
                    </div>
                    <button onclick="removeItemNexus(${idx})" class="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">✕</button>
                </div>
            </div>`).join('');
    };

    const vincularAccionesTerminal = () => {
        // --- ACTUALIZACIÓN WHATSAPP LIMPIO ---
document.getElementById("btnWppDirect").onclick = () => {
    const placa = document.getElementById("f-placa").value;
    // Limpiamos el texto de la IA antes de enviar
    const bitacoraLimpia = ordenActiva.bitacora_ia.replace(/el sistema nexo se está escuchando/gi, "").trim();
    
    const linkPago = `https://bold.co/pay/tallerpro360-${placa.replace(/\s+/g, '')}`;
    
    let msg = `*🛰️ REPORTE TÉCNICO NEXUS-X*\n`;
    msg += `Vehículo: *${placa.toUpperCase()}*\n`;
    msg += `Estado: *${document.getElementById("f-estado").value}*\n\n`;
    msg += `*DETALLE DE MISIÓN:*\n`;
    ordenActiva.items.forEach(i => msg += `• ${i.desc.toUpperCase()} ($${Number(i.venta).toLocaleString()})\n`);
    msg += `\n*TOTAL:* $${ordenActiva.costos_totales.total.toLocaleString()}\n`;
    msg += `*SALDO:* $${ordenActiva.costos_totales.saldo_pendiente.toLocaleString()}\n\n`;
    msg += `*DIAGNÓSTICO:* _${bitacoraLimpia}_\n\n`;
    msg += `🔗 *PAGO BOLD:* ${linkPago}`;

    const phone = document.getElementById("f-telefono").value.replace(/\D/g, '');
    const finalPhone = phone.startsWith('57') ? phone : `57${phone}`;
    window.open(`https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(msg)}`, '_blank');
};

        // --- VEHICLE SCANNER MULTIMEDIA (Sugerencia 3) ---
        document.getElementById("btnCapturaFalla").onclick = () => {
            hablar("Iniciando escáner de vehículo. William, captura la evidencia.");
            const input = document.createElement('input');
            input.type = 'file'; input.accept = 'image/*,audio/*'; input.capture = 'environment';
            input.onchange = () => {
                hablar("Evidencia vinculada a la orden. Lista para reporte.");
                // Aquí podrías subir a Firebase Storage si lo deseas
            };
            input.click();
        };

        // --- DICTADO POR VOZ PRO (Sugerencia 1) ---
        document.getElementById("btnDictar").onclick = () => {
            if(!recognition) return hablar("Error de Hardware.");
            if(!isRecording) {
                hablar("William, el sistema Nexus está escuchando. Describe las fallas.");
                recognition.start();
                document.getElementById("rec-indicator").classList.remove("hidden");
                document.getElementById("btnDictar").innerText = "🛑 PARAR DICTADO";
                isRecording = true;
            } else {
                recognition.stop();
                document.getElementById("rec-indicator").classList.add("hidden");
                document.getElementById("btnDictar").innerText = "🎤 DICTAR";
                isRecording = false;
                hablar("Dictado consolidado.");
            }

            recognition.onresult = (e) => {
                let interina = "";
                for (let i = e.resultIndex; i < e.results.length; ++i) {
                    interina += e.results[i][0].transcript;
                }
                ordenActiva.bitacora_ia = interina;
                document.getElementById("ai-log-display").innerText = interina;
            };
        };

        // --- LINK PAGO BOLD (Sugerencia 4) ---
        document.getElementById("btnPagarBold").onclick = () => {
            hablar("Generando link de pago Bold.");
            document.getElementById("btnWppDirect").click();
        };

        // Otros botones existentes
        document.getElementById("btnAddRepuesto").onclick = () => {
            ordenActiva.items.push({ tipo: 'REPUESTO', desc: 'NUEVO REPUESTO', costo: 0, venta: 0 });
            recalcularFinanzas();
        };

        document.getElementById("btnAddMano").onclick = () => {
            ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: 'SERVICIO TÉCNICO', costo: 0, venta: 0 });
            recalcularFinanzas();
        };

        // --- MOTOR DE GENERACIÓN PDF NEXUS-X (Sustituir dentro de vincularAccionesTerminal) ---
document.getElementById("btnDescargarOT").onclick = async () => {
    const { jsPDF } = window.jspdf;
    const docPdf = new jsPDF();
    const empresaNombre = localStorage.getItem("nexus_empresaNombre") || "TALLER PRO 360";
    const empresaNit = localStorage.getItem("nexus_empresaNit") || "NIT: 900.000.000-1";

    hablar("Generando reporte empresarial en PDF.");

    // 1. ENCABEZADO ESTILO NEXUS
    docPdf.setFillColor(1, 4, 9); // Color oscuro Nexus
    docPdf.rect(0, 0, 210, 40, 'F');
    docPdf.setTextColor(0, 242, 255); // Cian Nexus
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(22);
    docPdf.text("NEXUS_OT", 15, 20);
    
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFontSize(10);
    docPdf.text(empresaNombre.toUpperCase(), 15, 28);
    docPdf.setFontSize(8);
    docPdf.text(empresaNit, 15, 33);

    // 2. DATOS DE LA MISIÓN
    docPdf.setTextColor(40, 40, 40);
    docPdf.setFontSize(12);
    docPdf.text(`ORDEN DE SERVICIO: ${ordenActiva.placa.toUpperCase()}`, 15, 55);
    docPdf.setFontSize(10);
    docPdf.text(`CLIENTE: ${ordenActiva.cliente.toUpperCase()}`, 15, 62);
    docPdf.text(`FECHA: ${new Date().toLocaleDateString()}`, 150, 55);

    // 3. TABLA DE ÍTEMS
    const tablaData = ordenActiva.items.map(i => [
        i.tipo, 
        i.desc.toUpperCase(), 
        `$ ${Number(i.venta).toLocaleString()}`
    ]);

    docPdf.autoTable({
        startY: 70,
        head: [['TIPO', 'DESCRIPCIÓN', 'VALOR']],
        body: tablaData,
        headStyles: { fillColor: [1, 4, 9], textColor: [0, 242, 255] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // 4. DIAGNÓSTICO (Limpiando rastro de IA)
    const diagnosticoLimpio = ordenActiva.bitacora_ia.replace(/el sistema nexo se está escuchando/gi, "").trim();
    let finalY = docPdf.lastAutoTable.finalY + 15;
    docPdf.setFont("helvetica", "bold");
    docPdf.text("DIAGNÓSTICO TÉCNICO:", 15, finalY);
    docPdf.setFont("helvetica", "italic");
    docPdf.setFontSize(9);
    docPdf.text(diagnosticoLimpio || "Sin diagnóstico registrado.", 15, finalY + 7, { maxWidth: 180 });

    // 5. TOTALES
    finalY += 30;
    docPdf.setFontSize(14);
    docPdf.setFont("helvetica", "bold");
    docPdf.text(`TOTAL A PAGAR: $ ${ordenActiva.costos_totales.total.toLocaleString()}`, 130, finalY);
    docPdf.setFontSize(10);
    docPdf.text(`SALDO PENDIENTE: $ ${ordenActiva.costos_totales.saldo_pendiente.toLocaleString()}`, 130, finalY + 8);

    docPdf.save(`OT_${ordenActiva.placa}_${Date.now()}.pdf`);
};

        document.getElementById("btnEliminarOT").onclick = async () => {
            if(!confirm("¿Borrar misión de la nube?")) return;
            if(ordenActiva.id) {
                await deleteDoc(doc(db, "ordenes", ordenActiva.id));
                document.getElementById("nexus-terminal").classList.add("hidden");
            }
        };

        document.getElementById("btnSincronizar").onclick = async () => {
            const btn = document.getElementById("btnSincronizar");
            btn.innerText = "🛰️ SINCRONIZANDO...";
            try {
                recalcularFinanzas();
                const idOT = ordenActiva.id || `OT_${Date.now()}`;
                const dataFinal = {
                    ...ordenActiva,
                    empresaId,
                    placa: document.getElementById("f-placa").value.toUpperCase(),
                    cliente: document.getElementById("f-cliente").value,
                    telefono: document.getElementById("f-telefono").value,
                    estado: document.getElementById("f-estado").value,
                    updatedAt: serverTimestamp()
                };
                await setDoc(doc(db, "ordenes", idOT), dataFinal);
                hablar("Misión sincronizada.");
                document.getElementById("nexus-terminal").classList.add("hidden");
            } catch (e) { btn.innerText = "ERROR"; }
        };
    };

    window.editItemNexus = (idx, campo, valor) => { ordenActiva.items[idx][campo] = valor; recalcularFinanzas(); };
    window.removeItemNexus = (idx) => { ordenActiva.items.splice(idx, 1); recalcularFinanzas(); };
    window.abrirTerminalNexus = (id) => abrirTerminal(id);

    const vincularNavegacion = () => {
        document.getElementById("btnNewMission").onclick = () => abrirTerminal();
        document.querySelectorAll(".fase-tab").forEach(tab => tab.onclick = () => { faseActual = tab.dataset.fase; cargarGrid(faseActual); });
    };

    const cargarGrid = (fase) => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const counts = { COTIZACION: 0, INGRESO: 0, DIAGNOSTICO: 0, REPARACION: 0, LISTO: 0 };
            const grilla = [];
            snap.docs.forEach(d => {
                const dt = d.data();
                if(counts.hasOwnProperty(dt.estado)) counts[dt.estado]++;
                if(dt.estado === fase) grilla.push({ id: d.id, ...dt });
            });
            Object.keys(counts).forEach(f => { if(document.getElementById(`count-${f}`)) document.getElementById(`count-${f}`).innerText = counts[f]; });
            document.getElementById("grid-ordenes").innerHTML = grilla.map(o => `
                <div onclick="abrirTerminalNexus('${o.id}')" class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 hover:border-cyan-500/50 transition-all cursor-pointer group">
                    <span class="orbitron text-3xl font-black text-white group-hover:text-cyan-400">${o.placa}</span>
                    <p class="text-[9px] text-slate-500 orbitron mt-2 italic tracking-widest">${o.cliente || 'ANÓNIMO'}</p>
                    <div class="mt-6 flex justify-between items-center">
                        <span class="text-xl font-black text-white orbitron">$ ${Number(o.costos_totales?.total || 0).toLocaleString()}</span>
                        <div class="h-10 w-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400"><i class="fas fa-chevron-right"></i></div>
                    </div>
                </div>`).join('');
        });
    };

    renderBase();
}
