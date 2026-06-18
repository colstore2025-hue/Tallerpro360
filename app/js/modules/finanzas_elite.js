/**
 * 🧠 finanzas_elite.js - TALLERPRO360 QUANTUM-ERP AUDITOR (MÓDULO CONTABLE N°. 02)
 * Estado de Resultados Integral Forense, Sincronización PUC Reactiva y Generador PDF Corporativo
 * Autor: TallerPRO360 Core & W.J. Urquijo
 * Versión: 2026 - Optimizado para Junta de Socios
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

  // Estructura matricial de cuentas realineada a nivel de Grupo/Cuenta Principal (4 dígitos)
  let balanceEstructurado = {
    ingresos_mo: 0,         // Cuenta 413505 o subcuentas de servicios
    ingresos_rep: 0,        // Cuenta 413510 o subcuentas de repuestos
    anticipos_diversos: 0,  // Cuenta 1105 (Efectivo/Caja)
    costos_rep: 0,          // Cuenta 6135 (Costos directos)
    gastos_personal: 0,     // Cuenta 5105 (Nómina)
    arriendos_servicios: 0, // Cuenta 5120 (Arriendos)
    gastos_diversos: 0      // Cuenta 5195 (Diversos/Insumos)
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
            <span class="text-[9px] orbitron text-slate-400 uppercase tracking-widest block mb-4">Utilidad Neta del Ejercicio / Balance</span>
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

    Object.keys(balanceEstructurado).forEach(k => balanceEstructurado[k] = 0);
    let rampaActivaTotal = 0;

    try {
      // CORRECCIÓN REQUERIDA: Apuntar al campo exacto "fecha_registro" utilizado en contabilidad.js
      const qCont = query(
        collection(db, "contabilidad"), 
        where("empresaId", "==", empresaId),
        where("fecha_registro", ">=", strI),
        where("fecha_registro", "<=", strF)
      );
      
      const snapCont = await getDocs(qCont);

      snapCont.docs.forEach(docSnap => {
        const transaccion = docSnap.data();
        const pucCode = String(transaccion.puc || transaccion.cuentaContable || "").trim();
        
        // Extraer valores debito/credito de forma homologada con el motor contable principal
        let debito = parseFloat(transaccion.debito ?? 0);
        let credito = parseFloat(transaccion.credito ?? 0);
        if (debito === 0 && credito === 0 && transaccion.monto) {
          if (pucCode.startsWith("4") || pucCode.startsWith("11")) debito = parseFloat(transaccion.monto);
          else credito = parseFloat(transaccion.monto);
        }
        const valMonto = debito > 0 ? debito : credito;

        // Clasificación robusta basada en raíces del PUC Maestro Colombiano
        if (pucCode === "413505") {
          balanceEstructurado.ingresos_mo += valMonto;
        } else if (pucCode === "413510") {
          balanceEstructurado.ingresos_rep += valMonto;
        } else if (pucCode.startsWith("1105")) {
          balanceEstructurado.anticipos_diversos += valMonto;
        } else if (pucCode.startsWith("6135")) {
          balanceEstructurado.costos_rep += valMonto;
        } else if (pucCode.startsWith("5105")) {
          balanceEstructurado.gastos_personal += valMonto;
        } else if (pucCode.startsWith("5120")) {
          balanceEstructurado.arriendos_servicios += valMonto;
        } else if (pucCode.startsWith("5195")) {
          balanceEstructurado.gastos_diversos += valMonto;
        }
      });

      const qOrd = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
      const snapOrd = await getDocs(qOrd);
      const nominaMap = {};

      snapOrd.docs.forEach(d => {
        const o = d.data();
        const total = safeNumber(o.total || 0);
        const est = String(o.estado || "").toUpperCase();
        const fechaOT = o.fecha_creacion_manual ? o.fecha_creacion_manual.split('T')[0] : "";

        if (['INGRESO', 'PROCESO', 'REPARACION'].includes(est)) {
          rampaActivaTotal += total;
        }

        if (['LISTO', 'ENTREGADO'].includes(est) && fechaOT >= strI && fechaOT <= strF) {
          const tec = o.tecnico_asignado || "MECÁNICO_PLANTA";
          if (!nominaMap[tec]) nominaMap[tec] = { total: 0, count: 0 };
          nominaMap[tec].total += (total * 0.30);
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
    // Ingresos Operativos Totales del Taller (Servicios + Repuestos)
    const totalIngresosFacturados = balanceEstructurado.ingresos_mo + balanceEstructurado.ingresos_rep;
    const egConsolidados = balanceEstructurado.costos_rep + balanceEstructurado.gastos_personal + 
                           balanceEstructurado.arriendos_servicios + balanceEstructurado.gastos_diversos;
    
    // EBITDA Real sobre lo devengado
    const utOperativaNeto = totalIngresosFacturados - egConsolidados;

    document.getElementById("elite-ingresos").innerText = `$ ${Math.round(totalIngresosFacturados).toLocaleString('es-CO')}`;
    document.getElementById("elite-egresos").innerText = `$ ${Math.round(egConsolidados).toLocaleString('es-CO')}`;
    document.getElementById("elite-rampa").innerText = `$ ${Math.round(rampaActivaTotal).toLocaleString('es-CO')}`;
    document.getElementById("elite-ajustes").innerText = `$ ${Math.round(balanceEstructurado.anticipos_diversos).toLocaleString('es-CO')}`;

    const txtCent = document.getElementById("txtUtilidadCentro");
    if (txtCent) {
      txtCent.innerText = `$ ${Math.round(utOperativaNeto).toLocaleString('es-CO')}`;
      txtCent.className = "text-sm font-black orbitron px-2 " + (utOperativaNeto >= 0 ? "text-emerald-400" : "text-red-500");
    }

    const costoDiario = egConsolidados / 30;
    const diasRunway = costoDiario > 0 ? Math.max(0, Math.round((balanceEstructurado.anticipos_diversos) / costoDiario)) : 999;
    
    document.getElementById("txtRunway").innerText = diasRunway <= 0 
      ? `🚨 CRÍTICO: 0 Días de Runway. El flujo disponible en caja no cubre el gasto fijo diario consolidado.` 
      : `💡 AUTONOMÍA DE CAJA DISPONIBLE: Se cuenta con aprox. ${diasRunway} días de vida de caja basándose en un gasto operativo de $${Math.round(costoDiario).toLocaleString('es-CO')}/día.`;

    const txtAlerta = document.getElementById("txtAlertaForense");
    if (utOperativaNeto < 0) {
      txtAlerta.innerText = `ALERTA FORENSE: Pérdida operativa en el rango seleccionado. Monitorear costos de adquisición y acelerar el ciclo de facturación vehicular en rampa ($${Math.round(rampaActivaTotal).toLocaleString('es-CO')}).`;
    } else {
      txtAlerta.innerText = `NEXUS-AI ANALYTICS: Margen neto operativo saludable de $${Math.round(utOperativaNeto).toLocaleString('es-CO')}. Rendimiento óptimo en el punto de equilibrio estructural.`;
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

    const totalIngresosFacturados = balanceEstructurado.ingresos_mo + balanceEstructurado.ingresos_rep;
    const egConsolidados = balanceEstructurado.costos_rep + balanceEstructurado.gastos_personal + 
                           balanceEstructurado.arriendos_servicios + balanceEstructurado.gastos_diversos;
    const utOperativaNeto = totalIngresosFacturados - egConsolidados;
    const rampaTotal = safeNumber(document.getElementById("elite-rampa").innerText.replace(/[^0-9]/g, ''));

    // Indicadores clave para la mesa directiva
    const margenEbitda = totalIngresosFacturados > 0 ? ((utOperativaNeto / totalIngresosFacturados) * 100).toFixed(2) : 0;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Estado_Resultados_Corporativo_${empresaId}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 50px; line-height: 1.6; bg-color: #ffffff; }
            .header-container { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
            .brand-title { font-weight: 800; font-size: 24px; color: #0f172a; letter-spacing: -1px; text-transform: uppercase; }
            .brand-subtitle { font-size: 10px; color: #64748b; font-family: monospace; tracking: 2px; }
            .meta-box { text-align: right; font-size: 11px; color: #334155; font-family: monospace; }
            
            .kpi-grid { display: grid; grid-cols: 3; display: flex; gap: 15px; margin-bottom: 35px; }
            .kpi-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background: #f8fafc; }
            .kpi-title { font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            .kpi-value { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 5px; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { text-align: left; padding: 12px 10px; color: #0f172a; border-bottom: 2px solid #0f172a; font-size: 11px; font-weight: 600; text-transform: uppercase; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
            
            .row-group { font-weight: 600; background-color: #f1f5f9; color: #0f172a; }
            .row-total { font-weight: 800; background-color: #0f172a; color: #ffffff; }
            .text-right { text-align: right; }
            
            .signature-block { margin-top: 80px; display: flex; justify-content: space-between; }
            .firma { border-top: 1px solid #cbd5e1; width: 45%; pt-8px; font-size: 11px; color: #475569; padding-top: 10px; }
            @media print { body { padding: 20px; } .kpi-card { background: #f8fafc !important; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <div class="brand-title">TallerPRO360 Quantum-ERP</div>
              <div class="brand-subtitle">AUDITORÍA FORENSE // INFORME GERENCIAL DE RENDIMIENTO</div>
            </div>
            <div class="meta-box">
              <strong>NIT / ID EMPRESA:</strong> ${empresaId}<br>
              <strong>PERÍODO EVALUADO:</strong> ${strI} <=> ${strF}<br>
              <strong>FECHA DE EMISIÓN:</strong> 2026-06-18
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-title">EBITDA MESA DIRECTIVA</div>
              <div class="kpi-value" style="color: ${utOperativaNeto >= 0 ? '#16a34a' : '#dc2626'}">$ ${Math.round(utOperativaNeto).toLocaleString('es-CO')}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">MARGEN OPERATIVO</div>
              <div class="kpi-value">${margenEbitda}%</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">VALOR INMOVILIZADO PATIO</div>
              <div class="kpi-value" style="color: #2563eb">$ ${Math.round(rampaTotal).toLocaleString('es-CO')}</div>
            </div>
          </div>

          <h3 style="font-size: 14px; font-weight: 800; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">Estado de Resultados Integral (P&G)</h3>
          <table>
            <thead>
              <tr>
                <th>Estructura de Cuentas PUC (Grupo Estándar)</th>
                <th class="text-right">Balance Consolidado</th>
              </tr>
            </thead>
            <tbody>
              <tr class="row-group"><td colspan="2">4. INGRESOS</td></tr>
              <tr><td>&nbsp;&nbsp;&nbsp;&nbsp;(+) Ingresos por Mano de Obra / Servicios (413505)</td><td class="text-right">$ ${Math.round(balanceEstructurado.ingresos_mo).toLocaleString('es-CO')}</td></tr>
              <tr><td>&nbsp;&nbsp;&nbsp;&nbsp;(+) Ingresos por Venta de Repuestos e Insumos (413510)</td><td class="text-right">$ ${Math.round(balanceEstructurado.ingresos_rep).toLocaleString('es-CO')}</td></tr>
              <tr style="font-weight: 600; color: #16a34a;"><td>(=) TOTAL INGRESOS OPERATIVOS FACTURADOS</td><td class="text-right">$ ${Math.round(totalIngresosFacturados).toLocaleString('es-CO')}</td></tr>
              
              <tr class="row-group"><td colspan="2">5 & 6. COSTOS Y GASTOS OPERATIVOS</td></tr>
              <tr><td>&nbsp;&nbsp;&nbsp;&nbsp;(-) Costos de Adquisición / Compras de Repuestos (6135)</td><td class="text-right">$ ${Math.round(balanceEstructurado.costos_rep).toLocaleString('es-CO')}</td></tr>
              <tr><td>&nbsp;&nbsp;&nbsp;&nbsp;(-) Gastos de Personal y Operarios de Planta (5105)</td><td class="text-right">$ ${Math.round(balanceEstructurado.gastos_personal).toLocaleString('es-CO')}</td></tr>
              <tr><td>&nbsp;&nbsp;&nbsp;&nbsp;(-) Arrendamientos y Servicios Públicos (5120)</td><td class="text-right">$ ${Math.round(balanceEstructurado.arriendos_servicios).toLocaleString('es-CO')}</td></tr>
              <tr><td>&nbsp;&nbsp;&nbsp;&nbsp;(-) Gastos Diversos / Insumos Operacionales (5195)</td><td class="text-right">$ ${Math.round(balanceEstructurado.gastos_diversos).toLocaleString('es-CO')}</td></tr>
              <tr style="font-weight: 600; color: #dc2626;"><td>(=) TOTAL EGRESOS Y COSTOS DE OPERACIÓN</td><td class="text-right">$ ${Math.round(egConsolidados).toLocaleString('es-CO')}</td></tr>
              
              <tr class="row-total">
                <td>UTILIDAD OPERATIVA NETO (EBITDA DE JUNTA)</td>
                <td class="text-right">$ ${Math.round(utOperativaNeto).toLocaleString('es-CO')}</td>
              </tr>
            </tbody>
          </table>

          <h3 style="font-size: 14px; font-weight: 800; text-transform: uppercase; margin-top: 30px; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">Cuentas de Balance de Caja y Proyección</h3>
          <table>
            <tbody>
              <tr><td style="width: 70%;">Anticipos Recibidos y Líquido Disponible en Caja (110505)</td><td class="text-right" style="font-weight: 600; color: #d97706;">$ ${Math.round(balanceEstructurado.anticipos_diversos).toLocaleString('es-CO')}</td></tr>
              <tr><td>Cartera Pendiente por Liberar (Vehículos Retenidos en Rampa)</td><td class="text-right" style="font-weight: 600; color: #2563eb;">$ ${Math.round(rampaTotal).toLocaleString('es-CO')}</td></tr>
            </tbody>
          </table>

          <div class="signature-block">
            <div class="firma">
              <strong>W. Jeffry Urquijo Cubillos</strong><br>
              Director de Inteligencia / Auditor de Sistemas Nexus AI
            </div>
            <div class="firma">
              <strong>Mesa Directiva / Junta de Socios</strong><br>
              Representante Legal - TallerPRO360
            </div>
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
