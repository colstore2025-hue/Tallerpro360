/**
 * 🦾 NEXUS-X STRATEGIC COMMANDER V36.0 - THE TOWER (FINAL TERMINATOR EDITION)
 * William Jeffry Urquijo Cubillos // Nexus AI
 * Dashboard 2030: SAP-Style, Triangulación Contable PUC (51), BESA & VPC EAFIT
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function nexusControlTower(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let masterData = [];
    let financialData = { gastosFijos: 0, margenNeto: 0, puntoEquilibrio: 0 };

    const init = async () => {
        injectNexusStyles();
        renderSkeleton();
        await loadLibraries();
        await syncAllSystems();
    };

    const injectNexusStyles = () => {
        const style = document.createElement('style');
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&family=Inter:wght@300;600&display=swap');
            .tower-card { background: linear-gradient(160deg, #0d1117 0%, #010409 100%); border: 1px solid rgba(6, 182, 212, 0.1); border-radius: 24px; }
            .tower-card:hover { border-color: #06b6d4; box-shadow: 0 0 30px rgba(6, 182, 212, 0.1); transform: translateY(-2px); }
            .kpi-value { font-family: 'Orbitron', sans-serif; font-weight: 900; letter-spacing: -1px; text-shadow: 0 0 10px rgba(6, 182, 212, 0.5); }
            .progress-bar { height: 4px; border-radius: 10px; background: rgba(255,255,255,0.05); overflow: hidden; }
            .progress-fill { height: 100%; transition: width 1s ease-in-out; }
            .sap-table thead { background: rgba(255,255,255,0.02); color: #64748b; font-family: 'Orbitron', sans-serif; font-size: 9px; }
            .status-tag { padding: 2px 8px; border-radius: 6px; font-size: 9px; font-weight: 900; }
        `;
        document.head.appendChild(style);
    };

    const renderSkeleton = () => {
        container.innerHTML = `
        <div class="bg-[#010409] min-h-screen text-slate-300 font-['Inter'] pb-12">
            <header class="sticky top-0 z-50 backdrop-blur-xl bg-[#010409]/80 border-b border-white/5 p-6">
                <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div class="text-center md:text-left">
                        <div class="flex items-center justify-center md:justify-start gap-3">
                            <span class="w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></span>
                            <h1 class="orbitron text-2xl font-black italic text-white tracking-tighter">NEXUS<span class="text-cyan-500">_CONTROL_TOWER</span></h1>
                        </div>
                        <p class="text-[8px] orbitron tracking-[0.5em] text-cyan-500/50 uppercase mt-1">Strategic Commander V36.0 - Protocol 2030</p>
                    </div>
                    <div class="flex gap-3">
                        <button id="btnExcelGlobal" class="tower-card px-5 py-2 text-[10px] orbitron font-black text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all">EXCEL GERENCIAL</button>
                    </div>
                </div>
            </header>

            <main class="max-w-7xl mx-auto px-4 mt-8 space-y-8">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" id="kpiGrid"></div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 tower-card p-8">
                        <h3 class="orbitron text-xs font-black text-slate-500 mb-8 tracking-widest">CURVA DE SOSTENIBILIDAD (VENTA VS GASTOS 51)</h3>
                        <div class="h-72"><canvas id="financialChart"></canvas></div>
                    </div>
                    <div class="tower-card p-8 flex flex-col justify-between">
                        <h3 class="orbitron text-xs font-black text-slate-500 mb-4">PUNTO DE EQUILIBRIO</h3>
                        <div id="breakEvenGauge" class="text-center py-6"></div>
                        <div class="bg-white/5 p-4 rounded-2xl">
                            <p class="text-[10px] orbitron text-slate-400 mb-1">MARGEN BRUTO OPERATIVO</p>
                            <p id="txtMargenBruto" class="text-xl font-black text-white orbitron">0%</p>
                        </div>
                    </div>
                </div>

                <div class="tower-card overflow-hidden">
                    <div class="p-6 border-b border-white/5 bg-white/2">
                        <h3 class="orbitron text-xs font-black text-white">REPORTE INDIVIDUAL POR ORDEN</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left sap-table">
                            <thead>
                                <tr>
                                    <th class="p-4">VEHÍCULO/PLACA</th>
                                    <th class="p-4 text-center">EFICIENCIA BESA</th>
                                    <th class="p-4 text-center">VPC EAFIT</th>
                                    <th class="p-4 text-right">UTILIDAD</th>
                                    <th class="p-4 text-right">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody id="mainTableBody" class="divide-y divide-white/[0.03]"></tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>`;
    };

    const syncAllSystems = async () => {
        // 1. TRIANGULACIÓN: GASTOS FIJOS (PUC 51)
        const qC = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId));
        const snapC = await getDocs(qC);
        let totalGastos51 = 0;
        snapC.forEach(d => {
            const m = d.data();
            if(m.cuenta?.startsWith("5105") || m.cuenta?.startsWith("5195")) {
                totalGastos51 += Number(m.valor || 0);
            }
        });

        // 2. TRIANGULACIÓN: ÓRDENES (Mecánica, Chapa y Pesados)
        const qO = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        const snapO = await getDocs(qO);
        
        masterData = snapO.docs.map(doc => {
            const o = doc.data();
            const hFacturadas = Number(o.horas_facturadas || 0);
            const hReales = Number(o.horas_reales || 0);
            
            return {
                id: doc.id,
                ...o,
                eficiencia: hReales > 0 ? (hFacturadas / hReales) * 100 : 100,
                utilidad: (Number(o.total || 0) - Number(o.costo_total || 0)),
                diasCiclo: Math.ceil(( (o.fecha_entrega?.toDate() || new Date()) - (o.fecha_apertura?.toDate() || new Date()) ) / (1000 * 60 * 60 * 24))
            };
        });

        calculateFinalMetrics(totalGastos51);
        renderUI();
    };

    const calculateFinalMetrics = (gastos) => {
        const totalIngresos = masterData.reduce((a,b) => a + (Number(b.total) || 0), 0);
        const totalUtilidadBruta = masterData.reduce((a,b) => a + b.utilidad, 0);
        
        financialData.gastosFijos = gastos;
        financialData.margenBruto = totalIngresos > 0 ? (totalUtilidadBruta / totalIngresos) * 100 : 0;
        financialData.puntoEquilibrio = totalUtilidadBruta > 0 ? (gastos / (totalUtilidadBruta / totalIngresos)) : 0;
        financialData.utilidadNeta = totalUtilidadBruta - gastos;
    };

    const renderUI = () => {
        // Render KPI Cards
        const kpiGrid = document.getElementById("kpiGrid");
        kpiGrid.innerHTML = `
            ${kpiCard("UTILIDAD NETA (EBITDA)", `$${financialData.utilidadNeta.toLocaleString()}`, financialData.utilidadNeta > 0 ? "text-emerald-400" : "text-red-500", "fas fa-funnel-dollar")}
            ${kpiCard("PUNTO EQUILIBRIO", `$${financialData.puntoEquilibrio.toLocaleString()}`, "text-cyan-400", "fas fa-balance-scale")}
            ${kpiCard("EFICIENCIA GLOBAL", `${(masterData.reduce((a,b)=>a+b.eficiencia,0)/masterData.length || 0).toFixed(1)}%`, "text-purple-400", "fas fa-microchip")}
            ${kpiCard("TIEMPO CICLO AVG", `${(masterData.reduce((a,b)=>a+b.diasCiclo,0)/masterData.length || 0).toFixed(1)} DÍAS`, "text-white", "fas fa-bolt")}
        `;

        document.getElementById("txtMargenBruto").innerText = `${financialData.margenBruto.toFixed(1)}%`;
        
        const tableBody = document.getElementById("mainTableBody");
        tableBody.innerHTML = masterData.map(o => `
            <tr class="hover:bg-cyan-500/[0.02]">
                <td class="p-4">
                    <div class="font-black text-white orbitron text-xs">${o.placa || 'NEW'}</div>
                    <div class="text-[9px] text-slate-500 uppercase font-bold">${o.cliente || 'CLIENTE FINAL'}</div>
                </td>
                <td class="p-4 text-center">
                    <div class="text-[10px] font-black ${o.eficiencia >= 100 ? 'text-emerald-400' : 'text-yellow-500'}">${o.eficiencia.toFixed(1)}%</div>
                    <div class="progress-bar mt-1"><div class="progress-fill bg-cyan-500" style="width:${o.eficiencia}%"></div></div>
                </td>
                <td class="p-4 text-center">
                    <span class="status-tag ${o.diasCiclo <= 4 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}">
                        ${o.diasCiclo <= 4 ? 'OPTIMAL' : 'DELAYED'}
                    </span>
                </td>
                <td class="p-4 text-right font-black text-white">$${(o.utilidad).toLocaleString()}</td>
                <td class="p-4 text-right">
                    <button onclick="window.exportSinglePDF('${o.id}')" class="text-slate-500 hover:text-white"><i class="fas fa-file-pdf"></i></button>
                </td>
            </tr>
        `).join('');

        initCharts();
        document.getElementById("btnExcelGlobal").onclick = () => exportExcelGerencial();
    };

    const kpiCard = (l, v, c, icon) => `
        <div class="tower-card p-6">
            <div class="flex justify-between items-start opacity-40 mb-4">
                <p class="orbitron text-[9px] font-black tracking-widest">${l}</p>
                <i class="${icon} text-xs"></i>
            </div>
            <p class="kpi-value text-xl ${c}">${v}</p>
        </div>`;

    const exportExcelGerencial = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [
            ["NEXUS-X TERMINATOR 2030 - REPORT"],
            ["FECHA", new Date().toLocaleString()],
            ["GASTOS FIJOS (PUC 51)", financialData.gastosFijos],
            ["PUNTO EQUILIBRIO", financialData.puntoEquilibrio],
            ["UTILIDAD NETA", financialData.utilidadNeta],
            [],
            ["PLACA", "CLIENTE", "EFICIENCIA %", "UTILIDAD BRUTA", "DÍAS CICLO"]
        ];
        masterData.forEach(o => wsData.push([o.placa, o.cliente, o.eficiencia, o.utilidad, o.diasCiclo]));
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Financial_Report");
        XLSX.writeFile(wb, `NexusX_SAP_Report.xlsx`);
    };

    // MOTOR DE PDF INDIVIDUAL (ASIGNADO A WINDOW PARA LLAMADA DESDE TABLA)
    window.exportSinglePDF = (id) => {
        const o = masterData.find(x => x.id === id);
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFont("helvetica", "bold");
        doc.text(`NEXUS-X CERTIFICADO DE RENDIMIENTO: ${o.placa}`, 10, 20);
        doc.setFontSize(10);
        doc.text(`Cliente: ${o.cliente}`, 10, 30);
        doc.text(`Eficiencia Operativa: ${o.eficiencia.toFixed(2)}%`, 10, 40);
        doc.text(`Margen de Utilidad: $${o.utilidad.toLocaleString()}`, 10, 50);
        doc.text(`Análisis VPC: ${o.diasCiclo <= 4 ? 'Cumple Promesa' : 'Excede Tiempo de Ciclo'}`, 10, 60);
        
        doc.save(`Certificado_Nexus_${o.placa}.pdf`);
    };

    const loadLibraries = async () => {
        const libs = [
            "https://cdn.jsdelivr.net/npm/chart.js",
            "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
        ];
        for (const lib of libs) {
            await new Promise(r => { const s = document.createElement("script"); s.src = lib; s.onload = r; document.head.appendChild(s); });
        }
    };

    init();
}
