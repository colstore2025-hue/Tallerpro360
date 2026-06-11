/**
 * 🏛️ contabilidad.js - NEXUS-X MASTER-CORE V23.6.2
 * Calibrado para rutas en app/js/core/
 */
import {
  collection, query, where, onSnapshot, addDoc, getDocs, doc, deleteDoc, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Decisión: Importaciones limpias desde el directorio Core un nivel arriba (../core/)
import { db } from "../core/firebase-config.js";
import { CATEGORIAS_CONTABLES_MASTER } from "../core/nexus_constants.js";

function cargarMotorExcel() {
  return new Promise((resolve) => {
    if (window.XLSX) return resolve(window.XLSX);
    const script = document.createElement('script');
    script.src = "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.full.min.js";
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => {
      console.warn("⚠️ Servidor CDN XLSX no disponible.");
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

export default async function contabilidad(container) {
  container.innerHTML = `<div class="p-10 text-center orbitron text-xs text-slate-400 animate-pulse">INICIALIZANDO MOTOR CONTABLE SAP...</div>`;

  const empresaId = (localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId") || "").trim();
  if (!empresaId) {
    container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron font-black">ERROR: SESIÓN DE TALLER NO IDENTIFICADA EN LOCALSTORAGE</div>`;
    return;
  }

  const userRole = localStorage.getItem("nexus_userRole") || "mecanico";
  let vistaActual = "DIARIO";
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
      const nat = clasificarMovimiento(m.puc);
      if (nat === "INGRESO") debito = parseFloat(m.monto);
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
        const data = doc.data();
        if (data.estado === "CERRADO") estadosCierreMes[data.periodo] = doc.id;
      });
    } catch (e) {
      console.error("❌ ERROR MAPEO CIERRES:", e);
    }
  };

  const obtenerRegistrosFiltrados = () => {
    const rInicio = document.getElementById("filtro-fecha-inicio")?.value || "2026-05-01";
    const rFin = document.getElementById("filtro-fecha-fin")?.value || "2026-06-10";

    return registrosGlobales.map(m => {
      let f = m.fecha_registro;
      if (!f && m.creadoEn?.toDate) f = m.creadoEn.toDate().toISOString().split('T')[0];
      return { ...m, fecha_registro: f || new Date().toISOString().split('T')[0] };
    }).filter(m => m.fecha_registro >= rInicio && m.fecha_registro <= rFin);
  };

  const exportarExcelSAP = async () => {
    try {
      const LibXLSX = await cargarMotorExcel();
      if (!LibXLSX) return Swal.fire("Error", "No se pudo cargar el motor de exportación.", "error");

      const docsFiltrados = obtenerRegistrosFiltrados();
      if (docsFiltrados.length === 0) return Swal.fire("Aviso", "Sin registros en este rango.", "info");

      docsFiltrados.sort((a, b) => a.fecha_registro.localeCompare(b.fecha_registro));

      const filasReporte = docsFiltrados.map(m => {
        const { debito, credito } = extraerDebitoCredito(m);
        const codPUC = String(m.puc || "9999").trim();
        const cuentaContable = String(m.cuentaContable || m.cuenta || codPUC + "05").trim();

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

      const ws = LibXLSX.utils.json_to_sheet(filasReporte);
      const wb = LibXLSX.utils.book_new();
      LibXLSX.utils.book_append_sheet(wb, ws, "Libro_Auxiliar");
      LibXLSX.writeFile(wb, `NEXUS_SAP_REPORT_${empresaId}.xlsx`);
    } catch (e) {
      console.error(e);
    }
  };

  const renderLayout = async () => {
    await cargarEstadosCierre();
    const fInicioDefecto = "2026-05-01";
    const fFinDefecto = "2026-06-10";

    container.innerHTML = `
      <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32 animate-in fade-in duration-300">
        <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-6 border-b border-white/10 pb-6">
          <div class="text-center lg:text-left">
            <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter leading-none">FINANCE <span class="text-cyan-400">NEXUS</span></h1>
            <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-4">Taller Contable // Espejo SAP/HANA</p>
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
              <input type="date" id="filtro-fecha-inicio" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 outline-none" value="${fInicioDefecto}">
            </div>
            <div class="flex flex-col">
              <label class="text-[7px] orbitron text-cyan-400 font-black mb-1">RANGO_FIN</label>
              <input type="date" id="filtro-fecha-fin" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 outline-none" value="${fFinDefecto}">
            </div>
            <button id="btn-ejecutar-filtro" class="h-9 mt-4 px-4 bg-cyan-600 hover:bg-cyan-400 text-black text-[9px] orbitron font-black rounded-xl transition-all">AUDITAR</button>
          </div>
          <div class="flex gap-2">
            <button id="btn-vista-diario" class="px-5 py-2.5 rounded-full orbitron text-[9px] font-black">LIBRO DIARIO</button>
            <button id="btn-vista-puc" class="px-5 py-2.5 rounded-full orbitron text-[9px] font-black">ESTADOS</button>
            <button id="btn-exportar" class="px-5 py-2.5 rounded-full orbitron text-[9px] font-black bg-gradient-to-r from-emerald-600 to-teal-500 text-black">EXPORTAR</button>
          </div>
        </div>
        <div id="cont-dynamic-content"></div>
      </div>`;

    setupNavigation();
    document.getElementById("btn-ejecutar-filtro").onclick = recalcularMecanicaContable;
    escucharDatos();
  };

  function renderDashCard(label, id, color) {
    return `<div class="bg-[#0d1117] p-4 rounded-2xl border border-white/5 text-center min-w-[120px]"><span class="text-[8px] orbitron ${color} block mb-1 uppercase font-black">${label}</span><h2 id="${id}" class="text-sm font-black orbitron ${color}">$ 0</h2></div>`;
  }

  const setupNavigation = () => {
    const btnD = document.getElementById("btn-vista-diario");
    const btnP = document.getElementById("btn-vista-puc");
    if (!btnD || !btnP) return;
    
    const active = "bg-cyan-500 text-black font-bold shadow-lg";
    const inactive = "text-slate-400 bg-white/5";

    btnD.className = `px-4 py-2 rounded-full orbitron text-[9px] ${vistaActual === 'DIARIO' ? active : inactive}`;
    btnP.className = `px-4 py-2 rounded-full orbitron text-[9px] ${vistaActual === 'CUENTAS' ? active : inactive}`;

    btnD.onclick = () => { vistaActual = "DIARIO"; moficarEstructuraVista(); };
    btnP.onclick = () => { vistaActual = "CUENTAS"; moficarEstructuraVista(); };
    document.getElementById("btn-exportar").onclick = exportarExcelSAP;
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
      if (puc.startsWith("1305")) tC += debito;

      if (puc.startsWith("4135")) p4135 += debito;
      if (puc.startsWith("6135") || puc.startsWith("5195")) p6135 += credito;
      if (puc.startsWith("5105")) p5105 += credito;
      if (puc.startsWith("5120")) p5120 += credito;
      if (puc.startsWith("1305")) p1305 += debito;
      if (puc.startsWith("1105")) p1105 += (debito - credito);
    });

    actualizarDashboards(tI, tG, tC);

    const safeSetText = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    safeSetText("puc-4135", `$ ${Math.round(p4135).toLocaleString('es-CO')}`);
    safeSetText("puc-5105", `$ ${Math.round(p5105).toLocaleString('es-CO')}`);
    safeSetText("puc-6135", `$ ${Math.round(p6135).toLocaleString('es-CO')}`);
    safeSetText("puc-5120", `$ ${Math.round(p5120).toLocaleString('es-CO')}`);
    safeSetText("puc-1305", `$ ${Math.round(p1305).toLocaleString('es-CO')}`);
    safeSetText("puc-1105", `$ ${Math.round(p1105).toLocaleString('es-CO')}`);

    vistaActual === "DIARIO" ? cargarVistaDiaria() : cargarVistaCuentas();
  };

  const cargarVistaDiaria = () => {
    const content = document.getElementById("cont-dynamic-content");
    if (!content) return;
    content.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
        <div class="lg:col-span-4 bg-[#0d1117] p-6 rounded-2xl h-fit space-y-3">
          <input id="acc-fecha" type="date" class="w-full bg-black p-3 text-xs rounded border border-white/10" value="${new Date().toISOString().split('T')[0]}">
          <select id="acc-tipo" class="w-full bg-black p-3 text-xs rounded border border-white/10">
            ${CATEGORIAS_CONTABLES_MASTER.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
          </select>
          <input id="acc-placa" class="w-full bg-black p-3 text-xs rounded border border-white/10 font-bold text-center uppercase" placeholder="PLACA">
          <input id="acc-concepto" class="w-full bg-black p-3 text-xs rounded border border-white/10 uppercase" placeholder="DESCRIPCIÓN">
          <input id="acc-monto" type="number" class="w-full bg-black p-3 text-xs rounded border border-white/10 font-bold" placeholder="VALOR $">
          <button id="btnGuardar" class="w-full bg-emerald-500 text-black text-xs py-3 font-bold rounded">INYECTAR ASIENTO</button>
          <button id="btn-ejecutar-cierre-ui" class="w-full bg-red-950 border border-red-500/30 text-white text-[10px] py-2 rounded">GESTIONAR MESES</button>
        </div>
        <div id="listaFinanzasAgrupada" class="lg:col-span-8 space-y-4"></div>
      </div>`;

    document.getElementById("btnGuardar").onclick = registrarMovimiento;
    document.getElementById("btn-ejecutar-cierre-ui").onclick = gestionarCierreMesModal;
    renderizarListaAgrupada();
  };

  async function registrarMovimiento() {
    const f = document.getElementById("acc-fecha").value;
    if (esPeriodoBloqueado(f)) return Swal.fire("Error", "Mes Sellado.", "error");

    const selectedId = document.getElementById("acc-tipo").value;
    const catObj = CATEGORIAS_CONTABLES_MASTER.find(c => c.id === selectedId);
    const montoRaw = parseFloat(document.getElementById("acc-monto").value);
    const conceptoRaw = document.getElementById("acc-concepto").value.trim().toUpperCase();

    if (!conceptoRaw || isNaN(montoRaw)) return Swal.fire("Error", "Campos incompletos.", "warning");

    const nat = catObj ? catObj.tipo : "INGRESO";
    await addDoc(collection(db, "contabilidad"), {
      empresaId, tipo: selectedId, puc: catObj?.puc || "9999", cuentaContable: catObj?.cuenta || "999999", cuenta: catObj?.cuenta || "999999",
      debito: nat === "INGRESO" ? montoRaw : 0, credito: nat === "GASTO" ? montoRaw : 0,
      placa: document.getElementById("acc-placa").value.trim().toUpperCase() || "ADMIN", concepto: conceptoRaw, creadoPor: userRole,
      fecha_registro: f, creadoEn: Timestamp.fromDate(new Date(f + "T12:00:00"))
    });

    document.getElementById("acc-concepto").value = ""; document.getElementById("acc-monto").value = "";
    recalcularMecanicaContable();
  }

  const renderizarListaAgrupada = () => {
    const listContainer = document.getElementById("listaFinanzasAgrupada");
    if (!listContainer) return;

    const docsFiltrados = obtenerRegistrosFiltrados();
    if (docsFiltrados.length === 0) {
      listContainer.innerHTML = `<div class="p-10 border border-dashed border-white/10 rounded text-center text-slate-500">SIN MOVIMIENTOS</div>`;
      return;
    }

    const mapaPeriodos = {};
    docsFiltrados.forEach(m => { const per = m.fecha_registro.substring(0, 7); if (!mapaPeriodos[per]) mapaPeriodos[per] = []; mapaPeriodos[per].push(m); });

    listContainer.innerHTML = Object.keys(mapaPeriodos).sort().map(per => {
      const txs = mapaPeriodos[per];
      const esMesCerrado = !!estadosCierreMes[per];
      return `
        <div class="bg-[#0d1117] p-4 rounded-xl border ${esMesCerrado ? 'border-red-500/30' : 'border-white/5'}">
          <div class="flex justify-between border-b border-white/10 pb-2 mb-2">
            <span class="font-bold text-xs uppercase">${per} ${esMesCerrado ? '🔒' : '🔓'}</span>
          </div>
          <div class="space-y-1">
            ${txs.map(m => {
              const { debito, credito } = extraerDebitoCredito(m);
              const isDeb = debito > 0;
              return `
                <div class="flex justify-between bg-black/20 p-2 text-xs rounded">
                  <div>
                    <span class="text-[10px] text-slate-400 font-mono">[${m.fecha_registro}]</span> 
                    <b class="text-white">${m.concepto}</b> <i class="text-cyan-400">(${m.placa || 'ADMIN'})</i>
                  </div>
                  <span class="${isDeb ? 'text-emerald-400' : 'text-red-400'} font-mono font-bold">${isDeb ? '+' : '-'} $${(isDeb ? debito : credito).toLocaleString('es-CO')}</span>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');
  };

  async function gestionarCierreMesModal() {
    const per = prompt("Estipule Período a Sellar (YYYY-MM):", "2026-06");
    if (!/^\d{4}-\d{2}$/.test(per)) return;
    if (estadosCierreMes[per]) {
      await deleteDoc(doc(db, "cierres_mensuales", estadosCierreMes[per]));
    } else {
      await addDoc(collection(db, "cierres_mensuales"), { empresaId, periodo: per, estado: "CERRADO" });
    }
    await renderLayout();
  }

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
    }, (err) => console.error("Firestore Fail:", err));
  }

  function actualizarDashboards(i, g, c) {
    const safeSet = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text; };
    safeSet("dash-ingresos", `$ ${Math.round(i).toLocaleString('es-CO')}`);
    safeSet("dash-gastos", `$ ${Math.round(g).toLocaleString('es-CO')}`);
    safeSet("dash-utilidad", `$ ${Math.round(i - g).toLocaleString('es-CO')}`);
    safeSet("dash-pendiente", `$ ${Math.round(c).toLocaleString('es-CO')}`);
  }

  function cargarVistaCuentas() {
    const content = document.getElementById("cont-dynamic-content");
    if (content) content.innerHTML = `<div class="p-10 text-center orbitron text-xs text-cyan-400">Auditoría Balances PUC Calculada Correctamente en Barra Superior.</div>`;
  }

  await renderLayout();
}
