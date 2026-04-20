/**
 * 🦾 NEXUS-X STRATEGIC COMMANDER V40.2 - SAP INDUSTRIAL EDITION
 * William Jeffry Urquijo Cubillos // Nexus AI
 * Dashboard SAP/BI: MTTR, Eficiencia, Ticket Promedio y Productividad
 */

import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function nexusControlTower(container) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    let masterData = [];
    let metrics = {
        totalVentas: 0,
        utilidadBruta: 0,
        gastosFijos: 0,
        ticketPromedio: 0,
        mttr: 0, // Mean Time To Repair
        retrabajo: 0,
        statsAreas: { MECANICA: 0, LATONERIA: 0, ELECTRICO: 0 },
        statsVehiculos: { LIVIANO: 0, MEDIANO: 0, PESADO: 0 }
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
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&family=Inter:wght@300;400;700;900&display=swap');
            :root { --nexus-cyan: #06b6d4; --nexus-dark: #010409; --nexus-card: #0d1117; --nexus-border: rgba(6, 182, 212, 0.2); }
            .terminator-bg { background: var(--nexus-dark); color: #e2e8f0; font-family: 'Inter', sans-serif; min-height: 100vh; }
            .sap-card { background: var(--nexus-card); border: 1px solid var(--nexus-border); border-radius: 16px; position: relative; transition: 0.3s; }
            .sap-card:hover { border-color: var(--nexus-cyan); box-shadow: 0 0 30px rgba(6, 182, 212, 0.1); }
            .orbitron { font-family: 'Orbitron', sans-serif; }
            .kpi-label { font-size: 9px; letter-spacing: 0.2em; color: #64748b; font-weight: 900; text-transform: uppercase; }
            .kpi-value { font-size: 1.8rem; font-weight: 900; color: #fff; line-height: 1; }
            .sap-badge { padding: 4px 10px; border-radius: 4px; font-size: 9px; font-weight: 900; font-family: 'Orbitron'; }
            .area-mecanica { color: #38bdf8; background: rgba(56, 189, 248, 0.1); }
            .area-latoneria { color: #fbbf24; background: rgba(251, 191, 36, 0.1); }
            .area-electrico { color: #a855f7; background: rgba(168, 85, 247, 0.1); }
            .btn-nexus { background: rgba(6, 182, 212, 0.1); color: var(--nexus-cyan); border: 1px solid var(--nexus-border); padding: 8px 16px; border-radius: 8px; font-size: 10px; font-weight: 900; transition: 0.3s; }
            .btn-nexus:hover { background: var(--nexus-cyan); color: #000; box-shadow: 0 0 15px var(--nexus-cyan); }
            .progress-bar { height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; }
            .progress-fill { height: 100%; background: var(--nexus-cyan); transition: 1s cubic-bezier(0.17, 0.67, 0.83, 0.67); }
            .swal2-popup { background: #0d1117 !important; color: #fff !important; border: 1px solid var(--nexus-cyan) !important; font-family: 'Inter', sans-serif; }
        `;
        document.head.appendChild(style);
    };

    const renderSkeleton = () => {
        container.innerHTML = `
        <div class="terminator-bg">
            <header class="p-6 border-b border-white/5 sticky top-0 bg-[#010409]/80 backdrop-blur-xl z-50">
                <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
                    <div class="flex items-center gap-4">
                        <div class="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_15px_#06b6d4]"></div>
                        <div>
                            <h1 class="orbitron text-2xl font-black italic">NEXUS_X<span class="text-cyan-500">_SAP_BI</span></h1>
                            <p class="kpi-label">Strategic Intelligence Command v40.2</p>
                        </div>
                    </div>
                    <div class="flex gap-3 mt-4 md:mt-0">
                        <button id="btnExcelSAP" class="btn-nexus"><i class="fas fa-file-invoice-dollar mr-2"></i> INFORME SOCIOS SAP</button>
                        <button id="btnSync" class="btn-nexus"><i class="fas fa-sync-alt"></i></button>
                    </div>
                </div>
            </header>

            <main class="max-w-7xl mx-auto p-6 space-y-8">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="kpiGrid"></div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 sap-card p-8">
                        <div class="flex justify-between items-center mb-6">
                            <p class="kpi-label">Flujo de Caja vs Utilidad Operativa</p>
                            <span class="text-[10px] orbitron text-cyan-400">REAL-TIME BI</span>
                        </div>
                        <div class="h-80"><canvas id="mainFinanceChart"></canvas></div>
                    </div>
                    <div class="sap-card p-8">
                        <p class="kpi-label mb-6">Mix de Unidades (Liviano/Pesado)</p>
                        <div class="h-64"><canvas id="vehicleMixChart"></canvas></div>
                        <div id="techPerformance" class="mt-6 space-y-4"></div>
                    </div>
                </div>

                <div class="sap-card overflow-hidden">
                    <div class="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                        <h3 class="orbitron text-xs font-black uppercase">Monitor de Órdenes y Eficiencia</h3>
                        <div class="flex gap-4">
                            <select id="areaFilter" class="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] orbitron outline-none text-cyan-500">
                                <option value="TODOS">TODAS LAS ÁREAS</option>
                                <option value="MECANICA">MECÁNICA</option>
                                <option value="LATONERIA">LATONERÍA</option>
                                <option value="ELECTRICO">ELÉCTRICO</option>
                            </select>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-[11px]">
                            <thead class="bg-black/40 orbitron text-slate-500 border-b border-white/5 uppercase">
                                <tr>
                                    <th class="p-5">Vehículo / Cliente</th>
                                    <th class="p-5">Área Operativa</th>
                                    <th class="p-5 text-center">Desempeño (KPI)</th>
                                    <th class="p-5 text-right">Mano de Obra</th>
                                    <th class="p-5 text-right">Repuestos</th>
                                    <th class="p-5 text-right">Utilidad Neta</th>
                                    <th class="p-5 text-center">Acciones</th>
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
        // 1. Obtener Gastos (Contabilidad)
        const snapC = await getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId)));
        metrics.gastosFijos = 0;
        snapC.forEach(d => metrics.gastosFijos += Number(d.data().monto || d.data().valor || 0));

        // 2. Obtener Órdenes
        const snapO = await getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId)));
        
        let sumaMTTR = 0;
        metrics.utilidadBruta = 0;
        metrics.totalVentas = 0;
        metrics.statsAreas = { MECANICA: 0, LATONERIA: 0, ELECTRICO: 0 };
        metrics.statsVehiculos = { LIVIANO: 0, MEDIANO: 0, PESADO: 0 };

        masterData = snapO.docs.map(doc => {
            const o = doc.data();
            const items = o.items || [];
            
            // Cálculos SAP: Separación de MO y Repuestos
            const moVal = items.filter(i => i.tipo === 'MANO_OBRA').reduce((a,b) => a + Number(b.venta || 0), 0);
            const repVal = items.filter(i => i.tipo === 'REPUESTO').reduce((a,b) => a + Number(b.venta || 0), 0);
            
            const area = (o.tipo_orden || "MECANICA").toUpperCase();
            const clase = (o.clase_vehiculo || "LIVIANO").toUpperCase();
            const util = o.costos_totales?.utilidad || (Number(o.total || 0) - Number(o.costo_total || 0));
            const total = o.costos_totales?.gran_total || Number(o.total || 0);

            // Métricas de tiempo (MTTR)
            const dInicio = o.fecha_apertura?.toDate() || o.createdAt?.toDate() || new Date();
            const dFin = o.fecha_entrega?.toDate() || o.updatedAt?.toDate() || new Date();
            const dias = Math.ceil((dFin - dInicio) / (1000 * 60 * 60 * 24)) || 1;

            metrics.utilidadBruta += util;
            metrics.totalVentas += total;
            sumaMTTR += dias;
            metrics.statsAreas[area] = (metrics.statsAreas[area] || 0) + 1;
            metrics.statsVehiculos[clase] = (metrics.statsVehiculos[clase] || 0) + 1;

            return {
                id: doc.id,
                placa: o.placa || 'S/P',
                cliente: o.cliente || 'CLIENTE GENERAL',
                area, clase, moVal, repVal, util, total, dias,
                eficiencia: (moVal / (total || 1)) * 100 // Ratio de intensidad de servicio
            };
        });

        metrics.mttr = sumaMTTR / (masterData.length || 1);
        metrics.ticketPromedio = metrics.totalVentas / (masterData.length || 1);

        renderKPIs();
        renderCharts();
        renderTable(masterData);

        // Bind Events
        document.getElementById("btnExcelSAP").onclick = exportSAPExcel;
        document.getElementById("btnSync").onclick = syncAllSystems;
        document.getElementById("areaFilter").onchange = (e) => {
            const val = e.target.value;
            renderTable(val === 'TODOS' ? masterData : masterData.filter(o => o.area === val));
        };
    };

    const renderKPIs = () => {
        const grid = document.getElementById("kpiGrid");
        const netProfit = metrics.utilidadBruta - metrics.gastosFijos;
        
        grid.innerHTML = `
            ${kpiCard("Ticket Promedio (SAP)", `$${metrics.ticketPromedio.toLocaleString()}`, "fa-receipt", "text-white")}
            ${kpiCard("Utilidad Neta (BI)", `$${netProfit.toLocaleString()}`, "fa-chart-pie", netProfit > 0 ? "text-emerald-400" : "text-red-500")}
            ${kpiCard("MTTR (Eficiencia)", `${metrics.mttr.toFixed(1)} Días`, "fa-clock", "text-amber-500")}
            ${kpiCard("Margen de Contribución", `${((metrics.utilidadBruta/metrics.totalVentas)*100 || 0).toFixed(1)}%`, "fa-percentage", "text-cyan-400")}
        `;
    };

    const kpiCard = (l, v, i, c) => `
        <div class="sap-card p-6 overflow-hidden">
            <i class="fas ${i} absolute -right-4 -top-4 text-7xl opacity-5"></i>
            <p class="kpi-label mb-2">${l}</p>
            <p class="kpi-value orbitron ${c}">${v}</p>
        </div>`;

    const renderTable = (data) => {
        const body = document.getElementById("towerTableBody");
        body.innerHTML = data.map(o => `
            <tr class="hover:bg-white/[0.02] border-b border-white/[0.01]">
                <td class="p-5">
                    <div class="orbitron font-black text-white text-xs">${o.placa}</div>
                    <div class="text-[9px] text-slate-500 uppercase font-bold">${o.cliente.substring(0,22)}</div>
                </td>
                <td class="p-5">
                    <span class="sap-badge area-${o.area.toLowerCase()}">${o.area}</span>
                    <div class="text-[8px] text-slate-400 mt-1 orbitron font-black">${o.clase}</div>
                </td>
                <td class="p-5">
                    <div class="progress-bar mb-1"><div class="progress-fill" style="width: ${o.eficiencia}%"></div></div>
                    <div class="flex justify-between text-[8px] orbitron font-black text-slate-500">
                        <span>EFICIENCIA</span><span>${o.eficiencia.toFixed(0)}%</span>
                    </div>
                </td>
                <td class="p-5 text-right text-slate-300 font-bold">$${o.moVal.toLocaleString()}</td>
                <td class="p-5 text-right text-slate-300 font-bold">$${o.repVal.toLocaleString()}</td>
                <td class="p-5 text-right orbitron font-black text-emerald-400">$${o.util.toLocaleString()}</td>
                <td class="p-5 text-center">
                    <button onclick="window.nexusAction('${o.id}')" class="btn-nexus p-2">
                        <i class="fas fa-bolt"></i>
                    </button>
                </td>
            </tr>
        `).join("");
    };

    const renderCharts = () => {
        const ctxFin = document.getElementById('mainFinanceChart')?.getContext('2d');
        const ctxVeh = document.getElementById('vehicleMixChart')?.getContext('2d');

        new Chart(ctxFin, {
            type: 'line',
            data: {
                labels: masterData.map(o => o.placa),
                datasets: [
                    { label: 'Utilidad', data: masterData.map(o => o.util), borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.1)', fill: true, tension: 0.4 },
                    { label: 'Ingreso', data: masterData.map(o => o.total), borderColor: '#fff', borderDash: [5,5], tension: 0.4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        new Chart(ctxVeh, {
            type: 'doughnut',
            data: {
                labels: ['LIVIANO', 'MEDIANO', 'PESADO'],
                datasets: [{
                    data: [metrics.statsVehiculos.LIVIANO, metrics.statsVehiculos.MEDIANO, metrics.statsVehiculos.PESADO],
                    backgroundColor: ['#06b6d4', '#fbbf24', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: { cutout: '75%', plugins: { legend: { position: 'bottom', labels: { color: '#64748b', font: { family: 'Orbitron', size: 8 } } } } }
        });
    };

    window.nexusAction = async (id) => {
        const order = masterData.find(o => o.id === id);
        Swal.fire({
            title: `<span class="orbitron text-cyan-500">ORDEN: ${order.placa}</span>`,
            html: `
                <div class="text-left space-y-4 text-xs">
                    <p class="border-b border-white/10 pb-2"><b>CLIENTE:</b> ${order.cliente}</p>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-black/30 p-3 rounded border border-white/5">
                            <p class="kpi-label">Mano de Obra</p>
                            <p class="text-white font-bold">$${order.moVal.toLocaleString()}</p>
                        </div>
                        <div class="bg-black/30 p-3 rounded border border-white/5">
                            <p class="kpi-label">Repuestos</p>
                            <p class="text-white font-bold">$${order.repVal.toLocaleString()}</p>
                        </div>
                    </div>
                    <p class="text-center orbitron text-emerald-400 font-black text-lg mt-4">UTILIDAD: $${order.util.toLocaleString()}</p>
                </div>
            `,
            showDenyButton: true,
            confirmButtonText: '<i class="fas fa-eye"></i> VER TERMINAL',
            denyButtonText: '<i class="fas fa-file-pdf"></i> PDF SAP',
            confirmButtonColor: '#06b6d4',
            denyButtonColor: '#1e293b'
        }).then((result) => {
            if (result.isConfirmed) {
                if(window.abrirTerminalNexus) window.abrirTerminalNexus(id);
            }
        });
    };

    const exportSAPExcel = () => {
        const wb = XLSX.utils.book_new();
        const rows = masterData.map(o => ({
            "PLACA": o.placa, "CLIENTE": o.cliente, "AREA": o.area, "TIPO": o.clase,
            "MANO_OBRA": o.moVal, "REPUESTOS": o.repVal, "UTILIDAD": o.util, "DIAS_TALLER": o.dias
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "DATA_SAP");
        XLSX.writeFile(wb, `NexusX_SAP_Report_${Date.now()}.xlsx`);
    };

    const loadLibraries = async () => {
        const libs = [
            "https://cdn.jsdelivr.net/npm/chart.js",
            "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js",
            "https://cdn.jsdelivr.net/npm/sweetalert2@11"
        ];
        for (const lib of libs) {
            if (!document.querySelector(`script[src="${lib}"]`)) {
                await new Promise(r => { const s = document.createElement("script"); s.src = lib; s.onload = r; document.head.appendChild(s); });
            }
        }
    };

    init();
}
