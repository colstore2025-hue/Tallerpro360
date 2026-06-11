/**
 * 🏛️ contabilidad.js - NEXUS-X MASTER-CORE V23.6.0 [SAP/HANA BALANCED]
 */
import {
  collection, query, where, orderBy, onSnapshot, serverTimestamp, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG, CATEGORIAS_CONTABLES_MASTER } from "./nexus_constants.js";

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
    container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron">ERROR: SESIÓN DE TALLER NO IDENTIFICADA</div>`;
    return;
  }

  const userRole = localStorage.getItem("nexus_userRole") || "mecanico";
  let vistaActual = "DIARIO";
  let unsubscribe = null;
  let registrosGlobales = [];
  let estadosCierreMes = {};

  const CATEGORIAS_CONTABLES = CATEGORIAS_CONTABLES_MASTER;

  // REGLA DE NATURALEZA SAP: Determina matemáticamente el impacto en base al código PUC
  const clasificarMovimiento = (pucStr) => {
    const p = String(pucStr || "").trim();
    if (p.startsWith("4") || p.startsWith("11") || p.startsWith("28") || p.startsWith("31")) return "INGRESO";
    if (p.startsWith("5") || p.startsWith("6")) return "GASTO";
    return "OTRO";
  };

  // Extracción limpia libre de mutaciones erróneas de tipo de datos
  const extraerDebitoCredito = (m) => {
    let debito = parseFloat(m.debito ?? 0);
    let credito = parseFloat(m.credito ?? 0);
    
    // Fallback de retrocompatibilidad si es un registro viejo
    if (debito === 0 && credito === 0 && m.monto) {
      const nat = clasificarMovimiento(m.puc);
      if (nat === "INGRESO") debito = parseFloat(m.monto);
      else credito = parseFloat(m.monto);
    }
    return { debito: isNaN(debito) ? 0 : debito, credito: isNaN(credito) ? 0 : credito };
  };

  const esPeriodoBloqueado = (fechaString) => {
    if (!fechaString) return false;
    const periodo = fechaString.substring(0, 7); // YYYY-MM
    return !!estadosCierreMes[periodo];
  };

  const cargarEstadosCierre = async () => {
    try {
      const q = query(collection(db, "cierres_mensuales"), where("empresaId", "==", empresaId));
      const snap = await getDocs(q);
      estadosCierreMes = {};
      snap.forEach(doc => {
        const data = doc.data();
        if (data.estado === "CERRADO") estadosCierreMes[data.periodo] = doc.id;
      });
    } catch (e) {
      console.error("❌ CRITICAL SAP ERROR [CIERRE_MAP]:", e);
    }
  };

  const obtenerRegistrosFiltrados = () => {
    const rInicio = document.getElementById("filtro-fecha-inicio")?.value || "2026-05-01";
    const rFin = document.getElementById("filtro-fecha-fin")?.value || "2026-06-10";

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

  const exportarExcelSAP = async () => {
    try {
      Swal.fire({ title: 'Generando Reporte Estilo QUANTUM-SAP...', text: 'Estructurando balances de sumas y saldos...', didOpen: () => Swal.showLoading() });
      const LibXLSX = await cargarMotorExcel();
      const docsFiltrados = obtenerRegistrosFiltrados();

      if (docsFiltrados.length === 0) {
        Swal.close();
        return Swal.fire("Aviso", "No se encontraron registros contables en el rango seleccionado.", "info");
      }

      docsFiltrados.sort((a, b) => a.fecha_registro.localeCompare(b.fecha_registro));

      let totalDebitosGbl = 0;
      let totalCreditosGbl = 0;
      let desgloseSubcuentas = {};

      const filasReporte = docsFiltrados.map(m => {
        const { debito, credito } = extraerDebitoCredito(m);
        const codPUC = String(m.puc || "9999").trim();
        const cuentaContable = String(m.cuentaContable || m.cuenta || codPUC + "05").trim();
        const catObj = CATEGORIAS_CONTABLES.find(c => c.cuenta === cuentaContable || c.puc === codPUC);

        totalDebitosGbl += debito;
        totalCreditosGbl += credito;

        if (!desgloseSubcuentas[cuentaContable]) {
          desgloseSubcuentas[cuentaContable] = { label: catObj?.label || `CUENTA AUXILIAR GENERAL ${cuentaContable}`, debito: 0, credito: 0 };
        }
        desgloseSubcuentas[cuentaContable].debito += debito;
        desgloseSubcuentas[cuentaContable].credito += credito;

        return {
          "FECHA REGISTRO": m.fecha_registro,
          "PERÍODO": m.fecha_registro.substring(0, 7),
          "CÓDIGO PUC": codPUC,
          "CUENTA CONTABLE": cuentaContable,
          "CONCEPTO / DETALLE": (m.concepto || "REGISTRO OPERATIVO").toUpperCase(),
          "PLACA ASOCIADA": (m.placa || "ADMIN").toUpperCase(),
          "DÉBITO (+)": debito,
          "CRÉDITO (-)": credito,
          "ORIGEN / AUDITOR": (m.creadoPor || "SISTEMA").toUpperCase()
        };
      });

      filasReporte.push({});
      filasReporte.push({ "FECHA REGISTRO": "====================", "CONCEPTO / DETALLE": "RESUMEN DE SUB-TOTALES POR CUENTA PUC (HANA-BALANCING)" });
      
      Object.entries(desgloseSubcuentas).forEach(([cta, data]) => {
        filasReporte.push({
          "FECHA REGISTRO": `SUB-TOTAL PUC ${cta}`,
          "CONCEPTO / DETALLE": data.label,
          "DÉBITO (+)": data.debito,
          "CRÉDITO (-)": data.credito
        });
      });

      filasReporte.push({});
      filasReporte.push({
        "FECHA REGISTRO": "TOTALES CONTROL",
        "CONCEPTO / DETALLE": "SUMATORIA ACUMULADA DEL PERIODO EXPORTADO",
        "DÉBITO (+)": totalDebitosGbl,
        "CRÉDITO (-)": totalCreditosGbl
      });

      const utilidadNeta = totalDebitosGbl - totalCreditosGbl;
      filasReporte.push({
        "FECHA REGISTRO": "BALANCE NETO OPERACIONAL",
        "CONCEPTO / DETALLE": "RESULTADO DE EJERCICIO (EBITDA EN ESPEJO)",
        "DÉBITO (+)": utilidadNeta >= 0 ? utilidadNeta : 0,
        "CRÉDITO (-)": utilidadNeta < 0 ? Math.abs(utilidadNeta) : 0
      });

      const ws = LibXLSX.utils.json_to_sheet(filasReporte);
      const wb = LibXLSX.utils.book_new();
      LibXLSX.utils.book_append_sheet(wb, ws, "Libro_Auxiliar_HANA_Sincro");

      ws['!cols'] = [{wch:22}, {wch:10}, {wch:12}, {wch:18}, {wch:45}, {wch:18}, {wch:15}, {wch:15}, {wch:16}];
      LibXLSX.writeFile(wb, `NEXUS_HANA_SAP_REPORT_${empresaId}.xlsx`);
      Swal.close();
    } catch (e) {
      console.error("❌ QUANTUM_EXCEL_ENGINE_FAULT ->", e);
      Swal.fire("Error SAP", "Falla de compilación en las matrices de Excel.", "error");
    }
  };

  const renderLayout = async () => {
    await cargarEstadosCierre();
    const fInicioDefecto = "2026-05-01";
    const fFinDefecto = "2026-06-10";

    container.innerHTML = `
      <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32 animate-in fade-in duration-700">
        <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-6 border-b border-white/10 pb-6">
          <div class="text-center lg:text-left">
            <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter leading-none">FINANCE <span class="text-cyan-400">NEXUS</span></h1>
            <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-4">Taller Contable: ${empresaId} // Motor SAP/HANA Integrado</p>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
            ${renderDashCard("Ingresos Totales", "dash-ingresos", "text-emerald-400")}
            ${renderDashCard("Gastos Operativos", "dash-gastos", "text-red-500")}
            ${renderDashCard("Utilidad Neta", "dash-utilidad", "text-amber-400")}
            ${renderDashCard("Cartera Activa", "dash-pendiente", "text-cyan-400")}
          </div>
        </header>

        <div id="puc-summary-bar" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 max-w-7xl mx-auto mb-8 bg-[#090d13] p-3 rounded-2xl border border-white/5 text-center">
          <div class="p-2"><span class="text-[8px] font-mono text-slate-400 block">PUC 4135 (Ventas)</span><p id="puc-4135" class="text-xs font-bold text-emerald-400">$ 0</p></div>
          <div class="p-2"><span class="text-[8px] font-mono text-slate-400 block">PUC 5105 (Nómina)</span><p id="puc-5105" class="text-xs font-bold text-orange-400">$ 0</p></div>
          <div class="p-2"><span class="text-[8px] font-mono text-slate-400 block">PUC 6135 (Costos)</span><p id="puc-6135" class="text-xs font-bold text-red-400">$ 0</p></div>
          <div class="p-2"><span class="text-[8px] font-mono text-slate-400 block">PUC 5120 (Arriendos)</span><p id="puc-5120" class="text-xs font-bold text-pink-400">$ 0</p></div>
          <div class="p-2"><span class="text-[8px] font-mono text-slate-400 block">PUC 1305 (Cartera)</span><p id="puc-1305" class="text-xs font-bold text-cyan-400">$ 0</p></div>
          <div class="p-2"><span class="text-[8px] font-mono text-slate-400 block">PUC 1105 (Caja Real)</span><p id="puc-1105" class="text-xs font-bold text-yellow-400">$ 0</p></div>
        </div>

        <div class="bg-[#0d1117] p-4 rounded-3xl border border-white/5 mb-8 flex flex-wrap items-center justify-between gap-4 max-w-5xl mx-auto shadow-2xl">
          <div class="flex items-center gap-3">
            <div class="flex flex-col">
              <label class="text-[7px] orbitron text-cyan-400 font-black mb-1">RANGO_INICIO</label>
              <input type="date" id="filtro-fecha-inicio" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 outline-none focus:border-cyan-500 transition-all" value="${fInicioDefecto}">
            </div>
            <div class="flex flex-col">
              <label class="text-[7px] orbitron text-cyan-400 font-black mb-1">RANGO_FIN</label>
              <input type="date" id="filtro-fecha-fin" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 outline-none focus:border-cyan-500 transition-all" value="${fFinDefecto}">
            </div>
            <button id="btn-ejecutar-filtro" class="h-9 mt-4 px-4 bg-cyan-600 hover:bg-cyan-400 text-black text-[9px] orbitron font-black rounded-xl transition-all shadow-lg shadow-cyan-500/10">AUDITAR PERÍODO</button>
          </div>

          <div class="flex gap-2">
            <button id="btn-vista-diario" class="px-5 py-2.5 rounded-full orbitron text-[9px] font-black transition-all">LIBRO DIARIO</button>
            <button id="btn-vista-puc" class="px-5 py-2.5 rounded-full orbitron text-[9px] font-black transition-all">ESTADOS Y AUDITORÍA</button>
            <button id="btn-exportar" class="px-5 py-2.5 rounded-full orbitron text-[9px] font-black transition-all bg-gradient-to-r from-emerald-600 to-teal-500 text-black hover:scale-105 shadow-xl">EXPORTAR XLSX</button>
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
      <div class="bg-[#0d1117] p-5 rounded-3xl border border-white/5 text-center shadow-2xl relative overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-br from-white/0 to-white/[0.02] opacity-0 group-hover:opacity-100 transition-all"></div>
        <span class="text-[8px] orbitron ${color} block mb-1 uppercase font-black tracking-widest">${label}</span>
        <h2 id="${id}" class="text-xl font-black orbitron ${color}">$ 0</h2>
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
    let p4135 = 0, p6135 = 0, p5105 = 0, p5120 = 0, p1305 = 0, p1105 = 0;

    filtrados.forEach(m => {
      const { debito, credito } = extraerDebitoCredito(m);
      const puc = String(m.puc || "").trim();
      const nat = clasificarMovimiento(puc);

      if (nat === "INGRESO") tI += debito;
      if (nat === "GASTO") tG += credito;
      
      if (puc.startsWith("1305")) tC += debito;
      if (puc.startsWith("1105") && m.tipo?.includes("saneamiento")) tC -= debito;

      if (puc.startsWith("4135")) p4135 += debito;
      if (puc.startsWith("6135") || puc.startsWith("5195")) p6135 += credito;
      if (puc.startsWith("5105")) p5105 += credito;
      if (puc.startsWith("5120")) p5120 += credito;
      if (puc.startsWith("1305")) p1305 += debito;
      if (puc.startsWith("1105")) p1105 += (debito - credito);
    });

    actualizarDashboards(tI, tG, tC);

    document.getElementById("puc-4135").innerText = `$ ${Math.round(p4135).toLocaleString('es-CO')}`;
    document.getElementById("puc-5105").innerText = `$ ${Math.round(p5105).toLocaleString('es-CO')}`;
    document.getElementById("puc-6135").innerText = `$ ${Math.round(p6135).toLocaleString('es-CO')}`;
    document.getElementById("puc-5120").innerText = `$ ${Math.round(p5120).toLocaleString('es-CO')}`;
    document.getElementById("puc-1305").innerText = `$ ${Math.round(p1305).toLocaleString('es-CO')}`;
    document.getElementById("puc-1105").innerText = `$ ${Math.round(p1105).toLocaleString('es-CO')}`;

    vistaActual === "DIARIO" ? cargarVistaDiaria() : cargarVistaCuentas();
  };

  const cargarVistaDiaria = () => {
    const content = document.getElementById("cont-dynamic-content");
    content.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-7xl mx-auto">
        <div class="lg:col-span-4">
          <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 sticky top-10 shadow-2xl space-y-4">
            <h3 class="orbitron text-[10px] text-cyan-400 font-black tracking-widest uppercase border-b border-white/10 pb-2">Asiento Partida Doble SAP</h3>
            <div class="space-y-4">
              <input id="acc-fecha" type="date" class="w-full bg-black p-4 rounded-2xl border border-white/10 text-cyan-400 orbitron text-[10px]" value="${new Date().toISOString().split('T')[0]}">
              <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white orbitron text-[10px] uppercase">
                ${CATEGORIAS_CONTABLES.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
              </select>
              <input id="acc-placa" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-center font-black orbitron text-lg focus:border-cyan-500 outline-none" placeholder="PLACA">
              
              <div class="relative w-full">
                <input type="file" id="quantum-camera-input" accept="image/*" capture="camera" class="hidden">
                <button id="btn-activar-vision" type="button" class="w-full bg-gradient-to-r from-cyan-950 via-cyan-800 to-blue-950 text-cyan-400 font-black orbitron py-4 rounded-2xl hover:from-cyan-900 hover:to-blue-900 transition-all uppercase text-[10px] tracking-widest flex justify-center items-center gap-2 border border-cyan-500/30">
                  <span class="animate-pulse text-cyan-400">●</span> ESCANEAR CON AI
                </button>
              </div>

              <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-sm focus:border-cyan-500 outline-none" placeholder="DESCRIPCIÓN / CONCEPTO">
              <input id="acc-monto" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-xl focus:border-cyan-500 outline-none" placeholder="VALOR EN PESOS $">
              <button id="btnGuardar" class="w-full bg-emerald-500 text-black font-black orbitron py-5 rounded-2xl hover:bg-emerald-400 transition-all uppercase tracking-wider text-xs shadow-xl">Inyectar Asiento SAP</button>
            </div>
          </div>
        </div>
        <div class="lg:col-span-8 space-y-8">
          <div class="bg-[#0d1117] p-6 rounded-[2rem] border border-white/5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 class="orbitron font-black text-xs text-amber-400 uppercase tracking-wider">Cierre Mensual & Control Blindado</h4>
              <p class="text-[9px] text-slate-400 mt-1">Sella períodos fiscales para evitar alteraciones extemporáneas.</p>
            </div>
            <button id="btn-ejecutar-cierre-ui" class="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-red-900 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-black orbitron text-[9px] uppercase tracking-wider rounded-xl transition-all shadow-md">
              Gestionar Cierres
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
    if (!f) return Swal.fire("Error SAP", "Estipule una fecha contable válida.", "error");

    if (esPeriodoBloqueado(f)) {
      return Swal.fire({ title: "PERÍODO SELLADO", text: `El mes ${f.substring(0, 7)} está cerrado de forma definitiva.`, icon: "error" });
    }

    const selectedId = document.getElementById("acc-tipo").value;
    const catObj = CATEGORIAS_CONTABLES.find(c => c.id === selectedId);
    const montoRaw = parseFloat(document.getElementById("acc-monto").value);
    const conceptoRaw = document.getElementById("acc-concepto").value.trim().toUpperCase();

    if (!conceptoRaw || isNaN(montoRaw)) {
      return Swal.fire("Datos Inválidos", "Por favor complete Concepto y Valor numérico.", "warning");
    }

    const nat = catObj ? catObj.tipo : "INGRESO";
    const payload = {
      empresaId,
      tipo: selectedId,
      puc: catObj ? catObj.puc : "9999",
      cuentaContable: catObj ? catObj.cuenta : "999999",
      cuenta: catObj ? catObj.cuenta : "999999",
      debito: nat === "INGRESO" ? montoRaw : 0,
      credito: nat === "GASTO" ? montoRaw : 0,
      placa: document.getElementById("acc-placa").value.trim().toUpperCase() || "ADMIN",
      concepto: conceptoRaw,
      creadoPor: userRole,
      fecha_registro: f,
      creadoEn: Timestamp.fromDate(new Date(f + "T12:00:00"))
    };

    await addDoc(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), payload);
    document.getElementById("acc-concepto").value = "";
    document.getElementById("acc-monto").value = "";
    Swal.fire({ title: "Asiento Sincronizado", icon: "success", toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
  }

  const renderizarListaAgrupada = () => {
    const listContainer = document.getElementById("listaFinanzasAgrupada");
    if (!listContainer) return;

    const docsFiltrados = obtenerRegistrosFiltrados();
    if (docsFiltrados.length === 0) {
      listContainer.innerHTML = `<div class="p-16 text-center text-slate-500 orbitron text-xs border border-dashed border-white/10 rounded-[2rem]">LIBRO AUXILIAR SIN REGISTROS</div>`;
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
      let desglosesHTML = {};

      transaccionesDelMes.forEach(m => {
        const { debito, credito } = extraerDebitoCredito(m);
        totalDebitoMes += debito;
        totalCreditoMes += credito;

        const cta = m.cuentaContable || m.cuenta || (m.puc ? m.puc + "05" : "999905");
        const catObj = CATEGORIAS_CONTABLES.find(c => c.cuenta === cta);

        if (!desglosesHTML[cta]) desglosesHTML[cta] = { label: catObj?.label.split(' - ')[1] || "OTROS FLUJOS", total: 0 };
        desglosesHTML[cta].total += (debito > 0 ? debito : credito);
      });

      const esMesCerrado = !!estadosCierreMes[per];

      htmlFinal += `
        <div class="bg-[#0d1117] rounded-[2.5rem] border ${esMesCerrado ? 'border-red-500/20 bg-gradient-to-b from-[#0d1117] to-red-950/10' : 'border-white/5'} p-6 shadow-xl space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-2">
            <div>
              <span class="text-[7px] orbitron bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400">PERÍODO FISCAL</span>
              <h3 class="orbitron text-lg font-black text-white tracking-widest mt-1 uppercase flex items-center gap-2">
                ${traducirPeriodo(per)}
                ${esMesCerrado ? '<span class="text-[8px] bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-mono font-bold">🔒 CERRADO</span>' : '<span class="text-[8px] bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">🔓 ABIERTO</span>'}
              </h3>
            </div>
            <div class="flex gap-4 bg-black/40 p-3 rounded-2xl border border-white/5">
              <div class="text-right">
                <span class="text-[7px] orbitron text-emerald-400 font-bold block uppercase">Débitos</span>
                <span class="text-xs font-black orbitron text-emerald-400">$ ${totalDebitoMes.toLocaleString('es-CO')}</span>
              </div>
              <div class="w-[1px] bg-white/10"></div>
              <div class="text-right">
                <span class="text-[7px] orbitron text-red-400 font-bold block uppercase">Créditos</span>
                <span class="text-xs font-black orbitron text-red-400">$ ${totalCreditoMes.toLocaleString('es-CO')}</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-black/20 p-2 rounded-xl text-[9px] border border-white/5">
            ${Object.entries(desglosesHTML).map(([cuenta, dData]) => `
              <div class="p-1 border-r border-white/5 last:border-none">
                <span class="text-slate-400 block font-mono">CUENTA ${cuenta}:</span>
                <span class="font-bold text-slate-200">$ ${Math.round(dData.total).toLocaleString('es-CO')}</span>
              </div>
            `).join('')}
          </div>

          <div class="space-y-2">
            ${transaccionesDelMes.map(m => {
              const { debito, credito } = extraerDebitoCredito(m);
              const esDeb = debito > 0;
              const valDisplay = esDeb ? debito : credito;

              return `
                <div class="bg-black/30 p-4 rounded-xl flex justify-between items-center group hover:bg-black/60 border border-white/0 hover:border-white/5 transition-all">
                  <div class="flex items-center gap-3">
                    <div class="text-[9px] font-mono text-slate-500 bg-white/5 p-1.5 rounded text-center min-w-[45px]">
                      ${m.fecha_registro.substring(8, 10)} / ${traducirPeriodo(per).substring(0,3)}
                    </div>
                    <div>
                      <h5 class="text-xs font-bold text-slate-200 uppercase">${m.concepto}</h5>
                      <p class="text-[8px] text-slate-500 uppercase orbitron mt-0.5">
                        PLACA: <span class="text-cyan-400 font-black">${m.placa || 'ADMIN'}</span> // CUENTA: <span class="text-slate-400">${m.cuentaContable || m.cuenta || m.puc || '9999'}</span>
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    <div class="text-right">
                      <p class="text-xs font-black orbitron ${esDeb ? 'text-emerald-400' : 'text-red-400'}">
                        ${esDeb ? '+' : '-'} $ ${valDisplay.toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button onclick="window.nexusEditarRegistro('${m.id}', '${m.concepto}', ${valDisplay}, '${m.placa}', '${m.tipo}', '${m.fecha_registro}')" class="h-6 w-6 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center text-[10px]">
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
      return Swal.fire("Bloqueo SAP", "Este asiento pertenece a un período sellado.", "error");
    }

    const { value: formValues } = await Swal.fire({
      title: '🏛 REFORMA DE ASIENTO SAP',
      background: '#0d1117', color: '#fff', confirmButtonColor: '#06b6d4', cancelButtonColor: '#64748b', showCancelButton: true,
      html: `
        <div class="space-y-3 font-sans text-left text-xs p-2">
          <input id="swal-fecha" type="date" class="w-full bg-black p-3 rounded-xl border border-white/10 text-cyan-400 orbitron" value="${fechaAct}">
          <input id="swal-placa" class="w-full bg-black p-3 rounded-xl border border-white/10 text-white uppercase orbitron" value="${placaAct}">
          <input id="swal-concepto" class="w-full bg-black p-3 rounded-xl border border-white/10 text-white uppercase" value="${conceptoAct}">
          <input id="swal-monto" type="number" class="w-full bg-black p-3 rounded-xl border border-white/10 text-white font-bold" value="${montoAct}">
          <select id="swal-tipo" class="w-full bg-black p-3 rounded-xl border border-white/10 text-white text-xs">
            ${CATEGORIAS_CONTABLES.map(c => `<option value="${c.id}" ${c.id === tipoAct ? 'selected' : ''}>${c.label}</option>`).join('')}
          </select>
        </div>`,
      preConfirm: () => {
        const nuevaFecha = document.getElementById('swal-fecha').value;
        const selId = document.getElementById('swal-tipo').value;
        const cObj = CATEGORIAS_CONTABLES.find(c => c.id === selId);
        const valVal = parseFloat(document.getElementById('swal-monto').value);
        const nat = cObj ? cObj.tipo : "INGRESO";

        return {
          fecha_registro: nuevaFecha,
          creadoEn: Timestamp.fromDate(new Date(nuevaFecha + "T12:00:00")),
          placa: document.getElementById('swal-placa').value.trim().toUpperCase(),
          concepto: document.getElementById('swal-concepto').value.trim().toUpperCase(),
          debito: nat === "INGRESO" ? valVal : 0,
          credito: nat === "GASTO" ? valVal : 0,
          tipo: selId,
          puc: cObj ? cObj.puc : "9999",
          cuentaContable: cObj ? cObj.cuenta : "999999",
          cuenta: cObj ? cObj.cuenta : "999999"
        };
      }
    });

    if (formValues) {
      if (esPeriodoBloqueado(formValues.fecha_registro)) return Swal.fire("Error", "Fecha de destino bloqueada.", "error");
      await updateDoc(doc(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING, id), formValues);
      Swal.fire({ title: 'Actualizado', icon: 'success', background: '#0d1117' });
    }
  };

  window.nexusEliminarRegistro = async (id, concepto, fechaAct) => {
    if (esPeriodoBloqueado(fechaAct)) return Swal.fire("Acción Denegada", "Periodo bloqueado.", "error");
    const result = await Swal.fire({ title: '¿ELIMINAR ASiENTO?', text: concepto, icon: 'warning', showCancelButton: true });
    if (result.isConfirmed) {
      await deleteDoc(doc(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING, id));
      Swal.fire({ title: 'Purga Exitosa', icon: 'success' });
    }
  };

  async function gestionarCierreMesModal() {
    const hoy = new Date();
    const periodoSugerido = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

    let htmlPeriodos = `
      <div class="p-2 font-sans text-xs text-left space-y-4">
        <input id="cierre-periodo-input" class="w-full bg-black p-3 rounded-lg border border-white/10 text-white font-bold orbitron text-center uppercase" value="${periodoSugerido}">
        <div class="max-h-[150px] overflow-y-auto space-y-1">
          ${Object.keys(estadosCierreMes).sort().map(p => `
            <div class="flex justify-between items-center bg-red-950/20 border p-2 rounded-lg text-slate-200">
              <span class="orbitron">${p}</span><span>🔒 BLOQUEADO</span>
            </div>
          `).join('')}
        </div>
      </div>`;

    Swal.fire({
      title: '🛰 CONTROLES FISCALES SAP', background: '#0d1117', color: '#fff', html: htmlPeriodos,
      showCancelButton: true, showDenyButton: true, confirmButtonColor: '#ef4444', denyButtonColor: '#06b6d4',
      confirmButtonText: '🔒 SELLAR MES', denyButtonText: '🔓 ABRIR MES'
    }).then(async (result) => {
      const per = document.getElementById("cierre-periodo-input").value.trim();
      if (!/^\d{4}-\d{2}$/.test(per)) return;

      if (result.isConfirmed) {
        await addDoc(collection(db, "cierres_mensuales"), { empresaId, periodo: per, estado: "CERRADO", ejecutadoPor: userRole });
        renderLayout();
      } else if (result.isDenied) {
        const docId = estadosCierreMes[per];
        if (docId) await deleteDoc(doc(db, "cierres_mensuales", docId));
        renderLayout();
      }
    });
  }

  function conectarCapturaCamara() {
    const btnVision = document.getElementById("btn-activar-vision");
    const cameraInput = document.getElementById("quantum-camera-input");
    if (!btnVision || !cameraInput) return;
    btnVision.onclick = () => cameraInput.click();
    cameraInput.onchange = (e) => {
      const archivo = e.target.files[0];
      if (!archivo) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        window.dispatchEvent(new CustomEvent("SOLICITUD_ANALISIS_VISION", { detail: { imagen: reader.result, modulo: "CONTABILIDAD" } }));
      };
      reader.readAsDataURL(archivo);
    };
  }

  function escucharDatos() {
    if (unsubscribe) unsubscribe();
    const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));

    unsubscribe = onSnapshot(q, (snap) => {
      registrosGlobales = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Espejo global unificado para finanzas_elite.js
      const consol = {};
      registrosGlobales.forEach(m => {
        let f = m.fecha_registro || new Date().toISOString().split('T')[0];
        const per = f.substring(0, 7);
        const { debito, credito } = extraerDebitoCredito(m);
        const puc = String(m.puc || "9999").trim();

        if (!consol[per]) consol[per] = { ingresos: 0, gastos: 0, cuentas: {} };
        
        const nat = clasificarMovimiento(puc);
        if (nat === "INGRESO") consol[per].ingresos += debito;
        else consol[per].gastos += credito;

        consol[per].cuentas[puc] = (consol[per].cuentas[puc] || 0) + (debito > 0 ? debito : credito);
      });

      window.NEXUS_ACCOUNTING_CONSOLIDATED = consol;
      recalcularMecanicaContable();
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
    const filtrados = obtenerRegistrosFiltrados();

    let stats = { ing: 0, gas: 0, cart: 0 };
    filtrados.forEach(d => {
      const { debito, credito } = extraerDebitoCredito(d);
      const p = String(d.puc || "").trim();
      if (clasificarMovimiento(p) === "INGRESO") stats.ing += debito;
      else stats.gas += credito;
      if (p === "1305") stats.cart += debito;
    });

    content.innerHTML = `
      <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 text-center max-w-5xl mx-auto">
        <h2 class="orbitron text-2xl text-amber-500 mb-2 font-black">Auditoría Balance General PUC</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-8">
          ${renderStatCard("Flujo Bruto de Ingresos (Clase 4)", stats.ing, "text-emerald-400")}
          ${renderStatCard("Egresos y Costos Totales (Clase 5-6)", stats.gas, "text-red-500")}
          ${renderStatCard("Cartera (Cuenta 1305)", stats.cart, "text-cyan-400")}
          ${renderStatCard("Utilidad del Ejercicio Contable", stats.ing - stats.gas, "text-amber-400")}
        </div>
      </div>`;
  }

  function renderStatCard(title, val, color) {
    return `
      <div class="p-8 bg-black/40 rounded-[2.5rem] border border-white/5">
        <p class="text-[9px] orbitron ${color} mb-2 uppercase font-black">${title}</p>
        <span class="text-3xl font-black font-mono text-white">$ ${Math.round(val).toLocaleString('es-CO')}</span>
      </div>`;
  }

  function traducirPeriodo(pString) {
    const [ano, mes] = pString.split("-");
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return `${meses[parseInt(mes) - 1]} ${ano}`;
  }

  await renderLayout();
}
