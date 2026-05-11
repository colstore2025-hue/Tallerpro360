/**
 * 🏛️ contabilidad.js - NEXUS-X MASTER-CORE V21.9.9 [ULTIMATUM EDITION]
 * MANIOBRA: Saneamiento de Activos, Auditoría Retroactiva y Aislamiento Multi-Taller
 * Director: William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

export default async function contabilidad(container) {
    // 1. BLINDAJE DE IDENTIDAD: Si no hay ID, abortamos para evitar fugas de datos
    const empresaId = (localStorage.getItem("nexus_empresaId") || "").trim();
    if (!empresaId) {
        container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron">ERROR: SESIÓN DE TALLER NO IDENTIFICADA</div>`;
        return;
    }

    const userRole = localStorage.getItem("nexus_userRole") || "mecanico"; 
    let vistaActual = "DIARIO"; 
    let unsubscribe = null;

    const CATEGORIAS_CONTABLES = [
        { id: "ingreso_ot", label: "4135 - INGRESO POR SERVICIOS (VENTA)", requierePlaca: true, tipo: 'INGRESO' },
        { id: "cta_cobrar_repuesto", label: "1305 - COMPRA REPUESTO (POR COBRAR)", requierePlaca: true, tipo: 'ACTIVO' },
        { id: "saneamiento_deuda", label: "1105 - PAGO RECIBIDO (SANEAMIENTO DEUDA)", requierePlaca: true, tipo: 'INGRESO' },
        { id: "anticipo_mano_obra", label: "1330 - ANTICIPO COLABORADOR", requierePlaca: true, tipo: 'ACTIVO' },
        { id: "gasto_operativo", label: "5195 - GASTO OPERATIVO", requierePlaca: false, tipo: 'GASTO' },
        { id: "ajuste_auditoria", label: "9999 - AJUSTE DE AUDITORÍA (CORRECCIÓN)", requierePlaca: false, tipo: 'AJUSTE' }
    ];

    const esIngreso = (tipo) => ['ingreso', '4135', 'saneamiento'].some(t => tipo.toLowerCase().includes(t));

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32 animate-in fade-in duration-700">
            <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12 border-b border-white/10 pb-10">
                <div class="text-center lg:text-left">
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        FINANCE <span class="text-cyan-400">NEXUS</span><span class="text-cyan-600 text-xl">.V21.9.9</span>
                    </h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-4 italic">Taller ID: ${empresaId} | Rol: ${userRole.toUpperCase()}</p>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    ${renderDashCard("Activos/Ingresos", "dash-ingresos", "text-emerald-400")}
                    ${renderDashCard("Pasivos/Gastos", "dash-gastos", "text-red-500")}
                    ${renderDashCard("Flujo Caja", "dash-utilidad", "text-amber-500")}
                    ${renderDashCard("Pendiente Cobro", "dash-pendiente", "text-cyan-400")}
                </div>
            </header>

            <div class="flex flex-wrap justify-center gap-4 mb-12 bg-[#0d1117]/50 p-2 rounded-full border border-white/5 w-fit mx-auto">
                <button id="btn-vista-diario" class="px-6 py-2 rounded-full orbitron text-[9px] font-black transition-all">LIBRO DIARIO</button>
                <button id="btn-vista-puc" class="px-6 py-2 rounded-full orbitron text-[9px] font-black transition-all">ESTADOS Y AUDITORÍA</button>
                <button id="btn-export-excel" class="bg-emerald-600 text-white px-6 py-2 rounded-full orbitron text-[9px] font-black hover:bg-emerald-500 transition-all">CSV MASTER REPORT</button>
            </div>

            <div id="cont-dynamic-content"></div>
        </div>`;
        
        setupInternalNavigation();
        vistaActual === "DIARIO" ? cargarVistaDiaria() : cargarVistaCuentas();
        document.getElementById("btn-export-excel").onclick = exportarExcel;
    };

    function renderDashCard(label, id, colorClass) {
        return `<div class="bg-[#0d1117] p-5 rounded-3xl border border-white/5 text-center shadow-2xl group hover:border-cyan-500/20 transition-all">
            <span class="text-[8px] orbitron ${colorClass} block mb-1 uppercase font-black tracking-widest">${label}</span>
            <h2 id="${id}" class="text-xl font-black orbitron ${colorClass}">$ 0</h2>
        </div>`;
    }

    const setupInternalNavigation = () => {
        const btnD = document.getElementById("btn-vista-diario");
        const btnP = document.getElementById("btn-vista-puc");
        const active = "bg-cyan-500 text-black shadow-lg";
        const inactive = "text-slate-500 hover:text-white";
        
        btnD.className = `px-6 py-2 rounded-full orbitron text-[9px] font-black ${vistaActual === 'DIARIO' ? active : inactive}`;
        btnP.className = `px-6 py-2 rounded-full orbitron text-[9px] font-black ${vistaActual === 'CUENTAS' ? active : inactive}`;
        
        btnD.onclick = () => { vistaActual = "DIARIO"; renderLayout(); };
        btnP.onclick = () => { vistaActual = "CUENTAS"; renderLayout(); };
    };

    const cargarVistaDiaria = () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-5 duration-700">
            <div class="lg:col-span-4">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl sticky top-10">
                    <p class="orbitron text-[10px] text-cyan-500 font-black mb-6 uppercase italic tracking-[0.2em]">Registro Forense</p>
                    <div class="space-y-4">
                        <input id="acc-fecha" type="date" class="w-full bg-black p-4 rounded-2xl border border-white/10 text-cyan-400 font-black orbitron text-[10px]" value="${new Date().toISOString().split('T')[0]}">
                        <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-[10px] uppercase">
                            ${CATEGORIAS_CONTABLES.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
                        </select>
                        <input id="acc-placa" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-center font-black orbitron text-lg hidden" placeholder="PLACA">
                        <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-sm" placeholder="CONCEPTO...">
                        <input id="acc-monto" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-xl" placeholder="VALOR $">
                        <button id="btnGuardarFinanza" class="w-full bg-cyan-500 text-black font-black orbitron py-5 rounded-2xl hover:scale-105 transition-all uppercase shadow-lg">SINCRONIZAR ASIENTO</button>
                    </div>
                    <div id="placa-status" class="mt-4 p-4 rounded-2xl bg-black/50 text-[9px] orbitron text-amber-500 hidden border border-amber-500/20"></div>
                </div>
            </div>
            <div class="lg:col-span-8">
                <div id="listaFinanzas" class="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scroll"></div>
            </div>
        </div>`;

        const selectTipo = document.getElementById("acc-tipo");
        const inputPlaca = document.getElementById("acc-placa");
        
        selectTipo.onchange = () => {
            const cat = CATEGORIAS_CONTABLES.find(c => c.id === selectTipo.value);
            inputPlaca.classList.toggle("hidden", !cat.requierePlaca);
        };

        inputPlaca.oninput = async () => {
            if (inputPlaca.value.length >= 6) verificarSaldoPlaca(inputPlaca.value.toUpperCase());
        };

        document.getElementById("btnGuardarFinanza").onclick = registrarMovimiento;
        escucharContabilidad();
    };

    async function verificarSaldoPlaca(placa) {
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), 
                        where("empresaId", "==", empresaId), 
                        where("placa", "==", placa));
        const snap = await getDocs(q);
        let saldo = 0;
        snap.forEach(d => {
            const m = d.data();
            if (m.tipo === 'cta_cobrar_repuesto') saldo += m.monto;
            if (m.tipo === 'saneamiento_deuda') saldo -= m.monto;
        });
        const status = document.getElementById("placa-status");
        if (saldo > 0) {
            status.innerHTML = `⚠️ SALDO PENDIENTE: $ ${saldo.toLocaleString()} <br> <span class="text-white">Usa 'Saneamiento de Deuda' para saldar.</span>`;
            status.classList.remove("hidden");
        } else {
            status.classList.add("hidden");
        }
    }

    async function registrarMovimiento() {
        const fechaManual = document.getElementById("acc-fecha").value;
        const payload = {
            empresaId,
            tipo: document.getElementById("acc-tipo").value,
            placa: document.getElementById("acc-placa").value.trim().toUpperCase() || "ADMIN",
            concepto: document.getElementById("acc-concepto").value.trim().toUpperCase(),
            monto: parseFloat(document.getElementById("acc-monto").value),
            creadoPor: userRole,
            // Convertimos fecha manual a Timestamp de Firestore para regresión
            creadoEn: fechaManual ? Timestamp.fromDate(new Date(fechaManual + "T12:00:00")) : serverTimestamp()
        };

        if (!payload.concepto || isNaN(payload.monto)) return Swal.fire("Error", "Datos incompletos", "error");

        try {
            await addDoc(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), payload);
            Swal.fire({ icon: 'success', title: 'ASIENTO SINCRONIZADO', toast: true, position: 'top-end', timer: 2000 });
            if(vistaActual === "DIARIO") cargarVistaDiaria();
        } catch (e) { console.error(e); }
    }

    function escucharContabilidad() {
        if (unsubscribe) unsubscribe();
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        unsubscribe = onSnapshot(q, (snap) => {
            const trans = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            trans.sort((a, b) => (b.creadoEn?.seconds || 0) - (a.creadoEn?.seconds || 0));
            renderizarTransacciones(trans);
        });
    }

    function renderizarTransacciones(docs) {
        const list = document.getElementById("listaFinanzas");
        let tI = 0, tG = 0, tP = 0;

        list.innerHTML = docs.map(m => {
            const ing = esIngreso(m.tipo);
            if (ing) tI += m.monto; else tG += m.monto;
            if (m.tipo === 'cta_cobrar_repuesto') tP += m.monto;
            if (m.tipo === 'saneamiento_deuda') tP -= m.monto;

            const fecha = m.creadoEn?.toDate() ? m.creadoEn.toDate().toLocaleDateString() : '---';
            return `
            <div class="bg-[#0d1117] p-5 rounded-2xl border border-white/5 flex justify-between items-center group">
                <div>
                    <p class="text-[10px] font-black text-white">${m.concepto}</p>
                    <p class="text-[7px] text-slate-500 orbitron uppercase">${fecha} | ${m.placa} | ${m.tipo}</p>
                </div>
                <div class="flex items-center gap-4">
                    <p class="text-sm font-black orbitron ${ing ? 'text-emerald-400' : 'text-red-500'}">$ ${m.monto.toLocaleString()}</p>
                    ${userRole === 'owner' ? `<button onclick="borrarRegistro('${m.id}')" class="opacity-0 group-hover:opacity-100 text-red-900 hover:text-red-500 transition-all"><i class="fas fa-trash-alt"></i></button>` : ''}
                </div>
            </div>`;
        }).join("");
        actualizarDash(tI, tG, tP);
    }

    async function cargarVistaCuentas() {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `<div class="p-20 text-center orbitron text-cyan-500 animate-pulse">GENERANDO BALANCE ANALÍTICO...</div>`;
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        let stats = { ingreso: 0, gasto: 0, ctaCobrar: 0, saneado: 0 };
        
        snap.forEach(d => {
            const m = d.data();
            if (esIngreso(m.tipo)) stats.ingreso += m.monto;
            else stats.gasto += m.monto;
            if (m.tipo === 'cta_cobrar_repuesto') stats.ctaCobrar += m.monto;
            if (m.tipo === 'saneamiento_deuda') stats.saneado += m.monto;
        });

        content.innerHTML = `
        <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 shadow-2xl animate-in zoom-in duration-500">
            <h2 class="orbitron text-xl text-amber-500 mb-8 font-black uppercase text-center tracking-widest">Estado de Resultados Forense</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="p-8 bg-black/40 rounded-3xl border border-emerald-500/20">
                    <p class="text-[8px] orbitron text-emerald-400 mb-2 uppercase">Ventas y Saneamientos</p>
                    <span class="text-3xl font-black orbitron text-emerald-400">$ ${stats.ingreso.toLocaleString()}</span>
                </div>
                <div class="p-8 bg-black/40 rounded-3xl border border-red-500/20">
                    <p class="text-[8px] orbitron text-red-400 mb-2 uppercase">Gastos y Egresos</p>
                    <span class="text-3xl font-black orbitron text-red-400">$ ${stats.gasto.toLocaleString()}</span>
                </div>
                <div class="p-8 bg-black/40 rounded-3xl border border-cyan-500/20">
                    <p class="text-[8px] orbitron text-cyan-400 mb-2 uppercase">Cartera Total (Por Cobrar)</p>
                    <span class="text-3xl font-black orbitron text-cyan-400">$ ${(stats.ctaCobrar - stats.saneado).toLocaleString()}</span>
                </div>
                <div class="p-8 bg-black/40 rounded-3xl border border-amber-500/20">
                    <p class="text-[8px] orbitron text-amber-400 mb-2 uppercase">Utilidad Real (Efectivo)</p>
                    <span class="text-3xl font-black orbitron text-amber-400">$ ${(stats.ingreso - stats.gasto).toLocaleString()}</span>
                </div>
            </div>
        </div>`;
    }

    window.borrarRegistro = async (id) => {
        const { isConfirmed } = await Swal.fire({ title: '¿ELIMINAR ASIENTO?', text: "Esta acción es irreversible.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', background: '#0d1117', color: '#fff' });
        if (isConfirmed) {
            await deleteDoc(doc(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING, id));
            Swal.fire('Eliminado', '', 'success');
        }
    };

    async function exportarExcel() {
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        let csv = "FECHA,CONCEPTO,PLACA,TIPO,MONTO,REGISTRADO_POR\n";
        snap.forEach(d => {
            const m = d.data();
            const f = m.creadoEn?.toDate() ? m.creadoEn.toDate().toLocaleDateString() : '';
            csv += `${f},${m.concepto},${m.placa},${m.tipo},${m.monto},${m.creadoPor}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `FINANCE_REPORT_${empresaId}_${new Date().toLocaleDateString()}.csv`; a.click();
    }

    function actualizarDash(i, g, p) {
        const m = { "dash-ingresos": i, "dash-gastos": g, "dash-utilidad": i - g, "dash-caja": i - g, "dash-pendiente": p };
        Object.entries(m).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.innerText = `$ ${val.toLocaleString('es-CO')}`;
        });
    }

    renderLayout();
}
