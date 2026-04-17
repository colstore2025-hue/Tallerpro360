/**
 * contabilidad.js - NEXUS-X BRIDGE PROTOCOL V21.2 🏛️
 * Corrección de Desfase Firestore & Auditoría de IDs
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, getDocs, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";

export default async function contabilidad(container) {
    // 1. CAPTURA CRÍTICA DE IDENTIDAD
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    
    // DEBUG: Esto aparecerá en tu consola (F12) para verificar el desfase
    console.log("🔍 NEXUS DEBUG: Buscando contabilidad para empresaId:", empresaId);

    let vistaActual = "DIARIO"; 
    let unsubscribe = null;

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32">
            <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12 border-b border-white/10 pb-10">
                <div class="text-center lg:text-left">
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter uppercase">
                        FINANCE <span class="text-amber-400">CORE</span><span class="text-cyan-500 text-xl">.V21.2</span>
                    </h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-2">Bridge Protocol Active</p>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-emerald-500/20 text-center">
                        <span class="text-[8px] orbitron text-emerald-400 block mb-1">INGRESOS</span>
                        <h2 id="dash-ingresos" class="text-xl font-black orbitron">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-red-500/20 text-center">
                        <span class="text-[8px] orbitron text-red-500 block mb-1">EGRESOS</span>
                        <h2 id="dash-gastos" class="text-xl font-black orbitron">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-amber-500/20 text-center">
                        <span class="text-[8px] orbitron text-amber-500 block mb-1">UTILIDAD</span>
                        <h2 id="dash-utilidad" class="text-xl font-black orbitron">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-cyan-500/20 text-center">
                        <span class="text-[8px] orbitron text-cyan-400 block mb-1">DISPONIBLE</span>
                        <h2 id="dash-caja" class="text-xl font-black orbitron">$ 0</h2>
                    </div>
                </div>
            </header>

            <div id="cont-dynamic-content" class="animate-in fade-in slide-in-from-bottom-5 duration-700"></div>
        </div>`;
        
        cargarVistaDiaria();
    };

    const cargarVistaDiaria = () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                    <p class="orbitron text-[10px] text-amber-500 font-black mb-6 uppercase">Entrada Manual</p>
                    <div class="space-y-5">
                        <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 outline-none focus:border-amber-500 font-bold text-sm" placeholder="CONCEPTO">
                        <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-amber-400 font-black orbitron text-[10px]">
                            <option value="ingreso_ot">INGRESO OT</option>
                            <option value="gasto_operativo">GASTO OPERATIVO</option>
                            <option value="nomina_pago">NÓMINA</option>
                        </select>
                        <input id="acc-monto" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-xl" placeholder="0.00">
                        <button id="btnGuardarFinanza" class="w-full bg-amber-400 text-black font-black orbitron py-5 rounded-2xl transition-all uppercase">SINCRONIZAR</button>
                    </div>
                </div>
            </div>
            <div class="lg:col-span-8">
                <div id="listaFinanzas" class="space-y-4"></div>
            </div>
        </div>`;

        document.getElementById("btnGuardarFinanza").onclick = registrarMovimiento;
        escucharContabilidad();
    };

    function escucharContabilidad() {
        if (unsubscribe) unsubscribe();
        
        // QUERY FLEXIBLE: Si hay desfase, ordenamos por tiempo de servidor
        const q = query(
            collection(db, "contabilidad"), 
            where("empresaId", "==", empresaId), 
            orderBy("creadoEn", "desc")
        );

        unsubscribe = onSnapshot(q, (snap) => {
            let ingresos = 0, gastos = 0;
            const list = document.getElementById("listaFinanzas");
            if (!list) return;

            if (snap.empty) {
                list.innerHTML = `<div class="p-10 text-center opacity-30 orbitron text-[10px]">SIN DATOS EN FIRESTORE PARA ESTE ID</div>`;
                return;
            }

            list.innerHTML = snap.docs.map(docSnap => {
                const m = docSnap.data();
                const v = parseFloat(m.monto || 0);
                
                // Mapeo basado en tus fotos de la consola
                const esIngreso = ['ingreso_ot', 'venta_repuesto', 'capital_inicial'].includes(m.tipo);
                
                if (esIngreso) ingresos += v;
                else gastos += v;

                return `
                <div class="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 flex justify-between items-center">
                    <div>
                        <p class="text-xs font-black text-white uppercase">${m.concepto}</p>
                        <p class="text-[7px] text-slate-500 orbitron uppercase">${m.tipo}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-black orbitron ${esIngreso ? 'text-emerald-400' : 'text-red-500'}">
                            ${esIngreso ? '+' : '-'} $${v.toLocaleString()}
                        </p>
                    </div>
                </div>`;
            }).join("");

            document.getElementById("dash-ingresos").innerText = `$ ${ingresos.toLocaleString()}`;
            document.getElementById("dash-gastos").innerText = `$ ${gastos.toLocaleString()}`;
            document.getElementById("dash-utilidad").innerText = `$ ${(ingresos - gastos).toLocaleString()}`;
            document.getElementById("dash-caja").innerText = `$ ${(ingresos - gastos).toLocaleString()}`;
        });
    }

    async function registrarMovimiento() {
        const concepto = document.getElementById("acc-concepto").value.toUpperCase();
        const tipo = document.getElementById("acc-tipo").value;
        const monto = parseFloat(document.getElementById("acc-monto").value);

        if (!concepto || isNaN(monto)) return;

        await addDoc(collection(db, "contabilidad"), {
            empresaId, concepto, tipo, monto, creadoEn: serverTimestamp()
        });

        document.getElementById("acc-concepto").value = "";
        document.getElementById("acc-monto").value = "";
    }

    renderLayout();
}
