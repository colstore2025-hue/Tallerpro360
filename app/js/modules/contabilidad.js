/**
 * 🏛️ contabilidad.js - TALLERPRO360 NEOMORPHIC SAP/HANA ENGINE
 * Core Contable Avanzado con CRUD de Asientos, Blindaje de Cierres y Mapeo PUC
 */
import {
  collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, Timestamp, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../core/firebase-config.js";
import { CATEGORIAS_CONTABLES_MASTER } from "../core/nexus_constants.js";

function cargarMotorExcel() {
  return new Promise((resolve) => {
    if (window.XLSX) return resolve(window.XLSX);
    const script = document.createElement('script');
    script.src = "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.full.min.js";
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => { console.warn("⚠️ CDN XLSX caido."); resolve(null); };
    document.head.appendChild(script);
  });
}

export default async function contabilidad(container) {
  container.innerHTML = `<div class="p-10 text-center orbitron text-xs text-cyan-400 animate-pulse">CONECTANDO AL NÚCLEO FINANCIERO SAP/HANA...</div>`;

  const empresaId = (localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId") || "").trim();
  if (!empresaId) {
    container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron font-black">ERROR: NIT/EMPRESA NO IDENTIFICADA</div>`;
    return;
  }

  const userRole = localStorage.getItem("nexus_userRole") || "mecanico";
  let vistaActual = "DIARIO"; // DIARIO o ESTADOS
  let unsubscribe = null;
  let registrosGlobales = [];
  let estadosCierreMes = {};

  const clasificarMovimiento = (pucStr) => {
    const p = String(pucStr || "").trim();
    if (p.startsWith("4") || p.startsWith("11") || p.startsWith("28") || p.startsWith("31")) return "INGRESO";
    if (p.startsWith("5") || p.startsWith("6")) return "GASTO";
    return "OTRO";
  };

  const extraerDebitoCredito = (m) => {
    let debito = parseFloat(m.debito ?? 0);
    let credito = parseFloat(m.credito ?? 0);
    if (debito === 0 && credito === 0 && m.monto) {
      if (clasificarMovimiento(m.puc) === "INGRESO") debito = parseFloat(m.monto);
      else credito = parseFloat(m.monto);
    }
    return { debito: isNaN(debito) ? 0 : debito, credito: isNaN(credito) ? 0 : credito };
  };

  const esPeriodoBloqueado = (fechaString) => {
    if (!fechaString) return false;
    return !!estadosCierreMes[fechaString.substring(0, 7)];
  };

  const cargarEstadosCierre = async () => {
    try {
      const q = query(collection(db, "cierres_mensuales"), where("empresaId", "==", empresaId));
      const snap = await getDocs(q);
      estadosCierreMes = {};
      snap.forEach(doc => {
        const d = doc.data();
        if (d.estado === "CERRADO") estadosCierreMes[d.periodo] = doc.id;
      });
    } catch (e) {
      console.error("❌ Error cierres:", e);
    }
  };

  const obtenerRegistrosFiltrados = () => {
    const rInicio = document.getElementById("filtro-fecha-inicio")?.value || "2026-05-01";
    const rFin = document.getElementById("filtro-fecha-fin")?.value || "2026-06-30";
    return registrosGlobales.map(m => {
      let f = m.fecha_registro;
      if (!f && m.creadoEn?.toDate) f = m.creadoEn.toDate().toISOString().split('T')[0];
      return { ...m, fecha_registro: f || new Date().toISOString().split('T')[0] };
    }).filter(m => m.fecha_registro >= rInicio && m.fecha_registro <= rFin);
  };

  const exportarExcelTotalizadoPUC = async () => {
    try {
      const LibXLSX = await cargarMotorExcel();
      if (!LibXLSX) return Swal.fire("Error", "Motor XLSX no disponible", "error");

      const docs = obtenerRegistrosFiltrados();
      if (docs.length === 0) return Swal.fire("Aviso", "No hay datos en el rango", "info");

      // 1. Matriz de Totalización por Cuenta PUC
      const resumenPUC = {};
      docs.forEach(m => {
        const { debito, credito } = extraerDebitoCredito(m);
        const cuenta = m.cuentaContable || m.cuenta || m.puc || "999999";
        if (!resumenPUC[cuenta]) {
          resumenPUC[cuenta] = { DEBITOS: 0, CREDITOS: 0, NETO: 0 };
        }
        resumenPUC[cuenta].DEBITOS += debito;
        resumenPUC[cuenta].CREDITOS += credito;
        resumenPUC[cuenta].NETO += (debito - credito);
      });

      const hojasResumen = Object.entries(resumenPUC).map(([cta, v]) => ({
        "CUENTA CONTABLE PUC": cta,
        "TOTAL DÉBITOS (+)": v.DEBITOS,
        "TOTAL CRÉDITOS (-)": v.CREDITOS,
        "SALDO BALANCE CONSOLIDADO": v.NETO
      }));

      // 2. Libro Auxiliar Desglosado
      const libroAuxiliar = docs.sort((a,b) => a.fecha_registro.localeCompare(b.fecha_registro)).map(m => {
        const { debito, credito } = extraerDebitoCredito(m);
        return {
          "FECHA REGISTRO": m.fecha_registro,
          "PERIODO": m.fecha_registro.substring(0, 7),
          "CUENTA PUC": m.cuentaContable || m.cuenta || m.puc,
          "CONCEPTO / DETALLE": (m.concepto || "ASIENTO MANUAL").toUpperCase(),
          "PLACA": (m.placa || "ADMIN").toUpperCase(),
          "DEBITO (+)": debito,
          "CREDITO (-)": credito,
          "AUDITOR": (m.creadoPor || "SISTEMA").toUpperCase()
        };
      });

      const wb = LibXLSX.utils.book_new();
      const wsResumen = LibXLSX.utils.json_to_sheet(hojasResumen);
      const wsDetalle = LibXLSX.utils.json_to_sheet(libroAuxiliar);

      LibXLSX.utils.book_append_sheet(wb, wsResumen, "Resumen_Cuentas_PUC");
      LibXLSX.utils.book_append_sheet(wb, wsDetalle, "Libro_Auxiliar");
      LibXLSX.writeFile(wb, `NEXUS_SAP_REPORT_${empresaId}.xlsx`);
    } catch (e) {
      console.error(e);
    }
  };

  const renderLayout = async () => {
    await cargarEstadosCierre();
    container.innerHTML = `
      <div class="p-4 lg:p-8 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32">
        <header class="flex flex-col lg:flex-row justify-between items-center gap-6 mb-6 border-b border-white/10 pb-6">
          <div>
            <h1 class="orbitron text-4xl font-black text-white tracking-tighter italic">FINANCE <span class="text-cyan-400">NEXUS</span></h1>
            <p class="text-[9px] text-slate-500 font-black tracking-[0.3em] orbitron mt-1">TALLER CONTABLE // CONSOLIDADO DE CUENTAS PUC</p>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            ${renderCard("INGRESOS TOTALES", "dash-ingresos", "text-emerald-400")}
            ${renderCard("GASTOS OPERATIVOS", "dash-gastos", "text-red-400")}
            ${renderCard("UTILIDAD NETA", "dash-utilidad", "text-amber-400")}
            ${renderCard("CARTERA ACTIVA", "dash-pendiente", "text-cyan-400")}
          </div>
        </header>

        <div class="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6 bg-[#0d1117] p-3 rounded-xl border border-white/5 text-center text-xs font-mono">
          <div><span class="text-[8px] text-slate-400 block">PUC 4135 (Ventas)</span><p id="puc-4135" class="text-emerald-400 font-bold">$ 0</p></div>
          <div><span class="text-[8px] text-slate-400 block">PUC 5105 (Nómina)</span><p id="puc-5105" class="text-orange-400 font-bold">$ 0</p></div>
          <div><span class="text-[8px] text-slate-400 block">PUC 6135 (Costos)</span><p id="puc-6135" class="text-red-400 font-bold">$ 0</p></div>
          <div><span class="text-[8px] text-slate-400 block">PUC 5120 (Arriendos)</span><p id="puc-5120" class="text-pink-400 font-bold">$ 0</p></div>
          <div><span class="text-[8px] text-slate-400 block">PUC 1305 (Cartera)</span><p id="puc-1305" class="text-cyan-400 font-bold">$ 0</p></div>
          <div><span class="text-[8px] text-slate-400 block">PUC 1105 (Caja Real)</span><p id="puc-1105" class="text-yellow-400 font-bold">$ 0</p></div>
        </div>

        <div class="bg-[#0d1117] p-4 rounded-2xl border border-white/5 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div class="flex items-center gap-2">
            <input type="date" id="filtro-fecha-inicio" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10" value="2026-05-01">
            <input type="date" id="filtro-fecha-fin" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10" value="2026-06-30">
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

    setupNavigation();
    document.getElementById("btn-ejecutar-filtro").onclick = recalcularMecanicaContable;
    escucharDatos();
  };

  function renderCard(l, id, c) {
    return `<div class="bg-[#0d1117] p-3 rounded-xl border border-white/5 text-center min-w-[110px]"><span class="text-[8px] orbitron text-slate-400 block uppercase font-black">${l}</span><h2 id="${id}" class="text-sm font-black orbitron ${c}">$ 0</h2></div>`;
  }

  const setupNavigation = () => {
    const btnD = document.getElementById("btn-vista-diario");
    const btnP = document.getElementById("btn-vista-puc");
    const act = "bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/10";
    const inact = "text-slate-400 bg-white/5 hover:bg-white/10";

    btnD.className = `px-4 py-2 rounded-full orbitron text-[9px] ${vistaActual === 'DIARIO' ? act : inact}`;
    btnP.className = `px-4 py-2 rounded-full orbitron text-[9px] ${vistaActual === 'ESTADOS' ? act : inact}`;

    btnD.onclick = () => { vistaActual = "DIARIO"; moficarEstructuraVista(); };
    btnP.onclick = () => { vistaActual = "ESTADOS"; moficarEstructuraVista(); };
    document.getElementById("btn-exportar").onclick = exportarExcelTotalizadoPUC;
  };

  const moficarEstructuraVista = () => { setupNavigation(); recalcularMecanicaContable(); };

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
      if (puc.startsWith("1305")) tC += (debito - credito);

      if (puc.startsWith("4135")) p4135 += debito;
      if (puc.startsWith("6135") || puc.startsWith("5195")) p6135 += credito;
      if (puc.startsWith("5105")) p5105 += credito;
      if (puc.startsWith("5120")) p5120 += credito;
      if (puc.startsWith("1305")) p1305 += debito;
      if (puc.startsWith("1105")) p1105 += (debito - credito);
    });

    const safeSetText = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    safeSetText("dash-ingresos", `$ ${Math.round(tI).toLocaleString('es-CO')}`);
    safeSetText("dash-gastos", `$ ${Math.round(tG).toLocaleString('es-CO')}`);
    safeSetText("dash-utilidad", `$ ${Math.round(tI - tG).toLocaleString('es-CO')}`);
    safeSetText("dash-pendiente", `$ ${Math.round(tC).toLocaleString('es-CO')}`);

    safeSetText("puc-4135", `$ ${Math.round(p4135).toLocaleString('es-CO')}`);
    safeSetText("puc-5105", `$ ${Math.round(p5105).toLocaleString('es-CO')}`);
    safeSetText("puc-6135", `$ ${Math.round(p6135).toLocaleString('es-CO')}`);
    safeSetText("puc-5120", `$ ${Math.round(p5120).toLocaleString('es-CO')}`);
    safeSetText("puc-1305", `$ ${Math.round(p1305).toLocaleString('es-CO')}`);
    safeSetText("puc-1105", `$ ${Math.round(p1105).toLocaleString('es-CO')}`);

    vistaActual === "DIARIO" ? cargarVistaDiaria() : cargarVistaCuentasPUC();
  };

  const cargarVistaDiaria = () => {
    const content = document.getElementById("cont-dynamic-content");
    if (!content) return;
    content.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-4 bg-[#0d1117] p-5 rounded-2xl h-fit border border-white/5 space-y-3">
          <h3 class="text-xs font-black text-cyan-400 orbitron tracking-widest uppercase">ASIENTO MANUAL REAL-TIME</h3>
          <input id="acc-fecha" type="date" class="w-full bg-black p-3 text-xs rounded-xl border border-white/10" value="${new Date().toISOString().split('T')[0]}">
          <select id="acc-tipo" class="w-full bg-black p-3 text-xs rounded-xl border border-white/10">
            ${CATEGORIAS_CONTABLES_MASTER.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
          </select>
          <input id="acc-placa" class="w-full bg-black p-3 text-xs rounded-xl border border-white/10 font-bold uppercase" placeholder="PLACA ASOCIADA">
          <input id="acc-concepto" class="w-full bg-black p-3 text-xs rounded-xl border border-white/10 uppercase" placeholder="DESCRIPCIÓN / CONCEPTO">
          <input id="acc-monto" type="number" class="w-full bg-black p-3 text-xs rounded-xl border border-white/10 font-bold" placeholder="VALOR EN PESOS $">
          <button id="btnGuardar" class="w-full bg-emerald-500 text-black text-xs py-3 font-bold rounded-xl hover:bg-emerald-400 transition-colors uppercase orbitron tracking-wider">INYECTAR ASIENTO SAP</button>
          
          <div class="pt-4 border-t border-white/10">
            <span class="text-[9px] text-slate-500 block mb-2 font-bold orbitron uppercase">CIERRE MENSUAL & CONTROL BLINDADO</span>
            <button id="btn-ejecutar-cierre-ui" class="w-full bg-gradient-to-r from-red-950 to-orange-950 border border-red-500/30 text-white text-[10px] py-3 rounded-xl font-bold uppercase orbitron tracking-wider hover:from-red-900 transition-all">GESTIONAR CIERRES / REVERSIONES</button>
          </div>
        </div>
        <div id="listaFinanzasAgrupada" class="lg:col-span-8 space-y-4"></div>
      </div>`;

    document.getElementById("btnGuardar").onclick = registrarMovimiento;
    document.getElementById("btn-ejecutar-cierre-ui").onclick = gestionarCierreMesModal;
    renderizarListaAgrupada();
  };

  async function registrarMovimiento() {
    const f = document.getElementById("acc-fecha").value;
    if (esPeriodoBloqueado(f)) return Swal.fire("Módulo Sellar", "Este período fiscal está CERRADO y blindado ante auditorías extemporáneas.", "error");

    const selectedId = document.getElementById("acc-tipo").value;
    const catObj = CATEGORIAS_CONTABLES_MASTER.find(c => c.id === selectedId);
    const montoRaw = parseFloat(document.getElementById("acc-monto").value);
    const conceptoRaw = document.getElementById("acc-concepto").value.trim().toUpperCase();
    const placaRaw = document.getElementById("acc-placa").value.trim().toUpperCase() || "ADMIN";

    if (!conceptoRaw || isNaN(montoRaw)) return Swal.fire("Validación SAP", "Por favor complete el concepto y el monto numérico.", "warning");

    const nat = catObj ? catObj.tipo : "INGRESO";
    await addDoc(collection(db, "contabilidad"), {
      empresaId, tipo: selectedId, puc: catObj?.puc || "9999", cuentaContable: catObj?.cuenta || "999999", cuenta: catObj?.cuenta || "999999",
      debito: nat === "INGRESO" ? montoRaw : 0, credito: nat === "GASTO" ? montoRaw : 0,
      placa: placaRaw, concepto: conceptoRaw, creadoPor: userRole,
      fecha_registro: f, creadoEn: Timestamp.fromDate(new Date(f + "T12:00:00"))
    });

    document.getElementById("acc-concepto").value = ""; document.getElementById("acc-monto").value = "";
    Swal.fire("Éxito", "Asiento inyectado correctamente en el Ledger.", "success");
  }

  const renderizarListaAgrupada = () => {
    const listContainer = document.getElementById("listaFinanzasAgrupada");
    if (!listContainer) return;

    const docsFiltrados = obtenerRegistrosFiltrados();
    if (docsFiltrados.length === 0) {
      listContainer.innerHTML = `<div class="p-16 border border-dashed border-white/10 rounded-2xl text-center text-slate-500 font-mono text-xs">SIN MOVIMIENTOS REGISTRADOS EN ESTE INTERVALO</div>`;
      return;
    }

    const mapaPeriodos = {};
    docsFiltrados.forEach(m => {
      const per = m.fecha_registro.substring(0, 7);
      if (!mapaPeriodos[per]) mapaPeriodos[per] = [];
      mapaPeriodos[per].push(m);
    });

    listContainer.innerHTML = Object.keys(mapaPeriodos).sort().map(per => {
      const txs = mapaPeriodos[per];
      const esMesCerrado = !!estadosCierreMes[per];
      return `
        <div class="bg-[#0d1117] p-5 rounded-2xl border ${esMesCerrado ? 'border-red-500/30' : 'border-white/5'}">
          <div class="flex justify-between items-center border-b border-white/10 pb-3 mb-3">
            <span class="font-black text-xs orbitron uppercase flex items-center gap-2">
              📅 PERÍODO FISCAL: ${per} ${esMesCerrado ? '<span class="text-red-500 font-sans">[🔒 CERRADO]</span>' : '<span class="text-emerald-400 font-sans">[🔓 ABIERTO]</span>'}
            </span>
          </div>
          <div class="space-y-2">
            ${txs.map(m => {
              const { debito, credito } = extraerDebitoCredito(m);
              const isDeb = debito > 0;
              return `
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-black/40 p-3 text-xs rounded-xl border border-white/5 gap-2 hover:border-white/10 transition-all">
                  <div>
                    <span class="text-[10px] text-slate-500 font-mono block sm:inline mr-2">[${m.fecha_registro}] [PUC ${m.puc}]</span> 
                    <strong class="text-white">${m.concepto}</strong> <i class="text-cyan-400 font-mono text-[11px]">(${m.placa})</i>
                  </div>
                  <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span class="${isDeb ? 'text-emerald-400' : 'text-red-400'} font-mono font-bold text-sm">
                      ${isDeb ? '+' : '-'} $${(isDeb ? debito : credito).toLocaleString('es-CO')}
                    </span>
                    ${!esMesCerrado ? `
                      <div class="flex gap-1">
                        <button onclick="window.editarAsientoRealTime('${m.id}', '${m.concepto}', ${isDeb ? debito : credito})" class="p-1 bg-white/5 hover:bg-cyan-500 hover:text-black rounded text-[10px] transition-colors">✏️</button>
                        <button onclick="window.eliminarAsientoRealTime('${m.id}', '${m.fecha_registro}')" class="p-1 bg-white/5 hover:bg-red-500 hover:text-white rounded text-[10px] transition-colors">❌</button>
                      </div>
                    ` : ''}
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');
  };

  // Funciones globales CRUD mapeadas a la ventana para ejecución directa de clicks
  window.editarAsientoRealTime = async (id, conceptoPrevio, valorPrevio) => {
    const { value: formValues } = await Swal.fire({
      title: 'Editar Asiento Real-Time',
      html:
        `<input id="swal-concepto" class="swal2-input text-xs" value="${conceptoPrevio}" placeholder="CONCEPTO">` +
        `<input id="swal-monto" type="number" class="swal2-input text-xs" value="${valorPrevio}" placeholder="VALOR">`,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => [document.getElementById('swal-concepto').value.toUpperCase(), parseFloat(document.getElementById('swal-monto').value)]
    });

    if (formValues && formValues[0] && !isNaN(formValues[1])) {
      const docRef = doc(db, "contabilidad", id);
      const snapshot = await getDocs(query(collection(db, "contabilidad")));
      const documentFound = snapshot.docs.find(d => d.id === id);
      if(documentFound){
        const dat = documentFound.data();
        const esIngreso = parseFloat(dat.debito) > 0 || clasificarMovimiento(dat.puc) === "INGRESO";
        await updateDoc(docRef, {
          concepto: formValues[0],
          debito: esIngreso ? formValues[1] : 0,
          credito: !esIngreso ? formValues[1] : 0
        });
        Swal.fire("Modificado", "Asiento contable actualizado.", "success");
      }
    }
  };

  window.eliminarAsientoRealTime = async (id, fecha) => {
    if (esPeriodoBloqueado(fecha)) return Swal.fire("Bloqueado", "No se puede eliminar un asiento de un mes cerrado.", "error");
    const confirm = await Swal.fire({ title: '¿Revertir Asiento?', text: "Esta acción eliminará el registro del ledger contable.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, Eliminar' });
    if (confirm.isConfirmed) {
      await deleteDoc(doc(db, "contabilidad", id));
      Swal.fire("Revertido", "El asiento fue eliminado con éxito.", "success");
    }
  };

  async function gestionarCierreMesModal() {
    const per = prompt("Estipule Período Fiscal a Sellar/Revertir (Formato: YYYY-MM):", "2026-05");
    if (!/^\d{4}-\d{2}$/.test(per)) return Swal.fire("Error", "Formato inválido. Use YYYY-MM", "error");

    if (estadosCierreMes[per]) {
      const confirm = await Swal.fire({ title: '¿Reabrir Periodo?', text: `¿Desea revertir el blindaje del mes ${per}?`, icon: 'warning', showCancelButton: true });
      if (confirm.isConfirmed) {
        await deleteDoc(doc(db, "cierres_mensuales", estadosCierreMes[per]));
        Swal.fire("Abierto", "Período restaurado y editable.", "success");
        await renderLayout();
      }
    } else {
      await addDoc(collection(db, "cierres_mensuales"), { empresaId, periodo: per, estado: "CERRADO" });
      Swal.fire("Sellado", `Período fiscal ${per} blindado correctamente.`, "success");
      await renderLayout();
    }
  }

  const cargarVistaCuentasPUC = () => {
    const content = document.getElementById("cont-dynamic-content");
    if (!content) return;

    const docs = obtenerRegistrosFiltrados();
    const sumasPUC = {};
    docs.forEach(m => {
      const { debito, credito } = extraerDebitoCredito(m);
      const cta = m.cuentaContable || m.cuenta || m.puc || "999999";
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

  function escucharDatos() {
    if (unsubscribe) unsubscribe();
    const q = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId));

    unsubscribe = onSnapshot(q, (snap) => {
      registrosGlobales = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const consol = {};
      registrosGlobales.forEach(m => {
        let f = m.fecha_registro || new Date().toISOString().split('T')[0];
        const per = f.substring(0, 7);
        const { debito, credito } = extraerDebitoCredito(m);
        const puc = String(m.puc || "9999").trim();

        if (!consol[per]) consol[per] = { ingresos: 0, gastos: 0, cuentas: {} };
        if (clasificarMovimiento(puc) === "INGRESO") consol[per].ingresos += debito;
        else consol[per].gastos += credito;
        consol[per].cuentas[puc] = (consol[per].cuentas[puc] || 0) + (debito > 0 ? debito : credito);
      });
      window.NEXUS_ACCOUNTING_CONSOLIDATED = consol;
      recalcularMecanicaContable();
    });
  }

  await renderLayout();
}
