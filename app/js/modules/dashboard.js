/**
 * dashboard.js - TallerPRO360 NEXUS-X AEGIS V17.0 🛰️
 * NÚCLEO DE INTELIGENCIA PREDICTIVA Y CONTROL DE MISIÓN GLOBAL
 * Optimización para Despliegue Starlink SaaS - Colombia/USA
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { getClientes, getOrdenes, getInventario, getEmpresaData } from "../services/dataService.js";
import { store } from "../core/store.js";
import { hablar } from "../voice/voiceCore.js";

let mainChart = null;
const NEXUS_VERSION = "V17.0 AEGIS";

export default async function dashboard(container, state) {
    console.log(`%c 🛰️ NEXUS-X: Iniciando Secuencia ${NEXUS_VERSION}...`, "color: #00f2ff; font-weight: bold; font-size: 12px;");
    
    // 1. EXTRACCIÓN DE IDENTIDAD TÁCTICA
    const uid = localStorage.getItem("nexus_uid");
    const empresaId = localStorage.getItem("nexus_empresaId");
    const planTipo = localStorage.getItem("nexus_plan") || "freemium";
    const nexusMode = localStorage.getItem("nexus_mode"); // SIMULATOR o LIVE

    // 2. VERIFICACIÓN DE PERÍMETRO (LICENCIA)
    const access = await verifyNexusAuth(empresaId, planTipo);
    
    // 3. DESPLIEGUE DE INTERFAZ HOLOGRÁFICA
    renderAegisInterface(container, access, nexusMode);

    try {
        // 4. CARGA INTELIGENTE (DATOS REALES VS SIMULADOS)
        const data = await loadNexusData(empresaId, nexusMode);
        const metrics = processBusinessIntelligence(data);

        // 5. MATERIALIZACIÓN DE MÓDULOS
        updateTacticalKPIs(metrics, access);
        renderNeuralChart(metrics);
        updatePhaseMatrix(metrics); 
        deployAIAdvisor(metrics, nexusMode);
        
        // 6. BLOQUEOS DE SEGURIDAD (Si el plan venció)
        if (access.status === "LOCKED") applyHardLock();

    } catch (err) {
        console.error("🚨 CRITICAL CORE FAILURE:", err);
        showSystemCrash(container);
    }
}

// --- NÚCLEO DE AUTENTICACIÓN ---

async function verifyNexusAuth(empId, plan) {
    const rol = localStorage.getItem("nexus_rol");
    if (rol === "superadmin") return { status: "ACTIVE", plan: "elite", godMode: true };

    try {
        const docSnap = await getEmpresaData(empId);
        if (!docSnap.exists()) return { status: "ACTIVE", plan: "freemium" };

        const data = docSnap.data();
        const venceEn = data.venceEn?.toDate ? data.venceEn.toDate() : new Date();
        const isExpired = new Date() > venceEn && plan !== "freemium";

        return { 
            status: isExpired ? "LOCKED" : "ACTIVE", 
            plan: data.planTipo || plan,
            vence: venceEn.toLocaleDateString()
        };
    } catch (e) {
        return { status: "ACTIVE", plan: "freemium" };
    }
}

// --- MOTOR DE RENDERIZADO AEGIS ---

function renderAegisInterface(container, access, mode) {
    const isSim = mode === "SIMULATOR";
    
    container.innerHTML = `
    <div class="p-4 lg:p-10 space-y-8 animate-in fade-in zoom-in duration-700 pb-24">
        
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
                <div class="flex items-center gap-3 mb-2">
                    <span class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[8px] font-black orbitron rounded-full animate-pulse">
                        ${isSim ? 'SISTEMA DE SIMULACIÓN' : 'SATELLITE LINK ACTIVE'}
                    </span>
                    <span class="text-slate-500 text-[8px] orbitron tracking-widest">${NEXUS_VERSION}</span>
                </div>
                <h1 class="text-5xl font-black text-white orbitron tracking-tighter">NEXUS <span class="text-cyan-400">X</span></h1>
            </div>
            
            <div class="flex items-center gap-4 bg-slate-900/50 p-3 rounded-3xl border border-white/5 backdrop-blur-xl">
                <div class="text-right px-4">
                    <p class="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Plan Actual</p>
                    <p class="text-xs font-black text-white orbitron">${access.plan.toUpperCase()}</p>
                </div>
                <button onclick="location.hash='#pagos'" class="p-4 bg-cyan-500 rounded-2xl text-black hover:scale-105 transition-all">
                    <i class="fas fa-bolt"></i>
                </button>
            </div>
        </div>

        <div id="kpiGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>

        <div class="grid lg:grid-cols-12 gap-8">
            <div class="lg:col-span-8 space-y-8">
                <div class="bg-slate-900/40 rounded-[3rem] p-8 lg:p-12 border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div class="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all">
                        <i class="fas fa-microchip text-8xl text-cyan-400"></i>
                    </div>
                    <div class="flex justify-between items-end mb-10">
                        <div>
                            <h3 class="orbitron text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mb-2">Ingresos Proyectados</h3>
                            <div class="text-5xl font-black text-white orbitron tabular-nums" id="mainIncome">$0</div>
                        </div>
                        <div class="hidden md:block text-right">
                            <p class="text-[9px] text-cyan-500 font-bold orbitron">EFICIENCIA OPERATIVA</p>
                            <p class="text-2xl font-black text-white italic">98.4%</p>
                        </div>
                    </div>
                    <div class="h-80 w-full"><canvas id="neuralChart"></canvas></div>
                </div>

                <div id="phaseMatrix" class="grid grid-cols-2 md:grid-cols-4 gap-4"></div>
            </div>

            <div class="lg:col-span-4 space-y-6">
                <div id="aiAdvisor" class="bg-gradient-to-b from-slate-900 to-black rounded-[3rem] p-8 border border-cyan-500/20 shadow-2xl h-full relative overflow-hidden">
                    <div class="relative z-10 space-y-8">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/40">
                                <i class="fas fa-brain text-cyan-400"></i>
                            </div>
                            <h4 class="orbitron text-xs font-black text-white tracking-widest">NEXUS AI ADVISOR</h4>
                        </div>
                        
                        <div id="aiMessage" class="text-sm text-slate-300 leading-relaxed italic border-l-2 border-cyan-500 pl-4 py-2 bg-cyan-500/5">
                            Iniciando análisis de entorno...
                        </div>

                        <div class="space-y-3">
                            <p class="text-[9px] text-slate-500 font-black orbitron uppercase">Acciones Recomendadas</p>
                            <button onclick="location.hash='#ordenes'" class="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white hover:bg-cyan-500 hover:text-black transition-all uppercase tracking-widest">Añadir Misión <i class="fas fa-plus ml-2"></i></button>
                            <button class="w-full py-4 bg-transparent border border-white/5 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest">Generar Reporte PDF</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

// --- LÓGICA DE DATOS ---

async function loadNexusData(empresaId, mode) {
    if (mode === "SIMULATOR") {
        return {
            clientes: new Array(15).fill({}),
            inventario: [{ cantidad: 2, stockMinimo: 5 }, { cantidad: 1, stockMinimo: 10 }],
            ordenes: [
                { total: 1200000, estado: 'REPARACION', fechaIngreso: { toDate: () => new Date() } },
                { total: 850000, estado: 'LISTO', fechaIngreso: { toDate: () => new Date() } },
                { total: 2400000, estado: 'DIAGNOSTICO', fechaIngreso: { toDate: () => new Date() } }
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
    const stats = {
        ingresos: 0,
        fases: { EN_TALLER: 0, DIAGNOSTICO: 0, REPARACION: 0, LISTO: 0 },
        clientes: data.clientes.length,
        criticos: data.inventario.filter(i => Number(i.cantidad) <= Number(i.stockMinimo)).length,
        tendencia: {}
    };

    data.ordenes.forEach(o => {
        const val = Number(o.total || 0);
        stats.ingresos += val;
        if (stats.fases[o.estado] !== undefined) stats.fases[o.estado]++;
        
        const fecha = o.fechaIngreso?.toDate ? o.fechaIngreso.toDate().toLocaleDateString('es-CO', {day:'2-digit', month:'short'}) : 'Hoy';
        stats.tendencia[fecha] = (stats.tendencia[fecha] || 0) + val;
    });

    return stats;
}

// --- ACTUALIZACIÓN DE UI ---

function updateTacticalKPIs(m, access) {
    const grid = document.getElementById("kpiGrid");
    const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
    
    const cards = [
        { title: "Revenue Global", val: fmt(m.ingresos), icon: "fa-rocket", col: "text-emerald-400" },
        { title: "Nivel de Flota", val: m.clientes, icon: "fa-users", col: "text-blue-400" },
        { title: "Alertas Stock", val: m.criticos, icon: "fa-exclamation-triangle", col: m.criticos > 0 ? "text-red-500" : "text-slate-500" },
        { title: "Status Core", val: access.status, icon: "fa-shield-alt", col: "text-cyan-400" }
    ];

    grid.innerHTML = cards.map(c => `
        <div class="bg-slate-900/30 p-8 rounded-[2.5rem] border border-white/5 hover:border-cyan-500/30 transition-all">
            <div class="flex justify-between items-start mb-4">
                <span class="orbitron text-[8px] text-slate-500 font-black uppercase tracking-widest">${c.title}</span>
                <i class="fas ${c.icon} ${c.col} text-xs"></i>
            </div>
            <div class="text-2xl font-black text-white orbitron">${c.val}</div>
        </div>
    `).join("");

    document.getElementById("mainIncome").innerText = fmt(m.ingresos);
}

function renderNeuralChart(m) {
    const ctx = document.getElementById("neuralChart");
    if (!ctx || !window.Chart) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(m.tendencia),
            datasets: [{
                data: Object.values(m.tendencia),
                borderColor: '#00f2ff',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                fill: true,
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;
                    if (!chartArea) return null;
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, 'rgba(0, 242, 255, 0)');
                    gradient.addColorStop(1, 'rgba(0, 242, 255, 0.1)');
                    return gradient;
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 8, family: 'Orbitron' } } },
                y: { display: false }
            }
        }
    });
}

function updatePhaseMatrix(m) {
    const matrix = document.getElementById("phaseMatrix");
    const fases = [
        { key: 'EN_TALLER', label: 'Ingresos', icon: 'fa-sign-in-alt' },
        { key: 'DIAGNOSTICO', label: 'Análisis', icon: 'fa-microscope' },
        { key: 'REPARACION', label: 'Ejecución', icon: 'fa-cogs' },
        { key: 'LISTO', label: 'Finalizado', icon: 'fa-check-double' }
    ];

    matrix.innerHTML = fases.map(f => `
        <div class="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 text-center">
            <i class="fas ${f.icon} mb-3 text-xs ${m.fases[f.key] > 0 ? 'text-cyan-400' : 'text-slate-700'}"></i>
            <p class="orbitron text-[7px] text-slate-500 uppercase mb-1">${f.label}</p>
            <p class="text-xl font-black text-white orbitron">${m.fases[f.key] || 0}</p>
        </div>
    `).join("");
}

function deployAIAdvisor(m, mode) {
    const msg = document.getElementById("aiMessage");
    const isSim = mode === "SIMULATOR";
    
    let text = isSim 
        ? `Comandante, está operando en <b>Modo Simulación</b>. Los datos mostrados son proyecciones de lo que Nexus-X puede lograr por su taller.`
        : `Análisis completo: Detecto <b>${m.fases.REPARACION} unidades</b> en proceso técnico. El inventario muestra <b>${m.criticos} faltantes</b> críticos.`;
    
    msg.innerHTML = text;
    if (!isSim) hablar(`Comandante, reporte actualizado. Ingresos totales por ${m.ingresos} pesos.`);
}

function applyHardLock() {
    const lock = document.createElement('div');
    lock.className = "fixed inset-0 z-[1000] backdrop-blur-md bg-black/80 flex items-center justify-center p-6";
    lock.innerHTML = `
        <div class="max-w-md w-full bg-slate-900 border border-red-500/30 p-10 rounded-[3rem] text-center space-y-6">
            <i class="fas fa-radiation text-6xl text-red-500 animate-pulse"></i>
            <h2 class="orbitron text-2xl font-black text-white uppercase">Núcleo Bloqueado</h2>
            <p class="text-xs text-slate-400 leading-relaxed">Su licencia ha expirado. El sistema Aegis ha entrado en modo de suspensión para proteger la integridad de los datos.</p>
            <button onclick="location.hash='#pagos'" class="w-full py-5 bg-red-600 rounded-2xl text-white orbitron font-black text-[10px] tracking-widest">REESTABLECER CONEXIÓN</button>
        </div>`;
    document.body.appendChild(lock);
}

function showSystemCrash(container) {
    container.innerHTML = `<div class="h-screen flex items-center justify-center text-red-500 orbitron">ERROR CRÍTICO EN NÚCLEO</div>`;
}
