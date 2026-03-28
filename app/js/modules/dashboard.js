/**
 * dashboard.js - TallerPRO360 NEXUS-CORE V16.2 🛰️
 * SISTEMA DE INTELIGENCIA DE NEGOCIO Y CONTROL DE MISIÓN "AEGIS"
 * Visión 2030: Autogestión, Blindaje Proactivo y Notificación Galáctica
 */
import { getClientes, getOrdenes, getInventario, getEmpresaData } from "../services/dataService.js";
import { store } from "../core/store.js";
import { hablar } from "../voice/voiceCore.js";

let mainChart = null;

/**
 * MOTOR PRINCIPAL DE RENDERIZADO
 */
export default async function dashboard(container, state) {
    // Verificación de credenciales en LocalStorage (Hotfix V16.2)
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    const planTier = localStorage.getItem("planTier") || "freemium";
    const sessionStatus = localStorage.getItem("status") || "INACTIVO";

    // 1. EL GUARDIÁN NEXUS (Validación de Acceso de Triple Capa)
    // Primero revisamos el LocalStorage para velocidad, luego validamos con el Servidor
    const access = await verifyNexusLicense(empresaId, planTier, sessionStatus);
    
    if (access.status === "LOCKED") {
        renderLockState(container, access);
        return;
    }

    // 2. Renderizado de la Estructura de Comando (Interfaz Tesla-Style)
    renderStructure(container, access.plan);

    try {
        // 3. HUD de Notificaciones Galácticas (Alertas de Gracia)
        if (access.daysRemaining <= 8 && access.status === "ACTIVE" && access.plan !== "freemium") {
            showGracePeriodAlert(access.daysRemaining);
        }

        // 4. Carga Inteligente de Datos (Nexus-Data Stream)
        const data = await loadDataSmart(empresaId);
        
        // 5. Procesamiento Nexus-BI (Business Intelligence)
        const metrics = processBusinessIntelligence(data);

        // 6. Despliegue de Módulos con Animación en Cascada
        updateKPIs(metrics, access.plan);
        renderAdvancedChart(metrics, access.plan);
        updatePhaseMonitor(metrics); 
        updateSmartPanel(metrics, access);
        initNexusPredictor(metrics, access);

        // 7. Aplicar restricciones de Plan (Control de Capacidad)
        applyPlanThrottling(access.plan);

    } catch (err) {
        console.error("🚨 Critical Core Failure:", err);
        showErrorState(container);
    }
}

/**
 * --- HOTFIX V16.2: PROTOCOL RESTORE & BYPASS ---
 * Esta función asegura que el Dashboard no se bloquee si los datos de LocalStorage son válidos
 */
function verificarAccesoSistema() {
    const currentPlan = localStorage.getItem("planTier");
    const systemStatus = localStorage.getItem("status");
    const lockOverlay = document.getElementById("lockOverlay");
    const mainContent = document.getElementById("mainContent");
    const errorText = document.getElementById("errorText");

    // Lógica de Desbloqueo Maestro
    if (systemStatus === "ACTIVO" || currentPlan === "freemium" || currentPlan === "elite") {
        console.log("🔓 DASHBOARD: PROTOCOLO DE ACCESO CONCEDIDO");
        if (lockOverlay) lockOverlay.classList.add("hidden");
        if (mainContent) mainContent.classList.remove("hidden");
        
        if (currentPlan === "freemium") {
            console.warn("⚠️ MODO FREEMIUM ACTIVO: Limitando Inyectores.");
        }
    } else {
        console.error("🛑 DASHBOARD: LINK PROTOCOL BROKEN");
        if (lockOverlay) lockOverlay.classList.remove("hidden");
        if (errorText) errorText.innerText = "LINK PROTOCOL BROKEN: " + (currentPlan ? currentPlan.toUpperCase() : "OFFLINE");
    }
}

// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", verificarAccesoSistema);

/**
 * VERIFICACIÓN DE LICENCIA TALLA NASA
 */
async function verifyNexusLicense(empresaId, planTier, sessionStatus) {
    try {
        // Bypass para SuperAdmin (William)
        if (localStorage.getItem("rolGlobal") === "superadmin") {
            return { status: "ACTIVE", daysRemaining: 9999, plan: "elite" };
        }

        const doc = await getEmpresaData(empresaId);
        if (!doc.exists()) {
            // Si no existe doc pero es freemium/test, permitimos el paso
            if (planTier === "freemium" || planTier === "basico") {
                return { status: "ACTIVE", daysRemaining: 365, plan: planTier };
            }
            return { status: "LOCKED", daysRemaining: 0, plan: "unknown" };
        }

        const data = doc.data();
        const now = new Date();
        const venceEn = data.venceEn?.toDate() || new Date();
        const diffTime = venceEn - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffTime <= 0 && data.planId !== "freemium") {
            return { status: "LOCKED", daysRemaining: 0, plan: data.planId };
        }

        return { status: "ACTIVE", daysRemaining: diffDays, plan: data.planId };
    } catch (e) {
        // Fallback de seguridad en caso de error de red
        return { status: "ACTIVE", daysRemaining: 1, plan: planTier };
    }
}

/**
 * BLOQUEO ELEGANTE (VISION 2030)
 */
function renderLockState(container, access) {
    container.innerHTML = `
    <div class="h-screen w-full flex items-center justify-center bg-[#020617] relative overflow-hidden p-6">
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div class="max-w-2xl w-full glass-card p-12 rounded-[4rem] border border-red-500/30 text-center relative z-10 backdrop-blur-3xl">
            <div class="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/40">
                <i class="fas fa-satellite-dish text-4xl text-red-500 animate-pulse"></i>
            </div>
            <h1 class="orbitron text-3xl font-black text-white italic uppercase mb-4">Sincronización <span class="text-red-500">Suspendida</span></h1>
            <p class="text-slate-400 font-light text-lg mb-10 leading-relaxed">
                Comandante, la licencia del plan <b class="text-white">${access.plan.toUpperCase()}</b> ha expirado. 
                Renueve el combustible digital para reactivar el motor <span class="text-cyan-400 italic">Nexus-Core</span>.
            </p>
            <button onclick="location.hash='#pagos'" class="w-full py-6 bg-red-500 hover:bg-red-600 text-black orbitron font-black text-xs rounded-[2rem] uppercase transition-all shadow-xl shadow-red-500/20">
                Reactivar Misión Ahora <i class="fas fa-bolt ml-2"></i>
            </button>
        </div>
    </div>`;
}

/**
 * RENDER ESTRUCTURA BASE
 */
function renderStructure(container, plan) {
    const isElite = plan === 'elite';
    container.innerHTML = `
    <div class="p-6 lg:p-12 space-y-10 animate-in fade-in zoom-in-95 duration-700 pb-32">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div class="relative">
                <h1 class="orbitron text-4xl font-black text-white italic tracking-tighter uppercase">NEXUS <span class="text-cyan-400">DASHBOARD</span></h1>
                <p class="text-[9px] text-cyan-500 font-black uppercase tracking-[0.6em] mt-3 flex items-center gap-2 italic">
                    <span class="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></span> MODO: ${plan.toUpperCase()} · LIVE STREAM
                </p>
            </div>
            <div class="flex bg-black/40 p-1.5 rounded-[2rem] border border-white/10 backdrop-blur-2xl shadow-2xl">
                <button class="px-8 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">Reportes</button>
                <button class="px-8 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-lg shadow-cyan-500/20 orbitron">Tiempo Real</button>
            </div>
        </div>

        <div id="kpiGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"></div>

        <div class="grid lg:grid-cols-12 gap-10">
            <div class="lg:col-span-8 space-y-8">
                <div class="bg-black/40 rounded-[4rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden backdrop-blur-3xl group">
                    <div class="flex justify-between items-center mb-10 relative z-10">
                        <div>
                            <h3 class="orbitron text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Flujo Operativo</h3>
                            <div class="flex items-baseline gap-4 mt-2">
                                <span class="text-4xl font-black text-white orbitron tracking-tighter" id="totalDisplay">$0</span>
                            </div>
                        </div>
                    </div>
                    <div class="h-80 relative z-10"><canvas id="mainChart"></canvas></div>
                </div>
                <div id="phaseMonitor" class="grid grid-cols-4 gap-4"></div>
            </div>

            <div class="lg:col-span-4 space-y-8">
                <div id="smartPanel" class="bg-gradient-to-br from-slate-900 via-black to-black rounded-[4rem] p-10 border border-cyan-500/20 h-full flex flex-col justify-between shadow-2xl relative overflow-hidden">
                    <div class="relative z-10 space-y-8">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3">
                                <div class="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(6,182,212,1)]"></div>
                                <span class="orbitron text-[10px] font-black text-white uppercase tracking-widest">Nexus IA Core</span>
                            </div>
                        </div>
                        <div id="aiIntelligenceArea" class="space-y-6"></div>
                    </div>
                    <div class="relative z-10 pt-10 mt-10 border-t border-white/10">
                        <div class="grid grid-cols-1 gap-4">
                            <button onclick="location.hash='#ordenes'" class="bg-white/5 hover:bg-cyan-500 p-5 rounded-[2rem] text-[10px] font-black uppercase text-white hover:text-black transition-all border border-white/5 flex justify-between">Abrir Orden <i class="fas fa-plus-circle"></i></button>
                            <button onclick="location.hash='#pagos'" class="${isElite ? 'bg-cyan-500' : 'bg-slate-800 opacity-50'} p-5 rounded-[2rem] text-[10px] font-black uppercase text-black transition-all flex justify-between">Integración Pagos ${isElite ? '' : '🔒'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="nexusCoachTrigger" class="fixed bottom-12 right-12 cursor-pointer group z-[100]">
            <div class="relative w-24 h-24 bg-black rounded-full border-2 border-white/20 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                <div class="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin"></div>
                <i class="fas fa-fingerprint text-cyan-400 text-3xl"></i>
            </div>
        </div>
    </div>`;
}

/**
 * CÓMPUTO DE BUSINESS INTELLIGENCE
 */
function processBusinessIntelligence(data) {
    const { ordenes, inventario } = data;
    const stats = {
        ingresos: 0, 
        fases: { EN_TALLER: 0, DIAGNOSTICO: 0, REPARACION: 0, LISTO: 0 },
        totalClientes: data.clientes.length,
        tendencia: {}, stockCritico: []
    };

    ordenes.forEach(o => {
        const t = Number(o.total || 0);
        stats.ingresos += t;
        const fase = o.estado || 'EN_TALLER';
        if(stats.fases[fase] !== undefined) stats.fases[fase]++;
        const fecha = o.fechaIngreso?.toDate ? o.fechaIngreso.toDate().toLocaleDateString('es-CO', {day:'2-digit', month:'short'}) : 'Hoy';
        stats.tendencia[fecha] = (stats.tendencia[fecha] || 0) + t;
    });

    stats.stockCritico = inventario.filter(i => Number(i.cantidad) <= Number(i.stockMinimo || 5));
    return stats;
}

/**
 * ACTUALIZAR KPIs CON EFECTOS
 */
function updateKPIs(m, plan) {
    const grid = document.getElementById("kpiGrid");
    const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

    const cards = [
        { label: "Ventas Totales", val: fmt(m.ingresos), icon: "fa-chart-line", color: "from-emerald-400 to-teal-500" },
        { label: "Misión: Clientes", val: m.totalClientes, icon: "fa-users-viewfinder", color: "from-purple-500 to-pink-500" },
        { label: "Estado del Plan", val: plan.toUpperCase(), icon: "fa-crown", color: "from-amber-400 to-orange-500" },
        { label: "Insumos Críticos", val: m.stockCritico.length, icon: "fa-box-open", color: "from-red-400 to-red-600" }
    ];

    grid.innerHTML = cards.map(c => `
        <div class="bg-black/40 backdrop-blur-2xl p-8 rounded-[3.5rem] border border-white/5 hover:border-cyan-500/30 transition-all group overflow-hidden shadow-xl">
            <p class="orbitron text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4 italic">${c.label}</p>
            <h2 class="bg-gradient-to-r ${c.color} bg-clip-text text-transparent text-2xl font-black orbitron tracking-tighter">${c.val}</h2>
            <div class="mt-6 flex items-center gap-2">
                <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r ${c.color} w-3/4 animate-pulse"></div>
                </div>
            </div>
        </div>`).join("");
    
    document.getElementById("totalDisplay").innerText = fmt(m.ingresos);
}

/**
 * LIMITACIÓN DE CAPACIDAD POR PLAN (Control de Trampa)
 */
function applyPlanThrottling(plan) {
    if (plan === "freemium") {
        // Bloquear ciertos botones de navegación Pro
        const proElements = document.querySelectorAll(".pro-only");
        proElements.forEach(el => {
            el.classList.add("opacity-20", "pointer-events-none");
            el.setAttribute("title", "Upgrade to PRO required");
        });
    }
}

/**
 * RENDERIZADO DE GRÁFICA AVANZADA
 */
function renderAdvancedChart(m, plan) {
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
                borderColor: '#00f2ff',
                borderWidth: 4,
                pointRadius: 0,
                tension: 0.4,
                fill: true,
                backgroundColor: (context) => {
                    const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(0, 242, 255, 0.2)');
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
                    grid: { display: false },
                    ticks: { color: '#475569', font: { size: 8, family: 'Orbitron' } }
                }
            }
        }
    });
}

/**
 * HUD DE ALERTAS SUPERIORES
 */
function showGracePeriodAlert(days) {
    const alert = document.createElement('div');
    alert.className = "fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-xl animate-in slide-in-from-top-10 duration-500";
    alert.innerHTML = `
        <div class="bg-amber-500/10 border border-amber-500/30 backdrop-blur-xl p-4 rounded-[2rem] flex items-center justify-between shadow-2xl">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                    <i class="fas fa-clock text-amber-500 animate-spin-slow"></i>
                </div>
                <div>
                    <p class="orbitron text-[9px] font-black text-amber-500 uppercase">Aviso de Mantenimiento</p>
                    <p class="text-[11px] text-white font-bold uppercase tracking-tighter">Renovación en <span class="text-amber-400">${days} días</span></p>
                </div>
            </div>
            <button onclick="location.hash='#pagos'" class="px-6 py-2 bg-amber-500 text-black text-[9px] font-black orbitron rounded-full uppercase">Renovar</button>
        </div>`;
    document.body.appendChild(alert);
}

/**
 * INTELIGENCIA PREDICTIVA SMART PANEL
 */
function updateSmartPanel(m, access) {
    const area = document.getElementById("aiIntelligenceArea");
    const stockMsg = m.stockCritico.length > 0 
        ? `<div class="text-red-400 flex items-center gap-2"><i class="fas fa-exclamation-circle"></i> ${m.stockCritico.length} CRITICAL STOCK</div>`
        : `<div class="text-emerald-500 flex items-center gap-2"><i class="fas fa-check-circle"></i> SUPPLY CHAIN OK</div>`;

    area.innerHTML = `
        <div class="space-y-6">
            <div class="p-6 rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all">
                <p class="orbitron text-[8px] text-cyan-500 font-black uppercase mb-3 tracking-widest italic">Análisis Predictivo</p>
                <div class="text-[12px] leading-relaxed text-slate-200 italic font-medium">
                    "Comandante, el taller opera al nivel ${access.plan.toUpperCase()}. Tiene ${m.totalClientes} misiones vinculadas. Rendimiento Óptimo."
                </div>
            </div>
            <div class="p-6 rounded-[2.5rem] bg-black/50 border border-white/5 font-black uppercase text-[10px]">
                ${stockMsg}
            </div>
        </div>`;
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
        <div class="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center text-center transition-all hover:bg-white/10">
            <i class="fas ${f.icon} text-[10px] mb-2 ${m.fases[f.id] > 0 ? 'text-cyan-400' : 'text-slate-700'}"></i>
            <span class="orbitron text-[7px] text-slate-500 font-black uppercase mb-1">${f.label}</span>
            <span class="text-lg font-black text-white orbitron">${m.fases[f.id] || 0}</span>
        </div>`).join("");
}

async function loadDataSmart(empresaId) {
    const now = Date.now();
    const CACHE_EXPIRY = 60000;
    if (store.cache && (now - store.lastFetch < CACHE_EXPIRY)) return store.cache;

    const [clientes, ordenes, inventario] = await Promise.all([
        getClientes(empresaId).catch(() => []),
        getOrdenes(empresaId).catch(() => []),
        getInventario(empresaId).catch(() => [])
    ]);

    store.cache = { clientes, ordenes, inventario };
    store.lastFetch = now;
    return store.cache;
}

function initNexusPredictor(m, access) {
    document.getElementById("nexusCoachTrigger").onclick = () => {
        let msg = `Comandante William. Sistema en modo ${access.plan}. Reporto ${m.ingresos} pesos en flujo operativo y ${m.fases.REPARACION} unidades en reparación activa.`;
        hablar(msg);
    };
}

function showErrorState(container) {
    container.innerHTML = `
        <div class="p-40 text-center">
            <i class="fas fa-radiation text-6xl text-red-600 animate-pulse mb-8"></i>
            <h2 class="orbitron text-2xl font-black text-white uppercase">Nexus Core Offline</h2>
            <p class="text-slate-500 mt-4 text-[10px]">REINTENTANDO VINCULACIÓN SATELITAL...</p>
        </div>`;
}
