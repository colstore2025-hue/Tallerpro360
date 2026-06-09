/**
 * 🏛️ contabilidad.js - NEXUS-X MASTER-CORE V23.1.0 [QUANTUM-SAP FORENSIC]
 * Auditoría: Nivel Software Contable Real (SAP-Standard) - Cierre Mensual Avanzado
 * UNIFICACIÓN: CRUD Operativo + Telemetría de Libros Manuales + Cierres Blindados
 * Director: William Jeffry Urquijo Cubillos // Nexus AI 2026
 * INTEGRACIÓN TOTAL: Sincronización en espejo con ordenes.js, finanzas_elite.js y dashboards.
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

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
    let registrosGlobales = []; 
    let estadosCierreMes = {};  

    const CATEGORIAS_CONTABLES = [
        { id: "ingreso_ot", label: "4135 - VENTA SERVICIO / MANO DE OBRA", requierePlaca: true, tipo: 'INGRESO', puc: "4135", cuenta: "413505", naturaleza: "DEBITO" },
        { id: "venta_repuestos", label: "4135 - VENTA DE REPUESTOS", requierePlaca: true, tipo: 'INGRESO', puc: "4135", cuenta: "413510", naturaleza: "DEBITO" },
        { id: "cta_cobrar_repuesto", label: "1305 - CARTERA (POR COBRAR)", requierePlaca: true, tipo: 'ACTIVO', puc: "1305", cuenta: "130505", naturaleza: "DEBITO" },
        { id: "saneamiento_deuda", label: "1105 - PAGO RECIBIDO (SANEAMIENTO)", requierePlaca: true, tipo: 'INGRESO', puc: "1105", cuenta: "110505", naturaleza: "DEBITO" },
        { id: "anticipo_cliente", label: "2805 - ANTICIPOS RECIBIDOS", requierePlaca: true, tipo: 'INGRESO', puc: "2805", cuenta: "280505", naturaleza: "DEBITO" },
        { id: "gasto_operativo", label: "5195 - GASTOS DIVERSOS (OPERATIVOS)", requierePlaca: false, tipo: 'GASTO', puc: "5195", cuenta: "519595", naturaleza: "CREDITO" },
        { id: "compra_repuestos", label: "5195 - COMPRA INSUMOS / REPUESTOS", requierePlaca: false, tipo: 'GASTO', puc: "5195", cuenta: "519505", naturaleza: "CREDITO" },
        { id: "pago_nomina", label: "5105 - GASTOS DE PERSONAL (NÓMINA)", requierePlaca: false, tipo: 'GASTO', puc: "5105", cuenta: "510506", naturaleza: "CREDITO" },
        { id: "pago_servicios", label: "5135 - SERVICIOS PÚBLICOS", requierePlaca: false, tipo: 'GASTO', puc: "5135", cuenta: "513505", naturaleza: "CREDITO" },
        { id: "arrendamientos", label: "5120 - ARRENDAMIENTOS", requierePlaca: false, tipo: 'GASTO', puc: "5120", cuenta: "512005", naturaleza: "CREDITO" },
        { id: "inyeccion_capital", label: "3115 - APORTES DE CAPITAL", requierePlaca: false, tipo: 'INGRESO', puc: "3115", cuenta: "311505", naturaleza: "DEBITO" },
        { id: "ajuste_auditoria", label: "9999 - AJUSTE DE AUDITORÍA", requierePlaca: false, tipo: 'AJUSTE', puc: "9999", cuenta: "999999", naturaleza: "AJUSTE" }
    ];

    const clasificarMovimiento = (m) => {
        const t = (m.tipo || m.puc || m.categoria || "").toLowerCase();
        if (t.includes("ingreso") || t.includes("4135") || t.includes("saneamiento") || t.includes("1105") || t.includes("capital") || t.includes("2805")) return "INGRESO";
        if (t.includes("gasto") || t.includes("51") || t.includes("nomina") || t.includes("arriendo") || t.includes("servicio") || t.includes("compra")) return "GASTO";
        return "OTRO";
    };

    const extraerMonto = (data) => {
        const raw = data.monto ?? data.total ?? data.valor ?? 0;
        return typeof raw === 'number' ? raw : parseFloat(raw) || 0;
    };

    const esPeriodoBloqueado = (fechaString) => {
        if (!fechaString) return false;
        const periodo = fechaString.substring(0, 7); 
        return !!estadosCierreMes[periodo];
    };

    const cargarEstadosCierre = async () => {
        try {
            const q = query(collection(db, "cierres_mensuales"), where("empresaId", "==", empresaId));
            const snap = await getDocs(q);
            estadosCierreMes = {};
            snap.forEach(doc => {
                const data = doc.data();
                if (data.estado === "CERRADO") {
                    estadosCierreMes[data.periodo] = doc.id; 
                }
            });
        } catch (e) {
            console.error("Falla al mapear control de cierres SAP:", e);
        }
    };

    // --- REQUERIMIENTO 2: EXPORTACIÓN CON TOTALIZACIÓN DIRECTA EN EXCEL ---
    const exportarExcelSAP = async () => {
        try {
            Swal.fire({ title: 'Generando Reporte con Totales SAP...', didOpen: () => Swal.showLoading() });
            const LibXLSX = await cargarMotorExcel();
            
            const rInicio = document.getElementById("filtro-fecha-inicio")?.value || "";
            const rFin = document.getElementById("filtro-fecha-fin")?.value || "";

            let docsFiltrados = [...registrosGlobales];
            if (rInicio) docsFiltrados = docsFiltrados.filter(m => m.fecha_registro >= rInicio);
            if (rFin) docsFiltrados = docsFiltrados.filter(m => m.fecha_registro <= rFin);

            if (docsFiltrados.length === 0) return Swal.fire("Aviso", "Sin datos en el rango seleccionado", "info");

            docsFiltrados.sort((a, b) => a.fecha_registro.localeCompare(b.fecha_registro));

            let totalDebitosGbl = 0;
            let totalCreditosGbl = 0;

            // Mapeo estructurado de filas
            const filasReporte = docsFiltrados.map(m => {
                const monto = extraerMonto(m);
                const nat = clasificarMovimiento(m);
                const catObj = CATEGORIAS_CONTABLES.find(c => c.id === m.tipo);
                const codPUC = m.puc || catObj?.puc || "9999";
                
                const debs = (nat === "INGRESO" || m.naturaleza === "DEBITO") ? monto : 0;
                const creds = (nat === "GASTO" || m.naturaleza === "CREDITO") ? monto : 0;

                totalDebitosGbl += debs;
                totalCreditosGbl += creds;

                return {
                    "FECHA": m.fecha_registro,
                    "PERÍODO": m.fecha_registro.substring(0, 7),
                    "COD PUC": codPUC,
                    "CUENTA": m.cuenta || catObj?.cuenta || codPUC + "05",
                    "CONCEPTO": (m.concepto || "").toUpperCase(),
                    "PLACA": (m.placa || "ADMIN").toUpperCase(),
                    "DEBITO (+)": debs,
                    "CREDITO (-)": creds,
                    "AUDITOR": m.creadoPor || "SISTEMA"
                };
            });

            // INYECCIÓN DE FILAS DE TOTALES AL FINAL DEL ARCHIVO
            filasReporte.push({}); // Fila en blanco de separación
            filasReporte.push({
                "FECHA": "--- TOTALES ---",
                "CONCEPTO": "SUMATORIA CONTROL DE AUDITORÍA",
                "DEBITO (+)": totalDebitosGbl,
                "CREDITO (-)": totalCreditosGbl
            });
            filasReporte.push({
                "FECHA": "--- BALANCE ---",
                "CONCEPTO": "EJERCICIO NETO DEL PERIODO",
                "DEBITO (+)": totalDebitosGbl - totalCreditosGbl >= 0 ? totalDebitosGbl - totalCreditosGbl : 0,
                "CREDITO (-)": totalDebitosGbl - totalCreditosGbl < 0 ? Math.abs(totalDebitosGbl - totalCreditosGbl) : 0
            });

            const ws = LibXLSX.utils.json_to_sheet(filasReporte);
            const wb = LibXLSX.utils.book_new();
            LibXLSX.utils.book_append_sheet(wb, ws, "Balance_Sincronizado");
            LibXLSX.writeFile(wb, `NEXUS_REPORTE_PERIODO_${empresaId}.xlsx`);
            Swal.close();
        } catch (e) { 
            console.error("🚀 EXCEL_ENGINE_FAULT ->", e);
            Swal.fire("Error SAP", "Falla en motor Excel", "error"); 
        }
    };

    const renderLayout = async () => {
        await cargarEstadosCierre();
        
        // CORRECCIÓN PUNTO 1: Rango inicial extendido desde Mayo para forzar visibilidad completa
        const hoy = new Date();
        const fInicioDefecto = "2026-05-01"; 
        const fFinDefecto = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];

        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32 animate-in fade-in duration-700">
            <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12 border-b border-white/10 pb-10">
                <div class="text-center lg:text-left">
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter leading-none">FINANCE <span class="text-cyan-400">NEXUS</span></h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-4">Taller: ${empresaId} // Consolidado de Cuentas PUC</p>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    ${renderDashCard("Ingresos", "dash-ingresos", "text-emerald-400")}
                    ${renderDashCard("Gastos", "dash-gastos", "text-red-500")}
                    ${renderDashCard("Utilidad", "dash-utilidad", "text-amber-500")}
                    ${renderDashCard("Cartera", "dash-pendiente", "text-cyan-400")}
                </div>
            </header>

            <div class="bg-[#0d1117] p-4 rounded-3xl border border-white/5 mb-8 flex flex-wrap items-center justify-between gap-4 max-w-5xl mx-auto shadow-2xl">
                <div class="flex items-center gap-3">
                    <div class="flex flex-col">
                        <label class="text-[7px] orbitron text-cyan-400 font-black mb-1">RANGO_INICIO</label>
                        <input type="date" id="filtro-fecha-inicio" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 outline-none" value="${fInicioDefecto}">
                    </div>
                    <div class="flex flex-col">
                        <label class="text-[7px] orbitron text-cyan-400 font-black mb-1">RANGO_FINAL</label>
                        <input type="date" id="filtro-fecha-fin" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 outline-none" value="${fFinDefecto}">
                    </div>
                    <button id="btn-ejecutar-filtro" class="h-9 mt-4 px-4 bg-cyan-600 hover:bg-cyan-400 text-black text-[9px] orbitron font-black rounded-xl transition-all">AUDITAR</button>
                </div>
                
                <div class="flex gap-2">
                    <button id="btn-vista-diario" class="px-5 py-2.5 rounded-full orbitron text-[9px] font-black transition-all">LIBRO DIARIO</button>
                    <button id="btn-vista-puc" class="px-5 py-2.5 rounded-full orbitron text-[9px] font-black transition-all">ESTADOS Y AUDITORÍA</button>
                    <button id="btn-exportar" class="px-5 py-2.5 rounded-full orbitron text-[9px] font-black transition-all bg-emerald-600 text-black hover:bg-emerald-400 shadow-lg">EXPORTAR XLSX</button>
                </div>
            </div>

            <div id="cont-dynamic-content"></div>
        </div>`;
        
        setupNavigation();
        document.getElementById("btn-ejecutar-filtro").onclick = () => procesarYRenderizarDatos();
        escucharDatos();
    };

    function renderDashCard(label, id, color) {
        return `<div class="bg-[#0d1117] p-5 rounded-3xl border border-white/5 text-center shadow-2xl">
            <span class="text-[8px] orbitron ${color} block mb-1 uppercase font-black tracking-widest">${label}</span>
            <h2 id="${id}" class="text-xl font-black orbitron ${color}">$ 0</h2>
        </div>`;
    }

    const setupNavigation = () => {
        const btnD = document.getElementById("btn-vista-diario");
        const btnP = document.getElementById("btn-vista-puc");
        const btnE = document.getElementById("btn-exportar");
        const active = "bg-cyan-500 text-black shadow-lg";

        btnD.className = `px-5 py-2.5 rounded-full orbitron text-[9px] font-black ${vistaActual === 'DIARIO' ? active : 'text-slate-500 bg-white/5'}`;
        btnP.className = `px-5 py-2.5 rounded-full orbitron text-[9px] font-black ${vistaActual === 'CUENTAS' ? active : 'text-slate-500 bg-white/5'}`;
        
        btnD.onclick = () => { vistaActual = "DIARIO"; moficarEstructuraVista(); };
        btnP.onclick = () => { vistaActual = "CUENTAS"; moficarEstructuraVista(); };
        btnE.onclick = exportarExcelSAP;
    };

    const moficarEstructuraVista = () => {
        setupNavigation();
        procesarYRenderizarDatos();
    };

    const procesarYRenderizarDatos = () => {
        vistaActual === "DIARIO" ? cargarVistaDiaria() : cargarVistaCuentas();
    };

    const cargarVistaDiaria = () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-7xl mx-auto">
            <div class="lg:col-span-4">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 sticky top-10 shadow-2xl space-y-4">
                    <h3 class="orbitron text-[10px] text-cyan-400 font-black tracking-widest uppercase border-b border-white/10 pb-2">Asiento Manual Real-Time</h3>
                    <div class="space-y-4">
                        <input id="acc-fecha" type="date" class="w-full bg-black p-4 rounded-2xl border border-white/10 text-cyan-400 orbitron text-[10px]" value="${new Date().toISOString().split('T')[0]}">
                        <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white orbitron text-[10px] uppercase">
                            ${CATEGORIAS_CONTABLES.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
                        </select>
                        <input id="acc-placa" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-center font-black orbitron text-lg" placeholder="PLACA">
                        
                        <div class="relative w-full">
                            <input type="file" id="quantum-camera-input" accept="image/*" capture="camera" class="hidden">
                            <button id="btn-activar-vision" type="button" class="w-full bg-gradient-to-r from-cyan-950 via-cyan-800 to-blue-950 text-cyan-400 font-black orbitron py-4 rounded-2xl hover:from-cyan-900 hover:to-blue-900 transition-all uppercase text-[10px] tracking-widest flex justify-center items-center gap-2 border border-cyan-500/30">
                                <span class="animate-pulse text-cyan-400">●</span> ESCANEAR LIBRO / RECIBO (AI)
                            </button>
                        </div>

                        <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-sm" placeholder="DESCRIPCIÓN">
                        <input id="acc-monto" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-xl" placeholder="VALOR $">
                        <button id="btnGuardar" class="w-full bg-emerald-500 text-black font-black orbitron py-5 rounded-2xl hover:bg-emerald-400 transition-all uppercase">Sincronizar Nexus-SAP</button>
                    </div>
                </div>
            </div>
            <div class="lg:col-span-8 space-y-8">
                <div class="bg-[#0d1117] p-6 rounded-[2rem] border border-white/5 shadow-xl flex items-center justify-between gap-4">
                    <div>
                        <h4 class="orbitron font-black text-xs text-amber-400 uppercase tracking-wider">Módulo de Cierre Mensual Blindado</h4>
                        <p class="text-[9px] text-slate-400 mt-1">El cierre de mes bloquea modificaciones extemporáneas. Requiere auditoría previa.</p>
                    </div>
                    <button id="btn-ejecutar-cierre-ui" class="px-5 py-3 bg-gradient-to-r from-red-900 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-black orbitron text-[9px] uppercase tracking-wider rounded-xl transition-all shadow-md">
                        Gestionar Períodos
                    </button>
                </div>

                <div id="listaFinanzasAgrupada" class="space-y-6 max-h-[85vh] overflow-y-auto pr-2 custom-scroll"></div>
            </div>
        </div>`;
        
        document.getElementById("btnGuardar").onclick = registrarMovimiento;
        document.getElementById("btn-ejecutar-cierre-ui").onclick = gestionarCierreMesModal;
        conectarCapturaCamara();
        renderizarListaAgrupada();
    };

    async function registrarMovimiento() {
        const f = document.getElementById("acc-fecha").value;
        if (!f) return Swal.fire("Error SAP", "Se requiere estipular una fecha válida", "error");

        if (esPeriodoBloqueado(f)) {
            return Swal.fire({
                title: "PERÍODO BLOQUEADO",
                text: `El mes ${f.substring(0, 7)} ya cuenta con un Cierre Contable.`,
                icon: "error",
                background: "#0d1117",
                color: "#fff"
            });
        }

        const selectedId = document.getElementById("acc-tipo").value;
        const catObj = CATEGORIAS_CONTABLES.find(c => c.id === selectedId);

        const payload = {
            empresaId,
            tipo: selectedId,
            puc: catObj ? catObj.puc : "9999", 
            cuenta: catObj ? catObj.cuenta : "999999", 
            categoria: catObj ? catObj.tipo : "OTRO",
            naturaleza: catObj ? catObj.naturaleza : "DEBITO",
            placa: document.getElementById("acc-placa").value.trim().toUpperCase() || "ADMIN",
            concepto: document.getElementById("acc-concepto").value.trim().toUpperCase(),
            monto: parseFloat(document.getElementById("acc-monto").value),
            creadoPor: userRole,
            fecha_registro: f, 
            creadoEn: Timestamp.fromDate(new Date(f + "T12:00:00"))
        };

        if (!payload.concepto || isNaN(payload.monto)) return;
        await addDoc(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), payload);
        document.getElementById("acc-concepto").value = "";
        document.getElementById("acc-monto").value = "";
        Swal.fire({ title: "Asiento Inyectado", icon: "success", toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    }

    // --- PIPELINE ROBUSTO DE RECUPERACIÓN Y ORDENAMIENTO DE DATA ---
    const renderizarListaAgrupada = () => {
        const listContainer = document.getElementById("listaFinanzasAgrupada");
        if (!listContainer) return;

        const rInicio = document.getElementById("filtro-fecha-inicio")?.value || "";
        const rFin = document.getElementById("filtro-fecha-fin")?.value || "";

        // PROCESADOR DE RESCATE: Normaliza los documentos viejos que carecen de 'fecha_registro'
        const registrosNormalizados = registrosGlobales.map(m => {
            let fechaAsignada = m.fecha_registro;
            if (!fechaAsignada && m.creadoEn?.toDate) {
                fechaAsignada = m.creadoEn.toDate().toISOString().split('T')[0];
            } else if (!fechaAsignada) {
                fechaAsignada = new Date().toISOString().split('T')[0];
            }
            return { ...m, fecha_registro: fechaAsignada };
        });

        // Aplicación estricta de filtros temporales sobre la data normalizada
        let docsFiltrados = [...registrosNormalizados];
        if (rInicio) docsFiltrados = docsFiltrados.filter(m => m.fecha_registro >= rInicio);
        if (rFin) docsFiltrados = docsFiltrados.filter(m => m.fecha_registro <= rFin);

        if (docsFiltrados.length === 0) {
            listContainer.innerHTML = `<div class="p-16 text-center text-slate-500 orbitron text-xs border border-dashed border-white/10 rounded-[2rem]">LIBRO AUXILIAR SIN REGISTROS EN ESTE RANGO TEMPORAL</div>`;
            return;
        }

        const mapaPeriodos = {};
        docsFiltrados.forEach(m => {
            const periodo = m.fecha_registro.substring(0, 7); 
            if (!mapaPeriodos[periodo]) mapaPeriodos[periodo] = [];
            mapaPeriodos[periodo].push(m);
        });

        const periodosOrdenados = Object.keys(mapaPeriodos).sort((a, b) => a.localeCompare(b));
        let htmlFinal = "";

        periodosOrdenados.forEach(per => {
            const transaccionesDelMes = mapaPeriodos[per];
            transaccionesDelMes.sort((a, b) => a.fecha_registro.localeCompare(b.fecha_registro));

            let totalDebitoMes = 0;
            let totalCreditoMes = 0;

            transaccionesDelMes.forEach(m => {
                const val = extraerMonto(m);
                const nat = clasificarMovimiento(m);
                if (nat === "INGRESO" || m.naturaleza === "DEBITO") totalDebitoMes += val;
                if (nat === "GASTO" || m.naturaleza === "CREDITO") totalCreditoMes += val;
            });

            const esMesCerrado = !!estadosCierreMes[per];

            htmlFinal += `
            <div class="bg-[#0d1117] rounded-[2.5rem] border ${esMesCerrado ? 'border-red-500/20 bg-gradient-to-b from-[#0d1117] to-red-950/10' : 'border-white/5'} p-6 shadow-xl space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-2">
                    <div>
                        <span class="text-[7px] orbitron bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400">NEXUS_PERÍODO</span>
                        <h3 class="orbitron text-lg font-black text-white tracking-widest mt-1 uppercase flex items-center gap-2">
                            ${traducirPeriodo(per)} 
                            ${esMesCerrado ? '<span class="text-[8px] bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-mono">🔒 CERRADO</span>' : '<span class="text-[8px] bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">🔓 ABIERTO</span>'}
                        </h3>
                    </div>
                    <div class="flex gap-4 bg-black/40 p-3 rounded-2xl border border-white/5">
                        <div class="text-right">
                            <span class="text-[7px] orbitron text-emerald-400 font-bold block uppercase">Total Débitos (+)</span>
                            <span class="text-xs font-black orbitron text-emerald-400">$ ${totalDebitoMes.toLocaleString('es-CO')}</span>
                        </div>
                        <div class="w-[1px] bg-white/10"></div>
                        <div class="text-right">
                            <span class="text-[7px] orbitron text-red-400 font-bold block uppercase">Total Créditos (-)</span>
                            <span class="text-xs font-black orbitron text-red-400">$ ${totalCreditoMes.toLocaleString('es-CO')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="space-y-2">
                    ${transaccionesDelMes.map(m => {
                        const val = extraerMonto(m);
                        const nat = clasificarMovimiento(m);
                        const catObj = CATEGORIAS_CONTABLES.find(c => c.id === m.tipo);
                        const esDeb = (nat === "INGRESO" || m.naturaleza === "DEBITO");

                        return `
                        <div class="bg-black/30 p-4 rounded-xl flex justify-between items-center group hover:bg-black/60 border border-white/0 hover:border-white/5 transition-all">
                            <div class="flex items-center gap-3">
                                <div class="text-[9px] font-mono text-slate-500 bg-white/5 p-1.5 rounded text-center min-w-[45px]">
                                    ${m.fecha_registro.substring(8, 10)}/${m.fecha_registro.substring(5, 7)}
                                </div>
                                <div>
                                    <h5 class="text-xs font-black text-slate-200 uppercase">${m.concepto}</h5>
                                    <p class="text-[8px] text-slate-500 uppercase orbitron mt-0.5">
                                        <span class="text-cyan-400 font-black">${m.placa || 'ADMIN'}</span> | PUC: ${m.cuenta || catObj?.cuenta || '9999'}
                                    </p>
                                </div>
                            </div>
                            <div class="flex items-center gap-4">
                                <div class="text-right">
                                    <p class="text-xs font-black orbitron ${esDeb ? 'text-emerald-400' : 'text-red-400'}">
                                        ${esDeb ? '+' : '-'} $ ${val.toLocaleString('es-CO')}
                                    </p>
                                </div>
                                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <button onclick="window.nexusEditarRegistro('${m.id}', '${m.concepto}', ${val}, '${m.placa}', '${m.tipo}', '${m.fecha_registro}')" class="h-6 w-6 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center text-[10px]">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="window.nexusEliminarRegistro('${m.id}', '${m.concepto}', '${m.fecha_registro}')" class="h-6 w-6 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-black transition-all flex items-center justify-center text-[10px]">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>`;
                    }).join("")}
                </div>
            </div>`;
        });

        listContainer.innerHTML = htmlFinal;
    };

    window.nexusEditarRegistro = async (id, conceptoAct, montoAct, placaAct, tipoAct, fechaAct) => {
        if (esPeriodoBloqueado(fechaAct)) {
            return Swal.fire("Bloqueo de Cierre", "Este asiento pertenece a un período sellado y no puede alterarse.", "error");
        }

        const { value: formValues } = await Swal.fire({
            title: '🏛️ REFORMA DE ASIENTO CONTABLE',
            background: '#0d1117',
            color: '#fff',
            confirmButtonColor: '#06b6d4',
            cancelButtonColor: '#ef4444',
            showCancelButton: true,
            html: `
                <div class="space-y-3 font-sans text-left text-xs p-2">
                    <label class="block text-slate-400 orbitron font-black text-[9px] mb-1">FECHA DEL MOVIMIENTO:</label>
                    <input id="swal-fecha" type="date" class="w-full bg-black p-3 rounded-xl border border-white/10 text-cyan-400 orbitron" value="${fechaAct}">
                    <label class="block text-slate-400 orbitron font-black text-[9px] mb-1">PLACA O ÁREA:</label>
                    <input id="swal-placa" class="w-full bg-black p-3 rounded-xl border border-white/10 text-white uppercase orbitron" value="${placaAct}">
                    <label class="block text-slate-400 orbitron font-black text-[9px] mb-1">DESCRIPCIÓN DEL CONCEPTO:</label>
                    <input id="swal-concepto" class="w-full bg-black p-3 rounded-xl border border-white/10 text-white uppercase" value="${conceptoAct}">
                    <label class="block text-slate-400 orbitron font-black text-[9px] mb-1">VALOR ($):</label>
                    <input id="swal-monto" type="number" class="w-full bg-black p-3 rounded-xl border border-white/10 text-cyan-400 orbitron" value="${montoAct}">
                    <label class="block text-slate-400 orbitron font-black text-[9px] mb-1">CUENTA PUC (NEXUS-SAP):</label>
                    <select id="swal-tipo" class="w-full bg-black p-3 rounded-xl border border-white/10 text-white text-xs">
                        ${CATEGORIAS_CONTABLES.map(c => `<option value="${c.id}" ${c.id === tipoAct ? 'selected' : ''}>${c.label}</option>`).join('')}
                    </select>
                </div>
            `,
            focusConfirm: false,
            preConfirm: () => {
                const nuevaFecha = document.getElementById('swal-fecha').value;
                if (!nuevaFecha) {
                    Swal.showValidationMessage('La fecha es obligatoria');
                    return false;
                }
                const selId = document.getElementById('swal-tipo').value;
                const cObj = CATEGORIAS_CONTABLES.find(c => c.id === selId);
                return {
                    fecha_registro: nuevaFecha,
                    creadoEn: Timestamp.fromDate(new Date(nuevaFecha + "T12:00:00")),
                    placa: document.getElementById('swal-placa').value.trim().toUpperCase(),
                    concepto: document.getElementById('swal-concepto').value.trim().toUpperCase(),
                    monto: parseFloat(document.getElementById('swal-monto').value),
                    tipo: selId,
                    puc: cObj ? cObj.puc : "9999",
                    cuenta: cObj ? cObj.cuenta : "999999",
                    categoria: cObj ? cObj.tipo : "OTRO",
                    naturaleza: cObj ? cObj.naturaleza : "DEBITO"
                }
            }
        });

        if (formValues) {
            if (!formValues.concepto || isNaN(formValues.monto)) return;
            if (esPeriodoBloqueado(formValues.fecha_registro)) {
                return Swal.fire("Operación Abortada", "La fecha destino está bloqueada.", "error");
            }

            try {
                const docRef = doc(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING, id);
                await updateDoc(docRef, formValues);
                Swal.fire({ title: 'Éxito', text: 'Asiento modificado correctamente.', icon: 'success', background: '#0d1117', color: '#fff' });
            } catch (err) {
                Swal.fire('Error', 'Falla de transmisión a Firestore.', 'error');
            }
        }
    };

    window.nexusEliminarRegistro = async (id, concepto, fechaAct) => {
        if (esPeriodoBloqueado(fechaAct)) {
            return Swal.fire("Acción Restringida", "No se permite remover transacciones de un período cerrado.", "error");
        }

        const result = await Swal.fire({
            title: '¿ELIMINAR ASIENTO CONTABLE?',
            text: `Registro: ${concepto}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            background: '#0d1117',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING, id));
                Swal.fire({ title: 'Eliminado', icon: 'success', background: '#0d1117', color: '#fff' });
            } catch (err) {
                Swal.fire('Error', 'Falla operativa de eliminación.', 'error');
            }
        }
    };

    async function gestionarCierreMesModal() {
        const hoy = new Date();
        const periodoSugerido = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

        let htmlPeriodos = `
            <div class="p-2 font-sans text-xs text-left space-y-4">
                <div class="bg-black/30 p-3 rounded-xl border border-white/5">
                    <label class="block text-slate-400 orbitron text-[8px] font-black uppercase mb-1">Escribir Período a Gestionar (YYYY-MM):</label>
                    <input id="cierre-periodo-input" class="w-full bg-black p-3 rounded-lg border border-white/10 text-white font-bold orbitron text-center uppercase tracking-widest" value="${periodoSugerido}">
                </div>
                <div class="border-t border-white/10 pt-3">
                    <h5 class="orbitron font-black text-[9px] text-amber-400 uppercase mb-2">Estatus de Períodos Mapeados:</h5>
                    <div class="max-h-[150px] overflow-y-auto space-y-1 pr-1">
                        ${Object.keys(estadosCierreMes).length === 0 ? '<p class="text-slate-500 italic">No hay cierres definitivos registrados.</p>' : 
                          Object.keys(estadosCierreMes).map(p => `
                            <div class="flex justify-between items-center bg-red-950/20 border border-red-500/10 p-2 rounded-lg">
                                <span class="font-bold text-slate-200 orbitron tracking-wider">${p}</span>
                                <span class="text-[7px] text-red-400 font-mono font-bold uppercase bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">🔒 BLOQUEADO</span>
                            </div>
                          `).join('')}
                    </div>
                </div>
            </div>
        `;

        Swal.fire({
            title: '🛰️ CENTRO DE CONTROL DE CIERRES',
            background: '#0d1117',
            color: '#fff',
            html: htmlPeriodos,
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonColor: '#ef4444',
            denyButtonColor: '#06b6d4',
            cancelButtonColor: '#64748b',
            confirmButtonText: '🔒 SÉLLAR PERÍODO',
            denyButtonText: '🔓 REVERTIR CIERRE',
            preConfirm: () => {
                const per = document.getElementById("cierre-periodo-input").value.trim();
                if (!/^\d{4}-\d{2}$/.test(per)) {
                    Swal.showValidationMessage('Use el formato YYYY-MM');
                    return false;
                }
                return per;
            }
        }).then(async (result) => {
            const per = result.value;
            if (!per) return;

            if (result.isConfirmed) {
                if (estadosCierreMes[per]) return Swal.fire("Aviso", "El mes ya está cerrado.", "info");
                
                await addDoc(collection(db, "cierres_mensuales"), {
                    empresaId,
                    periodo: per,
                    estado: "CERRADO",
                    fechaCierreSystem: new Date().toISOString(),
                    ejecutadoPor: userRole
                });
                Swal.fire("Cierre Exitoso", `Libro contable del período ${per} sellado.`, "success");
                renderLayout();
            } else if (result.isDenied) {
                const docId = estadosCierreMes[per];
                if (!docId) return Swal.fire("Error", "El período no registra bloqueos activos.", "error");

                await deleteDoc(doc(db, "cierres_mensuales", docId));
                Swal.fire("Libro Liberado", `Se reabrió el periodo ${per} con éxito.`, "success");
                renderLayout();
            }
        });
    }

    function conectarCapturaCamara() {
        const btnVision = document.getElementById("btn-activar-vision");
        const cameraInput = document.getElementById("quantum-camera-input");
        if (!btnVision || !cameraInput) return;
        btnVision.onclick = () => cameraInput.click();
        cameraInput.onchange = async (e) => {
            const archivo = e.target.files[0];
            if (!archivo) return;
            const reader = new FileReader();
            reader.onloadend = () => {
                window.dispatchEvent(new CustomEvent("SOLICITUD_ANALISIS_VISION", {
                    detail: { imagen: reader.result, modulo: "CONTABILIDAD", modo: "CIERRE_MAYO_LIBRO" }
                }));
            };
            reader.readAsDataURL(archivo);
        };
    }

    function escucharDatos() {
        if (unsubscribe) unsubscribe();
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        
        unsubscribe = onSnapshot(q, (snap) => {
            registrosGlobales = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            let tI = 0, tG = 0, tC = 0;
            registrosGlobales.forEach(m => {
                const val = extraerMonto(m);
                const n = clasificarMovimiento(m);
                if (n === "INGRESO") tI += val;
                if (n === "GASTO") tG += val;
                if (m.puc === "1305" || m.tipo?.includes("1305")) tC += val;
                if (m.puc === "1105" && m.tipo?.includes("saneamiento")) tC -= val;
            });

            actualizarDashboards(tI, tG, tC);
            procesarYRenderizarDatos();
        });
    }

    function actualizarDashboards(i, g, c) {
        const ids = { "dash-ingresos": i, "dash-gastos": g, "dash-utilidad": i - g, "dash-pendiente": c };
        Object.entries(ids).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.innerText = `$ ${Math.round(val).toLocaleString('es-CO')}`;
        });
    }

    async function cargarVistaCuentas() {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `<div class="p-20 text-center orbitron text-cyan-500 animate-pulse italic">GENERANDO BALANCE...</div>`;
        
        const rInicio = document.getElementById("filtro-fecha-inicio")?.value || "";
        const rFin = document.getElementById("filtro-fecha-fin")?.value || "";

        let docsFiltrados = [...registrosGlobales];
        let stats = { ing: 0, gas: 0, cart: 0, sane: 0 };
        docsFiltrados.forEach(d => {
            const v = extraerMonto(d);
            const n = clasificarMovimiento(d);
            if (n === "INGRESO") stats.ing += v;
            if (n === "GASTO") stats.gas += v;
            if (d.puc === "1305" || d.tipo?.includes("cta_cobrar")) stats.cart += v;
            if (d.puc === "1105" && d.tipo?.includes("saneamiento")) stats.sane += v;
        });

        content.innerHTML = `
        <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 shadow-2xl text-center max-w-5xl mx-auto">
            <h2 class="orbitron text-2xl text-amber-500 mb-2 font-black">Auditoría de Cuentas PUC</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-8">
                ${renderStatCard("Flujo Bruto de Ingresos (4135)", stats.ing, "text-emerald-400", "Ventas")}
                ${renderStatCard("Costo Operacional (51)", stats.gas, "text-red-400", "Gastos")}
                ${renderStatCard("Cartera Activa (1305)", stats.cart - stats.sane, "text-cyan-400", "Por Cobrar")}
                ${renderStatCard("Utilidad Neta", stats.ing - stats.gas, "text-amber-400", "Margen")}
            </div>
        </div>`;
    }

    function renderStatCard(title, val, color, sub) {
        return `<div class="p-8 bg-black/40 rounded-[2.5rem] border border-white/5">
            <p class="text-[9px] orbitron ${color} mb-2 uppercase font-black">${title}</p>
            <span class="text-3xl font-black orbitron ${color}">$ ${Math.round(val).toLocaleString('es-CO')}</span>
        </div>`;
    }

    function traducirPeriodo(pString) {
        const [ano, mes] = pString.split("-");
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        return `${meses[parseInt(mes) - 1]} ${ano}`;
    }

    await renderLayout();
}
