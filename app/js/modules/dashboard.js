/**
 * dashboard.js - NEXUS-X AEGIS V35.5 🛰️
 * SISTEMA UNIFICADO DE COMANDO CENTRAL - EDICIÓN ERP EMPRESARIAL
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { db } from "../core/firebase-config.js";
import { 
    collection, query, where, getDocs, limit 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- 🛡️ 1. PROTOCOLO DE AUTORIZACIÓN (CORREGIDO) ---
const PERMISOS = {
    "GRATI-CORE": { 
        modulos: ['clientes', 'vehiculos', 'ordenes', 'pagos', 'contabilidad', 'soporte'],
        clase: "border-slate-700 text-slate-400" 
    },
    "BASICO": { 
        modulos: ['clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 'contabilidad', 'soporte'],
        clase: "border-blue-500 text-blue-400"
    },
    "PRO": { 
        modulos: ['clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 'contabilidad', 'gerenteAI', 'reportes', 'marketplace', 'publish', 'soporte'],
        clase: "border-purple-500 text-purple-400"
    },
    "ELITE": { 
        // 🚨 CORRECCIÓN: Se cerró la comilla en 'marketplace' y se alinearon nombres
        modulos: ['clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 'contabilidad', 'gerenteAI', 'reportes', 'marketplace', 'publish', 'staff', 'nomina', 'finanzas_elite', 'soporte'],
        clase: "border-cyan-500 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)]"
    }
};

// --- 🚀 2. INYECTOR PRINCIPAL ---
export default async function dashboard(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const planActual = (localStorage.getItem("nexus_plan") || "GRATI-CORE").toUpperCase();
    const config = PERMISOS[planActual] || PERMISOS["GRATI-CORE"];
    
    if (!empresaId) {
        location.hash = "#login";
        return;
    }

    renderInterface(container, planActual, config);
    // Ejecutar router inicial por si ya viene con hash
    await ejecutarRouter();

    if (window.location.hash === "" || window.location.hash === "#dashboard") {
        try {
            const snap = await getDocs(query(
                collection(db, "ordenes"), 
                where("empresaId", "==", empresaId), 
                limit(100)
            ));
            
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const stats = processBI(data);

            updateNumbers(stats, planActual);
            renderStaffEfficiency(stats.staff);
            deployAIAssistant(stats, config.modulos.includes('gerenteAI'));
        } catch (err) {
            console.error("BI_LOAD_FAILURE", err);
        }
    }
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
        revenue: rev,
        count: validas.length,
        avgTicket: validas.length > 0 ? rev / validas.length : 0,
        staff: Object.entries(staff).sort((a,b) => b[1] - a[1])
    };
}

// --- 🛠️ 4. ARQUITECTURA VISUAL (CORRECCIÓN DE LINKS) ---
function renderBtn(name, icon, path, habilitado) {
    const action = habilitado 
        ? `onclick="location.hash='${path}'"` 
        : `onclick="Swal.fire({icon:'lock', title:'ACCESO RESTRINGIDO', text:'Módulo exclusivo para planes ELITE.', background:'#0d1117', color:'#fff', confirmButtonColor:'#06b6d4'})"`;
    
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
        <div id="nexus-module-container" class="hidden min-h-screen w-full"></div>
    </div>`;
}

// --- ⚙️ 5. ACTUALIZACIONES DE UI ---
function updateNumbers(s, plan) {
    const hud = document.getElementById("hudKpis");
    if(!hud) return;
    hud.innerHTML = [
        { l: "Revenue Total", v: `$${s.revenue.toLocaleString()}`, c: "text-emerald-400" },
        { l: "Total Órdenes", v: s.count, c: "text-white" },
        { l: "Plan Activo", v: plan, c: "text-cyan-400" },
        { l: "Status", v: "OPTIMAL", c: "text-orange-500" }
    ].map(k => `
        <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5">
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
            <div class="flex justify-between text-[10px] orbitron font-bold"><span class="text-slate-500 uppercase">${name}</span><span class="text-white font-black italic">$${val.toLocaleString()}</span></div>
            <div class="h-1 bg-black rounded-full overflow-hidden"><div class="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]" style="width: ${Math.min((val/1500000)*100, 100)}%"></div></div>
        </div>`).join("");
}

function deployAIAssistant(stats, hasAI) {
    const txt = document.getElementById("txtAI");
    const btn = document.getElementById("btnAI");
    if(!txt) return;
    if(!hasAI) {
        txt.innerHTML = "Protocolo <span class='text-purple-500'>GERENTE AI</span> inactivo.";
        btn.innerHTML = `<button onclick="location.hash='#pagos'" class="px-10 py-4 bg-purple-600 text-white orbitron text-[10px] font-black rounded-2xl">UPGRADE AI</button>`;
    } else {
        txt.innerHTML = `Comandante, ingresos de <span class='text-cyan-400 font-black'>$${stats.revenue.toLocaleString()}</span> detectados. ¿Desea ejecutar el análisis?`;
        btn.innerHTML = `<button onclick="location.hash='#gerenteAI'" class="px-10 py-4 bg-white text-black orbitron text-[10px] font-black rounded-2xl">ABRIR COMANDO ESTRATÉGICO</button>`;
    }
}

function renderFooterKpi(label, id) {
    return `<div class="bg-black/20 border border-white/5 p-12 rounded-[4rem] text-center"><p class="text-[9px] text-slate-600 orbitron font-black uppercase mb-4 tracking-[0.4em]">${label}</p><p id="${id}" class="text-4xl font-black orbitron text-white italic">$ 0</p></div>`;
}

// --- 🛰️ 6. ROUTER QUIRÚRGICO RECONSTRUIDO (ANTI-ERROR DE RUTA) ---
const ejecutarRouter = async () => {
    // 1. Limpiamos el hash de extensiones accidentales como .html o .js
    let hash = window.location.hash.replace('.html', '').replace('.js', '');
    
    const mainView = document.getElementById("main-content-area");
    const modContainer = document.getElementById("nexus-module-container");

    if (!mainView || !modContainer) return;

    if (hash === "" || hash === "#dashboard") {
        mainView.classList.remove("hidden");
        modContainer.classList.add("hidden");
        modContainer.innerHTML = "";
        return;
    }

    mainView.classList.add("hidden");
    modContainer.classList.remove("hidden");
    modContainer.innerHTML = `<div class="w-full h-[80vh] flex flex-col items-center justify-center bg-[#010409]"><div class="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div><p class="orbitron text-[8px] text-cyan-500 mt-6 tracking-[0.5em] animate-pulse">SINCRO NEXUS-X...</p></div>`;

    try {
        let modulo;
        // 🚨 EL PUENTE MAESTRO: Mapeo exacto a los archivos en /modules/
        switch(hash) {
            case '#marketplace':
                modulo = await import('./modules/marketplace_bridge.js');
                break;
            case '#publish':
                modulo = await import('./modules/publish_mision.js');
                break;
            case '#finanzas_elite':
                modulo = await import('./modules/finanzas_elite.js');
                break;
            default:
                // Carga genérica para los demás (clientes.js, vehiculos.js, etc)
                modulo = await import(`./modules/${hash.replace('#', '')}.js`);
                break;
        }

        if (modulo && modulo.default) {
            modContainer.innerHTML = "";
            // Ejecutamos la función exportada del archivo .js
            await modulo.default(modContainer);
        } else {
            throw new Error("Módulo no exporta 'export default function...'");
        }

    } catch (error) {
        console.error("🚨 FALLO DE ENLACE:", error);
        modContainer.innerHTML = `
            <div class="w-full h-[80vh] flex flex-col items-center justify-center bg-[#010409]">
                <i class="fas fa-triangle-exclamation text-red-500 text-6xl mb-8 animate-pulse"></i>
                <h2 class="orbitron text-white text-2xl font-black italic">ENLACE FALLIDO</h2>
                <p class="text-slate-500 text-[10px] orbitron mt-4 uppercase">Ruta original: ${window.location.hash}</p>
                <p class="text-cyan-500 text-[8px] orbitron mt-2 uppercase tracking-widest">Verifica que el archivo JS en /modules/ exporte una función default</p>
                <div class="mt-10 flex gap-4">
                    <button onclick="location.hash='#dashboard'" class="px-8 py-4 bg-white text-black orbitron text-[9px] font-black rounded-2xl">CORE</button>
                    <button onclick="location.reload()" class="px-8 py-4 border border-white/10 text-white orbitron text-[9px] font-black rounded-2xl">REINTENTAR</button>
                </div>
            </div>`;
    }
};

// Escucha de cambios en la URL
window.addEventListener('hashchange', ejecutarRouter);
