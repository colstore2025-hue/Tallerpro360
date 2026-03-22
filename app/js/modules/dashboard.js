/**
 * dashboard.js - TallerPRO360 NEXUS-CORE V5 🚀
 * El "Cerebro" de Predicción y Control Total
 */
import { getClientes, getOrdenes, getInventario } from "../services/dataService.js";
import { store } from "../core/store.js";
import { hablar } from "../voice/voiceCore.js";

let mainChart = null;

export default async function dashboard(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    
    // 1. Renderizado Estructural con Glassmorphism
    renderStructure(container);

    try {
        // 2. Carga con "Optimistic UI" y Cache
        const data = await loadDataSmart(empresaId);
        
        // 3. Procesamiento de BI (Business Intelligence)
        const metrics = processBusinessIntelligence(data);

        // 4. Inyección de datos en cascada para fluidez visual
        updateKPIs(metrics);
        renderAdvancedChart(metrics);
        updateSmartPanel(metrics);
        initNexusPredictor(metrics);

    } catch (err) {
        console.error("🚨 Critical Core Failure:", err);
        showErrorState(container);
    }
}

async function loadDataSmart(empresaId) {
    const now = Date.now();
    const CACHE_EXPIRY = 2 * 60 * 1000; // 2 min para datos frescos

    if (store.cache && (now - store.lastFetch < CACHE_EXPIRY)) {
        return store.cache;
    }

    // Paralelismo de red para máxima velocidad
    const [clientes, ordenes, inventario] = await Promise.all([
        getClientes(empresaId).catch(() => []),
        getOrdenes(empresaId).catch(() => []),
        getInventario(empresaId).catch(() => [])
    ]);

    store.cache = { clientes, ordenes, inventario };
    store.lastFetch = now;
    return store.cache;
}

function processBusinessIntelligence(data) {
    const { ordenes, inventario } = data;
    const stats = {
        ingresos: 0, gastos: 0, util: 0, margen: 0,
        abiertas: 0, totalClientes: data.clientes.length,
        tendencia: {}, stockCritico: []
    };

    ordenes.forEach(o => {
        const t = Number(o.total || 0);
        stats.ingresos += t;
        stats.gastos += Number(o.costoTotal || 0);
        if (!['entregado', 'pagado'].includes(o.estado?.toLowerCase())) stats.abiertas++;

        const fecha = o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleDateString() : 'Hoy';
        stats.tendencia[fecha] = (stats.tendencia[fecha] || 0) + t;
    });

    stats.util = stats.ingresos - stats.gastos;
    stats.margen = stats.ingresos ? (stats.util / stats.ingresos) * 100 : 0;
    stats.stockCritico = inventario.filter(i => Number(i.cantidad) <= Number(i.stockMinimo || 5));

    return stats;
}

function renderStructure(container) {
    container.innerHTML = `
    <div class="p-4 lg:p-8 space-y-8 animate-in fade-in duration-700">
        
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div class="space-y-1">
                <h1 class="text-3xl font-black text-white tracking-tighter uppercase italic italic">
                    NEXUS <span class="text-cyan-400">DASHBOARD</span>
                </h1>
                <div class="flex items-center gap-2">
                    <span class="flex h-2 w-2 rounded-full bg-cyan-500 animate-ping"></span>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em]">Monitor de Enlace Biométrico de Datos</p>
                </div>
            </div>
            <div class="flex bg-slate-900/80 p-1 rounded-2xl border border-white/5 backdrop-blur-xl">
                <button class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">Semana</button>
                <button class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-cyan-500 text-black shadow-lg shadow-cyan-500/20">Mes Actual</button>
            </div>
        </div>

        <div id="kpiGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            ${Array(4).fill(`<div class="h-32 bg-slate-900/40 rounded-[2.5rem] border border-white/5 animate-pulse"></div>`).join('')}
        </div>

        <div class="grid lg:grid-cols-12 gap-8">
            <div class="lg:col-span-8 bg-slate-900/30 rounded-[3rem] p-8 border border-white/5 shadow-inner backdrop-blur-md">
                <div class="flex justify-between items-center mb-8">
                    <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Curva de Crecimiento Financiero</h3>
                    <div class="flex items-center gap-2">
                        <span class="text-2xl font-black text-white tracking-tighter" id="totalDisplay">$0</span>
                        <span class="bg-emerald-500/10 text-emerald-500 text-[8px] px-2 py-1 rounded-full font-black">+12%</span>
                    </div>
                </div>
                <div class="h-72">
                    <canvas id="mainChart"></canvas>
                </div>
            </div>

            <div class="lg:col-span-4 space-y-6">
                <div id="smartPanel" class="bg-gradient-to-b from-slate-900 to-black rounded-[3rem] p-8 border border-cyan-500/20 h-full flex flex-col justify-between group">
                    <div class="space-y-6">
                        <div class="flex justify-between items-center">
                            <i class="fas fa-brain text-cyan-500 text-xl animate-pulse"></i>
                            <span class="text-[8px] font-black text-slate-600 uppercase tracking-widest">IA Core Active</span>
                        </div>
                        <div id="aiIntelligenceArea" class="space-y-4">
                            </div>
                    </div>
                    <div class="pt-8 mt-8 border-t border-white/5">
                        <p class="text-[8px] text-slate-500 font-black uppercase mb-4 tracking-widest">Acceso Directo</p>
                        <div class="grid grid-cols-2 gap-3">
                            <button onclick="location.hash='#ordenes'" class="bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-[9px] font-black uppercase text-white transition-all">Nueva Orden</button>
                            <button onclick="location.hash='#pagos'" class="bg-cyan-500/10 hover:bg-cyan-500/20 p-3 rounded-2xl text-[9px] font-black uppercase text-cyan-400 transition-all">Caja</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="nexusCoachTrigger" class="fixed bottom-28 right-8 cursor-pointer group z-50">
            <div class="absolute -inset-4 bg-cyan-500/20 rounded-full blur-xl group-hover:bg-cyan-500/40 transition-all duration-500"></div>
            <div class="relative w-20 h-20 bg-black rounded-full border-2 border-white/10 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 active:scale-95">
                <div class="absolute inset-0 rounded-full border-t-2 border-cyan-500 animate-spin"></div>
                <i class="fas fa-comment-dots text-cyan-500 text-2xl group-hover:text-white transition-colors"></i>
            </div>
            <div class="absolute right-24 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                <div class="bg-black/90 border border-cyan-500/30 text-white text-[10px] px-4 py-2 rounded-xl whitespace-nowrap font-black uppercase tracking-widest">
                    Consultar a Nexus AI
                </div>
            </div>
        </div>
    </div>
    `;
}

function updateKPIs(m) {
    const grid = document.getElementById("kpiGrid");
    const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

    const cards = [
        { label: "Facturación", val: fmt(m.ingresos), icon: "fa-rocket", color: "text-emerald-400" },
        { label: "Utilidad Neta", val: fmt(m.util), icon: "fa-gem", color: "text-cyan-400" },
        { label: "Pendientes", val: m.abiertas, icon: "fa-clock", color: "text-amber-400" },
        { label: "Clientes", val: m.totalClientes, icon: "fa-user-astronaut", color: "text-purple-400" }
    ];

    grid.innerHTML = cards.map(c => `
        <div class="bg-slate-900/50 backdrop-blur-xl p-7 rounded-[2.5rem] border border-white/5 hover:border-cyan-500/30 transition-all group overflow-hidden relative">
            <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all text-4xl"><i class="fas ${c.icon}"></i></div>
            <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-3">${c.label}</p>
            <h2 class="${c.color} text-2xl font-black tracking-tighter">${c.val}</h2>
            <div class="mt-4 flex items-center gap-1">
                <div class="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full bg-cyan-500 w-2/3 animate-shimmer"></div>
                </div>
            </div>
        </div>
    `).join("");
    
    document.getElementById("totalDisplay").innerText = fmt(m.ingresos);
}

function renderAdvancedChart(m) {
    const ctx = document.getElementById("mainChart");
    if (!ctx || !window.Chart) return;

    if (mainChart) mainChart.destroy();

    const labels = Object.keys(m.tendencia);
    const data = Object.values(m.tendencia);

    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos',
                data: data,
                borderColor: '#06b6d4',
                borderWidth: 6,
                pointRadius: 0,
                tension: 0.5,
                fill: true,
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;
                    if (!chartArea) return null;
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
                    gradient.addColorStop(1, 'rgba(6, 182, 212, 0.2)');
                    return gradient;
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false },
                x: { 
                    grid: { display: false },
                    ticks: { color: '#475569', font: { size: 9, weight: '900' } }
                }
            }
        }
    });
}

function updateSmartPanel(m) {
    const area = document.getElementById("aiIntelligenceArea");
    
    const stockMsg = m.stockCritico.length > 0 
        ? `<p class="text-red-400 font-bold"><i class="fas fa-exclamation-triangle mr-2"></i>Atención: ${m.stockCritico.length} insumos agotándose.</p>`
        : `<p class="text-emerald-400 font-bold"><i class="fas fa-check-circle mr-2"></i>Inventario saludable.</p>`;

    const marginHealth = m.margen > 35 ? 'Excelente' : m.margen > 20 ? 'Saludable' : 'Optimizable';

    area.innerHTML = `
        <div class="space-y-6">
            <div class="p-5 rounded-3xl bg-white/5 border border-white/5">
                <p class="text-[8px] text-slate-500 font-black uppercase mb-2">Diagnóstico de Operación</p>
                <div class="text-[11px] leading-relaxed text-slate-300 italic">
                    "Hola William, analizando la data: El margen de rentabilidad es <span class="text-cyan-400 font-black tracking-widest">${marginHealth}</span> (${m.margen.toFixed(1)}%). 
                    Las órdenes pendientes representan un WIP estable."
                </div>
            </div>
            <div class="p-5 rounded-3xl bg-white/5 border border-white/5">
                <p class="text-[8px] text-slate-500 font-black uppercase mb-2">Alertas de Almacén</p>
                <div class="text-[10px]">${stockMsg}</div>
            </div>
        </div>
    `;
}

function initNexusPredictor(m) {
    document.getElementById("nexusCoachTrigger").onclick = () => {
        const audioMsg = `Nexus detecta una utilidad neta de ${Math.round(m.util)} pesos. El rendimiento del taller es del ${Math.round(m.margen)} por ciento. William, tienes ${m.abiertas} servicios en proceso. ¿Deseas que optimice alguna ruta de pago?`;
        hablar(audioMsg);
    };
}

function showErrorState(container) {
    container.innerHTML = `<div class="p-20 text-center uppercase font-black text-red-500 tracking-[0.5em] animate-pulse">Error en Núcleo Nexus - Reconectando...</div>`;
}
