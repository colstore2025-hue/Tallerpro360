/**
 * 🏛️ contabilidad.js - NEXUS-X MASTER-CORE V21.8
 * MANIOBRA FINAL: Sincronización Total y Auditoría Forzada
 * Director de Código: Terminator Style 2030 // William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, addDoc, getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

export default async function contabilidad(container) {
    const empresaId = (localStorage.getItem("nexus_empresaId") || "").trim();
    let vistaActual = "DIARIO"; 
    let unsubscribe = null;

    // 1. NORMALIZADOR DE FLUJOS (Garantiza que los 200k entren donde deben)
    const esIngreso = (tipo) => [
        NEXUS_CONFIG.FINANCE_TYPES.REVENUE_OT, 
        NEXUS_CONFIG.FINANCE_TYPES.REVENUE_PARTS, 
        NEXUS_CONFIG.FINANCE_TYPES.REVENUE_CAPITAL,
        'ingreso_ot', 'ingreso', 'INGRESO'
    ].includes(tipo);

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32 animate-in fade-in duration-700">
            <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12 border-b border-white/10 pb-10">
                <div class="text-center lg:text-left">
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        FINANCE <span class="text-amber-400">CORE</span><span class="text-cyan-500 text-xl">.V21.8</span>
                    </h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-4 italic">Sistema de Auditoría Real-Time</p>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    ${renderDashCard("Ingresos", "dash-ingresos", "text-emerald-400")}
                    ${renderDashCard("Gastos", "dash-gastos", "text-red-500")}
                    ${renderDashCard("Utilidad", "dash-utilidad", "text-amber-500")}
                    ${renderDashCard("Bóveda Nexus", "dash-caja", "text-cyan-400")}
                </div>
            </header>

            <nav class="flex justify-center gap-4 mb-12 bg-[#0d1117]/50 p-2 rounded-full border border-white/5 w-fit mx-auto">
                <button id="btn-vista-diario" class="px-8 py-3 rounded-full orbitron text-[10px] font-black transition-all">LIBRO DIARIO</button>
                <button id="btn-vista-puc" class="px-8 py-3 rounded-full orbitron text-[10px] font-black transition-all">ESTADOS FINANCIEROS</button>
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
        const active = "bg-white text-black shadow-glow-white";
        const inactive = "text-slate-500 hover:text-white";

        if (btnD && btnP) {
            btnD.className = `px-8 py-3 rounded-full orbitron text-[10px] font-black ${vistaActual === 'DIARIO' ? active : inactive}`;
            btnP.className = `px-8 py-3 rounded-full orbitron text-[10px] font-black ${vistaActual === 'CUENTAS' ? active : inactive}`;
            btnD.onclick = () => { vistaActual = "DIARIO"; renderLayout(); };
            btnP.onclick = () => { vistaActual = "CUENTAS"; renderLayout(); };
        }
    };

    const cargarVistaDiaria = () => {
        document.getElementById("cont-dynamic-content").innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl sticky top-10">
                    <p class="orbitron text-[10px] text-cyan-500 font-black mb-6 uppercase italic tracking-widest">Inyectar Movimiento Manual</p>
                    <div class="space-y-5">
                        <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-sm focus:border-cyan-500 outline-none transition-all" placeholder="CONCEPTO...">
                        <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-cyan-400 font-black orbitron text-[10px] uppercase cursor-pointer">
                            <option value="${NEXUS_CONFIG.FINANCE_TYPES.REVENUE_OT}">4135 - INGRESO POR SERVICIOS</option>
                            <option value="${NEXUS_CONFIG.FINANCE_TYPES.EXPENSE_OPERATIONAL}">5195 - GASTOS OPERATIVOS</option>
                            <option value="${NEXUS_CONFIG.FINANCE_TYPES.EXPENSE_PAYROLL}">5105 - PAGO NÓMINA</option>
                            <option value="${NEXUS_CONFIG.FINANCE_TYPES.REVENUE_CAPITAL}">1105 - CAPITAL INICIAL</option>
                        </select>
                        <input id="acc-monto" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-xl" placeholder="0.00">
                        <button id="btnGuardarFinanza" class="w-full bg-cyan-500 text-black font-black orbitron py-5 rounded-2xl hover:scale-[1.02] transition-all uppercase tracking-widest shadow-lg">SINCRONIZAR BÓVEDA</button>
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

        const qOficial = query(
            collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), 
            where("empresaId", "==", empresaId), 
            orderBy("creadoEn", "desc")
        );

        unsubscribe = onSnapshot(qOficial, (snap) => {
            procesarYRenderizar(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => {
            console.warn("Nexus-X Alert: Activando Rescate Local por error de índice.");
            const qRescate = query(
                collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), 
                where("empresaId", "==", empresaId)
            );

            onSnapshot(qRescate, (snap) => {
                const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                docs.sort((a, b) => {
                    const fA = a.creadoEn?.seconds || a.createdAt?.seconds || 0;
                    const fB = b.creadoEn?.seconds || b.createdAt?.seconds || 0;
                    return fB - fA;
                });
                procesarYRenderizar(docs);
            });
        });
    }

    function procesarYRenderizar(docs) {
        let tIng = 0, tGas = 0;
        const list = document.getElementById("listaFinanzas");
        if (!list) return;

        if (docs.length === 0) {
            list.innerHTML = `<div class="p-20 text-center opacity-20 orbitron italic text-[10px]">LIBRO VACÍO - SIN TELEMETRÍA</div>`;
            actualizarDash(0, 0);
            return;
        }

        list.innerHTML = docs.map(m => {
            const v = Number(m.monto || 0);
            const esIng = esIngreso(m.tipo);
            if (esIng) tIng += v; else tGas += v;

            const estilo = obtenerEstilo(m.tipo);
            const ts = m.creadoEn || m.createdAt || m.fecha;
            const fechaStr = ts?.toDate ? ts.toDate().toLocaleString() : 'REGISTRO MANUAL';

            return `
            <div class="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 flex justify-between items-center group hover:border-cyan-500/40 transition-all animate-in fade-in slide-in-from-right-2">
                <div class="flex items-center gap-5">
                    <div class="w-12 h-12 rounded-2xl ${estilo.bg} flex items-center justify-center border ${estilo.border} shadow-lg">
                        <i class="${estilo.icon} ${estilo.text}"></i>
                    </div>
                    <div>
                        <p class="text-xs font-black text-white uppercase tracking-tighter">${m.concepto || 'TRANSACCIÓN'}</p>
                        <p class="text-[7px] text-slate-500 orbitron font-bold uppercase">${fechaStr}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-lg font-black orbitron ${esIng ? 'text-emerald-400' : 'text-red-500'}">
                        ${esIng ? '+' : '-'} $${v.toLocaleString()}
                    </p>
                    <div class="flex items-center justify-end gap-2">
                         <span class="text-[6px] text-slate-600 orbitron uppercase font-black tracking-widest">${m.tipo?.replace('_', ' ')}</span>
                         ${m.metodo ? `<span class="px-2 py-0.5 bg-cyan-500/10 rounded text-[5px] orbitron text-cyan-500 border border-cyan-500/20">${m.metodo}</span>` : ''}
                    </div>
                </div>
            </div>`;
        }).join("");
        actualizarDash(tIng, tGas);
    }

    function actualizarDash(ing, gas) {
        const util = ing - gas;
        const ids = { "dash-ingresos": ing, "dash-gastos": gas, "dash-utilidad": util, "dash-caja": util };
        Object.keys(ids).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = `$ ${ids[id].toLocaleString()}`;
        });
    }

    async function registrarMovimiento() {
        const cIn = document.getElementById("acc-concepto");
        const mIn = document.getElementById("acc-monto");
        const tIn = document.getElementById("acc-tipo");
        const monto = Number(mIn.value);

        if (!cIn.value || monto <= 0) return Swal.fire({ icon: 'warning', title: 'DATOS INCOMPLETOS', background: '#0d1117', color: '#fff' });

        try {
            await addDoc(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), {
                empresaId,
                concepto: cIn.value.toUpperCase().trim(),
                tipo: tIn.value,
                monto: monto,
                metodo: NEXUS_CONFIG.PAYMENT_METHODS.CASH,
                creadoEn: serverTimestamp()
            });
            cIn.value = ""; mIn.value = "";
            Swal.fire({ icon: 'success', title: 'SINCRONIZADO', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
        } catch (e) { console.error(e); }
    }

    const cargarVistaCuentas = async () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `<div class="p-20 text-center orbitron text-[10px] animate-pulse text-cyan-500">CONSOLIDANDO BALANCES...</div>`;
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        const p = { ing: 0, gas: 0 };
        snap.forEach(d => {
            const m = d.data();
            if (esIngreso(m.tipo)) p.ing += Number(m.monto); else p.gas += Number(m.monto);
        });
        content.innerHTML = `
        <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-3xl animate-in zoom-in duration-500">
            <h3 class="orbitron text-xl font-black text-amber-400 mb-10 italic uppercase">Estado de Resultados Nexus-X</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                ${renderPucCard("INGRESOS TOTALES", p.ing, "border-emerald-500/20", "text-emerald-400")}
                ${renderPucCard("GASTOS Y COSTOS", p.gas, "border-red-500/20", "text-red-500")}
                ${renderPucCard("UTILIDAD NETA", p.ing - p.gas, "border-cyan-500/20", "text-cyan-400")}
            </div>
        </div>`;
    };

    function renderPucCard(title, total, border, text) {
        return `<div class="p-8 bg-black/40 rounded-[3rem] border ${border} hover:bg-white/5 transition-all">
            <p class="text-[9px] orbitron ${text} mb-4 font-black tracking-widest">${title}</p>
            <span class="text-2xl font-black orbitron ${text}">$${total.toLocaleString()}</span>
        </div>`;
    }

    const obtenerEstilo = (t) => {
        const conf = {
            [NEXUS_CONFIG.FINANCE_TYPES.REVENUE_OT]: { icon: 'fas fa-wrench', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            [NEXUS_CONFIG.FINANCE_TYPES.EXPENSE_PAYROLL]: { icon: 'fas fa-user-tie', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            [NEXUS_CONFIG.FINANCE_TYPES.EXPENSE_OPERATIONAL]: { icon: 'fas fa-lightbulb', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
        };
        return conf[t] || { icon: 'fas fa-exchange-alt', text: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/10' };
    };

    renderLayout();
}
