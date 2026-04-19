/**
 * 🦾 NEXUS-X STRATEGIC COMMANDER V36.5 - TERMINATOR 2030 EDITION
 * William Jeffry Urquijo Cubillos // Nexus AI
 * Dashboard SAP/BI Especializado en Taller Automotriz (Liviano/Mediano/Pesado)
 */

import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function nexusControlTower(container) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    let masterData = [];
    let stats = {
        areas: { mecanica: 0, latoneria: 0, electrico: 0, otros: 0 },
        tiposVehiculo: { liviano: 0, mediano: 0, pesado: 0 },
        financial: { gastosFijos: 0, utilidadNeta: 0, breakEven: 0, totalIngresos: 0 }
    };

    const init = async () => {
        injectNexusStyles();
        renderSkeleton();
        await loadLibraries();
        await syncAllSystems();
    };

    const injectNexusStyles = () => {
        const style = document.createElement('style');
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&family=Inter:wght@300;400;700&display=swap');
            :root { --nexus-cyan: #06b6d4; --nexus-dark: #010409; --nexus-card: #0d1117; }
            .terminator-bg { background: var(--nexus-dark); color: #e2e8f0; font-family: 'Inter', sans-serif; }
            .tower-card { background: linear-gradient(165deg, #0d1117 0%, #010409 100%); border: 1px solid rgba(6, 182, 212, 0.15); border-radius: 20px; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
            .tower-card:hover { border-color: var(--nexus-cyan); box-shadow: 0 0 40px rgba(6, 182, 212, 0.1); transform: scale(1.01); }
            .orbitron { font-family: 'Orbitron', sans-serif; }
            .kpi-title { font-size: 8px; tracking: 0.3em; color: #64748b; text-transform: uppercase; font-weight: 900; }
            .kpi-main { font-size: 2.2rem; font-weight: 900; background: linear-gradient(to right, #fff, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .sap-badge { padding: 4px 12px; border-radius: 6px; font-size: 9px; font-family: 'Orbitron'; font-weight: 900; text-transform: uppercase; }
            .area-mecanica { color: #38bdf8; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); }
            .area-latoneria { color: #fbbf24; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); }
            .area-electrico { color: #a855f7; background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.2); }
            .veh-pesado { border-left: 4px solid #ef4444; }
            @keyframes pulse-nexus { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
            .live-dot { width: 10px; height: 10px; background: var(--nexus-cyan); border-radius: 50%; box-shadow: 0 0 10px var(--nexus-cyan); animation: pulse-nexus 2s infinite; }
        `;
        document.head.appendChild(style);
    };

    const renderSkeleton = () => {
        container.innerHTML = `
        <div class="terminator-bg min-h-screen pb-20">
            <header class="p-6 border-b border-white/5 sticky top-0 bg-[#010409]/90 backdrop-blur-md z-50">
                <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
                    <div class="flex items-center gap-4">
                        <div class="live-dot"></div>
                        <div>
                            <h1 class="orbitron text-2xl font-black text-white italic uppercase">NEXUS_X<span class="text-cyan-500">_BI_V36</span></h1>
                            <p class="text-[9px] tracking-[0.4em] text-slate-400 orbitron uppercase">Strategic Workshop Intelligence Core</p>
                        </div>
                    </div>
                    <button id="btnExcelGlobal" class="tower-card px-8 py-3 text-[10px] orbitron font-black text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all uppercase mt-4 md:mt-0">
                        <i class="fas fa-file-excel mr-2"></i> Informe Socios SAP
                    </button>
                </div>
            </header>

            <main class="max-w-7xl mx-auto px-4 pt-10 space-y-8">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="kpiGrid"></div>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2 tower-card p-8">
                        <h3 class="orbitron text-xs font-black text-slate-500 uppercase tracking-widest mb-10">Rendimiento Operativo</h3>
                        <div class="h-80"><canvas id="workshopAreaChart"></canvas></div>
                    </div>
                    <div class="tower-card p-8">
                        <h3 class="orbitron text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Mix de Vehículos</h3>
                        <div class="h-64"><canvas id="vehicleTypeChart"></canvas></div>
                    </div>
                </div>

                <div class="tower-card overflow-hidden">
                    <div class="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                        <h3 class="orbitron text-xs font-black text-white uppercase">Terminal de Seguimiento</h3>
                        <select id="filterArea" class="bg-black/40 text-[10px] orbitron border border-white/10 rounded-lg p-2 outline-none text-cyan-500 font-bold">
                            <option value="TODOS">TODAS LAS ÁREAS</option>
                            <option value="MECANICA">MECÁNICA</option>
                            <option value="LATONERIA">LATONERÍA/PINTURA</option>
                            <option value="ELECTRICO">ELÉCTRICO</option>
                        </select>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-[11px]">
                            <thead class="bg-white/2 orbitron text-slate-500 border-b border-white/5">
                                <tr>
                                    <th class="p-5">IDENTIFICACIÓN VEHÍCULO</th>
                                    <th class="p-5">CLASE/ÁREA</th>
                                    <th class="p-5 text-center">STATUS</th>
                                    <th class="p-5 text-right">UTILIDAD NETA</th>
                                    <th class="p-5 text-center">ACCIÓN</th>
                                </tr>
                            </thead>
                            <tbody id="towerTableBody" class="divide-y divide-white/[0.03]"></tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>`;
        
        document.getElementById("filterArea").addEventListener("change", (e) => {
            const val = e.target.value;
            const filtered = val === "TODOS" ? masterData : masterData.filter(o => o.area === val);
            renderTable(filtered);
        });
    };

    const syncAllSystems = async () => {
        // 1. DATA CONTABLE (Gastos y Egresos de Ordenes)
        const snapC = await getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId)));
        let gastosTotales = 0;
        snapC.forEach(d => {
            const m = d.data();
            // Sumamos egresos directos y contabilidad general (Cuentas 51)
            gastosTotales += Number(m.monto || m.valor || 0);
        });
        stats.financial.gastosFijos = gastosTotales;

        // 2. DATA DE ÓRDENES (REPARACIONES)
        const snapO = await getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId)));
        
        masterData = snapO.docs.map(doc => {
            const o = doc.data();
            
            // NORMALIZACIÓN DE DATOS V8 (Mapeo Quirúrgico)
            const area = (o.tipo_orden || "MECANICA").toUpperCase();
            const claseVehiculo = (o.clase_vehiculo || "LIVIANO").toUpperCase();
            
            // Si viene de Ordenes.js V8, la utilidad ya está calculada en costos_totales
            const utilidadCalculada = o.costos_totales?.utilidad || (Number(o.total || 0) - Number(o.costo_total || 0));
            const ingresosBrutos = o.costos_totales?.gran_total || Number(o.total || 0);

            // Contadores para Gráficos
            stats.areas[area.toLowerCase()] = (stats.areas[area.toLowerCase()] || 0) + 1;
            stats.tiposVehiculo[claseVehiculo.toLowerCase()] = (stats.tiposVehiculo[claseVehiculo.toLowerCase()] || 0) + 1;

            return {
                id: doc.id,
                placa: o.placa || 'S/P',
                cliente: o.cliente || 'CLIENTE GENERAL',
                area,
                claseVehiculo,
                estado: o.estado || 'TERMINADO',
                utilidad: utilidadCalculada,
                ingreso: ingresosBrutos,
                fecha: o.updatedAt?.toDate() || new Date()
            };
        });

        calculateFinancialCore();
        renderKPIs();
        renderCharts();
        renderTable(masterData);

        document.getElementById("btnExcelGlobal").onclick = exportSAPExcel;
    };

    const calculateFinancialCore = () => {
        stats.financial.totalIngresos = masterData.reduce((a,b) => a + b.ingreso, 0);
        const utilidadBrutaAcumulada = masterData.reduce((a,b) => a + b.utilidad, 0);
        
        // Utilidad Neta = Ganancia de órdenes - Gastos operativos de contabilidad
        stats.financial.utilidadNeta = utilidadBrutaAcumulada - stats.financial.gastosFijos;
        
        // Punto de Equilibrio (Ventas necesarias para cubrir gastos)
        const margenPromedio = stats.financial.totalIngresos > 0 ? (utilidadBrutaAcumulada / stats.financial.totalIngresos) : 0;
        stats.financial.breakEven = margenPromedio > 0 ? (stats.financial.gastosFijos / margenPromedio) : 0;
    };

    const renderKPIs = () => {
        const kpiGrid = document.getElementById("kpiGrid");
        kpiGrid.innerHTML = `
            ${kpiCard("UTILIDAD NETA TOTAL", `$${stats.financial.utilidadNeta.toLocaleString()}`, "fas fa-cash-register", stats.financial.utilidadNeta > 0 ? "text-emerald-400" : "text-red-500")}
            ${kpiCard("PUNTO EQUILIBRIO", `$${stats.financial.breakEven.toLocaleString()}`, "fas fa-chart-line", "text-cyan-400")}
            ${kpiCard("GASTOS OPERATIVOS", `$${stats.financial.gastosFijos.toLocaleString()}`, "fas fa-receipt", "text-amber-500")}
            ${kpiCard("FACTURACIÓN BRUTA", `$${stats.financial.totalIngresos.toLocaleString()}`, "fas fa-vault", "text-white")}
        `;
    };

    const kpiCard = (l, v, i, c) => `
        <div class="tower-card p-6 relative overflow-hidden">
            <i class="${i} absolute -right-2 -bottom-2 text-6xl opacity-5"></i>
            <p class="kpi-title orbitron mb-4">${l}</p>
            <p class="kpi-main orbitron ${c}">${v}</p>
            <div class="mt-4 flex items-center gap-2">
                <span class="text-[9px] text-slate-500 orbitron">OPERATIONAL BI STATE</span>
            </div>
        </div>`;

    const renderTable = (data) => {
        const body = document.getElementById("towerTableBody");
        body.innerHTML = data.map(o => `
            <tr class="hover:bg-white/[0.02] border-b border-white/[0.01] ${o.claseVehiculo === 'PESADO' ? 'veh-pesado' : ''}">
                <td class="p-5">
                    <div class="orbitron font-black text-white text-xs">${o.placa}</div>
                    <div class="text-[9px] text-slate-500 uppercase">${o.cliente.substring(0,25)}</div>
                </td>
                <td class="p-5">
                    <span class="sap-badge area-${o.area.toLowerCase()}">${o.area}</span>
                    <div class="text-[8px] text-slate-500 mt-1 orbitron">${o.claseVehiculo}</div>
                </td>
                <td class="p-5 text-center">
                    <span class="px-3 py-1 rounded text-[8px] orbitron font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        ${o.estado}
                    </span>
                </td>
                <td class="p-5 text-right orbitron font-black ${o.utilidad > 0 ? 'text-emerald-400' : 'text-red-400'}">
                    $${o.utilidad.toLocaleString()}
                </td>
                <td class="p-5 text-center">
                    <button class="text-slate-500 hover:text-white transition-all"><i class="fas fa-eye"></i></button>
                </td>
            </tr>
        `).join("");
    };

    const renderCharts = () => {
        const ctxArea = document.getElementById('workshopAreaChart')?.getContext('2d');
        const ctxVeh = document.getElementById('vehicleTypeChart')?.getContext('2d');

        if(ctxArea) {
            new Chart(ctxArea, {
                type: 'bar',
                data: {
                    labels: ['MECÁNICA', 'LATONERÍA', 'ELÉCTRICO'],
                    datasets: [{
                        label: 'Órdenes por Área',
                        data: [stats.areas.mecanica, stats.areas.latoneria, stats.areas.electrico],
                        backgroundColor: ['rgba(56, 189, 248, 0.5)', 'rgba(251, 191, 36, 0.5)', 'rgba(168, 85, 247, 0.5)'],
                        borderColor: ['#38bdf8', '#fbbf24', '#a855f7'],
                        borderWidth: 2
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }

        if(ctxVeh) {
            new Chart(ctxVeh, {
                type: 'doughnut',
                data: {
                    labels: ['LIVIANO', 'MEDIANO', 'PESADO'],
                    datasets: [{
                        data: [stats.tiposVehiculo.liviano, stats.tiposVehiculo.mediano, stats.tiposVehiculo.pesado],
                        backgroundColor: ['#06b6d4', '#3b82f6', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, cutout: '80%' }
            });
        }
    };

    const exportSAPExcel = () => {
        const wb = XLSX.utils.book_new();
        const gerData = [
            ["INFORME ESTRATÉGICO SAP - NEXUS-X"],
            ["GENERADO:", new Date().toLocaleString()],
            [],
            ["KPIs FINANCIEROS"],
            ["Utilidad Neta Total", stats.financial.utilidadNeta],
            ["Punto de Equilibrio", stats.financial.breakEven],
            ["Total Ingresos Brutos", stats.financial.totalIngresos],
            ["Gastos Operativos (Nómina/Insumos)", stats.financial.gastosFijos],
            [],
            ["DISTRIBUCIÓN OPERATIVA"],
            ["Mecánica", stats.areas.mecanica],
            ["Latonería", stats.areas.latoneria],
            ["Eléctrico", stats.areas.electrico]
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(gerData), "SAP_SUMARIO");
        XLSX.writeFile(wb, `NEXUS_SAP_BI_${Date.now()}.xlsx`);
    };

    const loadLibraries = async () => {
        const libs = [
            "https://cdn.jsdelivr.net/npm/chart.js",
            "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"
        ];
        for (const lib of libs) {
            if (!document.querySelector(`script[src="${lib}"]`)) {
                await new Promise(r => { const s = document.createElement("script"); s.src = lib; s.onload = r; document.head.appendChild(s); });
            }
        }
    };

    init();
}
