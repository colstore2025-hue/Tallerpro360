/**
 * dashboard.js - NEXUS-X AEGIS V35.5 🛰️
 * SISTEMA UNIFICADO DE COMANDO CENTRAL - EDICIÓN ERP EMPRESARIAL
 */

import { db } from "../core/firebase-config.js";
import { 
    collection, query, where, getDocs, limit 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const PERMISOS = {
    "GRATI-CORE": { modulos: ['clientes', 'vehiculos', 'ordenes', 'pagos', 'contabilidad', 'soporte'], clase: "border-slate-700 text-slate-400" },
    "BASICO": { modulos: ['clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 'contabilidad', 'soporte'], clase: "border-blue-500 text-blue-400" },
    "PRO": { modulos: ['clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 'contabilidad', 'gerenteAI', 'reportes', 'marketplace', 'publish', 'soporte'], clase: "border-purple-500 text-purple-400" },
    "ELITE": { modulos: ['clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 'contabilidad', 'gerenteAI', 'reportes', 'marketplace', 'publish', 'staff', 'nomina', 'finanzas_elite', 'soporte'], clase: "border-cyan-500 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)]" }
};

export default async function dashboard(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const planActual = (localStorage.getItem("nexus_plan") || "GRATI-CORE").toUpperCase();
    const config = PERMISOS[planActual] || PERMISOS["GRATI-CORE"];
    
    if (!empresaId) {
        location.hash = "#login";
        return;
    }

    renderInterface(container, planActual, config);
    // 🚀 Lanzar el router inmediatamente para capturar el hash actual
    await ejecutarRouter();

    if (window.location.hash === "" || window.location.hash === "#dashboard") {
        try {
            const snap = await getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId), limit(100)));
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const stats = processBI(data);
            updateNumbers(stats, planActual);
            renderStaffEfficiency(stats.staff);
            deployAIAssistant(stats, config.modulos.includes('gerenteAI'));
        } catch (err) { console.error("BI_LOAD_FAILURE", err); }
    }
}

// ... (Funciones processBI, renderBtn, updateNumbers, renderStaffEfficiency, deployAIAssistant, renderFooterKpi se mantienen igual) ...

function renderBtn(name, icon, path, habilitado) {
    const action = habilitado 
        ? `onclick="location.hash='${path}'"` 
        : `onclick="Swal.fire({icon:'lock', title:'ACCESO RESTRINGIDO', text:'Módulo exclusivo para planes PRO/ELITE.', background:'#0d1117', color:'#fff', confirmButtonColor:'#06b6d4'})"`;
    
    return `
    <button ${action} class="group p-6 rounded-[2rem] bg-[#0d1117] border border-white/5 hover:border-cyan-500/50 hover:bg-white hover:scale-[1.03] transition-all duration-500 relative shadow-lg overflow-hidden">
        <div class="absolute inset-0 bg-cyan-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
        <i class="fas ${icon} text-xl mb-4 ${habilitado ? 'text-white group-hover:text-cyan-600' : 'text-slate-800'}"></i>
        <p class="orbitron text-[8px] font-black uppercase tracking-[0.3em] ${habilitado ? 'text-slate-400 group-hover:text-black' : 'text-slate-800'}">${name}</p>
    </button>`;
}

function renderInterface(container, plan, config) {
    const empresa = localStorage.getItem("nexus_empresaNombre") || "NEXUS ERP";
    container.innerHTML = `
    <div id="nexus-aegis-view" class="p-6 lg:p-12 space-y-12 animate-in fade-in duration-1000 pb-48 max-w-[1800px] mx-auto bg-[#010409]">
        <header class="flex flex-col lg:flex-row justify-between items-center gap-8 border-b border-white/5 pb-12">
            <div class="relative pl-8">
                <div class="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-cyan-500 to-blue-600 shadow-[0_0_25px_#06b6d4]"></div>
                <h1 class="orbitron text-5xl font-black italic uppercase tracking-tighter text-white leading-none">${empresa}</h1>
                <p class="text-[10px] text-slate-500 font-black orbitron tracking-[0.6em] mt-4 uppercase">Status: Operacional // Aegis V35.5</p>
            </div>
            <div class="bg-[#0d1117] border ${config.clase} px-12 py-6 rounded-3xl text-center">
                <p class="text-[8px] font-black orbitron uppercase mb-1 tracking-[0.5em] text-slate-500">Nivel de Enlace</p>
                <p class="text-3xl font-black orbitron italic">${plan}</p>
            </div>
        </header>

        <div id="main-content-area" class="space-y-12">
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-6">
                ${renderBtn('Clientes', 'fa-users-gear', '#clientes', config.modulos.includes('clientes'))}
                ${renderBtn('Vehículos', 'fa-truck-fast', '#vehiculos', config.modulos.includes('vehiculos'))}
                ${renderBtn('Inventario', 'fa-boxes-stacked', '#inventario', config.modulos.includes('inventario'))}
                ${renderBtn('Caja Real', 'fa-money-bill-transfer', '#pagos', config.modulos.includes('pagos'))}
                ${renderBtn('Libro Contable', 'fa-file-invoice-dollar', '#contabilidad', config.modulos.includes('contabilidad'))}
                ${renderBtn('MarketX', 'fa-globe', '#marketplace', config.modulos.includes('marketplace'))}
                ${renderBtn('Nueva Misión', 'fa-plus-circle', '#publish', config.modulos.includes('publish'))}
                ${renderBtn('Reportes', 'fa-chart-simple', '#reportes', config.modulos.includes('reportes'))}
                ${renderBtn('Nómina', 'fa-id-badge', '#nomina', config.modulos.includes('nomina'))}
                ${renderBtn('Staff', 'fa-people-group', '#staff', config.modulos.includes('staff'))}
                ${renderBtn('Audit Core', 'fa-shield-halved', '#finanzas_elite', config.modulos.includes('finanzas_elite'))}
                <button onclick="window.open('https://wa.me/17049419163', '_blank')" class="flex flex-col items-center justify-center p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] hover:bg-emerald-500 hover:text-white transition-all group">
                    <i class="fab fa-whatsapp text-xl mb-3 text-emerald-500 group-hover:text-white"></i>
                    <p class="orbitron text-[8px] font-black uppercase tracking-widest text-emerald-500 group-hover:text-white">Soporte</p>
                </button>
            </div>
            <div id="hudKpis" class="grid grid-cols-2 md:grid-cols-4 gap-6"></div>
            <div class="grid lg:grid-cols-12 gap-8">
                <div class="lg:col-span-4 bg-[#0d1117] p-12 rounded-[4rem] border border-white/5">
                    <h4 class="orbitron text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-10 border-l-4 border-cyan-500 pl-6">Eficiencia del Staff</h4>
                    <div id="techEfficiency" class="space-y-8"></div>
                </div>
                <div class="lg:col-span-8 bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 relative overflow-hidden flex flex-col justify-center min-h-[400px]">
                    <div class="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent"></div>
                    <div class="flex items-center gap-6 mb-8 relative z-10">
                        <div class="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center text-2xl shadow-2xl shadow-white/10"><i class="fas fa-satellite-dish animate-pulse"></i></div>
                        <h5 class="orbitron text-xl font-black uppercase italic tracking-tighter">Nexus Intelligence Feed</h5>
                    </div>
                    <p id="txtAI" class="text-slate-400 text-xl leading-relaxed max-w-3xl font-medium italic relative z-10">Iniciando protocolos...</p>
                    <div id="btnAI" class="mt-12 relative z-10"></div>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                ${renderFooterKpi('Ticket Promedio', 'valTicket')}
                ${renderFooterKpi('Flujo Bruto', 'valRevenue')}
                ${renderFooterKpi('Margen Est. (30%)', 'valProfit')}
            </div>
        </div>
        <div id="nexus-module-container" class="hidden min-h-[80vh] w-full bg-[#010409]"></div>
    </div>`;
}

// --- 🛰️ 6. ROUTER QUIRÚRGICO (REPARADO) ---
const ejecutarRouter = async () => {
    const hash = window.location.hash || "#dashboard";
    const mainView = document.getElementById("main-content-area");
    const modContainer = document.getElementById("nexus-module-container");

    if (!mainView || !modContainer) return;

    if (hash === "" || hash === "#dashboard") {
        mainView.classList.remove("hidden");
        modContainer.classList.add("hidden");
        modContainer.innerHTML = "";
        return;
    }

    // Activar vista de módulo
    mainView.classList.add("hidden");
    modContainer.classList.remove("hidden");
    modContainer.innerHTML = `
        <div class="w-full h-[60vh] flex flex-col items-center justify-center">
            <div class="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
            <p class="orbitron text-[7px] text-cyan-500 mt-6 tracking-[0.5em] animate-pulse">ENLAZANDO MÓDULO NEXUS-X...</p>
        </div>`;

    try {
        const routeKey = hash.replace('#', '');
        let fileName = `${routeKey}.js`;

        // 🚨 MAPEADOR DE EXCEPCIONES: Asegura que el hash coincida con el archivo físico
        if (routeKey === 'marketplace') fileName = 'marketplace_bridge.js';
        if (routeKey === 'publish') fileName = 'publish_mision.js';

        // Importación dinámica con ruta relativa forzada
        const modulo = await import(`./modules/${fileName}`);

        if (modulo && modulo.default) {
            modContainer.innerHTML = "";
            await modulo.default(modContainer);
        } else {
            throw new Error("Módulo sin export default");
        }
    } catch (error) {
        console.error("🚨 FALLO DE ENLACE:", error);
        modContainer.innerHTML = `
            <div class="w-full h-[60vh] flex flex-col items-center justify-center">
                <i class="fas fa-triangle-exclamation text-orange-500 text-4xl mb-6"></i>
                <h2 class="orbitron text-white text-xl font-black uppercase italic">Enlace Fallido</h2>
                <p class="text-slate-500 text-[8px] orbitron mt-2 uppercase tracking-widest">Error en: ${hash}</p>
                <button onclick="location.hash='#dashboard'" class="mt-8 px-8 py-3 bg-white text-black orbitron text-[9px] font-black rounded-xl">REGRESAR AL CORE</button>
            </div>`;
    }
};

window.addEventListener('hashchange', ejecutarRouter);
