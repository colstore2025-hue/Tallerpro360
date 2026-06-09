/**
 * 🏛️ contabilidad.js - NEXUS-X MASTER-CORE V23.0.0 [QUANTUM-SAP FORENSIC]
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
    let registrosGlobales = []; // Cache local para filtros en tiempo real
    let estadosCierreMes = {};  // Diccionario llave-valor para períodos cerrados: {'2026-05': true}

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

    // --- VERIFICADOR DE PERÍODO BLOQUEADO ---
    const esPeriodoBloqueado = (fechaString) => {
        if (!fechaString) return false;
        const periodo = fechaString.substring(0, 7); // Extrae 'YYYY-MM'
        return !!estadosCierreMes[periodo];
    };

    // --- CARGA Y SINCRONIZACIÓN DE CIERRES MENSUALES ---
    const cargarEstadosCierre = async () => {
        try {
            const q = query(collection(db, "cierres_mensuales"), where("empresaId", "==", empresaId));
            const snap = await getDocs(q);
            estadosCierreMes = {};
            snap.forEach(doc => {
                const data = doc.data();
                if (data.estado === "CERRADO") {
                    estadosCierreMes[data.periodo] = doc.id; // Guarda ID para reversión posterior
                }
            });
        } catch (e) {
            console.error("Falla al mapear control de cierres SAP:", e);
        }
    };

    const exportarExcelSAP = async () => {
        try {
            Swal.fire({ title: 'Sincronizando Excel Forense...', didOpen: () => Swal.showLoading() });
            const LibXLSX = await cargarMotorExcel();
            
            const rInicio = document.getElementById("filtro-fecha-inicio")?.value || "";
            const rFin = document.getElementById("filtro-fecha-fin")?.value || "";

            let docsFiltrados = [...registrosGlobales];
            if (rInicio) docsFiltrados = docsFiltrados.filter(m => m.fecha_registro >= rInicio);
            if (rFin) docsFiltrados = docsFiltrados.filter(m => m.fecha_registro <= rFin);

            if (docsFiltrados.length === 0) return Swal.fire("Aviso", "Sin datos en el rango seleccionado para exportar", "info");

            // Ordenamiento ascendente por fecha para el reporte estructurado
            docsFiltrados.sort((a, b) => a.fecha_registro.localeCompare(b.fecha_registro));

            const dataAudit = docsFiltrados.map(m => {
                const monto = extraerMonto(m);
                const nat = clasificarMovimiento(m);
                const catObj = CATEGORIAS_CONTABLES.find(c => c.id === m.tipo);
                const codPUC = m.puc || catObj?.puc || "9999";
                
                return {
                    "FECHA": m.fecha_registro,
                    "PERÍODO": m.fecha_registro.substring(0, 7),
                    "COD PUC": codPUC,
                    "CUENTA": m.cuenta || catObj?.cuenta || codPUC + "05",
                    "CONCEPTO": (m.concepto || "").toUpperCase(),
                    "PLACA": (m.placa || "ADMIN").toUpperCase(),
                    "DEBITO (+)": (nat === "INGRESO" || m.naturaleza === "DEBITO") ? monto : 0,
                    "CREDITO (-)": (nat === "GASTO" || m.naturaleza === "CREDITO") ? monto : 0,
                    "AUDITOR": m.creadoPor || "SISTEMA",
                    "ESTADO CIERRE": esPeriodoBloqueado(m.fecha_registro) ? "BLOQUEADO/CERRADO" : "ABIERTO"
                };
            });

            const ws = LibXLSX.utils.json_to_sheet(dataAudit);
            const wb = LibXLSX.utils.book_new();
            LibXLSX.utils.book_append_sheet(wb, ws, "LibroAuxiliarSAP");
            LibXLSX.writeFile(wb, `NEXUS_REPORTE_FORENSE_${empresaId}.xlsx`);
            Swal.close();
        } catch (e) { 
            console.error("🚀 EXCEL_ENGINE_FAULT ->", e);
            Swal.fire("Error SAP", "Falla en motor Excel", "error"); 
        }
    };

    const renderLayout = async () => {
        await cargarEstadosCierre();
        
        // Inicialización de rango por defecto (Mes actual)
        const hoy = new Date();
        const fInicioDefecto = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
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
        
        // Iniciar enlace en tiempo real con Firestore
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
        if (vistaActual === "DIARIO") {
            cargarVistaDiaria();
        } else {
            cargarVistaCuentas();
        }
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

        // VALIDACIÓN CRÍTICA CONTRA CIERRE DE MES
        if (esPeriodoBloqueado(f)) {
            return Swal.fire({
                title: "PERÍODO BLOQUEADO",
                text: `El mes ${f.substring(0, 7)} ya cuenta con un Cierre Contable Consolidado y firmado. No se permiten nuevos asientos.`,
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

    // --- PIPELINE DE ORDENAMIENTO CRONOLÓGICO Y AGRUPACIÓN POR PERÍODOS ---
    const renderizarListaAgrupada = () => {
        const listContainer = document.getElementById("listaFinanzasAgrupada");
        if (!listContainer) return;

        const rInicio = document.getElementById("filtro-fecha-inicio")?.value || "";
        const rFin = document.getElementById("filtro-fecha-fin")?.value || "";

        // Filtrado por el rango seleccionado
        let docsFiltrados = [...registrosGlobales];
        if (rInicio) docsFiltrados = docsFiltrados.filter(m => m.fecha_registro >= rInicio);
        if (rFin) docsFiltrados = docsFiltrados.filter(m => m.fecha_registro <= rFin);

        if (docsFiltrados.length === 0) {
            listContainer.innerHTML = `<div class="p-16 text-center text-slate-500 orbitron text-xs border border-dashed border-white/10 rounded-[2rem]">LIBRO AUXILIAR SIN REGISTROS EN ESTE RANGO TEMPORAL</div>`;
            return;
        }

        // Agrupación de transacciones por mes (período 'YYYY-MM')
        const mapaPeriodos = {};
        docsFiltrados.forEach(m => {
            const periodo = m.fecha_registro.substring(0, 7); // Mapea el mes
            if (!mapaPeriodos[periodo]) {
                mapaPeriodos[periodo] = [];
            }
            mapaPeriodos[periodo].push(m);
        });

        // Ordenar los períodos en orden cronológico ascendente
        const periodosOrdenados = Object.keys(mapaPeriodos).sort((a, b) => a.localeCompare(b));

        let htmlFinal = "";

        periodosOrdenados.forEach(per => {
            const transaccionesDelMes = mapaPeriodos[per];
            
            // Requerimiento 1: Ordenar transacciones mes a mes de forma ASCENDENTE
            transaccionesDelMes.sort((a, b) => a.fecha_registro.localeCompare(b.fecha_registro));

            // Requerimiento 2: Totalizar Débitos y Créditos de cada columna del mes
            let totalDebitoMes = 0;
            let totalCreditoMes = 0;

            transaccionesDelMes.forEach(m => {
                const val = extraerMonto(m);
                const nat = clasificarMovimiento(m);
                if (nat === "INGRESO" || m.naturaleza === "DEBITO") totalDebitoMes += val;
                if (nat === "GASTO" || m.naturaleza === "CREDITO") totalCreditoMes += val;
            });

            const esMesCerrado = !!estadosCierreMes[per];

            // Renderizado de la cabecera del Mes con totales por columna
            htmlFinal += `
            <div class="bg-[#0d1117] rounded-[2.5rem] border ${esMesCerrado ? 'border-red-500/20 bg-gradient-to-b from-[#0d1117] to-red-950/10' : 'border-white/5'} p-6 shadow-xl space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-2">
                    <div>
                        <span class="text-[7px] orbitron bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400">NEXUS_PERÍODO</span>
                        <h3 class="orbitron text-lg font-black text-white tracking-widest mt-1 uppercase flex items-center gap-2">
                            ${traducirPeriodo(per)} 
                            ${esMesCerrado ? '<span class="text-[8px] bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-mono">🔒 SÉLLADO SAP</span>' : '<span class="text-[8px] bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">🔓 ABIERTO</span>'}
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
                                    ${m.fecha_registro.substring(8, 10)} / ${m.fecha_registro.substring(5, 7)}
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
                                    <span class="text-[6px] uppercase font-black tracking-wider text-slate-600 block orbitron">${esDeb ? 'DÉBITO' : 'CRÉDITO'}</span>
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

    // --- REQUERIMIENTO 3: CRUD REFORMADO CON FLEXIBILIDAD DE FECHAS ---
    window.nexusEditarRegistro = async (id, conceptoAct, montoAct, placaAct, tipoAct, fechaAct) => {
        // VALIDACIÓN DE CIERRE PREVIA A LA EDICIÓN
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
                    <label class="block text-slate-400 orbitron font-black text-[9px] mb-1">FECHA DEL MOVIMIENTO (NUEVA FECHA):</label>
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
                    Swal.showValidationMessage('La fecha es un requerimiento mandatorio de auditoría');
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
            
            // Validar que la nueva fecha destino no esté bloqueada por cierres
            if (esPeriodoBloqueado(formValues.fecha_registro)) {
                return Swal.fire("Operación Abortada", "La fecha destino seleccionada está bloqueada por un cierre activo.", "error");
            }

            try {
                const docRef = doc(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING, id);
                await updateDoc(docRef, formValues);
                Swal.fire({ title: 'Éxito', text: 'Asiento propagado relocalizado correctamente.', icon: 'success', background: '#0d1117', color: '#fff' });
            } catch (err) {
                Swal.fire('Error', 'Falla de transmisión a Firestore.', 'error');
            }
        }
    };

    window.nexusEliminarRegistro = async (id, concepto, fechaAct) => {
        if (esPeriodoBloqueado(fechaAct)) {
            return Swal.fire("Acción Restringida", "No se permite remover transacciones de un período con sellado legal.", "error");
        }

        const result = await Swal.fire({
            title: '¿ELIMINAR ASIENTO CONTABLE?',
            text: `Afectará saldos acumulados de mes y balances. Registro: ${concepto}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'SÍ, RETIRAR',
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

    // --- SISTEMA INTEGERRÉSIMO DE GESTIÓN Y REVERSIÓN DE CIERRE MENSUAL ---
    async function gestionarCierreMesModal() {
        const hoy = new Date();
        const periodoSugerido = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

        let htmlPeriodos = `
            <div class="p-2 font-sans text-xs text-left space-y-4">
                <div class="bg-black/30 p-3 rounded-xl border border-white/5">
                    <label class="block text-slate-400 orbitron text-[8px] font-black uppercase mb-1">Escribir Período a Gestionar (YYYY-MM):</label>
                    <input id="cierre-periodo-input" class="w-full bg-black p-3 rounded-lg border border-white/10 text-white font-bold orbitron text-center uppercase tracking-widest" value="${periodoSugerido}" placeholder="Ej: 2026-05">
                </div>
                <div class="border-t border-white/10 pt-3">
                    <h5 class="orbitron font-black text-[9px] text-amber-400 uppercase mb-2">Estatus de Períodos Mapeados:</h5>
                    <div class="max-h-[150px] overflow-y-auto space-y-1 pr-1">
                        ${Object.keys(estadosCierreMes).length === 0 ? '<p class="text-slate-500 italic">No hay cierres definitivos registrados todavía.</p>' : 
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
                    Swal.showValidationMessage('Formato de período inválido. Use YYYY-MM');
                    return false;
                }
                return per;
            }
        }).then(async (result) => {
            const per = result.value;
            if (!per) return;

            if (result.isConfirmed) {
                // FLUJO DE CIERRE DEFINITIVO
                if (estadosCierreMes[per]) return Swal.fire("Aviso", "El mes seleccionado ya se encuentra en estatus de Cierre.", "info");
                
                // Calcular acumulados de control antes de cerrar
                const transaccionesMes = registrosGlobales.filter(m => m.fecha_registro.startsWith(per));
                if (transaccionesMes.length === 0) return Swal.fire("Error SAP", "No hay movimientos registrados para decretar cierre en ese período.", "error");

                Swal.fire({
                    title: `¿Confirmar Cierre de ${per}?`,
                    text: "Se bloquearán las modificaciones de transacciones. El informe definitivo consolidará el día 1 del siguiente periodo.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "SÍ, SÉLLAR LIBRO",
                    background: '#0d1117',
                    color: '#fff'
                }).then(async (cRes) => {
                    if (cRes.isConfirmed) {
                        await addDoc(collection(db, "cierres_mensuales"), {
                            empresaId,
                            periodo: per,
                            estado: "CERRADO",
                            fechaCierreSystem: new Date().toISOString(),
                            ejecutadoPor: userRole
                        });
                        Swal.fire("Cierre Exitoso", `Libro contable del período ${per} asegurado contra manipulaciones de red.`, "success");
                        renderLayout();
                    }
                });
            } else if (result.isDenied) {
                // FLUJO DE REVERSIÓN GERENCIAL (ROLLBACK DE SEGURIDAD)
                const docId = estadosCierreMes[per];
                if (!docId) return Swal.fire("Error", "El período estipulado no registra ningún bloqueo activo.", "error");

                Swal.fire({
                    title: `¿REVERTIR CIERRE DE ${per}?`,
                    text: "Medida de alta criticidad. Se reabrirán los permisos CRUD de modificación sobre las cuentas PUC de este período.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: '#06b6d4',
                    confirmButtonText: "SÍ, REABRIR LIBRO",
                    background: '#0d1117',
                    color: '#fff'
                }).then(async (rRes) => {
                    if (rRes.isConfirmed) {
                        await deleteDoc(doc(db, "cierres_mensuales", docId));
                        Swal.fire("Libro Liberado", `Se completó la reversión. El periodo ${per} se encuentra en estado ABIERTO.`, "success");
                        renderLayout();
                    }
                });
            }
        });
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
        content.innerHTML = `<div class="p-20 text-center orbitron text-cyan-500 animate-pulse italic">GENERANDO BALANCE ANALÍTICO CUENTAS PUC...</div>`;
        
        const rInicio = document.getElementById("filtro-fecha-inicio")?.value || "";
        const rFin = document.getElementById("filtro-fecha-fin")?.value || "";

        let docsFiltrados = [...registrosGlobales];
        if (rInicio) docsFiltrados = docsFiltrados.filter(m => m.fecha_registro >= rInicio);
        if (rFin) docsFiltrados = docsFiltrados.filter(m => m.fecha_registro <= rFin);

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
        <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 shadow-2xl animate-in zoom-in duration-500 text-center max-w-5xl mx-auto">
            <h2 class="orbitron text-2xl text-amber-500 mb-2 font-black uppercase tracking-[0.3em]">Auditoría de Cuentas PUC</h2>
            <p class="text-[9px] text-slate-500 orbitron uppercase tracking-widest mb-10">Rango Evaluado: ${rInicio || 'INICIO'} AL ${rFin || 'FIN'}</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                ${renderStatCard("Flujo Bruto de Ingresos (4135)", stats.ing, "text-emerald-400", "Servicios, Ventas e Inyecciones")}
                ${renderStatCard("Costo Operacional Consolidado (51)", stats.gas, "text-red-400", "Gastos de Personal, Arriendos y Diversos")}
                ${renderStatCard("Cuentas por Cobrar Pendientes (1305)", stats.cart - stats.sane, "text-cyan-400", "Cartera en Patio Retenida")}
                ${renderStatCard("EBITDA Neto del Rango", stats.ing - stats.gas, "text-amber-400", "Margen Real Operativo")}
            </div>
        </div>`;
    }

    function renderStatCard(title, val, color, sub) {
        return `<div class="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 shadow-inner hover:border-cyan-500/20 transition-all">
            <p class="text-[9px] orbitron ${color} mb-2 uppercase font-black tracking-widest">${title}</p>
            <span class="text-3xl font-black orbitron ${color}">$ ${Math.round(val).toLocaleString('es-CO')}</span>
            <p class="text-[7px] text-slate-600 mt-2 uppercase italic">${sub}</p>
        </div>`;
    }

    function traducirPeriodo(pString) {
        const [ano, mes] = pString.split("-");
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        return `${meses[parseInt(mes) - 1]} ${ano}`;
    }

    // --- RECEPTOR DE TELEMETRÍA ÓPTICA AVANZADO (PROCESADOR MULTI-ASIENTO OCR AI) ---
    window.addEventListener("NEXUS_QUANTUM_VISION_BURST", async (e) => {
        const datosVision = e.detail;
        if (!datosVision) return;

        if (datosVision.tipoDocumento === "LIBRO_MANUAL_CONTABLE" && Array.isArray(datosVision.asientos)) {
            Swal.fire({
                title: '🛰️ LIBRO MANUAL DETECTADO',
                text: `Se identificaron ${datosVision.asientos.length} asientos contables. ¿Proceder con inyección masiva en lote?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#10b981',
                confirmButtonText: 'INYECTAR LOTE',
                background: '#05070a',
                color: '#fff'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    Swal.fire({ title: 'Procesando bloque contable...', didOpen: () => Swal.showLoading(), background: '#05070a', color: '#fff' });
                    
                    for (const asiento of datosVision.asientos) {
                        const esCredito = asiento.naturaleza === "CREDITO" || asiento.credito > 0;
                        const montoFinal = asiento.monto || (esCredito ? asiento.credito : asiento.debito) || 0;
                        const fReg = asiento.fecha || new Date().toISOString().split('T')[0];

                        // Control estricto anti-inyección en períodos bloqueados
                        if (esPeriodoBloqueado(fReg)) continue;

                        let tipoSugerido = esCredito ? "compra_repuestos" : "ingreso_ot";
                        let pucSugerido = esCredito ? "5195" : "4135";
                        let cuentaSugerida = esCredito ? "519505" : "413505";

                        if (asiento.codigoPUC) {
                            pucSugerido = asiento.codigoPUC.substring(0, 4);
                            cuentaSugerida = asiento.codigoPUC;
                            if (pucSugerido.startsWith("51")) tipoSugerido = "gasto_operativo";
                            if (pucSugerido.startsWith("11") || pucSugerido.startsWith("41")) tipoSugerido = "ingreso_ot";
                        }

                        await addDoc(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), {
                            empresaId,
                            tipo: tipoSugerido,
                            puc: pucSugerido,
                            cuenta: cuentaSugerida,
                            categoria: esCredito ? "GASTO" : "INGRESO",
                            naturaleza: esCredito ? "CREDITO" : "DEBITO",
                            placa: (asiento.placa || "ADMIN").toUpperCase().trim(),
                            concepto: `OCR_BATCH: ${(asiento.concepto || "ASIENTO_OCR").toUpperCase()}`,
                            monto: Number(montoFinal),
                            creadoPor: "QUANTUM_VISION_AI",
                            fecha_registro: fReg,
                            creadoEn: Timestamp.fromDate(new Date(fReg + "T12:00:00"))
                        });
                    }
                    Swal.fire({ title: 'Lote Sincronizado', icon: 'success', background: '#05070a', color: '#fff' });
                }
            });
            return;
        }

        if (datosVision.tipoDocumento === "FACTURA_PROVEEDOR") {
            const fFactura = datosVision.fecha || new Date().toISOString().split('T')[0];
            if (esPeriodoBloqueado(fFactura)) {
                return Swal.fire("Gasto Bloqueado", "La factura corresponde a un período con cierre contable sellado.", "error");
            }

            const selectTipo = document.getElementById("acc-tipo");
            if (selectTipo) selectTipo.value = "compra_repuestos";

            const inputMonto = document.getElementById("acc-monto");
            if (inputMonto && datosVision.monto > 0) inputMonto.value = datosVision.monto;

            const inputConcepto = document.getElementById("acc-concepto");
            if (inputConcepto) {
                const nitInfo = datosVision.nit ? ` | NIT: ${datosVision.nit}` : "";
                inputConcepto.value = `COMPRA_INSUMOS_OCR${nitInfo}`;
            }

            Swal.fire({ title: '🛰️ CONT_NEXUS_LINK', text: `GASTO DETECTADO: $${datosVision.monto.toLocaleString()} | PRECARGADO EN RAM`, icon: 'success', background: '#05070a', color: '#fff' });
        }
    });

    await renderLayout();
}
