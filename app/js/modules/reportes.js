/**
 * 🦾 NEXUS-X STRATEGIC COMMANDER V35.0 - COMPETITIVE INTELLIGENCE
 * Basado en modelos de Valor Percibido (VPC) y Análisis de Pareto
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function reportesModule(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let rawData = [];
    let analytics = { pareto: [], bsc: {}, vpc_gap: 0 };

    const init = async () => {
        renderBaseLayout();
        await loadDependencies();
        await runIntelligenceEngine();
    };

    const runIntelligenceEngine = async () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        
        rawData = snap.docs.map(doc => {
            const d = doc.data();
            const venta = Number(d.total || 0);
            const costo = Number(d.costo_total || 0);
            // Métrica de Honestidad/Cumplimiento (Atributo #1 según EAFIT)
            const fPromesa = d.fecha_promesa?.toDate() || new Date();
            const fEntrega = d.fecha_entrega?.toDate() || new Date();
            const cumplimiento = fEntrega <= fPromesa ? 100 : 0;

            return { id: doc.id, ...d, venta, costo, utilidad: venta - costo, cumplimiento };
        });

        calculatePareto();
        renderDashboard();
    };

    const calculatePareto = () => {
        // Ordenamos por utilidad para identificar el 20% estrella
        const sorted = [...rawData].sort((a, b) => b.utilidad - a.utilidad);
        const totalUtilidad = sorted.reduce((a, b) => a + b.utilidad, 0);
        let acumulado = 0;
        
        analytics.pareto = sorted.map(o => {
            acumulado += o.utilidad;
            return { ...o, porcentajeAcumulado: (acumulado / totalUtilidad) * 100 };
        });
    };

    const renderDashboard = () => {
        container.innerHTML = `
        <div class="bg-[#010409] min-h-screen text-white p-4 no-scroll-jump">
            <div class="sticky top-0 bg-[#010409]/90 backdrop-blur pb-4 z-50 border-b border-white/5 flex justify-between items-end">
                <div>
                    <h2 class="orbitron text-2xl font-black text-cyan-400 italic">NEXUS<span class="text-white">_BI</span></h2>
                    <p class="text-[7px] orbitron tracking-[0.3em] text-slate-500">ANÁLISIS COMPETITIVO V35.0</p>
                </div>
                <div class="flex gap-2">
                    <button id="btnGlobalExcel" class="bg-emerald-500 text-[9px] orbitron font-bold px-4 py-2 rounded-lg">EXCEL GLOBAL</button>
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
                ${kpiCard("Cumplimiento (VPC)", `${calculateAvg('cumplimiento')}%`, "text-emerald-400")}
                ${kpiCard("Margen Operativo", `${calculateAvgMargen()}%`, "text-cyan-400")}
                ${kpiCard("Ticket Promedio", `$${(calculateTotal('venta') / rawData.length || 0).toLocaleString()}`, "text-white")}
                ${kpiCard("Servicios 80/20", analytics.pareto.filter(x => x.porcentajeAcumulado <= 80).length, "text-purple-400")}
            </div>

            <div class="bg-[#0d1117] p-4 rounded-2xl border border-white/5 mb-6">
                <p class="text-[8px] orbitron text-slate-500 mb-4">FLUJO DE RENTABILIDAD POR MISIÓN</p>
                <div class="h-24"><canvas id="chartHorizontal"></canvas></div>
            </div>

            <div class="bg-[#0d1117] rounded-2xl border border-white/5 overflow-hidden">
                <table class="w-full text-[10px] text-left">
                    <thead class="bg-white/5 orbitron text-slate-500">
                        <tr>
                            <th class="p-3">PLACA</th>
                            <th class="p-3">ESTADO VPC</th>
                            <th class="p-3 text-right">ACCIÓN</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/[0.03]">
                        ${rawData.map(o => `
                            <tr class="hover:bg-white/[0.01]">
                                <td class="p-3 font-bold text-cyan-400">${o.placa}</td>
                                <td class="p-3">
                                    <span class="px-2 py-0.5 rounded-full ${o.cumplimiento === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}">
                                        ${o.cumplimiento === 100 ? 'A TIEMPO' : 'DEMORADO'}
                                    </span>
                                </td>
                                <td class="p-3 text-right">
                                    <button onclick="exportSingle('${o.id}')" class="text-slate-400 hover:text-white"><i class="fas fa-file-download text-lg"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;

        initChart();
        document.getElementById("btnGlobalExcel").onclick = () => exportGlobalExcel();
    };

    // --- LÓGICA DE EXPORTACIÓN EXCEL (ESTILO CONSULTORÍA) ---
    const exportGlobalExcel = () => {
        const wb = XLSX.utils.book_new();
        
        // Hoja 1: Balanced Scorecard (Métricas de alto nivel)
        const bscData = [
            ["REPORTE ESTRATÉGICO NEXUS-X"],
            ["Variable", "Valor", "Estado (Análisis Competitivo)"],
            ["Honestidad/Cumplimiento", `${calculateAvg('cumplimiento')}%`, calculateAvg('cumplimiento') > 90 ? "FORTALEZA" : "OPORTUNIDAD DE MEJORA"],
            ["Margen de Utilidad", `${calculateAvgMargen()}%`, calculateAvgMargen() > 30 ? "COMPETITIVO" : "BAJO MARGEN"],
            ["Eficiencia de Proceso", "80/20", "Analizado"]
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(bscData);
        XLSX.utils.book_append_sheet(wb, ws1, "Balanced_Scorecard");

        // Hoja 2: Análisis de Pareto (Los servicios que más dinero dejan)
        const ws2 = XLSX.utils.json_to_sheet(analytics.pareto);
        XLSX.utils.book_append_sheet(wb, ws2, "Analisis_Pareto_Rentabilidad");

        XLSX.writeFile(wb, `NexusX_Strategic_Report_${empresaId}.xlsx`);
    };

    // Funciones auxiliares...
    const calculateTotal = (key) => rawData.reduce((a, b) => a + b[key], 0);
    const calculateAvg = (key) => (calculateTotal(key) / (rawData.length || 1)).toFixed(1);
    const calculateAvgMargen = () => {
        const totalV = calculateTotal('venta');
        const totalC = calculateTotal('costo');
        return totalV > 0 ? (((totalV - totalC) / totalV) * 100).toFixed(1) : 0;
    };

    const kpiCard = (l, v, c) => `
        <div class="bg-[#0d1117] p-3 rounded-xl border border-white/5">
            <p class="text-[7px] orbitron font-bold text-slate-500 uppercase">${l}</p>
            <p class="${c} text-lg font-black orbitron">${v}</p>
        </div>`;

    init();
}
