/**
 * dashboard.js - NEXUS-X AEGIS V32.9 🛰️
 * NÚCLEO DE INTELIGENCIA TÁCTICA (EDICIÓN AEROESPACIAL 2026)
 * APP: TallerPRO360 - ERP + CRM + AI Orchestrator
 */

import { getClientes, getOrdenes, getInventario } from "/app/js/services/dataService.js";

// --- 🛡️ 1. LÓGICA DE PROTECCIÓN (PAYWALL) ---
window.restrictedAccess = () => {
    Swal.fire({
        title: '<span class="orbitron text-lg text-white">ACCESO RESTRINGIDO</span>',
        html: '<p class="text-slate-400 text-sm">Este módulo requiere un <b>Nodo de Pago</b> activo (Básico, Pro o Elite).</p>',
        icon: 'lock',
        background: '#020617',
        color: '#fff',
        confirmButtonText: 'VER PLANES',
        confirmButtonColor: '#06b6d4',
        showCancelButton: true,
        cancelButtonText: 'LUEGO',
        customClass: { popup: 'rounded-[2rem] border border-white/10' }
    }).then((result) => { if (result.isConfirmed) location.hash = '#pagos'; });
};

// --- 🚀 2. FUNCIÓN MAESTRA ---
export default async function dashboard(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const empresaNombre = localStorage.getItem("nexus_empresaNombre") || "TALLER PRO 360";
    const planActual = (localStorage.getItem("nexus_plan") || "GRATI-CORE").toUpperCase();
    const isDemo = planActual === "GRATI-CORE";
    const userName = localStorage.getItem("nexus_userName") || "COMANDANTE";

    if (!empresaId && !isDemo) return showSystemCrash(container, "LINK PROTOCOL BROKEN: NO_SESSION");

    renderPentagonInterface(container, isDemo, planActual, userName, empresaNombre);

    try {
        let data;
        if (isDemo) {
            data = generateQuantumData(); 
        } else {
            const [clientes, ordenes, inventario] = await Promise.all([
                getClientes(empresaId).catch(() => []),
                getOrdenes(empresaId).catch(() => []),
                getInventario(empresaId).catch(() => [])
            ]);
            data = { clientes, ordenes, inventario };
        }

        const metrics = processStrategicMetrics(data);

        setTimeout(() => {
            updateTacticalHUD(metrics);
            renderTechEfficiencyMatrix(data.ordenes);
            if (window.Chart) renderNeuralGrowthChart(metrics.tendencia);
            deployAIOrchestrator(data);
            
            if (isDemo) {
                const dias = document.getElementById("dias-restantes");
                if (dias) dias.innerText = "7";
            }
        }, 150);

    } catch (err) {
        console.error("🚨 Fallo Crítico:", err);
        showSystemCrash(container, "DATA_SYNC_INTERRUPTED");
    }
}

// --- 📐 3. INTERFAZ DE COMANDO ---
function renderPentagonInterface(container, isDemo, planActual, userName, empresaNombre) {
    container.innerHTML = `
    <div id="banner-demo" class="${isDemo ? '' : 'hidden'} bg-gradient-to-r from-amber-600/20 to-red-600/20 border-b border-amber-500/50 p-3 text-center text-[10px] orbitron text-amber-500 sticky top-0 z-[1000] backdrop-blur-md">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        MODO DISCOVERY: Módulos ERP bloqueados. Expira en <span id="dias-restantes">--</span> días. 
        <a href="#pagos" class="underline ml-2 font-black hover:text-white transition-all">ADQUIRIR LICENCIA FULL</a>
    </div>

    <div class="p-4 lg:p-10 space-y-10 animate-in fade-in zoom-in duration-700 pb-32 max-w-[1800px] mx-auto bg-[#02040a] min-h-screen text-white">
        
        <div class="flex flex-col lg:flex-row justify-between items-center gap-8 border-b-2 border-cyan-500/20 pb-10">
            <div class="relative group">
                <div class="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-red-600 rounded-lg blur opacity-25"></div>
                <div class="relative bg-black px-8 py-4 rounded-lg border border-white/10 text-center lg:text-left">
                    <h1 class="text-3xl lg:text-5xl font-black orbitron italic tracking-tighter uppercase">
                        ${empresaNombre}
                    </h1>
                    <p class="text-[9px] text-cyan-500 font-bold orbitron tracking-[0.6em] uppercase mt-2 italic">OPERADOR: ${userName} | NXS_AEGIS.X</p>
                </div>
            </div>
            
            <div class="flex gap-4">
                <div class="bg-[#0d1117] border-l-4 border-amber-500 p-6 rounded-r-2xl">
                    <p class="text-[8px] text-amber-500 font-black orbitron uppercase">Nodo Status</p>
                    <p class="text-xl font-black orbitron uppercase">${planActual}</p>
                </div>
                <div class="bg-[#0d1117] border-l-4 border-emerald-500 p-6 rounded-r-2xl">
                    <p class="text-[8px] text-emerald-500 font-black orbitron uppercase">Sincronía</p>
                    <p class="text-xl font-black orbitron text-emerald-400">NOMINAL</p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            ${renderModuleBtn('Vehículos', 'fa-car-side', '#vehiculos', false)}
            ${renderModuleBtn('Órdenes', 'fa-file-signature', '#ordenes', false)}
            ${renderModuleBtn('Inventario', 'fa-boxes', '#inventario', isDemo)}
            ${renderModuleBtn('Staff / Nómina', 'fa-users-gear', '#nomina', isDemo)}
            ${renderModuleBtn('Gerente AI', 'fa-brain', '#gerenteAI', isDemo)}
            ${renderModuleBtn('Contabilidad', 'fa-calculator', '#contabilidad', isDemo)}
            ${renderModuleBtn('Finanzas Elite', 'fa-vault', '#finanzas', isDemo)}
            ${renderModuleBtn('Reportes', 'fa-chart-network', '#reportes', isDemo)}
            ${renderModuleBtn('Pagos', 'fa-credit-card', '#pagos', false)}
            ${renderModuleBtn('Config', 'fa-microchip', '#config', false, true)} 
        </div>

        <div id="hudKpis" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"></div>

        <div class="grid lg:grid-cols-12 gap-8">
            <div class="lg:col-span-8 bg-[#0d1117] border border-white/5 rounded-[3rem] p-12 relative shadow-2xl overflow-hidden">
                <h3 class="orbitron text-[10px] text-cyan-500 font-black uppercase tracking-[0.5em] italic mb-10">Proyección de Ingresos Global</h3>
                <div class="h-[400px]"><canvas id="neuralChart"></canvas></div>
            </div>

            <div class="lg:col-span-4 space-y-8">
                <div class="bg-gradient-to-br from-[#111827] to-[#02040a] rounded-[3rem] p-10 border border-cyan-500/30">
                    <div class="flex items-center gap-5 mb-8">
                        <i class="fas fa-robot text-cyan-400 text-3xl animate-pulse"></i>
                        <h4 class="orbitron text-sm font-black text-white tracking-widest uppercase">IA COMMANDER</h4>
                    </div>
                    <div id="aiAnalysis" class="text-sm text-slate-300 leading-relaxed italic border-l-2 border-red-500 pl-6 py-2 mb-10">Escaneando base de datos...</div>
                    <div id="aiButtons" class="grid grid-cols-1 gap-4"></div>
                </div>

                <div class="bg-[#0d1117] rounded-[3rem] p-10 border border-white/5">
                    <h4 class="orbitron text-[9px] font-black text-amber-500 uppercase tracking-widest mb-8">Eficiencia Operativa</h4>
                    <div id="techMatrix" class="space-y-6"></div>
                </div>
            </div>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
            <div class="bg-gradient-to-t from-red-900/20 to-transparent p-10 rounded-[3rem] border border-red-500/20 text-center group hover:border-red-500 transition-all">
                <p class="text-[9px] text-red-500 font-black orbitron mb-4 uppercase tracking-[0.2em]">Ticket Promedio</p>
                <div class="text-5xl font-black orbitron" id="valTicket">$ 0</div>
            </div>
            <div class="bg-gradient-to-t from-cyan-900/20 to-transparent p-10 rounded-[3rem] border border-cyan-500/20 text-center group hover:border-cyan-500 transition-all">
                <p class="text-[9px] text-cyan-500 font-black orbitron mb-4 uppercase tracking-[0.2em]">Revenue Total</p>
                <div class="text-5xl font-black orbitron" id="valRevenue">$ 0</div>
            </div>
            <div class="bg-gradient-to-t from-emerald-900/20 to-transparent p-10 rounded-[3rem] border border-emerald-500/20 text-center group hover:border-emerald-500 transition-all">
                <p class="text-[9px] text-emerald-500 font-black orbitron mb-4 uppercase tracking-[0.2em]">Utilidad Proyectada</p>
                <div class="text-5xl font-black orbitron text-emerald-400" id="valProfit">$ 0</div>
            </div>
        </div>
    </div>`;
}

function renderModuleBtn(name, icon, hash, isDemo, isConfig = false) {
    // Si es demo y NO es uno de los libres, bloqueamos.
    const isFree = !isDemo || isConfig || name === 'Órdenes' || name === 'Vehículos' || name === 'Pagos';
    const action = isFree ? `onclick="location.hash='${hash}'"` : `onclick="window.restrictedAccess()"` ;
    
    const style = isConfig ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'border-white/5 bg-[#0d1117] text-slate-400';
    
    return `
    <button ${action} class="relative p-5 rounded-2xl border ${style} hover:scale-105 hover:bg-white hover:text-black transition-all group overflow-hidden">
        ${(!isFree) ? '<i class="fas fa-lock absolute top-2 right-2 text-[8px] text-amber-500"></i>' : ''}
        <i class="fas ${icon} text-2xl mb-3"></i>
        <p class="orbitron text-[9px] font-black uppercase tracking-tighter">${name}</p>
    </button>`;
}

// --- 🧠 4. NÚCLEO LÓGICO ---
function processStrategicMetrics(data) {
    const revenue = data.ordenes.reduce((acc, o) => acc + Number(o.total || o.valor || 0), 0);
    const count = data.ordenes.length;
    const criticos = data.inventario.filter(i => Number(i.cantidad || 0) <= Number(i.stockMinimo || 5)).length;
    const tendencia = { "LUN": revenue*0.2, "MAR": revenue*0.5, "MIE": revenue*0.4, "JUE": revenue*0.8, "VIE": revenue };
    return { revenue, count, avgTicket: count > 0 ? revenue / count : 0, clients: data.clientes.length, criticos, tendencia };
}

function updateTacticalHUD(m) {
    const hud = document.getElementById("hudKpis");
    if(!hud) return;
    const cards = [
        { label: "Cash Flow Bruto", val: `$ ${m.revenue.toLocaleString()}`, icon: "fa-chart-line", col: "text-white" },
        { label: "Base de Datos", val: `${m.clients} Clientes`, icon: "fa-address-book", col: "text-cyan-400" },
        { label: "Alertas Stock", val: m.criticos, icon: "fa-exclamation-triangle", col: "text-red-500" },
        { label: "Nodo Satelital", val: "ACTIVE", icon: "fa-satellite", col: "text-emerald-400" }
    ];
    hud.innerHTML = cards.map(c => `
        <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 hover:border-cyan-500/30 transition-all group">
            <p class="orbitron text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4 group-hover:text-cyan-500">${c.label}</p>
            <div class="flex justify-between items-end">
                <div class="text-3xl font-black orbitron ${c.col}">${c.val}</div>
                <i class="fas ${c.icon} text-xl opacity-20"></i>
            </div>
        </div>`).join("");
    
    // Inyección de métricas finales
    if(document.getElementById("valTicket")) document.getElementById("valTicket").innerText = `$ ${Math.round(m.avgTicket).toLocaleString()}`;
    if(document.getElementById("valRevenue")) document.getElementById("valRevenue").innerText = `$ ${m.revenue.toLocaleString()}`;
    if(document.getElementById("valProfit")) document.getElementById("valProfit").innerText = `$ ${Math.round(m.revenue * 0.35).toLocaleString()}`;
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
                borderColor: '#00f2ff',
                borderWidth: 5,
                pointRadius: 0,
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(0, 242, 255, 0.05)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: true, ticks: { color: '#475569', font: { family: 'Orbitron', size: 8 } } }, y: { display: false } }
        }
    });
}

function renderTechEfficiencyMatrix(ordenes) {
    const container = document.getElementById("techMatrix");
    if (!container) return;
    const stats = {};
    ordenes.forEach(o => { const t = o.tecnico || "Staff Gral"; stats[t] = (stats[t] || 0) + Number(o.total || 0); });
    container.innerHTML = Object.entries(stats).slice(0, 4).map(([name, val]) => `
        <div class="space-y-2">
            <div class="flex justify-between text-[10px] orbitron font-bold uppercase">
                <span>${name}</span>
                <span class="text-slate-500">$ ${val.toLocaleString()}</span>
            </div>
            <div class="h-1 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-cyan-500" style="width: ${Math.min((val/1000000)*100, 100)}%"></div>
            </div>
        </div>`).join("");
}

async function deployAIOrchestrator(data) {
    const analysis = document.getElementById("aiAnalysis");
    const buttons = document.getElementById("aiButtons");
    if(!analysis || !buttons) return;
    analysis.innerHTML = `Nexus-X detecta flujo estable. El <b>Ticket Promedio</b> es óptimo. Se sugiere habilitar <b>Finanzas Elite</b> para optimizar el pago de impuestos y nómina.`;
    buttons.innerHTML = `
        <button onclick="location.hash='#gerenteAI'" class="py-4 bg-cyan-500 text-black orbitron text-[9px] font-black rounded-xl uppercase">Consultar Gerente AI</button>
        <button onclick="location.hash='#pagos'" class="py-4 bg-white/5 text-white border border-white/10 orbitron text-[9px] font-black rounded-xl uppercase">Mejorar Plan</button>
    `;
}

function generateQuantumData() {
    return {
        clientes: Array.from({length: 25}),
        ordenes: Array.from({length: 8}, () => ({ total: 150000 + Math.random()*200000, tecnico: "Nexus-Bot" })),
        inventario: Array.from({length: 15}, () => ({cantidad: 2, stockMinimo: 5}))
    };
}

function showSystemCrash(container, message) {
    container.innerHTML = `<div class="h-screen bg-[#02040a] flex flex-col items-center justify-center text-center p-10"><h2 class="orbitron text-white italic">${message}</h2><button onclick="location.reload()" class="mt-8 px-12 py-4 bg-cyan-500 rounded-full text-black orbitron text-[10px] font-black">RE-ESTABLECER</button></div>`;
}
