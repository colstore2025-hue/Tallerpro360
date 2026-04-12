/**
 * dashboard.js - NEXUS-X AEGIS V35.5 🛰️
 * SISTEMA UNIFICADO DE COMANDO CENTRAL - EDICIÓN 2030
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 * @strategy Utility-First / AI-Driven Logistics
 */

import { db } from "../core/firebase-config.js";
import { collection, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- 🛡️ 1. PROTOCOLO DE AUTORIZACIÓN DE NÚCLEO ---
const PERMISOS = {
    "GRATI-CORE": { 
        limiteOrdenes: 10, 
        modulos: ['clientes', 'vehiculos', 'ordenes', 'pagos', 'contabilidad', 'soporte'],
        clase: "border-slate-700 text-slate-400" 
    },
    "BASICO": { 
        limiteOrdenes: 50, 
        modulos: ['clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 'contabilidad', 'soporte'],
        clase: "border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
    },
    "PRO": { 
        limiteOrdenes: 500, 
        modulos: ['clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 'contabilidad', 'gerenteAI', 'reportes', 'marketplace', 'publish', 'soporte'],
        clase: "border-purple-500 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
    },
    "ELITE": { 
        limiteOrdenes: Infinity, 
        modulos: ['clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 'contabilidad', 'gerenteAI', 'reportes', 'marketplace', 'publish', 'staff', 'nomina', 'finanzas-elite', 'soporte'],
        clase: "border-cyan-500 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)]"
    }
};

// --- 🚀 2. INYECTOR DE INTERFAZ NEXUS ---
export default async function dashboard(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const planActual = (localStorage.getItem("nexus_plan") || "GRATI-CORE").toUpperCase();
    const config = PERMISOS[planActual] || PERMISOS["GRATI-CORE"];
    
    // Renderizado inmediato para evitar parpadeos (Zero-Latency UI)
    renderInterface(container, planActual, config);

    try {
        // Telemetría de una sola vía para optimizar cuotas de Firebase
        const qOrdenes = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), limit(500));
        const snap = await getDocs(qOrdenes);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        const stats = processBI(data);

        // Animación de entrada de datos
        setTimeout(() => {
            updateNumbers(stats, planActual);
            renderStaffEfficiency(stats.staff);
            deployAIAssistant(stats, config.modulos.includes('gerenteAI'));
        }, 150);

    } catch (err) {
        console.error("AEGIS_SHIELD_FAILURE", err);
    }
}

// --- 🧠 3. INTELIGENCIA DE NEGOCIO (BI) ---
function processBI(ordenes) {
    let rev = 0;
    const staff = {};
    const validas = ordenes.filter(o => o.estado !== 'CANCELADO');

    validas.forEach(o => {
        const monto = Number(o.costos_totales?.total_general || o.total || 0);
        rev += monto;
        const tec = o.tecnico || "OPERADOR_S/N";
        staff[tec] = (staff[tec] || 0) + monto;
        
        // CRM Predictive Link
        if(o.placa) localStorage.setItem(`nexus_v_trace_${o.placa}`, JSON.stringify({ last_service: o.fecha_apertura }));
    });

    return {
        revenue: rev,
        count: validas.length,
        avgTicket: validas.length > 0 ? rev / validas.length : 0,
        staff: Object.entries(staff).sort((a,b) => b[1] - a[1])
    };
}

// --- 🛠️ COMPONENTES DE COMANDO ---
function renderBtn(name, icon, path, habilitado) {
    const action = habilitado ? `onclick="location.hash='${path}'"` : `onclick="Swal.fire('BLOQUEADO', 'Eleve su nivel de enlace para activar este módulo.', 'info')"`;
    return `
    <button ${action} class="group p-6 rounded-[2rem] bg-[#0d1117] border border-white/5 hover:border-cyan-500/50 hover:bg-white hover:scale-[1.03] transition-all duration-500 overflow-hidden relative">
        <div class="absolute inset-0 bg-cyan-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
        <i class="fas ${icon} text-xl mb-4 ${habilitado ? 'text-white group-hover:text-cyan-600' : 'text-slate-800'}"></i>
        <p class="orbitron text-[8px] font-black uppercase tracking-[0.3em] ${habilitado ? 'text-slate-500 group-hover:text-black' : 'text-slate-800'}">${name}</p>
    </button>`;
}

// --- 📐 4. ARQUITECTURA VISUAL (DASHBOARD TOTAL) ---
function renderInterface(container, plan, config) {
    const user = localStorage.getItem("nexus_userName") || "COMANDANTE";
    const empresa = localStorage.getItem("nexus_empresaNombre") || "NEXUS LOGISTICS";

    container.innerHTML = `
    <div class="p-6 lg:p-12 space-y-12 animate-in fade-in duration-1000 pb-48 max-w-[1800px] mx-auto bg-[#010409]">
        
        <header class="flex flex-col lg:flex-row justify-between items-center gap-8 border-b border-white/5 pb-12">
            <div class="relative pl-8">
                <div class="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-cyan-500 to-blue-600 shadow-[0_0_25px_#06b6d4]"></div>
                <h1 class="orbitron text-5xl font-black italic uppercase tracking-tighter text-white leading-none">${empresa}</h1>
                <p class="text-[10px] text-slate-500 font-black orbitron tracking-[0.6em] mt-4 uppercase">Status: Operacional // Aegis V35.5 // User: ${user}</p>
            </div>
            <div class="bg-[#0d1117] border ${config.clase} px-12 py-6 rounded-3xl text-center group cursor-help">
                <p class="text-[8px] font-black orbitron uppercase mb-1 tracking-[0.5em] text-slate-500">Nivel de Enlace</p>
                <p class="text-3xl font-black orbitron italic group-hover:scale-110 transition-transform">${plan}</p>
            </div>
        </header>

        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-6">
            ${renderBtn('Clientes', 'fa-users-gear', '#clientes', config.modulos.includes('clientes'))}
            ${renderBtn('Vehículos', 'fa-truck-fast', '#vehiculos', config.modulos.includes('vehiculos'))}
            ${renderBtn('Inventario', 'fa-boxes-stacked', '#inventario', config.modulos.includes('inventario'))}
            ${renderBtn('Caja Real', 'fa-money-bill-transfer', '#pagos', config.modulos.includes('pagos'))}
            ${renderBtn('Libro Contable', 'fa-file-invoice-dollar', '#contabilidad', config.modulos.includes('contabilidad'))}
            ${renderBtn('MarketX', 'fa-globe', '#marketplace', config.modulos.includes('marketplace'))}
            ${renderBtn('Nueva Misión', 'fa-plus-circle', '#publish', config.modulos.includes('publish'))}
            ${renderBtn('Reportes', 'fa-chart-simple', '#reportes', config.modulos.includes('reportes'))}
            ${renderBtn('Nómina Staff', 'fa-id-badge', '#nomina', config.modulos.includes('nomina'))}
            ${renderBtn('Gestión Staff', 'fa-people-group', '#staff', config.modulos.includes('staff'))}
            ${renderBtn('Audit Core', 'fa-shield-halved', '#finanzas-elite', config.modulos.includes('finanzas-elite'))}
            
            <button onclick="window.open('https://wa.me/17049419163', '_blank')" 
                class="flex flex-col items-center justify-center p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] hover:bg-emerald-500 hover:text-white transition-all group">
                <i class="fab fa-whatsapp text-xl mb-3 text-emerald-500 group-hover:text-white"></i>
                <p class="orbitron text-[8px] font-black uppercase tracking-widest text-emerald-500 group-hover:text-white">Soporte Directo</p>
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div onclick="location.hash='#vehiculos'" class="cursor-pointer bg-gradient-to-r from-[#0d1117] to-transparent border border-white/5 hover:border-cyan-500/50 p-12 rounded-[3.5rem] group relative overflow-hidden transition-all shadow-2xl">
                <i class="fas fa-screwdriver-wrench absolute -right-8 -bottom-8 text-9xl text-white/5 rotate-12 group-hover:scale-110 transition-transform"></i>
                <h3 class="orbitron text-[10px] text-cyan-500 mb-2 uppercase tracking-[0.4em] font-black">Control de Procesos</h3>
                <p class="text-4xl font-black orbitron text-white italic uppercase tracking-tighter">Misiones en Rampa</p>
            </div>

            <div onclick="${(config.modulos.includes('gerenteAI')) ? "location.hash='#gerenteAI'" : "Swal.fire('MÓDULO IA','Eleve a Plan ELITE para activar proyecciones predictivas.','warning')"}" 
                class="cursor-pointer bg-gradient-to-br from-indigo-950/20 to-black border border-white/10 hover:border-purple-500/50 p-12 rounded-[3.5rem] group relative overflow-hidden transition-all">
                <i class="fas fa-brain absolute -right-8 -bottom-8 text-9xl text-purple-500/10 group-hover:rotate-6 transition-transform"></i>
                <h3 class="orbitron text-[10px] text-purple-400 mb-2 uppercase tracking-[0.4em] font-black">Inteligencia de Flota</h3>
                <p class="text-4xl font-black orbitron text-white italic uppercase tracking-tighter">Gerente <span class="text-purple-500">AI</span> V6.0</p>
            </div>
        </div>

        <div id="hudKpis" class="grid grid-cols-2 md:grid-cols-4 gap-6"></div>

        <div class="grid lg:grid-cols-12 gap-8">
            <div class="lg:col-span-4 bg-[#0d1117] p-12 rounded-[4rem] border border-white/5">
                <h4 class="orbitron text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-10 border-l-4 border-cyan-500 pl-6">Productividad Técnica</h4>
                <div id="techEfficiency" class="space-y-8"></div>
            </div>

            <div class="lg:col-span-8 bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 relative overflow-hidden flex flex-col justify-center min-h-[400px]">
                <div class="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent"></div>
                <div class="flex items-center gap-6 mb-8 relative z-10">
                    <div class="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)]"><i class="fas fa-satellite-dish animate-pulse"></i></div>
                    <h5 class="orbitron text-xl font-black uppercase italic tracking-tighter">Nexus Intelligence Feed</h5>
                </div>
                <p id="txtAI" class="text-slate-400 text-xl leading-relaxed max-w-3xl font-medium italic relative z-10">Analizando métricas de rendimiento...</p>
                <div id="btnAI" class="mt-12 relative z-10"></div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            ${renderFooterKpi('Ticket Promedio (USD)', 'valTicket')}
            ${renderFooterKpi('Flujo Bruto', 'valRevenue')}
            ${renderFooterKpi('Margen Est. (30%)', 'valProfit')}
        </div>
    </div>`;
}

// --- 🛠️ 5. MOTOR DE ACTUALIZACIÓN DE DATOS ---
function updateNumbers(s, plan) {
    const hud = document.getElementById("hudKpis");
    const kpis = [
        { l: "Revenue Total", v: `$${s.revenue.toLocaleString()}`, c: "text-emerald-400" },
        { l: "Total Órdenes", v: s.count, c: "text-white" },
        { l: "Licencia Actual", v: plan, c: "text-cyan-400" },
        { l: "Salud del Sistema", v: "OPTIMAL", c: "text-orange-500" }
    ];
    hud.innerHTML = kpis.map(k => `
        <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-colors">
            <p class="text-[8px] text-slate-600 orbitron font-black uppercase mb-3 tracking-widest">${k.l}</p>
            <p class="text-2xl font-black orbitron ${k.c}">${k.v}</p>
        </div>`).join("");

    document.getElementById("valTicket").innerText = `$${Math.round(s.avgTicket).toLocaleString()}`;
    document.getElementById("valRevenue").innerText = `$${s.revenue.toLocaleString()}`;
    document.getElementById("valProfit").innerText = `$${Math.round(s.revenue * 0.30).toLocaleString()}`;
}

function renderStaffEfficiency(staff) {
    const container = document.getElementById("techEfficiency");
    if(!container) return;
    container.innerHTML = staff.slice(0, 4).map(([name, val]) => `
        <div class="space-y-3">
            <div class="flex justify-between text-[10px] orbitron font-bold">
                <span class="text-slate-500 uppercase">${name}</span>
                <span class="text-white font-black italic">$${val.toLocaleString()}</span>
            </div>
            <div class="h-1.5 bg-black/80 rounded-full overflow-hidden p-[1px]">
                <div class="h-full bg-gradient-to-r from-cyan-900 to-cyan-400 shadow-[0_0_15px_#06b6d4] transition-all duration-[2000ms]" style="width: ${Math.min((val/1500000)*100, 100)}%"></div>
            </div>
        </div>`).join("");
}

function deployAIAssistant(stats, hasAI) {
    const txt = document.getElementById("txtAI");
    const btn = document.getElementById("btnAI");
    if(!hasAI) {
        txt.innerHTML = "Protocolo <span class='text-purple-500'>GERENTE AI</span> inactivo. Su plan actual no permite la autogestión de inventarios ni el análisis predictivo de rampa.";
        btn.innerHTML = `<button onclick="location.hash='#pagos'" class="px-10 py-4 bg-purple-600 text-white orbitron text-[10px] font-black rounded-2xl hover:bg-white hover:text-black transition-all shadow-lg">UPGRADE A NÚCLEO AI</button>`;
    } else {
        txt.innerHTML = `Comandante, Nexus reporta ingresos de <span class='text-cyan-400 font-black'>$${stats.revenue.toLocaleString()}</span>. El análisis de flujo sugiere que <span class='text-white font-bold underline'>${stats.staff[0]?.[0] || 'la flota'}</span> tiene un potencial de escalado del 22%. ¿Desea ejecutar el briefing ejecutivo?`;
        btn.innerHTML = `<button onclick="location.hash='#gerenteAI'" class="px-10 py-4 bg-white text-black orbitron text-[10px] font-black rounded-2xl hover:bg-cyan-500 hover:text-white transition-all shadow-xl">ABRIR COMANDO ESTRATÉGICO</button>`;
    }
}

function renderFooterKpi(label, id) {
    return `
    <div class="bg-black/20 border border-white/5 p-12 rounded-[4rem] text-center backdrop-blur-sm group hover:border-white/20 transition-all">
        <p class="text-[9px] text-slate-600 orbitron font-black uppercase mb-4 tracking-[0.4em]">${label}</p>
        <p id="${id}" class="text-4xl font-black orbitron text-white italic tracking-tighter group-hover:text-cyan-400 transition-colors">$ 0</p>
    </div>`;
}

// --- 🛰️ 6. ROUTER DINÁMICO (INTEGRACIÓN TOTAL) ---
const ejecutarRouter = async () => {
    const hash = window.location.hash;
    const container = document.getElementById("main-content") || document.querySelector("#app");
    if (!container) return;

    // Rutas con Renderizado Externo
    if (hash === '#marketplace') {
        container.innerHTML = `<iframe src="marketplace.html" style="width:100%; height:100vh; border:none;" class="animate-in fade-in duration-500"></iframe>`;
        return;
    } 
    
    if (hash === '#publish') {
        // Cargamos el módulo JS de publicación que creamos antes
        try {
            const modulo = await import('./modules/publish_mision.js');
            modulo.default(container);
        } catch(e) { console.error("Error cargando Módulo de Publicación", e); }
        return;
    }

    // Rutas de Inteligencia de Negocios
    if (hash === '#gerenteAI') {
        try {
            const modulo = await import('./modules/gerenteAI.js');
            modulo.default(container);
        } catch(e) { console.error("Error en Despliegue de Módulo AI", e); }
    }
    
    if (hash === '#finanzas-elite') {
        try {
            const modulo = await import('./modules/finanzas_elite.js');
            modulo.default(container);
        } catch(e) { console.error("Error en Despliegue de Auditoría", e); }
    }

    if (hash === '#staff') {
        try {
            const modulo = await import('./modules/staff.js');
            modulo.default(container);
        } catch(e) { console.error("Error cargando Staff", e); }
    }
};

window.addEventListener('hashchange', ejecutarRouter);
window.addEventListener('load', ejecutarRouter);
