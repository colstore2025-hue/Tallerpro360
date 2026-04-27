/**
 * 🏛️ NEXUS-X COMMANDER V45.0 - SAP INDUSTRIAL HYPER-DRIVE
 * William Jeffry Urquijo Cubillos // Nexus AI 2026-2030
 * Propósito: Inteligencia Temporal, Auditoría Forense y Control de Utilidad Neta Real.
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function nexusReportes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    
    // --- MOTOR DE VOZ NEXUS ---
    const speakAlert = (msg) => {
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(msg);
        utter.lang = 'es-ES';
        utter.rate = 0.9;
        window.speechSynthesis.speak(utter);
    };

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
            .filter-btn { padding: 8px 16px; border-radius: 12px; font-size: 9px; font-weight: 900; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #64748b; transition: 0.3s; cursor: pointer; font-family: 'Orbitron'; }
            .filter-btn.active { background: #06b6d4; color: #000; border-color: #06b6d4; box-shadow: 0 0 15px rgba(6, 182, 212, 0.4); }
            .filter-btn:hover:not(.active) { border-color: #06b6d4; color: #fff; }
            .sap-input { background: #000; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #06b6d4; padding: 5px 10px; font-size: 10px; outline: none; }
        `;
        document.head.appendChild(style);
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="bg-[#010409] min-h-screen text-slate-100 p-4 lg:p-8 orbitron animate-in fade-in duration-700">
            <header class="flex flex-col gap-6 mb-10 border-b border-white/5 pb-8">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 class="text-4xl font-black italic tracking-tighter text-white uppercase">Nexus<span class="text-cyan-500">_BI_V45</span></h1>
                        <p class="text-[9px] text-slate-500 tracking-[0.4em] font-bold uppercase mt-2">Strategic Intelligence // William Urquijo</p>
                    </div>
                    <div class="flex gap-4">
                        <button id="btnExportGlobal" class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-3 rounded-xl text-[10px] font-black hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-2">
                            <i class="fas fa-file-excel"></i> EXPORTAR MASTER SAP
                        </button>
                    </div>
                </div>

                <div class="w-full flex flex-wrap gap-3 mt-4 bg-white/5 p-5 rounded-[2rem] border border-white/5 items-center">
                    <p class="w-full md:w-auto text-[8px] text-slate-500 font-black orbitron mr-4 uppercase">Rango de Auditoría:</p>
                    <button onclick="window.nexusFilter(0, this)" class="filter-btn active">HISTÓRICO TOTAL</button>
                    <button onclick="window.nexusFilter(30, this)" class="filter-btn">ÚLTIMOS 30 DÍAS</button>
                    <button onclick="window.nexusFilter(7, this)" class="filter-btn">ESTA SEMANA</button>
                    <div class="flex-grow"></div>
                    <div class="flex items-center gap-3">
                        <span class="text-[8px] text-slate-600 font-bold">FECHA MANUAL:</span>
                        <input type="date" id="datePicker" class="sap-input orbitron">
                    </div>
                </div>
            </header>

            <div id="kpi-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"></div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <div class="lg:col-span-2 bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                    <h3 class="text-xs font-black text-cyan-500 uppercase tracking-widest italic mb-6">Utilidad por Unidad en Periodo</h3>
                    <div class="h-80"><canvas id="mainChart"></canvas></div>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                    <h3 class="text-xs font-black text-amber-500 uppercase tracking-widest italic mb-6">Mix Operativo</h3>
                    <div class="h-64"><canvas id="pieChart"></canvas></div>
                </div>
            </div>

            <div class="bg-[#0d1117] rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden">
                <div class="p-8 border-b border-white/5 flex justify-between items-center">
                    <h3 class="text-xs font-black text-white uppercase italic tracking-widest">Análisis Forense de Misiones</h3>
                    <span id="counterTag" class="text-[9px] bg-cyan-500/10 text-cyan-400 px-4 py-1 rounded-full font-black font-orbitron">0 UNIDADES</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-black/40 text-slate-500 text-[10px] uppercase font-black">
                            <tr>
                                <th class="p-6">Unidad / Placa</th>
                                <th class="p-6">Especialidad</th>
                                <th class="p-6">Eficiencia MO</th>
                                <th class="p-6 text-center">Días Taller</th>
                                <th class="p-6 text-right">Utilidad Neta</th>
                                <th class="p-6 text-center">Acción</th>
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

            state.gastosFijos = snapAcc.docs.reduce((acc, d) => acc + Number(d.data().monto || 0), 0);
            
            state.ordenesMaster = snapOrders.docs.map(doc => {
                const o = doc.data();
                const total = Number(o.total || o.costos_totales?.gran_total || 0);
                const costo = Number(o.costo_total || 0);
                const fecha = o.createdAt?.toDate() || new Date();
                
                return {
                    id: doc.id,
                    placa: o.placa || 'N/A',
                    area: o.tipo_orden || 'MECANICA',
                    total, 
                    utilidad: total - costo,
                    dias: Math.ceil((new Date() - fecha) / (1000 * 60 * 60 * 24)) || 1,
                    cliente: o.cliente || 'CLIENTE NEXUS',
                    fecha
                };
            });

            processAndRender(state.ordenesMaster);

        } catch (e) {
            console.error("Critical BI Failure:", e);
        }
    };

    const processAndRender = (data) => {
        state.dataActual = data;
        
        const totalUtilidadBruta = data.reduce((a, b) => a + b.utilidad, 0);
        const totalFacturado = data.reduce((a, b) => a + b.total, 0);
        const totalMTTR = data.reduce((a, b) => a + b.dias, 0);

        const metrics = {
            ebitda: totalUtilidadBruta - (state.gastosFijos / 12), // Ajuste proporcional mensual estimado
            mttr: totalMTTR / (data.length || 1),
            fuga: data.filter(o => o.dias > 5).reduce((a, b) => a + (b.utilidad * 0.1), 0),
            ticket: totalFacturado / (data.length || 1)
        };

        renderKPIs(metrics);
        renderCharts(data);
        renderTable(data);
        document.getElementById("counterTag").innerText = `${data.length} UNIDADES EN PERIODO`;
    };

    const renderKPIs = (m) => {
        const grid = document.getElementById("kpi-grid");
        grid.innerHTML = `
            ${kpiCard("EBITDA ESTIMADO", `$${m.ebitda.toLocaleString()}`, "fa-wallet", m.ebitda > 0 ? "text-emerald-400" : "text-red-500")}
            ${kpiCard("MTTR INDUSTRIAL", `${m.mttr.toFixed(1)} DÍAS`, "fa-clock", m.mttr > 4 ? "text-amber-500" : "text-cyan-400")}
            ${kpiCard("TICKET PROM.", `$${m.ticket.toLocaleString()}`, "fa-microchip", "text-white")}
            ${kpiCard("FUGA POR RETRASO", `$${m.fuga.toLocaleString()}`, "fa-radiation", m.fuga > 0 ? "text-red-500 animate-pulse" : "text-slate-500")}
        `;
    };

    const kpiCard = (t, v, i, c) => `
        <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
            <i class="fas ${i} absolute -right-4 -bottom-4 text-7xl opacity-5"></i>
            <p class="text-[8px] font-black text-slate-500 mb-2 tracking-[0.3em] uppercase">${t}</p>
            <h2 class="text-2xl font-black orbitron ${c}">${v}</h2>
        </div>`;

    const renderTable = (data) => {
        const body = document.getElementById("report-table-body");
        body.innerHTML = data.map(o => `
            <tr class="border-b border-white/[0.02] hover:bg-cyan-500/5 transition-all group">
                <td class="p-6">
                    <p class="font-black text-white orbitron">${o.placa}</p>
                    <p class="text-[8px] text-slate-500 uppercase">${o.cliente.substring(0,15)}</p>
                </td>
                <td class="p-6">
                    <span class="px-3 py-1 rounded-lg text-[9px] font-black bg-white/5 border border-white/10 ${o.area === 'MECANICA' ? 'text-cyan-400' : 'text-amber-400'} uppercase">
                        ${o.area}
                    </span>
                </td>
                <td class="p-6">
                    <div class="w-24 bg-white/5 h-1 rounded-full overflow-hidden">
                        <div class="bg-cyan-500 h-full" style="width: 70%"></div>
                    </div>
                </td>
                <td class="p-6 text-center orbitron ${o.dias > 5 ? 'text-red-500 font-black' : 'text-slate-400'}">${o.dias} D</td>
                <td class="p-6 text-right font-black text-emerald-400 orbitron">$${o.utilidad.toLocaleString()}</td>
                <td class="p-6 text-center">
                    <button onclick="window.exportSingleOT('${o.id}')" class="text-slate-600 hover:text-cyan-400 transition-all">
                        <i class="fas fa-file-invoice text-lg"></i>
                    </button>
                </td>
            </tr>
        `).join("");
    };

    const renderCharts = (data) => {
        const createChart = (id, type, config) => {
            if (state.charts[id]) state.charts[id].destroy();
            state.charts[id] = new Chart(document.getElementById(id), { type, ...config });
        };

        createChart('mainChart', 'line', {
            data: {
                labels: data.slice(-12).map(o => o.placa),
                datasets: [{
                    label: 'Utilidad',
                    data: data.slice(-12).map(o => o.utilidad),
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        createChart('pieChart', 'doughnut', {
            data: {
                labels: ['MEC', 'LAT', 'ELE'],
                datasets: [{
                    data: [
                        data.filter(o => o.area === 'MECANICA').length,
                        data.filter(o => o.area === 'LATONERIA').length,
                        data.filter(o => o.area === 'ELECTRICO').length
                    ],
                    backgroundColor: ['#06b6d4', '#fbbf24', '#a855f7'],
                    borderWidth: 0
                }]
            },
            options: { cutout: '85%', plugins: { legend: { display: false } } }
        });
    };

    // --- MANIOBRAS DE FILTRADO ---
    window.nexusFilter = (dias, btn) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (dias === 0) {
            processAndRender(state.ordenesMaster);
            speakAlert("Mostrando auditoría histórica total.");
            return;
        }

        const limite = new Date();
        limite.setDate(limite.getDate() - dias);
        const filtrados = state.ordenesMaster.filter(o => o.fecha >= limite);
        
        processAndRender(filtrados);
        speakAlert(`Auditoría actualizada: Últimos ${dias} días.`);
    };

    const setupEventListeners = () => {
        document.getElementById("btnExportGlobal").onclick = () => {
            const rows = state.dataActual.map(o => ({
                "PLACA": o.placa,
                "CLIENTE": o.cliente,
                "FACTURACION": o.total,
                "UTILIDAD_NETA": o.utilidad,
                "DIAS_TALLER": o.dias,
                "AREA": o.area,
                "FECHA": o.fecha.toLocaleDateString()
            }));
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "NEXUS_REPORT");
            XLSX.writeFile(wb, `Nexus_Global_Audit_${Date.now()}.xlsx`);
        };
    };

    window.exportSingleOT = (id) => {
        const o = state.ordenesMaster.find(x => x.id === id);
        const ws = XLSX.utils.json_to_sheet([o]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DETALLE_OT");
        XLSX.writeFile(wb, `Audit_OT_${o.placa}.xlsx`);
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
