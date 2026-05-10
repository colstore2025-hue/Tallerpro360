/**
 * 🏛️ contabilidad.js - NEXUS-X MASTER-CORE V21.9.5 [QUANTUM-SAP EDITION]
 * MANIOBRA: Gestión Forense, Edición de Cuentas y Estados Financieros
 * Director: William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, addDoc, getDocs, doc, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

export default async function contabilidad(container) {
    const empresaId = (localStorage.getItem("nexus_empresaId") || "").trim();
    const userRole = localStorage.getItem("nexus_userRole") || "mecanico"; 
    let vistaActual = "DIARIO"; 
    let unsubscribe = null;

    const CATEGORIAS_CONTABLES = [
        { id: NEXUS_CONFIG.FINANCE_TYPES.REVENUE_OT, label: "4135 - INGRESO POR SERVICIOS (VENTA)", requierePlaca: true, tipo: 'INGRESO' },
        { id: "compra_repuesto_externo", label: "1305 - COMPRA REPUESTO (CTA X COBRAR)", requierePlaca: true, tipo: 'ACTIVO' },
        { id: "anticipo_mano_obra", label: "1330 - ANTICIPO COLABORADOR/PINTOR", requierePlaca: true, tipo: 'ACTIVO' },
        { id: "reembolso_mecanico", label: "2335 - DEUDA A MECÁNICO (PASIVO)", requierePlaca: true, tipo: 'PASIVO' },
        { id: NEXUS_CONFIG.FINANCE_TYPES.EXPENSE_OPERATIONAL, label: "5195 - GASTO OPERATIVO", requierePlaca: false, tipo: 'GASTO' },
        { id: "ajuste_contable", label: "9999 - CUENTA DE AJUSTES (SALDOS)", requierePlaca: false, tipo: 'GASTO' }
    ];

    const esIngreso = (tipo) => ['ingreso', '4135', 'INGRESO', 'VENTA'].some(t => tipo.toUpperCase().includes(t));

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32 animate-in fade-in duration-700">
            <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12 border-b border-white/10 pb-10">
                <div class="text-center lg:text-left">
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        FINANCE <span class="text-cyan-400">CORE</span><span class="text-cyan-600 text-xl">.V21.9</span>
                    </h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-4 italic">Auditoría Forzada: ${userRole.toUpperCase()}</p>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    ${renderDashCard("Ingresos/Activos", "dash-ingresos", "text-emerald-400")}
                    ${renderDashCard("Gastos/Pasivos", "dash-gastos", "text-red-500")}
                    ${renderDashCard("Utilidad Neta", "dash-utilidad", "text-amber-500")}
                    ${renderDashCard("Bóveda Nexus", "dash-caja", "text-cyan-400")}
                </div>
            </header>
            <div class="flex flex-wrap justify-center gap-4 mb-12 bg-[#0d1117]/50 p-2 rounded-full border border-white/5 w-fit mx-auto">
                <button id="btn-vista-diario" class="px-6 py-2 rounded-full orbitron text-[9px] font-black transition-all">LIBRO DIARIO</button>
                <button id="btn-vista-puc" class="px-6 py-2 rounded-full orbitron text-[9px] font-black transition-all">ESTADOS FINANCIEROS</button>
                <button id="btn-export-excel" class="bg-emerald-600 text-white px-6 py-2 rounded-full orbitron text-[9px] font-black hover:bg-emerald-500 transition-all">REPORTE EXCEL</button>
            </div>
            <div id="cont-dynamic-content" class="animate-in slide-in-from-bottom-5 duration-700"></div>
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
        const activeClass = "bg-cyan-500 text-black shadow-lg";
        const inactiveClass = "text-slate-500 hover:text-white";
        btnD.className = `px-6 py-2 rounded-full orbitron text-[9px] font-black ${vistaActual === 'DIARIO' ? activeClass : inactiveClass}`;
        btnP.className = `px-6 py-2 rounded-full orbitron text-[9px] font-black ${vistaActual === 'CUENTAS' ? activeClass : inactiveClass}`;
        btnD.onclick = () => { vistaActual = "DIARIO"; renderLayout(); };
        btnP.onclick = () => { vistaActual = "CUENTAS"; renderLayout(); };
    };

    const cargarVistaDiaria = () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl sticky top-10">
                    <p class="orbitron text-[10px] text-cyan-500 font-black mb-6 uppercase italic tracking-[0.2em]">Inyección de Asiento</p>
                    <div class="space-y-4">
                        <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-cyan-400 font-black orbitron text-[10px] uppercase">
                            ${CATEGORIAS_CONTABLES.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
                        </select>
                        <input id="acc-placa" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-center font-black orbitron text-lg hidden" placeholder="PLACA">
                        <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-sm" placeholder="CONCEPTO...">
                        <input id="acc-monto" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-xl" placeholder="VALOR $">
                        <button id="btnGuardarFinanza" class="w-full bg-cyan-500 text-black font-black orbitron py-5 rounded-2xl hover:scale-105 transition-all uppercase shadow-lg">SINCRONIZAR BÓVEDA</button>
                    </div>
                </div>
            </div>
            <div class="lg:col-span-8"><div id="listaFinanzas" class="space-y-4"></div></div>
        </div>`;
        const selectTipo = document.getElementById("acc-tipo");
        selectTipo.onchange = () => {
            const cat = CATEGORIAS_CONTABLES.find(c => c.id === selectTipo.value);
            document.getElementById("acc-placa").classList.toggle("hidden", !cat.requierePlaca);
        };
        document.getElementById("btnGuardarFinanza").onclick = registrarMovimiento;
        escucharContabilidad();
    };

    const cargarVistaCuentas = async () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `<div class="p-20 text-center orbitron text-cyan-500 animate-pulse uppercase tracking-widest">Calculando Estados Financieros...</div>`;
        try {
            const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
            const snap = await getDocs(q);
            let p = { ing: 0, gas: 0, act: 0, pas: 0 };
            snap.forEach(d => {
                const data = d.data();
                const v = Number(data.monto) || 0;
                const cat = CATEGORIAS_CONTABLES.find(c => c.id === data.tipo);
                if (esIngreso(data.tipo)) p.ing += v;
                else p.gas += v;
                if (cat?.tipo === 'ACTIVO') p.act += v;
                if (cat?.tipo === 'PASIVO') p.pas += v;
            });
            content.innerHTML = `
            <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-3xl animate-in zoom-in duration-500">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    ${renderPucCard("ACTIVOS CIRCULANTES", p.act, "text-emerald-400")}
                    ${renderPucCard("PASIVOS / DEUDAS", p.pas, "text-red-500")}
                    ${renderPucCard("INGRESOS BRUTOS", p.ing, "text-cyan-400")}
                    ${renderPucCard("UTILIDAD OPERATIVA", p.ing - p.gas, "text-amber-500")}
                </div>
            </div>`;
            actualizarDash(p.ing, p.gas);
        } catch (e) { console.error(e); }
    };

    async function registrarMovimiento() {
        const payload = {
            empresaId,
            tipo: document.getElementById("acc-tipo").value,
            placa: document.getElementById("acc-placa").value.trim().toUpperCase() || "ADMIN",
            concepto: document.getElementById("acc-concepto").value.trim().toUpperCase(),
            monto: parseFloat(document.getElementById("acc-monto").value),
            creadoEn: serverTimestamp(),
            creadoPor: userRole
        };
        if (!payload.concepto || isNaN(payload.monto)) return;
        await addDoc(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), payload);
        renderLayout();
    }

    function escucharContabilidad() {
        if (unsubscribe) unsubscribe();
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        unsubscribe = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            docs.sort((a, b) => (b.creadoEn?.seconds || 0) - (a.creadoEn?.seconds || 0));
            renderizarTransacciones(docs);
        });
    }

    function renderizarTransacciones(docs) {
        const list = document.getElementById("listaFinanzas");
        let tI = 0, tG = 0;
        list.innerHTML = docs.map(m => {
            const ing = esIngreso(m.tipo);
            ing ? tI += m.monto : tG += m.monto;
            return `
            <div class="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 flex justify-between items-center hover:border-cyan-500/40 transition-all">
                <div>
                    <p class="text-xs font-black text-white uppercase">${m.concepto}</p>
                    <p class="text-[7px] text-slate-500 orbitron uppercase">${m.placa} | ${m.tipo}</p>
                </div>
                <div class="flex items-center gap-4">
                    <p class="text-lg font-black orbitron ${ing ? 'text-emerald-400' : 'text-red-500'}">$ ${m.monto.toLocaleString()}</p>
                    ${userRole === 'owner' ? `
                        <button onclick="window.editarAsiento('${m.id}', '${m.monto}', '${m.concepto}')" class="text-cyan-500 hover:text-white"><i class="fas fa-edit"></i></button>
                        <button onclick="window.eliminarAsiento('${id}')" class="text-red-500 hover:text-white"><i class="fas fa-trash"></i></button>
                    ` : ''}
                </div>
            </div>`;
        }).join("");
        actualizarDash(tI, tG);
    }

    window.editarAsiento = async (id, monto, concepto) => {
        const { value: formValues } = await Swal.fire({
            title: 'EDICIÓN FORENSE',
            html: `<input id="swal-monto" class="swal2-input" value="${monto}"><input id="swal-concepto" class="swal2-input" value="${concepto}">`,
            background: '#0d1117', color: '#fff', confirmButtonText: 'Sincronizar',
            preConfirm: () => [document.getElementById('swal-monto').value, document.getElementById('swal-concepto').value]
        });
        if (formValues) {
            await updateDoc(doc(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING, id), { monto: parseFloat(formValues[0]), concepto: formValues[1].toUpperCase() });
            Swal.fire('Sincronizado', '', 'success');
        }
    };

    window.eliminarAsiento = async (id) => {
        const confirm = await Swal.fire({ title: '¿ELIMINAR ASIENTO?', icon: 'warning', showCancelButton: true, background: '#0d1117', color: '#fff' });
        if (confirm.isConfirmed) {
            await deleteDoc(doc(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING, id));
            Swal.fire('Eliminado', '', 'success');
        }
    };

    async function exportarExcel() {
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        let csv = "Fecha,Concepto,Placa,Tipo,Monto\n";
        snap.forEach(d => {
            const data = d.data();
            csv += `${data.creadoEn?.toDate().toLocaleDateString() || ''},${data.concepto},${data.placa},${data.tipo},${data.monto}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `REPORTE_NEXUS_${new Date().toLocaleDateString()}.csv`; a.click();
    }

    function renderPucCard(title, val, color) {
        return `<div class="p-8 bg-black/40 rounded-[3rem] border border-white/5"><p class="text-[8px] orbitron ${color} mb-2">${title}</p><span class="text-xl font-black orbitron ${color}">$ ${val.toLocaleString()}</span></div>`;
    }

    function actualizarDash(ing, gas) {
        const metrics = { "dash-ingresos": ing, "dash-gastos": gas, "dash-utilidad": ing - gas, "dash-caja": ing - gas };
        Object.entries(metrics).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.innerText = `$ ${val.toLocaleString('es-CO')}`;
        });
    }

    renderLayout();
}
