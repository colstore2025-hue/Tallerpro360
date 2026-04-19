/**
 * 🦾 NEXUS-X TERMINATOR CORE V30.0 - STRATEGIC BI & FORECASTING
 * El Dashboard definitivo de Gerencia de Operaciones
 * Director de Código: William Jeffry Urquijo Cubillos // Nexus AI
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

// Cargamos Chart.js dinámicamente para el milagro visual
const loadCharts = () => {
    return new Promise((resolve) => {
        if (window.Chart) return resolve();
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = resolve;
        document.head.appendChild(script);
    });
};

export default async function reportesModule(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenesData = [];
    let myChart = null;

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-white pb-40 font-sans animate-in fade-in duration-700">
            
            <header class="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-12 gap-8 border-b border-white/5 pb-10">
                <div>
                    <h1 class="orbitron text-6xl font-black italic tracking-tighter uppercase leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-blue-500">
                        BUSINESS <span class="text-white">INTELLIGENCE</span>
                    </h1>
                    <div class="flex items-center gap-4 mt-4">
                        <div class="h-2 w-2 bg-emerald-500 animate-pulse rounded-full"></div>
                        <span class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-[0.5em]">Nexus Strategic Advisor V30.0</span>
                    </div>
                </div>
                
                <div class="flex flex-wrap gap-4">
                    <button id="btnExportExcel" class="px-8 py-4 bg-white text-black rounded-2xl flex items-center gap-4 hover:bg-cyan-500 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl">
                        <i class="fas fa-file-invoice-dollar text-xl"></i>
                        <span class="orbitron text-[10px] font-black uppercase">Exportar Auditoría P&L</span>
                    </button>
                </div>
            </header>

            <div id="forecastSection" class="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-12">
                <div class="xl:col-span-8 bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
                    <div class="flex justify-between items-center mb-10">
                        <h3 class="orbitron text-xs font-black text-cyan-400 uppercase tracking-widest italic">Tendencia de Ingresos & Proyección Operativa</h3>
                        <div class="flex gap-2">
                             <span class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-[8px] orbitron text-cyan-500">REALTIME</span>
                        </div>
                    </div>
                    <canvas id="mainChart" height="250"></canvas>
                </div>

                <div class="xl:col-span-4 flex flex-col gap-8">
                    <div class="bg-gradient-to-br from-indigo-600 to-blue-800 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                        <i class="fas fa-chart-line absolute -right-4 -bottom-4 text-8xl opacity-10 rotate-12 transition-transform group-hover:scale-125"></i>
                        <h4 class="orbitron text-[10px] font-black text-white/70 mb-6 uppercase tracking-widest">Forecast de Demanda</h4>
                        <div id="forecastResult">
                             <p class="text-4xl font-black orbitron mb-2 animate-pulse">ANALIZANDO...</p>
                             <p class="text-[9px] orbitron font-black uppercase opacity-60">Próximos 30 días según IA</p>
                        </div>
                        <div class="mt-8 pt-8 border-t border-white/10">
                             <p id="tacticalAdvice" class="text-xs font-medium italic text-indigo-100 leading-relaxed"></p>
                        </div>
                    </div>
                    
                    <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5">
                        <h4 class="orbitron text-[10px] font-black text-slate-500 mb-6 uppercase tracking-widest">Eficiencia Operativa (KPI)</h4>
                        <div class="flex items-end gap-4 mb-4">
                            <span id="kpiEficiencia" class="text-5xl font-black orbitron">0%</span>
                            <span class="text-[9px] text-emerald-400 font-black mb-2 uppercase">Score Global</span>
                        </div>
                        <div class="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                            <div id="barEficiencia" class="h-full bg-cyan-500 transition-all duration-1000" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-[#0d1117] border border-white/5 rounded-[4rem] overflow-hidden shadow-2xl">
                <div class="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between gap-6 items-center bg-white/[0.01]">
                    <h3 class="orbitron text-[11px] font-black text-white uppercase tracking-[0.4em]">Desglose de Rentabilidad por Misión</h3>
                    <div class="bg-black/50 p-2 rounded-2xl flex gap-2 border border-white/5">
                         <input type="text" id="searchPlate" class="bg-transparent border-none text-xs orbitron p-2 focus:ring-0 w-48 uppercase" placeholder="BUSCAR PLACA...">
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-black/40 text-[9px] text-slate-500 orbitron uppercase tracking-widest">
                            <tr>
                                <th class="p-10">Activo (Placa)</th>
                                <th class="p-10">Mano de Obra</th>
                                <th class="p-10">Insumos</th>
                                <th class="p-10">Facturado</th>
                                <th class="p-10">Margen Neto</th>
                                <th class="p-10 text-right">Análisis BI</th>
                            </tr>
                        </thead>
                        <tbody id="opTableBody" class="divide-y divide-white/[0.02]"></tbody>
                    </table>
                </div>
            </div>
        </div>`;

        document.getElementById("btnExportExcel").onclick = () => exportarReporteElite();
        document.getElementById("searchPlate").oninput = (e) => filterTable(e.target.value);
        
        loadCharts().then(fetchData);
    };

    const fetchData = async () => {
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ORDERS), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        ordenesData = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        procesarInteligencia();
    };

    const procesarInteligencia = () => {
        let ingresosPorMes = {};
        let totalFacturado = 0;
        let totalCostos = 0;
        let misionesCompletadas = 0;

        ordenesData.forEach(o => {
            const venta = Number(o.costos_totales?.total_general || 0);
            const insumos = Number(o.costos_totales?.costo_repuestos || 0);
            const mo = Number(o.costos_totales?.mano_obra || 0);
            
            totalFacturado += venta;
            totalCostos += (insumos + mo);
            if (o.estado === 'FINALIZADA' || o.estado === 'ENTREGADO') misionesCompletadas++;

            // Agrupar por mes para el gráfico
            const fecha = o.fecha_apertura?.toDate ? o.fecha_apertura.toDate() : new Date();
            const mesAnio = fecha.toLocaleString('default', { month: 'short' });
            ingresosPorMes[mesAnio] = (ingresosPorMes[mesAnio] || 0) + venta;
        });

        renderChart(ingresosPorMes);
        renderTable(ordenesData);
        calculateForecast(ingresosPorMes, totalFacturado);
        
        // KPI de Eficiencia (Misiones cerradas vs totales)
        const eficiencia = ordenesData.length > 0 ? (misionesCompletadas / ordenesData.length) * 100 : 0;
        document.getElementById("kpiEficiencia").innerText = `${eficiencia.toFixed(0)}%`;
        document.getElementById("barEficiencia").style.width = `${eficiencia}%`;
    };

    const renderChart = (dataMes) => {
        const ctx = document.getElementById('mainChart').getContext('2d');
        if (myChart) myChart.destroy();

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(dataMes),
                datasets: [{
                    label: 'Flujo de Caja Real',
                    data: Object.values(dataMes),
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    borderWidth: 4,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { family: 'Orbitron' } } },
                    x: { grid: { display: false }, ticks: { color: '#64748b', font: { family: 'Orbitron' } } }
                }
            }
        });
    };

    const calculateForecast = (dataMes, totalFacturado) => {
        const meses = Object.values(dataMes);
        const promedio = meses.reduce((a, b) => a + b, 0) / (meses.length || 1);
        const tendencia = meses.length > 1 ? (meses[meses.length-1] / meses[meses.length-2]) : 1;
        const proyeccion = promedio * tendencia;

        document.getElementById("forecastResult").innerHTML = `
            <p class="text-4xl font-black orbitron mb-2">$ ${proyeccion.toLocaleString()}</p>
            <p class="text-[9px] orbitron font-black uppercase opacity-60">Probabilidad de Cierre: ${tendencia > 1 ? 'ALTA' : 'MODERADA'}</p>
        `;

        const consejoIA = tendencia > 1 
            ? "La demanda está en rampa ascendente. William, considera activar el turno nocturno o Taller Móvil."
            : "Ritmo de entrada estable. Sugiero campaña en redes para servicios preventivos y evitar valles operativos.";
        document.getElementById("tacticalAdvice").innerText = consejoIA;
    };

    const renderTable = (data) => {
        const tbody = document.getElementById("opTableBody");
        tbody.innerHTML = data.map(o => {
            const venta = Number(o.costos_totales?.total_general || 0);
            const insumos = Number(o.costos_totales?.costo_repuestos || 0);
            const mo = Number(o.costos_totales?.mano_obra || 0);
            const utilidad = venta - (insumos + mo);
            const margen = venta > 0 ? (utilidad / venta) * 100 : 0;

            return `
            <tr class="hover:bg-white/[0.02] transition-all group border-b border-white/[0.02]">
                <td class="p-10">
                    <div class="flex flex-col">
                        <span class="orbitron text-xl font-black italic tracking-tighter text-cyan-400 uppercase">${o.placa || 'N/A'}</span>
                        <span class="text-[10px] text-slate-500 font-bold uppercase">${o.cliente || 'CLIENTE'}</span>
                    </div>
                </td>
                <td class="p-10 orbitron text-sm font-bold text-slate-400">$ ${mo.toLocaleString()}</td>
                <td class="p-10 orbitron text-sm font-bold text-slate-400">$ ${insumos.toLocaleString()}</td>
                <td class="p-10 orbitron text-xl font-black text-white">$ ${venta.toLocaleString()}</td>
                <td class="p-10">
                    <div class="flex flex-col">
                        <span class="text-xs font-black orbitron ${margen > 25 ? 'text-emerald-400' : 'text-red-500'}">${margen.toFixed(1)}%</span>
                        <div class="w-16 h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                             <div class="h-full ${margen > 25 ? 'bg-emerald-500' : 'bg-red-500'}" style="width: ${Math.min(margen, 100)}%"></div>
                        </div>
                    </div>
                </td>
                <td class="p-10 text-right">
                    <span class="text-[8px] orbitron font-black px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                        ${utilidad > 0 ? 'P&L POSITIVO' : 'DÉFICIT'}
                    </span>
                </td>
            </tr>`;
        }).join("");
    };

    const filterTable = (val) => {
        const filtered = ordenesData.filter(o => (o.placa || "").toLowerCase().includes(val.toLowerCase()));
        renderTable(filtered);
    };

    const exportarReporteElite = () => {
        const wb = XLSX.utils.book_new();
        
        // Hoja 1: Resumen Gerencial
        const resumenData = [{
            "EMPRESA": "TALLERPRO360 NEXUS-X",
            "AUDITOR": "WILLIAM JEFFRY URQUIJO CUBILLOS",
            "FECHA": new Date().toLocaleString(),
            "TOTAL FACTURADO": ordenesData.reduce((a, b) => a + Number(b.costos_totales?.total_general || 0), 0),
            "UTILIDAD ESTIMADA": "Ver Hoja Detalle",
            "EFICIENCIA": document.getElementById("kpiEficiencia").innerText
        }];
        const ws1 = XLSX.utils.json_to_sheet(resumenData);
        XLSX.utils.book_append_sheet(wb, ws1, "Resumen_Gerencial");

        // Hoja 2: Detalle Forense
        const detalleData = ordenesData.map(o => {
            const v = Number(o.costos_totales?.total_general || 0);
            const i = Number(o.costos_totales?.costo_repuestos || 0);
            const m = Number(o.costos_totales?.mano_obra || 0);
            return {
                "PLACA": o.placa,
                "CLIENTE": o.cliente,
                "FECHA": o.fecha_apertura?.toDate ? o.fecha_apertura.toDate().toLocaleDateString() : 'N/A',
                "MANO OBRA": m,
                "INSUMOS": i,
                "TOTAL FACTURADO": v,
                "UTILIDAD NETA": v - (i + m),
                "MARGEN %": v > 0 ? (((v - (i + m)) / v) * 100).toFixed(2) + "%" : "0%",
                "ESTADO": o.estado
            };
        });
        const ws2 = XLSX.utils.json_to_sheet(detalleData);
        XLSX.utils.book_append_sheet(wb, ws2, "Auditoria_Detallada");

        XLSX.writeFile(wb, `NexusX_Strategic_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
        Swal.fire({ icon: 'success', title: 'Informe Elite Generado', background: '#010409', color: '#fff' });
    };

    renderLayout();
}
