/**
 * 🏛️ TALLERPRO360 - HANAFORENSE QUANTUM-SAP REPORTING ENGINE v4.2.0
 * 📜 SCRIPT ID: #NEXUS-X-SAP-HANA-REPORTS-2026
 * * Matriz de Reportes, Confiabilidad Contable por Centro de Costos Activo,
 * Consolidación Financiera y Motor de Impresión de Informes Gerenciales.
 * Autor: TallerPRO360 Core & W.J. Urquijo
 * Fecha de Despliegue: Junio 2026
 */

import {
  collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../core/firebase-config.js";

// ==========================================
// ⚡ INYECTOR GLOBAL DE COMPONENTES XLSX (SHEETJS)
// ==========================================
function cargarMotorExcel() {
  return new Promise((resolve) => {
    if (window.XLSX) return resolve(window.XLSX);
    const script = document.createElement('script');
    script.src = "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.full.min.js";
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => { 
      console.error("❌ ERROR CRÍTICO SAP: CDN SheetJS inalcanzable."); 
      resolve(null); 
    };
    document.head.appendChild(script);
  });
}

// ==========================================
// 🛡️ CONTROLADOR DE SANITIZACIÓN DE PLACAS
// ==========================================
const aislarPlacaPura = (textoRaw) => {
  if (!textoRaw) return "ADMIN";
  const base = String(textoRaw).split('-')[0];
  const limpia = base.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
  return (limpia.length >= 5 && limpia.length <= 6) ? limpia : "ADMIN";
};

export default async function reportes(container) {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div class="p-10 text-center orbitron text-xs text-cyan-400 animate-pulse tracking-[0.2em]">
        INICIALIZANDO MATRIZ DE REPORTES HANAFORENSE v4.2.0...
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

  let registrosGlobales = [];

  // ==========================================
  // 🧭 ASIGNACIÓN DINÁMICA DE NATURALEZA PUC
  // ==========================================
  const clasificarNaturalezaPUC = (pucStr) => {
    const p = String(pucStr || "").trim();
    if (p.startsWith("4") || p.startsWith("11") || p.startsWith("12") || p.startsWith("13")) return "INGRESO";
    if (p.startsWith("5") || p.startsWith("6") || p.startsWith("2") || p.startsWith("9")) return "GASTO";
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

  // ==========================================
  // 📥 CARGA DE DATOS DESDE FIRESTORE
  // ==========================================
  async function cargarDatosContables() {
    try {
      const q = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId));
      const snap = await getDocs(q);
      registrosGlobales = snap.docs.map(d => {
        const data = d.data();
        let f = data.fecha_registro;
        if (!f && data.creadoEn?.toDate) f = data.creadoEn.toDate().toISOString().split('T')[0];
        return {
          id: d.id,
          ...data,
          fecha_registro: f || new Date().toISOString().split('T')[0]
        };
      });
      renderizarDashboardHanaforense();
    } catch (e) {
      console.error("❌ Error SAP cargando contabilidad para reportes:", e);
      container.innerHTML = `<div class="p-10 text-center text-red-500">Error al sincronizar motor analítico HANA.</div>`;
    }
  }

  const obtenerDatosFiltrados = () => {
    const rInicio = document.getElementById("filtro-fecha-inicio")?.value || "2026-05-01";
    const rFin = document.getElementById("filtro-fecha-fin")?.value || "2026-06-30";
    return registrosGlobales.filter(m => m.fecha_registro >= rInicio && m.fecha_registro <= rFin);
  };

  // ==========================================
  // 📊 RENDERIZADO DE LA INTERFAZ HANAFORENSE
  // ==========================================
  const renderizarDashboardHanaforense = () => {
    const docs = obtenerDatosFiltrados();

    let totalIngresos = 0;
    let totalCostosRepuestos = 0;
    let totalComisionesNoh = 0;
    let totalGastosSede = 0;
    let totalEgresosGlobal = 0;

    const flotaMap = {};

    docs.forEach(m => {
      const { debito, credito } = extraerValoresDebitoCredito(m);
      const nat = clasificarNaturalezaPUC(m.puc);
      const placaPura = aislarPlacaPura(m.placa || m.vehiculo_detalle);
      const vehiculoDetalle = m.vehiculo_detalle || (placaPura !== "ADMIN" ? `${placaPura} - VEHÍCULO TALLER` : "ADMINISTRACIÓN CENTRAL");

      if (!flotaMap[placaPura]) {
        flotaMap[placaPura] = {
          placa: placaPura,
          vehiculo: vehiculoDetalle,
          propietario: "CLIENTE GENERAL",
          volumenOps: 0,
          ingresos: 0,
          egresos: 0
        };
      }

      flotaMap[placaPura].volumenOps += 1;

      if (nat === "INGRESO") {
        totalIngresos += debito;
        flotaMap[placaPura].ingresos += debito;
      } else {
        totalEgresosGlobal += credito;
        flotaMap[placaPura].egresos += credito;

        const pucStr = String(m.puc || "");
        if (pucStr.startsWith("61")) totalCostosRepuestos += credito;
        else if (pucStr.startsWith("5105")) totalComisionesNoh += credito;
        else totalGastosSede += credito;
      }
    });

    const utilidadNeta = totalIngresos - totalEgresosGlobal;
    const activosAtendidos = Object.keys(flotaMap).filter(p => p !== "ADMIN").length;
    const ticketPromedio = activosAtendidos > 0 ? totalIngresos / activosAtendidos : 0;
    const margenOperativo = totalIngresos > 0 ? (utilidadNeta / totalIngresos) * 100 : 0;

    container.innerHTML = `
      <div class="p-4 lg:p-8 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32">
        <header class="flex flex-col lg:flex-row justify-between items-center gap-6 mb-6 border-b border-white/10 pb-6">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[9px] rounded font-black tracking-widest orbitron">HANAFORENSE v4.2.0</span>
              <span class="text-slate-600 font-mono text-[9px]">MATRIZ DE REPORTES & CENTRO DE COSTOS</span>
            </div>
            <h1 class="orbitron text-3xl lg:text-4xl font-black text-white tracking-tighter italic mt-1">TALLERPRO360 <span class="text-cyan-400">HANA FORENSE</span></h1>
            <p class="text-[9px] text-slate-400 font-black tracking-[0.3em] orbitron mt-1 font-mono">CONFIABILIDAD CONTABLE POR CENTRO DE COSTOS ACTIVO</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button id="btn-imprimir-informe" class="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-[10px] orbitron font-black rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2">
              🖨️ IMPRIMIR INFORME GERENCIAL
            </button>
            <button id="btn-exportar-hana" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black text-[10px] orbitron font-black rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2">
              📊 EXPORTAR MATRIZ SAP
            </button>
          </div>
        </header>

        <!-- Filtros de Período -->
        <div class="bg-[#0d1117] p-4 rounded-2xl border border-white/5 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div class="flex items-center gap-2 flex-wrap">
            <button class="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg text-[10px] orbitron font-bold">TODO EL HISTORIAL</button>
            <button class="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-[10px] orbitron font-bold transition-all">MES SELECCIONADO</button>
            <input type="date" id="filtro-fecha-inicio" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 font-mono" value="2026-05-01">
            <input type="date" id="filtro-fecha-fin" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 font-mono" value="2026-06-30">
            <button id="btn-filtrar-hana" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-black text-[10px] orbitron font-black rounded-xl transition-all">ACTUALIZAR VISTA</button>
          </div>
          <div class="text-xs font-mono text-slate-400">
            PERÍODO FISCAL ACTIVO: <span class="text-cyan-400 font-bold">2026-07</span>
          </div>
        </div>

        <!-- Tarjetas de Métricas Ejecutivas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="bg-[#0d1117] p-5 rounded-2xl border border-white/5 shadow-xl">
            <span class="text-[9px] orbitron text-slate-400 block uppercase font-black">UTILIDAD NETA PERÍODO</span>
            <h2 class="text-xl font-black orbitron ${utilidadNeta >= 0 ? 'text-emerald-400' : 'text-red-500'} mt-2">
              $ ${Math.round(utilidadNeta).toLocaleString('es-CO')}
            </h2>
          </div>
          <div class="bg-[#0d1117] p-5 rounded-2xl border border-white/5 shadow-xl">
            <span class="text-[9px] orbitron text-slate-400 block uppercase font-black">TICKET PROMEDIO</span>
            <h2 class="text-xl font-black orbitron text-cyan-400 mt-2">
              $ ${Math.round(ticketPromedio).toLocaleString('es-CO')}
            </h2>
          </div>
          <div class="bg-[#0d1117] p-5 rounded-2xl border border-white/5 shadow-xl">
            <span class="text-[9px] orbitron text-slate-400 block uppercase font-black">MARGEN OPERATIVO</span>
            <h2 class="text-xl font-black orbitron text-amber-400 mt-2">
              ${margenOperativo.toFixed(1)}%
            </h2>
          </div>
          <div class="bg-[#0d1117] p-5 rounded-2xl border border-white/5 shadow-xl">
            <span class="text-[9px] orbitron text-slate-400 block uppercase font-black">ACTIVOS ATENDIDOS</span>
            <h2 class="text-xl font-black orbitron text-white mt-2">
              ${activosAtendidos} UNIDADES
            </h2>
          </div>
        </div>

        <!-- Tabla Consolidada de Flota -->
        <div class="bg-[#0d1117] p-6 rounded-2xl border border-white/5 shadow-2xl space-y-4">
          <div class="flex justify-between items-center border-b border-white/10 pb-4">
            <div>
              <h3 class="orbitron text-sm font-black text-cyan-400 uppercase tracking-widest">ESTRUCTURA OPERATIVA DIRECTA CONSOLIDADA POR FLOTA</h3>
              <p class="text-[10px] text-slate-500 font-mono mt-0.5">Clic en las unidades para auditar matriz de órdenes y PUCs vinculados.</p>
            </div>
            <span class="text-xs font-mono text-slate-400 bg-white/5 px-3 py-1 rounded-lg">${Object.keys(flotaMap).length} VEHÍCULOS PROCESADOS</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs font-mono">
              <thead>
                <tr class="border-b border-white/10 text-slate-400 uppercase text-[9px] tracking-wider">
                  <th class="py-3 px-2">CENTRO DE COSTO (VEHÍCULO)</th>
                  <th class="py-3 px-2">VOLUMEN OPS.</th>
                  <th class="py-3 px-2">INGRESO RECAUDADO (TOTAL)</th>
                  <th class="py-3 px-2">EGRESOS (DIRECTO + PUC)</th>
                  <th class="py-3 px-2 text-right">EBITDA PERÍODO</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                ${Object.values(flotaMap).map(f => {
                  const ebitdaVehiculo = f.ingresos - f.egresos;
                  return `
                    <tr class="hover:bg-white/5 transition-colors">
                      <td class="py-3 px-2">
                        <div class="font-black text-cyan-400 orbitron text-sm">${f.placa}</div>
                        <div class="text-[10px] text-slate-400 font-sans">${f.vehiculo}</div>
                      </td>
                      <td class="py-3 px-2">
                        <span class="bg-cyan-950/40 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          ${f.volumenOps} OKS
                        </span>
                      </td>
                      <td class="py-3 px-2 text-emerald-400 font-bold">$ ${Math.round(f.ingresos).toLocaleString('es-CO')}</td>
                      <td class="py-3 px-2 text-red-400 font-bold">$ ${Math.round(f.egresos).toLocaleString('es-CO')}</td>
                      <td class="py-3 px-2 text-right font-black ${ebitdaVehiculo >= 0 ? 'text-amber-400' : 'text-red-500'}">
                        $ ${Math.round(ebitdaVehiculo).toLocaleString('es-CO')}
                      </td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;

    document.getElementById("btn-filtrar-hana").onclick = renderizarDashboardHanaforense;
    document.getElementById("btn-exportar-hana").onclick = exportarMatrizHanaExcel;
    document.getElementById("btn-imprimir-informe").onclick = imprimirInformeGerencialPDF;
  };

  // ==========================================
  // 🖨️ MOTOR DE IMPRESIÓN DE INFORME GERENCIAL PDF
  // ==========================================
  const imprimirInformeGerencialPDF = () => {
    const docs = obtenerDatosFiltrados();
    let ingresosTot = 0, egresosTot = 0;
    let costoRepuestos = 0, comisionesNom = 0, gastosSede = 0;

    docs.forEach(m => {
      const { debito, credito } = extraerValoresDebitoCredito(m);
      const nat = clasificarNaturalezaPUC(m.puc);
      if (nat === "INGRESO") ingresosTot += debito;
      else {
        egresosTot += credito;
        const p = String(m.puc || "");
        if (p.startsWith("61")) costoRepuestos += credito;
        else if (p.startsWith("5105")) comisionesNom += credito;
        else gastosSede += credito;
      }
    });

    const utilidadReal = ingresosTot - egresosTot;

    const ventanaPrint = window.open('', '_blank');
    ventanaPrint.document.write(`
      <html>
        <head>
          <title>TALLERPRO360 - INFORME GERENCIAL MENSUAL</title>
          <style>
            body { font-family: monospace; padding: 20px; color: #111; background: #fff; }
            h2 { border-bottom: 2px solid #111; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
            th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-size: 11px; }
            th { background: #eee; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>TALLERPRO360 // INFORME GERENCIAL MENSUAL</h2>
          <p><strong>NIT:</strong> 901.882.391-4 | <strong>Tel:</strong> +57 310 764 5306 | <strong>Período:</strong> 2026-07</p>
          
          <h3>1. ESTADO DE RESULTADOS GERENCIAL - CONSOLIDADO</h3>
          <table>
            <tr><td>(+) Ingresos Brutos Facturados a Clientes</td><td class="text-right">$ ${Math.round(ingresosTot).toLocaleString('es-CO')}</td></tr>
            <tr><td>(-) Costo Directo Repuestos e Insumos</td><td class="text-right">-$ ${Math.round(costoRepuestos).toLocaleString('es-CO')}</td></tr>
            <tr><td>(-) Comisiones y Mano de Obra Operarios</td><td class="text-right">-$ ${Math.round(comisionesNom).toLocaleString('es-CO')}</td></tr>
            <tr><td>(-) Gastos Operativos de la Sede</td><td class="text-right">-$ ${Math.round(gastosSede).toLocaleString('es-CO')}</td></tr>
            <tr class="bold"><td>(=) UTILIDAD NETA REAL GANADA EN EL PERÍODO</td><td class="text-right">$ ${Math.round(utilidadReal).toLocaleString('es-CO')}</td></tr>
          </table>

          <h3>2. DESGLOSE DE GASTOS OPERATIVOS Y SEDE</h3>
          <table>
            <tr><th>FECHA</th><th>CATEGORÍA</th><th>CONCEPTO / DESCRIPCIÓN</th><th class="text-right">MONTO COP</th></tr>
            ${docs.filter(m => clasificarNaturalezaPUC(m.puc) === "GASTO").map(m => `
              <tr>
                <td>${m.fecha_registro}</td>
                <td>CUENTA PUC ${m.puc}</td>
                <td>${m.concepto}</td>
                <td class="text-right">$ ${Math.round(m.monto || m.credito || 0).toLocaleString('es-CO')}</td>
              </tr>`).join('')}
          </table>

          <br><br>
          <p>________________________________________</p>
          <p><strong>Firma Auditoría Gerencial</strong><br>Director Operativo - TallerPRO360 SAP Engine</p>
          <script>window.print();</script>
        </body>
      </html>
    `);
    ventanaPrint.document.close();
  };

  // ==========================================
  // 📊 EXPORTADOR EXCEL MATRIZ HANA
  // ==========================================
  const exportarMatrizHanaExcel = async () => {
    const LibXLSX = await cargarMotorExcel();
    if (!LibXLSX) return alert("Librería SheetJS no disponible.");

    const docs = obtenerDatosFiltrados();
    const filasJson = docs.map(m => ({
      "FECHA": m.fecha_registro,
      "CUENTA PUC": m.puc,
      "CONCEPTO": m.concepto,
      "PLACA ACTIVO": m.placa,
      "DETALLE VEHÍCULO": m.vehiculo_detalle,
      "DÉBITO (+)": m.debito || 0,
      "CRÉDITO (-)": m.credito || 0,
      "AUDITOR": m.creadoPor || "SISTEMA"
    }));

    const wb = LibXLSX.utils.book_new();
    const ws = LibXLSX.utils.json_to_sheet(filasJson);
    LibXLSX.utils.book_append_sheet(wb, ws, "Hanaforense_Consolidado");
    LibXLSX.writeFile(wb, `TALLERPRO360_HANAFORENSE_${empresaId}.xlsx`);
  };

  await cargarDatosContables();
}
