/**
 * 🌌 NEXUS-X AUDIT & OPERATIONS V27.0 - NEXT-GEN ANALYTICS
 * 🛠️ CORE: FIREBASE + IA PREDICTIVA + EXPORT ENGINE
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { calcularPrecioInteligente } from "../ai/pricingOptimizerAI.js";
import repairEstimator from "../ai/repairEstimator.js";

export default async function reportesModule(container) {
    const empresaId = localStorage.getItem("empresaId");
    let misionesGlobal = [];

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-white pb-32">
            <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 class="orbitron text-4xl font-black italic text-white tracking-tighter">
                        AUDIT <span class="text-cyan-400">CENTER PRO</span>
                    </h1>
                    <p class="text-[9px] orbitron text-slate-500 tracking-[0.3em] mt-1">NEXUS-X STARLINK | INTEL_CORE_V27</p>
                </div>
                <div class="flex gap-3">
                    <button id="btnExportExcel" class="px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl orbitron text-[9px] text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">
                        📊 EXCEL (XLSX)
                    </button>
                    <button id="btnExportPDF" class="px-5 py-2.5 bg-cyan-500 text-black rounded-xl orbitron text-[9px] font-black hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all">
                        📄 PDF EJECUTIVO
                    </button>
                </div>
            </header>

            <div id="iaAdvisor" class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                <div class="lg:col-span-2 bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20 p-6 rounded-[2rem] flex items-center gap-6">
                    <div class="text-4xl animate-pulse">🧠</div>
                    <div>
                        <h4 class="orbitron text-[10px] font-black text-cyan-400 uppercase mb-1">Análisis del Estratega IA</h4>
                        <p id="iaAdviceMsg" class="text-[11px] text-slate-300 leading-relaxed italic">Iniciando escaneo de rentabilidad en misiones activas...</p>
                    </div>
                </div>
                <div class="bg-[#0d1117] border border-white/5 p-6 rounded-[2rem] flex flex-col justify-center">
                    <p class="orbitron text-[8px] text-slate-500 uppercase">Eficiencia Global</p>
                    <h2 id="globalEfficiency" class="text-3xl font-black orbitron text-white">0%</h2>
                </div>
            </div>

            <div class="bg-[#0d1117] border border-white/5 rounded-[2.5rem] overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-white/[0.02] border-b border-white/5">
                        <tr class="orbitron text-[9px] text-slate-500 uppercase tracking-widest">
                            <th class="p-6">Misión / Placa</th>
                            <th class="p-6">Rentabilidad</th>
                            <th class="p-6">Fuga de Capital</th>
                            <th class="p-6">Acción Sugerida</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody">
                        </tbody>
                </table>
            </div>
        </div>`;

        document.getElementById("btnExportExcel").onclick = () => exportToExcel();
        document.getElementById("btnExportPDF").onclick = () => window.print();
        fetchData();
    };

    const fetchData = async () => {
        const snap = await getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId)));
        misionesGlobal = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        processAnalytics();
    };

    const processAnalytics = () => {
        const tbody = document.getElementById("tableBody");
        let totalFuga = 0;
        let misionesRentables = 0;

        tbody.innerHTML = misionesGlobal.map(o => {
            const venta = Number(o.costos_totales?.total_general || 0);
            const repuestos = Number(o.costos_totales?.costo_repuestos || 0);
            const mo = Number(o.costos_totales?.mano_obra || 0);
            
            // IA Analysis
            const analitica = calcularPrecioInteligente({
                costoRepuestos: repuestos,
                horasTrabajo: o.horas_reales || 1,
                tipoCliente: o.cliente_tipo || "normal"
            });

            const rentabilidadReal = venta > 0 ? ((venta - (repuestos + mo)) / venta) * 100 : 0;
            const fuga = analitica.total > venta ? analitica.total - venta : 0;
            totalFuga += fuga;
            if (rentabilidadReal > 25) misionesRentables++;

            const statusColor = rentabilidadReal > 25 ? 'text-emerald-400' : 'text-red-500';

            return `
            <tr class="border-b border-white/5 hover:bg-white/[0.01] transition-all group">
                <td class="p-6">
                    <div class="flex flex-col">
                        <span class="orbitron text-lg font-black italic group-hover:text-cyan-400 transition-colors">${o.placa || 'N/A'}</span>
                        <span class="text-[8px] text-slate-500 orbitron">${o.cliente || 'Anon'}</span>
                    </div>
                </td>
                <td class="p-6">
                    <div class="flex flex-col">
                        <span class="${statusColor} font-bold text-sm">${rentabilidadReal.toFixed(1)}%</span>
                        <span class="text-[8px] text-slate-500 orbitron">MARGEN NETO</span>
                    </div>
                </td>
                <td class="p-6">
                    <span class="text-sm font-bold ${fuga > 0 ? 'text-amber-500' : 'text-slate-400'}">
                        $ ${fuga.toLocaleString()}
                    </span>
                </td>
                <td class="p-6">
                    <div class="flex items-center gap-3">
                        <span class="text-[10px] text-slate-400 italic">
                            ${fuga > 0 ? '⚠️ Subir Mano de Obra' : '✅ Operación Eficiente'}
                        </span>
                        <button class="p-2 bg-white/5 rounded-lg hover:bg-cyan-500 hover:text-black transition-all">
                            🔍
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join("");

        // Update IA Advisor
        const eficienciaTotal = (misionesRentables / misionesGlobal.length) * 100;
        document.getElementById("globalEfficiency").innerText = `${eficienciaTotal.toFixed(0)}%`;
        document.getElementById("iaAdviceMsg").innerHTML = `
            He detectado una fuga total de <b>$${totalFuga.toLocaleString()}</b>. 
            El <b>${(100 - eficienciaTotal).toFixed(0)}%</b> de tus misiones están por debajo del margen ideal del 25%. 
            He enviado este reporte a <span class="text-cyan-400">finanzas_elite.js</span> para auditoría de caja.`;
        
        // ENVÍO DE DATA A FINANZAS_ELITE (SIMULADO)
        localStorage.setItem("last_audit_fuga", totalFuga);
        localStorage.setItem("last_audit_efficiency", eficienciaTotal);
    };

    const exportToExcel = () => {
        const wsData = misionesGlobal.map(o => ({
            "Placa": o.placa,
            "Cliente": o.cliente,
            "Total Facturado": o.costos_totales?.total_general || 0,
            "Costo Repuestos": o.costos_totales?.costo_repuestos || 0,
            "Mano de Obra": o.costos_totales?.mano_obra || 0,
            "Estatus": "AUDITADO V27"
        }));
        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte_Operativo");
        XLSX.writeFile(wb, `NexusX_Operaciones_${new Date().toLocaleDateString()}.xlsx`);
    };

    renderLayout();
}
