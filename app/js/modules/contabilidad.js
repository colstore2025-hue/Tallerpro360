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

    // --- MOTOR DE DECISIÓN FINANCIERA ---
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
                    <p class="orbitron text-[10px] text-cyan-500 font-black mb-6 uppercase italic tracking-[0.2em]">Inyección Manual</p>
                    <div class="space-y-5">
                        <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-sm focus:border-cyan-500 outline-none transition-all" placeholder="CONCEPTO...">
                        <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-cyan-400 font-black orbitron text-[10px] uppercase">
                            <option value="${NEXUS_CONFIG.FINANCE_TYPES.REVENUE_OT}">4135 - INGRESO POR SERVICIOS</option>
                            <option value="${NEXUS_CONFIG.FINANCE_TYPES.EXPENSE_OPERATIONAL}">5195 - GASTOS OPERATIVOS</option>
                            <option value="${NEXUS_CONFIG.FINANCE_TYPES.EXPENSE_PAYROLL}">5105 - PAGO NÓMINA</option>
                        </select>
                        <input id="acc-monto" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-xl" placeholder="0.00">
                        <button id="btnGuardarFinanza" class="w-full bg-cyan-500 text-black font-black orbitron py-5 rounded-2xl hover:scale-105 transition-all uppercase shadow-lg">SINCRONIZAR BÓVEDA</button>
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

    const cargarVistaCuentas = async () => {
    const content = document.getElementById("cont-dynamic-content");
    // 1. EFECTO VISUAL DE CARGA NEXUS
    content.innerHTML = `<div class="p-20 text-center orbitron text-cyan-500 animate-pulse uppercase tracking-[0.5em]">Consolidando Activos...</div>`;
    
    try {
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        
        // 2. ACUMULADORES BLINDADOS
        let p = { ing: 0, gas: 0 };

        snap.forEach(d => {
            const data = d.data();
            
            // 3. CAPTURA MULTI-ORIGEN (Detección forense de montos)
            // Esto atrapa el valor si se guardó como 'monto', 'total' o 'valor'
            const valorRaw = data.monto ?? data.total ?? data.valor ?? 0;
            const valor = Number(valorRaw);

            // 4. FILTRO DE INTEGRIDAD
            if (!isNaN(valor) && isFinite(valor)) {
                if (esIngreso(data.tipo)) {
                    p.ing += valor;
                } else {
                    p.gas += valor;
                }
            }
        });

        // 5. INYECCIÓN DE INTERFAZ DE ALTO IMPACTO
        content.innerHTML = `
        <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-3xl animate-in zoom-in duration-500">
            <h3 class="orbitron text-xl font-black text-amber-400 mb-10 italic uppercase text-center tracking-widest">Balance Consolidado Nexus-X</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                ${renderPucCard("TOTAL INGRESOS", p.ing, "border-emerald-500/20", "text-emerald-400")}
                ${renderPucCard("TOTAL EGRESOS", p.gas, "border-red-500/20", "text-red-500")}
                ${renderPucCard("RESULTADO NETO", p.ing - p.gas, "border-cyan-500/20", "text-cyan-400")}
            </div>
        </div>`;
        
        // 6. SINCRONIZACIÓN CON EL DASHBOARD SUPERIOR
        actualizarDash(p.ing, p.gas);

    } catch (e) {
        console.error("CRITICAL_BI_FAILURE:", e);
        content.innerHTML = `
        <div class="p-20 text-center border border-red-600/20 rounded-[3rem] bg-red-600/5">
            <i class="fas fa-radiation text-red-500 text-4xl mb-4 animate-pulse"></i>
            <div class="orbitron text-red-500 font-black">ERROR EN CRONOLOGÍA FINANCIERA</div>
            <p class="text-[8px] text-slate-500 mt-2 uppercase">Fallo en sincronización de activos - Verifique conexión Cloud</p>
        </div>`;
    }
};

    async function registrarMovimiento() {
        const inputConcepto = document.getElementById("acc-concepto");
        const inputMonto = document.getElementById("acc-monto");
        const tipo = document.getElementById("acc-tipo").value;

        const conceptoLimpio = inputConcepto.value.trim().toUpperCase();
        const montoLimpio = parseFloat(inputMonto.value);

        // AUDITORÍA FORZADA
        if (!conceptoLimpio || isNaN(montoLimpio) || montoLimpio <= 0) {
            return Swal.fire({ icon: 'error', title: 'AUDITORÍA RECHAZADA', text: 'Monto y Concepto requeridos.', background: '#0d1117', color: '#fff' });
        }

        try {
            await addDoc(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), {
                empresaId, concepto: conceptoLimpio, tipo, monto: montoLimpio,
                metodo: NEXUS_CONFIG.PAYMENT_METHODS.CASH,
                creadoEn: serverTimestamp()
            });
            inputConcepto.value = ""; inputMonto.value = "";
            Swal.fire({ icon: 'success', title: 'SINCRONIZADO', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
        } catch (e) { console.error(e); }
    }

    function renderPucCard(title, total, border, text) {
        const valorFinal = Number(total) || 0;
        return `
        <div class="p-8 bg-black/40 rounded-[3rem] border ${border} hover:bg-white/5 transition-all">
            <p class="text-[9px] orbitron ${text} mb-4 font-black tracking-widest uppercase">${title}</p>
            <span class="text-2xl font-black orbitron ${text}">$ ${valorFinal.toLocaleString('es-CO')}</span>
        </div>`;
    }

    function actualizarDash(ing, gas) {
        const util = ing - gas;
        const metrics = { "dash-ingresos": ing, "dash-gastos": gas, "dash-utilidad": util, "dash-caja": util };
        Object.entries(metrics).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.innerText = `$ ${val.toLocaleString('es-CO')}`;
        });
    }

    // --- MOTOR DE ESCUCHA EN TIEMPO REAL (CLIENT-SIDE SORTING) ---
    function escucharContabilidad() {
        if (unsubscribe) unsubscribe();
        if (!empresaId) return;

        const collectionRef = collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING);
        
        // 🛠️ ESTRATEGIA: Filtramos por empresa pero delegamos el orden al cliente
        // Esto evita el error de "Index missing" y el lag de visualización.
        const qOficial = query(
            collectionRef, 
            where("empresaId", "==", empresaId)
        );

        unsubscribe = onSnapshot(qOficial, (snap) => {
            const transacciones = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            // ⚡ ORDENAMIENTO DE ALTA PRIORIDAD (Más reciente arriba)
            transacciones.sort((a, b) => {
                const dateA = a.creadoEn?.seconds || 0;
                const dateB = b.creadoEn?.seconds || 0;
                return dateB - dateA;
            });

            renderizarTransacciones(transacciones);
        }, (error) => {
            console.error("Nexus-X Sync Error:", error);
        });
    }

    // --- RENDERIZADO DE TRANSACCIONES (LIBRO DIARIO) ---
    function renderizarTransacciones(docs) {
        let tI = 0, tG = 0;
        const list = document.getElementById("listaFinanzas");
        if (!list) return;

        if (docs.length === 0) {
            list.innerHTML = `<div class="p-20 text-center opacity-20 orbitron italic text-[10px]">LIBRO VACÍO - ESPERANDO FLUJO</div>`;
            actualizarDash(0, 0);
            return;
        }

        list.innerHTML = docs.map(m => {
            const val = Number(m.monto) || 0;
            const ing = esIngreso(m.tipo);
            
            // Acumulación para el Dashboard Superior
            ing ? tI += val : tG += val;

            const estilo = obtenerEstilo(m.tipo);
            const fechaLabel = m.creadoEn?.toDate() 
                ? m.creadoEn.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : 'SYNC...';

            return `
            <div class="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 flex justify-between items-center hover:border-cyan-500/40 transition-all mb-4">
                <div class="flex items-center gap-5">
                    <div class="w-12 h-12 rounded-2xl ${estilo.bg} flex items-center justify-center border ${estilo.border}">
                        <i class="${estilo.icon} ${estilo.text}"></i>
                    </div>
                    <div>
                        <p class="text-xs font-black text-white uppercase">${m.concepto || 'S/N'}</p>
                        <p class="text-[7px] text-slate-500 orbitron uppercase font-bold">${fechaLabel}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-lg font-black orbitron ${ing ? 'text-emerald-400' : 'text-red-500'}">
                        ${ing ? '+' : '-'} $${val.toLocaleString()}
                    </p>
                    <span class="text-[6px] text-slate-600 orbitron uppercase font-black">${m.tipo?.replace(/_/g, ' ')}</span>
                </div>
            </div>`;
        }).join("");
        
        // Sincronización inmediata con los DashCards superiores
        actualizarDash(tI, tG);
    }

    // --- DICCIONARIO DE ESTILOS VISUALES ---
    function obtenerEstilo(t) {
        const c = NEXUS_CONFIG.FINANCE_TYPES;
        const map = { 
            [c.REVENUE_OT]: { icon: 'fas fa-wrench', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            [c.EXPENSE_PAYROLL]: { icon: 'fas fa-user-tie', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            [c.EXPENSE_OPERATIONAL]: { icon: 'fas fa-industry', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            [c.REVENUE_CAPITAL]: { icon: 'fas fa-vault', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' }
        };
        return map[t] || { icon: 'fas fa-coins', text: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/10' };
    }

    // --- DISPARO INICIAL DEL COMPONENTE ---
    renderLayout();
} // <--- CIERRE FINAL DE: export default async function contabilidad(container)
