/**
 * 🦾 NEXUS-X STRATEGIC COMMANDER V36.0 - CONTROL TOWER
 * William Jeffry Urquijo Cubillos // Nexus AI
 * Integración Total: BESA Lab KPIs, VPC EAFIT, Contabilidad & Inventario
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function nexusControlTower(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let masterData = [];
    let summary = { productividad: 0, eficiencia: 0, margenPintura: 0, tiempoCiclo: 0 };

    const init = async () => {
        injectNexusStyles();
        renderSkeleton();
        await loadLibraries();
        await syncAllSystems();
    };

    const injectNexusStyles = () => {
        const style = document.createElement('style');
        style.innerHTML = `
            .tower-card { background: linear-gradient(145deg, #0d1117, #161b22); border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s ease; }
            .tower-card:hover { border-color: #06b6d4; box-shadow: 0 0 20px rgba(6, 182, 212, 0.15); }
            .kpi-value { font-family: 'Orbitron', sans-serif; font-weight: 900; letter-spacing: -1px; }
            .glass-header { backdrop-filter: blur(12px); background: rgba(1, 4, 9, 0.8); sticky; top: 0; z-index: 100; }
            @keyframes pulse-cyan { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
            .live-indicator { width: 8px; height: 8px; background: #06b6d4; border-radius: 50%; animation: pulse-cyan 2s infinite; }
        `;
        document.head.appendChild(style);
    };

    const renderSkeleton = () => {
        container.innerHTML = `
        <div class="bg-[#010409] min-h-screen text-slate-300 font-sans pb-10">
            <header class="glass-header border-b border-white/10 p-4 md:p-6 mb-6">
                <div class="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <div class="flex items-center gap-2">
                            <div class="live-indicator"></div>
                            <h1 class="orbitron text-xl md:text-2xl font-black italic text-white">NEXUS<span class="text-cyan-500">_TOWER</span></h1>
                        </div>
                        <p class="text-[8px] orbitron tracking-[0.4em] text-slate-500 uppercase">Strategic Ops & Financial Intelligence</p>
                    </div>
                    <button id="btnDownloadTower" class="tower-card px-6 py-2 rounded-full text-xs orbitron font-black text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all">
                        <i class="fas fa-file-invoice-dollar mr-2"></i> INFORME GLOBAL
                    </button>
                </div>
            </header>

            <main class="max-w-7xl mx-auto px-4 space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4" id="kpiGrid">
                    ${Array(4).fill('<div class="h-32 tower-card animate-pulse rounded-3xl"></div>').join('')}
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 tower-card rounded-3xl p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="orbitron text-xs font-black text-slate-400">FLUJO DE RENTABILIDAD & TIEMPO DE CICLO</h3>
                            <div class="flex gap-4 text-[9px] orbitron">
                                <span class="text-cyan-400">● INGRESOS</span>
                                <span class="text-purple-500">● COSTOS</span>
                            </div>
                        </div>
                        <div class="h-64"><canvas id="mainTowerChart"></canvas></div>
                    </div>

                    <div class="tower-card rounded-3xl p-6">
                        <h3 class="orbitron text-xs font-black text-slate-400 mb-6 uppercase">Salud de Inventario (Pintura/BESA)</h3>
                        <div id="inventoryStatus" class="space-y-4"></div>
                    </div>
                </div>

                <div class="tower-card rounded-3xl overflow-hidden">
                    <div class="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <h3 class="orbitron text-xs font-black text-white">TORRE DE MISIONES ACTIVAS</h3>
                        <input type="text" id="nexusSearch" placeholder="PLACA O CLIENTE..." class="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-[10px] orbitron focus:border-cyan-500 outline-none w-48">
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-[11px]">
                            <thead class="text-slate-500 uppercase orbitron border-b border-white/5">
                                <tr>
                                    <th class="p-4">Unidad</th>
                                    <th class="p-4">Eficiencia (BESA)</th>
                                    <th class="p-4">VPC (EAFIT)</th>
                                    <th class="p-4 text-right">Resultado Financiero</th>
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
        // Absorción total de datos
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        
        masterData = snap.docs.map(doc => {
            const d = doc.data();
            
            // LÓGICA DE NEGOCIO: BESA LAB KPIs
            const hDisponibles = Number(d.horas_disponibles || 160); // Ejemplo mensual
            const hTrabajadas = Number(d.horas_reales || 0);
            const hFacturadas = Number(d.horas_facturadas || 0);
            
            const eficiencia = hTrabajadas > 0 ? (hFacturadas / hTrabajadas) * 100 : 0;
            const productividad = (hTrabajadas / hDisponibles) * 100;
            
            // LÓGICA DE NEGOCIO: VPC EAFIT (Tiempo de Ciclo)
            const fEntrada = d.fecha_apertura?.toDate() || new Date();
            const fEntrega = d.fecha_entrega?.toDate() || new Date();
            const diasCiclo = Math.ceil((fEntrega - fEntrada) / (1000 * 60 * 60 * 24));
            const statusVPC = diasCiclo <= 4 ? "ÓPTIMO" : "RIESGO";

            return { id: doc.id, ...d, eficiencia, productividad, diasCiclo, statusVPC, 
                     utilidad: (Number(d.total) - Number(d.costo_total)) || 0 };
        });

        renderKPIs();
        renderCharts();
        renderTable(masterData);
        document.getElementById("btnDownloadTower").onclick = () => exportControlTowerExcel();
    };

    const renderKPIs = () => {
        const avgEficiencia = masterData.reduce((a,b) => a + b.eficiencia, 0) / (masterData.length || 1);
        const totalVenta = masterData.reduce((a,b) => a + (Number(b.total) || 0), 0);
        const avgCiclo = masterData.reduce((a,b) => a + b.diasCiclo, 0) / (masterData.length || 1);

        document.getElementById("kpiGrid").innerHTML = `
            ${kpiCard("Eficiencia Operativa", `${avgEficiencia.toFixed(1)}%`, "bg-cyan-500/10", "text-cyan-400", "fas fa-bolt")}
            ${kpiCard("Ticket Promedio", `$${(totalVenta / masterData.length || 0).toLocaleString()}`, "bg-white/5", "text-white", "fas fa-chart-line")}
            ${kpiCard("Tiempo de Ciclo", `${avgCiclo.toFixed(1)} Días`, "bg-purple-500/10", "text-purple-400", "fas fa-hourglass-half")}
            ${kpiCard("Utilidad Neta", `$${masterData.reduce((a,b) => a+b.utilidad,0).toLocaleString()}`, "bg-emerald-500/10", "text-emerald-400", "fas fa-wallet")}
        `;
    };

    const kpiCard = (l, v, bg, c, icon) => `
        <div class="tower-card p-6 rounded-3xl flex flex-col justify-between">
            <div class="flex justify-between items-start">
                <p class="orbitron text-[9px] font-black text-slate-500 uppercase">${l}</p>
                <i class="${icon} ${c} opacity-50"></i>
            </div>
            <p class="kpi-value text-2xl mt-4 ${c}">${v}</p>
            <div class="mt-2 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div class="h-full ${bg.replace('/10','')} w-2/3"></div>
            </div>
        </div>`;

    const renderTable = (data) => {
        const body = document.getElementById("towerTableBody");
        body.innerHTML = data.map(o => `
            <tr class="hover:bg-white/[0.02] transition-all cursor-pointer border-b border-white/[0.02]">
                <td class="p-4">
                    <div class="flex flex-col">
                        <span class="orbitron font-black text-cyan-400">${o.placa || 'N/A'}</span>
                        <span class="text-[9px] text-slate-500 font-bold">${o.cliente?.substring(0,20) || 'SIN NOMBRE'}</span>
                    </div>
                </td>
                <td class="p-4">
                    <div class="flex items-center gap-2">
                        <span class="orbitron font-bold">${o.eficiencia.toFixed(1)}%</span>
                        <div class="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div class="h-full bg-cyan-500" style="width: ${o.eficiencia}%"></div>
                        </div>
                    </div>
                </td>
                <td class="p-4">
                    <span class="px-2 py-0.5 rounded text-[9px] orbitron font-black ${o.statusVPC === 'ÓPTIMO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}">
                        ${o.statusVPC}
                    </span>
                </td>
                <td class="p-4 text-right font-black orbitron text-white">
                    $${(o.utilidad || 0).toLocaleString()}
                </td>
            </tr>
        `).join("");
    };

    const exportControlTowerExcel = () => {
        const wb = XLSX.utils.book_new();
        
        // HOJA 1: DASHBOARD INTERACTIVO (RESUMEN GERENCIAL)
        const dashboardData = [
            ["NEXUS-X STRATEGIC COMMANDER - INFORME DE RENDIMIENTO"],
            ["Empresa ID:", empresaId, "Fecha:", new Date().toLocaleDateString()],
            [],
            ["INDICADORES CLAVE (KPIs)"],
            ["Métrica", "Resultado", "Referencia (BESA/EAFIT)", "Estado"],
            ["Índice de Eficiencia", `${(masterData.reduce((a,b)=>a+b.eficiencia,0)/masterData.length).toFixed(1)}%`, "100%", "Analizado"],
            ["Tiempo de Ciclo (VPC)", `${(masterData.reduce((a,b)=>a+b.diasCiclo,0)/masterData.length).toFixed(1)} Días`, "4 Días", "Operativo"],
            ["Utilidad Total", masterData.reduce((a,b)=>a+b.utilidad,0)],
            [],
            ["ANÁLISIS DE MEJORA"],
            ["Si la Eficiencia es < 90%, revisar asignación de tareas a técnicos."],
            ["Si el Tiempo de Ciclo es > 4 días, el Valor Percibido (VPC) está en riesgo."]
        ];
        const wsDash = XLSX.utils.aoa_to_sheet(dashboardData);
        XLSX.utils.book_append_sheet(wb, wsDash, "Dashboard_Gerencial");

        // HOJA 2: DATA CRUDA VINCULADA
        const wsData = XLSX.utils.json_to_sheet(masterData.map(o => ({
            Placa: o.placa,
            Cliente: o.cliente,
            Fecha_Ingreso: o.fecha_apertura?.toDate().toLocaleDateString(),
            Horas_Facturadas: o.horas_facturadas,
            Horas_Reales: o.horas_reales,
            Eficiencia: o.eficiencia.toFixed(2),
            Utilidad: o.utilidad,
            Dias_Ciclo: o.diasCiclo,
            Estatus_VPC: o.statusVPC
        })));
        XLSX.utils.book_append_sheet(wb, wsData, "Base_Datos_Torre");

        XLSX.writeFile(wb, `NexusX_Tower_Report_${new Date().getTime()}.xlsx`);
    };

    const loadLibraries = async () => {
        const libs = ["https://cdn.jsdelivr.net/npm/chart.js", "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"];
        for (const lib of libs) {
            await new Promise(r => { const s = document.createElement("script"); s.src = lib; s.onload = r; document.head.appendChild(s); });
        }
    };

    init();
}
