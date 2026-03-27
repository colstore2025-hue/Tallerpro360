/**
 * dashboard.js - TallerPRO360 NEXUS-CORE V15.0 🛰️
 * SISTEMA DE INTELIGENCIA DE NEGOCIO Y CONTROL DE MISIÓN
 */
import { getClientes, getOrdenes, getInventario } from "../services/dataService.js";
import { store } from "../core/store.js";
import { hablar } from "../voice/voiceCore.js";

let mainChart = null;

export default async function dashboard(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    
    // 1. Renderizado de la Estructura de Comando
    renderStructure(container);

    try {
        // 2. Carga Inteligente (Paralela y con Cache)
        const data = await loadDataSmart(empresaId);
        
        // 3. Procesamiento Nexus-BI
        const metrics = processBusinessIntelligence(data);

        // 4. Despliegue de Módulos (Animación en Cascada)
        updateKPIs(metrics);
        renderAdvancedChart(metrics);
        updatePhaseMonitor(metrics); // Nuevo: Monitor de Etapas
        updateSmartPanel(metrics);
        initNexusPredictor(metrics);

    } catch (err) {
        console.error("🚨 Critical Core Failure:", err);
        showErrorState(container);
    }
}

async function loadDataSmart(empresaId) {
    const now = Date.now();
    const CACHE_EXPIRY = 60 * 1000; // 1 min para máxima precisión

    if (store.cache && (now - store.lastFetch < CACHE_EXPIRY)) {
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

function processBusinessIntelligence(data) {
    const { ordenes, inventario } = data;
    const stats = {
        ingresos: 0, gastos: 0, util: 0, margen: 0,
        fases: { EN_TALLER: 0, DIAGNOSTICO: 0, REPARACION: 0, LISTO: 0 },
        totalClientes: data.clientes.length,
        tendencia: {}, stockCritico: []
    };

    ordenes.forEach(o => {
        const t = Number(o.total || 0);
        stats.ingresos += t;
        
        // Conteo de fases para el monitor inteligente
        const fase = o.estado || 'EN_TALLER';
        if(stats.fases[fase] !== undefined) stats.fases[fase]++;

        // Lógica de tendencia temporal
        const fecha = o.fechaIngreso?.toDate ? o.fechaIngreso.toDate().toLocaleDateString('es-CO', {day:'2-digit', month:'short'}) : 'Hoy';
        stats.tendencia[fecha] = (stats.tendencia[fecha] || 0) + t;
    });

    stats.util = stats.ingresos * 0.4; // Estimación base de utilidad si no hay costos cargados
    stats.margen = stats.ingresos ? (stats.util / stats.ingresos) * 100 : 0;
    stats.stockCritico = inventario.filter(i => Number(i.cantidad) <= Number(i.stockMinimo || 5));

    return stats;
}

function renderStructure(container) {
    container.innerHTML = `
    <div class="p-6 lg:p-12 space-y-10 animate-in fade-in zoom-in-95 duration-700 pb-32">
        
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div class="relative">
                <h1 class="orbitron text-4xl font-black text-white italic tracking-tighter uppercase">
                    NEXUS <span class="text-cyan-400">DASHBOARD</span>
                </h1>
                <p class="text-[9px] text-cyan-500 font-black uppercase tracking-[0.6em] mt-3 flex items-center gap-2 italic">
                    <span class="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></span> 
                    Sincronización de Datos Estelar en Tiempo Real
                </p>
            </div>
            <div class="flex bg-black/40 p-1.5 rounded-[2rem] border border-white/10 backdrop-blur-2xl shadow-2xl">
                <button class="px-8 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">Análisis Global</button>
                <button class="px-8 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-lg shadow-cyan-500/20 orbitron">Mes en Curso</button>
            </div>
        </div>

        <div id="kpiGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            ${Array(4).fill(`<div class="h-40 bg-white/5 rounded-[3rem] border border-white/5 animate-pulse"></div>`).join('')}
        </div>

        <div class="grid lg:grid-cols-12 gap-10">
            
            <div class="lg:col-span-8 space-y-8">
                <div class="bg-black/40 rounded-[4rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden backdrop-blur-3xl group">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] -mr-32 -mt-32"></div>
                    <div class="flex justify-between items-center mb-10 relative z-10">
                        <div>
                            <h3 class="orbitron text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Flujo de Caja Proyectado</h3>
                            <div class="flex items-baseline gap-4 mt-2">
                                <span class="text-4xl font-black text-white orbitron tracking-tighter" id="totalDisplay">$0</span>
                                <span class="text-emerald-400 text-[10px] font-black orbitron uppercase tracking-widest animate-pulse">▲ Optimal</span>
                            </div>
                        </div>
                    </div>
                    <div class="h-80 relative z-10">
                        <canvas id="mainChart"></canvas>
                    </div>
                </div>

                <div id="phaseMonitor" class="grid grid-cols-4 gap-4">
                    </div>
            </div>

            <div class="lg:col-span-4 space-y-8">
                <div id="smartPanel" class="bg-gradient-to-br from-slate-900 via-black to-black rounded-[4rem] p-10 border border-cyan-500/20 h-full flex flex-col justify-between shadow-2xl group relative overflow-hidden">
                    <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    
                    <div class="relative z-10 space-y-8">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3">
                                <div class="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(6,182,212,1)]"></div>
                                <span class="orbitron text-[10px] font-black text-white uppercase tracking-widest">Nexus IA Core</span>
                            </div>
                            <i class="fas fa-microchip text-slate-700 text-xl"></i>
                        </div>
                        
                        <div id="aiIntelligenceArea" class="space-y-6">
                            </div>
                    </div>

                    <div class="relative z-10 pt-10 mt-10 border-t border-white/10">
                        <p class="orbitron text-[8px] text-slate-500 font-black uppercase mb-6 tracking-[0.3em]">Acceso Rápido a Misiones</p>
                        <div class="grid grid-cols-1 gap-4">
                            <button onclick="location.hash='#ordenes'" class="group/btn bg-white/5 hover:bg-cyan-500 p-5 rounded-[2rem] text-[10px] font-black uppercase text-white hover:text-black transition-all border border-white/5 flex justify-between items-center">
                                Abrir Nueva Orden <i class="fas fa-plus-circle opacity-0 group-hover/btn:opacity-100 transition-all"></i>
                            </button>
                            <button onclick="location.hash='#pagos'" class="group/btn bg-cyan-500/5 hover:bg-emerald-500 p-5 rounded-[2rem] text-[10px] font-black uppercase text-cyan-400 hover:text-black transition-all border border-cyan-500/10 flex justify-between items-center">
                                Liquidar Caja <i class="fas fa-cash-register opacity-0 group-hover/btn:opacity-100 transition-all"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="nexusCoachTrigger" class="fixed bottom-12 right-12 cursor-pointer group z-[100]">
            <div class="absolute -inset-6 bg-cyan-500/30 rounded-full blur-2xl group-hover:bg-cyan-500/60 transition-all duration-700 animate-pulse"></div>
            <div class="relative w-24 h-24 bg-black rounded-full border-2 border-white/20 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,1)] transition-transform group-hover:scale-110 group-active:scale-90">
                <div class="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin duration-[3s]"></div>
                <i class="fas fa-fingerprint text-cyan-400 text-3xl group-hover:text-white transition-colors"></i>
            </div>
        </div>
    </div>
    `;
}

function updateKPIs(m) {
    const grid = document.getElementById("kpiGrid");
    const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

    const cards = [
        { label: "Ingresos Brutos", val: fmt(m.ingresos), icon: "fa-chart-line", color: "from-emerald-400 to-teal-500" },
        { label: "Utilidad Estimada", val: fmt(m.util), icon: "fa-shield-heart", color: "from-cyan-400 to-blue-500" },
        { label: "Misión: Clientes", val: m.totalClientes, icon: "fa-users-viewfinder", color: "from-purple-500 to-pink-500" },
        { label: "Eficiencia Real", val: Math.round(m.margen) + "%", icon: "fa-bolt", color: "from-amber-400 to-orange-500" }
    ];

    grid.innerHTML = cards.map(c => `
        <div class="bg-black/40 backdrop-blur-2xl p-8 rounded-[3.5rem] border border-white/5 hover:border-white/20 transition-all group relative overflow-hidden">
            <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-all text-6xl group-hover:scale-110 duration-500">
                <i class="fas ${c.icon}"></i>
            </div>
            <p class="orbitron text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4 italic">${c.label}</p>
            <h2 class="bg-gradient-to-r ${c.color} bg-clip-text text-transparent text-3xl font-black orbitron tracking-tighter">${c.val}</h2>
            <div class="mt-6 flex items-center gap-2">
                <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r ${c.color} w-3/4"></div>
                </div>
            </div>
        </div>
    `).join("");
    
    document.getElementById("totalDisplay").innerText = fmt(m.ingresos);
}

function updatePhaseMonitor(m) {
    const monitor = document.getElementById("phaseMonitor");
    const fases = [
        { id: 'EN_TALLER', label: 'Ingreso', icon: 'fa-sign-in-alt' },
        { id: 'DIAGNOSTICO', label: 'IA Diag', icon: 'fa-brain' },
        { id: 'REPARACION', label: 'Mecánica', icon: 'fa-tools' },
        { id: 'LISTO', label: 'Finalizado', icon: 'fa-flag-checkered' }
    ];

    monitor.innerHTML = fases.map(f => `
        <div class="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center text-center">
            <i class="fas ${f.icon} text-[10px] mb-2 ${m.fases[f.id] > 0 ? 'text-cyan-400' : 'text-slate-700'}"></i>
            <span class="orbitron text-[7px] text-slate-500 font-black uppercase mb-1">${f.label}</span>
            <span class="text-lg font-black text-white orbitron">${m.fases[f.id] || 0}</span>
        </div>
    `).join("");
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
                data: data,
                borderColor: '#06b6d4',
                borderWidth: 5,
                pointBackgroundColor: '#06b6d4',
                pointBorderColor: '#000',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 8,
                tension: 0.4,
                fill: true,
                backgroundColor: (context) => {
                    const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
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
                    grid: { color: 'rgba(255,255,255,0.02)' },
                    ticks: { color: '#64748b', font: { size: 9, family: 'Orbitron', weight: '900' } }
                }
            }
        }
    });
}

function updateSmartPanel(m) {
    const area = document.getElementById("aiIntelligenceArea");
    
    const stockMsg = m.stockCritico.length > 0 
        ? `<div class="flex items-center gap-3 text-red-400"><i class="fas fa-triangle-exclamation animate-pulse"></i> <span class="font-black uppercase text-[10px]">${m.stockCritico.length} CRITICAL STOCK ALERT</span></div>`
        : `<div class="flex items-center gap-3 text-emerald-500"><i class="fas fa-check-double"></i> <span class="font-black uppercase text-[10px]">SUPPLY CHAIN OPTIMAL</span></div>`;

    const statusIA = m.margen > 30 ? 'OPERACIÓN ALTAMENTE RENTABLE' : 'AJUSTAR COSTOS OPERATIVOS';

    area.innerHTML = `
        <div class="space-y-6">
            <div class="p-6 rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all">
                <p class="orbitron text-[8px] text-cyan-500 font-black uppercase mb-3 tracking-widest italic">Análisis Predictivo</p>
                <div class="text-[12px] leading-relaxed text-slate-200 italic font-medium">
                    "William, el rendimiento actual es del <span class="text-cyan-400 font-black">${m.margen.toFixed(1)}%</span>. Detecto <span class="text-white font-black">${m.fases.REPARACION} unidades</span> en etapa crítica de mecánica. Se recomienda acelerar la facturación de servicios terminados."
                </div>
            </div>
            <div class="p-6 rounded-[2.5rem] bg-black/50 border border-white/5">
                <p class="orbitron text-[8px] text-slate-500 font-black uppercase mb-4 tracking-widest">Estado de Insumos</p>
                ${stockMsg}
            </div>
        </div>
    `;
}

function initNexusPredictor(m) {
    document.getElementById("nexusCoachTrigger").onclick = () => {
        const audioMsg = `Comandante William. El sistema reporta un flujo de ${Math.round(m.ingresos)} pesos. Tenemos ${m.fases.EN_TALLER + m.fases.DIAGNOSTICO + m.fases.REPARACION} misiones activas en el radar. El inventario está bajo control. ¿Procedemos con la auditoría de caja?`;
        hablar(audioMsg);
    };
}

function showErrorState(container) {
    container.innerHTML = `
        <div class="p-40 text-center">
            <i class="fas fa-radiation text-6xl text-red-600 animate-pulse mb-8"></i>
            <h2 class="orbitron text-2xl font-black text-white uppercase tracking-widest">Nexus Core Offline</h2>
            <p class="text-slate-500 mt-4 font-black uppercase text-[10px]">Reintentando vinculación con satélite...</p>
        </div>
    `;
}
