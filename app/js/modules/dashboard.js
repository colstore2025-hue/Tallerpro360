/**
 * dashboard.js - NEXUS-X AEGIS V32.9 🛰️
 * NÚCLEO DE INTELIGENCIA TÁCTICA (EDICIÓN AEROESPACIAL 2026)
 */

import { getClientes, getOrdenes, getInventario } from "/app/js/services/dataService.js";

// --- 🛡️ 1. LÓGICA DE PROTECCIÓN (PAYWALL) ---
window.restrictedAccess = () => {
    Swal.fire({
        title: '<span class="orbitron text-lg text-white">ACCESO RESTRINGIDO</span>',
        html: '<p class="text-slate-400 text-sm">Los módulos operativos requieren un <b>Nodo de Pago</b> activo.</p>',
        icon: 'lock',
        background: '#020617',
        color: '#fff',
        confirmButtonText: 'ADQUIRIR PLAN',
        confirmButtonColor: '#06b6d4',
        showCancelButton: true,
        cancelButtonText: 'LUEGO',
        customClass: { popup: 'rounded-[2rem] border border-white/10' }
    }).then((result) => { if (result.isConfirmed) location.hash = '#pagos'; });
};

// --- 🚀 2. FUNCIÓN MAESTRA ---
export default async function dashboard(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const planActual = (localStorage.getItem("nexus_plan") || "GRATI-CORE").toUpperCase();
    const isDemo = planActual === "GRATI-CORE";
    const userName = localStorage.getItem("nexus_userName") || "COMANDANTE";
    const empresaNombre = localStorage.getItem("nexus_empresaNombre") || "NEXUS TALLER";

    if (!empresaId && !isDemo) return showSystemCrash(container, "LINK_BROKEN");

    renderPentagonInterface(container, isDemo, planActual, userName, empresaNombre);

    try {
        let data = isDemo ? generateQuantumData() : {
            clientes: await getClientes(empresaId).catch(() => []),
            ordenes: await getOrdenes(empresaId).catch(() => []),
            inventario: await getInventario(empresaId).catch(() => [])
        };

        const metrics = processStrategicMetrics(data);

        setTimeout(() => {
            updateTacticalHUD(metrics);
            renderTechEfficiencyMatrix(data.ordenes);
            if (window.Chart) renderNeuralGrowthChart(metrics.tendencia);
            deployAIOrchestrator(data);
        }, 150);

    } catch (err) {
        showSystemCrash(container, "SYNC_ERROR");
    }
}

// --- 📐 3. INTERFAZ REFACTORIZADA ---
function renderPentagonInterface(container, isDemo, planActual, userName, empresaNombre) {
    container.innerHTML = `
    <div id="banner-demo" class="${isDemo ? '' : 'hidden'} bg-gradient-to-r from-amber-600/20 to-red-600/20 border-b border-amber-500/50 p-3 text-center text-[10px] orbitron text-amber-500 sticky top-0 z-[1000] backdrop-blur-md">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        MODO DISCOVERY ACTIVO. <a href="#pagos" class="underline ml-2 font-black">ADQUIRIR LICENCIA FULL</a>
    </div>

    <div class="p-4 lg:p-10 space-y-10 pb-32 max-w-[1800px] mx-auto bg-[#02040a] min-h-screen text-white">
        
        <div class="flex flex-col lg:flex-row justify-between items-center gap-8 border-b-2 border-cyan-500/20 pb-10">
            <div class="relative group">
                <div class="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-red-600 rounded-lg blur opacity-25"></div>
                <div class="relative bg-black px-8 py-4 rounded-lg border border-white/10">
                    <h1 class="text-3xl lg:text-5xl font-black orbitron italic uppercase tracking-tighter">${empresaNombre}</h1>
                    <p class="text-[9px] text-cyan-500 font-bold orbitron tracking-[0.6em] mt-2 italic">BIENVENIDO: ${userName}</p>
                </div>
            </div>
            <div class="flex gap-4">
                <div class="bg-[#0d1117] border-l-4 border-amber-500 p-6 rounded-r-2xl">
                    <p class="text-[8px] text-amber-500 font-black orbitron uppercase">Nodo</p>
                    <p class="text-xl font-black orbitron">${planActual}</p>
                </div>
                <div class="bg-[#0d1117] border-l-4 border-emerald-500 p-6 rounded-r-2xl">
                    <p class="text-[8px] text-emerald-500 font-black orbitron uppercase">Sincronía</p>
                    <p class="text-xl font-black orbitron text-emerald-400">NOMINAL</p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            ${renderModuleBtn('Vehículos', 'fa-car-side', '#vehiculos', false)}
            ${renderModuleBtn('Inventario', 'fa-boxes', '#inventario', isDemo)}
            ${renderModuleBtn('Órdenes', 'fa-file-signature', '#ordenes', false)}
            ${renderModuleBtn('Gerente AI', 'fa-robot', '#gerenteAI', isDemo)}
            ${renderModuleBtn('Contabilidad', 'fa-calculator', '#contabilidad', isDemo)}
            
            ${renderModuleBtn('Reportes', 'fa-chart-network', '#reportes', isDemo)}
            ${renderModuleBtn('Staff / Nómina', 'fa-users-gear', '#nomina', isDemo)}
            ${renderModuleBtn('Pagos Plan', 'fa-credit-card', '#pagos', false)} 
            ${renderModuleBtn('Configuración', 'fa-cogs', '#config', false, true)}
        </div>

        <div id="hudKpis" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"></div>
        <div class="grid lg:grid-cols-12 gap-8">
            <div class="lg:col-span-8 bg-[#0d1117] border border-white/5 rounded-[3rem] p-12 relative overflow-hidden">
                <h3 class="orbitron text-[10px] text-cyan-500 font-black uppercase mb-10">Proyección Ingresos</h3>
                <div class="h-[400px]"><canvas id="neuralChart"></canvas></div>
            </div>
            <div class="lg:col-span-4 space-y-8">
                <div class="bg-gradient-to-br from-[#111827] to-[#02040a] rounded-[3rem] p-10 border border-cyan-500/30">
                    <div class="flex items-center gap-5 mb-8"><i class="fas fa-brain text-cyan-400 text-3xl"></i><h4 class="orbitron text-sm font-black text-white">IA COMMANDER</h4></div>
                    <div id="aiAnalysis" class="text-sm text-slate-300 italic border-l-2 border-red-500 pl-6 py-2 mb-10">Escaneando...</div>
                    <div id="aiButtons" class="grid grid-cols-1 gap-4"></div>
                </div>
                <div class="bg-[#0d1117] rounded-[3rem] p-10 border border-white/5">
                    <h4 class="orbitron text-[9px] font-black text-amber-500 uppercase mb-8">Matriz de Eficiencia</h4>
                    <div id="techMatrix" class="space-y-6"></div>
                </div>
            </div>
        </div>
    </div>`;
}

function renderModuleBtn(name, icon, hash, isDemo, isConfig = false) {
    const action = (isDemo && name !== 'Configuración' && name !== 'Pagos Plan' && name !== 'Órdenes' && name !== 'Vehículos') 
                   ? `onclick="window.restrictedAccess()"` 
                   : `onclick="location.hash='${hash}'"`;
                   
    const style = isConfig ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' : 'border-white/5 bg-[#0d1117] text-slate-300';
    
    return `
    <button ${action} class="relative p-6 rounded-2xl border ${style} hover:scale-105 transition-all group overflow-hidden">
        ${(isDemo && !['Configuración', 'Pagos Plan', 'Órdenes', 'Vehículos'].includes(name)) ? '<i class="fas fa-lock absolute top-2 right-2 text-[8px] text-amber-500"></i>' : ''}
        <i class="fas ${icon} text-2xl mb-3"></i>
        <p class="orbitron text-[9px] font-black uppercase tracking-tighter">${name}</p>
    </button>`;
}

// --- 🧠 4. PROCESAMIENTO DE DATOS ---
function processStrategicMetrics(data) {
    const revenue = data.ordenes.reduce((acc, o) => acc + Number(o.total || 0), 0);
    const count = data.ordenes.length;
    return { revenue, count, clients: data.clientes.length, criticos: data.inventario.length, tendencia: { "LUN": 20, "MAR": 50, "MIE": 40, "JUE": 80, "VIE": 100 } };
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
        <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 hover:border-cyan-500/30 transition-all">
            <p class="orbitron text-[8px] text-slate-500 font-black uppercase mb-4">${c.label}</p>
            <div class="flex justify-between items-end">
                <div class="text-3xl font-black orbitron ${c.col}">${c.val}</div>
                <i class="fas ${c.icon} text-xl opacity-20"></i>
            </div>
        </div>`).join("");
}

function renderNeuralGrowthChart(tendencia) {
    const ctx = document.getElementById("neuralChart");
    if (!ctx || !window.Chart) return;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(tendencia),
            datasets: [{ data: Object.values(tendencia), borderColor: '#00f2ff', borderWidth: 4, tension: 0.4, fill: true, backgroundColor: 'rgba(0, 242, 255, 0.05)' }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: true }, y: { display: false } } }
    });
}

function renderTechEfficiencyMatrix(ordenes) {
    const container = document.getElementById("techMatrix");
    if (!container) return;
    container.innerHTML = `<p class="text-[10px] text-slate-500 orbitron">Sincronizando rendimiento técnico...</p>`;
}

async function deployAIOrchestrator(data) {
    const analysis = document.getElementById("aiAnalysis");
    const buttons = document.getElementById("aiButtons");
    if(!analysis || !buttons) return;
    analysis.innerHTML = `Nexus-X detecta flujo operativo estable. Se recomienda activar el módulo <b>Gerente AI</b> para predicción de compras.`;
    buttons.innerHTML = `<button onclick="location.hash='#gerenteAI'" class="py-4 bg-cyan-500 text-black orbitron text-[9px] font-black rounded-xl uppercase">Hablar con Gerente AI</button>`;
}

function generateQuantumData() {
    return { clientes: Array.from({length: 10}), ordenes: Array.from({length: 5}, () => ({total: 50000})), inventario: [] };
}

function showSystemCrash(container, message) {
    container.innerHTML = `<div class="h-screen bg-[#02040a] flex flex-col items-center justify-center text-center p-10"><h2 class="orbitron text-white">${message}</h2><button onclick="location.reload()" class="mt-4 px-8 py-2 bg-cyan-500 rounded-full text-black orbitron text-xs">RE-INTENTAR</button></div>`;
}
