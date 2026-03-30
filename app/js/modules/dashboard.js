/**
 * dashboard.js - NEXUS-X AEGIS V31.5 🛰️
 * NÚCLEO DE INTELIGENCIA Y CONTROL DE MISIÓN (EDICIÓN RESILIENTE)
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { 
    getClientes, getOrdenes, getInventario, getEmpresaData 
} from "../services/dataService.js";

import { db } from "../core/firebase-config.js";

const COMISION_TECNICO = 0.30; 

export default async function dashboard(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const nexusMode = localStorage.getItem("nexus_mode") || "LIVE";

    // 1. Renderizado Inmediato de la Estructura (Evita pantalla vacía)
    renderAegisInterface(container, nexusMode);

    try {
        // 2. Carga de Datos con Protección Individual (Fail-Safe)
        const data = await loadNexusData(empresaId, nexusMode);
        
        // 3. Procesamiento de BI con Mapeo Dual (valor/total)
        const metrics = processBusinessIntelligence(data);

        // 4. Actualización de Módulos Dinámicos
        updateTacticalKPIs(metrics);
        if (window.Chart) renderNeuralChart(metrics);
        updatePhaseMatrix(metrics); 
        deployAIAdvisor(metrics, nexusMode);
        
        // 5. Módulos de Rendimiento Operativo
        renderTechPerformance("techPerformance", data.ordenes);
        renderPayrollModule("payrollModule", data.ordenes);
        
        console.log("🛰️ NEXUS-X: Sistema en Órbita Estable.");

    } catch (err) {
        console.error("🚨 Error Crítico en Dashboard:", err);
        // Si hay un error real de código, mostramos el crash elegante
        showSystemCrash(container);
    }
}

// --- INTERFAZ DE COMANDO ---

function renderAegisInterface(container, mode) {
    container.innerHTML = `
    <div class="p-4 lg:p-10 space-y-10 animate-in fade-in duration-700 pb-24 max-w-[1700px] mx-auto bg-[#010409] min-h-screen">
        
        <div class="flex flex-col lg:flex-row justify-between items-end gap-6 border-b border-white/5 pb-10">
            <div class="space-y-4">
                <div class="flex items-center gap-4">
                    <div class="h-3 w-3 bg-cyan-500 rounded-full animate-ping shadow-[0_0_15px_#00f2ff]"></div>
                    <span class="orbitron text-[10px] font-black text-cyan-400 tracking-[0.5em] uppercase">
                        NEXUS-X ${mode === "SIMULATOR" ? 'SIMULATION' : 'SATELLITE LINK'}
                    </span>
                </div>
                <h1 class="text-7xl font-black text-white orbitron tracking-tighter italic uppercase">
                    COMMAND_<span class="text-cyan-400" style="text-shadow: 0 0 15px #00f2ff;">CENTER</span>
                </h1>
            </div>
            
            <div class="flex items-center gap-6 bg-[#0d1117] p-6 rounded-[2.5rem] border border-cyan-500/30">
                <div class="text-right">
                    <p class="text-[8px] text-slate-500 font-black orbitron uppercase tracking-[0.3em]">Status Sistema</p>
                    <p class="text-lg font-black text-white orbitron uppercase">ACTIVE</p>
                </div>
                <div class="h-12 w-[1px] bg-white/10"></div>
                <div class="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20">
                    <i class="fas fa-shield-alt text-cyan-400"></i>
                </div>
            </div>
        </div>

        <div id="kpiGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"></div>

        <div class="grid lg:grid-cols-12 gap-10">
            <div class="lg:col-span-8 space-y-10">
                <div class="bg-[#0d1117] rounded-[4rem] p-12 border border-white/5 relative overflow-hidden shadow-2xl">
                    <div class="flex justify-between items-start mb-16">
                        <div>
                            <h3 class="orbitron text-[10px] text-cyan-500 font-black uppercase tracking-[0.6em] mb-4 text-white/60">Ingresos Totales</h3>
                            <div class="text-7xl font-black text-white orbitron tracking-tighter" id="mainIncome">$0</div>
                        </div>
                    </div>
                    <div class="h-[350px] w-full"><canvas id="neuralChart"></canvas></div>
                </div>
                <div id="phaseMatrix" class="grid grid-cols-2 md:grid-cols-4 gap-8"></div>
            </div>

            <div class="lg:col-span-4 space-y-10">
                <div id="aiAdvisor" class="bg-gradient-to-br from-[#0d1117] to-black rounded-[3.5rem] p-10 border border-cyan-500/20 shadow-2xl">
                    <div class="flex items-center gap-6 mb-8">
                        <i class="fas fa-brain text-cyan-400 text-3xl animate-pulse"></i>
                        <h4 class="orbitron text-xs font-black text-white tracking-widest uppercase">Nexus AI</h4>
                    </div>
                    <div id="aiMessage" class="text-sm text-slate-200 leading-relaxed italic border-l-2 border-cyan-500/50 pl-6 py-2 mb-8 bg-white/5 rounded-r-2xl">
                        Escaneando flujos de trabajo...
                    </div>
                    <button onclick="location.hash='#ordenes'" class="w-full py-6 bg-white text-black rounded-[2rem] orbitron text-[10px] font-black uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all">
                        INICIAR MISIÓN <i class="fas fa-bolt ml-2"></i>
                    </button>
                </div>

                <div id="techPerformance" class="bg-[#0d1117] rounded-[3.5rem] p-10 border border-white/5 min-h-[300px]"></div>
            </div>
        </div>
        
        <div id="payrollModule" class="w-full"></div>

    </div>`;
}

// --- LOGICA DE DATOS Y COMPATIBILIDAD ---

async function loadNexusData(empresaId, mode) {
    // Si no hay empresaId, intentamos recuperar del storage
    const id = empresaId || localStorage.getItem("nexus_empresaId");
    
    // Ejecutamos las peticiones pero con catch individual para que una falla no detenga todo
    const [clientes, ordenes, inventario] = await Promise.all([
        getClientes(id).catch(() => []),
        getOrdenes(id).catch(() => []),
        getInventario(id).catch(() => [])
    ]);

    return { 
        clientes: clientes || [], 
        ordenes: ordenes || [], 
        inventario: inventario || [] 
    };
}

function processBusinessIntelligence(data) {
    // 💰 COMPATIBILIDAD DUAL: Lee 'total' o 'valor' según lo que exista en Firestore
    const ingresos = data.ordenes.reduce((acc, o) => acc + Number(o.total || o.valor || 0), 0);
    
    // Tendencia simulada para la gráfica (se puede dinamizar luego)
    const tendencia = { "LUN": 4500000, "MAR": 7800000, "MIE": 5400000, "JUE": 9800000, "VIE": ingresos * 0.4, "HOY": ingresos };

    return {
        ingresos,
        clientes: data.clientes.length,
        criticos: data.inventario.filter(i => Number(i.cantidad || 0) <= Number(i.stockMinimo || 5)).length,
        tendencia
    };
}

function updateTacticalKPIs(m) {
    const grid = document.getElementById("kpiGrid");
    if (!grid) return;

    const fmt = (v) => `$ ${Number(v).toLocaleString()}`;
    const cards = [
        { title: "Revenue Global", val: fmt(m.ingresos), icon: "fa-chart-line", col: "text-cyan-400" },
        { title: "Base Clientes", val: m.clientes, icon: "fa-users", col: "text-white" },
        { title: "Alertas Stock", val: m.criticos, icon: "fa-exclamation-triangle", col: "text-red-500" },
        { title: "Sistema", val: "ONLINE", icon: "fa-satellite", col: "text-emerald-400" }
    ];

    grid.innerHTML = cards.map(c => `
        <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 hover:border-cyan-500/30 transition-all group">
            <div class="flex justify-between items-start mb-6">
                <span class="orbitron text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">${c.title}</span>
                <i class="fas ${c.icon} ${c.col} opacity-50"></i>
            </div>
            <div class="text-3xl font-black text-white orbitron tracking-tighter">${c.val}</div>
        </div>
    `).join("");

    document.getElementById("mainIncome").innerText = fmt(m.ingresos);
}

function renderTechPerformance(containerId, ordenes) {
    const container = document.getElementById(containerId);
    if(!container) return;

    const techStats = {};
    ordenes.forEach(o => {
        const tech = o.tecnico || "Staff";
        if (!techStats[tech]) techStats[tech] = { nombre: tech, total: 0, rev: 0 };
        techStats[tech].total++;
        techStats[tech].rev += Number(o.total || o.valor || 0);
    });

    container.innerHTML = `
        <h4 class="orbitron text-[9px] font-black text-cyan-500 uppercase tracking-widest mb-8">Rendimiento Técnico</h4>
        <div class="space-y-6">
            ${Object.values(techStats).sort((a,b) => b.rev - a.rev).map(t => `
                <div class="flex justify-between items-center">
                    <div>
                        <p class="text-xs font-bold text-white uppercase">${t.nombre}</p>
                        <p class="text-[9px] text-slate-500">${t.total} Misiones</p>
                    </div>
                    <p class="text-sm font-black text-white orbitron">$ ${t.rev.toLocaleString()}</p>
                </div>
            `).join('')}
        </div>`;
}

// --- GRAFICAS Y AI ---

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
                data: Object.values(m.tendencia),
                borderColor: '#00f2ff',
                borderWidth: 4,
                tension: 0.4,
                pointRadius: 0,
                fill: true,
                backgroundColor: (context) => {
                    const g = context.chart.ctx.createLinearGradient(0, 0, 0, 300);
                    g.addColorStop(0, 'rgba(0, 242, 255, 0.15)');
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
                x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 9, family: 'Orbitron' } } },
                y: { display: false }
            }
        }
    });
}

function deployAIAdvisor(m, mode) {
    const msg = document.getElementById("aiMessage");
    if(!msg) return;
    msg.innerHTML = `Nexus-X detecta <b>${m.clientes} clientes</b> activos. El flujo de ingresos actual es de $${m.ingresos.toLocaleString()}. Se recomienda revisar stock crítico.`;
}

function showSystemCrash(container) {
    container.innerHTML = `
    <div class="h-screen bg-black flex flex-col items-center justify-center space-y-6">
        <div class="h-20 w-20 border-2 border-red-500 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_30px_#ef4444]">
            <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
        </div>
        <h2 class="orbitron text-xl font-black text-white italic tracking-widest">PROTOCOL_RECOVERY_MODE</h2>
        <p class="text-[9px] text-slate-500 orbitron uppercase tracking-[0.4em]">Error de enlace: Reiniciando servicios de datos...</p>
        <button onclick="location.reload()" class="px-8 py-3 bg-white text-black orbitron text-[10px] font-black rounded-full">REINTENTAR</button>
    </div>`;
}

// Estructuras vacías para evitar errores de referencia si no se cargan los módulos
function updatePhaseMatrix() {}
function renderPayrollModule() {}
