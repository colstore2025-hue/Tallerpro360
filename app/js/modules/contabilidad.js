/**
 * 🏛️ contabilidad.js - NEXUS-X MASTER-CORE V22.0 [QUANTUM-SAP EDITION]
 * MANIOBRA: Integración PUC Universal y Motor de Clasificación de Alto Desarrollo
 * Auditoría: Nivel Software Contable Real (SAP-Standard)
 * Director: William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

export default async function contabilidad(container) {
    const empresaId = (localStorage.getItem("nexus_empresaId") || "").trim();
    if (!empresaId) {
        container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron">ERROR: SESIÓN DE TALLER NO IDENTIFICADA</div>`;
        return;
    }

    const userRole = localStorage.getItem("nexus_userRole") || "mecanico"; 
    let vistaActual = "DIARIO"; 
    let unsubscribe = null;

    // --- CONFIGURACIÓN DE CATEGORÍAS NIVEL SAP (PUC VIRTUAL) ---
    const CATEGORIAS_CONTABLES = [
        { id: "ingreso_ot", label: "4135 - VENTA SERVICIO / MANO DE OBRA", requierePlaca: true, tipo: 'INGRESO' },
        { id: "venta_repuestos", label: "4135 - VENTA DE REPUESTOS", requierePlaca: true, tipo: 'INGRESO' },
        { id: "cta_cobrar_repuesto", label: "1305 - CARTERA (POR COBRAR)", requierePlaca: true, tipo: 'ACTIVO' },
        { id: "saneamiento_deuda", label: "1105 - PAGO RECIBIDO (SANEAMIENTO)", requierePlaca: true, tipo: 'INGRESO' },
        { id: "anticipo_cliente", label: "2805 - ANTICIPOS RECIBIDOS", requierePlaca: true, tipo: 'INGRESO' },
        { id: "gasto_operativo", label: "5195 - GASTOS DIVERSOS (OPERATIVOS)", requierePlaca: false, tipo: 'GASTO' },
        { id: "compra_repuestos", label: "5195 - COMPRA INSUMOS / REPUESTOS", requierePlaca: false, tipo: 'GASTO' },
        { id: "pago_nomina", label: "5105 - GASTOS DE PERSONAL (NÓMINA)", requierePlaca: false, tipo: 'GASTO' },
        { id: "pago_servicios", label: "5135 - SERVICIOS PÚBLICOS", requierePlaca: false, tipo: 'GASTO' },
        { id: "arrendamientos", label: "5120 - ARRENDAMIENTOS", requierePlaca: false, tipo: 'GASTO' },
        { id: "inyeccion_capital", label: "3115 - APORTES DE CAPITAL", requierePlaca: false, tipo: 'INGRESO' },
        { id: "ajuste_auditoria", label: "9999 - AJUSTE DE AUDITORÍA", requierePlaca: false, tipo: 'AJUSTE' }
    ];

    // --- MOTOR DE CLASIFICACIÓN CUÁNTICA ---
    const clasificarMovimiento = (m) => {
        const t = (m.tipo || "").toLowerCase();
        if (t.includes("ingreso") || t.includes("4135") || t.includes("saneamiento") || t.includes("1105") || t.includes("capital") || t.includes("2805")) return "INGRESO";
        if (t.includes("gasto") || t.includes("51") || t.includes("nomina") || t.includes("arriendo") || t.includes("servicio") || t.includes("compra")) return "GASTO";
        return "OTRO";
    };

    const extraerMonto = (data) => {
        const raw = data.monto ?? data.total ?? data.valor ?? 0;
        return typeof raw === 'number' ? raw : parseFloat(raw) || 0;
    };

    // --- MOTOR DE EXPORTACIÓN EXCEL (LIBRO AUXILIAR CONTABLE) ---
    const exportarLibroAuxiliar = async () => {
        try {
            Swal.fire({ title: 'Generando Reporte SAP...', didOpen: () => Swal.showLoading() });
            
            // Importación dinámica para evitar errores de librería ausente
            const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.full.min.js");
            
            const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
            const snap = await getDocs(q);
            
            const dataAudit = snap.docs.map(doc => {
                const m = doc.data();
                const monto = extraerMonto(m);
                const nat = clasificarMovimiento(m);
                const codPUC = CATEGORIAS_CONTABLES.find(c => c.id === m.tipo)?.label.split(' - ')[0] || "9999";

                return {
                    "FECHA": m.creadoEn?.toDate().toLocaleDateString() || 'N/A',
                    "CODIGO PUC": codPUC,
                    "CONCEPTO": (m.concepto || "").toUpperCase(),
                    "PLACA/ID": m.placa || "ADMIN",
                    "DÉBITO (ING)": nat === "INGRESO" ? monto : 0,
                    "CRÉDITO (GAS)": nat === "GASTO" ? monto : 0,
                    "AUDITOR": m.creadoPor || "SISTEMA"
                };
            });

            const ws = XLSX.utils.json_to_sheet(dataAudit);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "LibroAuxiliar");
            XLSX.writeFile(wb, `NEXUS_SAP_LIBRO_${empresaId}.xlsx`);
            
            Swal.close();
        } catch (e) {
            console.error(e);
            Swal.fire("Error SAP", "Falla al inicializar motor de exportación", "error");
        }
    };

    // --- INTERFAZ MASTER-SAP ---
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
                <button id="btn-vista-puc" class="px-6 py-2 rounded-full orbitron text-[9px] font-black transition-all">ESTADOS Y AUDITORÍA</button>
                <button id="btn-exportar" class="px-6 py-2 rounded-full orbitron text-[9px] font-black transition-all bg-emerald-600 text-black hover:bg-emerald-400">EXPORTAR XLSX</button>
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
        const btnE = document.getElementById("btn-exportar");
        const active = "bg-cyan-500 text-black shadow-lg";
        
        btnD.className = `px-6 py-2 rounded-full orbitron text-[9px] font-black ${vistaActual === 'DIARIO' ? active : 'text-slate-500 hover:text-white'}`;
        btnP.className = `px-6 py-2 rounded-full orbitron text-[9px] font-black ${vistaActual === 'CUENTAS' ? active : 'text-slate-500 hover:text-white'}`;
        
        btnD.onclick = () => { vistaActual = "DIARIO"; renderLayout(); };
        btnP.onclick = () => { vistaActual = "CUENTAS"; renderLayout(); };
        btnE.onclick = exportarLibroAuxiliar;
    };

    const cargarVistaDiaria = () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl sticky top-10">
                    <p class="orbitron text-[10px] text-cyan-500 font-black mb-6 uppercase tracking-widest italic">Registro de Asiento Forense</p>
                    <div class="space-y-4">
                        <input id="acc-fecha" type="date" class="w-full bg-black p-4 rounded-2xl border border-white/10 text-cyan-400 orbitron text-[10px]" value="${new Date().toISOString().split('T')[0]}">
                        <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white orbitron text-[10px] uppercase">
                            ${CATEGORIAS_CONTABLES.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
                        </select>
                        <input id="acc-placa" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-center font-black orbitron text-lg" placeholder="PLACA (Opcional)">
                        <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-sm" placeholder="DESCRIPCIÓN DEL ASIENTO">
                        <input id="acc-monto" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-xl" placeholder="VALOR $">
                        <button id="btnGuardar" class="w-full bg-emerald-500 text-black font-black orbitron py-5 rounded-2xl hover:bg-emerald-400 transition-all shadow-lg uppercase">Sincronizar Nexus-SAP</button>
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
            placa: document.getElementById("acc-placa").value.trim().toUpperCase() || "ADMIN",
            concepto: document.getElementById("acc-concepto").value.trim().toUpperCase(),
            monto: parseFloat(document.getElementById("acc-monto").value),
            creadoPor: userRole,
            creadoEn: f ? Timestamp.fromDate(new Date(f + "T12:00:00")) : serverTimestamp()
        };

        if (!payload.concepto || isNaN(payload.monto)) return Swal.fire("Error SAP", "Concepto y Monto son obligatorios", "error");

        try {
            await addDoc(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), payload);
            Swal.fire({ icon: 'success', title: 'ASIENTO SINCRONIZADO', toast: true, position: 'top-end', timer: 2000 });
            document.getElementById("acc-concepto").value = "";
            document.getElementById("acc-monto").value = "";
        } catch (e) { console.error("Error en Transacción:", e); }
    }

    function escucharDatos() {
        if (unsubscribe) unsubscribe();
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        
        unsubscribe = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            docs.sort((a, b) => (b.creadoEn?.seconds || 0) - (a.creadoEn?.seconds || 0));
            
            let tI = 0, tG = 0, tC = 0;
            const list = document.getElementById("listaFinanzas");
            if (!list) return;

            list.innerHTML = docs.map(m => {
                const val = extraerMonto(m);
                const naturaleza = clasificarMovimiento(m);
                const t = (m.tipo || "").toLowerCase();

                if (naturaleza === "INGRESO") tI += val;
                if (naturaleza === "GASTO") tG += val;
                
                if (t.includes("cta_cobrar") || t.includes("1305")) tC += val;
                if (t.includes("saneamiento") || t.includes("1105")) tC -= val;

                return `
                <div class="bg-[#0d1117] p-4 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-cyan-500/30 transition-all shadow-lg">
                    <div class="flex gap-4 items-center">
                        <div class="w-1 h-8 rounded-full ${naturaleza === "INGRESO" ? 'bg-emerald-500' : 'bg-red-500'}"></div>
                        <div>
                            <p class="text-[11px] font-black text-white leading-tight uppercase">${m.concepto}</p>
                            <p class="text-[8px] text-slate-500 orbitron uppercase">${m.placa} | ${m.tipo}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-black orbitron ${naturaleza === "INGRESO" ? 'text-emerald-400' : 'text-red-500'}">$ ${val.toLocaleString()}</p>
                        <p class="text-[7px] text-slate-600">${m.creadoEn?.toDate().toLocaleDateString() || '...Sincronizando'}</p>
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
        content.innerHTML = `<div class="p-20 text-center orbitron text-cyan-500 animate-pulse">GENERANDO BALANCE ANALÍTICO...</div>`;
        
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        
        let stats = { ing: 0, gas: 0, cart: 0, sane: 0 };
        snap.forEach(d => {
            const m = d.data();
            const v = extraerMonto(m);
            const n = clasificarMovimiento(m);
            const t = (m.tipo || "").toLowerCase();

            if (n === "INGRESO") stats.ing += v;
            if (n === "GASTO") stats.gas += v;
            if (t.includes("cta_cobrar") || t.includes("1305")) stats.cart += v;
            if (t.includes("saneamiento") || t.includes("1105")) stats.sane += v;
        });

        content.innerHTML = `
        <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 shadow-2xl animate-in zoom-in duration-500 text-center">
            <h2 class="orbitron text-2xl text-amber-500 mb-10 font-black uppercase tracking-[0.3em]">Auditoría General Nexus-SAP</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                ${renderStatCard("Flujo Real de Ingresos (4135)", stats.ing, "text-emerald-400", "Ventas, Saneamientos y Aportes")}
                ${renderStatCard("Costo de Operación (5195)", stats.gas, "text-red-400", "Gastos, Nómina y Arriendos")}
                ${renderStatCard("Cuentas por Cobrar (1305)", stats.cart - stats.sane, "text-cyan-400", "Cartera Activa Pendiente")}
                ${renderStatCard("Utilidad del Ejercicio", stats.ing - stats.gas, "text-amber-400", "Balance de Caja Real")}
            </div>
        </div>`;
    }

    function renderStatCard(title, val, color, sub) {
        return `<div class="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 shadow-inner group hover:border-cyan-500/20 transition-all">
            <p class="text-[9px] orbitron ${color} mb-2 uppercase font-black tracking-widest">${title}</p>
            <span class="text-3xl font-black orbitron ${color}">$ ${val.toLocaleString()}</span>
            <p class="text-[7px] text-slate-600 mt-2 uppercase italic">${sub}</p>
        </div>`;
    }

    renderLayout();
}
