/**
 * 🏛️ contabilidad.js - NEXUS-X MASTER-CORE V21.8
 * MANIOBRA FINAL: Sincronización Total y Auditoría Forzada
 * Director de Código: Terminator Style 2030 // William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, getDocs, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js"; // RECTOR ÚNICO DE VERDAD

export default async function contabilidad(container) {
    const empresaId = (localStorage.getItem("nexus_empresaId") || "").trim();
    let vistaActual = "DIARIO"; 
    let unsubscribe = null;

    // 1. BLINDAJE DE TIPOS (Carga dinámica desde Nexus_Constants)
    const T_ING = [
        NEXUS_CONFIG.FINANCE_TYPES.REVENUE_OT, 
        NEXUS_CONFIG.FINANCE_TYPES.REVENUE_PARTS, 
        NEXUS_CONFIG.FINANCE_TYPES.REVENUE_CAPITAL,
        'INGRESO', 'ingreso' // Compatibilidad histórica
    ];
    
    const T_GAS = [
        NEXUS_CONFIG.FINANCE_TYPES.EXPENSE_OPERATIONAL, 
        NEXUS_CONFIG.FINANCE_TYPES.EXPENSE_PARTS, 
        NEXUS_CONFIG.FINANCE_TYPES.EXPENSE_PAYROLL,
        'gasto', 'egreso'
    ];

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32">
            <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12 border-b border-white/10 pb-10">
                <div class="text-center lg:text-left">
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        FINANCE <span class="text-amber-400">CORE</span><span class="text-cyan-500 text-xl">.V21.8</span>
                    </h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-4 italic">Auditoría Forzada TallerPRO360</p>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    ${renderDashCard("Ingresos", "dash-ingresos", "text-emerald-400")}
                    ${renderDashCard("Gastos", "dash-gastos", "text-red-500")}
                    ${renderDashCard("Utilidad", "dash-utilidad", "text-amber-500")}
                    ${renderDashCard("Caja Real", "dash-caja", "text-cyan-400")}
                </div>
            </header>

            <nav class="flex justify-center gap-4 mb-12 bg-[#0d1117]/50 p-2 rounded-full border border-white/5 w-fit mx-auto">
                <button id="btn-vista-diario" class="px-8 py-3 rounded-full orbitron text-[10px] font-black transition-all">LIBRO DIARIO</button>
                <button id="btn-vista-puc" class="px-8 py-3 rounded-full orbitron text-[10px] font-black transition-all">PLAN PUC / BALANCES</button>
            </nav>

            <div id="cont-dynamic-content" class="animate-in slide-in-from-bottom-5 duration-700"></div>
        </div>`;
        
        setupNavigation();
        vistaActual === "DIARIO" ? cargarVistaDiaria() : cargarVistaCuentas();
    };

    function renderDashCard(label, id, colorClass) {
        return `
        <div class="bg-[#0d1117] p-5 rounded-3xl border border-white/5 text-center shadow-2xl group hover:border-cyan-500/20 transition-all">
            <span class="text-[8px] orbitron ${colorClass} block mb-1 uppercase font-black tracking-widest">${label}</span>
            <h2 id="${id}" class="text-xl font-black orbitron ${colorClass}">$ 0</h2>
        </div>`;
    }

    const setupNavigation = () => {
        const btnD = document.getElementById("btn-vista-diario");
        const btnP = document.getElementById("btn-vista-puc");
        const active = "bg-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.4)]";
        const inactive = "text-slate-500 hover:text-white";

        btnD.className = `px-8 py-3 rounded-full orbitron text-[10px] font-black ${vistaActual === 'DIARIO' ? active : inactive}`;
        btnP.className = `px-8 py-3 rounded-full orbitron text-[10px] font-black ${vistaActual === 'CUENTAS' ? active : inactive}`;

        btnD.onclick = () => { vistaActual = "DIARIO"; renderLayout(); };
        btnP.onclick = () => { vistaActual = "CUENTAS"; renderLayout(); };
    };

    const cargarVistaDiaria = () => {
        document.getElementById("cont-dynamic-content").innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl sticky top-10">
                    <p class="orbitron text-[10px] text-amber-500 font-black mb-6 uppercase italic tracking-widest">Registrar Asiento Manual</p>
                    <div class="space-y-5">
                        <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-sm focus:border-cyan-500 outline-none transition-all" placeholder="CONCEPTO DEL MOVIMIENTO...">
                        <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-amber-400 font-black orbitron text-[10px] uppercase cursor-pointer">
                            <option value="${NEXUS_CONFIG.FINANCE_TYPES.REVENUE_OT}">4135 - SERVICIOS TALLER</option>
                            <option value="${NEXUS_CONFIG.FINANCE_TYPES.REVENUE_PARTS}">413505 - VENTA REPUESTOS</option>
                            <option value="${NEXUS_CONFIG.FINANCE_TYPES.EXPENSE_OPERATIONAL}">5195 - GASTOS OPERATIVOS</option>
                            <option value="${NEXUS_CONFIG.FINANCE_TYPES.EXPENSE_PAYROLL}">5105 - NÓMINA / TÉCNICOS</option>
                            <option value="${NEXUS_CONFIG.FINANCE_TYPES.REVENUE_CAPITAL}">1105 - CAPITAL / CAJA</option>
                        </select>
                        <input id="acc-monto" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-xl" placeholder="0.00">
                        <button id="btnGuardarFinanza" class="w-full bg-white text-black font-black orbitron py-5 rounded-2xl hover:bg-cyan-500 hover:text-white transition-all duration-500 uppercase tracking-widest shadow-lg">Sincronizar Nexus-X</button>
                    </div>
                </div>
            </div>
            <div class="lg:col-span-8">
                <div id="listaFinanzas" class="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar"></div>
            </div>
        </div>`;
        document.getElementById("btnGuardarFinanza").onclick = registrarMovimiento;
        escucharContabilidad();
    };

    function escucharContabilidad() {
        if (unsubscribe) unsubscribe();
        if (!empresaId) return;

        const q = query(
            collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), 
            where("empresaId", "==", empresaId), 
            orderBy("creadoEn", "desc")
        );

        unsubscribe = onSnapshot(q, (snap) => {
            procesarSnap(snap);
        }, (error) => {
            console.warn("Nexus-Core: Error en ordenamiento. Verificando índices o backup...");
            const backupQ = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
            onSnapshot(backupQ, (snap) => procesarSnap(snap));
        });
    }

    function procesarSnap(snap) {
        let tIng = 0, tGas = 0;
        const list = document.getElementById("listaFinanzas");
        if (!list) return;

        if (snap.empty) {
            list.innerHTML = `<div class="p-20 text-center opacity-20 orbitron italic text-[10px]">LIBRO DE ACTAS VACÍO - ESPERANDO TELEMETRÍA</div>`;
            actualizarDash(0, 0);
            return;
        }

        const docs = snap.docs.map(d => ({id: d.id, ...d.data()}));
        docs.sort((a, b) => (b.creadoEn?.seconds || 0) - (a.creadoEn?.seconds || 0));

        list.innerHTML = docs.map(m => {
            const v = Number(m.monto || 0);
            const tipo = (m.tipo || "").toLowerCase();
            const esIng = T_ING.includes(tipo);
            
            if (esIng) tIng += v; else tGas += v;

            const estilo = obtenerEstilo(tipo);
            return `
            <div class="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 flex justify-between items-center group transition-all hover:border-cyan-500/30">
                <div class="flex items-center gap-5">
                    <div class="w-12 h-12 rounded-2xl ${estilo.bg} flex items-center justify-center border ${estilo.border} shadow-inner">
                        <i class="${estilo.icon} ${estilo.text}"></i>
                    </div>
                    <div>
                        <p class="text-xs font-black text-white uppercase tracking-tight">${m.concepto}</p>
                        <p class="text-[7px] text-slate-500 orbitron font-bold">${m.creadoEn?.toDate().toLocaleString() || 'PROTOCOLIZANDO...'}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-lg font-black orbitron ${esIng ? 'text-emerald-400' : 'text-red-500'}">${esIng ? '+' : '-'} $${v.toLocaleString()}</p>
                    <div class="flex items-center justify-end gap-2">
                        <span class="text-[6px] text-slate-600 orbitron uppercase font-black tracking-widest">${tipo.replace('_', ' ')}</span>
                        ${m.metodo ? `<span class="px-2 py-0.5 bg-white/5 rounded text-[5px] orbitron text-cyan-500">${m.metodo}</span>` : ''}
                    </div>
                </div>
            </div>`;
        }).join("");

        actualizarDash(tIng, tGas);
    }

    function actualizarDash(ing, gas) {
        const util = ing - gas;
        const dashIng = document.getElementById("dash-ingresos");
        const dashGas = document.getElementById("dash-gastos");
        const dashUtil = document.getElementById("dash-utilidad");
        const dashCaja = document.getElementById("dash-caja");

        if(dashIng) dashIng.innerText = `$ ${ing.toLocaleString()}`;
        if(dashGas) dashGas.innerText = `$ ${gas.toLocaleString()}`;
        if(dashUtil) dashUtil.innerText = `$ ${util.toLocaleString()}`;
        if(dashCaja) dashCaja.innerText = `$ ${util.toLocaleString()}`;
    }

    async function registrarMovimiento() {
        const cIn = document.getElementById("acc-concepto");
        const mIn = document.getElementById("acc-monto");
        const tIn = document.getElementById("acc-tipo");
        const monto = Number(mIn.value);

        if (!cIn.value || isNaN(monto) || monto <= 0) {
            Swal.fire({ icon: 'error', title: 'Datos Inválidos', background: '#0d1117', color: '#fff' });
            return;
        }

        try {
            await addDoc(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), {
                empresaId,
                concepto: cIn.value.toUpperCase().trim(),
                tipo: tIn.value,
                monto: monto,
                metodo: NEXUS_CONFIG.PAYMENT_METHODS.CASH, // Default para registro manual
                creadoEn: serverTimestamp()
            });
            cIn.value = ""; mIn.value = "";
            Swal.fire({ icon: 'success', title: 'Sincronizado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
        } catch (e) { console.error("Error Grave Registro:", e); }
    }

    const cargarVistaCuentas = async () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `<div class="p-20 text-center orbitron text-[10px] animate-pulse text-cyan-500">CONSOLIDANDO BALANCE PUC...</div>`;
        
        const snap = await getDocs(query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId)));
        const p = { '41': 0, '51': 0, '11': 0 };

        snap.forEach(d => {
            const m = d.data();
            const v = Number(m.monto || 0);
            if (T_ING.includes(m.tipo)) p['41'] += v;
            else if (T_GAS.includes(m.tipo)) p['51'] += v;
            else p['11'] += v;
        });

        content.innerHTML = `
        <div class="bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 shadow-3xl">
            <div class="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                <h3 class="orbitron text-xl font-black text-amber-400 italic">BALANCE DE COMPROBACIÓN (PUC)</h3>
                <span class="text-[8px] orbitron text-slate-500 font-black">NEXUS-X AUDIT CORE</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                ${renderPucCard("4 - INGRESOS OPERACIONALES", p['41'], "border-emerald-500/20", "text-emerald-400")}
                ${renderPucCard("5 - GASTOS OPERACIONALES", p['51'], "border-red-500/20", "text-red-500")}
                ${renderPucCard("1 - ACTIVOS DISPONIBLES", p['41'] - p['51'], "border-cyan-500/20", "text-cyan-400")}
            </div>
        </div>`;
    };

    function renderPucCard(title, total, borderColor, textColor) {
        return `
        <div class="p-8 bg-black/40 rounded-[3rem] border ${borderColor} hover:bg-white/[0.02] transition-all group">
            <p class="text-[9px] orbitron ${textColor} mb-6 uppercase font-black tracking-widest">${title}</p>
            <div class="flex justify-between items-end">
                <span class="text-[10px] text-slate-500 font-bold">TOTAL NETO</span>
                <span class="text-2xl font-black orbitron ${textColor}">$${total.toLocaleString()}</span>
            </div>
        </div>`;
    }

    const obtenerEstilo = (t) => {
        const est = {
            [NEXUS_CONFIG.FINANCE_TYPES.REVENUE_OT]: { icon: 'fas fa-car-side', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            [NEXUS_CONFIG.FINANCE_TYPES.REVENUE_PARTS]: { icon: 'fas fa-microchip', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
            [NEXUS_CONFIG.FINANCE_TYPES.EXPENSE_PAYROLL]: { icon: 'fas fa-user-gear', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            [NEXUS_CONFIG.FINANCE_TYPES.EXPENSE_OPERATIONAL]: { icon: 'fas fa-bolt', text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' }
        };
        return est[t] || { icon: 'fas fa-vault', text: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/5' };
    };

    renderLayout();
}
