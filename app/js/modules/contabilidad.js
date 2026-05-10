/**
 * 🏛️ contabilidad.js - NEXUS-X MASTER-CORE V21.9 [QUANTUM-SAP EDITION]
 * MANIOBRA: Blindaje Contable y Auditoría de Roles
 * Director: William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, addDoc, getDocs, doc, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

export default async function contabilidad(container) {
    const empresaId = (localStorage.getItem("nexus_empresaId") || "").trim();
    const userRole = localStorage.getItem("nexus_userRole") || "mecanico"; // 'owner' o 'mecanico'
    let vistaActual = "DIARIO"; 
    let unsubscribe = null;

    // --- CATEGORÍAS CUÁNTICAS (Separación Activo/Pasivo/Gasto) ---
    const CATEGORIAS_CONTABLES = [
        { id: NEXUS_CONFIG.FINANCE_TYPES.REVENUE_OT, label: "4135 - INGRESO POR SERVICIOS (VENTA)", requierePlaca: true, tipoContable: 'ACTIVO' },
        { id: "compra_repuesto_externo", label: "1305 - COMPRA REPUESTO (CTA X COBRAR)", requierePlaca: true, tipoContable: 'ACTIVO' },
        { id: "anticipo_mano_obra", label: "1330 - ANTICIPO COLABORADOR/PINTOR", requierePlaca: true, tipoContable: 'ACTIVO' },
        { id: "reembolso_mecanico", label: "2335 - DEUDA A MECÁNICO (PASIVO)", requierePlaca: true, tipoContable: 'PASIVO' },
        { id: NEXUS_CONFIG.FINANCE_TYPES.EXPENSE_OPERATIONAL, label: "5195 - GASTO OPERATIVO (LUZ, ARRIENDO)", requierePlaca: false, tipoContable: 'GASTO' },
        { id: NEXUS_CONFIG.FINANCE_TYPES.EXPENSE_PAYROLL, label: "5105 - PAGO NÓMINA ADMINISTRATIVA", requierePlaca: false, tipoContable: 'GASTO' }
    ];

    const esIngreso = (tipo) => ['ingreso_ot', 'ingreso', 'INGRESO', '4135'].some(t => tipo.includes(t));

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32 animate-in fade-in duration-700">
            <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12 border-b border-white/10 pb-10">
                <div class="text-center lg:text-left">
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        FINANCE <span class="text-cyan-400">NEXUS</span><span class="text-cyan-600 text-xl">.V21.9</span>
                    </h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-4 italic">Auditoría Forzada: ${userRole.toUpperCase()}</p>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    ${renderDashCard("Ingresos/Activos", "dash-ingresos", "text-emerald-400")}
                    ${renderDashCard("Gastos/Pasivos", "dash-gastos", "text-red-500")}
                    ${renderDashCard("Utilidad Neta", "dash-utilidad", "text-amber-500")}
                    ${renderDashCard("Caja Principal", "dash-caja", "text-cyan-400")}
                </div>
            </header>

            <div class="flex flex-wrap justify-center gap-4 mb-12 bg-[#0d1117]/50 p-2 rounded-full border border-white/5 w-fit mx-auto">
                <button id="btn-vista-diario" class="nav-cont-btn px-6 py-2 rounded-full orbitron text-[9px] font-black transition-all">LIBRO DIARIO</button>
                <button id="btn-vista-puc" class="nav-cont-btn px-6 py-2 rounded-full orbitron text-[9px] font-black transition-all">ESTADOS</button>
                <button id="btn-export-excel" class="bg-emerald-600 text-white px-6 py-2 rounded-full orbitron text-[9px] font-black hover:bg-emerald-500 transition-all">EXPORTAR EXCEL</button>
            </div>

            <div id="cont-dynamic-content" class="animate-in slide-in-from-bottom-5 duration-700"></div>
        </div>`;
        
        setupInternalNavigation();
        vistaActual === "DIARIO" ? cargarVistaDiaria() : cargarVistaCuentas();
        document.getElementById("btn-export-excel").onclick = exportarExcel;
    };

    function renderDashCard(label, id, colorClass) {
        return `
        <div class="bg-[#0d1117] p-5 rounded-3xl border border-white/5 text-center shadow-2xl group hover:border-cyan-500/20 transition-all">
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
        
        btnD.onclick = () => { if(vistaActual !== "DIARIO"){ vistaActual = "DIARIO"; renderLayout(); }};
        btnP.onclick = () => { if(vistaActual !== "CUENTAS"){ vistaActual = "CUENTAS"; renderLayout(); }};
    };

    const cargarVistaDiaria = () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl sticky top-10">
                    <p class="orbitron text-[10px] text-cyan-500 font-black mb-6 uppercase italic tracking-[0.2em]">Registro de Movimiento</p>
                    <div class="space-y-4">
                        <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-cyan-400 font-black orbitron text-[10px] uppercase focus:border-cyan-500 outline-none">
                            ${CATEGORIAS_CONTABLES.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
                        </select>
                        <input id="acc-placa" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-center font-black orbitron text-lg hidden" placeholder="PLACA (ABC-123)">
                        <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-sm focus:border-cyan-500 outline-none" placeholder="DESCRIPCIÓN DETALLADA...">
                        <input id="acc-monto" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-xl" placeholder="VALOR $">
                        <button id="btnGuardarFinanza" class="w-full bg-cyan-500 text-black font-black orbitron py-5 rounded-2xl hover:scale-105 transition-all uppercase shadow-lg">SINCRONIZAR ASIENTO</button>
                    </div>
                </div>
            </div>
            <div class="lg:col-span-8">
                <div id="listaFinanzas" class="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scroll"></div>
            </div>
        </div>`;

        // Lógica de visibilidad de placa
        const selectTipo = document.getElementById("acc-tipo");
        const inputPlaca = document.getElementById("acc-placa");
        selectTipo.onchange = () => {
            const cat = CATEGORIAS_CONTABLES.find(c => c.id === selectTipo.value);
            inputPlaca.classList.toggle("hidden", !cat.requierePlaca);
        };

        document.getElementById("btnGuardarFinanza").onclick = registrarMovimiento;
        escucharContabilidad();
    };

    async function registrarMovimiento() {
        const tipo = document.getElementById("acc-tipo").value;
        const placa = document.getElementById("acc-placa").value.trim().toUpperCase();
        const concepto = document.getElementById("acc-concepto").value.trim().toUpperCase();
        const monto = parseFloat(document.getElementById("acc-monto").value);
        
        const cat = CATEGORIAS_CONTABLES.find(c => c.id === tipo);

        if (cat.requierePlaca && !placa) {
            return Swal.fire({ icon: 'warning', title: 'ORDEN REQUERIDA', text: 'Este gasto debe estar vinculado a una PLACA.', background: '#0d1117', color: '#fff' });
        }
        if (!concepto || isNaN(monto) || monto <= 0) {
            return Swal.fire({ icon: 'error', title: 'DATOS INCOMPLETOS', background: '#0d1117', color: '#fff' });
        }

        try {
            await addDoc(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), {
                empresaId, concepto, tipo, monto, placa: placa || "ADMIN",
                creadoPor: userRole,
                creadoEn: serverTimestamp()
            });
            renderLayout();
            Swal.fire({ icon: 'success', title: 'ASIENTO CONTABLE REGISTRADO', toast: true, position: 'top-end', timer: 2000 });
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
        let tI = 0, tG = 0;

        list.innerHTML = docs.map(m => {
            const ing = esIngreso(m.tipo);
            ing ? tI += m.monto : tG += m.monto;
            
            const esEditable = userRole === 'owner';
            const fecha = m.creadoEn?.toDate() ? m.creadoEn.toDate().toLocaleDateString() : 'SYNC...';

            return `
            <div class="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 flex justify-between items-center hover:border-cyan-500/40 transition-all">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center ${ing ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}">
                        <i class="fas ${ing ? 'fa-arrow-up' : 'fa-arrow-down'} text-[10px]"></i>
                    </div>
                    <div>
                        <p class="text-xs font-black uppercase text-white">${m.concepto}</p>
                        <p class="text-[7px] text-slate-500 orbitron">${fecha} | REF: ${m.placa}</p>
                    </div>
                </div>
                <div class="flex items-center gap-6">
                    <div class="text-right">
                        <p class="text-md font-black orbitron ${ing ? 'text-emerald-400' : 'text-red-500'}">
                            $ ${m.monto.toLocaleString()}
                        </p>
                        <p class="text-[6px] text-slate-600 orbitron uppercase font-black">${m.tipo}</p>
                    </div>
                    ${esEditable ? `<button onclick="eliminarAsiento('${m.id}')" class="text-slate-700 hover:text-red-500 transition-all"><i class="fas fa-trash-alt text-xs"></i></button>` : ''}
                </div>
            </div>`;
        }).join("");
        actualizarDash(tI, tG);
    }

    async function exportarExcel() {
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        let csv = "Fecha,Concepto,Placa,Tipo,Monto\n";
        
        snap.forEach(d => {
            const data = d.data();
            const f = data.creadoEn?.toDate()?.toLocaleDateString() || "";
            csv += `${f},${data.concepto},${data.placa},${data.tipo},${data.monto}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `CONTABILIDAD_NEXUS_${new Date().toLocaleDateString()}.csv`);
        a.click();
    }

    window.eliminarAsiento = async (id) => {
        const { isConfirmed } = await Swal.fire({
            title: '¿AUDITORÍA DE ELIMINACIÓN?',
            text: "Esta acción quedará registrada en el log de dueño.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0891b2',
            background: '#0d1117', color: '#fff'
        });
        if (isConfirmed) {
            await deleteDoc(doc(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING, id));
            Swal.fire('ELIMINADO', 'Asiento contable removido.', 'success');
        }
    };

    function actualizarDash(ing, gas) {
        const metrics = { "dash-ingresos": ing, "dash-gastos": gas, "dash-utilidad": ing - gas, "dash-caja": ing - gas };
        Object.entries(metrics).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.innerText = `$ ${val.toLocaleString('es-CO')}`;
        });
    }

    renderLayout();
}
