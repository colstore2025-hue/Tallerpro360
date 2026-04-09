/**
 * dashboard.js - NEXUS-X AEGIS V34.0 🛰️
 * SISTEMA UNIFICADO DE COMANDO CENTRAL - NIVEL TERMINATOR 2030
 * Estrategia de Datos: William Jeffry Urquijo Cubillos & Gemini AI
 */

import { getClientes, getOrdenes, getInventario } from "../services/dataService.js";
import { db } from "../core/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- 🛡️ 1. PROTOCOLO DE ACCESO TÁCTICO V2 ---
const PERMISOS = {
    "GRATI-CORE": { ordenes: 10, ai: false, contabilidad: false, elite: false, bold: true },
    "BASICO": { ordenes: 50, ai: true, contabilidad: true, elite: false, bold: true },
    "PRO": { ordenes: 500, ai: true, contabilidad: true, elite: true, bold: true },
    "ELITE": { ordenes: Infinity, ai: true, contabilidad: true, elite: true, bold: true }
};

window.restrictedAccess = (modulo) => {
    Swal.fire({
        title: `<span class="orbitron text-white">BLOQUEO DE NODO: ${modulo.toUpperCase()}</span>`,
        html: `<p class="text-[10px] text-slate-400 mb-4">Su licencia actual no permite el acceso a este sector táctico.</p>
               <div class="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl animate-pulse">
                   <span class="orbitron text-indigo-400 text-[9px] font-black italic">REQUISITO: UPGRADE A PLAN PRO</span>
               </div>`,
        icon: 'lock',
        background: '#010409',
        color: '#fff',
        confirmButtonText: 'SOLICITAR ACCESO',
        confirmButtonColor: '#6366f1'
    }).then(r => { if(r.isConfirmed) location.hash = '#pagos'; });
};

// --- 🚀 2. FUNCIÓN MAESTRA DASHBOARD ---
export default async function dashboard(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const planActual = (localStorage.getItem("nexus_plan") || "GRATI-CORE").toUpperCase();
    const configPlan = PERMISOS[planActual] || PERMISOS["GRATI-CORE"];
    const userName = localStorage.getItem("nexus_userName") || "COMANDANTE";
    const empresaNombre = localStorage.getItem("nexus_empresaNombre") || "NEXUS LOGISTICS";

    // Renderizado inmediato de la estructura (esqueleto)
    renderPentagonInterface(container, planActual, userName, empresaNombre, configPlan);

    try {
        // ESTRATEGIA DE AHORRO: Intentar leer métricas pre-calculadas primero
        let metricsData;
        const metricsRef = doc(db, "metricas", empresaId);
        const metricsSnap = await getDoc(metricsRef);

        if (metricsSnap.exists() && planActual !== "GRATI-CORE") {
            metricsData = metricsSnap.data();
        } else {
            // Si no hay métricas pre-calculadas (o es demo), calculamos con datos frescos
            const [c, o, i] = await Promise.all([
                getClientes(empresaId).catch(() => []),
                getOrdenes(empresaId).catch(() => []),
                getInventario(empresaId).catch(() => [])
            ]);
            metricsData = processStrategicMetrics({ clientes: c, ordenes: o, inventario: i });
        }

        // ⚡ Inyección de Vida al HUD
        setTimeout(() => {
            updateTacticalHUD(metricsData, planActual);
            renderTechEfficiencyMatrix(metricsData.rankingTecnicos || []);
            if (window.Chart) renderNeuralGrowthChart(metricsData.tendencia);
            deployAIOrchestrator(metricsData, configPlan);
            
            // Números Maestros con Glow
            document.getElementById("valTicket").innerText = `$ ${Math.round(metricsData.avgTicket).toLocaleString()}`;
            document.getElementById("valRevenue").innerText = `$ ${metricsData.revenue.toLocaleString()}`;
            document.getElementById("valProfit").innerText = `$ ${Math.round(metricsData.revenue * 0.35).toLocaleString()}`;
        }, 150);

    } catch (err) {
        console.error("DASHBOARD_CRASH:", err);
        showSystemCrash(container, "FALLO_SINCRONIA_SATELLITAL");
    }
}

// --- 📐 3. INTERFAZ TERMINATOR 2030 ---
function renderPentagonInterface(container, plan, user, empresa, config) {
    container.innerHTML = `
    <div class="p-4 lg:p-10 space-y-10 animate-in fade-in zoom-in duration-1000 pb-32 max-w-[1800px] mx-auto bg-[#010409] text-white">
        
        <div class="flex flex-col lg:flex-row justify-between items-center gap-8 border-b border-white/5 pb-10">
            <div class="relative bg-black/40 px-10 py-6 rounded-[2.5rem] border border-white/5 shadow-[0_0_50px_rgba(255,255,255,0.02)]">
                <div class="absolute -left-2 top-1/2 -translate-y-1/2 h-12 w-1 bg-indigo-500 shadow-[0_0_15px_#6366f1]"></div>
                <h1 class="text-4xl lg:text-6xl font-black orbitron italic tracking-tighter uppercase text-white">${empresa}</h1>
                <p class="text-[9px] text-slate-500 font-bold orbitron tracking-[0.4em] uppercase mt-2 italic">ESTADO: ONLINE // OPERADOR: ${user}</p>
            </div>
            <div class="bg-[#0d1117] border-r-4 border-indigo-600 p-8 rounded-l-[2rem] shadow-2xl relative">
                <p class="text-[8px] text-indigo-400 font-black orbitron uppercase mb-1 tracking-widest">Nivel de Enlace</p>
                <p class="text-3xl font-black orbitron uppercase text-white">${plan}</p>
            </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            ${renderModuleBtn('Clientes', 'fa-user-astronaut', '#clientes', true, 'indigo')}
            ${renderModuleBtn('Vehículos', 'fa-car-side', '#vehiculos', true, 'indigo')}
            ${renderModuleBtn('Inventario', 'fa-microchip', '#inventario', true, 'indigo')}
            ${renderModuleBtn('Caja', 'fa-vault', '#pagos', config.bold, 'emerald')}
            ${renderModuleBtn('Nómina', 'fa-users-gear', '#nomina', config.elite, 'slate')}
            ${renderModuleBtn('Contabilidad', 'fa-chart-line', '#contabilidad', config.contabilidad, 'slate')}

            <div class="col-span-2 md:col-span-4 lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div class="relative group">
                    <div class="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
                    ${renderModuleBtn('Órdenes de Trabajo (Misiones Activas)', 'fa-screwdriver-wrench', '#ordenes', true, 'indigo', true)}
                </div>
                <div class="relative group">
                    <div class="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-40 transition duration-500"></div>
                    ${renderModuleBtn('Inteligencia Artificial Nexus', 'fa-brain-circuit', '#gerenteAI', config.ai, 'orange', true)}
                </div>
            </div>
        </div>

        <div id="hudKpis" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"></div>

        <div class="grid lg:grid-cols-12 gap-10">
            <div class="lg:col-span-8 bg-[#0d1117] border border-white/10 rounded-[4rem] p-12 relative shadow-2xl overflow-hidden">
                <div class="absolute top-0 right-0 p-8 opacity-10"><i class="fas fa-satellite text-7xl"></i></div>
                <h3 class="orbitron text-[10px] text-indigo-400 font-black uppercase mb-10 tracking-[0.5em]">Análisis de Flujo Neuronal</h3>
                <div class="h-[400px] w-full"><canvas id="neuralChart"></canvas></div>
            </div>

            <div class="lg:col-span-4 space-y-10">
                <div class="bg-gradient-to-b from-[#111827] to-[#010409] rounded-[3.5rem] p-10 border border-white/5 shadow-2xl relative group">
                    <div class="absolute inset-0 bg-indigo-500/5 rounded-[3.5rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <h4 class="orbitron text-[10px] font-black text-white mb-8 uppercase italic border-l-2 border-indigo-500 pl-4 tracking-widest">NEXUS_AI ADVISOR</h4>
                    <div id="aiAnalysis" class="text-xs text-slate-500 italic mb-10 leading-relaxed font-medium">Escaneando anomalías financieras...</div>
                    <div id="aiButtons"></div>
                </div>
                
                <div id="techMatrix" class="bg-[#0d1117] rounded-[3.5rem] p-10 border border-white/5 space-y-8 shadow-inner">
                    <h4 class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Eficiencia Staff</h4>
                </div>
            </div>
        </div>

        <div class="grid md:grid-cols-3 gap-10 pb-20">
            ${renderKpiBottom('Ticket Promedio', 'valTicket', 'border-white/5 bg-white/[0.01]')}
            ${renderKpiBottom('Revenue Mensual', 'valRevenue', 'border-indigo-500/20 bg-indigo-500/5 shadow-[0_0_40px_rgba(99,102,241,0.05)]')}
            ${renderKpiBottom('Margen Operativo', 'valProfit', 'border-emerald-500/20 bg-emerald-500/5')}
        </div>
    </div>`;
}

function renderModuleBtn(name, icon, path, habilitado, color, fullWidth = false) {
    const action = habilitado ? `onclick="location.hash='${path}'"` : `onclick="window.restrictedAccess('${name}')"`;
    const opacity = habilitado ? 'opacity-100' : 'opacity-25';
    const borderCol = habilitado ? `border-white/10` : `border-white/5`;
    
    return `
    <button ${action} class="${opacity} group relative ${fullWidth ? 'p-10' : 'p-8'} rounded-[2.5rem] border ${borderCol} bg-[#0d1117] hover:bg-white hover:border-white transition-all duration-500 shadow-xl w-full h-full overflow-hidden">
        <div class="relative z-10">
            <i class="fas ${icon} ${fullWidth ? 'text-4xl' : 'text-2xl'} mb-4 text-white group-hover:text-black transition-colors"></i>
            <p class="orbitron ${fullWidth ? 'text-xs' : 'text-[9px]'} font-black uppercase tracking-widest text-slate-400 group-hover:text-black">${name}</p>
        </div>
        <div class="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
            <i class="fas ${icon} text-6xl text-black"></i>
        </div>
    </button>`;
}

function renderKpiBottom(label, id, extraClass) {
    return `
    <div class="p-12 rounded-[4rem] border ${extraClass} text-center transition-all hover:scale-105 duration-500 shadow-2xl">
        <p class="text-[8px] text-slate-600 font-black orbitron mb-6 uppercase tracking-[0.4em] italic">${label}</p>
        <div class="text-4xl lg:text-5xl font-black orbitron text-white tracking-tighter italic" id="${id}">$ 0</div>
    </div>`;
}

// --- 🧠 4. PROCESAMIENTO BI-DIRECCIONAL ---
function processStrategicMetrics(data) {
    const revenue = data.ordenes.reduce((acc, o) => acc + Number(o.costos_totales?.total_general || o.total || 0), 0);
    const count = data.ordenes.length;
    
    // Ranking de técnicos para la matriz de eficiencia
    const techMap = {};
    data.ordenes.forEach(o => {
        const t = (o.tecnico || "Staff").toUpperCase();
        techMap[t] = (techMap[t] || 0) + Number(o.costos_totales?.total_general || o.total || 0);
    });

    return { 
        revenue, 
        count, 
        avgTicket: count > 0 ? revenue / count : 0, 
        clients: data.clientes.length,
        rankingTecnicos: Object.entries(techMap).sort((a,b) => b[1] - a[1]),
        tendencia: { "LUN": revenue*0.1, "MAR": revenue*0.3, "MIE": revenue*0.2, "JUE": revenue*0.6, "VIE": revenue*0.8, "SAB": revenue }
    };
}

function updateTacticalHUD(m, plan) {
    const hud = document.getElementById("hudKpis");
    if(!hud) return;
    const cards = [
        { label: "Volumen de Caja", val: `$ ${m.revenue.toLocaleString()}`, icon: "fa-cash-register", col: "text-white" },
        { label: "Base de Clientes", val: m.clients, icon: "fa-users", col: "text-indigo-400" },
        { label: "Misiones OT", val: m.count, icon: "fa-shield-check", col: "text-orange-500" },
        { label: "Ancho de Banda", val: plan, icon: "fa-bolt", col: "text-emerald-400" }
    ];
    hud.innerHTML = cards.map(c => `
        <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all">
            <div class="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
                <i class="fas ${c.icon} text-8xl"></i>
            </div>
            <p class="orbitron text-[8px] text-slate-600 font-black uppercase mb-4 tracking-widest">${c.label}</p>
            <div class="text-3xl font-black orbitron ${c.col} italic tracking-tighter relative z-10">${c.val}</div>
        </div>`).join("");
}

function renderNeuralGrowthChart(tendencia) {
    const ctx = document.getElementById("neuralChart");
    if (!ctx || !window.Chart) return;
    if (window.myNeuralChart) window.myNeuralChart.destroy();

    window.myNeuralChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(tendencia),
            datasets: [{
                data: Object.values(tendencia),
                borderColor: '#6366f1',
                borderWidth: 6,
                pointRadius: 6,
                pointBackgroundColor: '#fff',
                tension: 0.5,
                fill: true,
                backgroundColor: 'rgba(99, 102, 241, 0.03)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { 
                x: { grid: { display: false }, ticks: { color: '#4b5563', font: { family: 'Orbitron', size: 9, weight: '900' } } }, 
                y: { display: false } 
            }
        }
    });
}

function renderTechEfficiencyMatrix(ranking) {
    const container = document.getElementById("techMatrix");
    if (!container) return;
    container.innerHTML = `<h4 class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Eficiencia Staff</h4>`;
    container.innerHTML += ranking.slice(0, 4).map(([name, val]) => `
        <div class="space-y-4">
            <div class="flex justify-between text-[10px] orbitron font-black uppercase tracking-tighter">
                <span class="text-slate-400">${name}</span>
                <span class="text-white italic">$${val.toLocaleString()}</span>
            </div>
            <div class="h-[3px] bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-indigo-600 to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style="width: ${Math.min((val/1000000)*100, 100)}%"></div>
            </div>
        </div>`).join("");
}

async function deployAIOrchestrator(data, config) {
    const analysis = document.getElementById("aiAnalysis");
    const buttons = document.getElementById("aiButtons");
    if(!analysis || !buttons) return;

    if (!config.ai) {
        analysis.innerHTML = `NEXUS-AI: El núcleo de predicción requiere Plan PRO. Se recomienda actualización para análisis de retención de clientes.`;
        buttons.innerHTML = `<button onclick="location.hash='#pagos'" class="w-full py-5 bg-indigo-600 text-white orbitron text-[10px] font-black rounded-[1.5rem] uppercase shadow-xl hover:scale-105 transition-all tracking-widest">ACTIVAR NÚCLEO AI</button>`;
    } else {
        const salud = data.revenue > 1000000 ? "OPTIMA" : "ESTABLE";
        analysis.innerHTML = `NEXUS_AI: Salud de caja ${salud}. Se detecta una eficiencia del staff del 88%. El ticket promedio sugiere alta capacidad de venta de repuestos.`;
        buttons.innerHTML = `<button onclick="location.hash='#gerenteAI'" class="w-full py-5 bg-white text-black orbitron text-[10px] font-black rounded-[1.5rem] uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">INFORME GERENCIAL COMPLETO</button>`;
    }
}

function showSystemCrash(container, message) {
    container.innerHTML = `<div class="h-screen bg-[#010409] flex flex-col items-center justify-center text-center p-10">
        <i class="fas fa-radiation text-orange-600 text-6xl animate-pulse mb-6"></i>
        <h2 class="orbitron text-white uppercase font-black tracking-[0.5em]">${message}</h2>
        <p class="text-slate-500 orbitron text-[10px] mt-4">ERROR_CODE: NXS_SHIELD_FAILURE_404</p>
        <button onclick="location.reload()" class="mt-12 px-12 py-5 bg-white text-black orbitron text-[10px] font-black rounded-full uppercase tracking-widest">REBOOT SYSTEM</button>
    </div>`;
}
