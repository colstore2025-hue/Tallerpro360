/**
 * ordenes.js - NEXUS-X COMMAND CENTER V5.3 "GALAXY" 🛰️
 * Estado: Optimizado & Saneado
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
    recognition.continuous = true; 
    recognition.interimResults = true; 
}

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;
    let faseActual = 'INGRESO';
    let isRecording = false;

    // --- RENDER BASE ---
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
        cargarEscuchaGlobal();
    };

    // --- CARGA DE DATOS (REAL-TIME) ---
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
                <div onclick="window.abrirTerminalNexus('${o.id}')" class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 hover:border-cyan-500/50 transition-all cursor-pointer group">
                    <span class="orbitron text-3xl font-black text-white group-hover:text-cyan-400">${o.placa}</span>
                    <p class="text-[9px] text-slate-500 orbitron mt-2 italic tracking-widest">${o.cliente || 'ANÓNIMO'}</p>
                    <div class="mt-6 flex justify-between items-center">
                        <span class="text-xl font-black text-white orbitron">$ ${Number(o.costos_totales?.total || 0).toLocaleString()}</span>
                        <div class="h-10 w-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400"><i class="fas fa-chevron-right"></i></div>
                    </div>
                </div>`).join('');
            }
        });
    };

    // --- TERMINAL DE COMANDO ---
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

    // 1. RENDER DE LA TERMINAL CON TÍTULOS CLAROS Y MODALIDAD HÍBRIDA
const renderTerminal = () => {
    const modal = document.getElementById("nexus-terminal");
    modal.innerHTML = `
    <div class="max-w-[1400px] mx-auto pb-20 animate-in zoom-in duration-300">
        <div class="flex flex-wrap justify-between items-center gap-6 mb-10 bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl">
            <div class="flex items-center gap-6">
                <input id="f-placa" value="${ordenActiva.placa}" class="bg-transparent text-5xl font-black orbitron text-cyan-400 outline-none w-52 uppercase" placeholder="PLACA">
                <select id="f-estado" class="bg-black text-cyan-400 orbitron text-[10px] p-4 rounded-2xl border border-cyan-500/20 outline-none">
                    ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                </select>
            </div>
            <div class="flex gap-3">
                <button id="btnEliminarOT" class="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 text-xl hover:bg-red-500 hover:text-white transition-all"><i class="fas fa-trash"></i></button>
                <button id="btnCloseTerminal" class="w-14 h-14 rounded-2xl bg-white/10 text-white font-black text-2xl">✕</button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4 space-y-8">
                <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5">
                    <label class="text-[9px] text-slate-500 font-black uppercase mb-4 block tracking-[0.2em]">Información del Cliente</label>
                    <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-white/5 p-6 rounded-3xl mb-4 border border-white/5 outline-none font-bold uppercase" placeholder="NOMBRE">
                    <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-white/5 p-6 rounded-3xl border border-white/5 outline-none" placeholder="WHATSAPP">
                </div>

                <div class="bg-black p-10 rounded-[3.5rem] border border-cyan-500/20 shadow-glow-cyan">
                    <div class="flex justify-between items-center mb-6">
                        <span class="orbitron text-[10px] text-cyan-400 font-black italic">SCANNER DE FALLAS</span>
                        <div id="rec-indicator" class="h-3 w-3 bg-red-600 rounded-full hidden animate-pulse"></div>
                    </div>
                    <textarea id="ai-log-display" class="w-full bg-white/5 p-6 rounded-3xl text-xs h-40 outline-none border border-white/5 italic text-slate-300 leading-relaxed resize-none focus:border-cyan-500/50 transition-all">${ordenActiva.bitacora_ia || ''}</textarea>
                    <div class="grid grid-cols-2 gap-4 mt-6">
                        <button id="btnDictar" class="py-5 bg-cyan-500 text-black rounded-2xl orbitron text-[9px] font-black">🎤 DICTAR</button>
                        <button id="btnMultimedia" class="py-5 bg-white/10 text-white rounded-2xl border border-white/20 orbitron text-[9px] font-black"><i class="fas fa-camera mr-2"></i> FOTOS</button>
                    </div>
                </div>

                <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-emerald-500/10 space-y-6">
                    <div>
                        <label class="text-[8px] text-red-400 font-black uppercase mb-2 block tracking-widest">[EGRESO] Gastos Varios / Insumos</label>
                        <input type="number" id="f-gastos-varios" value="${ordenActiva.finanzas?.gastos_varios || 0}" class="w-full bg-black/50 p-5 rounded-2xl text-white border border-white/5 text-xl font-bold" onchange="recalcularFinanzas()">
                    </div>
                    <div>
                        <label class="text-[8px] text-red-400 font-black uppercase mb-2 block tracking-widest">[EGRESO] Adelanto a Técnico</label>
                        <input type="number" id="f-adelanto-tecnico" value="${ordenActiva.finanzas?.adelanto_tecnico || 0}" class="w-full bg-black/50 p-5 rounded-2xl text-white border border-white/5 text-xl font-bold" onchange="recalcularFinanzas()">
                    </div>
                    <div class="pt-4 border-t border-white/5">
                        <label class="text-[8px] text-emerald-400 font-black uppercase mb-2 block tracking-widest">[INGRESO] Anticipo del Cliente (Efectivo)</label>
                        <input type="number" id="f-anticipo-cliente" value="${ordenActiva.finanzas?.anticipo_cliente || 0}" class="w-full bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-[2rem] text-3xl font-black text-emerald-400 orbitron" onchange="recalcularFinanzas()">
                    </div>
                </div>
            </div>

            <div class="lg:col-span-8 space-y-8">
                <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative">
                    <div class="flex justify-between items-end mb-12">
                        <div>
                            <p class="orbitron text-[12px] text-cyan-400 uppercase italic font-black">Total Facturación</p>
                            <h2 id="total-factura" class="orbitron text-7xl md:text-9xl font-black text-white italic tracking-tighter">$ 0</h2>
                        </div>
                        <div class="text-right">
                            <div id="saldo-display" class="text-3xl font-black text-white orbitron italic"></div>
                        </div>
                    </div>
                    
                    <div class="flex gap-4 mb-6">
                        <span class="text-[9px] text-slate-500 font-black uppercase">Detalle de Repuestos y Servicios</span>
                    </div>
                    
                    <div id="items-container" class="space-y-4 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar"></div>
                    
                    <div class="grid grid-cols-2 gap-6 mt-12">
                        <button id="btnAddRepuesto" class="py-7 bg-white/5 rounded-3xl border border-white/10 orbitron text-[11px] font-black hover:bg-white/10 transition-all">+ REPUESTO</button>
                        <button id="btnAddMano" class="py-7 bg-cyan-500/5 rounded-3xl border border-cyan-500/20 text-cyan-400 orbitron text-[11px] font-black hover:bg-cyan-500/10 transition-all">+ MANO OBRA</button>
                    </div>
                </div>

                <button id="btnSincronizar" class="w-full py-10 bg-white text-black rounded-[2.5rem] orbitron font-black text-[15px] uppercase tracking-[0.5em] shadow-glow-white hover:bg-cyan-400 transition-all">
                    🛰️ SINCRONIZAR CON NEXUS-X
                </button>
            </div>
        </div>
    </div>`;

    vincularAccionesTerminal();
    recalcularFinanzas();
};

    // --- ACCIONES Y LOGICA ---
    const vincularAccionesTerminal = () => {
        document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
        
        // 1. REFORMA DEL ENVÍO DE WHATSAPP (Dentro de vincularAccionesTerminal)
document.getElementById("btnWppDirect").onclick = async () => {
    const placa = document.getElementById("f-placa").value.trim().toUpperCase();
    const cliente = document.getElementById("f-cliente").value;
    const estado = document.getElementById("f-estado").value;
    const finanzas = ordenActiva.costos_totales;
    
    // Configuración del mensaje según estado de la misión
    let tituloReporte = (estado === 'COTIZACION' || estado === 'INGRESO') 
        ? "🛰️ PROPUESTA TÉCNICA - NEXUS-X" 
        : "🛰️ REPORTE DE LIQUIDACIÓN - NEXUS-X";

    let detalleItems = ordenActiva.items.map(i => `- ${i.desc}: *$${Number(i.venta).toLocaleString()}*`).join('\n');
    
    // Lógica de anticipo dinámico
    let bloquePago = "";
    if (estado === 'COTIZACION' || estado === 'INGRESO') {
        const sugerenciaAnticipo = Math.ceil(finanzas.total_venta * 0.5); // Sugiere el 50%
        bloquePago = `\n💰 *ANTICIPO REQUERIDO:* $${sugerenciaAnticipo.toLocaleString()}\n_Para autorizar la compra de repuestos e inicio de labor._`;
    } else {
        bloquePago = `\n💳 *SALDO PENDIENTE:* $${finanzas.saldo_pendiente.toLocaleString()}`;
    }

    const linkPago = `https://bold.co/pay/tallerpro360-${placa.replace(/\s+/g, '')}`;

    let msg = `*${tituloReporte}*\n\n` +
              `Vehículo: *${placa}*\n` +
              `Cliente: ${cliente}\n` +
              `---------------------------\n` +
              `*RESUMEN DE TRABAJO:*\n${detalleItems}\n` +
              `---------------------------\n` +
              `*TOTAL ESTIMADO:* $${finanzas.gran_total.toLocaleString()}\n` +
              bloquePago + `\n\n` +
              `🔗 *PAGAR AQUÍ:* ${linkPago}\n\n` +
              `_Enviado desde TallerPRO360 Nexus-X_`;

    const phone = document.getElementById("f-telefono").value.replace(/\D/g, '');
    window.open(`https://api.whatsapp.com/send?phone=57${phone.slice(-10)}&text=${encodeURIComponent(msg)}`, '_blank');
};

// 2. REFORMA DEL GENERADOR DE PDF (Con desglose de IVA 19%)
const generarPDF = async () => {
    const { jsPDF } = window.jspdf;
    const docPdf = new jsPDF();
    hablar("Generando documento legal de taller.");

    // Obtener datos de la empresa para el encabezado
    const empSnap = await getDoc(doc(db, "empresas", empresaId));
    const empresa = empSnap.data() || { nombre: "TALLER PRO 360", nit: "900.000.000-1" };

    // Estilo Encabezado Aeroespacial (Fondo Oscuro)
    docPdf.setFillColor(1, 4, 9);
    docPdf.rect(0, 0, 210, 50, 'F');
    docPdf.setTextColor(0, 242, 255);
    docPdf.setFontSize(24);
    docPdf.text(empresa.nombre.toUpperCase(), 15, 25);
    docPdf.setFontSize(10);
    docPdf.text(`NIT: ${empresa.nit} | TERMINAL NEXUS-X`, 15, 35);

    // Datos de la Orden
    docPdf.setTextColor(40, 40, 40);
    docPdf.setFontSize(12);
    docPdf.text(`ORDEN DE SERVICIO: ${ordenActiva.placa}`, 15, 65);
    docPdf.text(`FECHA: ${new Date().toLocaleDateString()}`, 150, 65);
    docPdf.text(`CLIENTE: ${ordenActiva.cliente.toUpperCase()}`, 15, 75);

    // Tabla de ítems con desglose
    const tableBody = ordenActiva.items.map(i => [
        i.desc.toUpperCase(), 
        `$${Number(i.venta).toLocaleString()}`
    ]);

    docPdf.autoTable({
        startY: 85,
        head: [['DESCRIPCIÓN DE SERVICIO / REPUESTO', 'VALOR']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [1, 4, 9], textColor: [0, 242, 255] },
        styles: { fontSize: 9 }
    });

    // Bloque de Totales e Impuestos (Colombia)
    const finalY = docPdf.lastAutoTable.finalY + 10;
    docPdf.setFontSize(10);
    
    let subtotal = ordenActiva.costos_totales.total_venta;
    let iva = ordenActiva.costos_totales.iva;
    let total = ordenActiva.costos_totales.gran_total;

    docPdf.text(`SUBTOTAL:`, 140, finalY);
    docPdf.text(`$${subtotal.toLocaleString()}`, 180, finalY, { align: 'right' });
    
    docPdf.text(`IVA (19%):`, 140, finalY + 7);
    docPdf.text(`$${iva.toLocaleString()}`, 180, finalY + 7, { align: 'right' });

    docPdf.setFontSize(13);
    docPdf.setFont(undefined, 'bold');
    docPdf.text(`TOTAL A PAGAR:`, 140, finalY + 15);
    docPdf.text(`$${total.toLocaleString()}`, 180, finalY + 15, { align: 'right' });

    // Pie de página legal
    docPdf.setFontSize(8);
    docPdf.setFont(undefined, 'normal');
    docPdf.text("Este documento es un reporte técnico de servicio. No constituye factura de venta para efectos tributarios según la normativa vigente.", 15, 280);

    docPdf.save(`OT_${ordenActiva.placa}_TallerPRO360.pdf`);
};
        document.getElementById("btnPagarBold").onclick = async () => {
            hablar("William, abriendo terminal de pago Bold.");
            const empSnap = await getDoc(doc(db, "empresas", empresaId));
            const boldKey = empSnap.data()?.bold_api_key;
            if (!boldKey) return Swal.fire('Error', 'Configura la API KEY en Ajustes.', 'error');

            new window.BoldCheckout({
                orderId: `NXS-${ordenActiva.placa}-${Date.now().toString().slice(-4)}`,
                amount: ordenActiva.costos_totales.saldo_pendiente,
                currency: 'COP',
                description: `Liquidación Final - ${ordenActiva.placa}`,
                apiKey: boldKey,
                redirectionUrl: 'https://tallerpro360.vercel.app/success'
            }).open();
        };

        document.getElementById("btnDescargarOT").onclick = () => generarPDF();
        
        document.getElementById("btnSincronizar").onclick = async () => {
            const btn = document.getElementById("btnSincronizar");
            btn.innerText = "🛰️ GUARDANDO...";
            // 1. ACTUALIZA LA INICIALIZACIÓN DE ordenActiva (Cuando creas una nueva misión)
ordenActiva = {
    placa: '', cliente: '', telefono: '', estado: 'INGRESO', 
    items: [], // Ahora cada ítem tendrá: {tipo, desc, costo, venta}
    bitacora_ia: '', 
    // SECCIÓN DE GASTOS E INGRESOS CLAROS
    finanzas: {
        gastos_varios: 0,       // Insumos menores (tornillería, etc)
        adelanto_tecnico: 0,   // Pago parcial al mecánico
        anticipo_cliente: 0,   // Dinero que el cliente YA entregó
        impuesto_tipo: 'REGIMEN_SIMPLIFICADO' // o 'IVA_19'
    },
    costos_totales: { total_venta: 0, total_costo: 0, utilidad: 0, iva: 0, gran_total: 0, saldo: 0 }
};

// 2. REFORMA TOTAL DE LA FUNCIÓN DE CÁLCULO
const recalcularFinanzas = () => {
    let sumaVentaBruta = 0;
    let sumaCostoRepuestos = 0;

    ordenActiva.items.forEach(i => {
        sumaVentaBruta += Number(i.venta || 0);
        sumaCostoRepuestos += Number(i.costo || 0);
    });

    // Captura de valores de los inputs con IDs claros
    const g_varios = Number(document.getElementById("f-gastos-varios")?.value || 0);
    const a_tecnico = Number(document.getElementById("f-adelanto-tecnico")?.value || 0);
    const a_cliente = Number(document.getElementById("f-anticipo-cliente")?.value || 0);
    
    // Lógica de Impuestos (Colombia)
    let valorIVA = 0;
    if (ordenActiva.finanzas.impuesto_tipo === 'IVA_19') {
        valorIVA = sumaVentaBruta * 0.19;
    }

    const granTotal = sumaVentaBruta + valorIVA;
    const costoTotalOperativo = sumaCostoRepuestos + g_varios + a_tecnico;
    const utilidadNeta = sumaVentaBruta - (sumaCostoRepuestos + g_varios); // El adelanto al técnico es parte de la utilidad, no gasto de material

    ordenActiva.costos_totales = {
        total_venta: sumaVentaBruta,
        total_costo: costoTotalOperativo,
        iva: valorIVA,
        gran_total: granTotal,
        utilidad: utilidadNeta,
        saldo_pendiente: granTotal - a_cliente
    };

    // Actualización de la UI con etiquetas claras
    if(document.getElementById("total-factura")) {
        document.getElementById("total-factura").innerText = `$ ${granTotal.toLocaleString()}`;
        document.getElementById("saldo-display").innerHTML = `
            <span class="text-slate-500 text-xs uppercase block">Saldo Pendiente Cliente</span>
            $ ${ordenActiva.costos_totales.saldo_pendiente.toLocaleString()}
        `;
        // Mini-indicador de utilidad para el gerente (invisible en el PDF)
        console.log("Utilidad Estimada: ", utilidadNeta);
    }
    
    renderItems(); // Refresca la lista para mostrar cambios
};

        // Dictado por voz
        document.getElementById("btnDictar").onclick = () => {
            if(!isRecording) {
                hablar("Sistema Nexus escuchando.");
                recognition?.start();
                isRecording = true;
                document.getElementById("rec-indicator").classList.remove("hidden");
            } else {
                recognition?.stop();
                isRecording = false;
                document.getElementById("rec-indicator").classList.add("hidden");
            }
        };

        if(recognition) {
            recognition.onresult = (e) => {
                const text = Array.from(e.results).map(r => r[0].transcript).join('');
                ordenActiva.bitacora_ia = text;
                document.getElementById("ai-log-display").innerText = text;
            };
        }

        document.getElementById("btnAddRepuesto").onclick = () => { ordenActiva.items.push({ tipo: 'REPUESTO', desc: 'NUEVO REPUESTO', costo: 0, venta: 0 }); recalcularFinanzas(); };
        document.getElementById("btnAddMano").onclick = () => { ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: 'SERVICIO TÉCNICO', costo: 0, venta: 0 }); recalcularFinanzas(); };
    };

    const recalcularFinanzas = () => {
        let totalVenta = 0;
        let totalCosto = 0;
        ordenActiva.items.forEach(i => {
            totalVenta += Number(i.venta || 0);
            totalCosto += Number(i.costo || 0);
        });
        
        const caf = Number(document.getElementById("f-cafeteria")?.value || 0);
        const ade = Number(document.getElementById("f-adelanto")?.value || 0);
        const abo = Number(document.getElementById("f-abono")?.value || 0);

        ordenActiva.costos_totales = {
            total: totalVenta,
            costo: totalCosto + caf + ade,
            saldo_pendiente: totalVenta - abo
        };

        document.getElementById("total-factura").innerText = `$ ${totalVenta.toLocaleString()}`;
        document.getElementById("saldo-display").innerText = `Saldo: $ ${ordenActiva.costos_totales.saldo_pendiente.toLocaleString()}`;
        renderItems();
    };

    // 2. RENDER DE ÍTEMS CON COSTO Y VENTA (VISTA GERENCIAL)
const renderItems = () => {
    const container = document.getElementById("items-container");
    container.innerHTML = ordenActiva.items.map((item, idx) => `
        <div class="grid grid-cols-1 md:grid-cols-12 items-center gap-4 bg-white/5 p-6 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all">
            <div class="md:col-span-6">
                <span class="text-[8px] orbitron ${item.tipo === 'REPUESTO' ? 'text-orange-400' : 'text-cyan-400'} uppercase font-black">${item.tipo}</span>
                <input onchange="window.editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" class="w-full bg-transparent outline-none text-white text-sm uppercase font-bold mt-1" placeholder="Descripción...">
            </div>
            <div class="md:col-span-2">
                <label class="text-[7px] text-slate-500 block mb-1 uppercase">Costo $</label>
                <input type="number" onchange="window.editItemNexus(${idx}, 'costo', this.value)" value="${item.costo || 0}" class="w-full bg-black/40 p-3 rounded-xl text-red-400 text-center text-xs font-bold border border-red-900/20" placeholder="Costo">
            </div>
            <div class="md:col-span-3">
                <label class="text-[7px] text-slate-500 block mb-1 uppercase">Venta (Publico) $</label>
                <input type="number" onchange="window.editItemNexus(${idx}, 'venta', this.value)" value="${item.venta || 0}" class="w-full bg-black/40 p-3 rounded-xl text-emerald-400 text-center text-sm font-black border border-emerald-900/20" placeholder="Venta">
            </div>
            <div class="md:col-span-1 text-right">
                <button onclick="window.removeItemNexus(${idx})" class="text-red-500 hover:text-white transition-all p-2">✕</button>
            </div>
        </div>`).join('');
};

    const generarPDF = () => {
        const { jsPDF } = window.jspdf;
        const docPdf = new jsPDF();
        hablar("Generando reporte PDF.");
        
        docPdf.setFillColor(1, 4, 9);
        docPdf.rect(0, 0, 210, 40, 'F');
        docPdf.setTextColor(0, 242, 255);
        docPdf.setFontSize(22);
        docPdf.text("NEXUS_OT", 15, 25);
        
        docPdf.setTextColor(40, 40, 40);
        docPdf.text(`ORDEN: ${ordenActiva.placa}`, 15, 55);
        
        const data = ordenActiva.items.map(i => [i.desc, `$${Number(i.venta).toLocaleString()}`]);
        docPdf.autoTable({
            startY: 70,
            head: [['DESCRIPCIÓN', 'VALOR']],
            body: data,
            headStyles: { fillColor: [1, 4, 9], textColor: [0, 242, 255] }
        });
        
        docPdf.save(`OT_${ordenActiva.placa}.pdf`);
    };

    // --- GLOBALES PARA EL DOM ---
    window.editItemNexus = (idx, campo, valor) => { ordenActiva.items[idx][campo] = valor; recalcularFinanzas(); };
    window.removeItemNexus = (idx) => { ordenActiva.items.splice(idx, 1); recalcularFinanzas(); };
    window.abrirTerminalNexus = (id) => abrirTerminal(id);

    const vincularNavegacion = () => {
        document.getElementById("btnNewMission").onclick = () => abrirTerminal();
        document.querySelectorAll(".fase-tab").forEach(tab => {
            tab.onclick = () => {
                faseActual = tab.dataset.fase;
                cargarEscuchaGlobal();
            };
        });
    };

    renderBase();
}
