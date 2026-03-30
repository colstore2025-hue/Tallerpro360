/**
 * dashboard.js - NEXUS-X AEGIS V32.0 🛰️
 * NÚCLEO DE INTELIGENCIA Y CONTROL DE MISIÓN (ESTÁNDAR GLOBAL SASS)
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { getClientes, getOrdenes, getInventario } from "../services/dataService.js";
import { SuperAIOrchestrator } from "../ai/superAI-orchestrator.js";

export default async function dashboard(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    
    // 1. Renderizado de Estructura de Alta Densidad (Aeroespacial)
    renderAegisInterface(container);

    try {
        // 2. Carga de Datos Paralela
        const [clientes, ordenes, inventario] = await Promise.all([
            getClientes(empresaId),
            getOrdenes(empresaId),
            getInventario(empresaId)
        ]);

        const data = { clientes, ordenes, inventario };

        // 3. Motor de Inteligencia de Negocio (Balanced Scorecard)
        const metrics = calculateBalancedScorecard(data);

        // 4. Despliegue de Módulos Visuales
        updateStrategicKPIs(metrics);
        renderRevenueNeuralChart(data.ordenes);
        renderWorkshopEfficiency(metrics);
        
        // 5. Activación de la Orquestación IA
        await deployAICommandCenter(data);

    } catch (err) {
        console.error("🚨 Nexus-X Breach:", err);
        showSystemCrash(container);
    }
}

function renderAegisInterface(container) {
    container.innerHTML = `
    <div class="p-4 lg:p-10 space-y-10 animate-in fade-in zoom-in duration-1000 pb-32 max-w-[1800px] mx-auto bg-[#020617]">
        
        <div class="flex flex-col lg:flex-row justify-between items-center gap-8 border-b border-white/5 pb-10">
            <div class="space-y-2 text-center lg:text-left">
                <div class="flex items-center justify-center lg:justify-start gap-4">
                    <span class="px-4 py-1 bg-red-600 text-[8px] font-black orbitron rounded-full text-white animate-pulse">CRITICAL PATH ACTIVE</span>
                    <span class="text-slate-500 font-mono text-[9px] tracking-[0.4em]">V32.0 / 2026</span>
                </div>
                <h1 class="text-6xl lg:text-8xl font-black text-white orbitron tracking-tighter italic uppercase">
                    TALLER<span class="text-cyan-400">PRO</span><span class="text-red-500">360</span>
                </h1>
                <p class="text-[10px] text-cyan-500 font-bold orbitron tracking-[0.6em] uppercase">Nexus-X Mission Control</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-[#0f172a] p-6 rounded-[2rem] border border-cyan-500/20 shadow-glow-cyan text-center">
                    <p class="text-[8px] text-cyan-400 font-black orbitron uppercase tracking-widest">Global Status</p>
                    <p class="text-2xl font-black text-white orbitron uppercase">NOMINAL</p>
                </div>
                <div class="bg-[#0f172a] p-6 rounded-[2rem] border border-amber-500/20 shadow-glow-amber text-center">
                    <p class="text-[8px] text-amber-500 font-black orbitron uppercase tracking-widest">AI Sync</p>
                    <p class="text-2xl font-black text-white orbitron uppercase">100%</p>
                </div>
            </div>
        </div>

        <div id="kpiGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"></div>

        <div class="grid lg:grid-cols-12 gap-8">
            <div class="lg:col-span-8 bg-[#0f172a]/50 border border-white/5 rounded-[4rem] p-12 backdrop-blur-xl relative overflow-hidden">
                <div class="absolute top-0 right-0 p-10 opacity-10">
                    <i class="fas fa-microchip text-9xl text-cyan-500"></i>
                </div>
                <div class="relative z-10">
                    <h3 class="orbitron text-[10px] text-cyan-500 font-black uppercase tracking-[0.5em] mb-10 italic">Flujo Financiero en Tiempo Real</h3>
                    <div class="h-[400px]"><canvas id="mainNeuralChart"></canvas></div>
                </div>
            </div>

            <div class="lg:col-span-4 space-y-8">
                <div id="aiOrchestratorBox" class="bg-gradient-to-br from-[#1e1b4b] to-[#450a0a] rounded-[3.5rem] p-10 border border-red-500/20 shadow-2xl relative overflow-hidden">
                    <div class="flex items-center gap-4 mb-10">
                        <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                            <i class="fas fa-brain text-red-600 text-xl"></i>
                        </div>
                        <div>
                            <h4 class="orbitron text-xs font-black text-white uppercase tracking-tighter">SuperAI Orchestrator</h4>
                            <p class="text-[8px] text-red-400 font-bold uppercase tracking-widest">Analizando ROI & Operación</p>
                        </div>
                    </div>
                    <div id="aiInsight" class="space-y-6 text-white/90 text-sm italic font-medium leading-relaxed border-l-4 border-amber-500 pl-6 mb-10">
                        Calculando variables de mercado y eficiencia técnica...
                    </div>
                    <div id="aiActionButtons" class="grid grid-cols-1 gap-3"></div>
                </div>

                <div id="efficiencyRank" class="bg-[#0f172a] rounded-[3rem] p-10 border border-white/5">
                    <h4 class="orbitron text-[9px] font-black text-amber-500 uppercase tracking-widest mb-8 italic">Ranking de Eficiencia Técnica</h4>
                    <div id="techList" class="space-y-6"></div>
                </div>
            </div>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
            <div class="bg-white/5 p-10 rounded-[3rem] border border-white/10">
                <span class="text-[8px] text-slate-400 font-black orbitron uppercase mb-4 block tracking-widest">Órdenes Críticas</span>
                <div class="text-5xl font-black text-white orbitron italic" id="txtCriticas">0</div>
                <div class="mt-6 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div id="barCriticas" class="h-full bg-red-600" style="width: 0%"></div>
                </div>
            </div>
            <div class="bg-white/5 p-10 rounded-[3rem] border border-white/10">
                <span class="text-[8px] text-slate-400 font-black orbitron uppercase mb-4 block tracking-widest">Ticket Promedio</span>
                <div class="text-5xl font-black text-cyan-400 orbitron italic" id="txtTicket">0</div>
            </div>
            <div class="bg-white/5 p-10 rounded-[3rem] border border-white/10">
                <span class="text-[8px] text-slate-400 font-black orbitron uppercase mb-4 block tracking-widest">Utilidad Estimada (30%)</span>
                <div class="text-5xl font-black text-emerald-500 orbitron italic" id="txtUtilidad">0</div>
            </div>
        </div>

    </div>
    <style>
        .shadow-glow-cyan { box-shadow: 0 0 40px rgba(6, 182, 212, 0.15); }
        .shadow-glow-amber { box-shadow: 0 0 40px rgba(245, 158, 11, 0.15); }
        .orbitron { font-family: 'Orbitron', sans-serif; }
    </style>
    `;
}

function calculateBalancedScorecard(data) {
    const totalRevenue = data.ordenes.reduce((acc, o) => acc + Number(o.total || o.valor || 0), 0);
    const completed = data.ordenes.filter(o => o.estado === "ENTREGADO" || o.estado === "FINALIZADO").length;
    const efficiency = data.ordenes.length > 0 ? (completed / data.ordenes.length) * 100 : 0;
    
    return {
        revenue: totalRevenue,
        customers: data.clientes.length,
        efficiency: efficiency.toFixed(1),
        stockAlerts: data.inventario.filter(i => Number(i.cantidad) <= Number(i.stockMinimo || 3)).length,
        ticketPromedio: data.ordenes.length > 0 ? totalRevenue / data.ordenes.length : 0,
        criticas: data.ordenes.filter(o => o.prioridad === "ALTA" && o.estado !== "ENTREGADO").length
    };
}

function updateStrategicKPIs(m) {
    const grid = document.getElementById("kpiGrid");
    const kpis = [
        { label: "Revenue Total", val: `$ ${m.revenue.toLocaleString()}`, color: "text-white", sub: "Bruto Global", icon: "fa-wallet" },
        { label: "Productividad", val: `${m.efficiency}%`, color: "text-cyan-400", sub: "Misiones Finalizadas", icon: "fa-rocket" },
        { label: "Active Fleet", val: m.customers, color: "text-amber-500", sub: "Clientes Registrados", icon: "fa-car-side" },
        { label: "Stock Breach", val: m.stockAlerts, color: "text-red-500", sub: "Artículos Agotándose", icon: "fa-radiation" }
    ];

    grid.innerHTML = kpis.map(k => `
        <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 hover:border-cyan-500/40 transition-all group relative overflow-hidden">
            <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <i class="fas ${k.icon} text-8xl"></i>
            </div>
            <p class="orbitron text-[9px] font-black text-slate-500 tracking-[0.4em] mb-6 uppercase">${k.label}</p>
            <div class="text-4xl font-black ${k.color} orbitron tracking-tighter mb-2">${k.val}</div>
            <p class="text-[8px] text-slate-600 font-bold uppercase tracking-widest">${k.sub}</p>
        </div>
    `).join("");

    document.getElementById("txtCriticas").innerText = m.criticas;
    document.getElementById("barCriticas").style.width = `${(m.criticas / 20) * 100}%`;
    document.getElementById("txtTicket").innerText = `$${Math.round(m.ticketPromedio).toLocaleString()}`;
    document.getElementById("txtUtilidad").innerText = `$${Math.round(m.revenue * 0.3).toLocaleString()}`;
}

async function deployAICommandCenter(data) {
    const insightBox = document.getElementById("aiInsight");
    const actionBox = document.getElementById("aiActionButtons");
    
    // Simulación de orquestación (Aquí llamarías a tu SuperAIOrchestrator)
    setTimeout(() => {
        const revenue = data.ordenes.reduce((acc, o) => acc + Number(o.total || 0), 0);
        
        insightBox.innerHTML = `
            "Nexus detecta una oportunidad de optimización en el flujo de caja. El ticket promedio de $${Math.round(revenue/data.ordenes.length).toLocaleString()} puede subir un 12% aplicando el <b>PricingOptimizerAI</b> en servicios de frenos y motor. Tienes ${data.inventario.filter(i => i.cantidad < 5).length} items que frenarán tu producción en 48 horas."
        `;

        actionBox.innerHTML = `
            <button class="w-full py-5 bg-cyan-500 text-black font-black orbitron text-[9px] rounded-2xl hover:bg-white transition-all uppercase">Ejecutar Revenue Optimizer</button>
            <button class="w-full py-5 bg-white/5 text-white font-black orbitron text-[9px] rounded-2xl border border-white/10 hover:bg-red-600 transition-all uppercase">Ver Smart Scheduler</button>
        `;
    }, 1500);
}

function renderRevenueNeuralChart(ordenes) {
    const ctx = document.getElementById("mainNeuralChart");
    if (!ctx || !window.Chart) return;
    
    const chart = Chart.getChart(ctx);
    if (chart) chart.destroy();

    // Agrupar por mes o día (simplificado para el ejemplo)
    const dataPoints = [12M, 19M, 15M, 25M, 22M, 30M, 45M]; // Datos de prueba estilo Aeroespacial

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['01', '05', '10', '15', '20', '25', '30'],
            datasets: [{
                label: 'Revenue Flow',
                data: dataPoints,
                borderColor: '#06b6d4',
                borderWidth: 6,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#06b6d4',
                fill: true,
                backgroundColor: (context) => {
                    const g = context.chart.ctx.createLinearGradient(0, 0, 0, 400);
                    g.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
                    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    return g;
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { family: 'Orbitron', size: 10 } } },
                x: { grid: { display: false }, ticks: { color: '#64748b', font: { family: 'Orbitron', size: 10 } } }
            }
        }
    });
}

function renderWorkshopEfficiency(m) {
    const list = document.getElementById("techList");
    // Datos ejemplo de técnicos
    const techs = [
        { n: "William Urquijo", p: 98, c: "text-cyan-400" },
        { n: "Staff Senior", p: 75, c: "text-amber-500" },
        { n: "Auxiliar A", p: 40, c: "text-red-500" }
    ];

    list.innerHTML = techs.map(t => `
        <div class="space-y-2">
            <div class="flex justify-between text-[10px] font-bold orbitron text-white">
                <span>${t.n.toUpperCase()}</span>
                <span class="${t.c}">${t.p}%</span>
            </div>
            <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div class="h-full ${t.c.replace('text', 'bg')}" style="width: ${t.p}%"></div>
            </div>
        </div>
    `).join("");
}

function showSystemCrash(container) {
    container.innerHTML = `<div class="h-screen flex items-center justify-center bg-black text-red-500 orbitron">SISTEMA NEXUS-X FUERA DE ÓRBITA - REINICIANDO...</div>`;
    setTimeout(() => location.reload(), 3000);
}
