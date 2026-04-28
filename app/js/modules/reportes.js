/**
 * 🏛️ NEXUS-X COMMANDER BI V50.0 - SAP INDUSTRIAL HYPER-DRIVE
 * William Jeffry Urquijo Cubillos // Nexus AI 2026-2030
 * Maniobra: Auditoría Forense y Visualización de Márgenes de Utilidad Neta.
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function nexusReportes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    
    // --- MOTOR DE FORMATEO PROFESIONAL (Corrige el error de puntos/comas) ---
    const fmt = (v) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(v);
    };

    const pct = (v) => `${v.toFixed(1)}%`;

    let state = {
        ordenesMaster: [],
        gastosFijos: 0,
        dataActual: [],
        charts: {}
    };

    const init = async () => {
        injectNexusStyles();
        renderLayout();
        await loadDependencies();
        await fetchData();
        setupEventListeners();
    };

    const injectNexusStyles = () => {
        const style = document.createElement('style');
        style.innerHTML = `
            .filter-btn { padding: 10px 20px; border-radius: 15px; font-size: 10px; font-weight: 900; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #64748b; transition: 0.4s; cursor: pointer; font-family: 'Orbitron'; text-transform: uppercase; }
            .filter-btn.active { background: #06b6d4; color: #000; border-color: #06b6d4; box-shadow: 0 0 20px rgba(6, 182, 212, 0.4); }
            .sap-input { background: #000; border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; color: #06b6d4; padding: 8px 12px; font-size: 11px; outline: none; transition: 0.3s; }
            .sap-input:focus { border-color: #06b6d4; box-shadow: 0 0 10px rgba(6,182,212,0.2); }
            .kpi-card { position: relative; overflow: hidden; background: #0d1117; padding: 2rem; border-radius: 2.5rem; border: 1px solid rgba(255,255,255,0.05); transition: 0.5s; }
            .kpi-card:hover { border-color: rgba(6, 182, 212, 0.3); transform: translateY(-5px); }
            .chart-container { background: #0d1117; padding: 2rem; border-radius: 3rem; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        `;
        document.head.appendChild(style);
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="bg-[#010409] min-h-screen text-slate-100 p-4 lg:p-10 orbitron animate-in fade-in duration-1000">
            <header class="flex flex-col gap-8 mb-12 border-b border-white/5 pb-10 text-center md:text-left">
                <div class="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <h1 class="text-5xl font-black italic tracking-tighter text-white uppercase">Nexus<span class="text-cyan-500">_Intelligence</span></h1>
                        <p class="text-[10px] text-slate-500 tracking-[0.5em] font-bold uppercase mt-3 italic">Industrial Audit System // Edición Looker-X</p>
                    </div>
                    <button id="btnExportGlobal" class="bg-emerald-500 text-black px-8 py-4 rounded-2xl text-[11px] font-black hover:scale-105 transition-all flex items-center gap-3 shadow-[0_10px_20px_rgba(16,185,129,0.2)]">
                        <i class="fas fa-file-csv text-lg"></i> EXPORTAR DATA BI
                    </button>
                </div>

                <div class="w-full flex flex-wrap gap-4 mt-6 bg-white/5 p-6 rounded-[2.5rem] border border-white/5 items-center justify-center md:justify-start">
                    <span class="text-[9px] text-cyan-500 font-black uppercase tracking-widest mr-4">Rango de Auditoría:</span>
                    <button onclick="window.nexusFilter(0, this)" class="filter-btn active">Histórico</button>
                    <button onclick="window.nexusFilter(30, this)" class="filter-btn">Mensual</button>
                    <button onclick="window.nexusFilter(7, this)" class="filter-btn">Semanal</button>
                    <div class="flex items-center gap-4 ml-auto">
                        <i class="fas fa-calendar-alt text-slate-600"></i>
                        <input type="date" id="datePicker" class="sap-input orbitron">
                    </div>
                </div>
            </header>

            <div id="kpi-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"></div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
                <div class="lg:col-span-2 chart-container">
                    <div class="flex justify-between items-center mb-8">
                        <h3 class="text-xs font-black text-cyan-500 uppercase tracking-widest italic">Utilidad Neta por Unidad ($)</h3>
                        <span class="text-[9px] text-slate-500 orbitron uppercase">Tiempo Real</span>
                    </div>
                    <div class="h-80"><canvas id="mainChart"></canvas></div>
                </div>
                <div class="chart-container">
                    <h3 class="text-xs font-black text-amber-500 uppercase tracking-widest italic mb-8">Mix Operativo de Flota</h3>
                    <div class="h-64"><canvas id="pieChart"></canvas></div>
                </div>
            </div>

            <div class="bg-[#0d1117] rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden mb-20">
                <div class="p-10 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <h3 class="text-xs font-black text-white uppercase italic tracking-widest">Análisis Forense de Misiones (Facturación vs Utilidad)</h3>
                    <span id="counterTag" class="text-[10px] bg-cyan-500/10 text-cyan-400 px-6 py-2 rounded-full font-black border border-cyan-500/20 uppercase">Calculando...</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-black/40 text-slate-500 text-[10px] uppercase font-black">
                            <tr>
                                <th class="p-8">Identificación</th>
                                <th class="p-8">Misión / Área</th>
                                <th class="p-8">Facturación Bruta</th>
                                <th class="p-8 text-center">Lead Time</th>
                                <th class="p-8 text-right">Margen (EBITDA)</th>
                                <th class="p-8 text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody id="report-table-body" class="text-sm"></tbody>
                    </table>
                </div>
            </div>
        </div>`;
    };

    const fetchData = async () => {
        try {
            const [snapOrders, snapAcc] = await Promise.all([
                getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId))),
                getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId)))
            ]);

            state.gastosFijos = snapAcc.docs.reduce((acc, d) => {
                const data = d.data();
                const esGasto = !['ingreso_ot', 'ingreso', 'VENTA_SERVICIO'].includes(data.tipo);
                return esGasto ? acc + Number(data.monto || data.total || 0) : acc;
            }, 0);
            
            state.ordenesMaster = snapOrders.docs.map(doc => {
                const o = doc.data();
                const facturacion = Number(o.costos_totales?.total || o.total || 0);
                const costos = Number(o.costos_totales?.base || o.costo_total || 0);
                const utilidad = facturacion - costos;
                
                const fechaInicio = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
                const diasTaller = Math.ceil(Math.abs(new Date() - fechaInicio) / (1000 * 60 * 60 * 24)) || 1;
                
                return {
                    id: doc.id,
                    placa: (o.placa || 'S/N').toUpperCase(),
                    area: o.tipo_orden || 'MECANICA',
                    total: facturacion,
                    utilidad: utilidad,
                    margenPorcentaje: facturacion > 0 ? (utilidad / facturacion) * 100 : 0,
                    dias: diasTaller,
                    cliente: o.cliente || 'OPERACIÓN_NEXUS',
                    estado: o.estado || 'PENDIENTE',
                    fecha: fechaInicio
                };
            });

            processAndRender(state.ordenesMaster);

        } catch (e) {
            console.error("DATA_FAULT:", e);
        }
    };

    const processAndRender = (data) => {
        state.dataActual = data;
        
        const totalUtilidadBruta = data.reduce((a, b) => a + b.utilidad, 0);
        const totalFacturado = data.reduce((a, b) => a + b.total, 0);
        const totalMTTR = data.reduce((a, b) => a + b.dias, 0);

        const metrics = {
            ebitda: totalUtilidadBruta - (state.gastosFijos / (data.length || 1)),
            mttr: totalMTTR / (data.length || 1),
            margenGeneral: totalFacturado > 0 ? (totalUtilidadBruta / totalFacturado) * 100 : 0,
            ticket: totalFacturado / (data.length || 1)
        };

        renderKPIs(metrics);
        renderCharts(data);
        renderTable(data);
        document.getElementById("counterTag").innerText = `${data.length} UNIDADES ACTIVAS`;
    };

    const renderKPIs = (m) => {
        const grid = document.getElementById("kpi-grid");
        grid.innerHTML = `
            ${kpiCard("EBITDA ESTIMADO", fmt(m.ebitda), "fa-wallet", m.ebitda > 0 ? "text-emerald-400" : "text-red-500", pct(m.margenGeneral))}
            ${kpiCard("TIEMPO EN TALLER", `${m.mttr.toFixed(1)} DÍAS`, "fa-clock", m.mttr > 5 ? "text-amber-500" : "text-cyan-400", "PROMEDIO MTTR")}
            ${kpiCard("TICKET PROMEDIO", fmt(m.ticket), "fa-tag", "text-white", "VALOR MEDIO / OT")}
            ${kpiCard("MARGEN OPERATIVO", pct(m.margenGeneral), "fa-chart-pie", "text-cyan-500", "RENTABILIDAD BRUTA")}
        `;
    };

    const kpiCard = (t, v, i, c, sub) => `
        <div class="kpi-card group">
            <i class="fas ${i} absolute -right-4 -bottom-4 text-7xl opacity-5 group-hover:scale-110 transition-transform duration-700"></i>
            <p class="text-[9px] font-black text-slate-500 mb-2 tracking-[0.2em] uppercase">${t}</p>
            <h2 class="text-2xl font-black orbitron ${c} mb-1">${v}</h2>
            <p class="text-[8px] text-slate-600 font-bold orbitron uppercase">${sub}</p>
        </div>`;

    const renderTable = (data) => {
        const body = document.getElementById("report-table-body");
        body.innerHTML = data.map(o => `
            <tr class="border-b border-white/[0.02] hover:bg-cyan-500/5 transition-all group">
                <td class="p-8">
                    <p class="font-black text-white orbitron text-base">${o.placa}</p>
                    <p class="text-[8px] text-slate-500 uppercase tracking-widest">${o.cliente.substring(0,20)}</p>
                </td>
                <td class="p-8">
                    <span class="px-4 py-2 rounded-xl text-[9px] font-black bg-black border border-white/10 ${o.area === 'MECANICA' ? 'text-cyan-400' : 'text-amber-400'} uppercase">
                        ${o.area}
                    </span>
                </td>
                <td class="p-8">
                    <p class="text-white font-black orbitron text-xs">${fmt(o.total)}</p>
                    <p class="text-[8px] text-slate-600">BRUTO FACTURADO</p>
                </td>
                <td class="p-8 text-center">
                    <span class="orbitron font-black ${o.dias > 5 ? 'text-red-500' : 'text-slate-400'}">${o.dias} DÍAS</span>
                </td>
                <td class="p-8 text-right">
                    <p class="font-black text-emerald-400 orbitron text-base">${fmt(o.utilidad)}</p>
                    <p class="text-[9px] text-emerald-500/50 font-black orbitron">${pct(o.margenPorcentaje)} MARGEN</p>
                </td>
                <td class="p-8 text-center">
                    <button onclick="window.exportSingleOT('${o.id}')" class="h-12 w-12 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all flex items-center justify-center">
                        <i class="fas fa-file-invoice"></i>
                    </button>
                </td>
            </tr>
        `).join("");
    };

    const renderCharts = (data) => {
        const labels = data.slice(-10).map(o => o.placa);
        const vals = data.slice(-10).map(o => o.utilidad);
        const colors = data.slice(-10).map(o => o.utilidad > 0 ? '#06b6d4' : '#ef4444');

        if (state.charts.main) state.charts.main.destroy();
        state.charts.main = new Chart(document.getElementById('mainChart'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Utilidad por Unidad',
                    data: vals,
                    backgroundColor: colors,
                    borderRadius: 8,
                    borderWidth: 0
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) { return fmt(context.raw); }
                        }
                    }
                },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { family: 'Orbitron', size: 8 } } },
                    x: { grid: { display: false }, ticks: { color: '#64748b', font: { family: 'Orbitron', size: 8 } } }
                }
            }
        });

        if (state.charts.pie) state.charts.pie.destroy();
        state.charts.pie = new Chart(document.getElementById('pieChart'), {
            type: 'doughnut',
            data: {
                labels: ['MEC', 'LAT', 'ELE'],
                datasets: [{
                    data: [
                        data.filter(o => o.area === 'MECANICA').length,
                        data.filter(o => o.area === 'LATONERIA').length,
                        data.filter(o => o.area === 'ELECTRICO').length
                    ],
                    backgroundColor: ['#06b6d4', '#fbbf24', '#a855f7'],
                    borderWidth: 0,
                    hoverOffset: 20
                }]
            },
            options: { cutout: '80%', plugins: { legend: { display: false } } }
        });
    };

    window.nexusFilter = (dias, btn) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filtrados = dias === 0 ? state.ordenesMaster : state.ordenesMaster.filter(o => o.fecha >= new Date(Date.now() - dias * 24 * 60 * 60 * 1000));
        processAndRender(filtrados);
    };

    const setupEventListeners = () => {
        document.getElementById("btnExportGlobal").onclick = () => {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(state.dataActual.map(o => ({
                "UNIDAD": o.placa, "CLIENTE": o.cliente, "BRUTO": o.total, "UTILIDAD": o.utilidad, "MARGEN": o.margenPorcentaje, "DÍAS": o.dias
            })));
            XLSX.utils.book_append_sheet(wb, ws, "NEXUS_DATA");
            XLSX.writeFile(wb, `Nexus_Audit_${Date.now()}.xlsx`);
        };
    };

    const loadDependencies = async () => {
        const libs = ["https://cdn.jsdelivr.net/npm/chart.js", "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"];
        for (const lib of libs) {
            if (!document.querySelector(`script[src="${lib}"]`)) {
                await new Promise(r => { const s = document.createElement("script"); s.src = lib; s.onload = r; document.head.appendChild(s); });
            }
        }
    };

    init();
}
