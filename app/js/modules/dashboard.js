/**
 * dashboard.js - TallerPRO360 NEXUS-X AEGIS V17.0 🛰️
 * NÚCLEO DE INTELIGENCIA PREDICTIVA Y CONTROL DE MISIÓN GLOBAL
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { getClientes, getOrdenes, getInventario, getEmpresaData } from "../services/dataService.js";
import { collection, query, where, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

const NEXUS_VERSION = "V17.0 AEGIS";

export default async function dashboard(container, state) {
    console.log(`%c 🛰️ NEXUS-X: Iniciando Secuencia ${NEXUS_VERSION}...`, "color: #00f2ff; font-weight: bold;");
    
    const uid = localStorage.getItem("nexus_uid");
    const empresaId = localStorage.getItem("nexus_empresaId");
    const planTipo = localStorage.getItem("nexus_plan") || "freemium";
    const nexusMode = localStorage.getItem("nexus_mode"); 

    // 1. VERIFICACIÓN DE PERÍMETRO
    const access = await verifyNexusAuth(empresaId, planTipo);
    
    // 2. DESPLIEGUE DE ESTRUCTURA HOLOGRÁFICA
    renderAegisInterface(container, access, nexusMode);

    try {
        // 3. CARGA DE DATOS (REAL O SIMULADA)
        const data = await loadNexusData(empresaId, nexusMode);
        const metrics = processBusinessIntelligence(data);

        // 4. MATERIALIZACIÓN DE MÓDULOS TÁCTICOS
        updateTacticalKPIs(metrics, access);
        renderNeuralChart(metrics);
        updatePhaseMatrix(metrics); 
        deployAIAdvisor(metrics, nexusMode);
        
        // 5. ACTIVACIÓN DE MONITOR SATELITAL (LOGS EN VIVO)
        renderLiveLogs("nexusLiveMonitor", empresaId);
        
        // 6. BLOQUEO SI LA LICENCIA EXPIRÓ
        if (access.status === "LOCKED") applyHardLock();

    } catch (err) {
        console.error("🚨 CRITICAL CORE FAILURE:", err);
        container.innerHTML = `<div class="h-screen flex items-center justify-center text-red-500 orbitron animate-pulse">ERROR CRÍTICO EN NÚCLEO: REINICIE TERMINAL</div>`;
    }
}

// --- NÚCLEO DE AUTENTICACIÓN ---

async function verifyNexusAuth(empId, plan) {
    const rol = localStorage.getItem("nexus_rol");
    if (rol === "superadmin") return { status: "ACTIVE", plan: "elite" };

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
    } catch (e) { return { status: "ACTIVE", plan: "freemium" }; }
}

// --- INTERFAZ AEGIS (HTML ESTRUCTURAL) ---

function renderAegisInterface(container, access, mode) {
    const isSim = mode === "SIMULATOR";
    
    container.innerHTML = `
    <div class="p-4 lg:p-10 space-y-8 animate-in fade-in zoom-in duration-700 pb-24">
        
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
                <div class="flex items-center gap-3 mb-2">
                    <span class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[8px] font-black orbitron rounded-full animate-pulse uppercase">
                        ${isSim ? 'SISTEMA DE SIMULACIÓN' : 'SATELLITE LINK ACTIVE'}
                    </span>
                    <span class="text-slate-600 text-[7px] orbitron tracking-[0.4em] uppercase font-black">${NEXUS_VERSION}</span>
                </div>
                <h1 class="text-6xl font-black text-white orbitron tracking-tighter italic">NEXUS <span class="text-cyan-400">X</span></h1>
            </div>
            
            <div class="flex items-center gap-4 bg-slate-900/40 p-3 pl-6 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                <div class="text-right">
                    <p class="text-[7px] text-slate-500 font-black uppercase tracking-widest">Estado de Licencia</p>
                    <p class="text-xs font-black text-white orbitron">${access.plan.toUpperCase()}</p>
                </div>
                <button onclick="location.hash='#pagos'" class="w-12 h-12 bg-cyan-500 rounded-2xl text-black hover:scale-110 transition-all shadow-lg shadow-cyan-500/20">
                    <i class="fas fa-bolt"></i>
                </button>
            </div>
        </div>

        <div id="kpiGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>

        <div class="grid lg:grid-cols-12 gap-8">
            <div class="lg:col-span-8 space-y-8">
                <div class="bg-slate-900/30 rounded-[3.5rem] p-10 border border-white/5 relative overflow-hidden group">
                    <div class="flex justify-between items-end mb-12">
                        <div>
                            <h3 class="orbitron text-[9px] text-slate-500 font-black uppercase tracking-[0.5em] mb-3">Revenue Proyectado (30D)</h3>
                            <div class="text-6xl font-black text-white orbitron tracking-tighter" id="mainIncome">$0</div>
                        </div>
                        <div class="hidden md:block text-right">
                            <p class="text-[8px] text-cyan-500 font-black orbitron mb-1 uppercase">Eficiencia de Taller</p>
                            <div class="text-3xl font-black text-white italic">94.8%</div>
                        </div>
                    </div>
                    <div class="h-80 w-full"><canvas id="neuralChart"></canvas></div>
                </div>

                <div id="phaseMatrix" class="grid grid-cols-2 md:grid-cols-4 gap-6"></div>
            </div>

            <div class="lg:col-span-4 space-y-8">
                <div id="aiAdvisor" class="bg-gradient-to-br from-slate-900 to-black rounded-[3rem] p-10 border border-cyan-500/20 shadow-2xl relative overflow-hidden">
                    <div class="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl"></div>
                    <div class="relative z-10 space-y-8">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-400/30">
                                <i class="fas fa-brain text-cyan-400 text-xl animate-pulse"></i>
                            </div>
                            <div>
                                <h4 class="orbitron text-[10px] font-black text-white tracking-widest uppercase">Nexus Advisor</h4>
                                <span class="text-[7px] text-emerald-400 font-bold uppercase tracking-widest">IA Analítica</span>
                            </div>
                        </div>
                        
                        <div id="aiMessage" class="text-sm text-slate-300 leading-relaxed italic border-l-2 border-cyan-500/40 pl-5 py-3 bg-white/5 rounded-r-2xl">
                            Escaneando flujos de trabajo...
                        </div>

                        <div class="space-y-3">
                            <button onclick="location.hash='#ordenes'" class="w-full py-5 bg-white text-black rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-xl shadow-white/5">Nueva Orden <i class="fas fa-plus ml-2"></i></button>
                        </div>
                    </div>
                </div>

                <div id="nexusLiveMonitor" class="bg-slate-900/20 rounded-[3rem] p-8 border border-white/5 h-[450px] overflow-y-auto custom-scrollbar">
                    <div class="flex items-center gap-3 mb-8">
                        <div class="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                        <h4 class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Live Activity Hub</h4>
                    </div>
                    <div id="logContent" class="space-y-4">
                        </div>
                </div>
            </div>
        </div>
    </div>`;
}

// --- MONITOR DE ACTIVIDAD EN TIEMPO REAL (LOGS) ---

function renderLiveLogs(containerId, empresaId) {
    const container = document.getElementById("logContent");
    if (!container) return;

    const q = query(
        collection(db, "logs"),
        where("empresaId", "==", empresaId),
        orderBy("timestamp", "desc"),
        limit(12)
    );

    onSnapshot(q, (snap) => {
        container.innerHTML = "";
        if(snap.empty) {
            container.innerHTML = `<p class="text-[8px] text-slate-700 uppercase font-black text-center mt-10">Esperando señal de actividad...</p>`;
            return;
        }

        snap.forEach(doc => {
            const log = doc.data();
            const time = log.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "Sync";
            
            container.innerHTML += `
                <div class="p-4 bg-white/5 border-l-2 border-cyan-500/20 rounded-r-2xl animate-in slide-in-from-right-2 duration-500">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[9px] font-black text-white uppercase tracking-tighter">${log.accion}</span>
                        <span class="text-[7px] mono text-slate-500">${time}</span>
                    </div>
                    <p class="text-[8px] text-slate-500 uppercase tracking-widest font-bold">BY: ${log.usuario}</p>
                </div>
            `;
        });
    });
}

// --- MOTOR DE DATOS Y KPI ---

async function loadNexusData(empresaId, mode) {
    if (mode === "SIMULATOR") {
        return {
            clientes: new Array(24).fill({}),
            inventario: [{ cantidad: 2, stockMinimo: 5 }],
            ordenes: [
                { total: 4500000, estado: 'REPARACION', fechaIngreso: { toDate: () => new Date() } },
                { total: 1200000, estado: 'EN_TALLER', fechaIngreso: { toDate: () => new Date() } }
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
        tendencia: { "Lun": 1200000, "Mar": 800000, "Mie": 2400000, "Jue": 1800000, "Vie": 3200000 }
    };

    data.ordenes.forEach(o => {
        const val = Number(o.total || 0);
        stats.ingresos += val;
        if (stats.fases[o.estado] !== undefined) stats.fases[o.estado]++;
    });

    return stats;
}

function updateTacticalKPIs(m, access) {
    const grid = document.getElementById("kpiGrid");
    const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
    
    const cards = [
        { title: "Revenue Bruto", val: fmt(m.ingresos), icon: "fa-rocket", col: "text-emerald-400" },
        { title: "Flota Activa", val: m.clientes, icon: "fa-car-side", col: "text-blue-400" },
        { title: "Alerta Stock", val: m.criticos, icon: "fa-boxes", col: m.criticos > 0 ? "text-red-500" : "text-slate-600" },
        { title: "Auth Status", val: access.status, icon: "fa-shield-halved", col: "text-cyan-400" }
    ];

    grid.innerHTML = cards.map(c => `
        <div class="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5 hover:border-cyan-500/20 transition-all group">
            <div class="flex justify-between items-center mb-5">
                <span class="orbitron text-[8px] text-slate-500 font-black uppercase tracking-[0.3em]">${c.title}</span>
                <i class="fas ${c.icon} ${c.col} text-[10px]"></i>
            </div>
            <div class="text-3xl font-black text-white orbitron tracking-tighter italic group-hover:text-cyan-400 transition-colors">${c.val}</div>
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
                borderWidth: 4,
                tension: 0.45,
                pointRadius: 4,
                pointBackgroundColor: '#00f2ff',
                fill: true,
                backgroundColor: (context) => {
                    const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(0, 242, 255, 0.15)');
                    gradient.addColorStop(1, 'rgba(0, 242, 255, 0)');
                    return gradient;
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

function updatePhaseMatrix(m) {
    const matrix = document.getElementById("phaseMatrix");
    const fases = [
        { key: 'EN_TALLER', label: 'Inbound', icon: 'fa-sign-in-alt' },
        { key: 'DIAGNOSTICO', label: 'Scanner', icon: 'fa-microscope' },
        { key: 'REPARACION', label: 'Workshop', icon: 'fa-tools' },
        { key: 'LISTO', label: 'Outbound', icon: 'fa-flag-checkered' }
    ];

    matrix.innerHTML = fases.map(f => `
        <div class="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 text-center group hover:bg-white/5 transition-all">
            <i class="fas ${f.icon} mb-4 text-xs ${m.fases[f.key] > 0 ? 'text-cyan-400 animate-pulse' : 'text-slate-800'}"></i>
            <p class="orbitron text-[8px] text-slate-500 uppercase font-black mb-1">${f.label}</p>
            <p class="text-2xl font-black text-white orbitron">${m.fases[f.key] || 0}</p>
        </div>
    `).join("");
}

function deployAIAdvisor(m, mode) {
    const msg = document.getElementById("aiMessage");
    const isSim = mode === "SIMULATOR";
    
    let text = isSim 
        ? `Comandante William, operando bajo <b>Modo Proyección</b>. Nexus-X estima una optimización de flujo del 40% con este volumen de órdenes.`
        : `Análisis crítico: Detecto <b>${m.criticos} repuestos</b> bajo el stock de seguridad. Sugiero reabastecimiento para no detener la fase de Workshop.`;
    
    msg.innerHTML = text;
    if (!isSim && m.criticos > 0) hablar(`Atención Comandante. Hay alertas críticas en el inventario.`);
}

function applyHardLock() {
    const lock = document.createElement('div');
    lock.className = "fixed inset-0 z-[1000] backdrop-blur-xl bg-black/90 flex items-center justify-center p-6";
    lock.innerHTML = `
        <div class="max-w-md w-full glass p-12 rounded-[4rem] text-center border-2 border-red-500/20">
            <i class="fas fa-lock text-7xl text-red-500 mb-8 animate-bounce"></i>
            <h2 class="orbitron text-2xl font-black text-white uppercase italic">Núcleo Bloqueado</h2>
            <p class="text-[10px] text-slate-500 leading-relaxed uppercase font-black tracking-widest mt-4">Conexión suspendida por expiración de licencia.</p>
            <button onclick="location.hash='#pagos'" class="w-full mt-10 py-6 bg-red-600 rounded-3xl text-white orbitron font-black text-[10px] tracking-widest hover:bg-red-500 shadow-xl shadow-red-600/20">REESTABLECER VÍNCULO</button>
        </div>`;
    document.body.appendChild(lock);
}
