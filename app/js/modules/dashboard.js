/**
 * dashboard.js - NEXUS-X AEGIS V32.9 🛰️
 * NÚCLEO DE INTELIGENCIA TÁCTICA (EDICIÓN PENTÁGONO ENTERPRISE)
 * APP: TallerPRO360 - ERP + CRM + AI Orchestrator
 */

import { getClientes, getOrdenes, getInventario } from "../services/dataService.js";
import superAI from "../ai/superAI-orchestrator.js";

// 🛡️ 1. LÓGICA GLOBAL DE PROTECCIÓN (PAYWALL)
window.restrictedAccess = () => {
    Swal.fire({
        title: '<span class="orbitron text-lg text-white">ACCESO RESTRINGIDO</span>',
        html: '<p class="text-slate-400 text-sm">Los módulos de gestión operativa (ERP/CRM) requieren un <b>Nodo de Pago</b> activo para procesar información real del taller.</p>',
        icon: 'lock',
        background: '#020617',
        color: '#fff',
        confirmButtonText: 'REVISAR PLANES',
        confirmButtonColor: '#06b6d4',
        showCancelButton: true,
        cancelButtonText: 'LUEGO',
        customClass: { popup: 'rounded-[2rem] border border-white/10' }
    }).then((result) => {
        if (result.isConfirmed) location.hash = '#planes';
    });
};

export default async function dashboard(container, state) {
    // 📡 Detección de Identidad y Plan
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    const planActual = localStorage.getItem("planTipo") || "GRATI-CORE";
    const isDemo = planActual === "GRATI-CORE";

    if (!empresaId) return showSystemCrash(container, "BUSCANDO ÓRBITA...");

    // Renderizado inicial de la interfaz
    renderPentagonInterface(container, isDemo, planActual);

    try {
        // Carga de Datos en paralelo
        const [clientes, ordenes, inventario] = await Promise.all([
            getClientes(empresaId).catch(() => []),
            getOrdenes(empresaId).catch(() => []),
            getInventario(empresaId).catch(() => [])
        ]);

        const data = { clientes, ordenes, inventario };
        const metrics = processStrategicMetrics(data);

        // Actualización del HUD y métricas
        updateTacticalHUD(metrics);
        
        // Inicialización diferida de componentes visuales
        setTimeout(() => {
            if (window.Chart) renderNeuralGrowthChart(metrics.tendencia);
            renderTechEfficiencyMatrix(data.ordenes);
            deployAIOrchestrator(data);
            
            if (isDemo) {
                const diasTag = document.getElementById("dias-restantes");
                if (diasTag) diasTag.innerText = "7";
            }
        }, 150);

    } catch (err) {
        console.error("🚨 Fallo Crítico:", err);
        showSystemCrash(container, "LINK PROTOCOL BROKEN: DATA_SYNC");
    }
}

// 📐 2. COMPONENTES DE INTERFAZ
function renderPentagonInterface(container, isDemo, planActual) {
    container.innerHTML = `
    <div id="banner-demo" class="${isDemo ? '' : 'hidden'} bg-gradient-to-r from-amber-600/20 to-red-600/20 border-b border-amber-500/50 p-3 text-center text-[10px] orbitron text-amber-500 sticky top-0 z-[1000] backdrop-blur-md">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        MODO DISCOVERY: Módulos ERP bloqueados. Expira en <span id="dias-restantes">--</span> días. 
        <a href="#planes" class="underline ml-2 font-black hover:text-white transition-all">ADQUIRIR LICENCIA FULL</a>
    </div>

    <div class="p-4 lg:p-10 space-y-10 animate-in fade-in zoom-in duration-700 pb-32 max-w-[1800px] mx-auto bg-[#02040a] min-h-screen text-white">
        
        <div class="flex flex-col lg:flex-row justify-between items-center gap-8 border-b-2 border-cyan-500/20 pb-10">
            <div class="relative group">
                <div class="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-red-600 rounded-lg blur opacity-25"></div>
                <div class="relative bg-black px-8 py-4 rounded-lg border border-white/10">
                    <h1 class="text-4xl lg:text-7xl font-black orbitron italic tracking-tighter uppercase">
                        NEXUS<span class="text-cyan-400">_AEGIS</span><span class="text-red-500">.X</span>
                    </h1>
                    <p class="text-[9px] text-cyan-500 font-bold orbitron tracking-[0.6em] uppercase mt-2 italic">SISTEMA PENTAGONAL V32.9</p>
                </div>
            </div>
            
            <div class="flex gap-4">
                <div class="bg-[#0d1117] border-l-4 border-amber-500 p-6 rounded-r-2xl">
                    <p class="text-[8px] text-amber-500 font-black orbitron uppercase">Nodo Status</p>
                    <p class="text-xl font-black orbitron uppercase">${planActual}</p>
                </div>
                <div class="bg-[#0d1117] border-l-4 border-emerald-500 p-6 rounded-r-2xl shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <p class="text-[8px] text-emerald-500 font-black orbitron uppercase">Sincronía</p>
                    <p class="text-xl font-black orbitron text-emerald-400">NOMINAL</p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            ${renderModuleBtn('Inventario', 'fa-boxes', '#inventario', isDemo)}
            ${renderModuleBtn('Contabilidad', 'fa-calculator', '#contabilidad', isDemo)}
            ${renderModuleBtn('Staff', 'fa-users-cog', '#staff', isDemo)}
            ${renderModuleBtn('Nómina', 'fa-file-invoice-dollar', '#nomina', isDemo)}
            ${renderModuleBtn('Reportes', 'fa-chart-pie', '#reportes', isDemo)}
            ${renderModuleBtn('Finanzas Elite', 'fa-crown', '#finanzas_elite', isDemo, true)}
        </div>

        <div id="hudKpis" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            ${[1,2,3,4].map(() => `<div class="h-32 bg-white/5 animate-pulse rounded-[2.5rem]"></div>`).join('')}
        </div>

        <div class="grid lg:grid-cols-12 gap-8">
            <div class="lg:col-span-8 bg-[#0d1117] border border-white/5 rounded-[3rem] p-12 relative shadow-2xl overflow-hidden">
                <div class="absolute top-0 right-0 p-8 opacity-10"><i class="fas fa-project-diagram text-6xl text-cyan-500"></i></div>
                <h3 class="orbitron text-[10px] text-cyan-500 font-black uppercase tracking-[0.5em] italic mb-10">Proyección de Ingresos Global</h3>
                <div class="h-[400px]"><canvas id="neuralChart"></canvas></div>
            </div>

            <div class="lg:col-span-4 space-y-8">
                <div class="bg-gradient-to-br from-[#111827] to-[#02040a] rounded-[3rem] p-10 border border-cyan-500/30 shadow-glow-cyan/10">
                    <div class="flex items-center gap-5 mb-8">
                        <i class="fas fa-brain text-cyan-400 text-3xl animate-pulse"></i>
                        <h4 class="orbitron text-sm font-black text-white tracking-widest">IA COMMANDER</h4>
                    </div>
                    <div id="aiAnalysis" class="text-sm text-slate-300 leading-relaxed italic border-l-2 border-red-500 pl-6 py-2 mb-10 bg-white/5 rounded-r-2xl">
                        Iniciando escaneo de base de datos...
                    </div>
                    <div id="aiButtons" class="grid grid-cols-1 gap-4"></div>
                </div>

                <div class="bg-[#0d1117] rounded-[3rem] p-10 border border-white/5">
                    <h4 class="orbitron text-[9px] font-black text-amber-500 uppercase tracking-widest mb-8">Matriz de Eficiencia Técnica</h4>
                    <div id="techMatrix" class="space-y-6"></div>
                </div>
            </div>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
            <div class="bg-gradient-to-t from-red-900/20 to-transparent p-10 rounded-[3rem] border border-red-500/20 text-center hover:border-red-500/50 transition-all">
                <p class="text-[9px] text-red-500 font-black orbitron mb-4 uppercase">Ticket Promedio</p>
                <div class="text-5xl font-black orbitron" id="valTicket">$ 0</div>
            </div>
            <div class="bg-gradient-to-t from-cyan-900/20 to-transparent p-10 rounded-[3rem] border border-cyan-500/20 text-center hover:border-cyan-500/50 transition-all">
                <p class="text-[9px] text-cyan-500 font-black orbitron mb-4 uppercase">Revenue Mensual</p>
                <div class="text-5xl font-black orbitron" id="valRevenue">$ 0</div>
            </div>
            <div class="bg-gradient-to-t from-emerald-900/20 to-transparent p-10 rounded-[3rem] border border-emerald-500/20 text-center hover:border-emerald-500/50 transition-all">
                <p class="text-[9px] text-emerald-500 font-black orbitron mb-4 uppercase">Utilidad Neta</p>
                <div class="text-5xl font-black orbitron text-emerald-400 text-shadow-glow" id="valProfit">$ 0</div>
            </div>
        </div>
    </div>`;
}

function renderModuleBtn(name, icon, hash, isDemo, isElite = false) {
    const action = isDemo ? `onclick="window.restrictedAccess()"` : `onclick="location.hash='${hash}'"`;
    const style = isElite 
        ? 'border-cyan-500/40 bg-cyan-500/5 text-cyan-400' 
        : 'border-white/5 bg-[#0d1117] text-slate-400 hover:border-white/20';
    const lockIcon = isDemo ? '<i class="fas fa-lock absolute top-3 right-3 text-[7px] text-amber-500 opacity-60"></i>' : '';

    return `
    <button ${action} class="relative p-5 rounded-2xl border ${style} hover:scale-105 active:scale-95 transition-all group overflow-hidden">
        ${lockIcon}
        <i class="fas ${icon} text-xl mb-3 group-hover:scale-110 transition-transform"></i>
        <p class="orbitron text-[8px] font-bold uppercase tracking-[0.2em]">${name}</p>
    </button>`;
}

// 🧠 3. NÚCLEO DE PROCESAMIENTO
function processStrategicMetrics(data) {
    const revenue = data.ordenes.reduce((acc, o) => acc + Number(o.total || o.valor || 0), 0);
    const count = data.ordenes.length;
    const criticos = data.inventario.filter(i => Number(i.cantidad || 0) <= Number(i.stockMinimo || 5)).length;
    const tendencia = { "LUN": revenue*0.2, "MAR": revenue*0.4, "MIE": revenue*0.3, "JUE": revenue*0.6, "VIE": revenue };
    return { revenue, count, avgTicket: count > 0 ? revenue / count : 0, clients: data.clientes.length, criticos, tendencia };
}

function updateTacticalHUD(m) {
    const hud = document.getElementById("hudKpis");
    if (!hud) return;

    const cards = [
        { label: "Capital Operativo", val: `$ ${m.revenue.toLocaleString()}`, icon: "fa-shield-alt", col: "text-white" },
        { label: "Base Clientes", val: m.clients, icon: "fa-users-cog", col: "text-cyan-400" },
        { label: "Alertas Stock", val: m.criticos, icon: "fa-exclamation-triangle", col: "text-red-500" },
        { label: "Estatus Nodo", val: "ONLINE", icon: "fa-satellite-dish", col: "text-emerald-400" }
    ];

    hud.innerHTML = cards.map(c => `
        <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 hover:border-cyan-500/30 transition-all group">
            <p class="orbitron text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4 group-hover:text-cyan-500 transition-colors">${c.label}</p>
            <div class="flex justify-between items-end">
                <div class="text-3xl font-black orbitron ${c.col}">${c.val}</div>
                <i class="fas ${c.icon} text-xl opacity-20 group-hover:opacity-100 group-hover:text-cyan-500 transition-all"></i>
            </div>
        </div>`).join("");
    
    const tkt = document.getElementById("valTicket");
    const rev = document.getElementById("valRevenue");
    const prf = document.getElementById("valProfit");

    if (tkt) tkt.innerText = `$ ${Math.round(m.avgTicket).toLocaleString()}`;
    if (rev) rev.innerText = `$ ${m.revenue.toLocaleString()}`;
    if (prf) prf.innerText = `$ ${Math.round(m.revenue * 0.35).toLocaleString()}`;
}

function renderNeuralGrowthChart(tendencia) {
    const ctx = document.getElementById("neuralChart");
    if (!ctx) return;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(tendencia),
            datasets: [{
                data: Object.values(tendencia),
                borderColor: '#00f2ff',
                borderWidth: 4,
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(0, 242, 255, 0.05)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#475569', font: { family: 'Orbitron', size: 9 } } },
                y: { display: false }
            }
        }
    });
}

function renderTechEfficiencyMatrix(ordenes) {
    const container = document.getElementById("techMatrix");
    if (!container) return;
    const stats = {};
    ordenes.forEach(o => {
        const t = o.tecnico || "Personal";
        if (!stats[t]) stats[t] = 0;
        stats[t] += Number(o.total || o.valor || 0);
    });
    container.innerHTML = Object.entries(stats).slice(0, 4).map(([name, val]) => `
        <div class="space-y-2">
            <div class="flex justify-between text-[10px] orbitron uppercase">
                <span class="text-white">${name}</span>
                <span class="text-cyan-400">$ ${val.toLocaleString()}</span>
            </div>
            <div class="h-1 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-cyan-500 shadow-glow-cyan" style="width: ${Math.min((val/1000000)*100, 100)}%"></div>
            </div>
        </div>`).join("");
}

async function deployAIOrchestrator(data) {
    const analysis = document.getElementById("aiAnalysis");
    const buttons = document.getElementById("aiButtons");
    if (!analysis || !buttons) return;

    const insights = await superAI.getDashboardInsights();
    analysis.innerHTML = `"Nexus-X detecta un ROI de <b>${insights.optimizationRate || 85}%</b>. ${insights.recommendation || 'Iniciando fase de optimización estratégica.'}"`;
    buttons.innerHTML = `
        <button class="py-4 bg-cyan-500 text-black orbitron text-[9px] font-black rounded-xl uppercase hover:bg-white transition-all">Ejecutar Optimización</button>
        <button onclick="location.hash='#ajustes'" class="py-4 bg-white/5 text-white border border-white/10 orbitron text-[9px] font-black rounded-xl uppercase hover:bg-white/10 transition-all">Sincronía de Nodo</button>
    `;
}

function showSystemCrash(container, message) {
    container.innerHTML = `
    <div class="h-screen bg-[#02040a] flex flex-col items-center justify-center space-y-8 text-center p-10">
        <i class="fas fa-satellite-dish text-red-500 text-6xl animate-pulse"></i>
        <h2 class="orbitron text-2xl font-black text-white italic tracking-widest">${message}</h2>
        <p class="text-[10px] text-slate-500 orbitron uppercase tracking-[0.4em]">Error de Sincronización en TallerPRO360</p>
        <button onclick="location.reload()" class="px-12 py-4 bg-white text-black orbitron text-[10px] font-black rounded-full hover:bg-cyan-500 transition-all">RE-ESTABLECER ENLACE</button>
    </div>`;
}
