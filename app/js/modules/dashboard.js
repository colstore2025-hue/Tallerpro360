/**
 * dashboard.js - NEXUS-X AEGIS ULTIMA V42.0 🛰️
 * SISTEMA UNIFICADO DE COMANDO CENTRAL - SEGMENTACIÓN QUIRÚRGICA
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { db } from "../core/firebase-config.js";
import { 
    collection, query, where, getDocs, limit, orderBy, onSnapshot, addDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- 🛡️ 1. MATRIZ DE SEGURIDAD NEXUS-X (ROLES & PLANES) ---
const ROLES_PERMISOS = {
    "TECNICO": {
        modulos: ['dashboard', 'ordenes', 'configuracion'],
        label: "OPERADOR TÁCTICO",
        color: "text-emerald-400"
    },
    "ADMIN": {
        modulos: ['dashboard', 'inventario', 'clientes', 'vehiculos', 'pagos', 'contabilidad', 'reportes', 'nomina', 'configuracion'],
        label: "CONTROL LOGÍSTICO",
        color: "text-amber-400"
    },
    "DUENO": {
        modulos: ['*'], // Acceso Total
        label: "COMANDANTE CORE",
        color: "text-cyan-400"
    }
};

const PLANES_CONFIG = {
    "GRATI-CORE": { clase: "border-slate-700 text-slate-400", shadow: "" },
    "BASICO": { clase: "border-blue-500 text-blue-400", shadow: "" },
    "PRO": { clase: "border-purple-500 text-purple-400", shadow: "" },
    "ELITE": { clase: "border-cyan-500 text-cyan-400", shadow: "shadow-[0_0_30px_rgba(6,182,212,0.4)]" }
};

// --- 🚀 2. INYECTOR PRINCIPAL ---
export default async function dashboard(container) {
    const empresaId = localStorage.getItem("empresaId");
    const rolActual = (localStorage.getItem("rol") || "TECNICO").toUpperCase();
    const planActual = (localStorage.getItem("planTipo") || "GRATI-CORE").toUpperCase();
    
    if (!empresaId) {
        location.hash = "#login";
        return;
    }

    renderInterface(container, planActual, rolActual);
    await ejecutarRouter();

    if (window.location.hash === "" || window.location.hash === "#dashboard") {
        cargarInteligenciaNegocio(empresaId, planActual, rolActual);
    }
}

// --- 🧠 3. MOTOR BI (INTELIGENCIA SEGMENTADA) ---
async function cargarInteligenciaNegocio(empresaId, plan, rol) {
    // Si es técnico, solo cargamos sus órdenes propias para auditoría
    const constraints = [where("empresaId", "==", empresaId), limit(100)];
    if (rol === "TECNICO") {
        const nombreTecnico = localStorage.getItem("nexus_userName");
        constraints.push(where("tecnico", "==", nombreTecnico));
    }

    try {
        const snap = await getDocs(query(collection(db, "ordenes"), ...constraints));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const stats = processBI(data);

        updateNumbers(stats, plan, rol);
        if (rol !== "TECNICO") renderStaffEfficiency(stats.staff);
        deployAIAssistant(stats, rol === "DUENO" || plan === "ELITE");
    } catch (err) {
        console.error("BI_LOAD_FAILURE", err);
    }
}

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

// --- 🛠️ 4. ARQUITECTURA VISUAL (UI/UX) ---
function renderInterface(container, plan, rol) {
    const empresa = localStorage.getItem("nexus_empresaNombre") || "NEXUS ERP";
    const configPlan = PLANES_CONFIG[plan] || PLANES_CONFIG["GRATI-CORE"];
    const configRol = ROLES_PERMISOS[rol] || ROLES_PERMISOS["TECNICO"];

    container.innerHTML = `
    <div id="nexus-aegis-view" class="p-6 lg:p-12 space-y-12 animate-in fade-in duration-1000 pb-48 max-w-[1800px] mx-auto bg-[#010409]">
        <header class="flex flex-col lg:flex-row justify-between items-center gap-8 border-b border-white/5 pb-12">
            <div class="relative pl-8 text-center lg:text-left">
                <div class="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-cyan-500 to-blue-600 shadow-[0_0_25px_#06b6d4]"></div>
                <h1 class="orbitron text-5xl font-black italic uppercase tracking-tighter text-white leading-none">${empresa}</h1>
                <p class="text-[10px] text-slate-500 font-black orbitron tracking-[0.6em] mt-4 uppercase italic">Status: Operacional // Aegis V42.0</p>
            </div>
            
            <div class="flex gap-4">
                <div class="bg-[#0d1117] border border-white/5 px-8 py-4 rounded-3xl text-center">
                    <p class="text-[7px] font-black orbitron uppercase mb-1 tracking-[0.4em] text-slate-600">Rango de Acceso</p>
                    <p class="text-xs font-black orbitron italic ${configRol.color}">${configRol.label}</p>
                </div>
                <div class="bg-[#0d1117] border ${configPlan.clase} ${configPlan.shadow} px-8 py-4 rounded-3xl text-center">
                    <p class="text-[7px] font-black orbitron uppercase mb-1 tracking-[0.4em] text-slate-600">Nivel Plan</p>
                    <p class="text-xs font-black orbitron italic">${plan}</p>
                </div>
            </div>
        </header>

        <div id="main-content-area" class="space-y-12">
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-6">
                ${renderBtn('Órdenes', 'fa-screwdriver-wrench', '#ordenes', tienePermiso(rol, 'ordenes'))}
                ${renderBtn('Inventario', 'fa-boxes-stacked', '#inventario', tienePermiso(rol, 'inventario'))}
                ${renderBtn('Clientes', 'fa-address-book', '#clientes', tienePermiso(rol, 'clientes'))}
                ${renderBtn('Caja Real', 'fa-cash-register', '#pagos', tienePermiso(rol, 'pagos'))}
                ${renderBtn('Finanzas', 'fa-file-invoice-dollar', '#contabilidad', tienePermiso(rol, 'contabilidad'))}
                ${renderBtn('Gerente AI', 'fa-brain', '#gerenteAI', tienePermiso(rol, 'gerenteAI'))}
                ${renderBtn('Staff', 'fa-user-shield', '#staff', tienePermiso(rol, 'staff'))}
                
                <button onclick="window.open('https://wa.me/17049419163', '_blank')" class="flex flex-col items-center justify-center p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] hover:bg-emerald-500 hover:text-white transition-all group">
                    <i class="fab fa-whatsapp text-xl mb-3 text-emerald-500 group-hover:text-white"></i>
                    <p class="orbitron text-[8px] font-black uppercase tracking-widest text-emerald-500 group-hover:text-white">Soporte</p>
                </button>
            </div>

            <div id="hudKpis" class="grid grid-cols-2 md:grid-cols-4 gap-6"></div>
            
            <div class="grid lg:grid-cols-12 gap-8 ${rol === 'TECNICO' ? 'hidden' : ''}">
                <div class="lg:col-span-4 bg-[#0d1117] p-10 rounded-[3rem] border border-white/5">
                    <h4 class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] mb-8 border-l-4 border-cyan-500 pl-4">Productividad Crew</h4>
                    <div id="techEfficiency" class="space-y-6"></div>
                </div>
                <div class="lg:col-span-8 bg-[#0d1117] p-12 rounded-[3rem] border border-white/5 relative overflow-hidden flex flex-col justify-center">
                    <div class="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent"></div>
                    <div class="flex items-center gap-6 mb-8 relative z-10">
                        <div class="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center text-xl shadow-2xl"><i class="fas fa-satellite-dish animate-pulse"></i></div>
                        <h5 class="orbitron text-lg font-black uppercase italic tracking-tighter text-white">Nexus Intelligence Feed</h5>
                    </div>
                    <p id="txtAI" class="text-slate-400 text-lg leading-relaxed max-w-2xl italic relative z-10 font-medium">Sincronizando flujo de datos tácticos...</p>
                    <div id="btnAI" class="mt-8 relative z-10"></div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 ${rol === 'TECNICO' ? 'hidden' : ''}">
                ${renderFooterKpi('Ticket Promedio', 'valTicket')}
                ${renderFooterKpi('Flujo Bruto', 'valRevenue')}
                ${renderFooterKpi('Margen Est. (30%)', 'valProfit')}
            </div>
        </div>
        <div id="nexus-module-container" class="hidden min-h-screen w-full"></div>
    </div>`;
}

function tienePermiso(rol, modulo) {
    if (rol === "DUENO") return true;
    return ROLES_PERMISOS[rol].modulos.includes(modulo);
}

function renderBtn(name, icon, path, habilitado) {
    if (!habilitado) return ""; // El botón no se renderiza si no hay permiso
    return `
    <button onclick="location.hash='${path}'" class="group p-6 rounded-[2rem] bg-[#0d1117] border border-white/5 hover:border-cyan-500/50 hover:bg-white hover:scale-[1.03] transition-all duration-500 relative shadow-lg overflow-hidden text-left">
        <i class="fas ${icon} text-xl mb-4 text-white group-hover:text-cyan-600 transition-colors"></i>
        <p class="orbitron text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-black transition-colors">${name}</p>
    </button>`;
}

// --- 🛰️ 5. ROUTER QUIRÚRGICO ---
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
    modContainer.innerHTML = `<div class="w-full h-80 flex flex-col items-center justify-center"><div class="spinner"></div></div>`;

    try {
        const moduleKey = hash.replace('#', '');
        // El import dinámico ahora es absoluto para evitar fallos de ruta
        const modulo = await import(`/app/js/modules/${moduleKey}.js?v=${new Date().getTime()}`);
        modContainer.innerHTML = "";
        if (modulo && modulo.default) {
            await modulo.default(modContainer, {
                empresaId: localStorage.getItem("empresaId"),
                rol: localStorage.getItem("rol")
            });
        }
    } catch (error) {
        console.error("🚨 ENLACE FALLIDO:", error);
        location.hash = "#dashboard";
    }
};

// --- 📈 6. HELPERS DE DATOS ---
function updateNumbers(s, plan, rol) {
    const hud = document.getElementById("hudKpis");
    if(!hud) return;
    
    // Si es técnico, mostramos sus métricas personales en lugar del Revenue de la empresa
    const metrics = rol === "TECNICO" ? [
        { l: "Mis Órdenes", v: s.count, c: "text-emerald-400" },
        { l: "Productividad", v: `$${s.revenue.toLocaleString()}`, c: "text-white" },
        { l: "Plan Nodo", v: plan, c: "text-cyan-400" },
        { l: "Status", v: "ONLINE", c: "text-orange-500" }
    ] : [
        { l: "Revenue Total", v: `$${s.revenue.toLocaleString()}`, c: "text-emerald-400" },
        { l: "Órdenes Activas", v: s.count, c: "text-white" },
        { l: "Plan Activo", v: plan, c: "text-cyan-400" },
        { l: "Sistema", v: "OPTIMAL", c: "text-orange-500" }
    ];

    hud.innerHTML = metrics.map(k => `
        <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5">
            <p class="text-[8px] text-slate-600 orbitron font-black uppercase mb-3 tracking-widest">${k.l}</p>
            <p class="text-xl font-black orbitron ${k.c}">${k.v}</p>
        </div>`).join("");

    if (rol !== "TECNICO") {
        document.getElementById("valTicket").innerText = `$${Math.round(s.avgTicket).toLocaleString()}`;
        document.getElementById("valRevenue").innerText = `$${s.revenue.toLocaleString()}`;
        document.getElementById("valProfit").innerText = `$${Math.round(s.revenue * 0.30).toLocaleString()}`;
    }
}

function renderStaffEfficiency(staff) {
    const container = document.getElementById("techEfficiency");
    if(!container) return;
    container.innerHTML = staff.slice(0, 5).map(([name, val]) => `
        <div class="space-y-2">
            <div class="flex justify-between text-[9px] orbitron font-bold uppercase"><span class="text-slate-500">${name}</span><span class="text-white">$${val.toLocaleString()}</span></div>
            <div class="h-1 bg-black rounded-full overflow-hidden"><div class="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" style="width: ${Math.min((val/2000000)*100, 100)}%"></div></div>
        </div>`).join("");
}

function deployAIAssistant(stats, hasAI) {
    const txt = document.getElementById("txtAI");
    const btn = document.getElementById("btnAI");
    if(!txt) return;
    if(!hasAI) {
        txt.innerHTML = "Protocolo <span class='text-purple-500 font-black'>GERENTE AI</span> no detectado en este enlace.";
        btn.innerHTML = `<button onclick="location.hash='#pagos'" class="px-8 py-3 bg-purple-600/10 border border-purple-600/20 text-purple-500 orbitron text-[9px] font-black rounded-xl">ACTIVAR INTELIGENCIA</button>`;
    } else {
        txt.innerHTML = `Comandante, detecto un flujo de <span class='text-cyan-400 font-black'>$${stats.revenue.toLocaleString()}</span>. Sugiero optimizar márgenes operativos.`;
        btn.innerHTML = `<button onclick="location.hash='#gerenteAI'" class="px-10 py-4 bg-white text-black orbitron text-[9px] font-black rounded-xl hover:bg-cyan-500 transition-colors">EJECUTAR ANÁLISIS</button>`;
    }
}

function renderFooterKpi(label, id) {
    return `<div class="bg-black/20 border border-white/5 p-10 rounded-[3rem] text-center"><p class="text-[8px] text-slate-600 orbitron font-black uppercase mb-4 tracking-[0.4em]">${label}</p><p id="${id}" class="text-3xl font-black orbitron text-white italic">$ 0</p></div>`;
}

window.addEventListener('hashchange', ejecutarRouter);
