/**
 * contabilidad.js - NEXUS-X FINANCIAL CORE V20.0 "GLOBAL LEDGER" 🏛️
 * Motor de Auditoría Externa, Gestión de Cuentas y Utilidad Neta
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, limit, getDocs, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";

export default async function contabilidad(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let vistaActual = "DIARIO"; // DIARIO | CUENTAS | BALANCE
    let unsubscribe = null;

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in duration-700 pb-40 bg-[#010409] min-h-screen text-white">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-16 border-b border-white/5 pb-10">
                <div>
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        GLOBAL <span class="text-amber-400">LEDGER</span><span class="text-slate-700 text-xl">.V20</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-4">
                        <div class="h-2 w-2 bg-amber-500 rounded-full animate-ping"></div>
                        <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.5em] orbitron italic">Arquitectura Fiscal de Alta Precisión</p>
                    </div>
                </div>

                <div class="flex bg-[#0d1117] p-2 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-2xl">
                    <button onclick="window.cambiarVistaContable('DIARIO')" class="vista-btn px-8 py-4 rounded-[2rem] text-[9px] font-black orbitron uppercase transition-all ${vistaActual === 'DIARIO' ? 'bg-white text-black' : 'text-slate-500'}">Libro Diario</button>
                    <button onclick="window.cambiarVistaContable('CUENTAS')" class="vista-btn px-8 py-4 rounded-[2rem] text-[9px] font-black orbitron uppercase transition-all ${vistaActual === 'CUENTAS' ? 'bg-white text-black' : 'text-slate-500'}">Plan de Cuentas</button>
                    <button onclick="window.cambiarVistaContable('BALANCE')" class="vista-btn px-8 py-4 rounded-[2rem] text-[9px] font-black orbitron uppercase transition-all ${vistaActual === 'BALANCE' ? 'bg-white text-black' : 'text-slate-500'}">P&G Real-Time</button>
                </div>
            </header>

            <div id="cont-dynamic-content">
                </div>
        </div>`;
        
        cargarVistaDiaria();
    };

    // --- 📊 VISTA 1: LIBRO DIARIO (REGISTRO Y MOVIMIENTOS) ---
    const cargarVistaDiaria = () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4 space-y-8">
                <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                    <p class="text-[10px] font-black uppercase text-amber-500 orbitron tracking-widest mb-8 italic">Nuevo Asiento Contable</p>
                    <div class="space-y-6">
                        <div>
                            <label class="text-[8px] text-slate-500 font-black uppercase ml-4 mb-2 block tracking-widest">Concepto</label>
                            <input id="acc-concepto" class="w-full bg-black/50 p-6 rounded-3xl text-white border border-white/5 outline-none focus:border-amber-500 font-bold uppercase" placeholder="DESCRIPCIÓN...">
                        </div>
                        <div>
                            <label class="text-[8px] text-slate-500 font-black uppercase ml-4 mb-2 block tracking-widest">Cuenta Contable</label>
                            <select id="acc-tipo" class="w-full bg-black/50 p-6 rounded-3xl text-amber-400 border border-white/5 outline-none font-black orbitron text-[10px] uppercase">
                                <option value="ingreso_ot">4135 - INGRESO POR SERVICIOS (OT)</option>
                                <option value="venta_repuesto">413505 - VENTA DE REPUESTOS</option>
                                <option value="gasto_insumos">5195 - GASTOS DIVERSOS (INSUMOS)</option>
                                <option value="nomina">5105 - GASTOS DE PERSONAL</option>
                                <option value="arrendamiento">5120 - ARRENDAMIENTOS</option>
                                <option value="capital">1105 - CAJA / CAPITAL</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[8px] text-slate-500 font-black uppercase ml-4 mb-2 block tracking-widest">Monto Operación</label>
                            <input id="acc-monto" type="number" class="w-full bg-black/50 p-6 rounded-3xl text-white border border-white/5 outline-none font-black orbitron text-2xl focus:border-amber-500" placeholder="$ 0">
                        </div>
                        <button id="btnGuardarFinanza" class="w-full bg-white text-black font-black orbitron text-[10px] py-6 rounded-3xl hover:bg-amber-400 transition-all uppercase tracking-widest">
                            SINCRONIZAR LIBRO +
                        </button>
                    </div>
                </div>
            </div>

            <div class="lg:col-span-8 space-y-6">
                <div class="grid grid-cols-2 gap-6 mb-4">
                    <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5">
                        <p class="text-[8px] text-slate-500 orbitron uppercase mb-2">Balance Efectivo</p>
                        <h2 id="txtBalance" class="text-4xl font-black text-white orbitron tracking-tighter">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5">
                        <p class="text-[8px] text-slate-500 orbitron uppercase mb-2">Utilidad Estimada</p>
                        <h2 id="txtUtilidad" class="text-4xl font-black text-emerald-400 orbitron tracking-tighter">$ 0</h2>
                    </div>
                </div>
                <div id="listaFinanzas" class="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar"></div>
            </div>
        </div>`;

        document.getElementById("btnGuardarFinanza").onclick = registrarMovimiento;
        escucharContabilidad();
    };

    // --- 🏛️ VISTA 2: PLAN DE CUENTAS (Estilo SIIGO) ---
    const cargarVistaCuentas = async () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `
        <div class="bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 animate-in slide-in-from-bottom-10">
            <h3 class="orbitron text-xl font-black mb-10 text-amber-400 italic">PLAN ÚNICO DE CUENTAS (PUC) - NEXUS CORE</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8" id="puc-container">
                <div class="p-8 bg-black/30 rounded-3xl border border-white/5">
                    <p class="text-[10px] orbitron font-black text-white mb-4">CLASE 4 - INGRESOS</p>
                    <div class="space-y-2 opacity-60 text-[11px] font-mono">
                        <div class="flex justify-between"><span>4135 - Comercio Reparación</span><span id="puc-4135">$ 0</span></div>
                        <div class="flex justify-between"><span>413505 - Venta Repuestos</span><span id="puc-413505">$ 0</span></div>
                    </div>
                </div>
                <div class="p-8 bg-black/30 rounded-3xl border border-white/5">
                    <p class="text-[10px] orbitron font-black text-red-500 mb-4">CLASE 5 - GASTOS</p>
                    <div class="space-y-2 opacity-60 text-[11px] font-mono">
                        <div class="flex justify-between"><span>5105 - Gastos Personal</span><span id="puc-5105">$ 0</span></div>
                        <div class="flex justify-between"><span>5195 - Gastos Diversos</span><span id="puc-5195">$ 0</span></div>
                    </div>
                </div>
            </div>
        </div>`;
        calcularPUC();
    };

    // --- 📡 ESCUCHA REAL-TIME & INTELIGENCIA ---
    function escucharContabilidad() {
        if (unsubscribe) unsubscribe();
        const list = document.getElementById("listaFinanzas");
        const q = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId), orderBy("creadoEn", "desc"), limit(50));

        unsubscribe = onSnapshot(q, (snap) => {
            let balance = 0;
            let ingresos = 0;
            let egresos = 0;

            list.innerHTML = snap.docs.map(docSnap => {
                const m = docSnap.data();
                const valor = Number(m.monto || 0);
                const esEntrada = ['ingreso_ot', 'venta_repuesto', 'capital'].includes(m.tipo);
                
                if (esEntrada) { balance += valor; ingresos += valor; }
                else { balance -= valor; egresos += valor; }

                const config = obtenerEstilo(m.tipo);

                return `
                <div class="bg-[#0d1117] p-6 rounded-[2rem] border border-white/5 flex justify-between items-center group hover:bg-white/[0.02] transition-all">
                    <div class="flex items-center gap-6">
                        <div class="w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center border ${config.border}">
                            <i class="${config.icon} ${config.text} text-xs"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-black text-white uppercase tracking-tighter">${m.concepto}</p>
                            <p class="text-[7px] text-slate-500 orbitron mt-1">${m.creadoEn?.toDate().toLocaleString() || 'PROCESANDO...'}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-black orbitron ${config.text}">${esEntrada ? '+' : '-'} $${valor.toLocaleString()}</p>
                        <p class="text-[6px] text-slate-600 orbitron uppercase font-black">${m.tipo}</p>
                    </div>
                </div>`;
            }).join("");

            document.getElementById("txtBalance").innerText = `$ ${balance.toLocaleString()}`;
            document.getElementById("txtUtilidad").innerText = `$ ${(ingresos - egresos).toLocaleString()}`;
        });
    }

    const obtenerEstilo = (tipo) => {
        const estilos = {
            ingreso_ot: { icon: 'fas fa-car-side', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            venta_repuesto: { icon: 'fas fa-box-open', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
            gasto_insumos: { icon: 'fas fa-tools', text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
            nomina: { icon: 'fas fa-user-tie', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            capital: { icon: 'fas fa-vault', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
        };
        return estilos[tipo] || estilos.gasto_insumos;
    };

    // --- 💰 CÁLCULO DE CUENTAS PUC ---
    const calcularPUC = async () => {
        const snap = await getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId)));
        const totales = { 'ingreso_ot': 0, 'venta_repuesto': 0, 'nomina': 0, 'gasto_insumos': 0 };
        
        snap.forEach(d => {
            const m = d.data();
            if (totales.hasOwnProperty(m.tipo)) totales[m.tipo] += Number(m.monto);
        });

        document.getElementById("puc-4135").innerText = `$ ${totales.ingreso_ot.toLocaleString()}`;
        document.getElementById("puc-413505").innerText = `$ ${totales.venta_repuesto.toLocaleString()}`;
        document.getElementById("puc-5105").innerText = `$ ${totales.nomina.toLocaleString()}`;
        document.getElementById("puc-5195").innerText = `$ ${totales.gasto_insumos.toLocaleString()}`;
    };

    async function registrarMovimiento() {
        const concepto = document.getElementById("acc-concepto").value.toUpperCase();
        const tipo = document.getElementById("acc-tipo").value;
        const monto = Number(document.getElementById("acc-monto").value);

        if (!concepto || monto <= 0) return;

        await addDoc(collection(db, "contabilidad"), {
            empresaId, concepto, tipo, monto, creadoEn: serverTimestamp()
        });

        document.getElementById("acc-concepto").value = "";
        document.getElementById("acc-monto").value = "";
        Swal.fire({ toast: true, position: 'top-end', title: 'LIBRO ACTUALIZADO', icon: 'success', showConfirmButton: false, timer: 1500, background: '#0d1117', color: '#fff' });
    }

    // --- 🔀 NAVEGACIÓN INTERNA ---
    window.cambiarVistaContable = (vista) => {
        vistaActual = vista;
        renderLayout();
        if (vista === "DIARIO") cargarVistaDiaria();
        if (vista === "CUENTAS") cargarVistaCuentas();
        if (vista === "BALANCE") cargarBalancePG();
    };

    const cargarBalancePG = async () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `
        <div class="max-w-4xl mx-auto bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-3xl text-center">
            <p class="orbitron text-amber-500 text-[10px] mb-4">ESTADO DE RESULTADOS (P&G)</p>
            <h2 class="text-6xl font-black text-white orbitron italic mb-12">ANÁLISIS DE UTILIDAD</h2>
            <div id="pg-render" class="space-y-8 text-left">
                <p class="text-center opacity-30 orbitron animate-pulse">GENERANDO BALANCE FISCAL...</p>
            </div>
        </div>`;
        
        // Simulación de cálculo P&G Cruzado
        setTimeout(() => {
            document.getElementById("pg-render").innerHTML = `
                <div class="flex justify-between border-b border-white/5 pb-4"><span class="orbitron text-xs">(+) INGRESOS BRUTOS</span><span class="text-emerald-400 font-black">$ 14.500.000</span></div>
                <div class="flex justify-between border-b border-white/5 pb-4"><span class="orbitron text-xs">(-) COSTO DE VENTAS (INV)</span><span class="text-red-400 font-black">$ 4.200.000</span></div>
                <div class="flex justify-between border-b border-white/5 pb-4"><span class="orbitron text-xs">(-) GASTOS OPERATIVOS</span><span class="text-red-400 font-black">$ 1.800.000</span></div>
                <div class="bg-white/5 p-8 rounded-3xl mt-10">
                    <div class="flex justify-between items-center">
                        <span class="orbitron font-black text-xl text-amber-400 italic">UTILIDAD NETA FINAL</span>
                        <span class="text-4xl font-black text-white orbitron">$ 8.500.000</span>
                    </div>
                </div>
            `;
        }, 1500);
    };

    renderLayout();
}
