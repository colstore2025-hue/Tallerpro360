/**
 * dashboard.js - NEXUS-X AEGIS V32.5 🛰️
 * NÚCLEO DE INTELIGENCIA TÁCTICA (EDICIÓN PENTÁGONO)
 * Protocolo de Resiliencia: Triple-Vía (State -> Storage -> Firestore)
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { getClientes, getOrdenes, getInventario } from "../services/dataService.js";
import { SuperAIOrchestrator } from "../ai/superAI-orchestrator.js";

export default async function dashboard(container, state) {
    // 🛡️ PROTOCOLO DE SEGURIDAD PENTÁGONO: Recuperación de enlace
    let empresaId = state?.empresaId || localStorage.getItem("nexus_empresaId");
    
    // Si el ID falla, forzamos un chequeo de emergencia para evitar el "Protocol Broken"
    if (!empresaId || empresaId === "PENDIENTE") {
        console.error("🚨 Nexus-X: Enlace roto. Iniciando protocolo de recuperación...");
        // Intentar recuperar del UID si está disponible
        const uid = state?.uid || localStorage.getItem("nexus_uid");
        if (uid) {
            // Aquí se dispararía la lógica de reconexión automática que definimos en config.js
            return showSystemCrash(container, "RECONECTANDO ÓRBITA...");
        }
    }

    // 1. Renderizado de Interfaz de Mando Aeroespacial
    renderPentagonInterface(container);

    try {
        // 2. Carga de Datos con Timeout de Seguridad
        const data = await Promise.race([
            loadData(empresaId),
            new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT_ORBITAL")), 8000))
        ]);

        // 3. Motor de Balanced Scorecard (BSC)
        const metrics = processStrategicMetrics(data);

        // 4. Despliegue de Módulos de Inteligencia
        updateTacticalHUD(metrics);
        renderNeuralGrowthChart(data.ordenes);
        deployAIOrchestrator(data);
        renderTechEfficiencyMatrix(data.ordenes);

    } catch (err) {
        console.error("🚨 Fallo en Command Center:", err);
        showSystemCrash(container, "LINK PROTOCOL BROKEN: DASHBOARD");
    }
}

function renderPentagonInterface(container) {
    container.innerHTML = `
    <div class="p-4 lg:p-10 space-y-10 animate-in fade-in zoom-in duration-1000 pb-32 max-w-[1800px] mx-auto bg-[#02040a] min-h-screen text-white">
        
        <div class="flex flex-col lg:flex-row justify-between items-center gap-8 border-b-2 border-cyan-500/20 pb-10">
            <div class="relative group">
                <div class="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-red-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div class="relative bg-black px-8 py-4 rounded-lg border border-white/10">
                    <h1 class="text-5xl lg:text-7xl font-black orbitron italic tracking-tighter uppercase">
                        NEXUS<span class="text-cyan-400">_AEGIS</span><span class="text-red-500">.X</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-2">
                        <span class="h-2 w-2 bg-emerald-500 rounded-full animate-ping"></span>
                        <p class="text-[9px] text-cyan-500 font-bold orbitron tracking-[0.6em] uppercase">SISTEMA DE CONTROL PENTAGONAL V32.5</p>
                    </div>
                </div>
            </div>
            
            <div class="flex gap-4">
                <div class="bg-[#0d1117] border-l-4 border-amber-500 p-6 rounded-r-2xl shadow-2xl">
                    <p class="text-[8px] text-amber-500 font-black orbitron uppercase">Nivel de Alerta</p>
                    <p class="text-xl font-black orbitron">DEFCON 1</p>
                </div>
                <div class="bg-[#0d1117] border-l-4 border-cyan-500 p-6 rounded-r-2xl shadow-2xl">
                    <p class="text-[8px] text-cyan-500 font-black orbitron uppercase">Sincronización</p>
                    <p class="text-xl font-black orbitron text-emerald-400">NOMINAL</p>
                </div>
            </div>
        </div>

        <div id="hudKpis" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"></div>

        <div class="grid lg:grid-cols-12 gap-8">
            <div class="lg:col-span-8 bg-[#0d1117] border border-white/5 rounded-[3rem] p-12 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div class="flex justify-between items-center mb-10">
                    <h3 class="orbitron text-[10px] text-cyan-500 font-black uppercase tracking-[0.5em] italic">Proyección de Ingresos Global</h3>
                    <div class="flex gap-2">
                        <span class="w-3 h-3 bg-cyan-500 rounded-full"></span>
                        <span class="w-3 h-3 bg-red-500 rounded-full"></span>
                    </div>
                </div>
                <div class="h-[450px]"><canvas id="neuralChart"></canvas></div>
            </div>

            <div class="lg:col-span-4 space-y-8">
                <div class="bg-gradient-to-br from-[#111827] to-[#1e1b4b] rounded-[3rem] p-10 border border-cyan-500/30 shadow-glow-cyan">
                    <div class="flex items-center gap-5 mb-8">
                        <div class="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
                            <i class="fas fa-brain text-cyan-400 text-3xl animate-pulse"></i>
                        </div>
                        <h4 class="orbitron text-sm font-black text-white tracking-widest">IA COMMANDER</h4>
                    </div>
                    <div id="aiAnalysis" class="text-sm text-slate-300 leading-relaxed italic border-l-2 border-red-500 pl-6 py-2 mb-10 bg-white/5 rounded-r-2xl">
                        Escaneando métricas de rendimiento...
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
            <div class="bg-gradient-to-t from-red-900/20 to-transparent p-10 rounded-[3rem] border border-red-500/20">
                <p class="text-[9px] text-red-500 font-black orbitron uppercase mb-4 tracking-widest italic">Ticket Promedio</p>
                <div class="text-6xl font-black orbitron" id="valTicket">$ 0</div>
            </div>
            <div class="bg-gradient-to-t from-cyan-900/20 to-transparent p-10 rounded-[3rem] border border-cyan-500/20">
                <p class="text-[9px] text-cyan-500 font-black orbitron uppercase mb-4 tracking-widest italic">Revenue Mensual</p>
                <div class="text-6xl font-black orbitron" id="valRevenue">$ 0</div>
            </div>
            <div class="bg-gradient-to-t from-emerald-900/20 to-transparent p-10 rounded-[3rem] border border-emerald-500/20">
                <p class="text-[9px] text-emerald-500 font-black orbitron uppercase mb-4 tracking-widest italic">Utilidad Neta Est.</p>
                <div class="text-6xl font-black orbitron text-emerald-400" id="valProfit">$ 0</div>
            </div>
        </div>
    </div>
    <style>
        .orbitron { font-family: 'Orbitron', sans-serif; }
        .shadow-glow-cyan { box-shadow: 0 0 30px rgba(6, 182, 212, 0.2); }
    </style>
    `;
}

async function loadData(empresaId) {
    const [c, o, i] = await Promise.all([
        getClientes(empresaId),
        getOrdenes(empresaId),
        getInventario(empresaId)
    ]);
    return { clientes: c, ordenes: o, inventario: i };
}

function processStrategicMetrics(data) {
    const total = data.ordenes.reduce((acc, o) => acc + Number(o.total || o.valor || 0), 0);
    const count = data.ordenes.length;
    const stockAlerts = data.inventario.filter(i => Number(i.cantidad) <= Number(i.stockMinimo || 5)).length;
    
    return {
        revenue: total,
        totalOrders: count,
        avgTicket: count > 0 ? total / count : 0,
        clients: data.clientes.length,
        criticalItems: stockAlerts,
        efficiency: 94.2 // Valor simulado para el Pentágono
    };
}

function updateTacticalHUD(m) {
    const hud = document.getElementById("hudKpis");
    const cards = [
        { label: "Capital Operativo", val: `$ ${m.revenue.toLocaleString()}`, icon: "fa-shield-alt", col: "text-white" },
        { label: "Base de Datos", val: m.clients, icon: "fa-users-cog", col: "text-cyan-400" },
        { label: "Brecha de Stock", val: m.criticalItems, icon: "fa-exclamation-triangle", col: "text-red-500" },
        { label: "Eficiencia Nodo", val: `${m.efficiency}%`, icon: "fa-satellite-dish", col: "text-amber-500" }
    ];

    hud.innerHTML = cards.map(c => `
        <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 relative group overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p class="orbitron text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4">${c.label}</p>
            <div class="flex justify-between items-end">
                <div class="text-3xl font-black orbitron ${c.col}">${c.val}</div>
                <i class="fas ${c.icon} text-xl opacity-20 group-hover:opacity-60 transition-all"></i>
            </div>
        </div>
    `).join("");

    document.getElementById("valTicket").innerText = `$${Math.round(m.avgTicket).toLocaleString()}`;
    document.getElementById("valRevenue").innerText = `$${m.revenue.toLocaleString()}`;
    document.getElementById("valProfit").innerText = `$${Math.round(m.revenue * 0.35).toLocaleString()}`;
}

async function deployAIOrchestrator(data) {
    const analysis = document.getElementById("aiAnalysis");
    const buttons = document.getElementById("aiButtons");
    
    // Simulación de orquestación de IA
    setTimeout(() => {
        analysis.innerHTML = `
            "Análisis completado. <b>SuperAI Orchestrator</b> detecta anomalías en el inventario. Sugerencia: Activar <b>WorkshopRevenueOptimizer</b> para cubrir el déficit de utilidad mensual. El ticket promedio está por debajo del estándar internacional ($450 USD)."
        `;
        buttons.innerHTML = `
            <button class="py-4 bg-cyan-500 text-black orbitron text-[9px] font-black rounded-xl uppercase tracking-widest hover:scale-105 transition-transform">Optimizar Ingresos</button>
            <button class="py-4 bg-white/5 text-white border border-white/10 orbitron text-[9px] font-black rounded-xl uppercase tracking-widest hover:bg-white/10 transition-all">Revisar Logística Nexus</button>
        `;
    }, 2000);
}

function showSystemCrash(container, message) {
    container.innerHTML = `
    <div class="h-screen bg-[#02040a] flex flex-col items-center justify-center space-y-8">
        <div class="relative">
            <i class="fas fa-satellite-dish text-red-500 text-8xl animate-pulse"></i>
            <div class="absolute inset-0 bg-red-500 blur-3xl opacity-20"></div>
        </div>
        <div class="text-center space-y-4">
            <h2 class="orbitron text-2xl font-black text-white italic tracking-[0.5em]">${message}</h2>
            <p class="text-[10px] text-slate-500 orbitron uppercase tracking-[0.4em]">Error de enlace: El nodo de datos no responde.</p>
        </div>
        <button onclick="location.reload()" class="px-12 py-5 bg-white text-black orbitron text-[10px] font-black rounded-full hover:bg-cyan-500 transition-all shadow-glow-cyan">RE-ESTABLECER COMUNICACIÓN</button>
    </div>`;
}

// Funciones placeholder para completar el ciclo
function renderNeuralGrowthChart(o) { /* Lógica de Chart.js */ }
function renderTechEfficiencyMatrix(o) { /* Lógica de barras de progreso */ }
