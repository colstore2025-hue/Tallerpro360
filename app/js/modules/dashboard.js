/**
 * dashboard.js - NEXUS-X AEGIS V33.0 🛰️
 * SISTEMA UNIFICADO DE COMANDO CENTRAL - NIVEL TERMINATOR
 * Lógica de Negocio: William Jeffry Urquijo Cubillos
 */

import { getClientes, getOrdenes, getInventario } from "../services/dataService.js";

// --- 🛡️ 1. PROTOCOLO DE ACCESO TÁCTICO (PAYWALL CENTRALIZADO) ---
const PERMISOS = {
    "GRATI-CORE": { ordenes: 10, ai: false, nomina: false, contabilidad: false, mkt: false, bold: true, wsp: true },
    "BASICO": { ordenes: 50, ai: true, nomina: false, contabilidad: true, mkt: false, bold: true, wsp: true },
    "PRO": { ordenes: 500, ai: true, nomina: true, contabilidad: true, mkt: true, bold: true, wsp: true },
    "ELITE": { ordenes: Infinity, ai: true, nomina: true, contabilidad: true, mkt: true, bold: true, wsp: true }
};

window.restrictedAccess = (modulo) => {
    Swal.fire({
        title: `<span class="orbitron text-white">MODULO: ${modulo.toUpperCase()}</span>`,
        html: `
            <div class="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl mb-4">
                <p class="text-slate-300 text-xs">Tu plan actual <b>no tiene acceso</b> a este nodo táctico.</p>
            </div>
            <p class="text-[10px] orbitron text-cyan-500 font-black animate-pulse">REQUISITO: PLAN PRO O ELITE</p>
        `,
        icon: 'lock',
        background: '#010409',
        color: '#fff',
        confirmButtonText: 'SOLICITAR ASCENSO',
        confirmButtonColor: '#ea580c',
        showCancelButton: true,
        cancelButtonText: 'ENTENDIDO'
    }).then((result) => { if (result.isConfirmed) location.hash = '#pagos'; });
};

// --- 🚀 2. FUNCIÓN MAESTRA ---
export default async function dashboard(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const planActual = (localStorage.getItem("nexus_plan") || "GRATI-CORE").toUpperCase();
    const configPlan = PERMISOS[planActual] || PERMISOS["GRATI-CORE"];
    const userName = localStorage.getItem("nexus_userName") || "COMANDANTE";
    const empresaNombre = localStorage.getItem("nexus_empresaNombre") || "NEXUS LOGISTICS";

    renderPentagonInterface(container, planActual, userName, empresaNombre, configPlan);

    try {
        const isDemo = planActual === "GRATI-CORE";
        let data = isDemo ? generateQuantumData() : {
            clientes: await getClientes(empresaId).catch(() => []),
            ordenes: await getOrdenes(empresaId).catch(() => []),
            inventario: await getInventario(empresaId).catch(() => [])
        };

        const metrics = processStrategicMetrics(data);

        setTimeout(() => {
            updateTacticalHUD(metrics, planActual);
            renderTechEfficiencyMatrix(data.ordenes);
            if (window.Chart) renderNeuralGrowthChart(metrics.tendencia);
            deployAIOrchestrator(data, configPlan);
            
            // Inyectar contadores finales
            document.getElementById("valTicket").innerText = `$ ${Math.round(metrics.avgTicket).toLocaleString()}`;
            document.getElementById("valRevenue").innerText = `$ ${metrics.revenue.toLocaleString()}`;
            document.getElementById("valProfit").innerText = `$ ${Math.round(metrics.revenue * 0.35).toLocaleString()}`;
        }, 200);

    } catch (err) {
        showSystemCrash(container, "SYNC_ERROR_PROTOCOL");
    }
}

// --- 📐 3. INTERFAZ DE COMANDO ---
function renderPentagonInterface(container, planActual, userName, empresaNombre, configPlan) {
    container.innerHTML = `
    <div class="p-4 lg:p-10 space-y-10 animate-in fade-in zoom-in duration-700 pb-32 max-w-[1800px] mx-auto bg-[#010409] min-h-screen text-white">
        
        <div class="flex flex-col lg:flex-row justify-between items-center gap-8 border-b border-white/5 pb-10">
            <div class="relative bg-black/50 px-8 py-4 rounded-3xl border border-white/5">
                <h1 class="text-3xl lg:text-5xl font-black orbitron italic tracking-tighter uppercase text-white">${empresaNombre}</h1>
                <div class="flex items-center gap-3 mt-2">
                    <div class="h-2 w-2 bg-cyan-500 rounded-full animate-pulse"></div>
                    <p class="text-[9px] text-slate-500 font-bold orbitron tracking-[0.4em] uppercase italic">OPERADOR: ${userName} | NXS_AEGIS.V33</p>
                </div>
            </div>
            <div class="bg-[#0d1117] border-l-4 border-orange-600 p-6 rounded-r-3xl shadow-xl">
                <p class="text-[8px] text-slate-500 font-black orbitron uppercase mb-1">Status de Licencia</p>
                <p class="text-2xl font-black orbitron uppercase text-white">${planActual} <span class="text-orange-600">ACTIVE</span></p>
            </div>
        </div>

                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            ${renderModuleBtn('Clientes', 'fa-user-tie', '#clientes', true)}
            ${renderModuleBtn('Vehículos', 'fa-car-side', '#vehiculos', true)}
            ${renderModuleBtn('Órdenes', 'fa-file-signature', '#ordenes', true)}
            ${renderModuleBtn('Inventario', 'fa-boxes-stacked', '#inventario', true)}
            ${renderModuleBtn('Nómina', 'fa-users-gear', '#nomina', configPlan.nomina)}
            ${renderModuleBtn('Contabilidad', 'fa-calculator', '#contabilidad', configPlan.contabilidad)}

            ${renderModuleBtn('Gerente AI', 'fa-brain', '#gerenteAI', configPlan.ai)}
            ${renderModuleBtn('Audit Finanzas', 'fa-vault', '#finanzas_elite', configPlan.contabilidad)}
            ${renderModuleBtn('Marketplace', 'fa-shop', '#marketplace', configPlan.mkt)}
            ${renderModuleBtn('Reportes', 'fa-chart-network', '#reportes', configPlan.ai)}
            ${renderModuleBtn('WhatsApp', 'fa-brands fa-whatsapp', '#wsp', configPlan.wsp)}
            ${renderModuleBtn('Inicio', 'fa-house', '#dashboard', true)}

            <div class="col-span-2 md:col-span-4 lg:col-span-6 border-t border-white/5 mt-4 pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                ${renderModuleBtn('Órdenes', 'fa-list-check', '#ordenes', true)}
                ${renderModuleBtn('Pagos Taller', 'fa-credit-card', '#pagos', configPlan.bold)}
                ${renderModuleBtn('Configuración', 'fa-gears', '#config', true, true)}
            </div>
        </div>

        <div id="hudKpis" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"></div>

        <div class="grid lg:grid-cols-12 gap-8">
            <div class="lg:col-span-8 bg-[#0d1117] border border-white/5 rounded-[3.5rem] p-12 relative overflow-hidden shadow-2xl">
                <div class="flex justify-between items-center mb-10">
                    <h3 class="orbitron text-[10px] text-cyan-500 font-black uppercase italic tracking-widest">Flujo de Caja Realtime</h3>
                    <div class="px-4 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full text-[8px] font-black orbitron uppercase">Sincronizado</div>
                </div>
                <div class="h-[350px] w-full"><canvas id="neuralChart"></canvas></div>
            </div>

            <div class="lg:col-span-4 space-y-8">
                <div class="bg-gradient-to-br from-[#0d1117] to-black rounded-[3.5rem] p-10 border border-white/5 shadow-2xl">
                    <h4 class="orbitron text-sm font-black text-white mb-8 uppercase italic border-l-4 border-orange-600 pl-4">Asistente Nexus</h4>
                    <div id="aiAnalysis" class="text-sm text-slate-400 italic mb-10 leading-relaxed">Iniciando escaneo de base de datos...</div>
                    <div id="aiButtons" class="grid grid-cols-1 gap-4"></div>
                </div>
                <div id="techMatrix" class="bg-[#0d1117] rounded-[3.5rem] p-10 border border-white/5 space-y-6">
                    <h4 class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-widest">Rendimiento Staff</h4>
                </div>
            </div>
        </div>

        <div class="grid md:grid-cols-3 gap-8 pb-10">
            ${renderKpiBottom('Ticket Promedio', 'valTicket', 'border-white/5')}
            ${renderKpiBottom('Revenue Mensual', 'valRevenue', 'border-cyan-500/20 bg-cyan-500/5')}
            ${renderKpiBottom('Utilidad (Est.)', 'valProfit', 'border-emerald-500/20 bg-emerald-500/5')}
        </div>
    </div>`;
}

function renderModuleBtn(name, icon, hash, habilitado, isConfig = false) {
    const action = habilitado ? `onclick="location.hash='${hash}'"` : `onclick="window.restrictedAccess('${name}')"`;
    const opacity = habilitado ? 'opacity-100' : 'opacity-40';
    const border = isConfig ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-white/5 bg-[#0d1117]';
    
    return `
    <button ${action} class="${opacity} relative p-8 rounded-3xl border ${border} hover:scale-105 hover:bg-white hover:text-black transition-all group overflow-hidden shadow-lg">
        ${!habilitado ? '<i class="fas fa-lock absolute top-4 right-4 text-[10px] text-orange-600"></i>' : ''}
        <i class="${icon} text-2xl mb-4 text-orange-600 group-hover:text-black transition-colors"></i>
        <p class="orbitron text-[9px] font-black uppercase tracking-tighter">${name}</p>
    </button>`;
}

function renderKpiBottom(label, id, extraClass) {
    return `
    <div class="p-10 rounded-[3rem] border ${extraClass} text-center shadow-2xl transition-all hover:border-orange-600/50">
        <p class="text-[9px] text-slate-500 font-black orbitron mb-4 uppercase tracking-[0.3em]">${label}</p>
        <div class="text-4xl lg:text-5xl font-black orbitron text-white italic" id="${id}">$ 0</div>
    </div>`;
}

// --- 🧠 4. NÚCLEO DE PROCESAMIENTO ---
function processStrategicMetrics(data) {
    const revenue = data.ordenes.reduce((acc, o) => acc + Number(o.total || 0), 0);
    const count = data.ordenes.length;
    const tendencia = { "LUN": revenue * 0.2, "MAR": revenue * 0.5, "MIE": revenue * 0.4, "JUE": revenue * 0.8, "VIE": revenue };
    return { revenue, count, avgTicket: count > 0 ? revenue / count : 0, clients: data.clientes.length, tendencia };
}

function updateTacticalHUD(m, plan) {
    const hud = document.getElementById("hudKpis");
    if(!hud) return;
    const cards = [
        { label: "Volumen Caja", val: `$ ${m.revenue.toLocaleString()}`, col: "text-white" },
        { label: "Expansión Clientes", val: m.clients, col: "text-cyan-400" },
        { label: "Misiones Ejecutadas", val: m.count, col: "text-orange-500" },
        { label: "Carga de Sistema", val: plan, col: "text-emerald-400" }
    ];
    hud.innerHTML = cards.map(c => `
        <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 shadow-xl transition-all hover:scale-105">
            <p class="orbitron text-[8px] text-slate-600 font-black uppercase mb-4 tracking-widest">${c.label}</p>
            <div class="text-3xl font-black orbitron ${c.col} italic tracking-tighter">${c.val}</div>
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
                borderColor: '#ea580c',
                borderWidth: 4,
                pointRadius: 0,
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(234, 88, 12, 0.05)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { 
                x: { grid: { display: false }, ticks: { color: '#475569', font: { family: 'Orbitron', size: 8 } } }, 
                y: { display: false } 
            }
        }
    });
}

function renderTechEfficiencyMatrix(ordenes) {
    const container = document.getElementById("techMatrix");
    if (!container) return;
    const stats = {};
    ordenes.forEach(o => { const t = (o.tecnico || "Staff").toUpperCase(); stats[t] = (stats[t] || 0) + Number(o.total || 0); });
    container.innerHTML += Object.entries(stats).slice(0, 3).map(([name, val]) => `
        <div class="space-y-3">
            <div class="flex justify-between text-[9px] orbitron font-black uppercase">
                <span class="text-slate-400">${name}</span>
                <span class="text-white">$${val.toLocaleString()}</span>
            </div>
            <div class="h-[2px] bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-orange-600 shadow-[0_0_10px_#ea580c]" style="width: 75%"></div>
            </div>
        </div>`).join("");
}

async function deployAIOrchestrator(data, config) {
    const analysis = document.getElementById("aiAnalysis");
    const buttons = document.getElementById("aiButtons");
    if(!analysis || !buttons) return;

    if (!config.ai) {
        analysis.innerHTML = `NEXUS-AI se encuentra en modo hibernación. Actualice a PRO para activar predicción de ingresos y análisis de fallos.`;
        buttons.innerHTML = `<button onclick="location.hash='#pagos'" class="py-4 bg-orange-600 text-white orbitron text-[9px] font-black rounded-2xl uppercase shadow-lg">ACTIVAR INTELIGENCIA</button>`;
    } else {
        analysis.innerHTML = `Nexus detecta ${data.ordenes.length} misiones activas. El ticket promedio de $${Math.round(data.ordenes.reduce((a,b)=>a+(Number(b.total)||0),0)/data.ordenes.length || 0).toLocaleString()} es saludable.`;
        buttons.innerHTML = `<button onclick="location.hash='#gerenteAI'" class="py-4 bg-white text-black orbitron text-[9px] font-black rounded-2xl uppercase">INFORME GERENCIAL AI</button>`;
    }
}

function generateQuantumData() {
    return {
        clientes: Array.from({length: 25}),
        ordenes: Array.from({length: 8}, () => ({ total: 150000 + Math.random()*300000, tecnico: "Nexus-Unit" })),
        inventario: []
    };
}

function showSystemCrash(container, message) {
    container.innerHTML = `<div class="h-screen bg-[#010409] flex flex-col items-center justify-center text-center p-10"><h2 class="orbitron text-orange-600 uppercase font-black tracking-widest">${message}</h2><button onclick="location.reload()" class="mt-8 px-10 py-4 bg-white text-black orbitron text-[10px] font-black rounded-full uppercase">REINICIAR PROTOCOLO</button></div>`;
}
