/**
 * dashboard.js - TallerPRO360 ULTRA V3
 * Sincronizado con NexusAI Orchestrator 🧠
 */
import { getClientes, getOrdenes, getInventario } from "../services/dataService.js";
import { NexusAI } from "../ai/NexusOrchestratorAI.js"; // 🔥 El nuevo motor unificado
import { store } from "../core/store.js";

let charts = {};

export default async function dashboard(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    
    // 1. Render Base Inmediato (UX de alta velocidad)
    renderBaseUI(container);

    if (!empresaId) return renderError(container, "❌ Error: Identidad de Taller no detectada");

    try {
        // 2. Carga Paralela (Data + Inteligencia)
        // Usamos Promise.all para que la App no "espere" una cosa tras otra
        const [rawData, aiAnalysis] = await Promise.all([
            loadFullData(empresaId),
            NexusAI.analizarTodo(empresaId).catch(() => null)
        ]);

        // 3. Procesamiento y Render Final
        const metrics = calculateMetrics(rawData);
        renderKPIs(metrics);
        renderCharts(metrics);
        renderCEO(metrics, aiAnalysis);

    } catch (e) {
        console.error("🔥 Dashboard Crash:", e);
    }
}

async function loadFullData(empresaId) {
    // Si tenemos cache fresco, lo usamos (Store Pattern)
    if (store.cache?.ordenes?.length > 0) return store.cache;

    const [clientes, ordenes, inventario] = await Promise.all([
        getClientes(empresaId).catch(() => []),
        getOrdenes(empresaId).catch(() => []),
        getInventario(empresaId).catch(() => [])
    ]);

    const data = { clientes, ordenes, inventario };
    store.cache = data; // Guardamos en el "cerebro" global de la App
    return data;
}

function calculateMetrics(data) {
    const { ordenes, inventario, clientes } = data;
    let ingresos = 0, costos = 0, ingresosPorDia = {};
    const alertas = [];

    ordenes.forEach(o => {
        const val = Number(o.total || 0);
        ingresos += val;
        costos += Number(o.costoTotal || 0);

        // Agrupación para gráfica
        let fecha = "S/F";
        try {
            const d = o.creadoEn?.toDate ? o.creadoEn.toDate() : new Date(o.creadoEn);
            fecha = d.toISOString().split("T")[0];
        } catch(e) {}
        ingresosPorDia[fecha] = (ingresosPorDia[fecha] || 0) + val;
    });

    // Alertas de Inventario (Sincronizado con inventario.js)
    inventario.forEach(item => {
        if (Number(item.cantidad || 0) < 5) {
            alertas.push({ msg: `Stock bajo: ${item.nombre}`, nivel: "medio" });
        }
    });

    return {
        ingresos, costos, 
        utilidad: ingresos - costos,
        margen: ingresos ? ((ingresos - costos) / ingresos) * 100 : 0,
        totalOrdenes: ordenes.length,
        totalClientes: clientes.length,
        ingresosPorDia,
        alertas
    };
}

function renderBaseUI(container) {
    container.innerHTML = `
    <div class="p-6 bg-[#050a14] min-h-screen text-white font-sans">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-black italic tracking-tighter text-cyan-400">
                PRO360 <span class="text-white font-light underline decoration-yellow-500">ULTRA V3</span>
            </h1>
            <div class="text-[10px] bg-slate-800 px-3 py-1 rounded-full text-slate-400 font-bold uppercase tracking-widest">
                Nexus-X Live
            </div>
        </div>

        <div id="kpiGrid" class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
             ${[1,2,3,4].map(() => `<div class="h-24 bg-[#0f172a] rounded-3xl animate-pulse border border-slate-800"></div>`).join("")}
        </div>

        <div class="grid lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 bg-[#0f172a] p-6 rounded-[40px] border border-slate-800 shadow-2xl">
                <h3 class="text-xs font-black text-slate-500 uppercase mb-4 tracking-widest text-center">Flujo de Caja</h3>
                <canvas id="mainChart" class="max-h-64 w-full"></canvas>
            </div>
            
            <div id="ceoPanel" class="space-y-4">
                <div class="h-64 bg-[#0f172a] rounded-[40px] animate-pulse border border-cyan-500/20"></div>
            </div>
        </div>
    </div>`;
}

function renderKPIs(m) {
    const grid = document.getElementById("kpiGrid");
    const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    
    const kpis = [
        { lab: "Ingresos", val: fmt.format(m.ingresos), col: "text-emerald-400" },
        { lab: "Utilidad", val: fmt.format(m.utilidad), col: "text-cyan-400" },
        { lab: "Margen", val: m.margen.toFixed(1) + "%", col: "text-yellow-400" },
        { lab: "Órdenes", val: m.totalOrdenes, col: "text-purple-400" }
    ];

    grid.innerHTML = kpis.map(k => `
        <div class="bg-[#0f172a] p-5 rounded-3xl border border-slate-800 shadow-lg">
            <p class="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">${k.lab}</p>
            <h2 class="${k.col} text-xl font-black">${k.val}</h2>
        </div>
    `).join("");
}

function renderCEO(m, ai) {
    const panel = document.getElementById("ceoPanel");
    if (!panel) return;

    panel.innerHTML = `
        <div class="bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 rounded-[40px] border border-cyan-500/30 shadow-2xl relative overflow-hidden">
            <div class="absolute -top-4 -right-4 text-cyan-500/10 text-8xl"><i class="fas fa-brain"></i></div>
            <h3 class="text-cyan-400 font-black text-sm mb-4 italic tracking-widest">👑 CEO ESTRATEGA</h3>
            
            <div class="space-y-4 relative z-10">
                <div>
                    <p class="text-[9px] text-yellow-500 font-black uppercase mb-2">Alertas de Operación</p>
                    ${m.alertas.length ? m.alertas.map(a => `
                        <div class="flex items-center gap-2 text-[11px] text-red-400 font-bold mb-1">
                            <span class="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                            ${a.msg}
                        </div>
                    `).join("") : '<p class="text-[11px] text-emerald-400 font-bold italic">Sistema estable.</p>'}
                </div>

                <div>
                    <p class="text-[9px] text-cyan-500 font-black uppercase mb-2">NexusAI Insight</p>
                    ${ai?.sugerencias?.map(s => `
                        <p class="text-[11px] text-slate-200 leading-tight mb-2 border-l border-cyan-500/50 pl-2 italic">
                            "${s.msg}"
                        </p>
                    `).join("") || '<p class="text-[11px] text-slate-500">Calculando estrategias...</p>'}
                </div>
            </div>
        </div>
    `;
}

function renderCharts(m) {
    if (!window.Chart) return;
    const ctx = document.getElementById("mainChart")?.getContext("2d");
    if (!ctx) return;

    if (charts.main) charts.main.destroy();

    const dates = Object.keys(m.ingresosPorDia).sort();
    const values = dates.map(d => m.ingresosPorDia[d]);

    charts.main = new window.Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                data: values,
                borderColor: '#06b6d4',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                fill: true,
                backgroundColor: (context) => {
                    const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
                    gradient.addColorStop(1, 'transparent');
                    return gradient;
                }
            }]
        },
        options: { 
            responsive: true, 
            plugins: { legend: { display: false } },
            scales: { 
                y: { display: false },
                x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 9 } } } 
            }
        }
    });
}

function renderError(container, msg) {
    container.innerHTML = `<div class="p-20 text-center text-red-500 font-bold uppercase tracking-widest animate-bounce">${msg}</div>`;
}
