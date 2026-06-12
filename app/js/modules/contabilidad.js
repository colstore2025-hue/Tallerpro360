/**
 * 🏛️ contabilidad.js - TALLERPRO360 QUANTUM-SAP CONTABLE ENGINE
 * Sistema de Libro Diario Avanzado, CRUD Dinámico de Cuentas PUC y Cierres Blindados
 * Autor: TallerPRO360 Core & W.J. Urquijo
 */
import {
  collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, Timestamp, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../core/firebase-config.js";

// Plan Único de Cuentas Estándar (Expandible dinámicamente estilo SIIGO)
const PUC_MAESTRO_DEFAULT = [
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

function cargarMotorExcel() {
  return new Promise((resolve) => {
    if (window.XLSX) return resolve(window.XLSX);
    const script = document.createElement('script');
    script.src = "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.full.min.js";
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => { console.warn("⚠️ CDN XLSX no disponible."); resolve(null); };
    document.head.appendChild(script);
  });
}

export default async function contabilidad(container) {
  container.innerHTML = `<div class="p-10 text-center orbitron text-xs text-cyan-400 animate-pulse">INICIALIZANDO LEDGER CONTABLE QUANTUM-SAP...</div>`;

  const empresaId = (localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId") || "").trim();
  if (!empresaId) {
    container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron font-black">ERROR: NIT/EMPRESA NO DETECTADO</div>`;
    return;
  }

  const userRole = localStorage.getItem("nexus_userRole") || "mecanico";
  let vistaActual = "DIARIO"; 
  let unsubscribe = null;
  let registrosGlobales = [];
  let estadosCierreMes = {};

  // Determina la naturaleza del movimiento según el primer dígito de la cuenta PUC
  const clasificarNaturalezaPUC = (pucStr) => {
    const p = String(pucStr || "").trim();
    if (p.startsWith("4") || p.startsWith("11") || p.startsWith("12") || p.startsWith("13")) return "INGRESO"; // Activos / Ingresos
    if (p.startsWith("5") || p.startsWith("6") || p.startsWith("2") || p.startsWith("9")) return "GASTO";   // Pasivos / Costos / Gastos
    return "INGRESO";
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
      console.error("❌ Error al recuperar periodos de cierre:", e);
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

  const exportarExcelQuantumSAP = async () => {
    try {
      const LibXLSX = await cargarMotorExcel();
      if (!LibXLSX) return Swal.fire("Error", "Librería de exportación no cargada.", "error");

      const docs = obtenerDatosFiltrados();
      if (docs.length === 0) return Swal.fire("Aviso", "No existen registros en el rango seleccionado", "info");

      // PESTAÑA 1: Balance de Comprobación Consolidado por Cuenta PUC
      const resumenPUC = {};
      docs.forEach(m => {
        const { debito, credito } = extraerValoresDebitoCredito(m);
        const cuenta = m.puc || m.cuentaContable || "999999";
        if (!resumenPUC[cuenta]) {
          resumenPUC[cuenta] = { DEBITOS: 0, CREDITOS: 0, BALANCE_NETO: 0 };
        }
        resumenPUC[cuenta].DEBITOS += debito;
        resumenPUC[cuenta].CREDITOS += credito;
        resumenPUC[cuenta].BALANCE_NETO += (debito - credito);
      });

      const hojaBalance = Object.entries(resumenPUC).map(([cuenta, valores]) => ({
        "CÓDIGO CUENTA PUC": cuenta,
        "TOTAL DEBITOS (+)": valores.DEBITOS,
        "TOTAL CRÉDITOS (-)": valores.CREDITOS,
        "SALDO NETO CONSOLIDADO": valores.BALANCE_NETO
      }));

      // PESTAÑA 2: Sábana del Libro Auxiliar Cronológico
      const hojaLibroAuxiliar = docs.sort((a,b) => a.fecha_registro.localeCompare(b.fecha_registro)).map(m => {
        const { debito, credito } = extraerValoresDebitoCredito(m);
        return {
          "FECHA REGISTRO": m.fecha_registro,
          "PERÍODO FISCAL": m.fecha_registro.substring(0, 7),
          "CUENTA CONTABLE PUC": m.puc || m.cuentaContable,
          "CONCEPTO / DETALLE DE OPERACIÓN": (m.concepto || "ASIENTO MANUAL").toUpperCase(),
          "PLACA / CENTRO COSTO": (m.placa || "ADMIN").toUpperCase(),
          "DÉBITO (+)": debito,
          "CRÉDITO (-)": credito,
          "AUDITOR / RESPONSABLE": (m.creadoPor || "SISTEMA").toUpperCase()
        };
      });

      const wb = LibXLSX.utils.book_new();
      const wsBalance = LibXLSX.utils.json_to_sheet(hojaBalance);
      const wsAuxiliar = LibXLSX.utils.json_to_sheet(hojaLibroAuxiliar);

      LibXLSX.utils.book_append_sheet(wb, wsBalance, "Balance_Saldos_PUC");
      LibXLSX.utils.book_append_sheet(wb, wsAuxiliar, "Libro_Auxiliar_Detalle");
      
      LibXLSX.writeFile(wb, `NEXUS_QUANTUM_SAP_${empresaId}.xlsx`);
    } catch (e) {
      console.error("Error al compilar Excel:", e);
    }
  };

  const renderLayoutBase = async () => {
    await cargarHistoricoCierres();
    container.innerHTML = `
      <div class="p-4 lg:p-8 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32">
        <header class="flex flex-col lg:flex-row justify-between items-center gap-6 mb-6 border-b border-white/10 pb-6">
          <div>
            <h1 class="orbitron text-4xl font-black text-white tracking-tighter italic">FINANCE <span class="text-cyan-400">NEXUS</span></h1>
            <p class="text-[9px] text-slate-500 font-black tracking-[0.3em] orbitron mt-1 font-mono">TALLER CONTABLE // CONSOLIDADO DE CUENTAS PUC</p>
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
            <button id="btn-exportar" class="px-4 py-2 rounded-full orbitron text-[9px] font-black bg-emerald-500 text-black">EXPORTAR XLSX</button>
          </div>
        </div>

        <div id="cont-dynamic-content"></div>
      </div>`;

    gestionarEstilosNavegacion();
    document.getElementById("btn-ejecutar-filtro").onclick = procesarEstructurasContables;
    conectarCanalFirestore();
  };

  function renderMiniIndicador(titulo, id, claseColor) {
    return `<div class="bg-[#0d1117] p-3 rounded-xl border border-white/5 text-center min-w-[110px]"><span class="text-[8px] orbitron text-slate-400 block uppercase font-black">${titulo}</span><h2 id="${id}" class="text-sm font-black orbitron ${claseColor}">$ 0</h2></div>`;
  }

  const gestionarEstilosNavegacion = () => {
    const btnD = document.getElementById("btn-vista-diario");
    const btnP = document.getElementById("btn-vista-puc");
    const activo = "bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/10";
    const inactivo = "text-slate-400 bg-white/5 hover:bg-white/10";

    if (btnD && btnP) {
      btnD.className = `px-4 py-2 rounded-full orbitron text-[9px] ${vistaActual === 'DIARIO' ? activo : inactivo}`;
      btnP.className = `px-4 py-2 rounded-full orbitron text-[9px] ${vistaActual === 'ESTADOS' ? activo : inactivo}`;

      btnD.onclick = () => { vistaActual = "DIARIO"; refrescarVistaPorNavegacion(); };
      btnP.onclick = () => { vistaActual = "ESTADOS"; refrescarVistaPorNavegacion(); };
    }
    const btnExp = document.getElementById("btn-exportar");
    if (btnExp) btnExp.onclick = exportarExcelQuantumSAP;
  };

  const refrescarVistaPorNavegacion = () => { gestionarEstilosNavegacion(); procesarEstructurasContables(); };

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

  const renderizarEstructuraLibroDiario = () => {
    const content = document.getElementById("cont-dynamic-content");
    if (!content) return;
    content.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-4 bg-[#0d1117] p-5 rounded-2xl h-fit border border-white/5 space-y-3">
          <h3 class="text-xs font-black text-cyan-400 orbitron tracking-widest uppercase">ASIENTO MANUAL REAL-TIME</h3>
          
          <input id="acc-fecha" type="date" class="w-full bg-black p-3 text-xs rounded-xl border border-white/10 text-white font-mono" value="${new Date().toISOString().split('T')[0]}">
          
          <select id="acc-puc" class="w-full bg-black p-3 text-xs rounded-xl border border-white/10 text-white font-mono">
            ${PUC_MAESTRO_DEFAULT.map(p => `<option value="${p.id}">${p.label}</option>`).join('')}
          </select>
          
          <input id="acc-placa" class="w-full bg-black p-3 text-xs rounded-xl border border-white/10 font-bold uppercase text-white font-mono" placeholder="PLACA O ÁREA">
          <input id="acc-concepto" class="w-full bg-black p-3 text-xs rounded-xl border border-white/10 uppercase text-white" placeholder="DESCRIPCIÓN DEL CONCEPTO">
          <input id="acc-monto" type="number" class="w-full bg-black p-3 text-xs rounded-xl border border-white/10 font-bold text-emerald-400 font-mono" placeholder="VALOR EN PESOS $">
          
          <button id="btnGuardar" class="w-full bg-emerald-500 text-black text-xs py-3 font-bold rounded-xl hover:bg-emerald-400 transition-colors uppercase orbitron tracking-wider">INYECTAR ASIENTO SAP</button>
          
          <div class="pt-4 border-t border-white/10">
            <span class="text-[9px] text-slate-500 block mb-2 font-bold orbitron uppercase">CIERRE MENSUAL & CONTROL BLINDADO</span>
            <button id="btn-ejecutar-cierre-ui" class="w-full bg-gradient-to-r from-red-950 to-orange-950 border border-red-500/30 text-white text-[10px] py-3 rounded-xl font-bold uppercase orbitron tracking-wider hover:from-red-900 transition-all flex items-center justify-center gap-2">
              🔒 GESTIONAR CIERRES / REVERSIONES
            </button>
          </div>
        </div>
        
        <div id="listaFinanzasAgrupada" class="lg:col-span-8 space-y-6"></div>
      </div>`;

    document.getElementById("btnGuardar").onclick = ejecutarInyeccionAsiento;
    document.getElementById("btn-ejecutar-cierre-ui").onclick = desplegarCentroControlCierresModal;
    renderizarBloquesMensualesTimeline();
  };

  async function ejecutarInyeccionAsiento() {
    const f = document.getElementById("acc-fecha").value;
    if (esPeriodoBloqueado(f)) return Swal.fire("Período Bloqueado", "Este periodo fiscal está CERRADO y protegido contra alteraciones.", "error");

    const cuentaPuc = document.getElementById("acc-puc").value;
    const monto = parseFloat(document.getElementById("acc-monto").value);
    const concepto = document.getElementById("acc-concepto").value.trim().toUpperCase();
    const placa = document.getElementById("acc-placa").value.trim().toUpperCase() || "ADMIN";

    if (!concepto || isNaN(monto)) return Swal.fire("Datos Incompletos", "Por favor complete el concepto y el monto.", "warning");

    const nat = clasificarNaturalezaPUC(cuentaPuc);
    await addDoc(collection(db, "contabilidad"), {
      empresaId, 
      puc: cuentaPuc, 
      cuentaContable: cuentaPuc, 
      cuenta: cuentaPuc,
      debito: nat === "INGRESO" ? monto : 0, 
      credito: nat === "GASTO" ? monto : 0,
      placa, 
      concepto, 
      creadoPor: userRole,
      fecha_registro: f, 
      creadoEn: Timestamp.fromDate(new Date(f + "T12:00:00"))
    });

    document.getElementById("acc-concepto").value = ""; 
    document.getElementById("acc-monto").value = "";
    Swal.fire("Inyección Exitosa", "Registro indexado en el Libro Auxiliar.", "success");
  }

  const renderizarBloquesMensualesTimeline = () => {
    const listContainer = document.getElementById("listaFinanzasAgrupada");
    if (!listContainer) return;

    const docsFiltrados = obtenerDatosFiltrados();
    if (docsFiltrados.length === 0) {
      listContainer.innerHTML = `<div class="p-16 border border-dashed border-white/10 rounded-2xl text-center text-slate-500 font-mono text-xs">SIN MOVIMIENTOS EN EL PERÍODO SELECCIONADO</div>`;
      return;
    }

    // Agrupación y totalización limpia por mes
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
        <div class="bg-[#0d1117] p-5 rounded-2xl border ${esMesCerrado ? 'border-red-500/30' : 'border-white/5'} shadow-xl">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-black/60 p-4 rounded-xl border border-white/5 gap-3 mb-4">
            <div>
              <span class="font-black text-sm orbitron uppercase text-white flex items-center gap-2">
                📅 PERÍODO FISCAL: ${per} ${esMesCerrado ? '<span class="text-red-500 text-xs font-sans">[🔒 CERRADO]</span>' : '<span class="text-emerald-400 text-xs font-sans">[🔓 ABIERTO]</span>'}
              </span>
            </div>
            <div class="flex gap-4 text-[11px] font-mono">
              <div><span class="text-slate-400 text-[9px] block uppercase">Ingresos Mes</span><span class="text-emerald-400 font-bold">+$${Math.round(bloque.ingresosMes).toLocaleString('es-CO')}</span></div>
              <div><span class="text-slate-400 text-[9px] block uppercase">Egresos Mes</span><span class="text-red-400 font-bold">-$${Math.round(bloque.egresosMes).toLocaleString('es-CO')}</span></div>
              <div><span class="text-slate-400 text-[9px] block uppercase">Balance Neto</span><span class="${netoMes >= 0 ? 'text-amber-400' : 'text-red-500'} font-bold">$${Math.round(netoMes).toLocaleString('es-CO')}</span></div>
            </div>
          </div>

          <div class="space-y-2">
            ${bloque.transacciones.map(m => {
              const { debito, credito } = extraerValoresDebitoCredito(m);
              const isDeb = debito > 0;
              const valorMonto = isDeb ? debito : credito;
              return `
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-black/30 p-3 text-xs rounded-xl border border-white/5 gap-2 hover:border-cyan-500/20 transition-all">
                  <div>
                    <span class="text-[10px] text-slate-500 font-mono block sm:inline mr-2">[${m.fecha_registro}] [PUC ${m.puc}]</span> 
                    <strong class="text-white font-sans uppercase">${m.concepto}</strong> <i class="text-cyan-400 font-mono text-[11px]">(${m.placa})</i>
                  </div>
                  <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span class="${isDeb ? 'text-emerald-400' : 'text-red-400'} font-mono font-bold text-sm">
                      ${isDeb ? '+' : '-'} $${Math.round(valorMonto).toLocaleString('es-CO')}
                    </span>
                    ${!esMesCerrado ? `
                      <div class="flex gap-1">
                        <button onclick="window.ejecutarCorreccionAsientoCompleto('${m.id}', '${m.fecha_registro}', '${m.puc}', '${m.concepto}', '${m.placa}', ${valorMonto})" class="p-1.5 bg-white/5 hover:bg-cyan-500 hover:text-black rounded text-[11px] transition-colors" title="Editar Asiento">✏️</button>
                        <button onclick="window.eliminarAsientoLedger('${m.id}', '${m.fecha_registro}')" class="p-1.5 bg-white/5 hover:bg-red-500 hover:text-white rounded text-[11px] transition-colors" title="Revertir Asiento">❌</button>
                      </div>
                    ` : ''}
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');
  };

  // 🏛️ MODAL COMPLETO DE CORRECCIÓN DE ASIENTO (Mismo diseño de tu captura)
  window.ejecutarCorreccionAsientoCompleto = async (id, fechaAct, pucAct, conceptoAct, placaAct, valorAct) => {
    if (esPeriodoBloqueado(fechaAct)) return Swal.fire("Bloqueado", "Este período contable se encuentra cerrado.", "error");

    const opcionesPUC = PUC_MAESTRO_DEFAULT.map(p => 
      `<option value="${p.id}" ${p.id === pucAct ? 'selected' : ''}>${p.label}</option>`
    ).join('');

    const { value: formValues } = await Swal.fire({
      title: '🏛️ CORRECCIÓN DE ASIENTO',
      html: `
        <div class="text-left space-y-3 font-sans p-2">
          <div>
            <label class="text-[10px] text-slate-400 block mb-1 font-mono">FECHA REGISTRO:</label>
            <input id="edit-fecha" type="date" class="w-full bg-slate-900 text-white text-xs p-3 rounded-xl border border-white/10 font-mono" value="${fechaAct}">
          </div>
          <div>
            <label class="text-[10px] text-slate-400 block mb-1 font-mono">PLACA Ó ÁREA:</label>
            <input id="edit-placa" class="w-full bg-slate-900 text-white text-xs p-3 rounded-xl border border-white/10 uppercase font-mono" value="${placaAct}">
          </div>
          <div>
            <label class="text-[10px] text-slate-400 block mb-1 font-mono">DESCRIPCIÓN DEL CONCEPTO:</label>
            <input id="edit-concepto" class="w-full bg-slate-900 text-white text-xs p-3 rounded-xl border border-white/10 uppercase" value="${conceptoAct}">
          </div>
          <div>
            <label class="text-[10px] text-slate-400 block mb-1 font-mono">VALOR CONTABLE ($):</label>
            <input id="edit-monto" type="number" class="w-full bg-slate-900 text-emerald-400 text-xs p-3 rounded-xl border border-white/10 font-bold font-mono" value="${valorAct}">
          </div>
          <div>
            <label class="text-[10px] text-slate-400 block mb-1 font-mono">CUENTA PUC (NEXUS-SAP):</label>
            <select id="edit-puc" class="w-full bg-slate-900 text-white text-xs p-3 rounded-xl border border-white/10 font-mono">
              ${opcionesPUC}
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#00b4d8',
      cancelButtonColor: '#ef4444',
      preConfirm: () => {
        return {
          fecha: document.getElementById('edit-fecha').value,
          placa: document.getElementById('edit-placa').value.toUpperCase(),
          concepto: document.getElementById('edit-concepto').value.toUpperCase(),
          monto: parseFloat(document.getElementById('edit-monto').value),
          puc: document.getElementById('edit-puc').value
        };
      }
    });

    if (formValues) {
      if (esPeriodoBloqueado(formValues.fecha)) {
        return Swal.fire("Error", "La nueva fecha seleccionada pertenece a un período cerrado.", "error");
      }
      if (!formValues.concepto || isNaN(formValues.monto)) {
        return Swal.fire("Campos Vacíos", "Modificación rechazada por falta de datos numéricos.", "warning");
      }

      const nat = clasificarNaturalezaPUC(formValues.puc);
      const docRef = doc(db, "contabilidad", id);
      
      await updateDoc(docRef, {
        fecha_registro: formValues.fecha,
        placa: formValues.placa,
        concepto: formValues.concepto,
        puc: formValues.puc,
        cuentaContable: formValues.puc,
        cuenta: formValues.puc,
        debito: nat === "INGRESO" ? formValues.monto : 0,
        credito: nat === "GASTO" ? formValues.monto : 0,
        creadoEn: Timestamp.fromDate(new Date(formValues.fecha + "T12:00:00"))
      });

      Swal.fire("Éxito", "Asiento contable reclasificado de forma robusta.", "success");
    }
  };

  window.eliminarAsientoLedger = async (id, fecha) => {
    if (esPeriodoBloqueado(fecha)) return Swal.fire("Bloqueado", "Acción denegada. El balance mensual está sellado.", "error");
    
    const confirm = await Swal.fire({
      title: '¿Revertir Asiento?',
      text: "Se eliminará el registro de forma permanente del Libro Auxiliar.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, Revertir'
    });
    
    if (confirm.isConfirmed) {
      await deleteDoc(doc(db, "contabilidad", id));
      Swal.fire("Eliminado", "Asiento removido del Ledger.", "success");
    }
  };

  // 🔒 CENTRO DE CONTROL DE CIERRES (Reflejo de tu ventana modal original)
  async function desplegarCentroControlCierresModal() {
    const { value: periodoInput } = await Swal.fire({
      title: '🛰️ CENTRO DE CONTROL DE CIERRES',
      html: `
        <div class="p-2 font-sans">
          <p class="text-[11px] text-slate-400 mb-2">ESCRIBIR PERÍODO A GESTIONAR (YYYY-MM):</p>
          <input id="cierre-periodo" class="swal2-input text-center font-mono font-bold text-white bg-slate-900 rounded-xl" placeholder="2026-05" value="2026-05">
          <p class="text-[9px] text-amber-500 mt-3 uppercase tracking-wider font-bold">Estatus de Períodos Mapeados: Bloqueo de Modificaciones Extemporáneas</p>
        </div>
      `,
      showCancelButton: true,
      showConfirmButton: true,
      showDenyButton: true,
      confirmButtonText: '🔒 SÉLLAR PERÍODO',
      denyButtonText: '🔓 REVERTIR CIERRE',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      denyButtonColor: '#00b4d8',
      preConfirm: () => document.getElementById('cierre-periodo').value.trim()
    });

    // Validar el periodo capturado si no se canceló el modal
    const inputElement = document.getElementById('cierre-periodo');
    const periodoFinal = inputElement ? inputElement.value.trim() : periodoInput;
    if (!periodoFinal || !/^\d{4}-\d{2}$/.test(periodoFinal)) return;

    // Lógica al dar click en SÉLLAR PERÍODO
    if (Swal.clickConfirm) {
      if (estadosCierreMes[periodoFinal]) return Swal.fire("Aviso", "Este mes ya está sellado.", "info");
      await addDoc(collection(db, "cierres_mensuales"), { empresaId, periodo: periodoFinal, estado: "CERRADO" });
      Swal.fire("Sellado", `Período ${periodoFinal} blindado correctamente.`, "success");
      await renderLayoutBase();
    }
  }

  // Escuchar variaciones en el botón Deny (Revertir Cierre) desde el contexto del modal anterior
  document.addEventListener('click', async (e) => {
    if (e.target && e.target.classList.contains('swal2-deny')) {
      const inputEl = document.getElementById('cierre-periodo');
      if (inputEl && /^\d{4}-\d{2}$/.test(inputEl.value)) {
        const per = inputEl.value;
        if (estadosCierreMes[per]) {
          await deleteDoc(doc(db, "cierres_mensuales", estadosCierreMes[per]));
          Swal.fire("Reabierto", `Período ${per} restaurado y editable.`, "success");
          await renderLayoutBase();
        } else {
          Swal.fire("Inexistente", "Este período no cuenta con un cierre activo.", "info");
        }
      }
    }
  });

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
      <div class="bg-[#0d1117] p-6 rounded-2xl border border-white/5 shadow-2xl max-w-5xl mx-auto">
        <h3 class="orbitron text-sm font-black text-cyan-400 mb-4 uppercase tracking-widest">BALANCES AUXILIARES POR SUB-CUENTA PUC</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-mono">
            <thead>
              <tr class="border-b border-white/10 text-slate-400 uppercase text-[10px]">
                <th class="py-3">CÓDIGO CUENTA</th>
                <th class="py-3">TOTAL DÉBITOS</th>
                <th class="py-3">TOTAL CRÉDITOS</th>
                <th class="py-3 text-right">SALDO NETO</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              ${Object.entries(sumasPUC).map(([cta, v]) => {
                const neto = v.d - v.c;
                return `
                  <tr class="hover:bg-white/5 transition-colors">
                    <td class="py-3 text-white font-bold">${cta}</td>
                    <td class="py-3 text-emerald-500">$ ${Math.round(v.d).toLocaleString('es-CO')}</td>
                    <td class="py-3 text-red-400">$ ${Math.round(v.c).toLocaleString('es-CO')}</td>
                    <td class="py-3 text-right font-black ${neto >= 0 ? 'text-emerald-400' : 'text-red-400'}">$ ${Math.round(neto).toLocaleString('es-CO')}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  };

  function conectarCanalFirestore() {
    if (unsubscribe) unsubscribe();
    const q = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId));

    unsubscribe = onSnapshot(q, (snap) => {
      registrosGlobales = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const consol = {};
      registrosGlobales.forEach(m => {
        let f = m.fecha_registro || new Date().toISOString().split('T')[0];
        const per = f.substring(0, 7);
        const { debito, credito } = extraerValoresDebitoCredito(m);
        const puc = String(m.puc || "9999").trim();

        if (!consol[per]) consol[per] = { ingresos: 0, gastos: 0, cuentas: {} };
        if (clasificarNaturalezaPUC(puc) === "INGRESO") consol[per].ingresos += debito;
        else consol[per].gastos += credito;
        consol[per].cuentas[puc] = (consol[per].cuentas[puc] || 0) + (debito > 0 ? debito : credito);
      });
      
      window.NEXUS_ACCOUNTING_CONSOLIDATED = consol;
      procesarEstructurasContables();
    });
  }

  await renderLayoutBase();
}
