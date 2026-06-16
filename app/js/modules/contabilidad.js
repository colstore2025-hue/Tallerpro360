/**
 * 🏛️ TALLERPRO360 - QUANTUM-SAP CONTABLE ENGINE v4.0.0
 * 📜 SCRIPT ID: #NEXUS-X-SAP-LEDGER-2026-V4
 * 
 * Sistema de Libro Diario Avanzado, CRUD Dinámico de Cuentas PUC, 
 * Cierres Blindados y Motor de Exportación con Subtotales Dinámicos.
 * Autor: TallerPRO360 Core & W.J. Urquijo
 * Fecha de Despliegue: Junio 2026
 */

import {
  collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, Timestamp, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../core/firebase-config.js";

// ==========================================
// 🌌 MAESTRO PUC RAÍZ (ESTÁNDAR COLOMBIA)
// ==========================================
const PUC_MAESTRO_BASE = [
  { id: "413505", label: "413505 - Ingresos: Mano de Obra / Servicios", tipo: "INGRESO" },
  { id: "413510", label: "413510 - Ingresos: Venta de Repuestos / Insumos", tipo: "INGRESO" },
  { id: "130505", label: "130505 - Clientes / Cartera por Recaudar", tipo: "INGRESO" },
  { id: "110505", label: "110505 - Caja General / Efectivo", tipo: "INGRESO" },
  { id: "510506", label: "510506 - Gastos: Nómina / Operarios", tipo: "GASTO" },
  { id: "512005", label: "512005 - Gastos: Arrendamientos", tipo: "GASTO" },
  { id: "519505", label: "519505 - Gastos: Diversos (Servicios / Papelería)", tipo: "GASTO" },
  { id: "613505", label: "613505 - Costos: Adquisición de Repuestos", tipo: "GASTO" },
  { id: "999905", label: "999905 - Cuentas de Ajuste / Auditoría Forense", tipo: "GASTO" }
];

// ==========================================
// ⚡ INYECTOR GLOBAL DE COMPONENTES XLSX
// ==========================================
function cargarMotorExcel() {
  return new Promise((resolve) => {
    if (window.XLSX) return resolve(window.XLSX);
    const script = document.createElement('script');
    script.src = "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.full.min.js";
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => { 
      console.error("❌ ERROR CRÍTICO: CDN SheetJS inalcanzable de forma remota."); 
      resolve(null); 
    };
    document.head.appendChild(script);
  });
}

// ==========================================
// 🛡️ CONTROLADOR MAESTRO DE SANITIZACIÓN NEXUS
// ==========================================
const aislarPlacaPura = (textoRaw) => {
  if (!textoRaw) return "ADMIN";
  const base = textoRaw.split('-')[0];
  const limpia = base.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
  return limpia.length === 6 ? limpia : "ADMIN";
};

export default async function contabilidad(container) {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div class="p-10 text-center orbitron text-xs text-cyan-400 animate-pulse tracking-[0.2em]">
        INICIALIZANDO LEDGER CONTABLE QUANTUM-SAP CONTABLE ENGINE v4.0.0...
      </div>
      <div class="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
        <div class="h-full bg-cyan-500 animate-infinite-loading w-1/3 rounded-full"></div>
      </div>
    </div>`;

  const empresaId = (localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId") || "").trim();
  if (!empresaId) {
    container.innerHTML = `
      <div class="p-20 text-center text-red-500 orbitron font-black border border-red-500/20 bg-red-950/10 rounded-2xl m-6">
        🚨 ERROR CRÍTICO SAP: NIT / IDENTIFICADOR DE EMPRESA NO DETECTADO EN LOCALSTORAGE
      </div>`;
    return;
  }

  const userRole = localStorage.getItem("nexus_userRole") || "mecanico";
  let vistaActual = "DIARIO"; 
  let unsubscribeContabilidad = null;
  let unsubscribeCuentas = null;
  
  let registrosGlobales = [];
  let cuentasPucPersonalizadas = [];
  let estadosCierreMes = {};

  // ==========================================
  // 🧭 ASIGNACIÓN DINÁMICA DE NATURALEZA PUC
  // ==========================================
  const clasificarNaturalezaPUC = (pucStr) => {
    const p = String(pucStr || "").trim();
    if (p.startsWith("4") || p.startsWith("11") || p.startsWith("12") || p.startsWith("13")) return "INGRESO";
    if (p.startsWith("5") || p.startsWith("6") || p.startsWith("2") || p.startsWith("9")) return "GASTO";
    return "INGRESO";
  };

  const obtenerLabelCuenta = (pucId) => {
    const encontradaBase = PUC_MAESTRO_BASE.find(c => c.id === pucId);
    if (encontradaBase) return encontradaBase.label;
    const encontradaCust = cuentasPucPersonalizadas.find(c => c.id === pucId);
    return encontradaCust ? `${encontradaCust.id} - ${encontradaCust.label}` : `${pucId} - CUENTA AUXILIAR NO REGISTRADA`;
  };

  const extraerValoresDebitoCredito = (m) => {
    let debito = parseFloat(m.debito ?? 0);
    let credito = parseFloat(m.credito ?? 0);
    if (debito === 0 && credito === 0 && m.monto) {
      if (clasificarNaturalezaPUC(m.puc) === "INGRESO") debito = parseFloat(m.monto);
      else credito = parseFloat(m.monto);
    }
    return { debito: isNaN(debito) ? 0 : debito, credito: isNaN(credito) ? 0 : credito };
  };

  const esPeriodoBloqueado = (fechaString) => {
    if (!fechaString) return false;
    return !!estadosCierreMes[fechaString.substring(0, 7)];
  };

  // ==========================================
  // 📥 SINCRONIZADORES DE DATOS COLD/HOT
  // ==========================================
  const cargarHistoricoCierres = async () => {
    try {
      const q = query(collection(db, "cierres_mensuales"), where("empresaId", "==", empresaId));
      const snap = await getDocs(q);
      estadosCierreMes = {};
      snap.forEach(doc => {
        const d = doc.data();
        if (d.estado === "CERRADO") estadosCierreMes[d.periodo] = doc.id;
      });
    } catch (e) {
      console.error("❌ Error SAP/HANA al recuperar periodos cerrados:", e);
    }
  };

  const obtenerDatosFiltrados = () => {
    const rInicio = document.getElementById("filtro-fecha-inicio")?.value || "2026-05-01";
    const rFin = document.getElementById("filtro-fecha-fin")?.value || "2026-06-30";
    return registrosGlobales.map(m => {
      let f = m.fecha_registro;
      if (!f && m.creadoEn?.toDate) f = m.creadoEn.toDate().toISOString().split('T')[0];
      return { ...m, fecha_registro: f || new Date().toISOString().split('T')[0] };
    }).filter(m => m.fecha_registro >= rInicio && m.fecha_registro <= rFin);
  };

  // ==========================================
  // 📊 MOTOR DE EXPORTACIÓN SAP CON SUBTOTALES
  // ==========================================
  const exportarExcelQuantumSAP = async () => {
    try {
      const LibXLSX = await cargarMotorExcel();
      if (!LibXLSX) return Swal.fire("Error SAP Engine", "Librería SheetJS no pudo ser inicializada.", "error");

      const docs = obtenerDatosFiltrados();
      if (docs.length === 0) return Swal.fire("Libro Diario Vacío", "No existen registros en el rango seleccionado", "info");

      // --- PESTAÑA 1: BALANCE DE COMPROBACIÓN CONSOLIDADO ---
      const resumenPUC = {};
      docs.forEach(m => {
        const { debito, credito } = extraerValoresDebitoCredito(m);
        const cuenta = m.puc || m.cuentaContable || "999999";
        if (!resumenPUC[cuenta]) {
          resumenPUC[cuenta] = { DEBITOS: 0, CREDITOS: 0 };
        }
        resumenPUC[cuenta].DEBITOS += debito;
        resumenPUC[cuenta].CREDITOS += credito;
      });

      const filasBalanceJson = [];
      let totalDebitosGlobal = 0;
      let totalCreditosGlobal = 0;

      Object.entries(resumenPUC).sort(([a], [b]) => a.localeCompare(b)).forEach(([cuenta, valores]) => {
        const neto = valores.DEBITOS - valores.CREDITOS;
        totalDebitosGlobal += valores.DEBITOS;
        totalCreditosGlobal += valores.CREDITOS;

        filasBalanceJson.push({
          "CÓDIGO CUENTA PUC": cuenta,
          "DESCRIPCIÓN CUENTA": obtenerLabelCuenta(cuenta),
          "TOTAL DEBITOS (+)": valores.DEBITOS,
          "TOTAL CRÉDITOS (-)": valores.CREDITOS,
          "SALDO NETO": neto
        });
      });

      // Añadir Fila de Sumas Iguales
      filasBalanceJson.push({
        "CÓDIGO CUENTA PUC": "SUMAS IGUALES",
        "DESCRIPCIÓN CUENTA": "VALIDACIÓN CONSOLIDADA SAP/HANA",
        "TOTAL DEBITOS (+)": totalDebitosGlobal,
        "TOTAL CRÉDITOS (-)": totalCreditosGlobal,
        "SALDO NETO": totalDebitosGlobal - totalCreditosGlobal
      });

      // --- PESTAÑA 2: SÁBANA COMPLETA CON SUBTOTALES POR CUENTA ---
      const docsOrdenados = docs.sort((a, b) => {
        const cComp = (a.puc || "").localeCompare(b.puc || "");
        if (cComp !== 0) return cComp;
        return a.fecha_registro.localeCompare(b.fecha_registro);
      });

      const filasAuxiliarJson = [];
      let cuentaActual = null;
      let subDebito = 0;
      let subCredito = 0;

      const inyectarSubtotalEnMatriz = (cta, deb, cred) => {
        filasAuxiliarJson.push({
          "FECHA REGISTRO": `SUBTOTAL ${cta}`,
          "PERÍODO FISCAL": "",
          "CUENTA CONTABLE PUC": cta,
          "CONCEPTO / DETALLE DE OPERACIÓN": `--- CORTE CONTABLE AUTOMÁTICO ---`,
          "PLACA / CENTRO COSTO": "",
          "DÉBITO (+)": deb,
          "CRÉDITO (-)": cred,
          "AUDITOR / RESPONSABLE": "NEXUS-SAP ENGINE"
        });
      };

      docsOrdenados.forEach((m, index) => {
        const ctaItem = m.puc || "999999";
        const { debito, credito } = extraerValoresDebitoCredito(m);

        if (cuentaActual !== null && cuentaActual !== ctaItem) {
          inyectarSubtotalEnMatriz(cuentaActual, subDebito, subCredito);
          subDebito = 0;
          subCredito = 0;
        }

        cuentaActual = ctaItem;
        subDebito += debito;
        subCredito += credito;

        filasAuxiliarJson.push({
          "FECHA REGISTRO": m.fecha_registro,
          "PERÍODO FISCAL": m.fecha_registro.substring(0, 7),
          "CUENTA CONTABLE PUC": ctaItem,
          "CONCEPTO / DETALLE DE OPERACIÓN": String(m.concepto || "ASIENTO AUXILIAR").toUpperCase(),
          "PLACA / CENTRO COSTO": (m.placa || "ADMIN").toUpperCase(),
          "DÉBITO (+)": debito,
          "CRÉDITO (-)": credito,
          "AUDITOR / RESPONSABLE": (m.creadoPor || "SISTEMA").toUpperCase()
        });

        if (index === docsOrdenados.length - 1) {
          inyectarSubtotalEnMatriz(cuentaActual, subDebito, subCredito);
        }
      });

      // Inyectar Gran Total Final al Libro Auxiliar
      filasAuxiliarJson.push({
        "FECHA REGISTRO": "GRAN TOTAL",
        "PERÍODO FISCAL": "",
        "CUENTA CONTABLE PUC": "GLOBAL",
        "CONCEPTO / DETALLE DE OPERACIÓN": "CIERRE DE BALANCE AUXILIAR GENERADO",
        "PLACA / CENTRO COSTO": "SISTEMA",
        "DÉBITO (+)": totalDebitosGlobal,
        "CRÉDITO (-)": totalCreditosGlobal,
        "AUDITOR / RESPONSABLE": userRole.toUpperCase()
      });

      // Compilación de Libros SheetJS
      const wb = LibXLSX.utils.book_new();
      const wsBalance = LibXLSX.utils.json_to_sheet(filasBalanceJson);
      const wsAuxiliar = LibXLSX.utils.json_to_sheet(filasAuxiliarJson);

      LibXLSX.utils.book_append_sheet(wb, wsBalance, "Balance_Saldos_PUC");
      LibXLSX.utils.book_append_sheet(wb, wsAuxiliar, "Libro_Auxiliar_Detalle");
      
      LibXLSX.writeFile(wb, `TALLERPRO360_QUANTUM_SAP_${empresaId}.xlsx`);
      Swal.fire("Exportación Exitosa", "Estructuras matriciales compiladas con subtotales incorporados.", "success");
    } catch (e) {
      console.error("❌ Error en compilador Excel Quantum SAP:", e);
      Swal.fire("Error de Compilación", "Ocurrió una anomalía procesando las filas del Ledger.", "error");
    }
  };

  // ==========================================
  // 🏢 MAQUETACIÓN E INTERFAZ UI SAP
  // ==========================================
  const renderLayoutBase = async () => {
    await cargarHistoricoCierres();
    container.innerHTML = `
      <div class="p-4 lg:p-8 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32">
        <header class="flex flex-col lg:flex-row justify-between items-center gap-6 mb-6 border-b border-white/10 pb-6">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[9px] rounded font-black tracking-widest orbitron">v4.0.0</span>
              <span class="text-slate-600 font-mono text-[9px]">ID: #NEXUS-X-SAP-LEDGER-2026-V4</span>
            </div>
            <h1 class="orbitron text-4xl font-black text-white tracking-tighter italic mt-1">FINANCE <span class="text-cyan-400">NEXUS-SAP</span></h1>
            <p class="text-[9px] text-slate-400 font-black tracking-[0.3em] orbitron mt-1 font-mono">CORE CUENTAS PUC DINÁMICAS // SISTEMA DE SUB-TABULACIÓN</p>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            ${renderMiniIndicador("INGRESOS TOTALES", "dash-ingresos", "text-emerald-400")}
            ${renderMiniIndicador("GASTOS OPERATIVOS", "dash-gastos", "text-red-400")}
            ${renderMiniIndicador("UTILIDAD NETA", "dash-utilidad", "text-amber-400")}
            ${renderMiniIndicador("CARTERA ACTIVA", "dash-pendiente", "text-cyan-400")}
          </div>
        </header>

        <div class="bg-[#0d1117] p-4 rounded-2xl border border-white/5 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div class="flex items-center gap-2">
            <input type="date" id="filtro-fecha-inicio" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 font-mono" value="2026-05-01">
            <input type="date" id="filtro-fecha-fin" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 font-mono" value="2026-06-30">
            <button id="btn-ejecutar-filtro" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-black text-[10px] orbitron font-black rounded-xl transition-all">AUDITAR PERÍODO</button>
          </div>
          <div class="flex gap-2">
            <button id="btn-vista-diario" class="px-4 py-2 rounded-full orbitron text-[9px] font-black">LIBRO DIARIO</button>
            <button id="btn-vista-puc" class="px-4 py-2 rounded-full orbitron text-[9px] font-black">ESTADOS Y AUDITORÍA</button>
            <button id="btn-exportar" class="px-4 py-2 rounded-full orbitron text-[9px] font-black bg-emerald-500 text-black shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 transition-all">EXPORTAR XLSX</button>
          </div>
        </div>

        <div id="cont-dynamic-content"></div>
      </div>`;

    gestionarEstilosNavegacion();
    document.getElementById("btn-ejecutar-filtro").onclick = procesarEstructurasContables;
    conectarCanalesFirestore();
  };

  function renderMiniIndicador(titulo, id, claseColor) {
    return `
      <div class="bg-[#0d1117] p-3 rounded-xl border border-white/5 text-center min-w-[110px]">
        <span class="text-[8px] orbitron text-slate-400 block uppercase font-black">${titulo}</span>
        <h2 id="${id}" class="text-sm font-black orbitron ${claseColor} mt-1">$ 0</h2>
      </div>`;
  }

  const gestionarEstilosNavegacion = () => {
    const btnD = document.getElementById("btn-vista-diario");
    const btnP = document.getElementById("btn-vista-puc");
    const activo = "bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/10 border border-cyan-400";
    const inactivo = "text-slate-400 bg-white/5 hover:bg-white/10 border border-transparent";

    if (btnD && btnP) {
      btnD.className = `px-4 py-2 rounded-full orbitron text-[9px] transition-all ${vistaActual === 'DIARIO' ? activo : inactivo}`;
      btnP.className = `px-4 py-2 rounded-full orbitron text-[9px] transition-all ${vistaActual === 'ESTADOS' ? activo : inactivo}`;

      btnD.onclick = () => { vistaActual = "DIARIO"; refrescarVistaPorNavegacion(); };
      btnP.onclick = () => { vistaActual = "ESTADOS"; refrescarVistaPorNavegacion(); };
    }
    const btnExp = document.getElementById("btn-exportar");
    if (btnExp) btnExp.onclick = exportarExcelQuantumSAP;
  };

  const refrescarVistaPorNavegacion = () => { 
    gestionarEstilosNavegacion(); 
    procesarEstructurasContables(); 
  };

  const procesarEstructurasContables = () => {
    const filtrados = obtenerDatosFiltrados();
    let totalIngresos = 0, totalGastos = 0, totalCartera = 0;

    filtrados.forEach(m => {
      const { debito, credito } = extraerValoresDebitoCredito(m);
      const nat = clasificarNaturalezaPUC(m.puc);

      if (nat === "INGRESO") totalIngresos += debito;
      if (nat === "GASTO") totalGastos += credito;
      if (String(m.puc).startsWith("1305")) totalCartera += (debito - credito);
    });

    const setValorUI = (id, str) => { const el = document.getElementById(id); if (el) el.innerText = str; };
    setValorUI("dash-ingresos", `$ ${Math.round(totalIngresos).toLocaleString('es-CO')}`);
    setValorUI("dash-gastos", `$ ${Math.round(totalGastos).toLocaleString('es-CO')}`);
    setValorUI("dash-utilidad", `$ ${Math.round(totalIngresos - totalGastos).toLocaleString('es-CO')}`);
    setValorUI("dash-pendiente", `$ ${Math.round(totalCartera).toLocaleString('es-CO')}`);

    vistaActual === "DIARIO" ? renderizarEstructuraLibroDiario() : renderizarVistaBalancesPUC();
  };

  // ==========================================
  // 📝 VISTA 1: LIBRO DIARIO + CREACIÓN DE CUENTAS
  // ==========================================
  const renderizarEstructuraLibroDiario = () => {
    const content = document.getElementById("cont-dynamic-content");
    if (!content) return;
    
    // Combinar el maestro raíz y las subcuentas dinámicas creadas por el usuario
    const listadoCompletoPUC = [...PUC_MAESTRO_BASE];
    cuentasPucPersonalizadas.forEach(c => {
      if (!listadoCompletoPUC.some(p => p.id === c.id)) {
        listadoCompletoPUC.push({ id: c.id, label: `${c.id} - ${c.label}`, tipo: c.tipo });
      }
    });

    // Ordenar numéricamente el selector para pulcritud visual de la auditoría
    listadoCompletoPUC.sort((a, b) => a.id.localeCompare(b.id));

    content.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-4 bg-[#0d1117] p-5 rounded-2xl h-fit border border-white/5 space-y-4 shadow-2xl">
          
          <!-- SECCIÓN: INYECCIÓN DE ASIENTOS -->
          <div class="space-y-3">
            <h3 class="text-xs font-black text-cyan-400 orbitron tracking-widest uppercase flex items-center justify-between">
              <span>ASIENTO MANUAL REAL-TIME</span>
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </h3>
            
            <input id="acc-fecha" type="date" class="w-full bg-black p-3 text-xs rounded-xl border border-white/10 text-white font-mono focus:border-cyan-500 outline-none transition-colors" value="${new Date().toISOString().split('T')[0]}">
            
            <div class="space-y-1">
              <label class="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Seleccionar Cuenta Contable:</label>
              <select id="acc-puc" class="w-full bg-black p-3 text-xs rounded-xl border border-white/10 text-white font-mono focus:border-cyan-500 outline-none transition-colors">
                ${listadoCompletoPUC.map(p => `<option value="${p.id}">${p.label}</option>`).join('')}
              </select>
            </div>

            <div class="flex gap-2 pt-1 pb-2">
              <button id="btn-modal-crear-cuenta" type="button" class="w-full py-1.5 px-3 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-400 rounded-xl text-[10px] orbitron font-black transition-all flex items-center justify-center gap-1.5">
                ➕ CREAR CUENTA PUC HIJA
              </button>
            </div>
            
            <input id="acc-placa" class="w-full bg-black p-3 text-xs rounded-xl border border-white/10 font-bold uppercase text-white font-mono focus:border-cyan-500 outline-none placeholder-slate-600" placeholder="PLACA DE VEHÍCULO O ÁREA">
            <input id="acc-concepto" class="w-full bg-black p-3 text-xs rounded-xl border border-white/10 uppercase text-white focus:border-cyan-500 outline-none placeholder-slate-600" placeholder="DESCRIPCIÓN DEL CONCEPTO">
            <input id="acc-monto" type="number" class="w-full bg-black p-3 text-xs rounded-xl border border-white/10 font-bold text-emerald-400 font-mono focus:border-emerald-500 outline-none placeholder-slate-600" placeholder="VALOR EN PESOS $">
            
            <button id="btnGuardar" class="w-full bg-emerald-500 text-black text-xs py-3 font-bold rounded-xl hover:bg-emerald-400 transition-colors uppercase orbitron tracking-wider shadow-lg shadow-emerald-500/10">INYECTAR ASIENTO SAP</button>
          </div>

          <!-- SECCIÓN: CIERRES MENSUALES PERIÓDICOS -->
          <div class="pt-4 border-t border-white/10">
            <span class="text-[9px] text-slate-500 block mb-2 font-bold orbitron uppercase tracking-wider">CIERRE MENSUAL & CONTROL BLINDADO</span>
            <button id="btn-ejecutar-cierre-ui" class="w-full bg-gradient-to-r from-red-950 to-orange-950 border border-red-500/30 text-white text-[10px] py-3 rounded-xl font-bold uppercase orbitron tracking-wider hover:from-red-900 transition-all flex items-center justify-center gap-2">
              🔒 GESTIONAR CIERRES / REVERSIONES
            </button>
          </div>
        </div>
        
        <div id="listaFinanzasAgrupada" class="lg:col-span-8 space-y-6"></div>
      </div>`;

    document.getElementById("btnGuardar").onclick = ejecutarInyeccionAsiento;
    document.getElementById("btn-ejecutar-cierre-ui").onclick = desplegarCentroControlCierresModal;
    document.getElementById("btn-modal-crear-cuenta").onclick = desplegarModalCreacionCuentaPuc;
    renderizarBloquesMensualesTimeline();
  };

  // ==========================================
  // ⚡ CREACIÓN DINÁMICA DE CUENTAS PERSONALIZADAS
  // ==========================================
  async function desplegarModalCreacionCuentaPuc() {
    const { value: formValues } = await Swal.fire({
      title: '🏛️ CREAR CUENTA PUC SUBSIDIARIA',
      html: `
        <div class="text-left space-y-3 font-sans p-2">
          <p class="text-[10px] text-slate-400 font-mono leading-relaxed bg-cyan-950/20 border border-cyan-500/20 p-2.5 rounded-xl">
            Inyecte subcuentas contables satélites. El sistema deducirá la naturaleza del balance automáticamente analizando el dígito inicial de forma algorítmica.
          </p>
          <div>
            <label class="text-[10px] text-slate-400 block mb-1 font-mono">CÓDIGO DE CUENTA (MÍNIMO 4 DÍGITOS):</label>
            <input id="new-puc-id" type="number" class="w-full bg-slate-900 text-white text-xs p-3 rounded-xl border border-white/10 font-mono focus:border-cyan-500 outline-none" placeholder="Ej: 519510">
          </div>
          <div>
            <label class="text-[10px] text-slate-400 block mb-1 font-mono">NOMBRE / DESCRIPCIÓN DE LA CUENTA:</label>
            <input id="new-puc-label" type="text" class="w-full bg-slate-900 text-white text-xs p-3 rounded-xl border border-white/10 uppercase focus:border-cyan-500 outline-none" placeholder="Ej: GASTOS DE CAFETERÍA INTERNA">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '💾 AGREGAR A MATRIZ',
      cancelButtonText: 'CANCELAR',
      confirmButtonColor: '#00b4d8',
      cancelButtonColor: '#1f2937',
      focusConfirm: false,
      preConfirm: () => {
        const id = document.getElementById('new-puc-id').value.trim();
        const label = document.getElementById('new-puc-label').value.trim().toUpperCase();
        return { id, label };
      }
    });

    if (formValues) {
      if (formValues.id.length < 4 || !formValues.label) {
        return Swal.fire("Estructura Inválida", "La cuenta requiere un código de mínimo 4 dígitos y una descripción clara.", "warning");
      }

      // Validar si existe duplicidad en el maestro nativo
      const existeNativa = PUC_MAESTRO_BASE.some(p => p.id === formValues.id);
      const existeCust = cuentasPucPersonalizadas.some(p => p.id === formValues.id);
      if (existeNativa || existeCust) {
        return Swal.fire("Código Duplicado", "Este código de cuenta ya se encuentra indexado en el ecosistema contable.", "error");
      }

      try {
        const nat = clasificarNaturalezaPUC(formValues.id);
        await addDoc(collection(db, "cuentas_puc_empresa"), {
          empresaId,
          id: formValues.id,
          label: formValues.label,
          tipo: nat,
          creadoEn: new Date()
        });

        Swal.fire("Cuenta Indexada", `La subcuenta ${formValues.id} fue vinculada al ecosistema SAP de forma robusta.`, "success");
        renderizarEstructuraLibroDiario();
      } catch (err) {
        console.error("Error guardando cuenta PUC:", err);
        Swal.fire("Error Estructural", "No se pudo actualizar el diccionario de cuentas en Firestore.", "error");
      }
    }
  }

  // ==========================================
  // 📥 OPERACIÓN: INYECCIÓN DE ASIENTO DIARIO
  // ==========================================
  async function ejecutarInyeccionAsiento() {
    const f = document.getElementById("acc-fecha").value;
    if (esPeriodoBloqueado(f)) return Swal.fire("Período Bloqueado", "Este periodo fiscal está CERRADO y protegido contra alteraciones de auditoría.", "error");

    const cuentaPuc = document.getElementById("acc-puc").value;
    const monto = parseFloat(document.getElementById("acc-monto").value);
    const concepto = document.getElementById("acc-concepto").value.trim().toUpperCase();
    const placaRaw = document.getElementById("acc-placa").value.trim();
    
    // Aplicación estricta del aislamiento de placa Nexus-X Starlink
    const placaFinal = aislarPlacaPura(placaRaw);

    if (!concepto || isNaN(monto) || monto <= 0) {
      return Swal.fire("Datos Incompletos", "Por favor ingrese una descripción conceptual válida y un monto superior a $0.", "warning");
    }

    const nat = clasificarNaturalezaPUC(cuentaPuc);
    
    try {
      await addDoc(collection(db, "contabilidad"), {
        empresaId, 
        puc: cuentaPuc, 
        cuentaContable: cuentaPuc, 
        cuenta: cuentaPuc,
        debito: nat === "INGRESO" ? monto : 0, 
        credito: nat === "GASTO" ? monto : 0,
        placa: placaFinal,
        vehiculo_detalle: placaRaw || "ADMINISTRACIÓN CENTRAL", 
        concepto, 
        creadoPor: userRole,
        fecha_registro: f, 
        creadoEn: Timestamp.fromDate(new Date(f + "T12:00:00"))
      });

      document.getElementById("acc-concepto").value = ""; 
      document.getElementById("acc-monto").value = "";
      document.getElementById("acc-placa").value = "";
      
      Swal.fire("Asiento Inyectado", `Registro debidamente indexado y cruzado bajo la llave de costo [${placaFinal}].`, "success");
    } catch (err) {
      console.error("Error inyectando asiento contable:", err);
      Swal.fire("Falla de Transmisión", "El documento no pudo ser alojado en la base de datos distribuida.", "error");
    }
  }

  // ==========================================
  // 📅 REPRODUCTOR CRONOLÓGICO DE TRANSMISIONES
  // ==========================================
  const renderizarBloquesMensualesTimeline = () => {
    const listContainer = document.getElementById("listaFinanzasAgrupada");
    if (!listContainer) return;

    const docsFiltrados = obtenerDatosFiltrados();
    if (docsFiltrados.length === 0) {
      listContainer.innerHTML = `
        <div class="p-16 border border-dashed border-white/10 rounded-2xl text-center text-slate-500 font-mono text-xs tracking-wider">
          SIN MOVIMIENTOS CONTABLES EN EL RANGO DE AUDITORÍA SELECCIONADO
        </div>`;
      return;
    }

    const bloquesMensuales = {};
    docsFiltrados.forEach(m => {
      const per = m.fecha_registro.substring(0, 7);
      if (!bloquesMensuales[per]) {
        bloquesMensuales[per] = { transacciones: [], ingresosMes: 0, egresosMes: 0 };
      }
      const { debito, credito } = extraerValoresDebitoCredito(m);
      if (clasificarNaturalezaPUC(m.puc) === "INGRESO") bloquesMensuales[per].ingresosMes += debito;
      else bloquesMensuales[per].egresosMes += credito;

      bloquesMensuales[per].transacciones.push(m);
    });

    listContainer.innerHTML = Object.keys(bloquesMensuales).sort().reverse().map(per => {
      const bloque = bloquesMensuales[per];
      const esMesCerrado = !!estadosCierreMes[per];
      const netoMes = bloque.ingresosMes - bloque.egresosMes;

      return `
        <div class="bg-[#0d1117] p-5 rounded-2xl border ${esMesCerrado ? 'border-red-500/30 bg-red-950/5' : 'border-white/5'} shadow-xl space-y-4">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-black/60 p-4 rounded-xl border border-white/5 gap-3">
            <div>
              <span class="font-black text-sm orbitron uppercase text-white flex items-center gap-2">
                📅 PERÍODO FISCAL: ${per} ${esMesCerrado ? '<span class="text-red-500 text-xs font-sans tracking-normal bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">[🔒 CERRADO]</span>' : '<span class="text-emerald-400 text-xs font-sans tracking-normal bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">[🔓 ABIERTO]</span>'}
              </span>
            </div>
            <div class="flex gap-4 text-[11px] font-mono">
              <div><span class="text-slate-500 text-[9px] block uppercase font-sans">Ingresos</span><span class="text-emerald-400 font-bold">+$${Math.round(bloque.ingresosMes).toLocaleString('es-CO')}</span></div>
              <div><span class="text-slate-500 text-[9px] block uppercase font-sans">Egresos</span><span class="text-red-400 font-bold">-$${Math.round(bloque.egresosMes).toLocaleString('es-CO')}</span></div>
              <div><span class="text-slate-500 text-[9px] block uppercase font-sans">Balance</span><span class="${netoMes >= 0 ? 'text-amber-400' : 'text-red-500'} font-bold">$${Math.round(netoMes).toLocaleString('es-CO')}</span></div>
            </div>
          </div>

          <div class="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            ${bloque.transacciones.map(m => {
              const { debito, credito } = extraerValoresDebitoCredito(m);
              const isDeb = debito > 0;
              const valorMonto = isDeb ? debito : credito;
              return `
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-black/30 p-3 text-xs rounded-xl border border-white/5 gap-2 hover:border-cyan-500/20 transition-all">
                  <div class="space-y-1">
                    <div class="flex flex-wrap items-center gap-1.5 text-slate-400 text-[10px] font-mono">
                      <span class="bg-white/5 px-1.5 py-0.5 rounded text-slate-300">${m.fecha_registro}</span>
                      <span class="text-cyan-400 font-bold">${obtenerLabelCuenta(m.puc)}</span>
                    </div>
                    <div class="text-white font-sans uppercase font-medium tracking-wide">
                      ${m.concepto} <i class="text-cyan-400 font-mono text-[11px] not-italic ml-1 bg-cyan-950/30 px-1.5 py-0.2 rounded border border-cyan-500/10">(${m.placa})</i>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                    <span class="${isDeb ? 'text-emerald-400' : 'text-red-400'} font-mono font-black text-sm tracking-tight">
                      ${isDeb ? '➕' : '➖'} $${Math.round(valorMonto).toLocaleString('es-CO')}
                    </span>
                    ${!esMesCerrado ? `
                      <div class="flex gap-1">
                        <button onclick="window.ejecutarCorreccionAsientoCompleto('${m.id}', '${m.fecha_registro}', '${m.puc}', '${m.concepto}', '${m.placa}', ${valorMonto})" class="p-1.5 bg-white/5 hover:bg-cyan-500 hover:text-black rounded-lg text-[11px] transition-all" title="Editar Asiento SAP">✏️</button>
                        <button onclick="window.eliminarAsientoLedger('${m.id}', '${m.fecha_registro}')" class="p-1.5 bg-white/5 hover:bg-red-500 hover:text-white rounded-lg text-[11px] transition-all" title="Revertir Operación">❌</button>
                      </div>
                    ` : ''}
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');
  };

  // ==========================================
  // 🏛️ RECLASIFICACIÓN MODAL ESTRUCTURADA
  // ==========================================
  window.ejecutarCorreccionAsientoCompleto = async (id, fechaAct, pucAct, conceptoAct, placaAct, valorAct) => {
    if (esPeriodoBloqueado(fechaAct)) return Swal.fire("Modificación Denegada", "Este período contable se encuentra sellado por auditoría.", "error");

    const listadoCompletoPUC = [...PUC_MAESTRO_BASE];
    cuentasPucPersonalizadas.forEach(c => {
      if (!listadoCompletoPUC.some(p => p.id === c.id)) {
        listadoCompletoPUC.push({ id: c.id, label: `${c.id} - ${c.label}`, tipo: c.tipo });
      }
    });
    listadoCompletoPUC.sort((a, b) => a.id.localeCompare(b.id));

    const opcionesPUC = listadoCompletoPUC.map(p => 
      `<option value="${p.id}" ${p.id === pucAct ? 'selected' : ''}>${p.label}</option>`
    ).join('');

    const { value: formValues } = await Swal.fire({
      title: '🏛️ RECLASIFICACIÓN DE ASIENTO MASTER',
      html: `
        <div class="text-left space-y-3 font-sans p-2">
          <div>
            <label class="text-[10px] text-slate-400 block mb-1 font-mono">FECHA DE REGISTRO FISCAL:</label>
            <input id="edit-fecha" type="date" class="w-full bg-slate-900 text-white text-xs p-3 rounded-xl border border-white/10 font-mono" value="${fechaAct}">
          </div>
          <div>
            <label class="text-[10px] text-slate-400 block mb-1 font-mono">PLACA CENTRO DE COSTO:</label>
            <input id="edit-placa" class="w-full bg-slate-900 text-white text-xs p-3 rounded-xl border border-white/10 uppercase font-mono" value="${placaAct}">
          </div>
          <div>
            <label class="text-[10px] text-slate-400 block mb-1 font-mono">DESCRIPCIÓN DEL ASIENTO:</label>
            <input id="edit-concepto" class="w-full bg-slate-900 text-white text-xs p-3 rounded-xl border border-white/10 uppercase" value="${conceptoAct}">
          </div>
          <div>
            <label class="text-[10px] text-slate-400 block mb-1 font-mono">VALOR CONTABLE ($):</label>
            <input id="edit-monto" type="number" class="w-full bg-slate-900 text-emerald-400 text-xs p-3 rounded-xl border border-white/10 font-bold font-mono" value="${valorAct}">
          </div>
          <div>
            <label class="text-[10px] text-slate-400 block mb-1 font-mono">ASIGNACIÓN DE ENTRADA PUC:</label>
            <select id="edit-puc" class="w-full bg-slate-900 text-white text-xs p-3 rounded-xl border border-white/10 font-mono">
              ${opcionesPUC}
            </select>
          </div>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'RECLASIFICAR',
      cancelButtonText: 'CANCELAR',
      confirmButtonColor: '#00b4d8',
      cancelButtonColor: '#1f2937',
      preConfirm: () => {
        return {
          fecha: document.getElementById('edit-fecha').value,
          placa: aislarPlacaPura(document.getElementById('edit-placa').value),
          placaOriginal: document.getElementById('edit-placa').value.toUpperCase(),
          concepto: document.getElementById('edit-concepto').value.toUpperCase(),
          monto: parseFloat(document.getElementById('edit-monto').value),
          puc: document.getElementById('edit-puc').value
        };
      }
    });

    if (formValues) {
      if (esPeriodoBloqueado(formValues.fecha)) {
        return Swal.fire("Error SAP", "La nueva fecha fiscal pertenece a un balance mensual cerrado.", "error");
      }
      if (!formValues.concepto || isNaN(formValues.monto) || formValues.monto <= 0) {
        return Swal.fire("Rechazo Estructural", "Datos numéricos o descriptivos incoherentes.", "warning");
      }

      const nat = clasificarNaturalezaPUC(formValues.puc);
      const docRef = doc(db, "contabilidad", id);
      
      try {
        await updateDoc(docRef, {
          fecha_registro: formValues.fecha,
          placa: formValues.placa,
          vehiculo_detalle: formValues.placaOriginal,
          concepto: formValues.concepto,
          puc: formValues.puc,
          cuentaContable: formValues.puc,
          cuenta: formValues.puc,
          debito: nat === "INGRESO" ? formValues.monto : 0,
          credito: nat === "GASTO" ? formValues.monto : 0,
          creadoEn: Timestamp.fromDate(new Date(formValues.fecha + "T12:00:00"))
        });

        Swal.fire("Reclasificación Completa", "Asiento contable redistribuido sin quiebre de consistencia.", "success");
      } catch (err) {
        console.error("Error al actualizar asiento:", err);
        Swal.fire("Error", "No se pudo actualizar el balance.", "error");
      }
    }
  };

  window.eliminarAsientoLedger = async (id, fecha) => {
    if (esPeriodoBloqueado(fecha)) return Swal.fire("Sello de Seguridad", "Acción denegada. El balance mensual se encuentra lacrado.", "error");
    
    const confirm = await Swal.fire({
      title: '¿Revertir Asiento Contable?',
      text: "Esta operación eliminará de forma irreversible el registro del Libro Diario Auxiliar.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'SÍ, REMOVER REGISTRO',
      cancelButtonText: 'ABORTAR'
    });
    
    if (confirm.isConfirmed) {
      try {
        await deleteDoc(doc(db, "contabilidad", id));
        Swal.fire("Reversión Ejecutada", "Registro purgado satisfactoriamente.", "success");
      } catch (err) {
        Swal.fire("Error", "Falla de conectividad con la red Firebase.", "error");
      }
    }
  };

  // ==========================================
  // 🔒 CONTROL DE CIERRES MENSUALES (MODAL SAP)
  // ==========================================
  async function desplegarCentroControlCierresModal() {
    const { value: periodoInput } = await Swal.fire({
      title: '🛰️ CENTRO DE CONTROL DE CIERRES',
      html: `
        <div class="p-2 font-sans text-center space-y-3">
          <p class="text-[11px] text-slate-400">INGRESE EL PERÍODO MENSUAL FISCAL A AUDITAR (YYYY-MM):</p>
          <input id="cierre-periodo" class="text-center font-mono font-bold text-white bg-slate-900 border border-white/10 rounded-xl p-3 text-sm focus:border-cyan-500 outline-none w-48 mx-auto block" placeholder="2026-05" value="2026-05">
          <p class="text-[9px] text-amber-500 uppercase tracking-wider font-bold bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
            ⚠ Al sellar un período, se bloquean las inserciones, ediciones o eliminaciones extemporáneas.
          </p>
        </div>`,
      showCancelButton: true,
      showConfirmButton: true,
      showDenyButton: true,
      confirmButtonText: '🔒 SELLAR BALANCE',
      denyButtonText: '🔓 REABRIR PERÍODO',
      cancelButtonText: 'CANCELAR',
      confirmButtonColor: '#ef4444',
      denyButtonColor: '#00b4d8',
      cancelButtonColor: '#1f2937',
      preConfirm: () => document.getElementById('cierre-periodo').value.trim()
    });

    const inputElement = document.getElementById('cierre-periodo');
    const periodoFinal = inputElement ? inputElement.value.trim() : periodoInput;
    if (!periodoFinal || !/^\d{4}-\d{2}$/.test(periodoFinal)) return;

    // Ejecución Sellar Periodo
    if (Swal.clickConfirm && document.activeElement?.classList.contains('swal2-confirm')) {
      if (estadosCierreMes[periodoFinal]) return Swal.fire("Aviso", "Este período fiscal ya se encuentra sellado.", "info");
      try {
        await addDoc(collection(db, "cierres_mensuales"), { empresaId, periodo: periodoFinal, estado: "CERRADO" });
        Swal.fire("Período Sellado", `Balance del mes de ${periodoFinal} blindado correctamente.`, "success");
        await renderLayoutBase();
      } catch (err) {
        Swal.fire("Error", "No se pudo registrar el cierre.", "error");
      }
    }
  }

  // Listener para la reapertura (Botón Deny)
  document.addEventListener('click', async (e) => {
    if (e.target && e.target.classList.contains('swal2-deny')) {
      const inputEl = document.getElementById('cierre-periodo');
      if (inputEl && /^\d{4}-\d{2}$/.test(inputEl.value)) {
        const per = inputEl.value;
        if (estadosCierreMes[per]) {
          try {
            await deleteDoc(doc(db, "cierres_mensuales", estadosCierreMes[per]));
            Swal.fire("Estatus Reabierto", `El período ${per} ha sido restaurado a modo modificable.`, "success");
            await renderLayoutBase();
          } catch (err) {
            Swal.fire("Error", "Imposible remover el candado en este momento.", "error");
          }
        } else {
          Swal.fire("Sin Cierre Activo", "Este mes no cuenta con un registro de bloqueo.", "info");
        }
      }
    }
  });

  // ==========================================
  // 📊 VISTA 2: BALANCES AGREGADOS POR CUENTA PUC
  // ==========================================
  const renderizarVistaBalancesPUC = () => {
    const content = document.getElementById("cont-dynamic-content");
    if (!content) return;

    const docs = obtenerDatosFiltrados();
    const sumasPUC = {};
    
    docs.forEach(m => {
      const { debito, credito } = extraerValoresDebitoCredito(m);
      const cta = m.puc || m.cuentaContable || "999999";
      if (!sumasPUC[cta]) sumasPUC[cta] = { d: 0, c: 0 };
      sumasPUC[cta].d += debito;
      sumasPUC[cta].c += credito;
    });

    content.innerHTML = `
      <div class="bg-[#0d1117] p-6 rounded-2xl border border-white/5 shadow-2xl max-w-5xl mx-auto space-y-4">
        <h3 class="orbitron text-sm font-black text-cyan-400 uppercase tracking-widest">BALANCES AUXILIARES POR SUB-CUENTA PUC</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-mono">
            <thead>
              <tr class="border-b border-white/10 text-slate-400 uppercase text-[10px]">
                <th class="py-3">CÓDIGO CUENTA</th>
                <th class="py-3">DESCRIPCIÓN DENOMINACIÓN</th>
                <th class="py-3">TOTAL DÉBITOS</th>
                <th class="py-3">TOTAL CRÉDITOS</th>
                <th class="py-3 text-right">SALDO NETO CONTABLE</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              ${Object.entries(sumasPUC).sort(([a],[b])=>a.localeCompare(b)).map(([cta, v]) => {
                const neto = v.d - v.c;
                return `
                  <tr class="hover:bg-white/5 transition-colors">
                    <td class="py-3 text-cyan-400 font-bold">${cta}</td>
                    <td class="py-3 text-slate-300 font-sans text-[11px]">${obtenerLabelCuenta(cta)}</td>
                    <td class="py-3 text-emerald-500">+$${Math.round(v.d).toLocaleString('es-CO')}</td>
                    <td class="py-3 text-red-400">-$${Math.round(v.c).toLocaleString('es-CO')}</td>
                    <td class="py-3 text-right font-black ${neto >= 0 ? 'text-emerald-400' : 'text-red-500'}">$ ${Math.round(neto).toLocaleString('es-CO')}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  };

  // ==========================================
  // 📡 CONEXIÓN CANALIZADA FIRESTORE (REAL-TIME)
  // ==========================================
  function conectarCanalesFirestore() {
    if (unsubscribeContabilidad) unsubscribeContabilidad();
    if (unsubscribeCuentas) unsubscribeCuentas();

    // Canal 1: Libro Auxiliar Diario
    const qContable = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId));
    unsubscribeContabilidad = onSnapshot(qContable, (snap) => {
      registrosGlobales = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      procesarEstructurasContables();
    }, (err) => console.error("Error en flujo de Ledger Contable:", err));

    // Canal 2: Diccionario de Cuentas Contables Creadas Dinámicamente
    const qCuentas = query(collection(db, "cuentas_puc_empresa"), where("empresaId", "==", empresaId));
    unsubscribeCuentas = onSnapshot(qCuentas, (snap) => {
      cuentasPucPersonalizadas = snap.docs.map(d => ({ id: d.data().id, ...d.data() }));
      if (vistaActual === "DIARIO") renderizarEstructuraLibroDiario();
    }, (err) => console.error("Error en flujo de Plan de Cuentas Dinámico:", err));
  }

  // Lanzamiento de Rutinas Iniciales de Compilación
  await renderLayoutBase();
}
