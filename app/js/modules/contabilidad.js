/**
 * contabilidad.js - NEXUS-X MASTER-CORE V21.7 🏛️
 * Versión Final Unificada: Estabilidad Total y Blindaje de IDs
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, getDocs, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";
import { NexusSystem } from '../system/nexus-core.js';

export default async function contabilidad(container) {
    // 1. BLINDAJE DE IDENTIDAD CON FALLBACK DOBLE
    const obtenerEmpresaId = () => {
        const id = (localStorage.getItem("nexus_empresaId") || 
                   localStorage.getItem("empresaId") || 
                   "NO_ID").trim();
        console.log("🏛️ Nexus Core: Identidad vinculada a ->", id);
        return id;
    };

    let empresaId = obtenerEmpresaId();
    let vistaActual = "DIARIO"; 
    let unsubscribe = null;

    // Mapeo Maestro de Tipos (Sincronizado con tu Base de Datos)
    const MAP_TIPOS = {
        ingresos: ['ingreso_ot', 'venta_repuesto', 'capital_inicial', 'capital'],
        gastos: ['gasto_operativo', 'gasto_insumos', 'nomina_pago', 'nomina'],
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
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-2 italic italic">Global Ledger & Fiscal Control</p>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-emerald-500/20 text-center shadow-2xl shadow-emerald-500/5">
                        <span class="text-[8px] orbitron text-emerald-400 block mb-1 uppercase">Ingresos Totales</span>
                        <h2 id="dash-ingresos" class="text-xl font-black orbitron text-emerald-400">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-red-500/20 text-center shadow-2xl shadow-red-500/5">
                        <span class="text-[8px] orbitron text-red-500 block mb-1 uppercase">Gastos Totales</span>
                        <h2 id="dash-gastos" class="text-xl font-black orbitron text-red-500">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-amber-500/20 text-center shadow-2xl shadow-amber-500/5">
                        <span class="text-[8px] orbitron text-amber-500 block mb-1 uppercase">Utilidad Neta</span>
                        <h2 id="dash-utilidad" class="text-xl font-black orbitron text-amber-400">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-cyan-500/20 text-center shadow-2xl shadow-cyan-500/5">
                        <span class="text-[8px] orbitron text-cyan-400 block mb-1 uppercase">Caja Disponible</span>
                        <h2 id="dash-caja" class="text-xl font-black orbitron text-cyan-400">$ 0</h2>
                    </div>
                </div>
            </header>

            <nav class="flex justify-center gap-4 mb-12 bg-[#0d1117]/50 p-2 rounded-full border border-white/5 w-fit mx-auto">
                <button id="btn-vista-diario" class="px-8 py-3 rounded-full orbitron text-[10px] font-black transition-all">LIBRO DIARIO</button>
                <button id="btn-vista-puc" class="px-8 py-3 rounded-full orbitron text-[10px] font-black transition-all">PLAN PUC / BALANCES</button>
            </nav>

            <div id="cont-dynamic-content" class="animate-in slide-in-from-bottom-5 duration-700"></div>
        </div>`;
        
        setupNavigation();
        if (vistaActual === "DIARIO") cargarVistaDiaria();
        else cargarVistaCuentas();
    };

    const setupNavigation = () => {
        const btnDiario = document.getElementById("btn-vista-diario");
        const btnPuc = document.getElementById("btn-vista-puc");
        
        btnDiario.className = `px-8 py-3 rounded-full orbitron text-[10px] font-black ${vistaActual === 'DIARIO' ? 'bg-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.4)]' : 'text-slate-500 hover:text-white'}`;
        btnPuc.className = `px-8 py-3 rounded-full orbitron text-[10px] font-black ${vistaActual === 'CUENTAS' ? 'bg-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.4)]' : 'text-slate-500 hover:text-white'}`;

        btnDiario.onclick = () => { vistaActual = "DIARIO"; renderLayout(); };
        btnPuc.onclick = () => { vistaActual = "CUENTAS"; renderLayout(); };
    };

    const cargarVistaDiaria = () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl sticky top-10">
                    <p class="orbitron text-[10px] text-amber-500 font-black mb-6 uppercase tracking-widest italic italic">Nuevo Asiento Contable</p>
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
        empresaId = obtenerEmpresaId();

        const q = query(
            collection(db, "contabilidad"), 
            where("empresaId", "==", empresaId), 
            orderBy("creadoEn", "desc")
        );

        unsubscribe = onSnapshot(q, (snap) => {
            let tIngresos = 0, tGastos = 0, tNotas = 0;
            const list = document.getElementById("listaFinanzas");
            if (!list) return;

            // 1. CÁLCULO AGRESIVO PRE-RENDER
            snap.docs.forEach(docSnap => {
                const m = docSnap.data();
                const v = parseFloat(m.monto || 0);
                if (MAP_TIPOS.ingresos.includes(m.tipo)) tIngresos += v;
                else if (MAP_TIPOS.notas.includes(m.tipo)) tNotas += v;
                else tGastos += v;
            });

            // 2. ACTUALIZACIÓN DE DASHBOARD INMEDIATA
            actualizarTotales(tIngresos, tGastos, tNotas);

            if (snap.empty) {
                list.innerHTML = `<div class="p-20 text-center opacity-20 orbitron italic text-xs">SIN MOVIMIENTOS DETECTADOS</div>`;
                return;
            }

            // 3. RENDERIZADO DE LISTA
            list.innerHTML = snap.docs.map(docSnap => {
                const m = docSnap.data();
                const v = parseFloat(m.monto || 0);
                const esIngreso = MAP_TIPOS.ingresos.includes(m.tipo);
                const estilo = obtenerEstilo(m.tipo);
                const fecha = m.creadoEn ? m.creadoEn.toDate().toLocaleString() : 'SYNC...';

                return `
                <div class="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 flex justify-between items-center group hover:bg-white/[0.02] transition-all">
                    <div class="flex items-center gap-5">
                        <div class="w-12 h-12 rounded-2xl ${estilo.bg} flex items-center justify-center border ${estilo.border} group-hover:rotate-12 transition-transform">
                            <i class="${estilo.icon} ${estilo.text}"></i>
                        </div>
                        <div>
                            <p class="text-xs font-black text-white uppercase tracking-tighter">${m.concepto}</p>
                            <p class="text-[7px] text-slate-500 orbitron uppercase font-bold">${fecha}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-black orbitron ${esIngreso ? 'text-emerald-400' : 'text-red-500'}">
                            ${esIngreso ? '+' : '-'} $${v.toLocaleString()}
                        </p>
                        <p class="text-[6px] text-slate-600 orbitron uppercase font-black tracking-widest">${m.tipo}</p>
                    </div>
                </div>`;
            }).join("");

            NexusSystem.saveBunker('contabilidad', snap.docs.map(d => d.data()));
        });
    }

    function actualizarTotales(ing, gas, not) {
        const util = ing - gas - not;
        
        // SELECTORES AGRESIVOS PARA EVITAR EL $0 POR ERROR DE ID
        const setValor = (id, valor, clase) => {
            const el = document.getElementById(id);
            if(el) el.innerHTML = `<span class="${clase}">$ ${valor.toLocaleString()}</span>`;
        };

        setValor("dash-ingresos", ing, "text-emerald-400");
        setValor("dash-gastos", gas, "text-red-500");
        setValor("dash-utilidad", util, "text-amber-400");
        setValor("dash-caja", util, "text-cyan-400");
    }

    const cargarVistaCuentas = async () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `
        <div class="bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 shadow-3xl animate-in zoom-in-95 duration-500">
            <h3 class="orbitron text-xl font-black mb-10 text-amber-400 italic italic">BALANCE OFICIAL PUC - NEXUS CORE</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="p-8 bg-black/40 rounded-[3rem] border border-emerald-500/10">
                    <p class="text-[9px] orbitron font-black text-emerald-400 mb-6 uppercase tracking-widest">Clase 4 - Ingresos</p>
                    <div class="space-y-3" id="puc-clase-4"></div>
                </div>
                <div class="p-8 bg-black/40 rounded-[3rem] border border-red-500/10">
                    <p class="text-[9px] orbitron font-black text-red-500 mb-6 uppercase tracking-widest">Clase 5 - Gastos</p>
                    <div class="space-y-3" id="puc-clase-5"></div>
                </div>
                <div class="p-8 bg-black/40 rounded-[3rem] border border-amber-500/10">
                    <p class="text-[9px] orbitron font-black text-amber-500 mb-6 uppercase tracking-widest">Clase 1 - Activos</p>
                    <div class="space-y-3" id="puc-clase-1"></div>
                </div>
            </div>
        </div>`;
        calcularPUC();
    };

    const calcularPUC = async () => {
        const snap = await getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId)));
        const p = { '4135': 0, '413505': 0, '5105': 0, '5195': 0, '1105': 0 };

        snap.forEach(d => {
            const m = d.data();
            const val = parseFloat(m.monto || 0);
            if(['ingreso_ot'].includes(m.tipo)) p['4135'] += val;
            if(['venta_repuesto'].includes(m.tipo)) p['413505'] += val;
            if(['nomina_pago', 'nomina'].includes(m.tipo)) p['5105'] += val;
            if(['gasto_operativo', 'gasto_insumos'].includes(m.tipo)) p['5195'] += val;
            if(['capital_inicial', 'capital'].includes(m.tipo)) p['1105'] += val;
        });

        const row = (c, v) => `
        <div class="flex justify-between border-b border-white/5 pb-2">
            <span class="text-[9px] text-slate-400 font-mono">${c}</span>
            <span class="text-[10px] text-white font-black">$ ${v.toLocaleString()}</span>
        </div>`;

        document.getElementById("puc-clase-4").innerHTML = row('4135 - SERVICIOS', p['4135']) + row('413505 - REPUESTOS', p['413505']);
        document.getElementById("puc-clase-5").innerHTML = row('5105 - NÓMINA', p['5105']) + row('5195 - DIVERSOS', p['5195']);
        document.getElementById("puc-clase-1").innerHTML = row('1105 - CAJA GRAL', p['1105']);
    };

    const obtenerEstilo = (tipo) => {
        const estilos = {
            ingreso_ot: { icon: 'fas fa-file-invoice-dollar', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            venta_repuesto: { icon: 'fas fa-gears', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
            nomina_pago: { icon: 'fas fa-id-card-clip', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            capital_inicial: { icon: 'fas fa-vault', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            gasto_operativo: { icon: 'fas fa-receipt', text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' }
        };
        return estilos[tipo] || { icon: 'fas fa-cash-register', text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
    };

    async function registrarMovimiento() {
        const cIn = document.getElementById("acc-concepto");
        const mIn = document.getElementById("acc-monto");
        const tIn = document.getElementById("acc-tipo");
        const monto = parseFloat(mIn.value);

        if (!cIn.value || isNaN(monto) || monto <= 0) return;

        const data = NexusSystem.sanitize('contabilidad', { 
            empresaId, 
            concepto: cIn.value.toUpperCase(), 
            tipo: tIn.value, 
            monto, 
            creadoEn: serverTimestamp() 
        });

        try {
            await addDoc(collection(db, "contabilidad"), data);
            cIn.value = ""; mIn.value = "";
        } catch (e) { console.error("Error Nexus:", e); }
    }

    renderLayout();
}
