/**
 * contabilidad.js - RETROCESO A V21.2 (ESTABLE) 🏛️
 * Eliminación de nexus-core.js y restablecimiento de lógica directa.
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, getDocs, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";

export default async function contabilidad(container) {
    
    // Identificación directa
    const empresaId = localStorage.getItem("empresaId") || "ID_PENDIENTE";
    let vistaActual = "DIARIO"; 
    let unsubscribe = null;

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans">
            <header class="flex flex-col lg:flex-row justify-between items-center mb-10 border-b border-white/10 pb-6">
                <div>
                    <h1 class="text-4xl font-black text-white uppercase italic">FINANCE <span class="text-amber-400">V21.2</span></h1>
                    <p class="text-[10px] text-slate-500 orbitron tracking-widest">MODO ESTABLE - SIN FILTROS NEXUS</p>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-black/50 p-4 rounded-2xl border border-emerald-500/20 text-center">
                        <span class="text-[8px] text-emerald-400 block uppercase">Ingresos</span>
                        <h2 id="dash-ingresos" class="text-lg font-bold text-emerald-400">$ 0</h2>
                    </div>
                    <div class="bg-black/50 p-4 rounded-2xl border border-red-500/20 text-center">
                        <span class="text-[8px] text-red-500 block uppercase">Gastos</span>
                        <h2 id="dash-gastos" class="text-lg font-bold text-red-500">$ 0</h2>
                    </div>
                    <div class="bg-black/50 p-4 rounded-2xl border border-amber-500/20 text-center">
                        <span class="text-[8px] text-amber-500 block uppercase">Utilidad</span>
                        <h2 id="dash-utilidad" class="text-lg font-bold text-amber-400">$ 0</h2>
                    </div>
                    <div class="bg-black/50 p-4 rounded-2xl border border-cyan-500/20 text-center">
                        <span class="text-[8px] text-cyan-400 block uppercase">Caja</span>
                        <h2 id="dash-caja" class="text-lg font-bold text-cyan-400">$ 0</h2>
                    </div>
                </div>
            </header>

            <nav class="flex gap-2 mb-8 justify-center">
                <button id="btn-diario" class="px-6 py-2 rounded-lg bg-white/5 text-[10px] font-bold">LIBRO DIARIO</button>
                <button id="btn-puc" class="px-6 py-2 rounded-lg bg-white/5 text-[10px] font-bold">PLAN PUC</button>
            </nav>

            <div id="cont-dynamic-content"></div>
        </div>`;
        
        document.getElementById("btn-diario").onclick = () => { vistaActual = "DIARIO"; renderLayout(); };
        document.getElementById("btn-puc").onclick = () => { vistaActual = "CUENTAS"; renderLayout(); };

        if (vistaActual === "DIARIO") cargarVistaDiaria();
        else cargarVistaCuentas();
    };

    const cargarVistaDiaria = () => {
        document.getElementById("cont-dynamic-content").innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="bg-[#0d1117] p-6 rounded-3xl border border-white/5">
                <input id="acc-concepto" class="w-full bg-black p-4 rounded-xl mb-4 text-sm uppercase" placeholder="Concepto...">
                <select id="acc-tipo" class="w-full bg-black p-4 rounded-xl mb-4 text-xs text-amber-400">
                    <option value="ingreso_ot">4135 - SERVICIOS</option>
                    <option value="venta_repuesto">413505 - REPUESTOS</option>
                    <option value="gasto_operativo">5195 - GASTOS</option>
                    <option value="nomina_pago">5105 - NÓMINA</option>
                </select>
                <input id="acc-monto" type="number" class="w-full bg-black p-4 rounded-xl mb-4 text-lg font-bold" placeholder="0.00">
                <button id="btnGuardar" class="w-full bg-amber-400 text-black font-black py-4 rounded-xl">REGISTRAR</button>
            </div>
            <div id="listaFinanzas" class="lg:col-span-2 space-y-3"></div>
        </div>`;
        document.getElementById("btnGuardar").onclick = registrar;
        escuchar();
    };

    const escuchar = () => {
        if (unsubscribe) unsubscribe();
        const q = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId), orderBy("creadoEn", "desc"));
        
        unsubscribe = onSnapshot(q, (snap) => {
            let ing = 0, gas = 0;
            const list = document.getElementById("listaFinanzas");
            if (!list) return;

            list.innerHTML = snap.docs.map(doc => {
                const m = doc.data();
                const val = parseFloat(m.monto || 0);
                const esIng = m.tipo.includes('ingreso') || m.tipo.includes('venta') || m.tipo.includes('capital');
                
                if (esIng) ing += val; else gas += val;

                return `<div class="bg-white/5 p-4 rounded-2xl flex justify-between">
                    <div><p class="text-xs font-bold uppercase">${m.concepto}</p></div>
                    <div class="text-right"><p class="${esIng ? 'text-emerald-400' : 'text-red-500'} font-bold">$${val.toLocaleString()}</p></div>
                </div>`;
            }).join("");

            document.getElementById("dash-ingresos").innerText = `$ ${ing.toLocaleString()}`;
            document.getElementById("dash-gastos").innerText = `$ ${gas.toLocaleString()}`;
            document.getElementById("dash-utilidad").innerText = `$ ${(ing - gas).toLocaleString()}`;
            document.getElementById("dash-caja").innerText = `$ ${(ing - gas).toLocaleString()}`;
        });
    };

    const cargarVistaCuentas = async () => {
        document.getElementById("cont-dynamic-content").innerHTML = `
            <div class="bg-black/50 p-8 rounded-3xl border border-white/5">
                <h2 class="text-amber-400 font-bold mb-6">PLAN PUC - RECONEXIÓN DIRECTA</h2>
                <div id="puc-render" class="space-y-4"></div>
            </div>`;
        
        const snap = await getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId)));
        const puc = { '4135': 0, '51': 0, '11': 0 };

        snap.forEach(d => {
            const m = d.data();
            const v = parseFloat(m.monto || 0);
            if(m.tipo.includes('ingreso') || m.tipo.includes('venta')) puc['4135'] += v;
            else if(m.tipo.includes('gasto') || m.tipo.includes('nomina')) puc['51'] += v;
            else puc['11'] += v;
        });

        document.getElementById("puc-render").innerHTML = `
            <div class="flex justify-between border-b border-white/10 pb-2"><span>4135 - INGRESOS</span><b>$${puc['4135'].toLocaleString()}</b></div>
            <div class="flex justify-between border-b border-white/10 pb-2"><span>51 - GASTOS</span><b>$${puc['51'].toLocaleString()}</b></div>
            <div class="flex justify-between border-b border-white/10 pb-2"><span>11 - DISPONIBLE</span><b>$${puc['11'].toLocaleString()}</b></div>
        `;
    };

    async function registrar() {
        const c = document.getElementById("acc-concepto").value;
        const m = parseFloat(document.getElementById("acc-monto").value);
        const t = document.getElementById("acc-tipo").value;
        if (!c || !m) return;

        await addDoc(collection(db, "contabilidad"), {
            empresaId, concepto: c.toUpperCase(), monto: m, tipo: t, creadoEn: serverTimestamp()
        });
        document.getElementById("acc-concepto").value = "";
        document.getElementById("acc-monto").value = "";
    }

    renderLayout();
}
