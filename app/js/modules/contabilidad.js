/**
 * contabilidad.js - NEXUS-X MASTER-CORE V21.6 🏛️
 * REPARACIÓN FORENSE: Recuperación de visibilidad de datos
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, getDocs, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";

export default async function contabilidad(container) {
    // 1. LIMPIEZA RADICAL DEL ID
    const empresaId = (localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId") || "").trim();
    console.log("🔍 Buscando datos para Empresa ID:", `"${empresaId}"`);

    let vistaActual = "DIARIO"; 
    let unsubscribe = null;

    // MAPEO FLEXIBLE (Detecta variaciones en los nombres de los tipos)
    const ES_INGRESO = (t) => ['ingreso_ot', 'venta_repuesto', 'capital_inicial', 'capital', 'ingreso'].includes(t.toLowerCase());
    const ES_GASTO = (t) => ['gasto_operativo', 'gasto_insumos', 'nomina_pago', 'nomina', 'gasto', 'egreso'].includes(t.toLowerCase());

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32">
            <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12 border-b border-white/10 pb-10">
                <div class="text-center lg:text-left">
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter uppercase">
                        FINANCE <span class="text-amber-400">CORE</span><span class="text-cyan-500 text-xl">.V21.6</span>
                    </h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-2 italic">TallerPRO360 Real-Time Sync</p>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-emerald-500/20 text-center shadow-2xl">
                        <span class="text-[8px] orbitron text-emerald-400 block mb-1">INGRESOS</span>
                        <h2 id="dash-ingresos" class="text-xl font-black orbitron text-emerald-400">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-red-500/20 text-center shadow-2xl">
                        <span class="text-[8px] orbitron text-red-500 block mb-1">GASTOS</span>
                        <h2 id="dash-gastos" class="text-xl font-black orbitron text-red-500">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-amber-500/20 text-center shadow-2xl">
                        <span class="text-[8px] orbitron text-amber-500 block mb-1">UTILIDAD</span>
                        <h2 id="dash-utilidad" class="text-xl font-black orbitron text-amber-400">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-cyan-500/20 text-center shadow-2xl">
                        <span class="text-[8px] orbitron text-cyan-400 block mb-1">CAJA</span>
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
        document.getElementById("cont-dynamic-content").innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl sticky top-10">
                    <p class="orbitron text-[10px] text-amber-500 font-black mb-6 uppercase italic">Registro Maestro</p>
                    <div class="space-y-5">
                        <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-sm" placeholder="CONCEPTO...">
                        <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-amber-400 font-black orbitron text-[10px] uppercase">
                            <option value="ingreso_ot">4135 - SERVICIOS</option>
                            <option value="venta_repuesto">413505 - REPUESTOS</option>
                            <option value="gasto_operativo">5195 - GASTOS</option>
                            <option value="nomina_pago">5105 - NÓMINA</option>
                        </select>
                        <input id="acc-monto" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-xl" placeholder="0.00">
                        <button id="btnGuardarFinanza" class="w-full bg-amber-400 text-black font-black orbitron py-5 rounded-2xl hover:scale-105 transition-all uppercase">Sincronizar +</button>
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
        const q = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId), orderBy("creadoEn", "desc"));

        unsubscribe = onSnapshot(q, (snap) => {
            let tIngresos = 0, tGastos = 0;
            const list = document.getElementById("listaFinanzas");
            if (!list) return;

            if (snap.empty) {
                list.innerHTML = `<div class="p-20 text-center opacity-20 orbitron italic text-xs">ID: ${empresaId} - SIN DATOS</div>`;
                actualizarDash(0, 0);
                return;
            }

            list.innerHTML = snap.docs.map(docSnap => {
                const m = docSnap.data();
                // CONVERSIÓN FORZADA A NÚMERO (Solución al error del gasto invisible)
                const v = parseFloat(m.monto || 0);
                const esIng = ES_INGRESO(m.tipo);

                if (esIng) tIngresos += v; else tGastos += v;

                const fecha = m.creadoEn ? m.creadoEn.toDate().toLocaleString() : 'PENDIENTE...';
                return `
                <div class="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 flex justify-between items-center group">
                    <div class="flex items-center gap-5">
                        <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                            <i class="fas ${esIng ? 'fa-plus text-emerald-400' : 'fa-minus text-red-500'}"></i>
                        </div>
                        <div>
                            <p class="text-xs font-black text-white uppercase">${m.concepto}</p>
                            <p class="text-[7px] text-slate-500 orbitron">${fecha}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-black orbitron ${esIng ? 'text-emerald-400' : 'text-red-500'}">
                            $${v.toLocaleString()}
                        </p>
                        <p class="text-[6px] text-slate-600 orbitron uppercase font-black">${m.tipo}</p>
                    </div>
                </div>`;
            }).join("");

            actualizarDash(tIngresos, tGastos);
        });
    }

    function actualizarDash(ing, gas) {
        const util = ing - gas;
        document.getElementById("dash-ingresos").innerText = `$ ${ing.toLocaleString()}`;
        document.getElementById("dash-gastos").innerText = `$ ${gas.toLocaleString()}`;
        document.getElementById("dash-utilidad").innerText = `$ ${util.toLocaleString()}`;
        document.getElementById("dash-caja").innerText = `$ ${util.toLocaleString()}`;
    }

    async function registrarMovimiento() {
        const cIn = document.getElementById("acc-concepto");
        const mIn = document.getElementById("acc-monto");
        const tIn = document.getElementById("acc-tipo");
        const monto = parseFloat(mIn.value);

        if (!cIn.value || isNaN(monto) || monto <= 0) {
            alert("Completa concepto y monto correctamente");
            return;
        }

        const nuevoRegistro = {
            empresaId: empresaId,
            concepto: cIn.value.trim().toUpperCase(),
            tipo: tIn.value,
            monto: monto, // Se guarda como número REAL
            creadoEn: serverTimestamp()
        };

        try {
            await addDoc(collection(db, "contabilidad"), nuevoRegistro);
            cIn.value = ""; mIn.value = "";
            console.log("✅ Registrado con éxito en TallerPRO360");
        } catch (e) { console.error("Error:", e); }
    }

    // VISTA PUC SIMPLIFICADA PARA EVITAR ERRORES DE CALCULO
    const cargarVistaCuentas = async () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `<div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 text-center"><p class="orbitron text-amber-400">CARGANDO BALANCES...</p><div id="puc-grid"></div></div>`;
        
        const snap = await getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId)));
        let p = { '4135': 0, '51': 0, '11': 0 };

        snap.forEach(d => {
            const m = d.data();
            const v = parseFloat(m.monto || 0);
            if(ES_INGRESO(m.tipo)) p['4135'] += v;
            else if(ES_GASTO(m.tipo)) p['51'] += v;
            else p['11'] += v;
        });

        document.getElementById("puc-grid").innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div class="bg-black/50 p-6 rounded-2xl border border-emerald-500/10">
                    <p class="text-[10px] text-emerald-400 mb-2">4135 - INGRESOS</p>
                    <p class="text-xl font-bold">$${p['4135'].toLocaleString()}</p>
                </div>
                <div class="bg-black/50 p-6 rounded-2xl border border-red-500/10">
                    <p class="text-[10px] text-red-500 mb-2">51 - GASTOS</p>
                    <p class="text-xl font-bold">$${p['51'].toLocaleString()}</p>
                </div>
                <div class="bg-black/50 p-6 rounded-2xl border border-cyan-500/10">
                    <p class="text-[10px] text-cyan-400 mb-2">11 - DISPONIBLE</p>
                    <p class="text-xl font-bold">$${(p['4135'] - p['51']).toLocaleString()}</p>
                </div>
            </div>`;
    };

    renderLayout();
}
