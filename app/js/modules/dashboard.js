/**
 * dashboard.js - NEXUS-X AEGIS ULTIMA V50.1 🛰️
 * NÚCLEO DE COMANDO CENTRAL - TallerPRO360 SAP-GEN 2030
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { db } from "../core/firebase-config.js";
import { 
    collection, query, where, getDocs, limit, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- 🛡️ 1. PROTOCOLO DE SEGURIDAD Y PERMISOS POR ROL ---
const ROLES_PERMISOS = {
    "TECNICO": {
        label: "OPERADOR TÁCTICO",
        color: "text-emerald-400",
        modulos: ['ordenes', 'vehiculos'] 
    },
    "ADMIN": {
        label: "CONTROL LOGÍSTICO",
        color: "text-amber-400",
        // Acceso total excepto Finanzas Elite y Gerente AI
        modulos: [
            'clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 
            'contabilidad', 'reportes', 'staff', 'nomina', 'marketplace_bridge', 'publish_mision'
        ]
    },
    "DUENO": {
        label: "COMANDANTE CORE",
        color: "text-cyan-400",
        // Acceso Total a la infraestructura SAP
        modulos: [
            'clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 'contabilidad', 
            'gerenteAI', 'reportes', 'marketplace_bridge', 'publish_mision', 
            'staff', 'nomina', 'finanzas_elite'
        ]
    }
};

const PLANES_UI = {
    "ELITE": "border-cyan-500 text-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.3)]",
    "PRO": "border-purple-500 text-purple-400",
    "BASICO": "border-blue-500 text-blue-400"
};

// --- 🚀 2. MOTOR DE INYECCIÓN ---
export default async function dashboard(container) {
    const empresaId = localStorage.getItem("empresaId");
    const rol = (localStorage.getItem("rol") || "TECNICO").toUpperCase();
    const plan = (localStorage.getItem("planTipo") || "ELITE").toUpperCase();
    
    if (!empresaId) { location.hash = "#login"; return; }

    renderInterface(container, plan, rol);
    await ejecutarRouter();

    if (window.location.hash === "" || window.location.hash === "#dashboard") {
        cargarBI(empresaId, plan, rol);
    }
}

// --- 🛠️ 3. ARQUITECTURA VISUAL (SAP-STYLE) ---
function renderInterface(container, plan, rol) {
    const empresa = localStorage.getItem("nexus_empresaNombre") || "TallerPRO360";
    const uiRol = ROLES_PERMISOS[rol];
    const uiPlan = PLANES_UI[plan] || PLANES_UI["ELITE"];

    container.innerHTML = `
    <div id="nexus-aegis-view" class="p-4 lg:p-10 space-y-10 animate-in fade-in duration-700 pb-32 max-w-[1920px] mx-auto bg-[#010409]">
        
        <header class="flex flex-col lg:flex-row justify-between items-center border-b border-white/5 pb-10 gap-6">
            <div class="relative pl-6">
                <div class="absolute left-0 top-0 h-full w-1 bg-cyan-500 shadow-[0_0_20px_#06b6d4]"></div>
                <h1 class="orbitron text-4xl font-black italic uppercase text-white tracking-tighter">${empresa}</h1>
                <p class="text-[9px] text-slate-500 orbitron tracking-[0.5em] mt-2 font-black uppercase">AEGIS ULTIMA V50.1 // SAP-CORE 2030</p>
            </div>
            
            <div class="flex gap-3">
                <div class="bg-[#0d1117] border border-white/5 px-6 py-3 rounded-2xl text-center">
                    <p class="text-[7px] orbitron text-slate-600 uppercase mb-1">Authorization</p>
                    <p class="text-[10px] orbitron font-black ${uiRol.color}">${uiRol.label}</p>
                </div>
                <div class="bg-[#0d1117] border ${uiPlan} px-6 py-3 rounded-2xl text-center">
                    <p class="text-[7px] orbitron text-slate-600 uppercase mb-1">Security Plan</p>
                    <p class="text-[10px] orbitron font-black">${plan}</p>
                </div>
            </div>
        </header>

        <div id="main-content-area" class="space-y-12">
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-6">
                ${renderBtn('Clientes', 'fa-users-gear', '#clientes', rol, 'clientes')}
                ${renderBtn('Vehículos', 'fa-truck-fast', '#vehiculos', rol, 'vehiculos')}
                ${renderBtn('Inventario', 'fa-boxes-stacked', '#inventario', rol, 'inventario')}
                ${renderBtn('Órdenes', 'fa-screwdriver-wrench', '#ordenes', rol, 'ordenes')}
                
                ${renderBtn('Caja Real', 'fa-money-bill-transfer', '#pagos', rol, 'pagos')}
                ${renderBtn('Libro Contable', 'fa-file-invoice-dollar', '#contabilidad', rol, 'contabilidad')}
                ${renderBtn('Nómina', 'fa-id-badge', '#nomina', rol, 'nomina')}
                
                ${renderBtn('Gerente AI', 'fa-robot', '#gerenteAI', rol, 'gerenteAI')}
                ${renderBtn('MarketX', 'fa-globe', '#marketplace_bridge', rol, 'marketplace_bridge')}
                ${renderBtn('Nueva Misión', 'fa-plus-circle', '#publish_mision', rol, 'publish_mision')}
                
                ${renderBtn('Reportes', 'fa-chart-simple', '#reportes', rol, 'reportes')}
                ${renderBtn('Staff', 'fa-people-group', '#staff', rol, 'staff')}
                ${renderBtn('Audit Core', 'fa-shield-halved', '#finanzas_elite', rol, 'finanzas_elite')}
                
                <button onclick="window.open('https://wa.me/17049419163')" class="group p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500 transition-all flex flex-col items-center justify-center">
                    <i class="fab fa-whatsapp text-lg mb-2 text-emerald-500 group-hover:text-white"></i>
                    <span class="orbitron text-[7px] font-black uppercase text-emerald-500 group-hover:text-white tracking-widest">Soporte</span>
                </button>
            </div>

            <div id="hudKpis" class="grid grid-cols-2 md:grid-cols-4 gap-6"></div>
            
            <div class="grid lg:grid-cols-12 gap-6 ${rol !== 'DUENO' ? 'hidden' : ''}">
                <div class="lg:col-span-4 bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5">
                    <h4 class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6 border-l-2 border-cyan-500 pl-4">Staff Performance</h4>
                    <div id="techEfficiency" class="space-y-5"></div>
                </div>
                <div class="lg:col-span-8 bg-[#0d1117] p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden flex flex-col justify-center min-h-[300px]">
                    <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent"></div>
                    <div class="flex items-center gap-4 mb-6 relative z-10">
                        <div class="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center animate-pulse"><i class="fas fa-satellite"></i></div>
                        <h5 class="orbitron text-sm font-black uppercase tracking-tighter text-white">Nexus Intelligence Feed</h5>
                    </div>
                    <p id="txtAI" class="text-slate-400 text-lg leading-relaxed font-medium italic relative z-10">Escaneando métricas de rendimiento...</p>
                    <div id="btnAI" class="mt-8 relative z-10"></div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 ${rol !== 'DUENO' ? 'hidden' : ''}">
                ${renderKpiBox('Ticket Promedio', 'valTicket')}
                ${renderKpiBox('Flujo Bruto', 'valRevenue')}
                ${renderKpiBox('EBITDA Est. (30%)', 'valProfit')}
            </div>
        </div>
        <div id="nexus-module-container" class="hidden min-h-screen"></div>
    </div>`;
}

function renderBtn(name, icon, path, rol, modulo) {
    const tieneAcceso = ROLES_PERMISOS[rol].modulos.includes(modulo);
    if (!tieneAcceso) return ""; 

    return `
    <button onclick="location.hash='${path}'" class="group p-5 rounded-[2rem] bg-[#0d1117] border border-white/5 hover:border-cyan-500/50 hover:bg-white transition-all duration-500 text-left relative overflow-hidden">
        <i class="fas ${icon} text-lg mb-3 text-white group-hover:text-cyan-600"></i>
        <p class="orbitron text-[7px] font-black uppercase tracking-widest text-slate-500 group-hover:text-black">${name}</p>
    </button>`;
}

// --- 🛰️ 4. ROUTER DE MÓDULOS (PRECISIÓN QUIRÚRGICA) ---
const ejecutarRouter = async () => {
    const hash = window.location.hash;
    const mainView = document.getElementById("main-content-area");
    const modContainer = document.getElementById("nexus-module-container");

    if (!mainView || !modContainer) return;

    if (hash === "" || hash === "#dashboard") {
        mainView.classList.remove("hidden");
        modContainer.classList.add("hidden");
        return;
    }

    mainView.classList.add("hidden");
    modContainer.classList.remove("hidden");
    modContainer.innerHTML = `<div class="h-96 flex flex-col items-center justify-center bg-[#010409]"><div class="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div><p class="orbitron text-[8px] text-cyan-500 mt-4 tracking-[0.5em] animate-pulse">CONNECTING TO MODULE...</p></div>`;

    try {
        const moduleKey = hash.replace('#', '');
        // El import ahora cargará exactamente el nombre del archivo en /modules/
        const modulo = await import(`./modules/${moduleKey}.js?v=${Date.now()}`);
        if (modulo?.default) {
            modContainer.innerHTML = "";
            await modulo.default(modContainer);
        }
    } catch (err) {
        console.error("ROUTING_FAILURE", err);
        location.hash = "#dashboard";
    }
};

// --- 📊 5. BUSINESS INTELLIGENCE & HUD ---
async function cargarBI(empresaId, plan, rol) {
    try {
        const snap = await getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId), limit(200)));
        const data = snap.docs.map(d => d.data());
        const stats = {
            revenue: data.reduce((acc, o) => acc + (Number(o.total) || 0), 0),
            count: data.length,
            ticket: data.length ? (data.reduce((acc, o) => acc + (Number(o.total) || 0), 0) / data.length) : 0,
            staff: processStaff(data)
        };

        updateHUD(stats, plan, rol);
        if (rol === "DUENO") renderEfficiency(stats.staff);
        deployAI(stats, rol === "DUENO");
    } catch (err) { console.error("AEGIS_BI_ERROR", err); }
}

function updateHUD(s, plan, rol) {
    const hud = document.getElementById("hudKpis");
    if(!hud) return;
    
    const items = rol === "DUENO" ? [
        { l: "Revenue", v: `$${s.revenue.toLocaleString()}`, c: "text-emerald-400" },
        { l: "Órdenes", v: s.count, c: "text-white" },
        { l: "Plan", v: plan, c: "text-cyan-400" },
        { l: "Audit", v: "CLEAN", c: "text-orange-500" }
    ] : [
        { l: "Mis Órdenes", v: s.count, c: "text-emerald-400" },
        { l: "Status", v: "ONLINE", c: "text-white" },
        { l: "Nodo", v: plan, c: "text-cyan-400" },
        { l: "Turno", v: "ACTIVO", c: "text-orange-500" }
    ];

    hud.innerHTML = items.map(i => `
        <div class="bg-[#0d1117] p-6 rounded-3xl border border-white/5">
            <p class="text-[7px] orbitron font-black text-slate-600 uppercase mb-2 tracking-widest">${i.l}</p>
            <p class="text-xl font-black orbitron ${i.c}">${i.v}</p>
        </div>`).join("");

    if(rol === "DUENO") {
        document.getElementById("valTicket").innerText = `$${Math.round(s.ticket).toLocaleString()}`;
        document.getElementById("valRevenue").innerText = `$${s.revenue.toLocaleString()}`;
        document.getElementById("valProfit").innerText = `$${Math.round(s.revenue * 0.3).toLocaleString()}`;
    }
}

function processStaff(data) {
    const staff = {};
    data.forEach(o => {
        const t = o.tecnico || "Sin Asignar";
        staff[t] = (staff[t] || 0) + (Number(o.total) || 0);
    });
    return Object.entries(staff).sort((a,b) => b[1] - a[1]);
}

function renderEfficiency(staff) {
    const container = document.getElementById("techEfficiency");
    if(!container) return;
    container.innerHTML = staff.slice(0, 5).map(([name, val]) => `
        <div class="space-y-2">
            <div class="flex justify-between text-[8px] orbitron font-bold uppercase text-slate-400"><span>${name}</span><span class="text-white">$${val.toLocaleString()}</span></div>
            <div class="h-1 bg-black rounded-full overflow-hidden"><div class="h-full bg-cyan-500" style="width: ${Math.min((val/1500000)*100, 100)}%"></div></div>
        </div>`).join("");
}

function deployAI(s, isOwner) {
    const txt = document.getElementById("txtAI");
    const btn = document.getElementById("btnAI");
    if(!txt) return;
    if(!isOwner) {
        txt.innerText = "Sincronizando con base de datos central...";
    } else {
        txt.innerHTML = `Comandante, el flujo de <span class="text-cyan-400 font-black">$${s.revenue.toLocaleString()}</span> sugiere una carga operativa alta. ¿Ejecutamos reporte para socios?`;
        btn.innerHTML = `<button onclick="location.hash='#reportes'" class="px-8 py-3 bg-white text-black orbitron text-[9px] font-black rounded-xl hover:bg-cyan-500 transition-all">SISTEMA DE REPORTES</button>`;
    }
}

function renderKpiBox(label, id) {
    return `<div class="bg-black/20 border border-white/5 p-8 rounded-[2.5rem] text-center"><p class="text-[7px] text-slate-600 orbitron font-black uppercase mb-3 tracking-widest">${label}</p><p id="${id}" class="text-2xl font-black orbitron text-white italic">$ 0</p></div>`;
}

window.addEventListener('hashchange', ejecutarRouter);
