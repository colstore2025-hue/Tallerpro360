/**
 * dashboard.js - TallerPRO360 NEXUS-X AEGIS V17.0 🛰️
 * NÚCLEO DE INTELIGENCIA PREDICTIVA Y CONTROL DE MISIÓN GLOBAL
 * Optimización para Despliegue Starlink SaaS - Colombia/USA
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { 
    getClientes, 
    getOrdenes, 
    getInventario, 
    getEmpresaData 
} from "../services/dataService.js";

import { 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

// --- CONSTANTES DE CONFIGURACIÓN ---
const NEXUS_VERSION = "V17.0 AEGIS";
const COMISION_TECNICO = 0.30; // 30% Fijo

/**
 * FUNCIÓN PRINCIPAL: dashboard
 * Inicializa la secuencia de arranque del sistema.
 */
export default async function dashboard(container, state) {
    console.log(`%c 🛰️ NEXUS-X: Iniciando Secuencia ${NEXUS_VERSION}...`, "color: #00f2ff; font-weight: bold;");
    
    const empresaId = localStorage.getItem("nexus_empresaId");
    const planTipo = localStorage.getItem("nexus_plan") || "freemium";
    const nexusMode = localStorage.getItem("nexus_mode"); // SIMULATOR o LIVE

    // 1. VERIFICACIÓN DE LICENCIA Y ACCESO
    const access = await verifyNexusAuth(empresaId, planTipo);
    
    // 2. RENDERIZADO DE LA ESTRUCTURA BASE (DOM)
    renderAegisInterface(container, access, nexusMode);

    try {
        // 3. CARGA DE DATOS (PROCESAMIENTO ASÍNCRONO)
        const data = await loadNexusData(empresaId, nexusMode);
        const metrics = processBusinessIntelligence(data);

        // 4. MATERIALIZACIÓN DE MÓDULOS DE DATOS
        updateTacticalKPIs(metrics, access);
        renderNeuralChart(metrics);
        updatePhaseMatrix(metrics); 
        deployAIAdvisor(metrics, nexusMode);
        
        // 5. ACTIVACIÓN DE MÓDULOS OPERATIVOS Y FINANCIEROS
        renderLiveLogs("logContent", empresaId);
        renderTechPerformance("techPerformance", data.ordenes);
        renderPayrollModule("payrollModule", data.ordenes);
        
        // 6. PROTOCOLO DE BLOQUEO (Si aplica)
        if (access.status === "LOCKED") applyHardLock();

    } catch (err) {
        console.error("🚨 CRITICAL CORE FAILURE:", err);
        showSystemCrash(container);
    }
}

// --- CAPA DE SEGURIDAD (AUTH) ---

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
    } catch (e) {
        return { status: "ACTIVE", plan: "freemium" };
    }
}

// --- MOTOR DE INTERFAZ (UI/UX) ---

function renderAegisInterface(container, access, mode) {
    const isSim = mode === "SIMULATOR";
    
    container.innerHTML = `
    <div class="p-4 lg:p-10 space-y-8 animate-in fade-in zoom-in duration-700 pb-24 max-w-[1600px] mx-auto">
        
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
                <div class="flex items-center gap-3 mb-2">
                    <span class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[8px] font-black orbitron rounded-full animate-pulse">
                        ${isSim ? 'SISTEMA DE SIMULACIÓN' : 'SATELLITE LINK ACTIVE'}
                    </span>
                    <span class="text-slate-500 text-[8px] orbitron tracking-widest uppercase">${NEXUS_VERSION}</span>
                </div>
                <h1 class="text-6xl font-black text-white orbitron tracking-tighter italic">NEXUS <span class="text-cyan-400">X</span></h1>
            </div>
            
            <div class="flex items-center gap-4 bg-slate-900/40 p-3 pl-6 rounded-3xl border border-white/5 backdrop-blur-xl">
                <div class="text-right">
                    <p class="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Estado Licencia</p>
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
                <div class="bg-slate-900/30 rounded-[3.5rem] p-10 border border-white/5 relative overflow-hidden group shadow-2xl">
                    <div class="flex justify-between items-end mb-12">
                        <div>
                            <h3 class="orbitron text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mb-3">Flujo de Caja Proyectado</h3>
                            <div class="text-6xl font-black text-white orbitron tracking-tighter" id="mainIncome">$0</div>
                        </div>
                        <div class="hidden md:block text-right">
                            <p class="text-[8px] text-cyan-500 font-black orbitron mb-1 uppercase tracking-widest">Optimización</p>
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
                                <span class="text-[7px] text-emerald-400 font-bold uppercase tracking-widest">Neural Link Active</span>
                            </div>
                        </div>
                        <div id="aiMessage" class="text-sm text-slate-300 leading-relaxed italic border-l-2 border-cyan-500/40 pl-5 py-3 bg-white/5 rounded-r-2xl">
                            Iniciando escaneo...
                        </div>
                        <div class="space-y-3">
                            <button onclick="location.hash='#ordenes'" class="w-full py-5 bg-white text-black rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-cyan-500 transition-all">Nueva Misión <i class="fas fa-plus ml-2"></i></button>
                        </div>
                    </div>
                </div>

                <div class="bg-slate-900/20 rounded-[3rem] p-8 border border-white/5 h-[420px] overflow-hidden flex flex-col">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                        <h4 class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Live Activity Hub</h4>
                    </div>
                    <div id="logContent" class="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        </div>
                </div>
            </div>
        </div>

        <div class="grid lg:grid-cols-2 gap-8">
            <div id="techPerformance"></div>
            <div id="payrollModule"></div>
        </div>

    </div>`;
}

// --- PROCESAMIENTO DE DATOS ---

async function loadNexusData(empresaId, mode) {
    if (mode === "SIMULATOR") {
        return {
            clientes: new Array(28).fill({}),
            inventario: [{ cantidad: 2, stockMinimo: 5 }, { cantidad: 12, stockMinimo: 10 }],
            ordenes: [
                { total: 5800000, estado: 'REPARACION', tecnico: 'William Urquijo', fechaIngreso: { toDate: () => new Date() } },
                { total: 1200000, estado: 'LISTO', tecnico: 'Operador Alpha', fechaIngreso: { toDate: () => new Date() } },
                { total: 950000, estado: 'LISTO', tecnico: 'William Urquijo', fechaIngreso: { toDate: () => new Date() } }
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
        tendencia: { "Lun": 1200000, "Mar": 2800000, "Mie": 1400000, "Jue": 4800000, "Vie": 3200000, "Sab": 2100000 }
    };

    data.ordenes.forEach(o => {
        const val = Number(o.total || 0);
        stats.ingresos += val;
        if (stats.fases[o.estado] !== undefined) stats.fases[o.estado]++;
    });

    return stats;
}

// --- ACTUALIZACIÓN DE COMPONENTES ---

function updateTacticalKPIs(m, access) {
    const grid = document.getElementById("kpiGrid");
    const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
    
    const cards = [
        { title: "Revenue Bruto", val: fmt(m.ingresos), icon: "fa-rocket", col: "text-emerald-400" },
        { title: "Flota Registrada", val: m.clientes, icon: "fa-car-side", col: "text-blue-400" },
        { title: "Alertas Inventario", val: m.criticos, icon: "fa-boxes", col: m.criticos > 0 ? "text-red-500" : "text-slate-600" },
        { title: "Estado Sistema", val: access.status, icon: "fa-shield-halved", col: "text-cyan-400" }
    ];

    grid.innerHTML = cards.map(c => `
        <div class="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5 hover:border-cyan-500/20 transition-all group cursor-default">
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

    // Destruir instancia previa si existe para evitar solapamiento
    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(m.tendencia),
            datasets: [{
                label: 'Ingresos',
                data: Object.values(m.tendencia),
                borderColor: '#00f2ff',
                borderWidth: 4,
                tension: 0.4,
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

// --- MÓDULOS DE MONITOREO Y RENDIMIENTO ---

function renderLiveLogs(containerId, empresaId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const q = query(
        collection(db, "logs"),
        where("empresaId", "==", empresaId),
        orderBy("timestamp", "desc"),
        limit(12)
    );

    onSnapshot(q, (snap) => {
        container.innerHTML = "";
        if (snap.empty) {
            container.innerHTML = `<p class="text-[8px] text-slate-700 uppercase font-black text-center mt-20 tracking-widest">Esperando actividad...</p>`;
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
                    <p class="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Operador: ${log.usuario}</p>
                </div>
            `;
        });
    });
}

function renderTechPerformance(containerId, ordenes) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const techStats = {};
    ordenes.forEach(o => {
        const tech = o.tecnico || "Indefinido";
        if (!techStats[tech]) techStats[tech] = { nombre: tech, total: 0, completadas: 0, revenue: 0 };
        techStats[tech].total++;
        techStats[tech].revenue += Number(o.total || 0);
        if (o.estado === 'LISTO') techStats[tech].completadas++;
    });

    const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

    container.innerHTML = `
        <div class="bg-slate-900/40 rounded-[3rem] p-10 border border-white/5 h-full">
            <h4 class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 text-center">Eficiencia por Técnico</h4>
            <div class="space-y-8">
                ${Object.values(techStats).sort((a,b) => b.revenue - a.revenue).map(t => {
                    const porc = (t.completadas / t.total) * 100 || 0;
                    return `
                    <div class="space-y-3">
                        <div class="flex justify-between items-end">
                            <div>
                                <p class="text-[10px] font-black text-white uppercase italic tracking-widest">${t.nombre}</p>
                                <p class="text-[7px] mono text-cyan-500 uppercase font-bold">${t.completadas} de ${t.total} Completas</p>
                            </div>
                            <p class="text-[10px] orbitron font-black text-emerald-400">${fmt(t.revenue)}</p>
                        </div>
                        <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div class="h-full bg-cyan-500 shadow-[0_0_10px_rgba(0,242,255,0.5)] transition-all duration-1000" style="width: ${porc}%"></div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
}

function renderPayrollModule(containerId, ordenes) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const payroll = {};
    ordenes.filter(o => o.estado === 'LISTO').forEach(o => {
        const tech = o.tecnico || "Staff";
        if (!payroll[tech]) payroll[tech] = { nombre: tech, totalGenerado: 0, comision: 0, n: 0 };
        const total = Number(o.total || 0);
        payroll[tech].totalGenerado += total;
        payroll[tech].comision += (total * COMISION_TECNICO);
        payroll[tech].n++;
    });

    const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

    container.innerHTML = `
        <div class="bg-gradient-to-br from-slate-900 to-black rounded-[3rem] p-10 border border-emerald-500/20 shadow-2xl h-full">
            <div class="flex justify-between items-center mb-10">
                <h4 class="orbitron text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Liquidación de Pagos</h4>
                <div class="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20"><i class="fas fa-hand-holding-usd text-emerald-400"></i></div>
            </div>
            <div class="space-y-5">
                ${Object.values(payroll).length === 0 
                    ? `<p class="text-center text-[9px] mono text-slate-600 py-10 uppercase">No hay servicios liquidados</p>`
                    : Object.values(payroll).map(p => `
                    <div class="flex items-center justify-between p-5 bg-white/5 rounded-[2rem] border border-white/5 group hover:border-emerald-500/30 transition-all">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center orbitron text-xs font-bold text-white group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                                ${p.nombre.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                                <p class="text-[11px] font-black text-white uppercase">${p.nombre}</p>
                                <p class="text-[8px] text-slate-500 mono">${p.n} Servicios</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-[8px] text-slate-500 uppercase font-black mb-1">Comisión (30%)</p>
                            <p class="text-sm font-black text-emerald-400 orbitron tracking-tighter">${fmt(p.comision)}</p>
                        </div>
                    </div>`).join('')}
            </div>
        </div>`;
}

// --- UTILIDADES Y ALERTAS ---

function deployAIAdvisor(m, mode) {
    const msg = document.getElementById("aiMessage");
    const isSim = mode === "SIMULATOR";
    let text = isSim 
        ? `Comandante William, operando en <b>Simulación AEGIS</b>. El algoritmo detecta potencial de ${m.clientes * 1.5} nuevos clientes basado en flujos locales.`
        : `Análisis completo: <b>${m.fases.REPARACION} unidades</b> en workshop. Se recomienda priorizar repuestos críticos para evitar cuellos de botella.`;
    msg.innerHTML = text;
    if (!isSim && m.criticos > 0) hablar(`Atención Comandante. Inventario bajo en puntos críticos.`);
}

function applyHardLock() {
    const lock = document.createElement('div');
    lock.className = "fixed inset-0 z-[1000] backdrop-blur-2xl bg-black/95 flex items-center justify-center p-6";
    lock.innerHTML = `
        <div class="max-w-md w-full glass p-12 rounded-[4rem] text-center border-2 border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <i class="fas fa-radiation text-8xl text-red-500 mb-10 animate-pulse"></i>
            <h2 class="orbitron text-3xl font-black text-white uppercase italic tracking-tighter">Núcleo Bloqueado</h2>
            <p class="text-[10px] text-slate-500 leading-relaxed uppercase font-black tracking-widest mt-6">Acceso denegado. Licencia Nexus-X expirada.</p>
            <button onclick="location.hash='#pagos'" class="w-full mt-12 py-7 bg-red-600 rounded-[2rem] text-white orbitron font-black text-[12px] tracking-widest hover:bg-red-500 transition-all active:scale-95 shadow-xl shadow-red-600/20 uppercase">Restablecer Vínculo</button>
        </div>`;
    document.body.appendChild(lock);
}

function showSystemCrash(container) {
    container.innerHTML = `
    <div class="h-screen flex flex-col items-center justify-center text-red-500 orbitron space-y-4">
        <i class="fas fa-skull-crossbones text-6xl animate-bounce"></i>
        <div class="text-2xl font-black italic uppercase tracking-tighter">CRITICAL CORE FAILURE</div>
        <p class="text-[10px] text-slate-600 uppercase tracking-widest">Verifique conexión a la base de datos o API Starlink</p>
    </div>`;
}
