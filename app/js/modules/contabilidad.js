/**
 * 🏛️ contabilidad.js - NEXUS-X MASTER-CORE V21.9.9 [QUANTUM-SAP EDITION]
 * ESTABILIDAD TOTAL: Adaptador Universal de Datos y Saneamiento Multi-Taller
 * Autor: Gemini AI para William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

export default async function contabilidad(container) {
    const empresaId = (localStorage.getItem("nexus_empresaId") || "").trim();
    if (!empresaId) {
        container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron">ERROR: SESIÓN NO IDENTIFICADA</div>`;
        return;
    }

    const userRole = localStorage.getItem("nexus_userRole") || "mecanico"; 
    let vistaActual = "DIARIO"; 
    let unsubscribe = null;

    // --- MOTOR DE ADAPTACIÓN CUÁNTICA (Inmune a errores de Firestore) ---
    const extraerMonto = (data) => {
        const raw = data.monto ?? data.total ?? data.valor ?? 0;
        return typeof raw === 'number' ? raw : parseFloat(raw) || 0;
    };

    const normalizarTipo = (t) => (t || "").toLowerCase().trim();

    const esIngreso = (t) => {
        const nt = normalizarTipo(t);
        return nt.includes("ingreso") || nt.includes("4135") || nt.includes("saneamiento");
    };

    const esGasto = (t) => {
        const nt = normalizarTipo(t);
        return nt.includes("gasto") || nt.includes("5195") || nt.includes("pasivo") || nt.includes("egreso");
    };

    const esCartera = (t) => normalizarTipo(t).includes("cta_cobrar") || normalizarTipo(t).includes("1305");
    const esSaneamiento = (t) => normalizarTipo(t).includes("saneamiento");

    // --- RENDERIZADO DE INTERFAZ ---
    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32 animate-in fade-in duration-700">
            <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12 border-b border-white/10 pb-10">
                <div class="text-center lg:text-left">
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        FINANCE <span class="text-cyan-400">NEXUS</span><span class="text-cyan-600 text-xl">.SAP</span>
                    </h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-4 italic">Taller: ${empresaId} | Audit: QUANTUM-VERIFIED</p>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    ${renderDashCard("Activos / Ingresos", "dash-ingresos", "text-emerald-400")}
                    ${renderDashCard("Pasivos / Gastos", "dash-gastos", "text-red-500")}
                    ${renderDashCard("Utilidad Neta", "dash-utilidad", "text-amber-500")}
                    ${renderDashCard("Cartera Pendiente", "dash-pendiente", "text-cyan-400")}
                </div>
            </header>

            <div class="flex flex-wrap justify-center gap-4 mb-12 bg-[#0d1117]/50 p-2 rounded-full border border-white/5 w-fit mx-auto shadow-2xl">
                <button id="btn-vista-diario" class="px-6 py-2 rounded-full orbitron text-[9px] font-black transition-all">LIBRO DIARIO</button>
                <button id="btn-vista-puc" class="px-6 py-2 rounded-full orbitron text-[9px] font-black transition-all">ESTADOS ANALÍTICOS</button>
            </div>

            <div id="cont-dynamic-content"></div>
        </div>`;
        
        setupNavigation();
        vistaActual === "DIARIO" ? cargarVistaDiaria() : cargarVistaCuentas();
    };

    function renderDashCard(label, id, color) {
        return `<div class="bg-[#0d1117] p-5 rounded-3xl border border-white/5 text-center shadow-2xl group hover:border-cyan-500/20 transition-all">
            <span class="text-[8px] orbitron ${color} block mb-1 uppercase font-black tracking-widest">${label}</span>
            <h2 id="${id}" class="text-xl font-black orbitron ${color}">$ 0</h2>
        </div>`;
    }

    const setupNavigation = () => {
        const btnD = document.getElementById("btn-vista-diario");
        const btnP = document.getElementById("btn-vista-puc");
        const active = "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.5)]";
        
        btnD.className = `px-6 py-2 rounded-full orbitron text-[9px] font-black ${vistaActual === 'DIARIO' ? active : 'text-slate-500'}`;
        btnP.className = `px-6 py-2 rounded-full orbitron text-[9px] font-black ${vistaActual === 'CUENTAS' ? active : 'text-slate-500'}`;
        
        btnD.onclick = () => { vistaActual = "DIARIO"; renderLayout(); };
        btnP.onclick = () => { vistaActual = "CUENTAS"; renderLayout(); };
    };

    // --- VISTA DIARIA Y ESCUCHA REAL-TIME ---
    const cargarVistaDiaria = () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl sticky top-10">
                    <p class="orbitron text-[10px] text-cyan-500 font-black mb-6 uppercase tracking-widest">Nuevo Asiento Contable</p>
                    <div class="space-y-4" id="form-contabilidad">
                        <input id="acc-fecha" type="date" class="w-full bg-black p-4 rounded-2xl border border-white/10 text-cyan-400 orbitron text-[10px]" value="${new Date().toISOString().split('T')[0]}">
                        <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white orbitron text-[10px] uppercase">
                            <option value="ingreso_ot">4135 - VENTA SERVICIO</option>
                            <option value="cta_cobrar_repuesto">1305 - CARTERA (POR COBRAR)</option>
                            <option value="saneamiento_deuda">1105 - PAGO RECIBIDO (SANEAMIENTO)</option>
                            <option value="gasto_operativo">5195 - GASTO OPERATIVO</option>
                        </select>
                        <input id="acc-placa" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-center font-black orbitron text-lg" placeholder="PLACA (Opcional)">
                        <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-sm" placeholder="CONCEPTO DETALLADO">
                        <input id="acc-monto" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-xl" placeholder="VALOR $">
                        <button id="btnGuardar" class="w-full bg-emerald-500 text-black font-black orbitron py-5 rounded-2xl hover:bg-emerald-400 transition-all shadow-lg">SINCRONIZAR CON LA NUBE</button>
                    </div>
                </div>
            </div>
            <div class="lg:col-span-8">
                <div id="listaFinanzas" class="space-y-3 max-h-[75vh] overflow-y-auto pr-2 custom-scroll"></div>
            </div>
        </div>`;

        document.getElementById("btnGuardar").onclick = registrarMovimiento;
        escucharDatos();
    };

    async function registrarMovimiento() {
        const f = document.getElementById("acc-fecha").value;
        const payload = {
            empresaId,
            tipo: document.getElementById("acc-tipo").value,
            placa: document.getElementById("acc-placa").value.trim().toUpperCase() || "GLOBAL",
            concepto: document.getElementById("acc-concepto").value.trim().toUpperCase(),
            monto: parseFloat(document.getElementById("acc-monto").value),
            creadoPor: userRole,
            creadoEn: f ? Timestamp.fromDate(new Date(f + "T12:00:00")) : serverTimestamp()
        };

        if (!payload.concepto || isNaN(payload.monto)) return Swal.fire("Error", "Concepto y Monto requeridos", "error");

        try {
            await addDoc(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), payload);
            Swal.fire({ icon: 'success', title: 'ASIENTO REGISTRADO', toast: true, position: 'top-end', timer: 2000 });
            document.getElementById("acc-concepto").value = "";
            document.getElementById("acc-monto").value = "";
        } catch (e) { console.error(e); }
    }

    function escucharDatos() {
        if (unsubscribe) unsubscribe();
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        
        unsubscribe = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Ordenar por fecha de creación descendente
            docs.sort((a, b) => (b.creadoEn?.seconds || 0) - (a.creadoEn?.seconds || 0));
            
            let tI = 0, tG = 0, tC = 0;
            const list = document.getElementById("listaFinanzas");
            if (!list) return;

            list.innerHTML = docs.map(m => {
                const val = extraerMonto(m);
                const tipo = m.tipo;

                if (esIngreso(tipo)) tI += val;
                if (esGasto(tipo)) tG += val;
                if (esCartera(tipo)) tC += val;
                if (esSaneamiento(tipo)) tC -= val;

                return `
                <div class="bg-[#0d1117] p-4 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-cyan-500/30 transition-all shadow-lg">
                    <div class="flex gap-4 items-center">
                        <div class="w-2 h-10 rounded-full ${esIngreso(tipo) ? 'bg-emerald-500' : 'bg-red-500'} shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                        <div>
                            <p class="text-[11px] font-black text-white leading-tight">${m.concepto}</p>
                            <p class="text-[8px] text-slate-500 orbitron uppercase tracking-widest">${m.placa} | ${m.tipo}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-black orbitron ${esIngreso(tipo) ? 'text-emerald-400' : 'text-red-500'}">$ ${val.toLocaleString()}</p>
                        <p class="text-[7px] text-slate-600">${m.creadoEn?.toDate().toLocaleDateString() || 'PENDIENTE'}</p>
                    </div>
                </div>`;
            }).join("");

            actualizarDashboards(tI, tG, tC);
        });
    }

    function actualizarDashboards(i, g, c) {
        const map = { "dash-ingresos": i, "dash-gastos": g, "dash-utilidad": i - g, "dash-pendiente": c };
        Object.entries(map).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.innerText = `$ ${val.toLocaleString('es-CO')}`;
        });
    }

    async function cargarVistaCuentas() {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `<div class="p-20 text-center orbitron text-cyan-500 animate-pulse">PROCESANDO AUDITORÍA...</div>`;
        
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        
        let stats = { ing: 0, gas: 0, cart: 0 };
        snap.forEach(d => {
            const m = d.data();
            const v = extraerMonto(m);
            if (esIngreso(m.tipo)) stats.ing += v;
            if (esGasto(m.tipo)) stats.gas += v;
            if (esCartera(m.tipo)) stats.cart += v;
            if (esSaneamiento(m.tipo)) stats.cart -= v;
        });

        content.innerHTML = `
        <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 shadow-2xl animate-in zoom-in duration-500 text-center">
            <h2 class="orbitron text-2xl text-amber-500 mb-10 font-black uppercase tracking-[0.3em]">Balance General Sap-Quantum</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                ${renderStatCard("Flujo Total de Ingresos", stats.ing, "text-emerald-400", "Ventas + Pagos Recibidos")}
                ${renderStatCard("Egresos y Gastos", stats.gas, "text-red-400", "Costos Operativos")}
                ${renderStatCard("Cartera por Recuperar", stats.cart, "text-cyan-400", "Cuentas por Cobrar (1305)")}
                ${renderStatCard("Utilidad Operativa", stats.ing - stats.gas, "text-amber-400", "Efectivo Real en Sistema")}
            </div>
        </div>`;
    }

    function renderStatCard(title, val, color, sub) {
        return `<div class="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 shadow-inner">
            <p class="text-[9px] orbitron ${color} mb-2 uppercase font-black">${title}</p>
            <span class="text-3xl font-black orbitron ${color}">$ ${val.toLocaleString()}</span>
            <p class="text-[7px] text-slate-600 mt-2 uppercase italic">${sub}</p>
        </div>`;
    }

    renderLayout();
}
