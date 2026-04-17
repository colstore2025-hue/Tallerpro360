/**
 * contabilidad.js - NEXUS-X MASTER-CORE V21.7 🏛️
 * Motor Financiero de Alta Precisión - VERSIÓN INTEGRAL BLINDADA
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, getDocs, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";

export default async function contabilidad(container) {
    // 1. BLINDAJE DE IDENTIDAD: Limpieza agresiva de IDs para evitar fallos de consulta
    const empresaId = (localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId") || "").trim();
    let vistaActual = "DIARIO"; 
    let unsubscribe = null;

    // 2. MOTOR DE AUDITORÍA INTERNA: Normaliza tipos de datos para asegurar visibilidad
    const MAP_TIPOS = {
        ingresos: ['ingreso_ot', 'venta_repuesto', 'capital_inicial', 'capital', 'ingreso'],
        gastos: ['gasto_operativo', 'gasto_insumos', 'nomina_pago', 'nomina', 'gasto', 'egreso'],
        notas: ['nota_credito', 'garantia']
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32 animate-in fade-in duration-500">
            <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12 border-b border-white/10 pb-10">
                <div class="text-center lg:text-left">
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter uppercase">
                        FINANCE <span class="text-amber-400">CORE</span><span class="text-cyan-500 text-xl">.V21.7</span>
                    </h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-2 italic">Global Ledger & Fiscal Control</p>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    ${['INGRESOS', 'GASTOS', 'UTILIDAD', 'CAJA'].map(label => `
                        <div class="bg-[#0d1117] p-5 rounded-3xl border border-white/5 text-center shadow-2xl group hover:border-amber-500/30 transition-all">
                            <span class="text-[8px] orbitron ${label === 'GASTOS' ? 'text-red-500' : 'text-emerald-400'} block mb-1">${label}</span>
                            <h2 id="dash-${label.toLowerCase()}" class="text-xl font-black orbitron">$ 0</h2>
                        </div>
                    `).join('')}
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

    const setupNavigation = () => {
        const btnD = document.getElementById("btn-vista-diario");
        const btnP = document.getElementById("btn-vista-puc");
        const activeClass = "bg-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.4)]";
        const inactiveClass = "text-slate-500 hover:text-white";

        btnD.className = `px-8 py-3 rounded-full orbitron text-[10px] font-black ${vistaActual === 'DIARIO' ? activeClass : inactiveClass}`;
        btnP.className = `px-8 py-3 rounded-full orbitron text-[10px] font-black ${vistaActual === 'CUENTAS' ? activeClass : inactiveClass}`;

        btnD.onclick = () => { vistaActual = "DIARIO"; renderLayout(); };
        btnP.onclick = () => { vistaActual = "CUENTAS"; renderLayout(); };
    };

    const cargarVistaDiaria = () => {
        document.getElementById("cont-dynamic-content").innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl sticky top-10">
                    <p class="orbitron text-[10px] text-amber-500 font-black mb-6 uppercase tracking-widest italic">Nuevo Asiento Contable</p>
                    <div class="space-y-5">
                        <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 outline-none focus:border-amber-500 font-bold text-white uppercase text-sm" placeholder="CONCEPTO...">
                        <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-amber-400 font-black orbitron text-[10px] uppercase">
                            <option value="ingreso_ot">4135 - SERVICIOS MECÁNICOS</option>
                            <option value="venta_repuesto">413505 - VENTA REPUESTOS</option>
                            <option value="gasto_operativo">5195 - GASTOS DIVERSOS</option>
                            <option value="nomina_pago">5105 - PAGO NÓMINA</option>
                            <option value="capital_inicial">1105 - APORTE CAPITAL</option>
                        </select>
                        <input id="acc-monto" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-xl focus:border-amber-500" placeholder="0.00">
                        <button id="btnGuardarFinanza" class="w-full bg-white text-black font-black orbitron py-5 rounded-2xl hover:bg-amber-400 transition-all uppercase tracking-widest">Sincronizar Libro +</button>
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
        // Verificamos que empresaId no sea nulo antes de la consulta
        if (!empresaId) return;

        const q = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId), orderBy("creadoEn", "desc"));

        unsubscribe = onSnapshot(q, (snap) => {
            let totals = { ingresos: 0, gastos: 0, notas: 0 };
            const list = document.getElementById("listaFinanzas");
            if (!list) return;

            if (snap.empty) {
                list.innerHTML = `<div class="p-20 text-center opacity-20 orbitron italic text-xs uppercase tracking-widest">Esperando Transacciones...</div>`;
                actualizarDashboard(0, 0, 0);
                return;
            }

            list.innerHTML = snap.docs.map(docSnap => {
                const m = docSnap.data();
                // NORMALIZACIÓN: Forzamos a número para evitar que el dashboard quede "ciego"
                const v = parseFloat(m.monto || 0);
                const tipo = (m.tipo || "").toLowerCase();
                
                const esIngreso = MAP_TIPOS.ingresos.includes(tipo);
                const esNota = MAP_TIPOS.notas.includes(tipo);

                if (esNota) totals.notas += v;
                else if (esIngreso) totals.ingresos += v;
                else totals.gastos += v;

                const estilo = obtenerEstilo(tipo);
                return `
                <div class="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 flex justify-between items-center group hover:border-amber-500/20 transition-all">
                    <div class="flex items-center gap-5">
                        <div class="w-12 h-12 rounded-2xl ${estilo.bg} flex items-center justify-center border ${estilo.border}">
                            <i class="${estilo.icon} ${estilo.text}"></i>
                        </div>
                        <div>
                            <p class="text-xs font-black text-white uppercase">${m.concepto}</p>
                            <p class="text-[7px] text-slate-500 orbitron">${m.creadoEn?.toDate().toLocaleString() || 'PENDIENTE'}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-black orbitron ${esIngreso ? 'text-emerald-400' : 'text-red-500'}">${esIngreso ? '+' : '-'} $${v.toLocaleString()}</p>
                        <p class="text-[6px] text-slate-600 orbitron uppercase font-black">${tipo}</p>
                    </div>
                </div>`;
            }).join("");

            actualizarDashboard(totals.ingresos, totals.gastos, totals.notas);
        });
    }

    const actualizarDashboard = (ing, gas, not) => {
        const util = ing - gas - not;
        document.getElementById("dash-ingresos").innerText = `$ ${ing.toLocaleString()}`;
        document.getElementById("dash-gastos").innerText = `$ ${gas.toLocaleString()}`;
        document.getElementById("dash-utilidad").innerText = `$ ${util.toLocaleString()}`;
        document.getElementById("dash-caja").innerText = `$ ${util.toLocaleString()}`;
    };

    const cargarVistaCuentas = async () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `<div class="bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 shadow-3xl text-center"><p class="orbitron text-xs animate-pulse">GENERANDO BALANCE MAESTRO...</p><div id="puc-grid"></div></div>`;
        
        const snap = await getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId)));
        const p = { '4135': 0, '413505': 0, '5105': 0, '5195': 0, '1105': 0 };

        snap.forEach(d => {
            const m = d.data();
            const val = parseFloat(m.monto || 0);
            const tipo = m.tipo || "";
            if (tipo === 'ingreso_ot') p['4135'] += val;
            if (tipo === 'venta_repuesto') p['413505'] += val;
            if (tipo === 'nomina_pago') p['5105'] += val;
            if (tipo === 'gasto_operativo') p['5195'] += val;
            if (tipo === 'capital_inicial') p['1105'] += val;
        });

        document.getElementById("puc-grid").innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            <div class="p-8 bg-black/40 rounded-[3rem] border border-emerald-500/10">
                <p class="text-[9px] orbitron font-black text-emerald-400 mb-6 uppercase">Clase 4 - Ingresos</p>
                ${rowPUC('4135 - SERVICIOS', p['4135'])}${rowPUC('413505 - REPUESTOS', p['413505'])}
            </div>
            <div class="p-8 bg-black/40 rounded-[3rem] border border-red-500/10">
                <p class="text-[9px] orbitron font-black text-red-500 mb-6 uppercase">Clase 5 - Gastos</p>
                ${rowPUC('5105 - NÓMINA', p['5105'])}${rowPUC('5195 - DIVERSOS', p['5195'])}
            </div>
            <div class="p-8 bg-black/40 rounded-[3rem] border border-amber-500/10">
                <p class="text-[9px] orbitron font-black text-amber-500 mb-6 uppercase">Clase 1 - Activos</p>
                ${rowPUC('1105 - CAJA GRAL', p['1105'])}
            </div>
        </div>`;
    };

    const rowPUC = (name, value) => `<div class="flex justify-between border-b border-white/5 pb-2 mb-2"><span class="text-[9px] text-slate-400 font-mono">${name}</span><span class="text-[10px] text-white font-black">$ ${value.toLocaleString()}</span></div>`;

    const obtenerEstilo = (tipo) => {
        const mapping = {
            ingreso_ot: { icon: 'fas fa-file-invoice-dollar', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            venta_repuesto: { icon: 'fas fa-gears', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
            nomina_pago: { icon: 'fas fa-id-card-clip', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            capital_inicial: { icon: 'fas fa-vault', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            gasto_operativo: { icon: 'fas fa-receipt', text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' }
        };
        return mapping[tipo] || { icon: 'fas fa-receipt', text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-white/5' };
    };

    async function registrarMovimiento() {
        const cEl = document.getElementById("acc-concepto");
        const mEl = document.getElementById("acc-monto");
        const tEl = document.getElementById("acc-tipo");
        const montoVal = parseFloat(mEl.value);

        if (!cEl.value || isNaN(montoVal) || montoVal <= 0) return;

        try {
            await addDoc(collection(db, "contabilidad"), {
                empresaId: empresaId,
                concepto: cEl.value.toUpperCase().trim(),
                tipo: tEl.value,
                monto: montoVal, // Registro numérico nativo
                creadoEn: serverTimestamp()
            });
            cEl.value = ""; mEl.value = "";
        } catch (e) { console.error("Error Nexus-Core Registry:", e); }
    }

    renderLayout();
}
