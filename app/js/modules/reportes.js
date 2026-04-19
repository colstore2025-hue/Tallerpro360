/**
 * 🦾 NEXUS-X TERMINATOR CORE V32.0 - OPERATIONAL INTELLIGENCE
 * Transformación de datos técnicos en decisiones estratégicas.
 * William Jeffry Urquijo Cubillos // High-Level Operations Plan
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

// Herramientas externas para el milagro visual
const LIB_CHART = "https://cdn.jsdelivr.net/npm/chart.js";
const LIB_XLSX = "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js";

export default async function reportesModule(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let rawData = [];

    const init = async () => {
        renderSkeleton();
        await loadScript(LIB_CHART);
        await loadScript(LIB_XLSX);
        await loadData();
    };

    const renderSkeleton = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white font-sans">
            <div class="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/5 pb-8">
                <div>
                    <h1 class="orbitron text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">OPERATIONS BI</h1>
                    <p class="text-[10px] orbitron tracking-[0.4em] text-slate-500 uppercase">Control de Eficiencia y Rentabilidad Real</p>
                </div>
                <div class="flex gap-4 mt-6 md:mt-0">
                    <button id="mainExport" class="bg-white text-black px-6 py-3 rounded-xl orbitron text-[10px] font-black hover:bg-cyan-500 hover:text-white transition-all">EXPORTAR P&L GLOBAL</button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12" id="kpiGrid"></div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div class="xl:col-span-2 bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                    <h4 class="orbitron text-[10px] font-black text-cyan-400 mb-6 uppercase tracking-widest">Rendimiento Mensual vs Proyección</h4>
                    <canvas id="analyticsChart" height="300"></canvas>
                </div>

                <div class="bg-[#0d1117] rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col">
                    <div class="p-6 border-b border-white/5 bg-white/[0.02]">
                        <h4 class="orbitron text-[10px] font-black text-slate-400 uppercase">Auditoría por Misión</h4>
                    </div>
                    <div id="missionList" class="overflow-y-auto max-h-[400px] divide-y divide-white/[0.02]"></div>
                </div>
            </div>
        </div>`;

        document.getElementById("mainExport").onclick = () => exportGlobalExcel();
    };

    const loadData = async () => {
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ORDERS), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        
        // NORMALIZACIÓN CRÍTICA: Aquí arreglamos el problema del $0
        rawData = snap.docs.map(doc => {
            const d = doc.data();
            const v = Number(d.costos_totales?.total_general || d.total || d.precio_estimado || 0);
            const r = Number(d.costos_totales?.costo_repuestos || 0);
            const m = Number(d.costos_totales?.mano_obra || 0);
            return {
                id: doc.id,
                ...d,
                valVenta: v,
                valCosto: r + m,
                valUtilidad: v - (r + m),
                valMargen: v > 0 ? ((v - (r + m)) / v) * 100 : 0
            };
        });

        renderKPIs();
        renderMainChart();
        renderMissions();
    };

    const renderKPIs = () => {
        const totalVenta = rawData.reduce((acc, cur) => acc + cur.valVenta, 0);
        const totalUtilidad = rawData.reduce((acc, cur) => acc + cur.valUtilidad, 0);
        const avgTicket = totalVenta / (rawData.length || 1);
        const totalMargen = (totalUtilidad / (totalVenta || 1)) * 100;

        const grid = document.getElementById("kpiGrid");
        grid.innerHTML = `
            ${kpiCard("Facturación Total", totalVenta, "fa-file-invoice-dollar", "text-white")}
            ${kpiCard("Utilidad Neta", totalUtilidad, "fa-hand-holding-usd", "text-emerald-400")}
            ${kpiCard("Ticket Promedio", avgTicket, "fa-chart-line", "text-cyan-400")}
            ${kpiCard("Margen Global", totalMargen.toFixed(1) + "%", "fa-percent", "text-purple-400")}
        `;
    };

    const kpiCard = (t, v, i, c) => `
        <div class="bg-[#0d1117] p-8 rounded-3xl border border-white/5 hover:border-cyan-500/30 transition-all group">
            <div class="flex justify-between items-start mb-4">
                <p class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-widest">${t}</p>
                <i class="fas ${i} text-slate-700 group-hover:text-cyan-500 transition-colors"></i>
            </div>
            <p class="text-3xl font-black orbitron ${c} tabular-nums">${typeof v === 'number' ? '$' + v.toLocaleString() : v}</p>
        </div>`;

    const renderMissions = () => {
        const list = document.getElementById("missionList");
        list.innerHTML = rawData.map(o => `
            <div class="p-6 hover:bg-cyan-500/[0.03] transition-all cursor-pointer group flex justify-between items-center" onclick="exportSingleOrder('${o.id}')">
                <div>
                    <span class="orbitron font-black text-cyan-400 text-lg group-hover:tracking-widest transition-all">${o.placa || 'OT'}</span>
                    <p class="text-[9px] text-slate-500 font-bold uppercase">${o.cliente || 'CLIENTE'}</p>
                </div>
                <div class="text-right">
                    <span class="orbitron font-bold text-white">$${o.valVenta.toLocaleString()}</span>
                    <p class="text-[9px] ${o.valMargen > 25 ? 'text-emerald-500' : 'text-red-500'} font-black">${o.valMargen.toFixed(1)}% MARGEN</p>
                </div>
            </div>
        `).join("");
    };

    const renderMainChart = () => {
        const ctx = document.getElementById('analyticsChart');
        // Lógica de agrupación por fecha...
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: rawData.slice(-7).map(o => o.placa || 'OT'),
                datasets: [{
                    label: 'Venta Real',
                    data: rawData.slice(-7).map(o => o.valVenta),
                    backgroundColor: '#06b6d4',
                    borderRadius: 10
                }, {
                    label: 'Utilidad',
                    data: rawData.slice(-7).map(o => o.valUtilidad),
                    backgroundColor: '#10b981',
                    borderRadius: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { family: 'Orbitron', size: 9 } } },
                    x: { grid: { display: false }, ticks: { color: '#64748b', font: { family: 'Orbitron', size: 9 } } }
                }
            }
        });
    };

    // FUNCIÓN PARA EXPORTAR UNA SOLA ORDEN (PEDIDO 1)
    window.exportSingleOrder = (id) => {
        const o = rawData.find(x => x.id === id);
        const wb = XLSX.utils.book_new();
        const data = [
            ["AUDITORÍA DE MISIÓN INDIVIDUAL - NEXUS-X"],
            ["PLACA", o.placa],
            ["CLIENTE", o.cliente],
            [""],
            ["CONCEPTO", "VALOR"],
            ["FACTURACIÓN TOTAL", o.valVenta],
            ["COSTOS OPERATIVOS", o.valCosto],
            ["UTILIDAD NETA", o.valUtilidad],
            ["MARGEN RENTABILIDAD", o.valMargen.toFixed(2) + "%"],
            [""],
            ["ESTADO", o.estado]
        ];
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Detalle");
        XLSX.writeFile(wb, `Auditoria_${o.placa}.xlsx`);
    };

    const exportGlobalExcel = () => {
        const ws = XLSX.utils.json_to_sheet(rawData.map(o => ({
            PLACA: o.placa,
            CLIENTE: o.cliente,
            VENTA: o.valVenta,
            COSTO: o.valCosto,
            UTILIDAD: o.valUtilidad,
            MARGEN: o.valMargen.toFixed(2) + "%"
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "P&L_Global");
        XLSX.writeFile(wb, "NexusX_Global_BI.xlsx");
    };

    const loadScript = (src) => new Promise(res => {
        const s = document.createElement("script"); s.src = src; s.onload = res; document.head.appendChild(s);
    });

    init();
}
