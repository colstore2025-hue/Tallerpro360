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

    // --- NORMALIZADOR QUANTUM (Vínculo con ordenes.js) ---
    const esIngreso = (tipo) => {
        const triggers = [
            NEXUS_CONFIG.FINANCE_TYPES.REVENUE_OT, 
            NEXUS_CONFIG.FINANCE_TYPES.REVENUE_PARTS, 
            NEXUS_CONFIG.FINANCE_TYPES.REVENUE_CAPITAL,
            'ingreso_ot', 'ingreso', 'INGRESO', 'VENTA_SERVICIO'
        ];
        return triggers.includes(tipo);
    };

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

            <div class="flex justify-center gap-4 mb-12 bg-[#0d1117]/50 p-2 rounded-full border border-white/5 w-fit mx-auto">
                <button id="btn-vista-diario" class="nav-cont-btn px-8 py-3 rounded-full orbitron text-[10px] font-black transition-all">LIBRO DIARIO</button>
                <button id="btn-vista-puc" class="nav-cont-btn px-8 py-3 rounded-full orbitron text-[10px] font-black transition-all">ESTADOS FINANCIEROS</button>
            </div>

            <div id="cont-dynamic-content" class="animate-in slide-in-from-bottom-5 duration-700"></div>
        </div>`;
        
        setupInternalNavigation();
        vistaActual === "DIARIO" ? cargarVistaDiaria() : cargarVistaCuentas();
    };

    function renderDashCard(label, id, colorClass) {
        return `
        <div class="bg-[#0d1117] p-5 rounded-3xl border border-white/5 text-center shadow-2xl group hover:border-cyan-500/20 transition-all">
            <span class="text-[8px] orbitron ${colorClass} block mb-1 uppercase font-black tracking-widest">${label}</span>
            <h2 id="${id}" class="text-xl font-black orbitron ${colorClass}">$ 0</h2>
        </div>`;
    }

    const setupInternalNavigation = () => {
        const btnD = document.getElementById("btn-vista-diario");
        const btnP = document.getElementById("btn-vista-puc");
        const activeClass = "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]";
        const inactiveClass = "text-slate-500 hover:text-white";

        if (btnD && btnP) {
            btnD.className = `px-8 py-3 rounded-full orbitron text-[10px] font-black ${vistaActual === 'DIARIO' ? activeClass : inactiveClass}`;
            btnP.className = `px-8 py-3 rounded-full orbitron text-[10px] font-black ${vistaActual === 'CUENTAS' ? activeClass : inactiveClass}`;
            
            btnD.onclick = () => { if(vistaActual !== "DIARIO"){ vistaActual = "DIARIO"; renderLayout(); }};
            btnP.onclick = () => { if(vistaActual !== "CUENTAS"){ vistaActual = "CUENTAS"; renderLayout(); }};
        }
    };

    const cargarVistaDiaria = () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl sticky top-10">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
                        <p class="orbitron text-[10px] text-cyan-500 font-black uppercase italic tracking-widest">Inyectar Movimiento Manual</p>
                    </div>
                    <div class="space-y-5">
                        <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-sm focus:border-cyan-500 outline-none transition-all" placeholder="CONCEPTO (Ej: Pago Arriendo)...">
                        <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-cyan-400 font-black orbitron text-[10px] uppercase cursor-pointer">
                            <option value="${NEXUS_CONFIG.FINANCE_TYPES.REVENUE_OT}">4135 - INGRESO POR SERVICIOS</option>
                            <option value="${NEXUS_CONFIG.FINANCE_TYPES.EXPENSE_OPERATIONAL}">5195 - GASTOS OPERATIVOS</option>
                            <option value="${NEXUS_CONFIG.FINANCE_TYPES.EXPENSE_PAYROLL}">5105 - PAGO NÓMINA</option>
                            <option value="${NEXUS_CONFIG.FINANCE_TYPES.REVENUE_CAPITAL}">1105 - CAPITAL INICIAL</option>
                        </select>
                        <div class="relative">
                            <span class="absolute left-5 top-5 text-slate-500 orbitron">$</span>
                            <input id="acc-monto" type="number" class="w-full bg-black p-5 pl-10 rounded-2xl border border-white/10 text-white font-black orbitron text-xl" placeholder="0.00">
                        </div>
                        <button id="btnGuardarFinanza" class="w-full bg-cyan-500 text-black font-black orbitron py-5 rounded-2xl hover:bg-white transition-all uppercase tracking-widest shadow-lg">SINCRONIZAR BÓVEDA</button>
                    </div>
                </div>
            </div>
            <div class="lg:col-span-8">
                <div id="listaFinanzas" class="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scroll"></div>
            </div>
        </div>`;
        document.getElementById("btnGuardarFinanza").onclick = registrarMovimiento;
        escucharContabilidad();
    };

    function escucharContabilidad() {
        if (unsubscribe) unsubscribe();
        if (!empresaId) return;

        const collectionRef = collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING);
        const qOficial = query(collectionRef, where("empresaId", "==", empresaId), orderBy("creadoEn", "desc"));

        unsubscribe = onSnapshot(qOficial, (snap) => {
            const transacciones = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            renderizarTransacciones(transacciones);
        }, (err) => {
            console.error("Contabilidad Sync Error:", err);
            // Rescate por falta de índices compuestos
            const qRescate = query(collectionRef, where("empresaId", "==", empresaId));
            onSnapshot(qRescate, (snap) => {
                const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                docs.sort((a, b) => (b.creadoEn?.seconds || 0) - (a.creadoEn?.seconds || 0));
                renderizarTransacciones(docs);
            });
        });
    }

    function renderizarTransacciones(docs) {
        let tIng = 0, tGas = 0;
        const list = document.getElementById("listaFinanzas");
        if (!list) return;

        list.innerHTML = docs.length === 0 
            ? `<div class="p-20 text-center opacity-20 orbitron italic text-[10px]">LIBRO VACÍO - ESPERANDO FLUJO</div>`
            : docs.map(m => {
                const monto = Number(m.monto || 0);
                const ing = esIngreso(m.tipo);
                ing ? tIng += monto : tGas += monto;

                const estilo = obtenerEstilo(m.tipo);
                const fecha = m.creadoEn?.toDate() ? m.creadoEn.toDate().toLocaleString() : 'PROCESANDO...';

                return `
                <div class="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 flex justify-between items-center hover:border-cyan-500/40 transition-all">
                    <div class="flex items-center gap-5">
                        <div class="w-12 h-12 rounded-2xl ${estilo.bg} flex items-center justify-center border ${estilo.border}">
                            <i class="${estilo.icon} ${estilo.text}"></i>
                        </div>
                        <div>
                            <p class="text-xs font-black text-white uppercase">${m.concepto || 'S/N'}</p>
                            <p class="text-[7px] text-slate-500 orbitron uppercase font-bold">${fecha}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-black orbitron ${ing ? 'text-emerald-400' : 'text-red-500'}">
                            ${ing ? '+' : '-'} $${monto.toLocaleString()}
                        </p>
                        <span class="text-[6px] text-slate-600 orbitron uppercase font-black">${m.tipo?.replace(/_/g, ' ')}</span>
                    </div>
                </div>`;
            }).join("");
        
        actualizarDash(tIng, tGas);
    }

    async function registrarMovimiento() {
        const concepto = document.getElementById("acc-concepto").value.trim().toUpperCase();
        const monto = Number(document.getElementById("acc-monto").value);
        const tipo = document.getElementById("acc-tipo").value;

        if (!concepto || monto <= 0) return Swal.fire({ icon: 'error', title: 'AUDITORÍA RECHAZADA', text: 'Monto y Concepto requeridos.', background: '#0d1117', color: '#fff' });

        try {
            await addDoc(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), {
                empresaId, concepto, tipo, monto,
                metodo: NEXUS_CONFIG.PAYMENT_METHODS.CASH,
                creadoEn: serverTimestamp()
            });
            document.getElementById("acc-concepto").value = "";
            document.getElementById("acc-monto").value = "";
            Swal.fire({ icon: 'success', title: 'BOVEDA ACTUALIZADA', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
        } catch (e) { console.error("Error al registrar:", e); }
    }

    const cargarVistaCuentas = async () => {
    const content = document.getElementById("cont-dynamic-content");
    content.innerHTML = `<div class="p-20 text-center orbitron text-cyan-500 animate-pulse uppercase tracking-[0.5em]">Consolidando Activos...</div>`;
    
    try {
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        
        // Inicializamos valores en 0
        let p = { ing: 0, gas: 0 };

        snap.forEach(d => {
            const m = d.data();
            // VALIDACIÓN CRÍTICA: Si el monto no existe o no es numérico, usamos 0
            const valorNumerico = Number(m.monto) || 0; 

            if (esIngreso(m.tipo)) {
                p.ing += valorNumerico;
            } else {
                p.gas += valorNumerico;
            }
        });

        const resultadoNeto = p.ing - p.gas;

        content.innerHTML = `
        <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-3xl">
            <h3 class="orbitron text-xl font-black text-amber-400 mb-10 italic uppercase text-center">Balance Consolidado Nexus-X</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                ${renderPucCard("TOTAL INGRESOS", p.ing, "border-emerald-500/20", "text-emerald-400")}
                ${renderPucCard("TOTAL EGRESOS", p.gas, "border-red-500/20", "text-red-500")}
                ${renderPucCard("RESULTADO NETO", resultadoNeto, "border-cyan-500/20", "text-cyan-400")}
            </div>
        </div>`;
        
        // Actualizamos también los indicadores superiores (Top Bar)
        actualizarDash(p.ing, p.gas);

    } catch (error) {
        console.error("Error en Auditoría:", error);
        content.innerHTML = `<div class="p-20 text-center orbitron text-red-500">Error al sincronizar bóveda.</div>`;
    }
};

// Antes de hacer el 'addDoc' o enviar el movimiento manual:
const montoLimpio = parseFloat(inputMonto.value.replace(/[^0-9.-]+/g, ""));
const conceptoLimpio = inputConcepto.value.trim();

if (!montoLimpio || conceptoLimpio === "") {
    // Aquí es donde se dispara tu modal de "Auditoría Rechazada"
    mostrarModalError("Monto y Concepto requeridos");
    return;
}

    function renderPucCard(title, total, border, text) {
    // Aseguramos que siempre sea un número para evitar el texto "NaN" en el HTML
    const valorFinal = Number(total) || 0;
    return `
        <div class="p-8 bg-black/40 rounded-[3rem] border ${border} backdrop-blur-sm">
            <p class="text-[9px] orbitron ${text} mb-4 font-black tracking-widest uppercase">${title}</p>
            <span class="text-2xl font-black orbitron ${text}">
                $ ${valorFinal.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
            </span>
        </div>`;
}

    function actualizarDash(ing, gas) {
        const util = ing - gas;
        const metrics = { "dash-ingresos": ing, "dash-gastos": gas, "dash-utilidad": util, "dash-caja": util };
        Object.entries(metrics).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.innerText = `$ ${val.toLocaleString()}`;
        });
    }

    function obtenerEstilo(t) {
        const c = NEXUS_CONFIG.FINANCE_TYPES;
        const map = {
            [c.REVENUE_OT]: { icon: 'fas fa-wrench', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            [c.EXPENSE_PAYROLL]: { icon: 'fas fa-user-tie', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            [c.EXPENSE_OPERATIONAL]: { icon: 'fas fa-industry', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            [c.REVENUE_CAPITAL]: { icon: 'fas fa-vault', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' }
        };
        return map[t] || { icon: 'fas fa-exchange-alt', text: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/10' };
    }

    renderLayout();
}

