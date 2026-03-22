/**
 * dashboard.js - TallerPRO360 NEXUS-CORE V4 🚀
 * Reingeniería de Alta Eficiencia y Bajo Costo Firestore
 */
import { getClientes, getOrdenes, getInventario } from "../services/dataService.js";
import { NexusAI } from "../ai/NexusOrchestratorAI.js";
import { store } from "../core/store.js";
import { hablar } from "../voice/voiceCore.js";

let mainChart = null;

export default async function dashboard(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    
    // 1. UI Skeleton inmediato (UX Premium)
    renderStructure(container);

    try {
        // 2. Carga Inteligente (Prioriza Cache de Store para ahorrar lecturas)
        const data = await loadDataSmart(empresaId);
        
        // 3. Motor de Métricas (Cálculos en cliente para ahorrar CPU de Server)
        const metrics = processBusinessIntelligence(data);

        // 4. Renderizado en Cascada (Para no bloquear el hilo principal)
        updateKPIs(metrics);
        renderPowerBIChart(metrics);
        updateCEOPanel(metrics);
        setupNexusCoach(metrics);

    } catch (err) {
        console.error("🚨 Error en Dashboard Core:", err);
        container.innerHTML += `<p class="text-red-500 text-[10px] text-center uppercase font-bold">Error de enlace satelital</p>`;
    }
}

/**
 * CARGA SMART: Solo pide a Firebase si el caché tiene más de 5 minutos
 * @principio ECONOMÍA
 */
async function loadDataSmart(empresaId) {
    const now = Date.now();
    const CACHE_TIME = 5 * 60 * 1000; // 5 min

    if (store.cache && (now - store.lastFetch < CACHE_TIME)) {
        console.log("⚡ Nexus-X: Cargando desde memoria local (Costo $0)");
        return store.cache;
    }

    const [clientes, ordenes, inventario] = await Promise.all([
        getClientes(empresaId).catch(() => []),
        getOrdenes(empresaId).catch(() => []),
        getInventario(empresaId).catch(() => [])
    ]);

    store.cache = { clientes, ordenes, inventario };
    store.lastFetch = now;
    return store.cache;
}

/**
 * BUSINESS INTELLIGENCE ENGINE
 * @principio EFICIENCIA
 */
function processBusinessIntelligence(data) {
    const { ordenes, inventario } = data;
    const hoy = new Date().toISOString().split('T')[0];
    
    let stats = {
        ingresosTotal: 0,
        gastosTotal: 0,
        ordenesAbiertas: 0,
        tendenciaDiaria: {},
        alertasStock: []
    };

    ordenes.forEach(o => {
        const total = Number(o.total || 0);
        const costo = Number(o.costoTotal || 0);
        
        stats.ingresosTotal += total;
        stats.gastosTotal += costo;
        if (o.estado !== 'entregado') stats.ordenesAbiertas++;

        // Agrupación para gráfica Power BI
        const fecha = o.creadoEn?.toDate ? o.creadoEn.toDate().toISOString().split('T')[0] : hoy;
        stats.tendenciaDiaria[fecha] = (stats.tendenciaDiaria[fecha] || 0) + total;
    });

    stats.utilidad = stats.ingresosTotal - stats.gastosTotal;
    stats.margen = stats.ingresosTotal ? (stats.utilidad / stats.ingresosTotal) * 100 : 0;
    
    // Filtro de Inventario Crítico
    stats.alertasStock = inventario.filter(i => Number(i.cantidad) <= Number(i.minimo || 5));

    return stats;
}

function renderStructure(container) {
    container.innerHTML = `
    <div class="animate-fade-in p-4 lg:p-6 space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-black tracking-tighter text-white italic">DASHBOARD / <span class="text-cyan-400">COMMANDER</span></h1>
                <p class="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em]">Sistema de Control Predictivo</p>
            </div>
            <div class="flex gap-2">
                <button class="bg-slate-800/50 p-2 px-4 rounded-xl text-[10px] font-bold border border-slate-700 hover:border-cyan-500 transition-all">HOY</button>
                <button class="bg-cyan-500 text-black p-2 px-4 rounded-xl text-[10px] font-black shadow-[0_0_15px_rgba(6,182,212,0.4)]">MES</button>
            </div>
        </div>

        <div id="kpiGrid" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            ${Array(4).fill(`<div class="h-28 bg-slate-900/50 border border-slate-800 rounded-[2rem] animate-pulse"></div>`).join('')}
        </div>

        <div class="grid lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 bg-[#0a0f1d] p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Flujo de Ingresos Activo</h3>
                    <div id="chartValue" class="text-xs font-bold text-cyan-400">$0.00</div>
                </div>
                <canvas id="canvasPowerBI" class="w-full h-64"></canvas>
            </div>

            <div id="ceoPanel" class="bg-gradient-to-br from-slate-900 to-black p-6 rounded-[2.5rem] border border-cyan-500/20 relative group overflow-hidden">
                <div class="absolute -right-6 -bottom-6 text-9xl text-white/5 opacity-10 group-hover:rotate-12 transition-all">
                    <i class="fas fa-brain"></i>
                </div>
                <div class="relative z-10">
                    <h3 class="text-xs font-black text-cyan-400 uppercase tracking-widest mb-4 italic">👑 Estratega Nexus-X</h3>
                    <div id="aiInsights" class="space-y-4">
                        <div class="h-20 bg-slate-800/40 rounded-2xl animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>

        <button id="btnNexusCoach" class="fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full shadow-[0_10px_30px_rgba(6,182,212,0.5)] flex items-center justify-center border-2 border-white/20 hover:scale-110 active:scale-90 transition-all z-50 group">
            <i class="fas fa-comment-dots text-white text-xl group-hover:animate-bounce"></i>
            <span class="absolute right-20 bg-black/80 text-white text-[9px] px-3 py-1.5 rounded-lg border border-cyan-500/30 opacity-0 group-hover:opacity-100 transition-all uppercase font-black whitespace-nowrap">Hablar con Nexus</span>
        </button>
    </div>
    `;
}

function updateKPIs(m) {
    const grid = document.getElementById("kpiGrid");
    const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

    const cards = [
        { t: "Facturación", v: fmt(m.ingresosTotal), c: "text-emerald-400", i: "fa-receipt" },
        { t: "Utilidad Neta", v: fmt(m.utilidad), c: "text-cyan-400", i: "fa-wallet" },
        { t: "Margen Bruto", v: m.margen.toFixed(1) + "%", c: "text-yellow-400", i: "fa-chart-pie" },
        { t: "WIP (Órdenes)", v: m.ordenesAbiertas, c: "text-purple-400", i: "fa-tools" }
    ];

    grid.innerHTML = cards.map(c => `
        <div class="bg-slate-900/40 p-5 rounded-[2rem] border border-slate-800 hover:border-slate-600 transition-all group backdrop-blur-md">
            <div class="flex justify-between items-start mb-2">
                <p class="text-[8px] text-slate-500 font-black uppercase tracking-widest">${c.t}</p>
                <i class="fas ${c.i} text-[10px] text-slate-700 group-hover:text-cyan-500 transition-colors"></i>
            </div>
            <h2 class="${c.c} text-lg font-black tracking-tight">${c.v}</h2>
        </div>
    `).join("");
}

function renderPowerBIChart(m) {
    const ctx = document.getElementById("canvasPowerBI");
    if (!ctx || !window.Chart) return;

    if (mainChart) mainChart.destroy();

    const dates = Object.keys(m.tendenciaDiaria).sort();
    const values = dates.map(d => m.tendenciaDiaria[d]);

    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Ingresos',
                data: values,
                borderColor: '#06b6d4',
                borderWidth: 4,
                pointBackgroundColor: '#06b6d4',
                pointRadius: 2,
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(6, 182, 212, 0.05)'
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
                    ticks: { color: '#475569', font: { size: 8, weight: 'bold' } }
                }
            }
        }
    });
}

function updateCEOPanel(m) {
    const insightBox = document.getElementById("aiInsights");
    
    let html = "";
    
    // Logica de Alertas Prioritarias
    if (m.alertasStock.length > 0) {
        html += `
            <div class="bg-red-500/10 border border-red-500/20 p-3 rounded-2xl">
                <p class="text-[8px] text-red-400 font-black uppercase mb-1">Insumos Críticos</p>
                <p class="text-[10px] text-white font-bold leading-tight">Hay ${m.alertasStock.length} repuestos por debajo del stock mínimo.</p>
            </div>
        `;
    }

    // Insight de Rentabilidad
    const saludMargen = m.margen > 30 ? 'text-emerald-400' : 'text-amber-400';
    html += `
        <div class="bg-slate-800/30 p-4 rounded-2xl border border-white/5">
            <p class="text-[8px] text-slate-500 font-black uppercase mb-2">Análisis de Rentabilidad</p>
            <p class="text-[11px] text-slate-200 leading-relaxed italic border-l-2 border-cyan-500 pl-3">
                "Tu margen actual es del <span class="${saludMargen} font-black">${m.margen.toFixed(1)}%</span>. 
                ${m.margen < 25 ? 'Sugiero optimizar costos de mano de obra.' : 'Mantén este ritmo operativo.'}"
            </p>
        </div>
    `;

    insightBox.innerHTML = html;
}

function setupNexusCoach(m) {
    const btn = document.getElementById("btnNexusCoach");
    btn.onclick = () => {
        const userName = localStorage.getItem("userName") || "Ingeniero";
        const mensaje = `Hola ${userName}. El taller tiene ingresos por ${Math.round(m.ingresosTotal)} pesos este periodo. Tu margen de utilidad es del ${Math.round(m.margen)}%. ${m.alertasStock.length > 0 ? 'Recuerda que tienes alertas de inventario pendientes.' : 'La operación se ve estable.'}`;
        hablar(mensaje);
    };
}
