/**
 * 🦾 NEXUS-X STRATEGIC COMMANDER V36.5 - TERMINATOR 2030 EDITION
 * William Jeffry Urquijo Cubillos // Nexus AI
 * Dashboard SAP/BI Especializado en Taller Automotriz (Liviano/Mediano/Pesado)
 */

import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function nexusControlTower(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let masterData = [];
    let stats = {
        areas: { mecanica: 0, latoneria: 0, electrico: 0, otros: 0 },
        tiposVehiculo: { liviano: 0, mediano: 0, pesado: 0 },
        financial: { gastosFijos: 0, utilidadNeta: 0, breakEven: 0, roi: 0 }
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
            .kpi-title { font-[8px] tracking-[0.3em] text-slate-500 uppercase font-black; }
            .kpi-main { font-size: 2.2rem; font-weight: 900; background: linear-gradient(to right, #fff, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .sap-badge { padding: 4px 12px; border-radius: 6px; font-[9px] orbitron font-black uppercase; }
            .area-mecanica { color: #38bdf8; background: rgba(56, 189, 248, 0.1); }
            .area-latoneria { color: #fbbf24; background: rgba(251, 191, 36, 0.1); }
            .area-electrico { color: #a855f7; background: rgba(168, 85, 247, 0.1); }
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
                            <h1 class="orbitron text-2xl font-black text-white italic">NEXUS_X<span class="text-cyan-500">_BI_TERMINATOR</span></h1>
                            <p class="text-[9px] tracking-[0.4em] text-slate-400 orbitron uppercase">Strategic Workshop Intelligence Core</p>
                        </div>
                    </div>
                    <div class="flex gap-4 mt-4 md:mt-0">
                        <button id="btnExcelGlobal" class="tower-card px-6 py-2 text-[10px] orbitron font-black text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all uppercase">
                            <i class="fas fa-file-excel mr-2"></i> Informe Socios SAP
                        </button>
                    </div>
                </div>
            </header>

            <main class="max-w-7xl mx-auto px-4 pt-10 space-y-8">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="kpiGrid">
                    ${Array(4).fill('<div class="h-32 tower-card animate-pulse"></div>').join('')}
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2 tower-card p-8">
                        <div class="flex justify-between items-center mb-10">
                            <h3 class="orbitron text-xs font-black text-slate-500 uppercase tracking-widest">Rendimiento Operativo por Área</h3>
                            <div class="flex gap-4 text-[9px] orbitron">
                                <span class="text-cyan-400">● MECÁNICA</span>
                                <span class="text-amber-400">● LATONERÍA</span>
                                <span class="text-purple-400">● ELÉCTRICO</span>
                            </div>
                        </div>
                        <div class="h-80"><canvas id="workshopAreaChart"></canvas></div>
                    </div>
                    
                    <div class="tower-card p-8">
                        <h3 class="orbitron text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Mix de Vehículos</h3>
                        <div class="h-64"><canvas id="vehicleTypeChart"></canvas></div>
                        <div id="vehicleStats" class="mt-6 space-y-3"></div>
                    </div>
                </div>

                <div class="tower-card overflow-hidden">
                    <div class="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                        <h3 class="orbitron text-xs font-black text-white uppercase tracking-tighter">Terminal de Seguimiento Automotriz</h3>
                        <div class="flex gap-2">
                            <select id="filterArea" class="bg-black/40 text-[10px] orbitron border border-white/10 rounded-lg p-2">
                                <option value="TODOS">TODAS LAS ÁREAS</option>
                                <option value="MECANICA">MECÁNICA</option>
                                <option value="LATONERIA">LATONERÍA/PINTURA</option>
                                <option value="ELECTRICO">ELÉCTRICO</option>
                            </select>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-[11px]">
                            <thead class="bg-white/2 orbitron text-slate-500 border-b border-white/5">
                                <tr>
                                    <th class="p-5">IDENTIFICACIÓN VEHÍCULO</th>
                                    <th class="p-5">CLASE/TIPO</th>
                                    <th class="p-5 text-center">EFICIENCIA</th>
                                    <th class="p-5 text-center">VPC (ENTREGA)</th>
                                    <th class="p-5 text-right">UTILIDAD BRUTA</th>
                                    <th class="p-5 text-center">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody id="towerTableBody" class="divide-y divide-white/[0.03]"></tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>`;
    };

    const syncAllSystems = async () => {
        // 1. DATA CONTABLE (PUC 51)
        const snapC = await getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId)));
        let gastosTotales = 0;
        snapC.forEach(d => {
            const m = d.data();
            if(m.cuenta?.startsWith("5105") || m.cuenta?.startsWith("5195")) {
                gastosTotales += Number(m.valor || 0);
            }
        });
        stats.financial.gastosFijos = gastosTotales;

        // 2. DATA DE ÓRDENES (REPARACIONES)
        const snapO = await getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId)));
        
        masterData = snapO.docs.map(doc => {
            const o = doc.data();
            const hFact = Number(o.horas_facturadas || 0);
            const hReal = Number(o.horas_reales || 0);
            
            // Clasificación de Áreas y Tipos (Basado en tu nuevo requerimiento)
            const area = o.tipo_orden || "MECANICA"; // Mecánica, Latonería, Eléctrico
            const claseVehiculo = o.clase_vehiculo || "LIVIANO"; // Pequeño, Mediano, Pesado

            stats.areas[area.toLowerCase()] = (stats.areas[area.toLowerCase()] || 0) + 1;
            stats.tiposVehiculo[claseVehiculo.toLowerCase()] = (stats.tiposVehiculo[claseVehiculo.toLowerCase()] || 0) + 1;

            return {
                id: doc.id,
                ...o,
                area,
                claseVehiculo,
                eficiencia: hReal > 0 ? (hFact / hReal) * 100 : 100,
                utilidad: Number(o.total || 0) - Number(o.costo_total || 0),
                diasCiclo: Math.ceil(((o.fecha_entrega?.toDate() || new Date()) - (o.fecha_apertura?.toDate() || new Date())) / (1000 * 60 * 60 * 24))
            };
        });

        calculateFinancialCore();
        renderKPIs();
        renderCharts();
        renderTable(masterData);

        document.getElementById("btnExcelGlobal").onclick = exportSAPExcel;
    };

    const calculateFinancialCore = () => {
        const totalIngresos = masterData.reduce((a,b) => a + (Number(b.total) || 0), 0);
        const utilidadBruta = masterData.reduce((a,b) => a + b.utilidad, 0);
        stats.financial.utilidadNeta = utilidadBruta - stats.financial.gastosFijos;
        stats.financial.breakEven = utilidadBruta > 0 ? (stats.financial.gastosFijos / (utilidadBruta / totalIngresos)) : 0;
    };

    const renderKPIs = () => {
        const kpiGrid = document.getElementById("kpiGrid");
        const efGlobal = (masterData.reduce((a,b)=>a+b.eficiencia,0)/masterData.length || 0);

        kpiGrid.innerHTML = `
            ${kpiCard("UTILIDAD NETA OPERATIVA", `$${stats.financial.utilidadNeta.toLocaleString()}`, "fas fa-cash-register", stats.financial.utilidadNeta > 0 ? "text-emerald-400" : "text-red-500")}
            ${kpiCard("PUNTO EQUILIBRIO", `$${stats.financial.breakEven.toLocaleString()}`, "fas fa-chart-line", "text-cyan-400")}
            ${kpiCard("EFICIENCIA TALLER", `${efGlobal.toFixed(1)}%`, "fas fa-tools", "text-purple-400")}
            ${kpiCard("TOTAL INGRESOS (BRUTO)", `$${masterData.reduce((a,b)=>a+Number(b.total || 0),0).toLocaleString()}`, "fas fa-vault", "text-white")}
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
                    <div class="orbitron font-black text-white text-xs">${o.placa || 'NEW-000'}</div>
                    <div class="text-[9px] text-slate-500 uppercase">${o.cliente?.substring(0,25) || 'CLIENTE GENERAL'}</div>
                </td>
                <td class="p-5">
                    <span class="sap-badge area-${o.area.toLowerCase()}">${o.area}</span>
                    <div class="text-[8px] text-slate-500 mt-1 orbitron">${o.claseVehiculo}</div>
                </td>
                <td class="p-5 text-center">
                    <div class="orbitron font-bold ${o.eficiencia >= 100 ? 'text-emerald-400' : 'text-amber-500'}">${o.eficiencia.toFixed(1)}%</div>
                </td>
                <td class="p-5 text-center">
                    <span class="px-3 py-1 rounded text-[8px] orbitron font-black ${o.diasCiclo <= 4 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}">
                        ${o.diasCiclo <= 4 ? 'A TIEMPO' : o.diasCiclo + ' DÍAS'}
                    </span>
                </td>
                <td class="p-5 text-right orbitron font-black text-white">$${o.utilidad.toLocaleString()}</td>
                <td class="p-5 text-center">
                    <button onclick="window.exportSinglePDF('${o.id}')" class="text-slate-400 hover:text-cyan-400 transition-all"><i class="fas fa-file-pdf"></i></button>
                </td>
            </tr>
        `).join("");
    };

    const exportSAPExcel = () => {
        const wb = XLSX.utils.book_new();
        
        // Pestaña Gerencial
        const gerData = [
            ["INFORME JUNTA DE SOCIOS - NEXUS-X AUTOMOTIVE"],
            ["FECHA:", new Date().toLocaleDateString()],
            [],
            ["KPIs DE GERENCIA"],
            ["Utilidad Neta", stats.financial.utilidadNeta],
            ["Punto de Equilibrio", stats.financial.breakEven],
            ["Gastos Operacionales (CUENTA 51)", stats.financial.gastosFijos],
            [],
            ["INDICADORES POR ÁREA"],
            ["Área", "Órdenes", "Participación %"],
            ["Mecánica", stats.areas.mecanica, ((stats.areas.mecanica/masterData.length)*100).toFixed(2)],
            ["Latonería", stats.areas.latoneria, ((stats.areas.latoneria/masterData.length)*100).toFixed(2)],
            ["Eléctrico", stats.areas.electrico, ((stats.areas.electrico/masterData.length)*100).toFixed(2)]
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(gerData), "Consolidado_SAP");

        // Pestaña Detalle Técnico
        const techData = masterData.map(o => ({
            Placa: o.placa, Cliente: o.cliente, Area: o.area, Clase: o.claseVehiculo,
            Eficiencia: o.eficiencia.toFixed(2), Utilidad: o.utilidad, Dias_Taller: o.diasCiclo
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(techData), "Data_Misiones");

        XLSX.writeFile(wb, `NexusX_SAP_BI_Report.xlsx`);
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
