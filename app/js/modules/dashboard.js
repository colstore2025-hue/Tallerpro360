/**
 * dashboard.js - NEXUS-X AEGIS V35.5 🛰️
 * SISTEMA UNIFICADO DE COMANDO CENTRAL - EDICIÓN SPA TOTAL
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { db } from "../core/firebase-config.js";
import { 
    collection, query, where, getDocs, limit, orderBy, onSnapshot, addDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- 🛡️ 1. PROTOCOLO DE AUTORIZACIÓN ---
const PERMISOS = {
    "GRATI-CORE": { modulos: ['clientes', 'vehiculos', 'ordenes', 'pagos', 'contabilidad', 'soporte'], clase: "border-slate-700 text-slate-400" },
    "BASICO": { modulos: ['clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 'contabilidad', 'soporte'], clase: "border-blue-500 text-blue-400" },
    "PRO": { modulos: ['clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 'contabilidad', 'gerenteAI', 'reportes', 'marketplace_bridge', 'publish_mision', 'soporte'], clase: "border-purple-500 text-purple-400" },
    "ELITE": { modulos: ['clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 'contabilidad', 'gerenteAI', 'reportes', 'marketplace_bridge', 'publish_mision', 'staff', 'nomina', 'finanzas_elite', 'soporte'], clase: "border-cyan-500 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)]" }
};

// --- 🚀 2. INYECTOR PRINCIPAL ---
export default async function dashboard(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const planActual = (localStorage.getItem("nexus_plan") || "GRATI-CORE").toUpperCase();
    const config = PERMISOS[planActual] || PERMISOS["GRATI-CORE"];
    
    if (!empresaId) { location.hash = "#login"; return; }

    renderInterface(container, planActual, config);
    
    // Router Inicial
    ejecutarRouter();

    if (window.location.hash === "" || window.location.hash === "#dashboard") {
        cargarEstadisticas(empresaId, planActual, config);
    }
}

async function cargarEstadisticas(empresaId, plan, config) {
    try {
        const snap = await getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId), limit(100)));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const stats = processBI(data);
        updateNumbers(stats, plan);
        renderStaffEfficiency(stats.staff);
        deployAIAssistant(stats, config.modulos.includes('gerenteAI'));
    } catch (err) { console.error("BI_LOAD_FAILURE", err); }
}

// --- 🧠 3. MOTOR BI ---
function processBI(ordenes) {
    let rev = 0;
    const staff = {};
    const validas = ordenes.filter(o => o.estado !== 'CANCELADO');
    validas.forEach(o => {
        const monto = Number(o.costos_totales?.total_general || o.total || 0);
        rev += monto;
        const tec = o.tecnico || "OPERADOR_S/N";
        staff[tec] = (staff[tec] || 0) + monto;
    });
    return {
        revenue: rev, count: validas.length,
        avgTicket: validas.length > 0 ? rev / validas.length : 0,
        staff: Object.entries(staff).sort((a,b) => b[1] - a[1])
    };
}

// --- 🛠️ 4. ARQUITECTURA VISUAL ---
function renderInterface(container, plan, config) {
    const empresa = localStorage.getItem("nexus_empresaNombre") || "NEXUS ERP";
    container.innerHTML = `
    <div id="nexus-aegis-view" class="p-6 lg:p-12 space-y-12 animate-in fade-in duration-1000 pb-48 max-w-[1800px] mx-auto bg-[#010409]">
        <header class="flex flex-col lg:flex-row justify-between items-center gap-8 border-b border-white/5 pb-12">
            <div class="relative pl-8">
                <div class="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-cyan-500 to-blue-600"></div>
                <h1 class="orbitron text-5xl font-black italic uppercase text-white">${empresa}</h1>
                <p class="text-[10px] text-slate-500 orbitron tracking-[0.6em] mt-4 uppercase">Status: Operacional // Aegis V35.5</p>
            </div>
            <div class="bg-[#0d1117] border ${config.clase} px-12 py-6 rounded-3xl text-center">
                <p class="text-3xl font-black orbitron italic">${plan}</p>
            </div>
        </header>

        <div id="main-content-area" class="space-y-12">
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
                ${renderBtn('Clientes', 'fa-users-gear', '#clientes', config.modulos.includes('clientes'))}
                ${renderBtn('Vehículos', 'fa-truck-fast', '#vehiculos', config.modulos.includes('vehiculos'))}
                ${renderBtn('Inventario', 'fa-boxes-stacked', '#inventario', config.modulos.includes('inventario'))}
                ${renderBtn('Caja Real', 'fa-money-bill-transfer', '#pagos', config.modulos.includes('pagos'))}
                ${renderBtn('MarketX', 'fa-globe', '#marketplace_bridge', config.modulos.includes('marketplace_bridge'))}
                ${renderBtn('Nueva Misión', 'fa-plus-circle', '#publish_mision', config.modulos.includes('publish_mision'))}
                ${renderBtn('Audit', 'fa-shield-halved', '#finanzas_elite', config.modulos.includes('finanzas_elite'))}
            </div>
            <div id="hudKpis" class="grid grid-cols-2 md:grid-cols-4 gap-6"></div>
            <div class="grid lg:grid-cols-12 gap-8">
                <div class="lg:col-span-4 bg-[#0d1117] p-12 rounded-[4rem] border border-white/5">
                    <h4 class="orbitron text-[10px] text-slate-500 mb-10 border-l-4 border-cyan-500 pl-6">Eficiencia del Staff</h4>
                    <div id="techEfficiency" class="space-y-8"></div>
                </div>
                <div class="lg:col-span-8 bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 relative flex flex-col justify-center min-h-[400px]">
                    <div class="flex items-center gap-6 mb-8 relative z-10">
                        <div class="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center text-2xl"><i class="fas fa-satellite-dish"></i></div>
                        <h5 class="orbitron text-xl font-black italic">Nexus Intelligence Feed</h5>
                    </div>
                    <p id="txtAI" class="text-slate-400 text-xl italic z-10">Iniciando protocolos...</p>
                    <div id="btnAI" class="mt-12 z-10"></div>
                </div>
            </div>
        </div>
        <div id="nexus-module-container" class="hidden min-h-screen w-full"></div>
    </div>`;
}

function renderBtn(name, icon, path, habilitado) {
    const action = habilitado ? `onclick="location.hash='${path}'"` : `onclick="alert('Módulo restringido')"` ;
    return `<button ${action} class="group p-6 rounded-[2rem] bg-[#0d1117] border border-white/5 hover:border-cyan-500/50 hover:bg-white transition-all relative">
        <i class="fas ${icon} text-xl mb-4 ${habilitado ? 'text-white group-hover:text-cyan-600' : 'text-slate-800'}"></i>
        <p class="orbitron text-[8px] font-black uppercase ${habilitado ? 'text-slate-400 group-hover:text-black' : 'text-slate-800'}">${name}</p>
    </button>`;
}

// --- 🛰️ 5. ROUTER DE PRECISIÓN ---
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
    modContainer.innerHTML = `<div class="w-full h-screen flex items-center justify-center bg-[#010409]"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-500"></div></div>`;

    try {
        if (hash === '#marketplace_bridge') {
            await NEXUS_CORE.renderMarket(modContainer);
        } else if (hash === '#publish_mision') {
            await NEXUS_CORE.renderPublish(modContainer);
        } else {
            // Carga dinámica para el resto
            const moduleKey = hash.replace('#', '');
            const modulo = await import(`./modules/${moduleKey}.js`);
            if (modulo.default) await modulo.default(modContainer);
        }
    } catch (error) {
        modContainer.innerHTML = `<div class="p-20 text-center"><h2 class="orbitron text-white">ERROR DE ENLACE</h2><button onclick="location.hash='#dashboard'" class="mt-4 text-cyan-500">Volver</button></div>`;
    }
};

// --- 🛠️ 6. NÚCLEO DE SERVICIOS (MARKET & PUBLISH) ---
const NEXUS_CORE = {
    renderMarket: async (container) => {
        container.innerHTML = `<div class="p-10"><h1 class="orbitron text-4xl font-black text-white mb-10 italic">MARKET<span class="text-cyan-400">X</span></h1><div id="grid-m" class="grid grid-cols-1 md:grid-cols-4 gap-6"></div></div>`;
        const grid = document.getElementById('grid-m');
        onSnapshot(query(collection(db, "marketplace"), orderBy("creadoEn", "desc")), (snap) => {
            grid.innerHTML = snap.docs.map(doc => {
                const p = doc.data();
                return `<div class="bg-[#0d1117] p-5 rounded-[2rem] border border-white/5 hover:border-cyan-500/40 transition-all">
                    <div class="aspect-square bg-black rounded-3xl mb-4 overflow-hidden"><img src="${p.imgUrl || ''}" class="w-full h-full object-cover opacity-70"></div>
                    <h3 class="text-xs font-black text-white uppercase truncate">${p.nombre}</h3>
                    <p class="text-cyan-400 font-black orbitron mt-2">${p.precio}</p>
                </div>`;
            }).join('');
        });
    },
    renderPublish: async (container) => {
        container.innerHTML = `
        <div class="p-10 max-w-xl mx-auto">
            <h1 class="orbitron text-2xl font-black text-white mb-8">NUEVA MISIÓN</h1>
            <form id="f-pub" class="space-y-4 bg-[#0d1117] p-8 rounded-[2rem] border border-white/5">
                <input type="text" id="n" required placeholder="NOMBRE" class="w-full p-4 bg-black border border-white/10 rounded-xl text-white">
                <input type="text" id="p" required placeholder="PRECIO" class="w-full p-4 bg-black border border-white/10 rounded-xl text-cyan-400">
                <button type="submit" class="w-full py-4 bg-white text-black orbitron font-black rounded-xl hover:bg-cyan-500">PUBLICAR</button>
            </form>
        </div>`;
        document.getElementById('f-pub').onsubmit = async (e) => {
            e.preventDefault();
            await addDoc(collection(db, "marketplace"), {
                nombre: document.getElementById('n').value.toUpperCase(),
                precio: document.getElementById('p').value,
                empresaId: localStorage.getItem("nexus_empresaId"),
                creadoEn: serverTimestamp()
            });
            location.hash = "#marketplace_bridge";
        };
    }
};

// --- Helpers ---
function updateNumbers(s, plan) {
    const hud = document.getElementById("hudKpis");
    if(!hud) return;
    hud.innerHTML = [
        { l: "Revenue Total", v: `$${s.revenue.toLocaleString()}`, c: "text-emerald-400" },
        { l: "Órdenes", v: s.count, c: "text-white" },
        { l: "Plan", v: plan, c: "text-cyan-400" },
        { l: "Status", v: "OPTIMAL", c: "text-orange-500" }
    ].map(k => `<div class="bg-[#0d1117] p-8 rounded-[2rem] border border-white/5">
        <p class="text-[8px] text-slate-600 orbitron font-black uppercase mb-2">${k.l}</p>
        <p class="text-2xl font-black orbitron ${k.c}">${k.v}</p>
    </div>`).join("");
}

function renderStaffEfficiency(staff) {
    const container = document.getElementById("techEfficiency");
    if(!container) return;
    container.innerHTML = staff.slice(0, 4).map(([name, val]) => `
        <div class="space-y-2">
            <div class="flex justify-between text-[10px] orbitron font-bold text-white uppercase"><span>${name}</span><span>$${val.toLocaleString()}</span></div>
            <div class="h-1 bg-black rounded-full overflow-hidden"><div class="h-full bg-cyan-500" style="width: ${Math.min((val/1500000)*100, 100)}%"></div></div>
        </div>`).join("");
}

function deployAIAssistant(stats, hasAI) {
    const txt = document.getElementById("txtAI");
    if(!txt) return;
    txt.innerHTML = hasAI 
        ? `Comandante, ingresos de <span class='text-cyan-400 font-black'>$${stats.revenue.toLocaleString()}</span> detectados.` 
        : "Protocolo <span class='text-purple-500'>GERENTE AI</span> inactivo.";
}

window.addEventListener('hashchange', ejecutarRouter);
