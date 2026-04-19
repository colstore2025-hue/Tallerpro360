/**
 * 🦾 NEXUS-X STRATEGIC COMMANDER V33.0 - BSC EDITION
 * Sistema de Inteligencia Operacional y Logística
 * William Jeffry Urquijo Cubillos // Operaciones de Alto Nivel
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

export default async function reportesModule(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let metrics = { global: {}, orders: [] };

    const init = async () => {
        container.innerHTML = `<div class="p-4 text-cyan-500 orbitron animate-pulse">Sincronizando Bóveda de Datos...</div>`;
        await loadDependencies();
        await processBusinessIntelligence();
        renderDashboard();
    };

    const processBusinessIntelligence = async () => {
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ORDERS), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        
        metrics.orders = snap.docs.map(doc => {
            const d = doc.data();
            // Normalización Financiera
            const venta = Number(d.costos_totales?.total_general || d.total || 0);
            const costo = Number(d.costos_totales?.costo_repuestos || 0) + Number(d.costos_totales?.mano_obra || 0);
            
            // KPIs Logísticos (Nivel de Servicio)
            const fIngreso = d.fecha_apertura?.toDate() || new Date();
            const fEntrega = d.fecha_entrega?.toDate() || new Date();
            const tiempoCiclo = Math.ceil((fEntrega - fIngreso) / (1000 * 60 * 60 * 24)); // Días
            const cumplimiento = tiempoCiclo <= (d.promesa_dias || 3) ? 100 : 0;

            return {
                id: doc.id,
                placa: d.placa || 'N/A',
                cliente: d.cliente || 'S/N',
                venta,
                utilidad: venta - costo,
                margen: venta > 0 ? ((venta - costo) / venta) * 100 : 0,
                diasTaller: tiempoCiclo,
                cumplimiento,
                tecnico: d.tecnico_asignado || 'No asignado'
            };
        });

        // Agregados Globales (Balanced Scorecard)
        const totalVenta = metrics.orders.reduce((a, b) => a + b.venta, 0);
        metrics.global = {
            totalVenta,
            margenPromedio: metrics.orders.reduce((a, b) => a + b.margen, 0) / (metrics.orders.length || 1),
            nivelServicio: metrics.orders.reduce((a, b) => a + b.cumplimiento, 0) / (metrics.orders.length || 1),
            ticketPromedio: totalVenta / (metrics.orders.length || 1)
        };
    };

    const renderDashboard = () => {
        container.innerHTML = `
        <div class="p-6 bg-[#010409] min-h-screen text-white font-sans animate-in fade-in duration-500">
            <div class="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                <div>
                    <h2 class="orbitron text-3xl font-black italic text-cyan-400">STRATEGIC <span class="text-white">COMMANDER</span></h2>
                    <p class="text-[8px] orbitron tracking-[0.4em] text-slate-500">Logística & Operaciones Pro-Level</p>
                </div>
                <button id="btnExcelFull" class="bg-cyan-500 hover:bg-white hover:text-black text-[10px] orbitron font-black px-6 py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                    DESCARGAR BSC EXCEL ELITE
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                ${renderScorecardItem("Perspectiva Financiera", `$${metrics.global.totalVenta.toLocaleString()}`, "Venta Total", "text-white")}
                ${renderScorecardItem("Nivel de Servicio (OTD)", `${metrics.global.nivelServicio.toFixed(1)}%`, "Cumplimiento Entrega", "text-emerald-400")}
                ${renderScorecardItem("Rentabilidad Operativa", `${metrics.global.margenPromedio.toFixed(1)}%`, "Margen Neto Prom.", "text-cyan-400")}
                ${renderScorecardItem("Eficiencia Logística", `${metrics.global.ticketPromedio.toFixed(0)}`, "Valor / Misión", "text-purple-400")}
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div class="bg-[#0d1117] p-6 rounded-3xl border border-white/5">
                    <h3 class="orbitron text-[9px] font-black text-slate-500 mb-4 uppercase">Flujo Operativo de Ventas</h3>
                    <canvas id="chartFinanciero" height="180"></canvas>
                </div>

                <div class="bg-[#0d1117] p-6 rounded-3xl border border-white/5">
                    <h3 class="orbitron text-[9px] font-black text-cyan-500 mb-4 uppercase">Plan de Mejora Sugerido (IA)</h3>
                    <div class="space-y-4">
                        ${generateSmartActions()}
                    </div>
                </div>
            </div>

            <div class="mt-8 bg-[#0d1117] border border-white/5 rounded-3xl overflow-hidden">
                <div class="p-4 bg-white/[0.02] border-b border-white/5">
                    <h3 class="orbitron text-[9px] font-black text-slate-400 uppercase">Monitor de Operación Técnica</h3>
                </div>
                <div class="overflow-x-auto max-h-64 overflow-y-auto">
                    <table class="w-full text-[11px] text-left">
                        <thead class="sticky top-0 bg-[#0d1117] orbitron text-slate-500 border-b border-white/10">
                            <tr>
                                <th class="p-4">PLACA</th>
                                <th class="p-4">TÉCNICO</th>
                                <th class="p-4">DÍAS TALLER</th>
                                <th class="p-4">RENTABILIDAD</th>
                                <th class="p-4 text-right">AUDITORÍA</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/[0.02]">
                            ${metrics.orders.map(o => `
                                <tr class="hover:bg-cyan-500/5 transition-all">
                                    <td class="p-4 font-black text-cyan-400">${o.placa}</td>
                                    <td class="p-4 uppercase">${o.tecnico}</td>
                                    <td class="p-4">${o.diasTaller} Días</td>
                                    <td class="p-4 ${o.margen < 20 ? 'text-red-500' : 'text-emerald-500'} font-bold">${o.margen.toFixed(1)}%</td>
                                    <td class="p-4 text-right">
                                        <button onclick="downloadSingle('${o.id}')" class="text-white/50 hover:text-cyan-400"><i class="fas fa-download"></i></button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;
        
        initCharts();
        document.getElementById("btnExcelFull").onclick = () => exportEliteExcel();
    };

    const generateSmartActions = () => {
        let actions = [];
        if (metrics.global.nivelServicio < 85) {
            actions.push({ t: "LOGÍSTICA", m: "Cuello de botella detectado en tiempos de entrega. Acción: Revisar stock de repuestos críticos." });
        }
        if (metrics.global.margenPromedio < 25) {
            actions.push({ t: "FINANCIERO", m: "Margen por debajo del umbral objetivo. Acción: Auditar costos de mano de obra externa." });
        }
        return actions.map(a => `
            <div class="border-l-2 border-cyan-500 pl-4 py-2">
                <span class="orbitron text-[8px] font-black text-cyan-500">${a.t}</span>
                <p class="text-[10px] text-slate-400 italic">${a.m}</p>
            </div>
        `).join('') || '<p class="text-[10px] text-emerald-500">Operación Óptima: Mantener protocolos actuales.</p>';
    };

    const exportEliteExcel = () => {
        const wb = XLSX.utils.book_new();
        
        // HOJA 1: BALANCED SCORECARD
        const bscData = [
            ["BALANCED SCORECARD - TALLERPRO360 ELITE"],
            ["GENERADO POR", "NEXUS-X STRATEGIC ENGINE"],
            ["FECHA", new Date().toLocaleString()],
            [""],
            ["PERSPECTIVA", "MÉTRICA", "VALOR", "ESTADO"],
            ["FINANCIERA", "Venta Total", metrics.global.totalVenta, metrics.global.totalVenta > 10000000 ? "OBJETIVO CUMPLIDO" : "EN SEGUIMIENTO"],
            ["CLIENTE / LOGÍSTICA", "Nivel de Servicio (OTD)", metrics.global.nivelServicio.toFixed(2) + "%", metrics.global.nivelServicio > 90 ? "EXCELENTE" : "CRÍTICO"],
            ["PROCESOS INTERNOS", "Margen de Utilidad", metrics.global.margenPromedio.toFixed(2) + "%", metrics.global.margenPromedio > 30 ? "OPTIMIZADO" : "REVISAR COSTOS"],
            ["APRENDIZAJE", "Ticket Promedio", metrics.global.ticketPromedio, "ESTÁNDAR"]
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(bscData);
        XLSX.utils.book_append_sheet(wb, ws1, "Balanced_Scorecard");

        // HOJA 2: DATA CRUDA DE OPERACIONES
        const ws2 = XLSX.utils.json_to_sheet(metrics.orders);
        XLSX.utils.book_append_sheet(wb, ws2, "Detalle_Operaciones");

        XLSX.writeFile(wb, `Estrategia_NexusX_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    // Auxiliares de Render y Carga...
    const renderScorecardItem = (t, v, l, c) => `
        <div class="bg-[#0d1117] p-5 rounded-2xl border border-white/5">
            <p class="text-[8px] orbitron font-black text-slate-500 uppercase mb-2">${t}</p>
            <p class="text-2xl font-black orbitron ${c}">${v}</p>
            <p class="text-[7px] orbitron text-slate-600 mt-1 uppercase">${l}</p>
        </div>`;

    const loadDependencies = async () => {
        const libs = [
            "https://cdn.jsdelivr.net/npm/chart.js",
            "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"
        ];
        for (const lib of libs) {
            await new Promise(r => {
                const s = document.createElement("script"); s.src = lib; s.onload = r; document.head.appendChild(s);
            });
        }
    };

    const initCharts = () => {
        const ctx = document.getElementById('chartFinanciero').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: metrics.orders.slice(-10).map(o => o.placa),
                datasets: [{
                    label: 'Tendencia de Margen %',
                    data: metrics.orders.slice(-10).map(o => o.margen),
                    borderColor: '#06b6d4',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(6, 182, 212, 0.05)'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    };

    init();
}
