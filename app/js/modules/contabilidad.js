/**
 * contabilidad.js - NEXUS-X MASTER-CORE V21.8 🏛️
 * MANIOBRA FINAL: Sincronización Total y Auditoría Forzada
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, getDocs, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";

export default async function contabilidad(container) {
    const empresaId = (localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId") || "").trim();
    let vistaActual = "DIARIO"; 
    let unsubscribe = null;

    // 1. MAPEO DE TIPOS (A prueba de errores de escritura en DB)
    const T_ING = ['ingreso_ot', 'venta_repuesto', 'capital_inicial', 'capital', 'ingreso'];
    const T_GAS = ['gasto_operativo', 'gasto_insumos', 'nomina_pago', 'nomina', 'gasto', 'egreso'];

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32">
            <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12 border-b border-white/10 pb-10">
                <div class="text-center lg:text-left">
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter uppercase">
                        FINANCE <span class="text-amber-400">CORE</span><span class="text-cyan-500 text-xl">.V21.8</span>
                    </h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-2 italic">Auditoría Forzada TallerPRO360</p>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-white/5 text-center shadow-2xl">
                        <span class="text-[8px] orbitron text-emerald-400 block mb-1 uppercase">Ingresos</span>
                        <h2 id="dash-ingresos" class="text-xl font-black orbitron text-emerald-400">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-white/5 text-center shadow-2xl">
                        <span class="text-[8px] orbitron text-red-500 block mb-1 uppercase">Gastos</span>
                        <h2 id="dash-gastos" class="text-xl font-black orbitron text-red-500">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-white/5 text-center shadow-2xl">
                        <span class="text-[8px] orbitron text-amber-500 block mb-1 uppercase">Utilidad</span>
                        <h2 id="dash-utilidad" class="text-xl font-black orbitron text-amber-400">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-white/5 text-center shadow-2xl">
                        <span class="text-[8px] orbitron text-cyan-400 block mb-1 uppercase">Caja</span>
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
        vistaActual === "DIARIO" ? cargarVistaDiaria() : cargarVistaCuentas();
    };

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
                    <p class="orbitron text-[10px] text-amber-500 font-black mb-6 uppercase italic">Nuevo Asiento</p>
                    <div class="space-y-5">
                        <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-sm" placeholder="CONCEPTO...">
                        <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-amber-400 font-black orbitron text-[10px] uppercase">
                            <option value="ingreso_ot">4135 - SERVICIOS</option>
                            <option value="venta_repuesto">413505 - REPUESTOS</option>
                            <option value="gasto_operativo">5195 - GASTOS</option>
                            <option value="nomina_pago">5105 - NÓMINA</option>
                            <option value="capital_inicial">1105 - CAPITAL</option>
                        </select>
                        <input id="acc-monto" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-xl" placeholder="0.00">
                        <button id="btnGuardarFinanza" class="w-full bg-white text-black font-black orbitron py-5 rounded-2xl hover:bg-amber-400 transition-all uppercase tracking-widest">Sincronizar +</button>
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

        // CONSULTA DE SEGURIDAD: Intentamos ordenar, pero si falla el índice, la manejamos internamente
        const q = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId), orderBy("creadoEn", "desc"));

        unsubscribe = onSnapshot(q, (snap) => {
            procesarSnap(snap);
        }, (error) => {
            console.warn("Nexus-Core: Reintentando consulta sin ordenamiento...");
            // Backup por si falta el índice de Firestore
            const backupQ = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId));
            onSnapshot(backupQ, (snap) => procesarSnap(snap));
        });
    }

    function procesarSnap(snap) {
        let tIng = 0, tGas = 0;
        const list = document.getElementById("listaFinanzas");
        if (!list) return;

        if (snap.empty) {
            list.innerHTML = `<div class="p-20 text-center opacity-20 orbitron italic text-[10px]">SIN MOVIMIENTOS REGISTRADOS</div>`;
            actualizarDash(0, 0);
            return;
        }

        const docs = snap.docs.map(d => ({id: d.id, ...d.data()}));
        // Ordenamos manualmente por si el backupQ no lo hizo
        docs.sort((a, b) => (b.creadoEn?.seconds || 0) - (a.creadoEn?.seconds || 0));

        list.innerHTML = docs.map(m => {
            const v = parseFloat(m.monto || 0);
            const tipo = (m.tipo || "").toLowerCase();
            const esIng = T_ING.includes(tipo);
            
            if (esIng) tIng += v; else tGas += v;

            const estilo = obtenerEstilo(tipo);
            return `
            <div class="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 flex justify-between items-center group transition-all hover:bg-white/[0.02]">
                <div class="flex items-center gap-5">
                    <div class="w-12 h-12 rounded-2xl ${estilo.bg} flex items-center justify-center border ${estilo.border}">
                        <i class="${estilo.icon} ${estilo.text}"></i>
                    </div>
                    <div>
                        <p class="text-xs font-black text-white uppercase">${m.concepto}</p>
                        <p class="text-[7px] text-slate-500 orbitron">${m.creadoEn?.toDate().toLocaleString() || 'SYNC...'}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-lg font-black orbitron ${esIng ? 'text-emerald-400' : 'text-red-500'}">${esIng ? '+' : '-'} $${v.toLocaleString()}</p>
                    <p class="text-[6px] text-slate-600 orbitron uppercase font-black">${tipo}</p>
                </div>
            </div>`;
        }).join("");

        actualizarDash(tIng, tGas);
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

        if (!cIn.value || isNaN(monto) || monto <= 0) return;

        try {
            await addDoc(collection(db, "contabilidad"), {
                empresaId,
                concepto: cIn.value.toUpperCase().trim(),
                tipo: tIn.value,
                monto: monto, // Guardado numérico puro
                creadoEn: serverTimestamp()
            });
            cIn.value = ""; mIn.value = "";
        } catch (e) { console.error("Error Grave Registro:", e); }
    }

    const cargarVistaCuentas = async () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `<div class="p-10 text-center orbitron text-[10px] animate-pulse">GENERANDO PUC...</div>`;
        
        const snap = await getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId)));
        const p = { '41': 0, '51': 0, '11': 0 };

        snap.forEach(d => {
            const m = d.data();
            const v = parseFloat(m.monto || 0);
            if (T_ING.includes(m.tipo)) p['41'] += v;
            else if (T_GAS.includes(m.tipo)) p['51'] += v;
            else p['11'] += v;
        });

        content.innerHTML = `
        <div class="bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 shadow-3xl">
            <h3 class="orbitron text-xl font-black mb-10 text-amber-400 italic text-center">BALANCE PUC</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="p-8 bg-black/40 rounded-[3rem] border border-emerald-500/10">
                    <p class="text-[9px] orbitron text-emerald-400 mb-6 uppercase">4 - INGRESOS</p>
                    <div class="flex justify-between border-b border-white/5 pb-2"><span class="text-[10px]">TOTAL</span><span class="font-black">$${p['41'].toLocaleString()}</span></div>
                </div>
                <div class="p-8 bg-black/40 rounded-[3rem] border border-red-500/10">
                    <p class="text-[9px] orbitron text-red-500 mb-6 uppercase">5 - GASTOS</p>
                    <div class="flex justify-between border-b border-white/5 pb-2"><span class="text-[10px]">TOTAL</span><span class="font-black">$${p['51'].toLocaleString()}</span></div>
                </div>
                <div class="p-8 bg-black/40 rounded-[3rem] border border-amber-500/10">
                    <p class="text-[9px] orbitron text-amber-500 mb-6 uppercase">1 - ACTIVOS</p>
                    <div class="flex justify-between border-b border-white/5 pb-2"><span class="text-[10px]">DISPONIBLE</span><span class="font-black">$${(p['41'] - p['51']).toLocaleString()}</span></div>
                </div>
            </div>
        </div>`;
    };

    const obtenerEstilo = (t) => {
        const est = {
            ingreso_ot: { icon: 'fas fa-file-invoice-dollar', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            venta_repuesto: { icon: 'fas fa-gears', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
            nomina_pago: { icon: 'fas fa-id-card-clip', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            gasto_operativo: { icon: 'fas fa-receipt', text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' }
        };
        return est[t] || { icon: 'fas fa-wallet', text: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/5' };
    };

    renderLayout();
}
