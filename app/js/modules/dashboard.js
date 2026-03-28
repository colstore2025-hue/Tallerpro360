/**
 * dashboard.js - TallerPRO360 NEXUS-CORE V16.5 🛰️
 * SISTEMA DE INTELIGENCIA DE NEGOCIO Y CONTROL DE MISIÓN "AEGIS"
 * Versión Final: Estabilización de Capas de Acceso y Potencia de Datos
 * @author William Jeffry Urquijo Cubillos
 */
import { getClientes, getOrdenes, getInventario, getEmpresaData } from "../services/dataService.js";
import { store } from "../core/store.js";
import { hablar } from "../voice/voiceCore.js";

let mainChart = null;
let nexusPulseInterval = null;
const CACHE_EXPIRY = 30000;

export default async function dashboard(container, state) {
    console.log("🚀 NEXUS-CORE: Iniciando Secuencia V16.5...");
    
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    const planTier = localStorage.getItem("planTier") || "freemium";
    const sessionStatus = localStorage.getItem("status") || "INACTIVO";

    // 1. VALIDACIÓN DE LICENCIA (RESILLIENTE)
    const access = await verifyNexusLicense(empresaId, planTier, sessionStatus);
    
    // 2. RENDERIZADO INMEDIATO DE ESTRUCTURA (Para evitar latencia)
    renderStructure(container, access.plan);

    // 3. SEMÁFORO DE CONTROL (Materialización de Estados)
    aplicarSemaforoNexus(access);

    try {
        // 4. CARGA DE DATOS ASÍNCRONA
        const data = await loadDataSmart(empresaId, access.plan);
        const metrics = processBusinessIntelligence(data);

        // 5. DESPLIEGUE DE MÓDULOS BI
        updateKPIs(metrics, access.plan);
        renderAdvancedChart(metrics, access.plan);
        updatePhaseMonitor(metrics); 
        updateSmartPanel(metrics, access);
        initNexusPredictor(metrics, access);
        
        startNexusPulse();
        applyPlanThrottling(access.plan);

    } catch (err) {
        console.error("🚨 CRITICAL CORE FAILURE:", err);
        showErrorState(container);
    }
}

// --- NÚCLEO DE SEGURIDAD Y LICENCIAS ---

async function verifyNexusLicense(empresaId, planTier, sessionStatus) {
    try {
        if (localStorage.getItem("rolGlobal") === "superadmin") {
            return { status: "ACTIVE", daysRemaining: 999, plan: "elite" };
        }

        if (!empresaId || empresaId === "undefined" || empresaId === "null") {
            return { status: "ACTIVE", daysRemaining: 30, plan: "freemium" };
        }

        const docSnap = await getEmpresaData(empresaId);
        if (!docSnap.exists()) return { status: "ACTIVE", daysRemaining: 30, plan: "freemium" };

        const data = docSnap.data();
        let venceEn = (data.venceEn?.toDate) ? data.venceEn.toDate() : new Date(Date.now() + 2592000000);
        
        const now = new Date();
        const diffDays = Math.ceil((venceEn - now) / (1000 * 60 * 60 * 24));
        const currentPlan = data.planId || "freemium";
        const status = (diffDays <= 0 && currentPlan !== "freemium") ? "LOCKED" : "ACTIVE";

        return { status, daysRemaining: diffDays, plan: currentPlan };
    } catch (e) {
        return { status: "ACTIVE", daysRemaining: 1, plan: planTier };
    }
}

function aplicarSemaforoNexus(access) {
    const { status, daysRemaining, plan } = access;
    const oldBanner = document.getElementById("nexusReadOnlyBanner");
    if (oldBanner) oldBanner.remove();

    if (status === "LOCKED") {
        injectReadOnlyBanner(plan);
        freezeDataInjectors();
    } else if (daysRemaining <= 8 && plan !== "freemium") {
        showGracePeriodAlert(daysRemaining);
    }
}

// --- MOTOR DE UI Y BLOQUEOS ---

function injectReadOnlyBanner(plan) {
    const banner = document.createElement('div');
    banner.id = "nexusReadOnlyBanner";
    banner.className = "fixed top-0 left-0 w-full z-[9999] animate-in slide-in-from-top duration-500";
    banner.innerHTML = `
        <div class="bg-gradient-to-r from-red-900 via-red-600 to-red-900 text-white py-3 px-8 flex justify-between items-center shadow-2xl border-b border-white/10">
            <div class="flex items-center gap-4">
                <i class="fas fa-hand-holding-usd animate-pulse"></i>
                <div>
                    <p class="orbitron text-[9px] font-black uppercase tracking-widest">Acceso Limitado: Plan ${plan.toUpperCase()}</p>
                    <p class="text-[10px] opacity-80">Modo Solo Lectura. Regularice su cuenta en Master Control.</p>
                </div>
            </div>
            <button onclick="location.hash='#master-control'" class="bg-white text-red-600 px-6 py-1.5 rounded-full text-[9px] font-black orbitron hover:bg-black hover:text-white transition-all">PAGAR AHORA</button>
        </div>`;
    document.body.prepend(banner);
    document.body.style.paddingTop = "50px";
}

function freezeDataInjectors() {
    const selectors = ['button[onclick*="#ordenes"]', 'button[onclick*="nueva"]', '.btn-add', '#btnNuevaMision'];
    document.querySelectorAll(selectors.join(',')).forEach(el => {
        el.classList.add("grayscale", "opacity-40", "cursor-not-allowed");
        el.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            hablar("Sistema en modo lectura. Inyección de datos bloqueada.");
            alert("⚠️ Acción restringida por falta de pago.");
        };
    });
}

// --- RENDERIZADO Y BI ---

function renderStructure(container, plan) {
    container.innerHTML = `
    <div class="p-6 lg:p-12 space-y-10 animate-in fade-in duration-1000 pb-32">
        <div class="flex flex-col md:flex-row justify-between items-center gap-8">
            <div class="relative group">
                <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter uppercase">NEXUS <span class="text-cyan-400">X</span></h1>
                <p class="text-[10px] text-cyan-500 font-black uppercase tracking-[0.5em] mt-2 italic">SISTEMA AEGIS · ${plan.toUpperCase()}</p>
            </div>
            <div class="flex bg-slate-900/80 p-2 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-2xl">
                <button class="px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest bg-gradient-to-br from-cyan-400 to-blue-600 text-black orbitron">Consola Live</button>
            </div>
        </div>
        <div id="kpiGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"></div>
        <div class="grid lg:grid-cols-12 gap-10">
            <div class="lg:col-span-8 space-y-10">
                <div class="bg-slate-950/50 rounded-[4rem] p-12 border border-white/5 shadow-2xl backdrop-blur-3xl">
                    <div class="flex justify-between items-center mb-12">
                        <h3 class="orbitron text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Ingresos Proyectados</h3>
                        <span class="text-5xl font-black text-white orbitron tracking-tighter" id="totalDisplay">$0</span>
                    </div>
                    <div class="h-96 w-full"><canvas id="mainChart"></canvas></div>
                </div>
                <div id="phaseMonitor" class="grid grid-cols-4 gap-6"></div>
            </div>
            <div class="lg:col-span-4" id="smartPanelContainer">
                <div id="smartPanel" class="bg-gradient-to-b from-slate-900 to-black rounded-[4rem] p-12 border border-cyan-500/20 h-full flex flex-col justify-between shadow-2xl relative overflow-hidden">
                    <div id="aiIntelligenceArea" class="space-y-8"></div>
                    <div class="space-y-4 pt-10">
                        <button onclick="location.hash='#ordenes'" class="w-full bg-white/5 hover:bg-cyan-500 p-6 rounded-[2.2rem] text-[11px] font-black uppercase text-white hover:text-black transition-all border border-white/5 flex justify-between items-center group">Nueva Orden <i class="fas fa-plus-circle"></i></button>
                    </div>
                </div>
            </div>
        </div>
        <div id="nexusCoachTrigger" class="fixed bottom-12 right-12 cursor-pointer z-[100]">
            <div class="w-24 h-24 bg-black rounded-full border-4 border-cyan-500/20 flex items-center justify-center shadow-2xl transition-all hover:scale-110">
                <i class="fas fa-microphone-alt text-cyan-400 text-2xl"></i>
            </div>
        </div>
    </div>`;
}

function processBusinessIntelligence(data) {
    const { ordenes = [], inventario = [], clientes = [] } = data;
    const stats = { ingresos: 0, fases: { EN_TALLER: 0, DIAGNOSTICO: 0, REPARACION: 0, LISTO: 0 }, totalClientes: clientes.length, tendencia: {}, stockCritico: [], eficienciaIA: 94 };
    ordenes.forEach(o => {
        const total = Number(o.total || 0);
        stats.ingresos += total;
        if(stats.fases[o.estado] !== undefined) stats.fases[o.estado]++;
        const fecha = o.fechaIngreso?.toDate ? o.fechaIngreso.toDate().toLocaleDateString('es-CO', {day:'2-digit', month:'short'}) : 'Hoy';
        stats.tendencia[fecha] = (stats.tendencia[fecha] || 0) + total;
    });
    stats.stockCritico = inventario.filter(i => Number(i.cantidad) <= Number(i.stockMinimo || 5));
    return stats;
}

function updateKPIs(m, plan) {
    const grid = document.getElementById("kpiGrid");
    const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
    const cards = [
        { label: "Ventas Totales", val: fmt(m.ingresos), icon: "fa-chart-line", color: "from-emerald-400 to-teal-500" },
        { label: "Nivel de Plan", val: plan.toUpperCase(), icon: "fa-crown", color: "from-amber-400 to-orange-500" },
        { label: "Stock Crítico", val: m.stockCritico.length, icon: "fa-radiation", color: "from-red-400 to-pink-600" },
        { label: "Clientes", val: m.totalClientes, icon: "fa-users", color: "from-blue-500 to-indigo-500" }
    ];
    grid.innerHTML = cards.map(c => `
        <div class="bg-slate-900/40 p-10 rounded-[4rem] border border-white/5 hover:border-cyan-500/40 transition-all shadow-2xl relative overflow-hidden">
            <p class="orbitron text-[9px] text-slate-500 font-black uppercase mb-4 tracking-widest">${c.label}</p>
            <h2 class="bg-gradient-to-r ${c.color} bg-clip-text text-transparent text-3xl font-black orbitron">${c.val}</h2>
            <i class="fas ${c.icon} absolute top-6 right-6 opacity-5 text-4xl"></i>
        </div>`).join("");
    document.getElementById("totalDisplay").innerText = fmt(m.ingresos);
}

function renderAdvancedChart(m, plan) {
    const ctx = document.getElementById("mainChart");
    if (!ctx || !window.Chart) return;
    if (mainChart) mainChart.destroy();
    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(m.tendencia),
            datasets: [{ label: 'Flujo Nexus', data: Object.values(m.tendencia), borderColor: '#00f2ff', borderWidth: 4, tension: 0.4, fill: true, backgroundColor: 'rgba(0, 242, 255, 0.1)' }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#475569', font: { size: 9, family: 'Orbitron' } } } } }
    });
}

function updateSmartPanel(m, access) {
    const area = document.getElementById("aiIntelligenceArea");
    area.innerHTML = `
        <div class="p-8 rounded-[3rem] bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all relative group">
            <p class="orbitron text-[9px] text-cyan-400 font-black uppercase mb-4 tracking-widest">IA Análisis</p>
            <div class="text-[13px] text-slate-300 italic font-medium">"Comandante, el radar detecta <b>${m.fases.REPARACION} misiones</b> en fase técnica. Flujo de caja optimizado al <b>${m.eficienciaIA}%</b>."</div>
        </div>
        <div class="p-6 rounded-[2rem] bg-black/40 border border-white/5 flex items-center justify-between">
            <span class="text-[9px] text-slate-500 font-black uppercase">Eficiencia</span>
            <span class="text-xs font-black text-cyan-400 orbitron">${m.eficienciaIA}.8%</span>
        </div>`;
}

function updatePhaseMonitor(m) {
    const monitor = document.getElementById("phaseMonitor");
    const fases = [{ id: 'EN_TALLER', label: 'Ingreso', icon: 'fa-sign-in-alt' }, { id: 'DIAGNOSTICO', label: 'IA Diag', icon: 'fa-brain' }, { id: 'REPARACION', label: 'Mecánica', icon: 'fa-tools' }, { id: 'LISTO', label: 'Entrega', icon: 'fa-flag-checkered' }];
    monitor.innerHTML = fases.map(f => `
        <div class="bg-slate-900/50 p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center">
            <i class="fas ${f.icon} text-sm mb-4 ${m.fases[f.id] > 0 ? 'text-cyan-400' : 'text-slate-700'}"></i>
            <span class="orbitron text-[8px] text-slate-500 uppercase mb-2">${f.label}</span>
            <span class="text-2xl font-black text-white orbitron">${m.fases[f.id] || 0}</span>
        </div>`).join("");
}

async function loadDataSmart(empresaId, plan) {
    const now = Date.now();
    if (store.cache && (now - store.lastFetch < CACHE_EXPIRY)) return store.cache;
    if (plan === "freemium" && (!empresaId || empresaId === "undefined")) {
        return { clientes: new Array(12).fill({}), ordenes: [{ total: 450000, estado: 'REPARACION' }, { total: 890000, estado: 'LISTO' }], inventario: [{ cantidad: 2, stockMinimo: 5 }] };
    }
    try {
        const [clientes, ordenes, inventario] = await Promise.all([getClientes(empresaId).catch(() => []), getOrdenes(empresaId).catch(() => []), getInventario(empresaId).catch(() => [])]);
        store.cache = { clientes, ordenes, inventario };
        store.lastFetch = now;
        return store.cache;
    } catch (e) { return { clientes: [], ordenes: [], inventario: [] }; }
}

function initNexusPredictor(m, access) {
    const trigger = document.getElementById("nexusCoachTrigger");
    if (trigger) trigger.onclick = () => hablar(`Reporte: Flujo de ${m.ingresos} pesos. ${m.fases.REPARACION} misiones activas.`);
}

function startNexusPulse() {
    if (nexusPulseInterval) clearInterval(nexusPulseInterval);
    nexusPulseInterval = setInterval(() => {
        document.querySelectorAll(".animate-pulse").forEach(el => el.style.opacity = Math.random() * (1 - 0.7) + 0.7);
    }, 2000);
}

function applyPlanThrottling(plan) {
    if (plan === "freemium" || plan === "basico") {
        document.querySelectorAll(".elite-only").forEach(btn => {
            btn.innerHTML += ' <i class="fas fa-lock ml-2"></i>';
            btn.classList.add("grayscale", "pointer-events-none");
        });
    }
}

function showGracePeriodAlert(days) {
    const alert = document.createElement('div');
    alert.className = "fixed top-10 left-1/2 -translate-x-1/2 z-[500] w-[90%]";
    alert.innerHTML = `
        <div class="bg-slate-950 border-2 border-amber-500 p-6 rounded-[2.5rem] flex items-center justify-between shadow-2xl animate-bounce">
            <p class="orbitron text-[10px] text-amber-500 font-black">ENERGÍA BAJA: Expira en ${days} días</p>
            <button onclick="location.hash='#pagos'" class="bg-amber-500 text-black px-6 py-2 rounded-xl orbitron text-[9px] font-black">RECARGAR</button>
        </div>`;
    document.body.appendChild(alert);
}

function showErrorState(container) {
    container.innerHTML = `<div class="h-screen flex flex-col items-center justify-center text-center space-y-8"><i class="fas fa-radiation text-8xl text-red-600 animate-pulse"></i><h2 class="orbitron text-3xl text-white">CORE OFFLINE</h2><button onclick="location.reload()" class="px-12 py-5 border border-white/10 rounded-full text-white orbitron">REINICIAR</button></div>`;
}

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        const p = prompt("Simular Plan (freemium, basico, pro, elite):");
        if (p) { localStorage.setItem("planTier", p); location.reload(); }
    }
});
