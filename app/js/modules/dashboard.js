/**
 * dashboard.js - NEXUS-X AEGIS V35.5 🛰️
 * SISTEMA UNIFICADO DE COMANDO CENTRAL - EDICIÓN ERP EMPRESARIAL
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 * @strategy Zero-Latency / ERP-Scaling / Data-Integrity
 */

import { db } from "../core/firebase-config.js";
import { 
    collection, query, where, getDocs, orderBy, limit 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- 🛡️ 1. PROTOCOLO DE AUTORIZACIÓN Y ACCESO (POLÍTICA ERP) ---
const PERMISOS = {
    "GRATI-CORE": { 
        modulos: ['clientes', 'vehiculos', 'ordenes', 'pagos', 'contabilidad', 'soporte'],
        clase: "border-slate-700 text-slate-400" 
    },
    "BASICO": { 
        modulos: ['clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 'contabilidad', 'soporte'],
        clase: "border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
    },
    "PRO": { 
        modulos: ['clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 'contabilidad', 'gerenteAI', 'reportes', 'marketplace', 'publish', 'soporte'],
        clase: "border-purple-500 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
    },
    "ELITE": { 
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
        console.error("NEXUS_AUTH_ERROR: ID de empresa no detectado.");
        location.hash = "#login";
        return;
    }

    // Renderizado base de la estructura (Efecto instantáneo)
    renderInterface(container, planActual, config);

    try {
        // Ejecución de Router al cargar para capturar hashes directos
        await ejecutarRouter();

        // Si estamos en el home del dashboard, cargamos BI
        if (window.location.hash === "" || window.location.hash === "#dashboard") {
            const snap = await getDocs(query(
                collection(db, "ordenes"), 
                where("empresaId", "==", empresaId), 
                limit(100)
            ));
            
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const stats = processBI(data);

            // Actualización de HUD con animación
            setTimeout(() => {
                updateNumbers(stats, planActual);
                renderStaffEfficiency(stats.staff);
                deployAIAssistant(stats, config.modulos.includes('gerenteAI'));
            }, 100);
        }

    } catch (err) {
        console.error("AEGIS_CRITICAL_FAILURE", err);
    }
}

// --- 🧠 3. MOTOR DE INTELIGENCIA DE NEGOCIO ---
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

// --- 🛠️ COMPONENTES DE INTERFAZ ERP ---
function renderBtn(name, icon, path, habilitado) {
    const action = habilitado 
        ? `onclick="location.hash='${path}'"` 
        : `onclick="Swal.fire({icon:'lock', title:'MÓDULO RESTRINGIDO', text:'Actualice a Plan PRO/ELITE para gestionar esta función corporativa.', background:'#0d1117', color:'#fff'})"`;
    
    return `
    <button ${action} class="group p-6 rounded-[2rem] bg-[#0d1117] border border-white/5 hover:border-cyan-500/50 hover:bg-white hover:scale-[1.03] transition-all duration-500 overflow-hidden relative shadow-lg">
        <div class="absolute inset-0 bg-cyan-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
        <i class="fas ${icon} text-xl mb-4 ${habilitado ? 'text-white group-hover:text-cyan-600' : 'text-slate-800'}"></i>
        <p class="orbitron text-[8px] font-black uppercase tracking-[0.3em] ${habilitado ? 'text-slate-400 group-hover:text-black' : 'text-slate-800'}">${name}</p>
    </button>`;
}

function renderInterface(container, plan, config) {
    const user = localStorage.getItem("nexus_userName") || "COMANDANTE";
    const empresa = localStorage.getItem("nexus_empresaNombre") || "TALLERPRO360";

    container.innerHTML = `
    <div id="nexus-aegis-view" class="p-6 lg:p-12 space-y-12 animate-in fade-in duration-1000 pb-48 max-w-[1800px] mx-auto bg-[#010409]">
        
        <header class="flex flex-col lg:flex-row justify-between items-center gap-8 border-b border-white/5 pb-12">
            <div class="relative pl-8">
                <div class="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-cyan-500 to-blue-600 shadow-[0_0_25px_#06b6d4]"></div>
                <h1 class="orbitron text-5xl font-black italic uppercase tracking-tighter text-white leading-none">${empresa}</h1>
                <p class="text-[10px] text-slate-500 font-black orbitron tracking-[0.6em] mt-4 uppercase">Status: Operacional // Aegis V35.5 // User: ${user}</p>
            </div>
            <div class="bg-[#0d1117] border ${config.clase} px-12 py-6 rounded-3xl text-center group cursor-help transition-all">
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
                class="flex flex-col items-center justify-center p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] hover:bg-emerald-500 hover:text-white transition-all group shadow-lg">
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

            <div onclick="${(config.modulos.includes('gerenteAI')) ? "location.hash='#gerenteAI'" : "Swal.fire('GERENTE AI', 'Requiere Nivel ELITE para análisis predictivo.', 'warning')"}" 
                class="cursor-pointer bg-gradient-to-br from-indigo-950/20 to-black border border-white/10 hover:border-purple-500/50 p-12 rounded-[3.5rem] group relative overflow-hidden transition-all shadow-2xl">
                <i class="fas fa-brain absolute -right-8 -bottom-8 text-9xl text-purple-500/10 group-hover:rotate-6 transition-transform"></i>
                <h3 class="orbitron text-[10px] text-purple-400 mb-2 uppercase tracking-[0.4em] font-black">Inteligencia de Flota</h3>
                <p class="text-4xl font-black orbitron text-white italic uppercase tracking-tighter">Gerente <span class="text-purple-500">AI</span> V6.0</p>
            </div>
        </div>

        <div id="hudKpis" class="grid grid-cols-2 md:grid-cols-4 gap-6"></div>

        <div class="grid lg:grid-cols-12 gap-8">
            <div class="lg:col-span-4 bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-inner">
                <h4 class="orbitron text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-10 border-l-4 border-cyan-500 pl-6">Eficiencia del Staff</h4>
                <div id="techEfficiency" class="space-y-8"></div>
            </div>

            <div class="lg:col-span-8 bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 relative overflow-hidden flex flex-col justify-center min-h-[400px]">
                <div class="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent"></div>
                <div class="flex items-center gap-6 mb-8 relative z-10">
                    <div class="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center text-2xl shadow-white/20 shadow-2xl"><i class="fas fa-satellite-dish animate-pulse"></i></div>
                    <h5 class="orbitron text-xl font-black uppercase italic tracking-tighter text-white">Nexus Intelligence Feed</h5>
                </div>
                <p id="txtAI" class="text-slate-400 text-xl leading-relaxed max-w-3xl font-medium italic relative z-10">Sincronizando con la red neuronal de procesos...</p>
                <div id="btnAI" class="mt-12 relative z-10"></div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            ${renderFooterKpi('Ticket Promedio', 'valTicket')}
            ${renderFooterKpi('Flujo Bruto', 'valRevenue')}
            ${renderFooterKpi('Margen Est. (30%)', 'valProfit')}
        </div>
    </div>`;
}

// --- ⚙️ 4. FUNCIONES DE ACTUALIZACIÓN ---
function updateNumbers(s, plan) {
    const hud = document.getElementById("hudKpis");
    if(!hud) return;
    const kpis = [
        { l: "Revenue Total", v: `$${s.revenue.toLocaleString()}`, c: "text-emerald-400" },
        { l: "Total Órdenes", v: s.count, c: "text-white" },
        { l: "Status Enlace", v: plan, c: "text-cyan-400" },
        { l: "Kernel Salud", v: "OPTIMAL", c: "text-orange-500" }
    ];
    hud.innerHTML = kpis.map(k => `
        <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 hover:border-white/20 transition-all">
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
            <div class="h-1.5 bg-black/80 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-cyan-900 to-cyan-400 shadow-[0_0_15px_#06b6d4] transition-all duration-[1500ms]" style="width: ${Math.min((val/1500000)*100, 100)}%"></div>
            </div>
        </div>`).join("");
}

function deployAIAssistant(stats, hasAI) {
    const txt = document.getElementById("txtAI");
    const btn = document.getElementById("btnAI");
    if(!txt) return;

    if(!hasAI) {
        txt.innerHTML = "Protocolo <span class='text-purple-500 font-bold'>GERENTE AI</span> inactivo. Su infraestructura actual no permite análisis de flujo o auditoría automatizada.";
        btn.innerHTML = `<button onclick="location.hash='#pagos'" class="px-10 py-4 bg-purple-600 text-white orbitron text-[10px] font-black rounded-2xl hover:bg-white hover:text-black transition-all shadow-lg">UPGRADE A NUCLEO ELITE</button>`;
    } else {
        txt.innerHTML = `Comandante, Nexus detecta un flujo de <span class='text-cyan-400 font-black'>$${stats.revenue.toLocaleString()}</span>. El técnico <span class='text-white font-bold underline'>${stats.staff[0]?.[0] || 'asignado'}</span> lidera la rampa. ¿Ejecutamos el análisis de rentabilidad forense?`;
        btn.innerHTML = `<button onclick="location.hash='#gerenteAI'" class="px-10 py-4 bg-white text-black orbitron text-[10px] font-black rounded-2xl hover:bg-cyan-500 hover:text-white transition-all shadow-xl">ABRIR CENTRO DE COMANDO AI</button>`;
    }
}

function renderFooterKpi(label, id) {
    return `
    <div class="bg-black/20 border border-white/5 p-12 rounded-[4rem] text-center backdrop-blur-sm group hover:border-cyan-500/20 transition-all shadow-xl">
        <p class="text-[9px] text-slate-600 orbitron font-black uppercase mb-4 tracking-[0.4em]">${label}</p>
        <p id="${id}" class="text-4xl font-black orbitron text-white italic tracking-tighter group-hover:text-cyan-400 transition-colors">$ 0</p>
    </div>`;
}

// --- 🛰️ 5. ROUTER DINÁMICO INTEGRADO (SIN CORTES) ---
const ejecutarRouter = async () => {
    const hash = window.location.hash;
    const container = document.getElementById("main-content") || document.querySelector("#app");
    if (!container || hash === "" || hash === "#dashboard") return;

    // Estética de carga ERP
    container.innerHTML = `<div class="w-full h-screen flex flex-col items-center justify-center bg-[#010409]">
        <div class="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        <p class="orbitron text-[10px] text-cyan-500 mt-8 tracking-[0.5em] animate-pulse">SINCRONIZANDO MÓDULO NEXUS...</p>
    </div>`;

    try {
        switch(hash) {
            case '#marketplace':
                container.innerHTML = `<iframe src="marketplace.html" style="width:100%; height:100vh; border:none;" class="animate-in fade-in duration-500"></iframe>`;
                break;
            
            case '#publish':
                const modPub = await import('./modules/publish_mision.js');
                modPub.default(container);
                break;

            case '#gerenteAI':
                const modAI = await import('./modules/gerenteAI.js');
                modAI.default(container);
                break;
            
            case '#finanzas-elite':
                const modFin = await import('./modules/finanzas_elite.js');
                modFin.default(container);
                break;

            case '#staff':
                const modStaff = await import('./modules/staff.js');
                modStaff.default(container);
                break;
            
            case '#vehiculos':
                const modVeh = await import('./modules/ordenes.js'); // Redirigimos a la rampa de órdenes
                modVeh.default(container);
                break;

            default:
                console.warn("Ruta no reconocida:", hash);
                // Si la ruta no existe, podríamos cargar un módulo por defecto o volver al dashboard
                break;
        }
    } catch (error) {
        console.error("ROUTER_EXECUTION_ERROR:", error);
        container.innerHTML = `<div class="p-20 text-center">
            <i class="fas fa-exclamation-triangle text-red-500 text-5xl mb-6"></i>
            <h2 class="orbitron text-white text-2xl font-black">FALLO DE ENLACE</h2>
            <p class="text-slate-500 mt-4 italic">El módulo solicitado no respondió. Verifique su conexión o nivel de acceso.</p>
            <button onclick="location.hash='#dashboard'; location.reload();" class="mt-8 px-8 py-3 bg-cyan-600 text-white orbitron text-xs font-black rounded-xl">REINICIAR AEGIS</button>
        </div>`;
    }
};

// --- 🎧 EVENT LISTENERS GLOBALES ---
window.addEventListener('hashchange', ejecutarRouter);
// No usamos window.addEventListener('load') aquí porque el archivo se importa como módulo
