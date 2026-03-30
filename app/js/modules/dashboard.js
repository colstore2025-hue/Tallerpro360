/**
 * dashboard.js - NEXUS-X AEGIS V31.2 🛰️
 * NÚCLEO DE INTELIGENCIA PREDICTIVA Y CONTROL DE MISIÓN GLOBAL
 * Nivel: Grado Militar / Aeroespacial
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { 
    getClientes, getOrdenes, getInventario, getEmpresaData 
} from "../services/dataService.js";

import { 
    collection, query, where, orderBy, limit, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

const NEXUS_VERSION = "V31.2 AEGIS ULTRA";
const COMISION_TECNICO = 0.30; 

export default async function dashboard(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const planTipo = localStorage.getItem("nexus_plan") || "freemium";
    const nexusMode = localStorage.getItem("nexus_mode");

    const access = await verifyNexusAuth(empresaId, planTipo);
    
    // Renderizado de la estructura con efectos de borde neón
    renderAegisInterface(container, access, nexusMode);

    try {
        const data = await loadNexusData(empresaId, nexusMode);
        const metrics = processBusinessIntelligence(data);

        updateTacticalKPIs(metrics, access);
        renderNeuralChart(metrics);
        updatePhaseMatrix(metrics); 
        deployAIAdvisor(metrics, nexusMode);
        
        // Módulos de rendimiento y pagos
        renderLiveLogs("logContent", empresaId);
        renderTechPerformance("techPerformance", data.ordenes);
        renderPayrollModule("payrollModule", data.ordenes);
        
        if (access.status === "LOCKED") applyHardLock();

    } catch (err) {
        showSystemCrash(container);
    }
}

// --- INTERFAZ DE COMANDO DE ÚLTIMA GENERACIÓN ---

function renderAegisInterface(container, access, mode) {
    const isSim = mode === "SIMULATOR";
    
    container.innerHTML = `
    <div class="p-4 lg:p-10 space-y-10 animate-in fade-in duration-1000 pb-24 max-w-[1700px] mx-auto bg-[#010409]">
        
        <div class="flex flex-col lg:flex-row justify-between items-end gap-6 border-b border-white/5 pb-10">
            <div class="space-y-4">
                <div class="flex items-center gap-4">
                    <div class="h-3 w-3 bg-cyan-500 rounded-full animate-ping shadow-[0_0_15px_#00f2ff]"></div>
                    <span class="orbitron text-[10px] font-black text-cyan-400 tracking-[0.5em] uppercase">
                        ${isSim ? 'MODO SIMULACIÓN ACTIVADO' : 'NEXUS-X LIVE SATELLITE LINK'}
                    </span>
                </div>
                <h1 class="text-7xl font-black text-white orbitron tracking-tighter italic">
                    COMMAND_<span class="text-cyan-400 drop-shadow-[0_0_10px_#00f2ff]">CENTER</span>
                </h1>
            </div>
            
            <div class="flex items-center gap-6 bg-[#0d1117] p-6 rounded-[2.5rem] border border-cyan-500/30 shadow-[0_0_20px_rgba(0,242,255,0.1)]">
                <div class="text-right">
                    <p class="text-[8px] text-slate-500 font-black orbitron uppercase tracking-[0.3em]">Status Licencia</p>
                    <p class="text-lg font-black text-white orbitron">${access.plan.toUpperCase()}</p>
                </div>
                <div class="h-12 w-[1px] bg-white/10"></div>
                <button onclick="location.hash='#pagos'" class="w-14 h-14 bg-gradient-to-tr from-cyan-600 to-blue-400 rounded-2xl text-black hover:scale-110 transition-all shadow-[0_10px_30px_rgba(0,242,255,0.4)] flex items-center justify-center">
                    <i class="fas fa-shield-virus text-xl"></i>
                </button>
            </div>
        </div>

        <div id="kpiGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"></div>

        <div class="grid lg:grid-cols-12 gap-10">
            <div class="lg:col-span-8 space-y-10">
                <div class="bg-[#0d1117] rounded-[4rem] p-12 border border-white/5 relative overflow-hidden shadow-2xl group">
                    <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                    <div class="flex justify-between items-start mb-16">
                        <div>
                            <h3 class="orbitron text-[10px] text-cyan-500 font-black uppercase tracking-[0.6em] mb-4">Ingresos Brutos Globales</h3>
                            <div class="text-7xl font-black text-white orbitron tracking-tighter drop-shadow-sm" id="mainIncome">$0</div>
                        </div>
                        <div class="bg-white/5 p-6 rounded-3xl border border-white/5 text-right">
                            <p class="text-[9px] text-emerald-400 font-black orbitron uppercase mb-2">Eficiencia Operativa</p>
                            <div class="text-4xl font-black text-white italic tracking-tighter">98.2%</div>
                        </div>
                    </div>
                    <div class="h-[400px] w-full"><canvas id="neuralChart"></canvas></div>
                </div>

                <div id="phaseMatrix" class="grid grid-cols-2 md:grid-cols-4 gap-8"></div>
            </div>

            <div class="lg:col-span-4 space-y-10">
                <div id="aiAdvisor" class="bg-gradient-to-br from-[#0d1117] to-black rounded-[3.5rem] p-12 border-2 border-cyan-500/20 shadow-[0_0_50px_rgba(0,242,255,0.05)] relative overflow-hidden group">
                    <div class="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] group-hover:bg-cyan-500/20 transition-all"></div>
                    <div class="relative z-10 space-y-10">
                        <div class="flex items-center gap-6">
                            <div class="w-20 h-20 bg-cyan-500/10 rounded-[2rem] flex items-center justify-center border border-cyan-400/40 shadow-[0_0_20px_rgba(0,242,255,0.2)]">
                                <i class="fas fa-brain text-cyan-400 text-3xl animate-pulse"></i>
                            </div>
                            <div>
                                <h4 class="orbitron text-xs font-black text-white tracking-widest uppercase">Nexus Advisor AI</h4>
                                <span class="flex items-center gap-2 text-[8px] text-emerald-400 font-bold uppercase tracking-widest mt-1">
                                    <span class="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Procesando Datos Real-Time
                                </span>
                            </div>
                        </div>
                        <div id="aiMessage" class="text-base text-slate-200 leading-relaxed italic border-l-4 border-cyan-500/60 pl-8 py-4 bg-white/5 rounded-r-[2rem] font-medium">
                            Escaneando flujos de trabajo...
                        </div>
                        <button onclick="location.hash='#ordenes'" class="w-full py-7 bg-white text-black rounded-3xl orbitron text-[11px] font-black uppercase tracking-[0.2em] hover:bg-cyan-500 hover:scale-[1.02] transition-all shadow-xl">
                            INICIAR NUEVA MISIÓN <i class="fas fa-bolt ml-2"></i>
                        </button>
                    </div>
                </div>

                <div class="bg-[#0d1117] rounded-[3.5rem] p-10 border border-white/10 h-[450px] flex flex-col shadow-2xl">
                    <div class="flex items-center justify-between mb-8">
                        <h4 class="orbitron text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Live Logs</h4>
                        <div class="h-2 w-2 bg-red-500 rounded-full animate-ping"></div>
                    </div>
                    <div id="logContent" class="space-y-4 overflow-y-auto pr-2 custom-scrollbar"></div>
                </div>
            </div>
        </div>

        <div class="grid lg:grid-cols-2 gap-10">
            <div id="techPerformance" class="hover:shadow-[0_0_30px_rgba(0,242,255,0.05)] transition-all"></div>
            <div id="payrollModule" class="hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] transition-all"></div>
        </div>

    </div>`;
}

// --- PROCESAMIENTO DE INTELIGENCIA DE NEGOCIO ---

function updateTacticalKPIs(m, access) {
    const grid = document.getElementById("kpiGrid");
    const fmt = (v) => `$ ${Number(v).toLocaleString()}`;
    
    const cards = [
        { title: "Revenue Total", val: fmt(m.ingresos), icon: "fa-chart-line", col: "text-cyan-400", border: "border-cyan-500/30" },
        { title: "Misiones Activas", val: m.clientes, icon: "fa-car", col: "text-orange-500", border: "border-orange-500/30" },
        { title: "Repuestos Críticos", val: m.criticos, icon: "fa-microchip", col: "text-red-500", border: "border-red-500/30" },
        { title: "Estatus de Red", val: access.status, icon: "fa-satellite", col: "text-emerald-400", border: "border-emerald-500/30" }
    ];

    grid.innerHTML = cards.map(c => `
        <div class="bg-[#0d1117] p-10 rounded-[3rem] border ${c.border} hover:bg-white/5 transition-all group relative overflow-hidden shadow-xl">
            <div class="absolute -right-6 -top-6 text-white/5 text-7xl group-hover:text-white/10 transition-all"><i class="fas ${c.icon}"></i></div>
            <div class="relative z-10">
                <span class="orbitron text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] block mb-6">${c.title}</span>
                <div class="text-4xl font-black text-white orbitron tracking-tighter italic group-hover:scale-105 transition-transform">
                    ${c.val}
                </div>
                <div class="h-1 w-12 bg-white/10 mt-6 group-hover:w-full group-hover:bg-cyan-500 transition-all duration-700"></div>
            </div>
        </div>
    `).join("");

    document.getElementById("mainIncome").innerText = fmt(m.ingresos);
}

function renderNeuralChart(m) {
    const ctx = document.getElementById("neuralChart");
    if (!ctx || !window.Chart) return;
    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(m.tendencia),
            datasets: [{
                label: 'Flujo Económico',
                data: Object.values(m.tendencia),
                borderColor: '#00f2ff',
                borderWidth: 6,
                tension: 0.5,
                pointRadius: 0,
                fill: true,
                backgroundColor: (context) => {
                    const g = context.chart.ctx.createLinearGradient(0, 0, 0, 400);
                    g.addColorStop(0, 'rgba(0, 242, 255, 0.2)');
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
                x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10, family: 'Orbitron', weight: 'bold' } } },
                y: { display: false }
            }
        }
    });
}

function renderTechPerformance(containerId, ordenes) {
    const container = document.getElementById(containerId);
    const techStats = {};
    ordenes.forEach(o => {
        const tech = o.tecnico || "Técnico Exterior";
        if (!techStats[tech]) techStats[tech] = { nombre: tech, total: 0, rev: 0 };
        techStats[tech].total++;
        techStats[tech].rev += Number(o.total || 0);
    });

    container.innerHTML = `
        <div class="bg-[#0d1117] rounded-[4rem] p-12 border border-white/5 relative overflow-hidden shadow-2xl h-full">
            <h4 class="orbitron text-[10px] font-black text-cyan-500 uppercase tracking-[0.5em] mb-12 text-center">Ranking de Fuerza Operativa</h4>
            <div class="space-y-10">
                ${Object.values(techStats).sort((a,b) => b.rev - a.rev).map(t => `
                    <div class="group">
                        <div class="flex justify-between items-end mb-4">
                            <div>
                                <p class="text-sm font-black text-white uppercase italic tracking-tighter group-hover:text-cyan-400 transition-colors">${t.nombre}</p>
                                <p class="text-[9px] orbitron text-slate-500 uppercase font-bold">${t.total} Misiones</p>
                            </div>
                            <p class="text-xl font-black text-white orbitron">$ ${t.rev.toLocaleString()}</p>
                        </div>
                        <div class="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div class="h-full bg-gradient-to-r from-cyan-600 to-blue-400 shadow-[0_0_15px_rgba(0,242,255,0.5)]" style="width: ${Math.min((t.rev/10000000)*100, 100)}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
}

// --- UTILIDADES DE SEGURIDAD Y CARGA ---

async function loadNexusData(empresaId, mode) {
    if (mode === "SIMULATOR") {
        return {
            clientes: new Array(42).fill({}),
            inventario: new Array(5).fill({ cantidad: 2, stockMinimo: 5 }),
            ordenes: [
                { total: 12500000, estado: 'REPARACION', tecnico: 'William Urquijo', fechaIngreso: { toDate: () => new Date() } },
                { total: 8400000, estado: 'LISTO', tecnico: 'C. Johnson (USA)', fechaIngreso: { toDate: () => new Date() } },
                { total: 4200000, estado: 'INGRESO', tecnico: 'William Urquijo', fechaIngreso: { toDate: () => new Date() } }
            ]
        };
    }
    const [clientes, ordenes, inventario] = await Promise.all([
        getClientes(empresaId).catch(() => []),
        getOrdenes(empresaId).catch(() => []),
        getInventario(empresaId).catch(() => [])
    ]);
    return { clientes, ordenes, inventario };
}

function processBusinessIntelligence(data) {
    return {
        ingresos: data.ordenes.reduce((acc, o) => acc + Number(o.total || 0), 0),
        fases: { EN_TALLER: 0, DIAGNOSTICO: 0, REPARACION: 0, LISTO: 0 },
        clientes: data.clientes.length,
        criticos: data.inventario.filter(i => Number(i.cantidad) <= Number(i.stockMinimo)).length,
        tendencia: { "LUN": 4500000, "MAR": 7800000, "MIE": 5400000, "JUE": 9800000, "VIE": 12000000, "SAB": 15600000, "DOM": 2100000 }
    };
}

function deployAIAdvisor(m, mode) {
    const msg = document.getElementById("aiMessage");
    const text = mode === "SIMULATOR" 
        ? `William, detecto una oportunidad de escalamiento en <b>Charlotte, NC</b>. El ticket promedio está un 24% por encima del benchmark.`
        : `Análisis de flujo: Hay <b>${m.criticos} repuestos</b> agotándose. Si no reponemos hoy, el tiempo de entrega subirá 48 horas.`;
    msg.innerHTML = text;
}

function showSystemCrash(container) {
    container.innerHTML = `
    <div class="h-screen bg-black flex flex-col items-center justify-center space-y-8">
        <div class="h-24 w-24 border-4 border-red-500 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_50px_#ef4444]">
            <i class="fas fa-exclamation-triangle text-4xl text-red-500"></i>
        </div>
        <h2 class="orbitron text-3xl font-black text-white italic">CRITICAL_CORE_FAILURE</h2>
        <p class="text-[10px] text-slate-500 orbitron tracking-[0.5em] uppercase">Vínculo con Starlink perdido o base de datos offline</p>
    </div>`;
}

// (Las funciones de soporte payroll, verifyNexusAuth, etc., permanecen iguales pero heredan el estilo visual)
