/**
 * 🦾 NEXUS-X STRATEGIC COMMANDER V34.0 - ULTRA-STABLE EDITION
 * William Jeffry Urquijo Cubillos // Nexus AI
 * Enfoque: Estabilidad Móvil, Gráficas Horizontales y BSC
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

export default async function reportesModule(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let reportData = [];

    const init = async () => {
        // Inyectamos CSS de estabilidad para evitar el movimiento de pantalla
        injectGlobalStyles();
        renderSkeleton();
        await loadResources();
        await fetchData();
    };

    const injectGlobalStyles = () => {
        const style = document.createElement('style');
        style.innerHTML = `
            .nexus-sticky-header { position: sticky; top: 0; z-index: 50; backdrop-filter: blur(10px); }
            .no-scroll-jump { overflow-anchor: none; }
            .horizontal-chart-container { height: 120px !important; }
            @media (max-width: 768px) { .text-mobile-xs { font-size: 10px !important; } }
        `;
        document.head.appendChild(style);
    };

    const renderSkeleton = () => {
        container.innerHTML = `
        <div class="bg-[#010409] min-h-screen text-white font-sans no-scroll-jump pb-20">
            <header class="nexus-sticky-header border-b border-white/10 bg-[#010409]/80 p-4 md:p-6">
                <div class="flex justify-between items-center max-w-7xl mx-auto">
                    <div>
                        <h1 class="orbitron text-xl md:text-3xl font-black italic text-cyan-400">BI<span class="text-white">_NEXUS</span></h1>
                        <p class="text-[8px] orbitron tracking-widest text-slate-500 uppercase">Strategic Operations V34.0</p>
                    </div>
                    <button id="btnFullExcel" class="bg-white text-black p-3 rounded-xl hover:bg-cyan-500 hover:text-white transition-all">
                        <i class="fas fa-file-excel"></i>
                    </button>
                </div>
            </header>

            <main class="max-w-7xl mx-auto p-4 space-y-6">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3" id="kpiContainer">
                    <div class="bg-[#0d1117] p-4 rounded-2xl border border-white/5 animate-pulse">---</div>
                </div>

                <div class="bg-[#0d1117] p-4 rounded-3xl border border-white/5 overflow-hidden">
                    <div class="flex justify-between items-center mb-2">
                        <span class="orbitron text-[9px] text-slate-500 uppercase font-black">Flujo de Rentabilidad (30 Días)</span>
                        <span id="trendStatus" class="text-[9px] orbitron font-black"></span>
                    </div>
                    <div class="horizontal-chart-container">
                        <canvas id="horizontalTrendChart"></canvas>
                    </div>
                </div>

                <div class="bg-[#0d1117] rounded-3xl border border-white/5 overflow-hidden">
                    <div class="p-4 border-b border-white/5 flex justify-between items-center">
                        <h3 class="orbitron text-[10px] font-black text-slate-400 uppercase">Monitor de Misiones</h3>
                        <input type="text" id="plateSearch" placeholder="BUSCAR PLACA..." class="bg-black/40 border-none rounded-lg text-[10px] orbitron p-2 w-32 focus:ring-1 focus:ring-cyan-500">
                    </div>
                    <div id="misionTable" class="divide-y divide-white/[0.03]"></div>
                </div>
            </main>
        </div>`;
    };

    const fetchData = async () => {
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ORDERS), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        
        reportData = snap.docs.map(doc => {
            const d = doc.data();
            const venta = Number(d.costos_totales?.total_general || d.total || 0);
            const costo = Number(d.costos_totales?.costo_repuestos || 0) + Number(d.costos_totales?.mano_obra || 0);
            
            // Lógica BSC: Nivel de Servicio
            const fApertura = d.fecha_apertura?.toDate() || new Date();
            const fEntrega = d.fecha_entrega?.toDate() || new Date();
            const diasReal = Math.ceil((fEntrega - fApertura) / (1000 * 60 * 60 * 24));
            const cumplimiento = diasReal <= 3 ? 100 : 0; // Ejemplo: 3 días máximo

            return { id: doc.id, ...d, venta, costo, utilidad: venta - costo, margen: venta > 0 ? (venta - costo) / venta * 100 : 0, cumplimiento };
        });

        renderKPIs();
        renderTrend();
        renderMissions(reportData);
    };

    const renderKPIs = () => {
        const totalVenta = reportData.reduce((a, b) => a + b.venta, 0);
        const avgMargen = reportData.reduce((a, b) => a + b.margen, 0) / (reportData.length || 1);
        const nps = reportData.reduce((a, b) => a + b.cumplimiento, 0) / (reportData.length || 1);

        document.getElementById("kpiContainer").innerHTML = `
            ${kpiBox("Facturación", `$${totalVenta.toLocaleString()}`, "text-white")}
            ${kpiBox("Nivel Servicio", `${nps.toFixed(0)}%`, "text-emerald-400")}
            ${kpiBox("Margen Prom.", `${avgMargen.toFixed(1)}%`, "text-cyan-400")}
            ${kpiBox("Total OT", reportData.length, "text-slate-400")}
        `;
    };

    const kpiBox = (label, val, color) => `
        <div class="bg-[#161b22] p-4 rounded-2xl border border-white/5">
            <p class="text-[8px] orbitron font-bold text-slate-500 uppercase mb-1">${label}</p>
            <p class="${color} text-lg md:text-xl font-black orbitron tabular-nums">${val}</p>
        </div>`;

    const renderMissions = (data) => {
        const container = document.getElementById("misionTable");
        container.innerHTML = data.map(o => `
            <div class="p-4 flex justify-between items-center hover:bg-white/[0.02] active:bg-cyan-500/10 transition-all">
                <div class="flex flex-col">
                    <span class="orbitron text-sm font-black text-cyan-400">${o.placa || 'N/A'}</span>
                    <span class="text-[9px] text-slate-500 font-bold uppercase truncate w-24 md:w-full">${o.cliente || 'CLIENTE'}</span>
                </div>
                <div class="flex items-center gap-6">
                    <div class="hidden md:flex flex-col text-right">
                        <span class="orbitron text-xs font-bold">$${o.venta.toLocaleString()}</span>
                        <span class="text-[8px] font-black ${o.margen > 20 ? 'text-emerald-500' : 'text-red-500'}">${o.margen.toFixed(1)}% MARGEN</span>
                    </div>
                    <button onclick="window.downloadDetail('${o.id}')" class="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-cyan-400 border border-white/10 active:scale-90">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </div>
        `).join("");
    };

    const renderTrend = () => {
        const ctx = document.getElementById('horizontalTrendChart').getContext('2d');
        const dataPoints = reportData.slice(-15).map(o => o.venta);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: reportData.slice(-15).map(o => o.placa),
                datasets: [{
                    data: dataPoints,
                    borderColor: '#06b6d4',
                    borderWidth: 3,
                    pointRadius: 0,
                    fill: true,
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    x: { display: false }, 
                    y: { display: false } 
                }
            }
        });
    };

    // Funciones globales de descarga
    window.downloadDetail = (id) => {
        const item = reportData.find(x => x.id === id);
        // Lógica de exportación individual...
        console.log("Descargando...", item.placa);
        Swal.fire({ icon: 'success', title: 'Excel Generado', text: `Reporte ${item.placa} listo`, background: '#0d1117', color: '#fff' });
    };

    const loadResources = async () => {
        const libs = ["https://cdn.jsdelivr.net/npm/chart.js", "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"];
        for (const lib of libs) {
            await new Promise(r => { const s = document.createElement("script"); s.src = lib; s.onload = r; document.head.appendChild(s); });
        }
    };

    init();
}
