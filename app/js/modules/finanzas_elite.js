/**
 * 🧠 finanzas_elite.js - TALLERPRO360 QUANTUM-ERP AUDITOR (MÓDULO CONTABLE N°. 02)
 * Estado de Resultados Integral Forense, Sincronización PUC Reactiva y Generador PDF Corporativo
 * Autor: TallerPRO360 Core & W.J. Urquijo
 */
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function finanzasElite(container) {
  container.innerHTML = `<div class="p-10 text-center orbitron text-xs text-cyan-400 animate-pulse">EXTRAYENDO MÉTRICAS CONSOLIDADAS QUANTUM...</div>`;

  const empresaId = (localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId") || "").trim();
  if (!empresaId) {
    container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron">ERROR DE SEGURIDAD: IDENTIDAD EMPRESARIAL NO VALIDADA</div>`;
    return;
  }

  // Estructura matricial de cuentas alineada con el PUC real del sistema
  let balanceEstructurado = {
    ingresos_mo: 0,         // Cuenta 4135 (Servicios / Labor) o proporcional
    ingresos_rep: 0,        // Cuenta 413505 (Cierre total órdenes facturadas)
    anticipos_diversos: 0,  // Cuenta 110505 (Anticipos en caja)
    costos_rep: 0,          // Cuenta 613505 (Costos directos de repuestos)
    costos_mo: 0,           // Cuenta 613520 (Costos directos de mano de obra/técnicos)
    gastos_personal: 0,     // Cuenta 5105
    arriendos_servicios: 0, // Cuenta 5120
    gastos_diversos: 0      // Cuenta 5195 (Insumos con/sin IVA y gastos generales)
  };

  const safeNumber = (v) => {
    if (!v) return 0;
    let n = Number(String(v).replace(/[\$\s\.]/g, '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  };

  const renderLayout = () => {
    container.innerHTML = `
      <div class="p-4 lg:p-8 bg-[#010409] min-h-screen text-white font-sans pb-40 animate-in fade-in duration-300">
        <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 border-b border-white/10 pb-6 gap-4">
          <div>
            <h1 class="orbitron text-3xl font-black uppercase tracking-tighter">FINANZAS <span class="text-cyan-400">ELITE</span></h1>
            <p class="text-[9px] text-slate-500 font-mono tracking-[0.2em] mt-1">QUANTUM-ERP AUDITOR // MÓDULO CONTABLE N°. 02 // AUTHORIZED BY W.J. URQUIJO</p>
          </div>
          <div class="flex flex-wrap gap-2 items-center bg-[#0d1117] p-3 rounded-xl border border-white/5 w-full lg:w-auto">
            <input type="date" id="fInicio" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 font-mono">
            <input type="date" id="fFin" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 font-mono">
            <button id="btnCalcularElite" class="px-4 py-2 bg-cyan-600 text-black text-[10px] font-black orbitron rounded-xl hover:bg-cyan-400 transition-all">CALCULAR MATRIX</button>
            <button id="btnBriefEjecutivo" class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-black text-[10px] font-black orbitron rounded-xl flex items-center gap-1">📋 GENERAR PDF INFORME</button>
          </div>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-6xl">
          <div class="bg-[#0d1117] p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
            <span class="text-[9px] orbitron text-slate-400 uppercase tracking-widest block mb-4">Combustible Operativo / Balance</span>
            <div class="relative w-36 h-36 flex items-center justify-center rounded-full border-4 border-dashed border-cyan-500/40 shadow-lg shadow-cyan-500/5">
              <h2 id="txtUtilidadCentro" class="text-sm font-black orbitron text-white text-center p-2">$ 0</h2>
            </div>
          </div>

          <div class="md:col-span-2 space-y-4 flex flex-col justify-between">
            <div class="bg-red-950/20 border border-red-500/20 p-5 rounded-2xl">
              <span class="text-[8px] font-black orbitron text-red-400 block mb-1 uppercase tracking-widest">⚠️ AUTONOMÍA DE CAJA (RUNWAY)</span>
              <p id="txtRunway" class="text-xs text-slate-300 font-mono">Calculando ciclos contables con base en el gasto fijo consolidado diario...</p>
            </div>
            
            <div class="bg-cyan-950/20 border border-cyan-500/20 p-5 rounded-2xl">
              <span class="text-[8px] font-black orbitron text-cyan-400 block mb-1 uppercase tracking-widest">🧠 NEXUS-AI STRATEGIC INSIGHT</span>
              <p id="txtAlertaForense" class="text-xs text-slate-300 font-mono italic">Escaneando transacciones en busca de anomalías operacionales...</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-[#0d1117] p-4 rounded-xl border border-white/5"><span class="text-[8px] text-slate-400 block">INGRESOS OPERATIVOS BRUTOS</span><h3 id="elite-ingresos" class="text-lg font-black text-emerald-400">$ 0</h3></div>
          <div class="bg-[#0d1117] p-4 rounded-xl border border-white/5"><span class="text-[8px] text-slate-400 block">EGRESOS Y COSTOS DE OPERACIÓN</span><h3 id="elite-egresos" class="text-lg font-black text-red-400">$ 0</h3></div>
          <div class="bg-[#0d1117] p-4 rounded-xl border border-white/5"><span class="text-[8px] text-slate-400 block">CARTERA EN PATIO (RAMPA)</span><h3 id="elite-rampa" class="text-lg font-black text-cyan-400">$ 0</h3></div>
          <div class="bg-[#0d1117] p-4 rounded-xl border border-white/5"><span class="text-[8px] text-slate-400 block">ANTICIPOS EN CAJA GENERAL</span><h3 id="elite-ajustes" class="text-lg font-black text-amber-500">$ 0</h3></div>
        </div>

        <div class="bg-[#0d1117] p-5 rounded-xl border border-white/5">
          <h3 class="text-xs font-black uppercase orbitron text-slate-400 mb-3 tracking-widest">PERFORMANCE & NÓMINA PASIVA (30% COMISIÓN)</h3>
          <div id="gridNominaElite" class="grid grid-cols-1 md:grid-cols-3 gap-3"></div>
        </div>
      </div>`;

    const hoy = new Date();
    document.getElementById("fInicio").value = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    document.getElementById("fFin").value = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];

    document.getElementById("btnCalcularElite").onclick = analizarEjercicioFinanciero;
    document.getElementById("btnBriefEjecutivo").onclick = generarPDFEstadoResultadosCorporativo;
  };

  const analizarEjercicioFinanciero = async () => {
    const strI = document.getElementById("fInicio").value;
    const strF = document.getElementById("fFin").value;

    // Resetear contadores estructurales del PUC para recalcular de cero sin acumular datos viejos
    Object.keys(balanceEstructurado).forEach(k => balanceEstructurado[k] = 0);
    let rampaActivaTotal = 0;

    try {
      // 1️⃣ RECOLECCIÓN DIRECTA DE DATOS DESDE CONTABILIDAD.JS (FIRESTORE)
      const qCont = query(
        collection(db, "contabilidad"), 
        where("empresaId", "==", empresaId),
        where("fecha", ">=", strI),
        where("fecha", "<=", strF)
      );
      
      const snapCont = await getDocs(qCont);

      snapCont.docs.forEach(docSnap => {
        const transaccion = docSnap.data();
        const pucCode = String(transaccion.puc || transaccion.cuentaContable || "");
        const valMonto = safeNumber(transaccion.monto || 0);

        // Enrutamiento contable exacto por código de cuenta del PUC
        if (pucCode.startsWith("413505")) {
          balanceEstructurado.ingresos_rep += valMonto; // Ingreso total por orden entregada
        } else if (pucCode.startsWith("1105")) {
          balanceEstructurado.anticipos_diversos += valMonto; // Anticipos reales ingresados a caja
        } else if (pucCode.startsWith("613505")) {
          balanceEstructurado.costos_rep += valMonto; // Costo directo de repuestos inyectados
        } else if (pucCode.startsWith("613520")) {
          balanceEstructurado.costos_mo += valMonto; // Costo directo de mano de obra
        } else if (pucCode.startsWith("5105")) {
          balanceEstructurado.gastos_personal += valMonto;
        } else if (pucCode.startsWith("5120")) {
          balanceEstructurado.arriendos_servicios += valMonto;
        } else if (pucCode.startsWith("5195")) {
          balanceEstructurado.gastos_diversos += valMonto; // Insumos manuales mapeados por ordenes.js
        }
      });

      // 2️⃣ EXTRACCIÓN DE LA RAMPA OPERATIVA Y GENERACIÓN DE PRE-NÓMINAS DESDE LA COLECCIÓN ÓRDENES
      const qOrd = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
      const snapOrd = await getDocs(qOrd);
      const nominaMap = {};

      snapOrd.docs.forEach(d => {
        const o = d.data();
        const total = safeNumber(o.total || 0);
        const est = String(o.estado || "").toUpperCase();
        const fechaOT = o.fecha_creacion_manual ? o.fecha_creacion_manual.split('T')[0] : "";

        // Solo sumar a la rampa activa si está retenido en fases operativas
        if (['INGRESO', 'PROCESO', 'REPARACION'].includes(est)) {
          rampaActivaTotal += total;
        }

        // Pre-nómina condicionada al rango de fechas seleccionado
        if (['LISTO', 'ENTREGADO'].includes(est) && fechaOT >= strI && fechaOT <= strF) {
          const tec = o.tecnico_asignado || "MECÁNICO_PLANTA";
          if (!nominaMap[tec]) nominaMap[tec] = { total: 0, count: 0 };
          nominaMap[tec].total += (total * 0.30); // Regla estricta del 30% de mano de obra/total taller
          nominaMap[tec].count++;
        }
      });

      renderNomina(nominaMap);
      actualizarPanelesUI(rampaActivaTotal);
    } catch (e) {
      console.error("❌ Error crítico en auditoría forense financiera:", e);
    }
  };

  const actualizarPanelesUI = (rampaActivaTotal) => {
    // Cálculo unificado bajo normas contables: Ingresos de Cierre + Anticipos
    const ingBrutos = balanceEstructurado.ingresos_rep + balanceEstructurado.anticipos_diversos;
    // Suma de Costos Directos + Gastos fijos/variables
    const egConsolidados = balanceEstructurado.costos_rep + balanceEstructurado.costos_mo + 
                           balanceEstructurado.gastos_personal + balanceEstructurado.arriendos_servicios + 
                           balanceEstructurado.gastos_diversos;
    
    const utOperativaNeto = ingBrutos - egConsolidados;

    document.getElementById("elite-ingresos").innerText = `$ ${Math.round(ingBrutos).toLocaleString('es-CO')}`;
    document.getElementById("elite-egresos").innerText = `$ ${Math.round(egConsolidados).toLocaleString('es-CO')}`;
    document.getElementById("elite-rampa").innerText = `$ ${Math.round(rampaActivaTotal).toLocaleString('es-CO')}`;
    document.getElementById("elite-ajustes").innerText = `$ ${Math.round(balanceEstructurado.anticipos_diversos).toLocaleString('es-CO')}`;

    const txtCent = document.getElementById("txtUtilidadCentro");
    if (txtCent) {
      txtCent.innerText = `$ ${Math.round(utOperativaNeto).toLocaleString('es-CO')}`;
      txtCent.className = "text-sm font-black orbitron px-2 " + (utOperativaNeto >= 0 ? "text-emerald-400" : "text-red-500");
    }

    const costoDiario = egConsolidados / 30;
    const diasRunway = costoDiario > 0 ? Math.max(0, Math.round(utOperativaNeto / costoDiario)) : 999;
    
    document.getElementById("txtRunway").innerText = diasRunway <= 0 
      ? `🚨 CRÍTICO: 0 Días de Runway. El déficit financiero absorbió el margen de liquidez de la rampa operativa.` 
      : `💡 AUTONOMÍA DE CAJA: Cuenta con ${diasRunway} días de vida financiera basados en el gasto operativo de $${Math.round(costoDiario).toLocaleString('es-CO')}/día.`;

    const txtAlerta = document.getElementById("txtAlertaForense");
    if (utOperativaNeto < 0) {
      txtAlerta.innerText = `ALERTA FORENSE: Déficit operativo detectado en el rango seleccionado. Se sugiere auditar el inventario y agilizar la liberación de los vehículos en rampa activa ($${Math.round(rampaActivaTotal).toLocaleString('es-CO')}).`;
    } else {
      txtAlerta.innerText = `NEXUS-AI ANALYTICS: Salud contable óptima. Superávit neto consolidado de $${Math.round(utOperativaNeto).toLocaleString('es-CO')}. Capacidad estable para reinversión de bodega.`;
    }
  };

  const renderNomina = (mapa) => {
    const grid = document.getElementById("gridNominaElite");
    if (!grid) return;
    
    if (Object.keys(mapa).length === 0) {
      grid.innerHTML = `<div class="col-span-3 text-slate-600 text-center font-mono text-[10px] py-4">NO SE DETECTARON COMISIONES EN ESTE PERÍODO</div>`;
      return;
    }

    grid.innerHTML = Object.entries(mapa).map(([t, val]) => `
      <div class="bg-black/40 p-4 rounded-xl border border-white/5 flex justify-between items-center">
        <div>
          <span class="text-xs font-black uppercase text-slate-300 block">${t}</span>
          <span class="text-sm font-mono font-bold text-emerald-400">$ ${Math.round(val.total).toLocaleString('es-CO')}</span>
        </div>
        <span class="text-[10px] bg-white/5 px-2 py-1 rounded font-mono text-slate-400">${val.count} Órdenes</span>
      </div>`).join('');
  };

  const generarPDFEstadoResultadosCorporativo = () => {
    const strI = document.getElementById("fInicio").value;
    const strF = document.getElementById("fFin").value;

    const ingBrutos = balanceEstructurado.ingresos_rep + balanceEstructurado.anticipos_diversos;
    const egConsolidados = balanceEstructurado.costos_rep + balanceEstructurado.costos_mo + 
                           balanceEstructurado.gastos_personal + balanceEstructurado.arriendos_servicios + 
                           balanceEstructurado.gastos_diversos;
    const utOperativaNeto = ingBrutos - egConsolidados;
    const rampaTotal = safeNumber(document.getElementById("elite-rampa").innerText);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Estado_Resultados_${empresaId}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
            .header-bar { border-bottom: 3px solid #00b4d8; padding-bottom: 12px; margin-bottom: 20px; }
            .brand { font-weight: 900; letter-spacing: -0.5px; font-size: 14px; color: #00b4d8; text-transform: uppercase; }
            .title { font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 5px; text-transform: uppercase; }
            .subtitle { font-size: 11px; color: #64748b; font-family: monospace; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 12px; }
            th { text-align: left; padding: 10px; color: #475569; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; }
            td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
            .destacado { font-weight: bold; color: #00b4d8; }
            .total-row { font-weight: bold; background-color: #f8fafc; border-top: 1px solid #cbd5e1; }
            .firma-section { margin-top: 70px; font-size: 11px; border-top: 1px solid #cbd5e1; width: 280px; padding-top: 8px; color: #64748b; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div class="brand">PRO360 CORE - NEXUS-X COMMAND INTERFACE</div>
            <div class="title">ESTADO DE RESULTADOS INTEGRAL FORENSE (PUC)</div>
            <div class="subtitle">Identificador del Taller: ${empresaId} | Sincronización: ${strI} / ${strF}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Estructura de Cuenta (Consolidado Libro Diario)</th>
                <th style="text-align: right;">Valor Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Ingresos por Órdenes de Trabajo Facturadas (413505)</td><td style="text-align: right;">$ ${Math.round(balanceEstructurado.ingresos_rep).toLocaleString('es-CO')}</td></tr>
              <tr><td>Anticipos Recibidos en Caja General (110505)</td><td style="text-align: right;">$ ${Math.round(balanceEstructurado.anticipos_diversos).toLocaleString('es-CO')}</td></tr>
              <tr class="total-row destacado"><td>INGRESOS OPERATIVOS BRUTOS</td><td style="text-align: right;">$ ${Math.round(ingBrutos).toLocaleString('es-CO')}</td></tr>
              
              <tr><td>Costos de Adquisición / Compras Repuestos (613505)</td><td style="text-align: right;">$ ${Math.round(balanceEstructurado.costos_rep).toLocaleString('es-CO')}</td></tr>
              <tr><td>Costos de Mano de Obra y Servicios Especializados (613520)</td><td style="text-align: right;">$ ${Math.round(balanceEstructurado.costos_mo).toLocaleString('es-CO')}</td></tr>
              <tr><td>Gastos de Personal Operativo / Administrativo (5105)</td><td style="text-align: right;">$ ${Math.round(balanceEstructurado.gastos_personal).toLocaleString('es-CO')}</td></tr>
              <tr><td>Arrendamientos y Servicios Públicos (5120)</td><td style="text-align: right;">$ ${Math.round(balanceEstructurado.arriendos_servicios).toLocaleString('es-CO')}</td></tr>
              <tr><td>Gastos Diversos e Insumos Operacionales (5195)</td><td style="text-align: right;">$ ${Math.round(balanceEstructurado.gastos_diversos).toLocaleString('es-CO')}</td></tr>
              <tr class="total-row" style="color: #ef4444;"><td>EGRESOS Y COSTOS DE OPERACIÓN</td><td style="text-align: right;">$ ${Math.round(egConsolidados).toLocaleString('es-CO')}</td></tr>
              
              <tr class="total-row" style="background-color: #f0fdf4; font-size: 13px; color: ${utOperativaNeto >= 0 ? '#10b981' : '#ef4444'};">
                <td>UTILIDAD NETA OPERATIVA REAL (EBITDA)</td>
                <td style="text-align: right;">$ ${Math.round(utOperativaNeto).toLocaleString('es-CO')}</td>
              </tr>

              <tr><td>Cartera Activa Retenida en Patio (Fase Rampa)</td><td style="text-align: right; color: #06b6d4;">$ ${rampaTotal.toLocaleString('es-CO')}</td></tr>
            </tbody>
          </table>

          <div class="firma-section">
            <strong>SECCIÓN DE FIRMA CORPORATIVA</strong><br><br><br>
            W. Jeffry Urquijo Cubillos // Director de Inteligencia Nexus AI
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  renderLayout();
  await analizarEjercicioFinanciero();
}
