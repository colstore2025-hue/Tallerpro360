/**
 * 🏛️ contabilidad.js - NEXUS-X MASTER-CORE V23.6.0 [QUANTUM-SAP FORENSIC]
 * • Auditoría: Nivel Software Contable Real (SAP-Standard) - Cierre Mensual Avanzado
 * • UNIFICACIÓN: CRUD Operativo + Telemetría de Libros Manuales + Cierres Blindados
 * • Corrección de Sumatorias de Gastos (Mayo-Junio) & Flujo Cronológico en Pantalla
 * • Director de Proyecto: William Jeffry Urquijo Cubillos // Nexus AI 2026
 */
import {
  collection, query, where, orderBy, onSnapshot, serverTimestamp, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

// Cargador asíncrono seguro para el motor de reportes Excel
function cargarMotorExcel() {
  return new Promise((resolve, reject) => {
    if (window.XLSX) return resolve(window.XLSX);
    const script = document.createElement('script');
    script.src = "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.full.min.js";
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => reject(new Error("Falla en el servidor de librerías XLSX"));
    document.head.appendChild(script);
  });
}

export default async function contabilidad(container) {
  const empresaId = (localStorage.getItem("nexus_empresaId") || "").trim();
  if (!empresaId) {
    container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron font-bold">ERROR: SESIÓN DE TALLER NO IDENTIFICADA</div>`;
    return;
  }

  const userRole = localStorage.getItem("nexus_userRole") || "mecanico";
  let vistaActual = "DIARIO"; // DIARIO (Línea de tiempo) o CUENTAS (Métricas PUC)
  let unsubscribe = null;
  let registrosGlobales = [];
  let estadosCierreMes = {};

  // Matriz de Cuentas PUC Homologadas SAP
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

  // Clasificación estricta analítica
  const clasificarMovimiento = (m) => {
    const pucStr = String(m.puc || "").trim();
    if (pucStr.startsWith("41") || pucStr.startsWith("11") || pucStr.startsWith("28") || pucStr.startsWith("31")) return "INGRESO";
    if (pucStr.startsWith("51") || pucStr.startsWith("52") || pucStr.startsWith("53")) return "GASTO";
    // Cobertura por propiedad alternativa de categoría
    if (m.categoria === "GASTO" || m.naturaleza === "CREDITO") return "GASTO";
    return "INGRESO";
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
      console.error("❌ CRITICAL SAP ERROR [CIERRE_MAP]:", e);
    }
  };

  const obtenerRegistrosFiltrados = () => {
    const rInicio = document.getElementById("filtro-fecha-inicio")?.value || "2026-05-01";
    const rFin = document.getElementById("filtro-fecha-fin")?.value || "2026-06-30";

    return registrosGlobales.map(m => {
      let fechaAsignada = m.fecha_registro;
      if (!fechaAsignada && m.creadoEn?.toDate) {
        fechaAsignada = m.creadoEn.toDate().toISOString().split('T')[0];
      } else if (!fechaAsignada) {
        fechaAsignada = new Date().toISOString().split('T')[0];
      }
      return { ...m, fecha_registro: fechaAsignada };
    }).filter(m => m.fecha_registro >= rInicio && m.fecha_registro <= rFin);
  };

  // Exportación Avanzada agrupada por PUC con Subtotales Estilo SAP
  const exportarExcelSAP = async () => {
    try {
      Swal.fire({ title: 'Generando Reporte QUANTUM-SAP...', text: 'Estructurando balances y sumatorias por PUC...', didOpen: () => Swal.showLoading() });
      const LibXLSX = await cargarMotorExcel();
      const docsFiltrados = obtenerRegistrosFiltrados();

      if (docsFiltrados.length === 0) {
        Swal.close();
        return Swal.fire("Aviso", "No se encontraron registros contables en el rango seleccionado.", "info");
      }

      // Agrupación por PUC para el reporte Excel solicitado
      const mapaAgrupadoPUC = {};
      docsFiltrados.forEach(m => {
        const catObj = CATEGORIAS_CONTABLES.find(c => c.id === m.tipo);
        const codPUC = m.puc || catObj?.puc || "9999";
        if (!mapaAgrupadoPUC[codPUC]) mapaAgrupadoPUC[codPUC] = [];
        mapaAgrupadoPUC[codPUC].push(m);
      });

      const filasReporte = [];
      let totalDebitosGbl = 0;
      let totalCreditosGbl = 0;

      // Recorrer cuentas ordenadamente
      Object.keys(mapaAgrupadoPUC).sort().forEach(pucKey => {
        let subtotalDebito = 0;
        let subtotalCredito = 0;
        
        // Ordenar transacciones de esta cuenta por fecha
        mapaAgrupadoPUC[pucKey].sort((a, b) => a.fecha_registro.localeCompare(b.fecha_registro));

        mapaAgrupadoPUC[pucKey].forEach(m => {
          const monto = extraerMonto(m);
          const nat = clasificarMovimiento(m);
          const catObj = CATEGORIAS_CONTABLES.find(c => c.id === m.tipo);

          const debs = (nat === "INGRESO" || m.naturaleza === "DEBITO") ? monto : 0;
          const creds = (nat === "GASTO" || m.naturaleza === "CREDITO") ? monto : 0;

          subtotalDebito += debs;
          subtotalCredito += creds;
          totalDebitosGbl += debs;
          totalCreditosGbl += creds;

          filasReporte.push({
            "FECHA REGISTRO": m.fecha_registro,
            "PERÍODO": m.fecha_registro.substring(0, 7),
            "CÓDIGO PUC": pucKey,
            "CUENTA CONTABLE": m.cuenta || catObj?.cuenta || pucKey + "05",
            "CONCEPTO / DETALLE": (m.concepto || "").toUpperCase(),
            "PLACA ASOCIADA": (m.placa || "ADMIN").toUpperCase(),
            "DÉBITO (+)": debs,
            "CRÉDITO (-)": creds,
            "ORIGEN / AUDITOR": m.creadoPor || "SISTEMA"
          });
        });

        // Inyectar fila de subtotal por cuenta PUC
        filasReporte.push({
          "FECHA REGISTRO": `SUBTOTAL PUC ${pucKey}`,
          "CONCEPTO / DETALLE": `CIERRE PARCIAL CUENTA`,
          "DÉBITO (+)": subtotalDebito,
          "CRÉDITO (-)": subtotalCredito
        });
        filasReporte.push({}); // Fila vacía de separación prudencial
      });

      // Totales de Control Finales
      filasReporte.push({
        "FECHA REGISTRO": "TOTALES CONTROL GBL",
        "CONCEPTO / DETALLE": "SUMATORIA ACUMULADA DEL PERIODO EXPORTADO",
        "DÉBITO (+)": totalDebitosGbl,
        "CRÉDITO (-)": totalCreditosGbl
      });

      const balanceNeto = totalDebitosGbl - totalCreditosGbl;
      filasReporte.push({
        "FECHA REGISTRO": "BALANCE UTILIDAD NETO",
        "CONCEPTO / DETALLE": "EJERCICIO DE UTILIDAD OPERACIONAL NETO",
        "DÉBITO (+)": balanceNeto >= 0 ? balanceNeto : 0,
        "CRÉDITO (-)": balanceNeto < 0 ? Math.abs(balanceNeto) : 0
      });

      const ws = LibXLSX.utils.json_to_sheet(filasReporte);
      const wb = LibXLSX.utils.book_new();
      LibXLSX.utils.book_append_sheet(wb, ws, "Libro_Auxiliar_Sincronizado");

      ws['!cols'] = [{wch:18}, {wch:10}, {wch:12}, {wch:18}, {wch:40}, {wch:18}, {wch:15}, {wch:15}, {wch:16}];

      LibXLSX.writeFile(wb, `NEXUS_QUANTUM_SAP_REPORT_${empresaId}.xlsx`);
      Swal.close();
    } catch (e) {
      console.error("🚀 QUANTUM_EXCEL_ENGINE_FAULT ->", e);
      Swal.fire("Error SAP", "Falla de compilación en las matrices de Excel.", "error");
    }
  };

  const renderLayout = async () => {
    await cargarEstadosCierre();

    const fInicioDefecto = "2026-05-01";
    const fFinDefecto = "2026-06-30";

    container.innerHTML = `
      <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32 animate-in fade-in duration-700">
        <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-6 border-b border-white/10 pb-6">
          <div class="text-center lg:text-left">
            <h1 class="orbitron text-4xl font-black text-white italic tracking-tighter leading-none">FINANCE <span class="text-cyan-400">NEXUS</span></h1>
            <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-4">Taller Contable: ${empresaId} // Consolidado de Cuentas PUC</p>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 w-full lg:w-auto">
            ${renderDashCard("Ingresos Totales", "dash-ingresos", "text-emerald-400")}
            ${renderDashCard("Gastos Operativos (Mayo+Junio)", "dash-gastos", "text-red-500")}
            ${renderDashCard("Utilidad Operativa", "dash-utilidad", "text-amber-400")}
          </div>
        </header>

        <div id="puc-summary-bar" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-w-7xl mx-auto mb-8 bg-[#090d13] p-3 rounded-2xl border border-white/5 text-center">
          <div class="p-2"><span class="text-[8px] font-mono text-slate-400 block">PUC 4135 (Ventas)</span><p id="puc-4135" class="text-xs font-bold text-emerald-400">$ 0</p></div>
          <div class="p-2"><span class="text-[8px] font-mono text-slate-400 block">PUC 5195 (Gastos Div)</span><p id="puc-5195" class="text-xs font-bold text-red-400">$ 0</p></div>
          <div class="p-2"><span class="text-[8px] font-mono text-slate-400 block">PUC 5105 (Nómina)</span><p id="puc-5105" class="text-xs font-bold text-orange-400">$ 0</p></div>
          <div class="p-2"><span class="text-[8px] font-mono text-slate-400 block">PUC 1305 (Cartera)</span><p id="puc-1305" class="text-xs font-bold text-cyan-400">$ 0</p></div>
        </div>

        <div class="bg-[#0d1117] p-4 rounded-3xl border border-white/5 mb-8 flex flex-wrap items-center justify-between gap-4 max-w-5xl mx-auto shadow-2xl">
          <div class="flex items-center gap-3">
            <div class="flex flex-col">
              <label class="text-[7px] orbitron text-cyan-400 font-black mb-1">RANGO_INICIO</label>
              <input type="date" id="filtro-fecha-inicio" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 outline-none focus:border-cyan-500" value="${fInicioDefecto}">
            </div>
            <div class="flex flex-col">
              <label class="text-[7px] orbitron text-cyan-400 font-black mb-1">RANGO_FIN</label>
              <input type="date" id="filtro-fecha-fin" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 outline-none focus:border-cyan-500" value="${fFinDefecto}">
            </div>
            <button id="btn-ejecutar-filtro" class="h-9 mt-4 px-4 bg-cyan-600 hover:bg-cyan-400 text-black text-[9px] orbitron font-black rounded-xl transition-all shadow-lg">AUDITAR PERÍODO</button>
          </div>

          <div class="flex gap-2">
            <button id="btn-vista-diario" class="px-5 py-2.5 rounded-full orbitron text-[9px] font-black transition-all">LIBRO DIARIO CRONOLÓGICO</button>
            <button id="btn-vista-puc" class="px-5 py-2.5 rounded-full orbitron text-[9px] font-black transition-all">ESTADOS Y AUDITORÍA</button>
            <button id="btn-exportar" class="px-5 py-2.5 rounded-full orbitron text-[9px] font-black transition-all bg-gradient-to-r from-emerald-600 to-teal-500 text-black font-bold">EXPORTAR XLSX</button>
          </div>
        </div>

        <div id="cont-dynamic-content"></div>
      </div>`;

    setupNavigation();
    document.getElementById("btn-ejecutar-filtro").onclick = () => recalcularMecanicaContable();
    escucharDatos();
  };

  function renderDashCard(label, id, color) {
    return `
      <div class="bg-[#0d1117] p-4 rounded-2xl border border-white/5 text-center shadow-2xl min-w-[160px]">
        <span class="text-[8px] orbitron ${color} block mb-1 uppercase font-black tracking-widest">${label}</span>
        <h2 id="${id}" class="text-lg font-black orbitron ${color}">$ 0</h2>
      </div>`;
  }

  const setupNavigation = () => {
    const btnD = document.getElementById("btn-vista-diario");
    const btnP = document.getElementById("btn-vista-puc");
    const active = "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20";

    btnD.className = `px-5 py-2.5 rounded-full orbitron text-[9px] font-black ${vistaActual === 'DIARIO' ? active : 'text-slate-500 bg-white/5'}`;
    btnP.className = `px-5 py-2.5 rounded-full orbitron text-[9px] font-black ${vistaActual === 'CUENTAS' ? active : 'text-slate-500 bg-white/5'}`;

    btnD.onclick = () => { vistaActual = "DIARIO"; moficarEstructuraVista(); };
    btnP.onclick = () => { vistaActual = "CUENTAS"; moficarEstructuraVista(); };
    document.getElementById("btn-exportar").onclick = exportarExcelSAP;
  };

  const moficarEstructuraVista = () => {
    setupNavigation();
    recalcularMecanicaContable();
  };

  const recalcularMecanicaContable = () => {
    const filtrados = obtenerRegistrosFiltrados();

    let tI = 0, tG = 0, tC = 0;
    let p4135 = 0, p5195 = 0, p5105 = 0, p1305 = 0;

    filtrados.forEach(m => {
      const val = extraerMonto(m);
      const nat = clasificarMovimiento(m);
      const puc = String(m.puc || "").trim();

      if (nat === "INGRESO") tI += val;
      if (nat === "GASTO") tG += val;
      
      if (puc.startsWith("1305")) p1305 += val;
      if (puc.startsWith("4135")) p4135 += val;
      if (puc.startsWith("5195")) p5195 += val;
      if (puc.startsWith("5105")) p5105 += val;
    });

    actualizarDashboards(tI, tG, p1305);

    // Corrección de asignación de variables en la barra PUC fija
    document.getElementById("puc-4135").innerText = `$ ${Math.round(p4135).toLocaleString('es-CO')}`;
    document.getElementById("puc-5195").innerText = `$ ${Math.round(p5195).toLocaleString('es-CO')}`;
    document.getElementById("puc-5105").innerText = `$ ${Math.round(p5105).toLocaleString('es-CO')}`;
    document.getElementById("puc-1305").innerText = `$ ${Math.round(p1305).toLocaleString('es-CO')}`;

    vistaActual === "DIARIO" ? cargarVistaDiaria() : cargarVistaCuentas();
  };

  const cargarVistaDiaria = () => {
    const content = document.getElementById("cont-dynamic-content");
    content.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-7xl mx-auto">
        <div class="lg:col-span-4">
          <div class="bg-[#0d1117] p-6 rounded-[2rem] border border-white/5 sticky top-10 shadow-2xl space-y-4">
            <h3 class="orbitron text-[10px] text-cyan-400 font-black tracking-widest uppercase border-b border-white/10 pb-2">Asiento Manual Real-Time</h3>
            <div class="space-y-4">
              <input id="acc-fecha" type="date" class="w-full bg-black p-3 rounded-xl border border-white/10 text-cyan-400 orbitron text-xs" value="${new Date().toISOString().split('T')[0]}">
              <select id="acc-tipo" class="w-full bg-black p-3 rounded-xl border border-white/10 text-white orbitron text-[10px] uppercase">
                ${CATEGORIAS_CONTABLES.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
              </select>
              <input id="acc-placa" class="w-full bg-black p-3 rounded-xl border border-white/10 text-white uppercase text-center font-black orbitron text-sm" placeholder="PLACA / REFERENCIA">
              <input id="acc-concepto" class="w-full bg-black p-3 rounded-xl border border-white/10 text-white uppercase text-xs" placeholder="DESCRIPCIÓN / CONCEPTO">
              <input id="acc-monto" type="number" class="w-full bg-black p-3 rounded-xl border border-white/10 text-white font-black orbitron text-md" placeholder="VALOR EN PESOS $">
              <button id="btnGuardar" class="w-full bg-emerald-500 text-black font-black orbitron py-3 rounded-xl hover:bg-emerald-400 transition-all text-xs tracking-wider">Inyectar Asiento SAP</button>
            </div>
          </div>
        </div>
        <div class="lg:col-span-8 space-y-4">
          <div id="libroCronologicoPantalla" class="space-y-2 max-h-[85vh] overflow-y-auto pr-2 custom-scroll"></div>
        </div>
      </div>`;

    document.getElementById("btnGuardar").onclick = registrarMovimiento;
    renderizarFlujoCronologico();
  };

  // Renderizado solicitado: Manteniendo el orden estricto por fechas en pantalla
  const renderizarFlujoCronologico = () => {
    const listContainer = document.getElementById("libroCronologicoPantalla");
    if (!listContainer) return;

    const docsFiltrados = obtenerRegistrosFiltrados();

    if (docsFiltrados.length === 0) {
      listContainer.innerHTML = `<div class="p-16 text-center text-slate-500 orbitron text-xs border border-dashed border-white/10 rounded-2xl">LIBRO AUXILIAR SIN REGISTROS EN ESTE RANGO TEMPORAL</div>`;
      return;
    }

    // Ordenar de más reciente a más antiguo en pantalla
    docsFiltrados.sort((a, b) => b.fecha_registro.localeCompare(a.fecha_registro));

    let htmlFinal = `<div class="bg-[#0d1117] p-4 rounded-2xl border border-white/5 space-y-2">
      <h3 class="text-xs font-bold font-mono tracking-wider text-slate-400 mb-3 uppercase">📋 Transacciones en el Rango Seleccionado</h3>`;

    htmlFinal += docsFiltrados.map(m => {
      const val = extraerMonto(m);
      const nat = clasificarMovimiento(m);
      const catObj = CATEGORIAS_CONTABLES.find(c => c.id === m.tipo);
      const esDeb = (nat === "INGRESO" || m.naturaleza === "DEBITO");

      return `
        <div class="bg-black/40 p-3 rounded-xl flex justify-between items-center group hover:bg-black/70 border border-white/0 hover:border-white/5 transition-all">
          <div class="flex items-center gap-3">
            <div class="text-[10px] font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-950 p-2 rounded text-center min-w-[75px]">
              ${m.fecha_registro}
            </div>
            <div>
              <h5 class="text-xs font-bold uppercase text-white tracking-tight">${m.concepto || 'SIN CONCEPTO'}</h5>
              <p class="text-[9px] text-slate-500 uppercase mt-0.5">
                PLACA: <span class="text-slate-300 font-bold">${m.placa || 'ADMIN'}</span> | CUENTA PUC: <span class="text-cyan-500 font-mono">${m.cuenta || catObj?.cuenta || '9999'}</span>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <p class="text-xs font-black orbitron ${esDeb ? 'text-emerald-400' : 'text-red-400'}">
                ${esDeb ? '+' : '-'} $ ${Math.round(val).toLocaleString('es-CO')}
              </p>
            </div>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button onclick="window.nexusEliminarRegistro('${m.id}', '${m.concepto}', '${m.fecha_registro}')" class="h-6 w-6 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-black flex items-center justify-center text-[10px]">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
        </div>`;
    }).join("");

    htmlFinal += `</div>`;
    listContainer.innerHTML = htmlFinal;
  };

  async function registrarMovimiento() {
    const f = document.getElementById("acc-fecha").value;
    if (!f) return Swal.fire("Error SAP", "Estipule una fecha contable válida.", "error");

    if (esPeriodoBloqueado(f)) {
      return Swal.fire({ title: "PERÍODO SELLADO", text: `El mes ${f.substring(0, 7)} ya cuenta con Cierre Contable definitivo.`, icon: "error" });
    }

    const selectedId = document.getElementById("acc-tipo").value;
    const catObj = CATEGORIAS_CONTABLES.find(c => c.id === selectedId);
    const montoRaw = parseFloat(document.getElementById("acc-monto").value);

    if (!document.getElementById("acc-concepto").value.trim() || isNaN(montoRaw)) {
      return Swal.fire("Campos Incompletos", "Por favor complete el concepto y el valor numérico.", "warning");
    }

    const payload = {
      empresaId,
      tipo: selectedId,
      puc: catObj ? catObj.puc : "9999",
      cuenta: catObj ? catObj.cuenta : "999999",
      categoria: catObj ? catObj.tipo : "OTRO",
      naturaleza: catObj ? catObj.naturaleza : "DEBITO",
      placa: document.getElementById("acc-placa").value.trim().toUpperCase() || "ADMIN",
      concepto: document.getElementById("acc-concepto").value.trim().toUpperCase(),
      monto: montoRaw,
      creadoPor: userRole,
      fecha_registro: f,
      creadoEn: Timestamp.fromDate(new Date(f + "T12:00:00"))
    };

    await addDoc(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), payload);
    document.getElementById("acc-concepto").value = "";
    document.getElementById("acc-monto").value = "";
    Swal.fire({ title: "Asiento Sincronizado", icon: "success", toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
  }

  window.nexusEliminarRegistro = async (id, concepto, fechaAct) => {
    if (esPeriodoBloqueado(fechaAct)) {
      return Swal.fire("Acción Denegada", "No se permite alterar periodos bloqueados.", "error");
    }

    const result = await Swal.fire({
      title: '¿ELIMINAR REGISTRO CONTABLE?',
      text: `Asiento: ${concepto}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      background: '#0d1117',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING, id));
        Swal.fire({ title: 'Eliminado', icon: 'success' });
      } catch (err) {
        Swal.fire('Error', 'Falla operativa en la purga del documento.', 'error');
      }
    }
  };

  function escucharDatos() {
    if (unsubscribe) unsubscribe();
    const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));

    unsubscribe = onSnapshot(q, (snap) => {
      registrosGlobales = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      recalcularMecanicaContable();
    });
  }

  function actualizarDashboards(i, g, c) {
    if (document.getElementById("dash-ingresos")) document.getElementById("dash-ingresos").innerText = `$ ${Math.round(i).toLocaleString('es-CO')}`;
    if (document.getElementById("dash-gastos")) document.getElementById("dash-gastos").innerText = `$ ${Math.round(g).toLocaleString('es-CO')}`;
    if (document.getElementById("dash-utilidad")) document.getElementById("dash-utilidad").innerText = `$ ${Math.round(i - g).toLocaleString('es-CO')}`;
  }

  async function cargarVistaCuentas() {
    const content = document.getElementById("cont-dynamic-content");
    const filtrados = obtenerRegistrosFiltrados();

    let stats = { ing: 0, gas: 0, cart: 0 };
    filtrados.forEach(d => {
      const v = extraerMonto(d);
      const n = clasificarMovimiento(d);
      if (n === "INGRESO") stats.ing += v;
      if (n === "GASTO") stats.gas += v;
      if (d.puc === "1305") stats.cart += v;
    });

    content.innerHTML = `
      <div class="bg-[#0d1117] p-8 rounded-[2rem] border border-white/5 text-center max-w-4xl mx-auto">
        <h2 class="orbitron text-lg text-amber-500 mb-6 font-black uppercase tracking-wider">Auditoría Balance General PUC</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div class="p-4 bg-black/40 rounded-xl border border-white/5">
            <span class="text-[8px] orbitron text-emerald-400 font-bold block uppercase">Ingresos Operativos</span>
            <span class="text-md font-bold text-white">$ ${Math.round(stats.ing).toLocaleString('es-CO')}</span>
          </div>
          <div class="p-4 bg-black/40 rounded-xl border border-white/5">
            <span class="text-[8px] orbitron text-red-500 font-bold block uppercase">Gastos Acumulados</span>
            <span class="text-md font-bold text-white">$ ${Math.round(stats.gas).toLocaleString('es-CO')}</span>
          </div>
          <div class="p-4 bg-black/40 rounded-xl border border-white/5">
            <span class="text-[8px] orbitron text-amber-400 font-bold block uppercase">Utilidad Neto</span>
            <span class="text-md font-bold text-white">$ ${Math.round(stats.ing - stats.gas).toLocaleString('es-CO')}</span>
          </div>
        </div>
      </div>`;
  }

  await renderLayout();
}
