/**
 * 🦾 NEXUS-X TERMINATOR CORE V22.6 - FINANZAS ELITE
 * ESTRATEGIA: QUANTUM-SAP 2030 VISUAL AUDIT + PREDICTIVE BURN-RATE
 * OBJETIVO: Dashboards de Combustible Financiero + Autonomía de Caja + Reporte PDF
 * Director: William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, getDocs, onSnapshot, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

// --- MOTOR DE INYECCIÓN DE LIBRERÍAS DE ÉLITE ---
const loadNexusDep = (id, src) => new Promise(res => {
    if (window[id]) return res();
    const s = document.createElement('script');
    s.src = src; s.onload = res; document.head.appendChild(s);
});

export default async function finanzasElite(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let chartTermometro = null;
    let activeListeners = [];
    
    let dbData = { 
        ingresos: 0, gastos: 0, comisiones: 0, rampa: 0, stock: 0, 
        runway: 0, burnRate: 0 
    };

    const renderLayout = async () => {
        // Carga paralela de motores: Gráficas, PDF y Excel
        await Promise.all([
            loadNexusDep('Chart', "https://cdn.jsdelivr.net/npm/chart.js"),
            loadNexusDep('jspdf', "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
            loadNexusDep('XLSX', "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.full.min.js")
        ]);

        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in duration-1000 pb-40 bg-[#010409] min-h-screen text-white font-sans selection:bg-cyan-500">
            
            <header class="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-12 border-b-2 border-cyan-500/20 pb-10 gap-8 relative">
                <div class="absolute -top-10 left-0 text-[120px] font-black opacity-5 italic select-none orbitron uppercase">Elite</div>
                <div class="relative z-10">
                    <h1 class="orbitron text-7xl font-black italic tracking-tighter uppercase leading-none text-white">
                        FINANZAS <span class="text-cyan-400">ELITE</span>
                    </h1>
                    <p class="text-[10px] text-slate-400 font-black uppercase tracking-[0.5em] orbitron mt-4 flex items-center gap-2">
                        <span class="w-2 h-2 bg-cyan-500 animate-pulse rounded-full"></span> 
                        Quantum-SAP Auditor // Authorized by W.J. Urquijo
                    </p>
                </div>
                
                <div class="flex flex-wrap gap-3 items-center bg-[#0d1117] p-5 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <div class="flex flex-col px-4 border-r border-white/10">
                        <label class="text-[8px] orbitron text-cyan-500 font-black mb-1 italic">RANGO ANALÍTICO</label>
                        <input type="date" id="fInicio" class="bg-transparent text-xs font-bold text-white outline-none">
                        <input type="date" id="fFin" class="bg-transparent text-xs font-bold text-white outline-none">
                    </div>
                    <button id="btnPDF" class="px-6 py-4 bg-white text-black rounded-2xl flex items-center gap-3 hover:bg-cyan-400 transition-all font-black group">
                        <i class="fas fa-file-pdf group-hover:scale-125 transition-transform"></i>
                        <span class="orbitron text-[9px] uppercase">Brief Ejecutivo</span>
                    </button>
                    <button id="btnXLS" class="w-14 h-14 bg-[#0d1117] border border-emerald-500/30 text-emerald-500 rounded-2xl flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all shadow-lg">
                        <i class="fas fa-file-excel"></i>
                    </button>
                </div>
            </header>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                <div class="lg:col-span-5 flex flex-col gap-8">
                    <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center">
                        <h3 class="orbitron text-[11px] font-black text-cyan-400 uppercase mb-8 tracking-widest italic w-full text-left">Combustible Operativo</h3>
                        <div class="relative w-full h-[280px]">
                            <canvas id="chartTermometro"></canvas>
                            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-10">
                                <span id="txtUtilidad" class="text-4xl font-black orbitron text-white">$0</span>
                                <span class="text-[9px] orbitron text-slate-500 uppercase tracking-widest">Utilidad Neta</span>
                            </div>
                        </div>
                    </div>

                    <div class="bg-[#0d1117] border-t-4 border-red-600 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div class="flex justify-between items-start mb-4">
                            <h4 class="orbitron text-[10px] font-black text-red-500 uppercase tracking-widest italic">Autonomía Operativa (Runway)</h4>
                            <i class="fas fa-hourglass-half text-red-500/20 group-hover:animate-spin"></i>
                        </div>
                        <div class="flex items-baseline gap-2">
                            <span id="runway-days" class="text-6xl font-black orbitron text-white">0</span>
                            <span class="text-xs font-bold text-slate-500 uppercase italic">Días de Vida</span>
                        </div>
                        <p class="text-[8px] text-slate-600 uppercase mt-4 font-black tracking-tighter">
                            Basado en un Burn Rate de <span id="burn-rate-val" class="text-red-400">$0</span> / día
                        </p>
                    </div>
                </div>

                <div class="lg:col-span-7 space-y-6">
                    <div class="bg-gradient-to-br from-cyan-600 to-blue-900 p-10 rounded-[3rem] text-white shadow-2xl relative group">
                        <div class="absolute top-4 right-8 text-4xl opacity-20 group-hover:rotate-12 transition-transform"><i class="fas fa-brain"></i></div>
                        <h4 class="orbitron font-black text-[11px] uppercase mb-4 italic tracking-widest text-white/70">Nexus-AI Strategic Insight</h4>
                        <p id="ai-diagnostico" class="text-xl font-medium leading-tight italic border-l-4 border-white/30 pl-6">Iniciando escaneo de rampa y flujos...</p>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${renderKPI("Recaudo (1105)", "kpi-ingreso", "text-emerald-400", "fa-wallet")}
                        ${renderKPI("Rampa (1305)", "kpi-rampa", "text-cyan-400", "fa-microchip")}
                        ${renderKPI("Gastos (51)", "kpi-gasto", "text-red-400", "fa-file-invoice-dollar")}
                        ${renderKPI("Stock (14)", "kpi-stock", "text-amber-400", "fa-box-open")}
                    </div>
                </div>
            </div>

            <div class="mb-12 border-l-4 border-emerald-500 pl-8">
                <h3 class="text-[16px] font-black text-white uppercase tracking-[0.6em] orbitron italic">Performance <span class="text-emerald-500">& Nómina</span></h3>
                <div id="gridNomina" class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"></div>
            </div>

        </div>`;
        
        setupEvents();
        initTermometro();
        sincronizarNucleo();
    };

    const renderKPI = (label, id, color, icon) => `
        <div class="bg-[#0d1117] p-6 rounded-[2rem] border border-white/5 flex items-center justify-between group hover:border-cyan-500/20 transition-all">
            <div>
                <p class="text-[8px] orbitron text-slate-500 uppercase font-black mb-1">${label}</p>
                <h2 id="${id}" class="text-2xl font-black orbitron ${color}">$0</h2>
            </div>
            <i class="fas ${icon} text-slate-700 group-hover:${color} transition-all"></i>
        </div>`;

    const initTermometro = () => {
        const ctx = document.getElementById('chartTermometro').getContext('2d');
        chartTermometro = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Gastos', 'Comisiones', 'Utilidad'],
                datasets: [{
                    data: [1, 1, 1],
                    backgroundColor: ['#ef4444', '#f59e0b', '#06b6d4'],
                    borderWidth: 0,
                    cutout: '85%'
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                animation: { animateScale: true }
            }
        });
    };

    const sincronizarNucleo = async () => {
        const fInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const fFin = new Date();
        document.getElementById("fInicio").value = fInicio.toISOString().split('T')[0];
        document.getElementById("fFin").value = fFin.toISOString().split('T')[0];

        // 1. Auditoría Contable (PUC)
        const qCont = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        const snapCont = await getDocs(qCont);
        dbData.ingresos = 0; dbData.gastos = 0;
        
        snapCont.docs.forEach(d => {
            const m = d.data();
            const val = m.monto || 0;
            if (["ingreso_ot", "venta_repuestos", "saneamiento_deuda"].includes(m.tipo)) dbData.ingresos += val;
            if (["gasto_operativo", "compra_repuestos", "pago_nomina"].includes(m.tipo)) dbData.gastos += val;
        });

        // 2. Órdenes y Nómina
        const qOrd = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        const unsubOrd = onSnapshot(qOrd, (snap) => {
            dbData.rampa = 0; dbData.comisiones = 0;
            const nomina = {};
            
            snap.docs.forEach(d => {
                const o = d.data();
                const total = Number(o.costos_totales?.total || 0);
                
                if (['INGRESO', 'DIAGNOSTICO', 'REPARACION'].includes(o.estado)) dbData.rampa += total;
                if (['LISTO', 'ENTREGADO'].includes(o.estado)) {
                    const tecnico = o.tecnico_asignado || "POR_DEFINIR";
                    const mo = o.items?.filter(i => i.tipo === 'SERVICIO').reduce((acc, i) => acc + (Number(i.venta) * Number(i.cantidad)), 0) || 0;
                    const comi = mo * 0.30;
                    dbData.comisiones += comi;
                    if (!nomina[tecnico]) nomina[tecnico] = { total: 0, q: 0 };
                    nomina[tecnico].total += comi; nomina[tecnico].q += 1;
                }
            });
            renderNomina(nomina);
            updateUI();
        });
        activeListeners.push(unsubOrd);
    };

    const updateUI = () => {
        const u = dbData.ingresos - dbData.gastos - dbData.comisiones;
        
        // --- LÓGICA QUANTUM BURN-RATE & RUNWAY ---
        const diasDelMes = 30;
        const burnRateDiario = dbData.gastos / diasDelMes;
        const diasSupervivencia = burnRateDiario > 0 ? Math.floor(u / burnRateDiario) : "∞";

        // Actualización de IDs de Supervivencia
        const runwayDom = document.getElementById("runway-days");
        if(runwayDom) {
            runwayDom.innerText = diasSupervivencia;
            // Dinámica de color por riesgo
            runwayDom.className = "text-6xl font-black orbitron transition-colors " + 
                (diasSupervivencia < 10 ? "text-red-500" : (diasSupervivencia < 20 ? "text-amber-500" : "text-white"));
        }
        
        const burnRateDom = document.getElementById("burn-rate-val");
        if(burnRateDom) burnRateDom.innerText = `$${Math.round(burnRateDiario).toLocaleString()}`;

        // KPIs Estándar
        document.getElementById("kpi-ingreso").innerText = `$${dbData.ingresos.toLocaleString()}`;
        document.getElementById("kpi-rampa").innerText = `$${dbData.rampa.toLocaleString()}`;
        document.getElementById("kpi-gasto").innerText = `$${dbData.gastos.toLocaleString()}`;
        document.getElementById("txtUtilidad").innerText = `$${u.toLocaleString()}`;
        
        // Diagnóstico IA Proactivo con Runway
        const aiMsg = u > 0 ? 
            `ESTADO SALUDABLE: Tienes ${diasSupervivencia} días de autonomía operativa. Para extenderla a ${diasSupervivencia + 15} días, necesitas liquidar el 20% de la rampa ($${(dbData.rampa * 0.2).toLocaleString()}).` :
            `ALERTA DE INSOLVENCIA: El Burn Rate de $${Math.round(burnRateDiario).toLocaleString()} diario está consumiendo tu capital. Saneamiento de cartera urgente.`;
        document.getElementById("ai-diagnostico").innerText = aiMsg;

        if (chartTermometro) {
            chartTermometro.data.datasets[0].data = [dbData.gastos, dbData.comisiones, Math.max(0, u)];
            chartTermometro.update();
        }
    };

    const renderNomina = (data) => {
        const containerNomina = document.getElementById("gridNomina");
        if(!containerNomina) return;
        containerNomina.innerHTML = Object.entries(data).map(([n, s]) => `
            <div class="bg-[#0d1117] p-6 rounded-[2rem] border border-emerald-500/10 flex justify-between items-center group hover:bg-emerald-500/5 transition-all">
                <div>
                    <h4 class="text-xs font-black uppercase text-white">${n}</h4>
                    <p class="text-[8px] orbitron text-slate-500 uppercase">${s.q} Órdenes</p>
                </div>
                <div class="text-right">
                    <p class="text-lg font-black orbitron text-emerald-400">$${Math.round(s.total).toLocaleString()}</p>
                    <p class="text-[7px] text-slate-600 uppercase font-bold">Comisión 30%</p>
                </div>
            </div>`).join('');
    };

    const setupEvents = () => {
        document.getElementById("btnPDF").onclick = generarReportePDF;
        document.getElementById("btnXLS").onclick = exportarExcelForense;
    };

    async function generarReportePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const u = dbData.ingresos - dbData.gastos - dbData.comisiones;

        // Estética Quantum-SAP (Negro/Cian)
        doc.setFillColor(1, 4, 9); doc.rect(0, 0, 210, 297, 'F');
        doc.setTextColor(6, 182, 212); doc.setFontSize(22); doc.text("NEXUS-X EXECUTIVE BRIEF", 20, 30);
        
        doc.setTextColor(255, 255, 255); doc.setFontSize(10);
        doc.text(`Taller ID: ${empresaId}`, 20, 40);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 20, 45);

        doc.setDrawColor(6, 182, 212); doc.line(20, 50, 190, 50);

        // Bloque de Resultados
        const rows = [
            ["CONCEPTO", "VALOR AUDITADO"],
            ["Recaudo Efectivo (1105)", `$${dbData.ingresos.toLocaleString()}`],
            ["Gastos Operativos (51)", `$${dbData.gastos.toLocaleString()}`],
            ["Pasivo Laboral (Comisiones)", `$${dbData.comisiones.toLocaleString()}`],
            ["UTILIDAD NETA REAL", `$${u.toLocaleString()}`],
            ["Capital en Rampa (Por Cobrar)", `$${dbData.rampa.toLocaleString()}`]
        ];

        let y = 70;
        rows.forEach((r, i) => {
            if(i === 0) doc.setTextColor(6, 182, 212); else doc.setTextColor(255, 255, 255);
            doc.text(r[0], 25, y); doc.text(r[1], 140, y);
            y += 10;
        });

        doc.save(`Nexus_Audit_${empresaId}.pdf`);
    }

    async function exportarExcelForense() {
        const ws = window.XLSX.utils.json_to_sheet([
            { Concepto: "Recaudo", Valor: dbData.ingresos },
            { Concepto: "Gastos", Valor: dbData.gastos },
            { Concepto: "Comisiones", Valor: dbData.comisiones },
            { Concepto: "Utilidad", Valor: dbData.ingresos - dbData.gastos - dbData.comisiones },
            { Concepto: "En Rampa", Valor: dbData.rampa }
        ]);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
        window.XLSX.writeFile(wb, `Forense_Nexus_${empresaId}.xlsx`);
    }

    renderLayout();
}
