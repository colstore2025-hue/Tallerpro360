/**
 * 🏛️ contabilidad.js - NEXUS-X MASTER-CORE V22.0.1 [QUANTUM-SAP EDITION]
 * Auditoría: Nivel Software Contable Real (SAP-Standard)
 * Director: William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

// --- MOTOR DE CARGA DE LIBRERÍAS EXTERNAS (SOLUCIÓN DEFINITIVA) ---
function cargarMotorExcel() {
    return new Promise((resolve, reject) => {
        if (window.XLSX) return resolve(window.XLSX);
        const script = document.createElement('script');
        script.src = "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.full.min.js";
        script.onload = () => resolve(window.XLSX);
        script.onerror = () => reject(new Error("Falla en el servidor de librerías"));
        document.head.appendChild(script);
    });
}

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
        { id: "ingreso_ot", label: "4135 - VENTA SERVICIO / MANO DE OBRA", tipo: 'INGRESO' },
        { id: "venta_repuestos", label: "4135 - VENTA DE REPUESTOS", tipo: 'INGRESO' },
        { id: "cta_cobrar_repuesto", label: "1305 - CARTERA (POR COBRAR)", tipo: 'ACTIVO' },
        { id: "saneamiento_deuda", label: "1105 - PAGO RECIBIDO (SANEAMIENTO)", tipo: 'INGRESO' },
        { id: "anticipo_cliente", label: "2805 - ANTICIPOS RECIBIDOS", tipo: 'INGRESO' },
        { id: "gasto_operativo", label: "5195 - GASTOS DIVERSOS (OPERATIVOS)", tipo: 'GASTO' },
        { id: "compra_repuestos", label: "5195 - COMPRA INSUMOS / REPUESTOS", tipo: 'GASTO' },
        { id: "pago_nomina", label: "5105 - GASTOS DE PERSONAL (NÓMINA)", tipo: 'GASTO' },
        { id: "pago_servicios", label: "5135 - SERVICIOS PÚBLICOS", tipo: 'GASTO' },
        { id: "arrendamientos", label: "5120 - ARRENDAMIENTOS", tipo: 'GASTO' },
        { id: "inyeccion_capital", label: "3115 - APORTES DE CAPITAL", tipo: 'INGRESO' },
        { id: "ajuste_auditoria", label: "9999 - AJUSTE DE AUDITORÍA", tipo: 'AJUSTE' }
    ];

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

    // --- FUNCIÓN DE EXPORTACIÓN (RE-INGENIERÍA PROFUNDA) ---
    const exportarExcelSAP = async () => {
        try {
            Swal.fire({ title: 'Iniciando Motor Excel...', didOpen: () => Swal.showLoading() });
            
            // Aseguramos que la librería esté cargada antes de ejecutar nada
            const LibXLSX = await cargarMotorExcel();
            
            const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
            const snap = await getDocs(q);
            
            if (snap.empty) {
                Swal.fire("Aviso", "No hay registros contables para exportar.", "info");
                return;
            }

            const dataAudit = snap.docs.map(doc => {
                const m = doc.data();
                const monto = extraerMonto(m);
                const nat = clasificarMovimiento(m);
                const codPUC = CATEGORIAS_CONTABLES.find(c => c.id === m.tipo)?.label.split(' - ')[0] || "9999";

                return {
                    "FECHA": m.creadoEn?.toDate().toLocaleDateString() || 'N/A',
                    "CÓDIGO PUC": codPUC,
                    "CONCEPTO": (m.concepto || "").toUpperCase(),
                    "PLACA": m.placa || "ADMIN",
                    "DÉBITO (+)": nat === "INGRESO" ? monto : 0,
                    "CRÉDITO (-)": nat === "GASTO" ? monto : 0,
                    "USUARIO": m.creadoPor || "SISTEMA"
                };
            });

            const ws = LibXLSX.utils.json_to_sheet(dataAudit);
            const wb = LibXLSX.utils.book_new();
            LibXLSX.utils.book_append_sheet(wb, ws, "AUXILIAR_CONTABLE");
            LibXLSX.writeFile(wb, `NEXUS_REPORTE_${empresaId}.xlsx`);
            
            Swal.fire("Éxito", "Reporte generado correctamente", "success");
        } catch (e) {
            Swal.fire("Error de Librería", "No se pudo cargar el motor Excel. Verifica tu conexión.", "error");
        }
    };

    // --- RENDERIZADO Y UI (VERSION ELITE) ---
    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32">
            <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12 border-b border-white/10 pb-10">
                <div class="text-center lg:text-left">
                    <h1 class="orbitron text-5xl font-black text-white italic leading-none">FINANCE <span class="text-cyan-400">NEXUS</span></h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-4 italic">Audit: QUANTUM-VERIFIED</p>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    ${renderDashCard("Ingresos", "dash-ingresos", "text-emerald-400")}
                    ${renderDashCard("Gastos", "dash-gastos", "text-red-500")}
                    ${renderDashCard("Utilidad", "dash-utilidad", "text-amber-500")}
                    ${renderDashCard("Cartera", "dash-pendiente", "text-cyan-400")}
                </div>
            </header>

            <div class="flex flex-wrap justify-center gap-4 mb-12 bg-[#0d1117]/50 p-2 rounded-full border border-white/5 w-fit mx-auto shadow-2xl">
                <button id="btn-vista-diario" class="px-6 py-2 rounded-full orbitron text-[9px] font-black transition-all">LIBRO DIARIO</button>
                <button id="btn-vista-puc" class="px-6 py-2 rounded-full orbitron text-[9px] font-black transition-all">ESTADOS</button>
                <button id="btn-exportar-sap" class="px-6 py-2 rounded-full orbitron text-[9px] font-black transition-all bg-emerald-600 text-black hover:bg-white">EXPORTAR EXCEL</button>
            </div>

            <div id="cont-dynamic-content"></div>
        </div>`;
        
        setupNavigation();
        vistaActual === "DIARIO" ? cargarVistaDiaria() : cargarVistaCuentas();
    };

    function renderDashCard(label, id, color) {
        return `<div class="bg-[#0d1117] p-5 rounded-3xl border border-white/5 text-center shadow-2xl">
            <span class="text-[8px] orbitron ${color} block mb-1 uppercase font-black">${label}</span>
            <h2 id="${id}" class="text-xl font-black orbitron ${color}">$ 0</h2>
        </div>`;
    }

    const setupNavigation = () => {
        const btnD = document.getElementById("btn-vista-diario");
        const btnP = document.getElementById("btn-vista-puc");
        const btnE = document.getElementById("btn-exportar-sap");
        
        btnD.onclick = () => { vistaActual = "DIARIO"; renderLayout(); };
        btnP.onclick = () => { vistaActual = "CUENTAS"; renderLayout(); };
        btnE.onclick = exportarExcelSAP;
        
        const active = "bg-cyan-500 text-black";
        if(vistaActual === "DIARIO") btnD.classList.add(...active.split(" "));
        else btnP.classList.add(...active.split(" "));
    };

    const cargarVistaDiaria = () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl sticky top-10">
                    <div class="space-y-4">
                        <input id="acc-fecha" type="date" class="w-full bg-black p-4 rounded-2xl border border-white/10 text-cyan-400 orbitron text-[10px]" value="${new Date().toISOString().split('T')[0]}">
                        <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white orbitron text-[10px] uppercase">
                            ${CATEGORIAS_CONTABLES.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
                        </select>
                        <input id="acc-placa" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-center font-black orbitron text-lg" placeholder="PLACA">
                        <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-sm" placeholder="DESCRIPCIÓN">
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
        if (!payload.concepto || isNaN(payload.monto)) return;
        await addDoc(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), payload);
        document.getElementById("acc-concepto").value = "";
        document.getElementById("acc-monto").value = "";
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
                const n = clasificarMovimiento(m);
                if (n === "INGRESO") tI += val;
                if (n === "GASTO") tG += val;
                if (m.tipo?.includes("1305")) tC += val;
                if (m.tipo?.includes("1105")) tC -= val;

                return `
                <div class="bg-[#0d1117] p-4 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-cyan-500/30 transition-all">
                    <div class="flex gap-4 items-center">
                        <div class="w-1 h-8 rounded-full ${n === "INGRESO" ? 'bg-emerald-500' : 'bg-red-500'}"></div>
                        <div><p class="text-[11px] font-black text-white leading-tight uppercase">${m.concepto}</p></div>
                    </div>
                    <p class="text-sm font-black orbitron ${n === "INGRESO" ? 'text-emerald-400' : 'text-red-500'}">$ ${val.toLocaleString()}</p>
                </div>`;
            }).join("");
            actualizarDashboards(tI, tG, tC);
        });
    }

    function actualizarDashboards(i, g, c) {
        if (document.getElementById("dash-ingresos")) {
            document.getElementById("dash-ingresos").innerText = `$ ${i.toLocaleString()}`;
            document.getElementById("dash-gastos").innerText = `$ ${g.toLocaleString()}`;
            document.getElementById("dash-utilidad").innerText = `$ ${(i - g).toLocaleString()}`;
            document.getElementById("dash-pendiente").innerText = `$ ${c.toLocaleString()}`;
        }
    }

    async function cargarVistaCuentas() {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `<div class="p-20 text-center orbitron text-cyan-500">GENERANDO BALANCE...</div>`;
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        let s = { ing: 0, gas: 0, cart: 0, sane: 0 };
        snap.forEach(d => {
            const m = d.data();
            const v = extraerMonto(m);
            const n = clasificarMovimiento(m);
            if (n === "INGRESO") s.ing += v;
            if (n === "GASTO") s.gas += v;
            if (m.tipo?.includes("1305")) s.cart += v;
            if (m.tipo?.includes("1105")) s.sane += v;
        });
        content.innerHTML = `<div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 shadow-2xl text-center"><h2 class="orbitron text-amber-500 mb-10 font-black">AUDITORÍA GENERAL</h2></div>`;
    }

    renderLayout();
}
