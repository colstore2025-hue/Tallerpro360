/**
 * 🦾 NEXUS-X STRATEGIC COMMANDER V42.0 - SAP INDUSTRIAL HYPER-DRIVE
 * William Jeffry Urquijo Cubillos // Nexus AI
 * Dashboard SAP/BI: MTTR, Auditoría Financiera, Alertas de Voz y Control de OT
 */

import { collection, getDocs, query, where, orderBy, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function nexusControlTower(container) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    
    // SISTEMA DE VOZ NEXUS
    const synth = window.speechSynthesis;
    const speakNexus = (text) => {
        if (synth.speaking) synth.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'es-ES';
        utter.pitch = 0.85; 
        utter.rate = 0.95;
        synth.speak(utter);
    };

    let masterData = [];
    let metrics = {
        totalFacturacion: 0,
        costoOperativoOrdenes: 0,
        utilidadBruta: 0,
        gastosFijosContables: 0,
        utilidadNetaReal: 0,
        mttr: 0,
        ticketPromedio: 0,
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
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&family=Inter:wght@300;400;600;900&display=swap');
            :root { --nexus-cyan: #06b6d4; --nexus-dark: #010409; --nexus-card: #0d1117; --nexus-border: rgba(6, 182, 212, 0.2); --nexus-red: #ef4444; }
            .terminator-bg { background: var(--nexus-dark); color: #e2e8f0; font-family: 'Inter', sans-serif; min-height: 100vh; }
            .sap-card { background: var(--nexus-card); border: 1px solid var(--nexus-border); border-radius: 16px; position: relative; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
            .sap-card:hover { border-color: var(--nexus-cyan); box-shadow: 0 0 40px rgba(6, 182, 212, 0.15); transform: translateY(-2px); }
            .orbitron { font-family: 'Orbitron', sans-serif; }
            .kpi-label { font-size: 10px; letter-spacing: 0.2em; color: #64748b; font-weight: 900; text-transform: uppercase; }
            .kpi-value { font-size: 2rem; font-weight: 900; color: #fff; line-height: 1; letter-spacing: -1px; }
            .sap-badge { padding: 4px 10px; border-radius: 6px; font-size: 9px; font-weight: 900; font-family: 'Orbitron'; text-transform: uppercase; }
            .area-mecanica { color: #38bdf8; background: rgba(56, 189, 248, 0.1); border: 1px solid #38bdf844; }
            .area-latoneria { color: #fbbf24; background: rgba(251, 191, 36, 0.1); border: 1px solid #fbbf2444; }
            .area-electrico { color: #a855f7; background: rgba(168, 85, 247, 0.1); border: 1px solid #a855f744; }
            .btn-nexus { background: rgba(6, 182, 212, 0.05); color: var(--nexus-cyan); border: 1px solid var(--nexus-border); padding: 10px 20px; border-radius: 10px; font-size: 10px; font-weight: 900; cursor: pointer; transition: 0.3s; }
            .btn-nexus:hover { background: var(--nexus-cyan); color: #000; box-shadow: 0 0 20px var(--nexus-cyan); }
            .progress-bar { height: 8px; background: rgba(255,255,255,0.05); border-radius: 20px; overflow: hidden; margin: 8px 0; }
            .progress-fill { height: 100%; background: linear-gradient(90deg, #06b6d4, #3b82f6); transition: 1.5s ease-in-out; }
            .critical-row { border-left: 4px solid var(--nexus-red) !important; background: rgba(239, 68, 68, 0.03); }
            .swal2-popup { background: #0d1117 !important; border: 1px solid var(--nexus-cyan) !important; border-radius: 20px !important; }
            .swal2-title { font-family: 'Orbitron' !important; color: #fff !important; font-size: 14px !important; }
        `;
        document.head.appendChild(style);
    };

    const renderSkeleton = () => {
        container.innerHTML = `
        <div class="terminator-bg">
            <header class="p-6 border-b border-white/5 sticky top-0 bg-[#010409]/90 backdrop-blur-xl z-50">
                <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
                    <div class="flex items-center gap-5">
                        <div class="relative">
                            <div class="w-4 h-4 bg-cyan-500 rounded-full animate-ping opacity-75"></div>
                            <div class="absolute inset-0 w-4 h-4 bg-cyan-500 rounded-full shadow-[0_0_20px_#06b6d4]"></div>
                        </div>
                        <div>
                            <h1 class="orbitron text-2xl font-black italic tracking-tighter">NEXUS_X<span class="text-cyan-500">_AUDIT_BI</span></h1>
                            <p class="kpi-label">Strategic SAP Commander v42.0 // William Urquijo</p>
                        </div>
                    </div>
                    <div class="flex gap-3 mt-5 md:mt-0">
                        <button id="btnExcelSAP" class="btn-nexus"><i class="fas fa-file-excel mr-2"></i> EXPORTAR AUDITORÍA</button>
                        <button id="btnSync" class="btn-nexus"><i class="fas fa-sync-alt"></i></button>
                    </div>
                </div>
            </header>

            <main class="max-w-7xl mx-auto p-6 space-y-10">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="kpiGrid"></div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2 sap-card p-8">
                        <div class="flex justify-between items-center mb-10">
                            <div>
                                <p class="kpi-label">Flujo Operativo de Caja</p>
                                <p class="text-[9px] text-slate-500 orbitron">INGRESOS VS UTILIDAD POR ORDEN</p>
                            </div>
                            <i class="fas fa-chart-area text-cyan-500/20 text-2xl"></i>
                        </div>
                        <div class="h-80"><canvas id="mainFinanceChart"></canvas></div>
                    </div>
                    
                    <div class="space-y-6">
                        <div class="sap-card p-8">
                            <p class="kpi-label mb-6">Mix de Unidades</p>
                            <div class="h-48"><canvas id="vehicleMixChart"></canvas></div>
                        </div>
                        <div class="sap-card p-8">
                            <p class="kpi-label mb-4">Intensidad Técnica (Horas/MO)</p>
                            <div class="h-48"><canvas id="moIntensityChart"></canvas></div>
                        </div>
                    </div>
                </div>

                <div class="sap-card overflow-hidden shadow-2xl">
                    <div class="p-6 bg-white/5 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h3 class="orbitron text-xs font-black uppercase text-cyan-500">Terminal de Control de Órdenes (SAP IW38)</h3>
                        <div class="flex items-center gap-3 w-full md:w-auto">
                            <i class="fas fa-filter text-slate-500 text-xs"></i>
                            <select id="areaFilter" class="bg-black/80 border border-white/10 rounded-lg p-2 text-[10px] orbitron outline-none text-white w-full">
                                <option value="TODOS">TODAS LAS ÁREAS</option>
                                <option value="MECANICA">MECÁNICA AUTOMOTRIZ</option>
                                <option value="LATONERIA">LATONERÍA Y PINTURA</option>
                                <option value="ELECTRICO">SISTEMAS ELÉCTRICOS</option>
                            </select>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-[11px]">
                            <thead class="bg-black/60 orbitron text-slate-400 border-b border-white/10 uppercase">
                                <tr>
                                    <th class="p-5">Unidad / Placa</th>
                                    <th class="p-5">Especialidad</th>
                                    <th class="p-5 text-center">Eficiencia MO</th>
                                    <th class="p-5 text-right">Facturación</th>
                                    <th class="p-5 text-right">Utilidad</th>
                                    <th class="p-5 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody id="towerTableBody" class="divide-y divide-white/[0.05]"></tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>`;
    };

    const syncAllSystems = async () => {
        // AUDITORÍA 1: Sincronización con Contabilidad (Gastos Fijos Reales)
        const snapC = await getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId)));
        metrics.gastosFijosContables = 0;
        snapC.forEach(d => {
            const data = d.data();
            metrics.gastosFijosContables += Number(data.monto || data.valor || 0);
        });

        // AUDITORÍA 2: Órdenes y Costos Directos
        const snapO = await getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId)));
        
        let totalMTTR = 0;
        metrics.totalFacturacion = 0;
        metrics.utilidadBruta = 0;
        metrics.statsAreas = { MECANICA: 0, LATONERIA: 0, ELECTRICO: 0 };
        metrics.statsVehiculos = { LIVIANO: 0, MEDIANO: 0, PESADO: 0 };

        masterData = snapO.docs.map(doc => {
            const o = doc.data();
            const items = o.items || [];
            
            const mo = items.filter(i => i.tipo === 'MANO_OBRA').reduce((a,b) => a + Number(b.venta || 0), 0);
            const rep = items.filter(i => i.tipo === 'REPUESTO').reduce((a,b) => a + Number(b.venta || 0), 0);
            
            const facturacion = o.costos_totales?.gran_total || Number(o.total || 0);
            const utilidadDoc = o.costos_totales?.utilidad || (facturacion - Number(o.costo_total || 0));
            
            const fIngreso = o.createdAt?.toDate() || new Date();
            const fEntrega = o.updatedAt?.toDate() || new Date();
            const diasProceso = Math.ceil((fEntrega - fIngreso) / (1000 * 60 * 60 * 24)) || 1;

            metrics.totalFacturacion += facturacion;
            metrics.utilidadBruta += utilidadDoc;
            totalMTTR += diasProceso;

            const area = (o.tipo_orden || "MECANICA").toUpperCase();
            metrics.statsAreas[area] = (metrics.statsAreas[area] || 0) + 1;
            
            const clase = (o.clase_vehiculo || "LIVIANO").toUpperCase();
            metrics.statsVehiculos[clase] = (metrics.statsVehiculos[clase] || 0) + 1;

            return {
                id: doc.id,
                placa: o.placa || 'S/P',
                cliente: o.cliente || 'CLIENTE FINAL',
                area, clase, mo, rep, facturacion, utilidadDoc, diasProceso,
                eficienciaMO: (mo / (facturacion || 1)) * 100
            };
        });

        metrics.mttr = totalMTTR / (masterData.length || 1);
        metrics.ticketPromedio = metrics.totalFacturacion / (masterData.length || 1);
        metrics.utilidadNetaReal = metrics.utilidadBruta - metrics.gastosFijosContables;

        renderKPIs();
        renderCharts();
        renderTable(masterData);
        launchNexusVoiceAlerts();

        document.getElementById("btnExcelSAP").onclick = exportAuditToExcel;
        document.getElementById("btnSync").onclick = syncAllSystems;
        document.getElementById("areaFilter").onchange = (e) => {
            const val = e.target.value;
            renderTable(val === 'TODOS' ? masterData : masterData.filter(o => o.area === val));
        };
    };

    const renderKPIs = () => {
        const grid = document.getElementById("kpiGrid");
        grid.innerHTML = `
            ${kpiCard("Ticket Promedio Auditoría", `$${metrics.ticketPromedio.toLocaleString()}`, "fa-file-invoice", "text-white")}
            ${kpiCard("Utilidad Neta (Net Profit)", `$${metrics.utilidadNetaReal.toLocaleString()}`, "fa-sack-dollar", metrics.utilidadNetaReal > 0 ? "text-emerald-400" : "text-red-500")}
            ${kpiCard("Ciclo MTTR Promedio", `${metrics.mttr.toFixed(1)} Días`, "fa-stopwatch", metrics.mttr > 3 ? "text-amber-500" : "text-cyan-400")}
            ${kpiCard("Gastos Operativos", `$${metrics.gastosFijosContables.toLocaleString()}`, "fa-receipt", "text-slate-400")}
        `;
    };

    const kpiCard = (l, v, i, c) => `
        <div class="sap-card p-6 overflow-hidden">
            <i class="fas ${i} absolute -right-4 -bottom-4 text-7xl opacity-5"></i>
            <p class="kpi-label mb-3">${l}</p>
            <p class="kpi-value orbitron ${c}">${v}</p>
        </div>`;

    const renderTable = (data) => {
        const body = document.getElementById("towerTableBody");
        body.innerHTML = data.map(o => `
            <tr data-id="${o.id}" class="hover:bg-white/[0.03] transition-colors border-b border-white/[0.02] ${o.diasProceso > 5 ? 'critical-row' : ''}">
                <td class="p-5">
                    <div class="orbitron font-black text-white text-xs">${o.placa}</div>
                    <div class="text-[8px] text-slate-500 orbitron">${o.cliente.substring(0,25)}</div>
                </td>
                <td class="p-5">
                    <span class="sap-badge area-${o.area.toLowerCase()}">${o.area}</span>
                    <div class="text-[8px] text-slate-500 mt-1 orbitron font-black">${o.clase}</div>
                </td>
                <td class="p-5">
                    <div class="progress-bar"><div class="progress-fill" style="width: ${o.eficienciaMO}%"></div></div>
                    <div class="flex justify-between text-[8px] orbitron font-black text-slate-500">
                        <span>INTENSIDAD MO</span><span>${o.eficienciaMO.toFixed(0)}%</span>
                    </div>
                </td>
                <td class="p-5 text-right font-bold text-slate-300">$${o.facturacion.toLocaleString()}</td>
                <td class="p-5 text-right orbitron font-black text-emerald-400">$${o.utilidadDoc.toLocaleString()}</td>
                <td class="p-5 text-center">
                    <button onclick="window.nexusOTControl('${o.id}')" class="btn-nexus p-2 px-3">
                        <i class="fas fa-terminal"></i>
                    </button>
                </td>
            </tr>
        `).join("");
    };

    const launchNexusVoiceAlerts = () => {
        const criticalCount = masterData.filter(o => o.diasProceso > 5).length;
        if (criticalCount > 0) {
            setTimeout(() => {
                speakNexus(`Comandante Urquijo. El núcleo Nexus detectó ${criticalCount} órdenes con retraso crítico de más de cinco días. Se requiere auditoría inmediata en el área de taller.`);
            }, 1500);
        }
    };

    window.nexusOTControl = async (id) => {
        const order = masterData.find(o => o.id === id);
        if(!order) return;

        Swal.fire({
            title: `COMANDO ORDEN: ${order.placa}`,
            html: `
                <div class="text-left space-y-4 p-2">
                    <div class="grid grid-cols-2 gap-3 text-[10px] orbitron">
                        <div class="bg-black/40 p-3 rounded-xl border border-white/5">
                            <p class="text-slate-500 mb-1">FACTURADO</p>
                            <p class="text-white font-black text-sm">$${order.facturacion.toLocaleString()}</p>
                        </div>
                        <div class="bg-black/40 p-3 rounded-xl border border-white/5">
                            <p class="text-emerald-500 mb-1">UTILIDAD</p>
                            <p class="text-emerald-400 font-black text-sm">$${order.utilidadDoc.toLocaleString()}</p>
                        </div>
                    </div>
                    <div class="bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/20">
                        <p class="kpi-label text-cyan-500">Análisis de Eficiencia</p>
                        <p class="text-[11px] text-white mt-1">Esta unidad lleva <b>${order.diasProceso} días</b> en taller con una intensidad técnica del ${order.eficienciaMO.toFixed(1)}%.</p>
                    </div>
                </div>
            `,
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-desktop mr-2"></i> ABRIR TERMINAL',
            denyButtonText: '<i class="fas fa-file-pdf mr-2"></i> GENERAR PDF',
            confirmButtonColor: '#06b6d4',
            denyButtonColor: '#475569',
            cancelButtonText: 'SALIR'
        }).then((result) => {
            if (result.isConfirmed) {
                // Maniobra perfecta: Abrir terminal global
                if(window.abrirTerminalNexus) window.abrirTerminalNexus(id);
                else Swal.fire('Error', 'Terminal no inicializada', 'error');
            } else if (result.isDenied) {
                // Simulación de exportación PDF
                Swal.fire('Nexus PDF', 'Generando reporte SAP de la OT...', 'success');
                if(window.generarPDFOrden) window.generarPDFOrden(id);
            }
        });
    };

    const renderCharts = () => {
        const ctxFin = document.getElementById('mainFinanceChart')?.getContext('2d');
        const ctxVeh = document.getElementById('vehicleMixChart')?.getContext('2d');
        const ctxMO = document.getElementById('moIntensityChart')?.getContext('2d');

        new Chart(ctxFin, {
            type: 'line',
            data: {
                labels: masterData.map(o => o.placa),
                datasets: [
                    { label: 'Utilidad Neta', data: masterData.map(o => o.utilidadDoc), borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.1)', fill: true, tension: 0.4 },
                    { label: 'Facturación', data: masterData.map(o => o.facturacion), borderColor: 'rgba(255,255,255,0.3)', borderDash: [5,5], tension: 0.4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } } } }
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
            options: { cutout: '80%', plugins: { legend: { position: 'bottom', labels: { color: '#64748b', font: { family: 'Orbitron', size: 8 } } } } }
        });

        new Chart(ctxMO, {
            type: 'bar',
            data: {
                labels: ['MEC', 'LAT', 'ELE'],
                datasets: [{
                    label: 'Intensidad',
                    data: [metrics.statsAreas.MECANICA, metrics.statsAreas.LATONERIA, metrics.statsAreas.ELECTRICO],
                    backgroundColor: 'rgba(6, 182, 212, 0.4)',
                    borderColor: '#06b6d4',
                    borderWidth: 2
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { display: false } } } }
        });
    };

    const exportAuditToExcel = () => {
        const rows = masterData.map(o => ({
            "FECHA_AUDITORIA": new Date().toLocaleDateString(),
            "PLACA": o.placa,
            "AREA": o.area,
            "DIAS_TALLER": o.diasProceso,
            "FACTURACION_BRUTA": o.facturacion,
            "VALOR_MANO_OBRA": o.mo,
            "VALOR_REPUESTOS": o.rep,
            "UTILIDAD_OPERATIVA": o.utilidadDoc,
            "EFICIENCIA_INTENSIDAD": o.eficienciaMO.toFixed(2) + "%"
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "NEXUS_AUDIT_SAP");
        XLSX.writeFile(wb, `Nexus_Audit_Report_${Date.now()}.xlsx`);
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
