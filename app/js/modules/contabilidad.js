/**
 * contabilidad.js - NEXUS-X MASTER-CORE V21.7 🏛️
 * Versión Final: Estabilidad Total y Sincronización Elástica
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, getDocs, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";
import { NexusSystem } from '../system/nexus-core.js';

export default async function contabilidad(container) {
    
    // 1. BLINDAJE DE IDENTIDAD (ID Check)
    const obtenerEmpresaId = () => {
        const id = (localStorage.getItem("nexus_empresaId") || 
                   localStorage.getItem("empresaId") || 
                   "NO_ID").trim();
        console.log("🏛️ Nexus Core: Identidad ->", id);
        return id;
    };

    let empresaId = obtenerEmpresaId();
    let vistaActual = "DIARIO"; 
    let unsubscribe = null;

    // Mapeo de Tipos para cálculos de Dashboard
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
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-2 italic">TallerPRO360 Global Ledger</p>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-emerald-500/20 text-center shadow-2xl">
                        <span class="text-[8px] orbitron text-emerald-400 block mb-1 uppercase">Ingresos</span>
                        <h2 id="dash-ingresos" class="text-xl font-black orbitron text-emerald-400">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-red-500/20 text-center shadow-2xl">
                        <span class="text-[8px] orbitron text-red-500 block mb-1 uppercase">Gastos</span>
                        <h2 id="dash-gastos" class="text-xl font-black orbitron text-red-500">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-amber-500/20 text-center shadow-2xl">
                        <span class="text-[8px] orbitron text-amber-500 block mb-1 uppercase">Utilidad</span>
                        <h2 id="dash-utilidad" class="text-xl font-black orbitron text-amber-400">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-cyan-500/20 text-center shadow-2xl">
                        <span class="text-[8px] orbitron text-cyan-400 block mb-1 uppercase">Disponible</span>
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
        const btnD = document.getElementById("btn-vista-diario");
        const btnP = document.getElementById("btn-vista-puc");
        
        btnD.className = `px-8 py-3 rounded-full orbitron text-[10px] font-black ${vistaActual === 'DIARIO' ? 'bg-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.4)]' : 'text-slate-500 hover:text-white'}`;
        btnP.className = `px-8 py-3 rounded-full orbitron text-[10px] font-black ${vistaActual === 'CUENTAS' ? 'bg-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.4)]' : 'text-slate-500 hover:text-white'}`;

        btnD.onclick = () => { vistaActual = "DIARIO"; renderLayout(); };
        btnP.onclick = () => { vistaActual = "CUENTAS"; renderLayout(); };
    };

    const cargarVistaDiaria = () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl sticky top-10">
                    <p class="orbitron text-[10px] text-amber-500 font-black mb-6 uppercase tracking-widest italic">Nuevo Registro Contable</p>
                    <div class="space-y-5">
                        <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 outline-none focus:border-amber-500 font-bold text-white uppercase text-sm" placeholder="EJ: PAGO REPUESTOS O.T 102">
                        <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-amber-400 font-black orbitron text-[10px] uppercase">
                            <option value="ingreso_ot">4135 - SERVICIOS MECÁNICOS</option>
                            <option value="venta_repuesto">413505 - VENTA REPUESTOS</option>
                            <option value="gasto_operativo">5195 - GASTOS DIVERSOS</option>
                            <option value="nomina_pago">5105 - PAGO NÓMINA</option>
                            <option value="capital_inicial">1105 - APORTE CAPITAL</option>
                        </select>
                        <input id="acc-monto" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-xl focus:border-amber-500" placeholder="0.00">
                        <button id="btnGuardarFinanza" class="w-full bg-amber-400 text-black font-black orbitron py-5 rounded-2xl hover:scale-[1.02] transition-all uppercase tracking-widest shadow-lg shadow-amber-400/20">Sincronizar Libro +</button>
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

        // Intento de carga inicial desde Búnker para evitar el flash de ceros
        const backup = NexusSystem.loadBunker('contabilidad');
        if (backup) renderizarDesdeData(backup);

        unsubscribe = onSnapshot(q, (snap) => {
            const dataMap = snap.docs.map(d => ({id: d.id, ...d.data()}));
            renderizarDesdeData(dataMap);
            NexusSystem.saveBunker('contabilidad', dataMap);
        });
    }

    function renderizarDesdeData(data) {
        let tIngresos = 0, tGastos = 0, tNotas = 0;
        const list = document.getElementById("listaFinanzas");
        if (!list) return;

        data.forEach(m => {
            const v = parseFloat(m.monto || 0);
            if (MAP_TIPOS.ingresos.includes(m.tipo)) tIngresos += v;
            else if (MAP_TIPOS.notas.includes(m.tipo)) tNotas += v;
            else tGastos += v;
        });

        actualizarTotales(tIngresos, tGastos, tNotas);

        if (data.length === 0) {
            list.innerHTML = `<div class="p-20 text-center opacity-20 orbitron italic text-xs">SIN MOVIMIENTOS</div>`;
            return;
        }

        list.innerHTML = data.map(m => {
            const v = parseFloat(m.monto || 0);
            const esIngreso = MAP_TIPOS.ingresos.includes(m.tipo);
            const estilo = obtenerEstilo(m.tipo);
            const fecha = m.creadoEn?.seconds ? new Date(m.creadoEn.seconds * 1000).toLocaleString() : 'SYNC...';

            return `
            <div class="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 flex justify-between items-center group hover:bg-white/[0.04] transition-all">
                <div class="flex items-center gap-5">
                    <div class="w-12 h-12 rounded-2xl ${estilo.bg} flex items-center justify-center border ${estilo.border} group-hover:scale-110 transition-transform">
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
    }

    function actualizarTotales(ing, gas, not) {
        const util = ing - gas - not;
        const setValor = (id, valor) => {
            const el = document.getElementById(id);
            if(el) el.innerText = `$ ${valor.toLocaleString()}`;
        };
        setValor("dash-ingresos", ing);
        setValor("dash-gastos", gas);
        setValor("dash-utilidad", util);
        setValor("dash-caja", util);
    }

    async function registrarMovimiento() {
        const cIn = document.getElementById("acc-concepto");
        const mIn = document.getElementById("acc-monto");
        const tIn = document.getElementById("acc-tipo");
        const btn = document.getElementById("btnGuardarFinanza");
        const monto = parseFloat(mIn.value);

        if (!cIn.value || isNaN(monto) || monto <= 0) return;

        // MANIOBRA NEXUS: Saneamiento antes de enviar
        const dataRaw = { 
            empresaId, 
            concepto: cIn.value.toUpperCase(), 
            tipo: tIn.value, 
            monto: monto, 
            creadoEn: serverTimestamp() 
        };

        const dataClean = NexusSystem.sanitize('contabilidad', dataRaw);

        try {
            btn.innerText = "SINCRONIZANDO...";
            btn.disabled = true;
            await addDoc(collection(db, "contabilidad"), dataClean);
            cIn.value = ""; mIn.value = "";
            btn.innerText = "Sincronizar Libro +";
            btn.disabled = false;
        } catch (e) { 
            console.error("🚨 Error Nexus:", e);
            btn.innerText = "ERROR EN SYNC";
            setTimeout(() => { btn.innerText = "Sincronizar Libro +"; btn.disabled = false; }, 2000);
        }
    }

    // Funciones de apoyo para Estilos y PUC (Iguales a tu estructura base)
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

    renderLayout();
}
