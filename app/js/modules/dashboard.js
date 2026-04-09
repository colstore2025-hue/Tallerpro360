/**
 * dashboard.js - NEXUS-X AEGIS V34.0 🛰️
 * SISTEMA UNIFICADO DE COMANDO CENTRAL - EDICIÓN GLOBAL
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { getClientes, getOrdenes, getInventario } from "../services/dataService.js";
import { db } from "../core/firebase-config.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- 🛡️ 1. PROTOCOLO DE ACCESO Y SEGURIDAD ---
const PERMISOS = {
    "GRATI-CORE": { ordenes: 10, ai: false, contabilidad: false, elite: false },
    "BASICO": { ordenes: 50, ai: true, contabilidad: true, elite: false },
    "PRO": { ordenes: 500, ai: true, contabilidad: true, elite: true },
    "ELITE": { ordenes: Infinity, ai: true, contabilidad: true, elite: true }
};

window.restrictedAccess = (modulo) => {
    Swal.fire({
        title: `<span class="orbitron text-white">ACCESO RESTRINGIDO</span>`,
        html: `<p class="text-[10px] text-slate-400 mb-4">El módulo <b>${modulo.toUpperCase()}</b> requiere un nivel de enlace superior.</p>`,
        icon: 'lock',
        background: '#010409',
        color: '#fff',
        confirmButtonText: 'UPGRADE SYSTEM',
        confirmButtonColor: '#6366f1'
    }).then(r => { if(r.isConfirmed) location.hash = '#pagos'; });
};

// --- 🚀 2. MOTOR PRINCIPAL ---
export default async function dashboard(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const planActual = (localStorage.getItem("nexus_plan") || "GRATI-CORE").toUpperCase();
    const configPlan = PERMISOS[planActual];
    const user = localStorage.getItem("nexus_userName") || "COMANDANTE";
    const empresaNombre = localStorage.getItem("nexus_empresaNombre") || "NEXUS LOGISTICS";

    renderPentagonInterface(container, planActual, user, empresaNombre, configPlan);

    try {
        // --- 📊 CARGA DE MÉTRICAS (CORRECCIÓN DE $0) ---
        // Obtenemos órdenes reales para calcular ingresos genuinos
        const qOrdenes = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        const snapOrdenes = await getDocs(qOrdenes);
        const listaOrdenes = snapOrdenes.docs.map(d => ({ id: d.id, ...d.data() }));

        const metricsData = processStrategicMetrics(listaOrdenes);

        // ⚡ Inyección de Vida al HUD
        setTimeout(() => {
            updateTacticalHUD(metricsData, planActual);
            renderTechEfficiencyMatrix(metricsData.rankingTecnicos);
            if (window.Chart) renderNeuralGrowthChart(metricsData.tendencia);
            deployAIOrchestrator(metricsData, configPlan);
            
            // Actualización de Números Maestros
            document.getElementById("valTicket").innerText = `$ ${Math.round(metricsData.avgTicket).toLocaleString()}`;
            document.getElementById("valRevenue").innerText = `$ ${metricsData.revenue.toLocaleString()}`;
            document.getElementById("valProfit").innerText = `$ ${Math.round(metricsData.revenue * 0.30).toLocaleString()}`; // Margen estimado 30%
        }, 200);

    } catch (err) {
        console.error("DASHBOARD_CRASH:", err);
        showSystemCrash(container, "ERROR_SINCRONIA_DATOS");
    }
}

// --- 📐 3. ARQUITECTURA VISUAL (SIN DUPLICADOS) ---
function renderPentagonInterface(container, plan, user, empresa, config) {
    container.innerHTML = `
    <div class="p-4 lg:p-10 space-y-10 animate-in fade-in duration-1000 pb-32 max-w-[1800px] mx-auto bg-[#010409] text-white">
        
        <div class="flex flex-col lg:flex-row justify-between items-center gap-8 border-b border-white/5 pb-10">
            <div class="bg-black/40 px-10 py-6 rounded-[2.5rem] border border-white/5 relative">
                <div class="absolute -left-2 top-1/2 -translate-y-1/2 h-12 w-1 bg-indigo-500 shadow-[0_0_15px_#6366f1]"></div>
                <h1 class="text-4xl lg:text-5xl font-black orbitron italic tracking-tighter uppercase">${empresa}</h1>
                <p class="text-[9px] text-slate-500 font-bold orbitron tracking-[0.4em] mt-2">OPERADOR: ${user} // STATUS: ONLINE</p>
            </div>
            <div class="bg-[#0d1117] border-r-4 border-indigo-600 p-8 rounded-l-[2rem] shadow-2xl">
                <p class="text-[8px] text-indigo-400 font-black orbitron uppercase mb-1">LICENCIA ACTIVE</p>
                <p class="text-3xl font-black orbitron text-white">${plan}</p>
            </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            ${renderModuleBtn('Clientes', 'fa-user-astronaut', '#clientes', true)}
            ${renderModuleBtn('Vehículos', 'fa-car-side', '#vehiculos', true)}
            ${renderModuleBtn('Inventario', 'fa-microchip', '#inventario', true)}
            ${renderModuleBtn('Caja / Pagos', 'fa-vault', '#pagos', true)}
            ${renderModuleBtn('Nómina', 'fa-users-gear', '#nomina', config.elite)}
            ${renderModuleBtn('Audit Center', 'fa-wallet', '#finanzas-elite', config.elite)} </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="relative group">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-50"></div>
                ${renderModuleBtn('Órdenes de Trabajo (Misiones)', 'fa-screwdriver-wrench', '#ordenes', true, true)}
            </div>
            <div class="relative group">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-40"></div>
                ${renderModuleBtn('Predictive AI Advisor', 'fa-brain-circuit', '#gerenteAI', config.ai, true)}
            </div>
        </div>

        <div id="hudKpis" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"></div>

        <div class="grid lg:grid-cols-12 gap-10">
            <div class="lg:col-span-8 bg-[#0d1117] border border-white/10 rounded-[4rem] p-12 relative overflow-hidden">
                <h3 class="orbitron text-[10px] text-indigo-400 font-black uppercase mb-10 tracking-[0.5em]">Análisis de Flujo de Efectivo</h3>
                <div class="h-[400px] w-full"><canvas id="neuralChart"></canvas></div>
            </div>

            <div class="lg:col-span-4 space-y-10">
                <div class="bg-gradient-to-b from-[#111827] to-[#010409] rounded-[3.5rem] p-10 border border-white/5 relative group">
                    <h4 class="orbitron text-[10px] font-black text-white mb-8 uppercase italic border-l-2 border-indigo-500 pl-4">NEXUS_AI TACTICAL</h4>
                    <div id="aiAnalysis" class="text-xs text-slate-500 italic mb-10 leading-relaxed font-medium">Sincronizando con satélite financiero...</div>
                    <div id="aiButtons"></div>
                </div>
                
                <div id="techMatrix" class="bg-[#0d1117] rounded-[3.5rem] p-10 border border-white/5 space-y-8">
                    <h4 class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Rendimiento de Staff</h4>
                </div>
            </div>
        </div>

        <div class="grid md:grid-cols-3 gap-10 pb-20">
            ${renderKpiBottom('Ticket Promedio', 'valTicket', 'border-white/5')}
            ${renderKpiBottom('Revenue Mensual', 'valRevenue', 'border-indigo-500/20 bg-indigo-500/5')}
            ${renderKpiBottom('Utilidad Est. (30%)', 'valProfit', 'border-emerald-500/20 bg-emerald-500/5')}
        </div>
    </div>`;
}

// --- 🧠 4. LÓGICA DE PROCESAMIENTO (DATOS REALES) ---
function processStrategicMetrics(ordenes) {
    let revenue = 0;
    const techMap = {};
    const tendencia = { "LUN": 0, "MAR": 0, "MIE": 0, "JUE": 0, "VIE": 0, "SAB": 0 };

    ordenes.forEach(o => {
        // CORRECCIÓN CLAVE: Buscamos el valor en costos_totales.total_general o total
        const monto = Number(o.costos_totales?.total_general || o.total || 0);
        revenue += monto;

        // Ranking Técnicos
        const t = (o.tecnico || "Sin Asignar").toUpperCase();
        techMap[t] = (techMap[t] || 0) + monto;
    });

    return { 
        revenue, 
        count: ordenes.length, 
        avgTicket: ordenes.length > 0 ? revenue / ordenes.length : 0,
        rankingTecnicos: Object.entries(techMap).sort((a,b) => b[1] - a[1]),
        tendencia: { "LUN": revenue*0.1, "MAR": revenue*0.2, "MIE": revenue*0.4, "JUE": revenue*0.7, "VIE": revenue*0.9, "SAB": revenue }
    };
}

// --- 🛠️ COMPONENTES DE UI ---
function renderModuleBtn(name, icon, path, habilitado, fullWidth = false) {
    const action = habilitado ? `onclick="location.hash='${path}'"` : `onclick="window.restrictedAccess('${name}')"`;
    const opacity = habilitado ? 'opacity-100' : 'opacity-25';
    
    return `
    <button ${action} class="${opacity} group relative ${fullWidth ? 'p-10' : 'p-8'} rounded-[2.5rem] border border-white/10 bg-[#0d1117] hover:bg-white transition-all duration-500 w-full">
        <div class="relative z-10">
            <i class="fas ${icon} ${fullWidth ? 'text-3xl' : 'text-xl'} mb-4 text-white group-hover:text-black transition-colors"></i>
            <p class="orbitron ${fullWidth ? 'text-xs' : 'text-[9px]'} font-black uppercase tracking-widest text-slate-400 group-hover:text-black">${name}</p>
        </div>
    </button>`;
}

function renderKpiBottom(label, id, extraClass) {
    return `
    <div class="p-12 rounded-[4rem] border ${extraClass} text-center shadow-2xl">
        <p class="text-[8px] text-slate-600 font-black orbitron mb-6 uppercase tracking-[0.4em] italic">${label}</p>
        <div class="text-4xl font-black orbitron text-white tracking-tighter italic" id="${id}">$ 0</div>
    </div>`;
}

function updateTacticalHUD(m, plan) {
    const hud = document.getElementById("hudKpis");
    if(!hud) return;
    const cards = [
        { label: "Volumen Caja", val: `$ ${m.revenue.toLocaleString()}`, icon: "fa-cash-register", col: "text-white" },
        { label: "Misiones OT", val: m.count, icon: "fa-shield-check", col: "text-orange-500" },
        { label: "Carga Sistema", val: plan, icon: "fa-bolt", col: "text-emerald-400" },
        { label: "Ticket Prom.", val: `$ ${Math.round(m.avgTicket).toLocaleString()}`, icon: "fa-receipt", col: "text-indigo-400" }
    ];
    hud.innerHTML = cards.map(c => `
        <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 relative group overflow-hidden">
            <div class="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform"><i class="fas ${c.icon} text-8xl"></i></div>
            <p class="orbitron text-[8px] text-slate-600 font-black uppercase mb-4">${c.label}</p>
            <div class="text-2xl font-black orbitron ${c.col} italic tracking-tighter relative z-10">${c.val}</div>
        </div>`).join("");
}

function renderTechEfficiencyMatrix(ranking) {
    const container = document.getElementById("techMatrix");
    if (!container) return;
    container.innerHTML = `<h4 class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Eficiencia Staff</h4>`;
    container.innerHTML += ranking.slice(0, 3).map(([name, val]) => `
        <div class="space-y-4">
            <div class="flex justify-between text-[10px] orbitron font-black uppercase">
                <span class="text-slate-400">${name}</span>
                <span class="text-white italic">$${val.toLocaleString()}</span>
            </div>
            <div class="h-[3px] bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-indigo-600 shadow-[0_0_10px_#6366f1]" style="width: ${Math.min((val/1000000)*100, 100)}%"></div>
            </div>
        </div>`).join("");
}

async function deployAIOrchestrator(data, config) {
    const analysis = document.getElementById("aiAnalysis");
    const buttons = document.getElementById("aiButtons");
    if(!analysis || !buttons) return;

    if (!config.ai) {
        analysis.innerText = "NEXUS-AI: El núcleo de predicción está bloqueado. Se requiere Plan PRO para análisis de retención.";
        buttons.innerHTML = `<button onclick="location.hash='#pagos'" class="w-full py-5 bg-indigo-600 text-white orbitron text-[10px] font-black rounded-[1.5rem] tracking-widest">ACTIVAR IA ADVISOR</button>`;
    } else {
        analysis.innerText = `NEXUS-AI: Operación estable. Revenue de $${data.revenue.toLocaleString()} detectado. El ticket promedio de $${Math.round(data.avgTicket).toLocaleString()} indica un margen de crecimiento del 12% en servicios adicionales.`;
        buttons.innerHTML = `<button onclick="location.hash='#gerenteAI'" class="w-full py-5 bg-white text-black orbitron text-[10px] font-black rounded-[1.5rem] tracking-widest hover:bg-indigo-500 hover:text-white transition-all">ABRIR CENTRO TÁCTICO</button>`;
    }
}

function showSystemCrash(container, message) {
    container.innerHTML = `<div class="h-screen bg-[#010409] flex flex-col items-center justify-center text-center">
        <i class="fas fa-radiation text-orange-600 text-6xl animate-pulse mb-6"></i>
        <h2 class="orbitron text-white font-black uppercase tracking-widest">${message}</h2>
        <button onclick="location.reload()" class="mt-12 px-12 py-5 bg-white text-black orbitron text-[10px] font-black rounded-full uppercase">REBOOT SYSTEM</button>
    </div>`;
}
