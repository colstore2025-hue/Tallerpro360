/**
 * dashboard.js - NEXUS-X AEGIS V35.0 🛰️
 * SISTEMA UNIFICADO DE COMANDO CENTRAL - EDICIÓN 2030
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { db } from "../core/firebase-config.js";
import { collection, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- 🛡️ 1. CONFIGURACIÓN DE PERMISOS TÁCTICOS ---
const PERMISOS = {
    "GRATI-CORE": { 
        limiteOrdenes: 10, 
        // Se abre 'contabilidad' y 'pagos' en modo limitado para mostrar el poder del sistema
        modulos: ['clientes', 'vehiculos', 'ordenes', 'pagos', 'contabilidad', 'soporte'],
        clase: "border-slate-700 text-slate-400" 
    },
    "BASICO": { 
        limiteOrdenes: 50, 
        modulos: ['clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 'contabilidad', 'soporte'],
        clase: "border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
    },
    "PRO": { 
        limiteOrdenes: 500, 
        modulos: ['clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 'contabilidad', 'gerenteAI', 'reportes', 'marketplace', 'publish', 'soporte'],
        clase: "border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
    },
    "ELITE": { 
        limiteOrdenes: Infinity, 
        modulos: ['clientes', 'vehiculos', 'ordenes', 'inventario', 'pagos', 'contabilidad', 'gerenteAI', 'reportes', 'marketplace', 'publish', 'staff', 'nomina', 'finanzas-elite', 'soporte'],
        clase: "border-cyan-500 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
    }
};

window.restrictedAccess = (modulo) => {
    Swal.fire({
        title: `<span class="orbitron text-white italic">NIVEL DE ENLACE INSUFICIENTE</span>`,
        html: `
            <div class="p-2">
                <p class="text-[11px] text-slate-400 mb-4 uppercase tracking-[0.2em]">
                    El módulo <b class="text-cyan-400">${modulo}</b> requiere un núcleo nivel <b class="text-purple-400">PRO/ELITE</b>.
                </p>
                <p class="text-[9px] text-slate-500 italic">Desbloquee telemetría avanzada para maximizar su rentabilidad.</p>
            </div>`,
        icon: 'lock',
        background: '#010409',
        color: '#fff',
        confirmButtonText: 'UPGRADE SYSTEM',
        confirmButtonColor: '#06b6d4',
        showCancelButton: true,
        cancelButtonText: 'CANCELAR',
        customClass: {
            popup: 'border border-white/10 rounded-[2rem]',
            confirmButton: 'orbitron font-black italic tracking-widest',
            cancelButton: 'orbitron text-[10px]'
        }
    }).then(r => { if(r.isConfirmed) location.hash = '#pagos'; });
};

// --- 🚀 2. MOTOR PRINCIPAL ---
export default async function dashboard(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const planActual = (localStorage.getItem("nexus_plan") || "GRATI-CORE").toUpperCase();
    const config = PERMISOS[planActual] || PERMISOS["GRATI-CORE"];
    const user = localStorage.getItem("nexus_userName") || "OPERADOR_NXS";
    const empresaNombre = localStorage.getItem("nexus_empresaNombre") || "NEXUS LOGISTICS";

    renderInterface(container, planActual, user, empresaNombre, config);

    try {
        const qOrdenes = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        const snap = await getDocs(qOrdenes);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const stats = processBI(data);

        setTimeout(() => {
            updateNumbers(stats, planActual);
            renderStaffEfficiency(stats.staff);
            deployAIAssistant(stats, (planActual === 'ELITE' || planActual === 'PRO'));
        }, 300);

    } catch (err) {
        console.error("DASHBOARD_CRITICAL_FAILURE", err);
    }
}

// --- 📐 3. ARQUITECTURA VISUAL ---
function renderInterface(container, plan, user, empresa, config) {
    container.innerHTML = `
    <div class="p-4 lg:p-10 space-y-10 animate-in fade-in duration-700 pb-40 max-w-[1600px] mx-auto bg-[#010409]">
        
        <div class="flex flex-col lg:flex-row justify-between items-center gap-6 border-b border-white/5 pb-10">
            <div class="relative pl-6">
                <div class="absolute left-0 top-0 h-full w-1 bg-cyan-500 shadow-[0_0_15px_#06b6d4]"></div>
                <h1 class="orbitron text-4xl font-black italic uppercase tracking-tighter">${empresa}</h1>
                <p class="text-[9px] text-slate-500 font-black orbitron tracking-[0.4em] mt-2">OPERADOR: ${user} // SYSTEM_V35.0</p>
            </div>
            <div class="bg-[#0d1117] border ${config.clase} px-10 py-5 rounded-[2rem] text-center">
                <p class="text-[8px] font-black orbitron uppercase mb-1 tracking-widest text-slate-500">Status de Licencia</p>
                <p class="text-2xl font-black orbitron italic">${plan} ACTIVE</p>
            </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            ${renderBtn('Clientes', 'fa-users', '#clientes', config.modulos.includes('clientes'))}
            ${renderBtn('Vehículos', 'fa-car', '#vehiculos', config.modulos.includes('vehiculos'))}
            ${renderBtn('Inventario', 'fa-box-open', '#inventario', config.modulos.includes('inventario'))}
            ${renderBtn('Caja', 'fa-vault', '#pagos', config.modulos.includes('pagos'))}
            ${renderBtn('Contabilidad', 'fa-file-invoice-dollar', '#contabilidad', config.modulos.includes('contabilidad'))}
            ${renderBtn('Nómina', 'fa-user-tie', '#nomina', config.modulos.includes('nomina'))}
            ${renderBtn('Reportes', 'fa-chart-pie', '#reportes', config.modulos.includes('reportes'))}
            ${renderBtn('Marketplace', 'fa-shop', '#marketplace', config.modulos.includes('marketplace'))}
            ${renderBtn('Publish', 'fa-cloud-arrow-up', '#publish', config.modulos.includes('publish'))}
            
            <button onclick="window.open('https://wa.me/17049419163?text=SOPORTE_NXS:%20Protocolo%20de%20asistencia...', '_blank')" 
                class="flex flex-col items-center justify-center p-6 bg-[#0d1117] border border-white/5 rounded-2xl hover:bg-white hover:scale-[1.02] transition-all group">
                <i class="fab fa-whatsapp text-xl mb-3 text-slate-500 group-hover:text-black transition-colors"></i>
                <p class="orbitron text-[8px] font-black uppercase tracking-widest text-slate-500 group-hover:text-black">Soporte NXS</p>
            </button>

            ${renderBtn('Staff', 'fa-people-group', '#staff', config.modulos.includes('staff'))}
            ${renderBtn('Audit Center', 'fa-shield-halved', '#finanzas-elite', config.modulos.includes('finanzas-elite'))}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div onclick="location.hash='#vehiculos'" class="cursor-pointer bg-[#0d1117] border border-white/5 hover:border-cyan-500/50 p-10 rounded-[3rem] group transition-all relative overflow-hidden">
                <div class="absolute -right-10 -top-10 text-9xl text-white/5 rotate-12 group-hover:text-cyan-500/10 transition-colors"><i class="fas fa-screwdriver-wrench"></i></div>
                <h3 class="orbitron text-xs font-black text-slate-500 mb-2 uppercase tracking-widest italic">Misiones en Proceso</h3>
                <p class="text-4xl font-black orbitron text-white italic tracking-tighter uppercase">Órdenes de Trabajo</p>
                <div class="mt-6 flex items-center gap-4 text-cyan-500 font-bold text-[10px] orbitron group-hover:translate-x-2 transition-transform">
                    <span>EXPLORAR RADAR</span> <i class="fas fa-arrow-right"></i>
                </div>
            </div>

            <div onclick="${(config.modulos.includes('gerenteAI')) ? "location.hash='#finanzas-elite'" : "window.restrictedAccess('GERENTE AI')"}" 
                class="cursor-pointer bg-gradient-to-br from-[#0d1117] to-black border border-white/5 hover:border-purple-500/50 p-10 rounded-[3rem] group transition-all relative overflow-hidden">
                <div class="absolute -right-10 -top-10 text-9xl text-purple-500/5 group-hover:text-purple-500/10 transition-colors"><i class="fas fa-brain"></i></div>
                <h3 class="orbitron text-xs font-black text-slate-500 mb-2 uppercase tracking-widest italic">Análisis Predictivo</h3>
                <p class="text-4xl font-black orbitron text-white italic tracking-tighter uppercase">Gerente <span class="text-purple-500">AI</span></p>
                <div class="mt-6 flex items-center gap-4 text-purple-500 font-bold text-[10px] orbitron animate-pulse">
                    <span>DESPLEGAR RED NEURONAL</span> <i class="fas fa-microchip"></i>
                </div>
            </div>
        </div>

        <div id="hudKpis" class="grid grid-cols-2 md:grid-cols-4 gap-4"></div>

        <div class="grid lg:grid-cols-12 gap-6">
            <div class="lg:col-span-4 bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5">
                <h4 class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 border-l-2 border-cyan-500 pl-4">Rendimiento Staff</h4>
                <div id="techEfficiency" class="space-y-6"></div>
            </div>

            <div class="lg:col-span-8 bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 relative overflow-hidden">
                <div id="boxAI" class="relative z-10 h-full flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-4 mb-6">
                            <div class="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center text-xl shadow-[0_0_15px_rgba(255,255,255,0.5)]"><i class="fas fa-robot"></i></div>
                            <h5 class="orbitron text-xs font-black uppercase italic tracking-widest">Nexus Assistant</h5>
                        </div>
                        <p id="txtAI" class="text-slate-400 text-sm leading-relaxed max-w-2xl font-medium">Sincronizando flujo de caja real-time con proyecciones de rampa...</p>
                    </div>
                    <div id="btnAI" class="mt-8"></div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${renderFooterKpi('Ticket Promedio', 'valTicket')}
            ${renderFooterKpi('Revenue Mensual', 'valRevenue')}
            ${renderFooterKpi('Utilidad Estimada', 'valProfit')}
        </div>
    </div>`;
}

// --- 🧠 4. MOTOR DE PROCESAMIENTO BI ---
function processBI(ordenes) {
    let rev = 0;
    const staff = {};
    const validas = ordenes.filter(o => o.estado !== 'CANCELADO');

    validas.forEach(o => {
        const monto = Number(o.costos_totales?.total_general || o.total || 0);
        rev += monto;
        const tec = o.tecnico || "S/N";
        staff[tec] = (staff[tec] || 0) + monto;
    });

    return {
        revenue: rev,
        count: validas.length,
        avgTicket: validas.length > 0 ? rev / validas.length : 0,
        staff: Object.entries(staff).sort((a,b) => b[1] - a[1])
    };
}

// --- 🛠️ COMPONENTES UI ATÓMICOS ---
function renderBtn(name, icon, path, habilitado) {
    const action = habilitado ? `onclick="location.hash='${path}'"` : `onclick="window.restrictedAccess('${name}')"`;
    return `
    <button ${action} class="group p-6 rounded-2xl bg-[#0d1117] border border-white/5 hover:bg-white hover:scale-[1.02] transition-all duration-300">
        <i class="fas ${icon} text-xl mb-3 ${habilitado ? 'text-white group-hover:text-black' : 'text-slate-800'} transition-colors"></i>
        <p class="orbitron text-[8px] font-black uppercase tracking-widest ${habilitado ? 'text-slate-500 group-hover:text-black' : 'text-slate-800'}">${name}</p>
    </button>`;
}

function renderFooterKpi(label, id) {
    return `
    <div class="bg-black/40 border border-white/5 p-10 rounded-[3rem] text-center">
        <p class="text-[8px] text-slate-600 orbitron font-black uppercase mb-4 tracking-widest">${label}</p>
        <p id="${id}" class="text-3xl font-black orbitron text-white italic">$ 0</p>
    </div>`;
}

function updateNumbers(s, plan) {
    const hud = document.getElementById("hudKpis");
    if(!hud) return;
    const kpis = [
        { l: "Caja Real", v: `$${s.revenue.toLocaleString()}`, i: "fa-sack-dollar", c: "text-emerald-400" },
        { l: "Misiones OT", v: s.count, i: "fa-clipboard-check", c: "text-white" },
        { l: "Nivel Enlace", v: plan, i: "fa-satellite", c: "text-cyan-400" },
        { l: "Estado Plan", v: "ESTABLE", i: "fa-heart-pulse", c: "text-orange-500" }
    ];
    hud.innerHTML = kpis.map(k => `
        <div class="bg-[#0d1117] p-6 rounded-3xl border border-white/5">
            <p class="text-[7px] text-slate-600 orbitron font-black uppercase mb-2">${k.l}</p>
            <p class="text-xl font-black orbitron ${k.c}">${k.v}</p>
        </div>`).join("");

    document.getElementById("valTicket").innerText = `$${Math.round(s.avgTicket).toLocaleString()}`;
    document.getElementById("valRevenue").innerText = `$${s.revenue.toLocaleString()}`;
    document.getElementById("valProfit").innerText = `$${Math.round(s.revenue * 0.35).toLocaleString()}`;
}

function renderStaffEfficiency(staff) {
    const container = document.getElementById("techEfficiency");
    if(!container) return;
    container.innerHTML = staff.slice(0, 4).map(([name, val]) => `
        <div class="space-y-2">
            <div class="flex justify-between text-[9px] orbitron font-bold">
                <span class="text-slate-400 uppercase">${name}</span>
                <span class="text-white">$${val.toLocaleString()}</span>
            </div>
            <div class="h-1 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]" style="width: ${Math.min((val/2000000)*100, 100)}%"></div>
            </div>
        </div>`).join("");
}

function deployAIAssistant(stats, hasAI) {
    const txt = document.getElementById("txtAI");
    const btn = document.getElementById("btnAI");
    if(!hasAI) {
        txt.innerHTML = "El protocolo predictivo <span class='text-white'>GERENTE AI</span> está en modo espera. Actualice a un plan superior para activar el análisis de rentabilidad y detección de fugas de capital.";
        btn.innerHTML = `<button onclick="location.hash='#pagos'" class="w-full py-4 bg-purple-600 text-white orbitron text-[9px] font-black rounded-xl tracking-[0.2em] hover:bg-white hover:text-black transition-all">ACTIVAR INTELIGENCIA ARTIFICIAL</button>`;
    } else {
        txt.innerHTML = `Nexus detecta un revenue de <span class='text-cyan-400 font-black'>$${stats.revenue.toLocaleString()}</span>. El técnico más productivo es <span class='text-emerald-400'>${stats.staff[0]?.[0] || 'N/A'}</span>. Analizando métricas para optimización del 15% en el próximo ciclo...`;
        btn.innerHTML = `<button onclick="location.hash='#finanzas-elite'" class="w-full py-4 bg-white text-black orbitron text-[9px] font-black rounded-xl tracking-[0.2em] hover:bg-cyan-500 hover:text-white transition-all">ENTRAR AL CENTRO DE CONTROL AI</button>`;
    }
}

// --- 🛰️ 5. CONTROLADOR DE CARGA EXTERNA (ROUTER) ---
const ejecutarRouter = async () => {
    const hash = window.location.hash;
    const container = document.getElementById("main-content") || document.querySelector("#app");

    if (!container) return;

    if (hash === '#marketplace') {
        container.innerHTML = `<iframe src="marketplace.html" style="width:100%; height:100vh; border:none;" class="animate-in fade-in duration-500"></iframe>`;
    } 
    else if (hash === '#publish') {
        container.innerHTML = `<iframe src="publish.html" style="width:100%; height:100vh; border:none;" class="animate-in fade-in duration-500"></iframe>`;
    }
    else if (hash === '#finanzas-elite' || hash === '#gerenteAI') {
        try {
            const modulo = await import('./finanzas_elite.js');
            modulo.default(container);
        } catch(e) { console.error("Error cargando Finanzas Elite", e); }
    }
    else if (hash === '#staff') {
        try {
            const modulo = await import('./staff.js');
            modulo.default(container);
        } catch(e) { console.error("Error cargando Staff", e); }
    }
};

window.addEventListener('hashchange', ejecutarRouter);
window.addEventListener('load', ejecutarRouter);
