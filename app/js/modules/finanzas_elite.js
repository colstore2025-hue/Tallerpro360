/**
 * 🧠 finanzas_elite.js - TALLERPRO360 QUANTUM-ERP (MÓDULO CONTABLE N°. 02)
 * Versión 2.0.5 - Corrección Histórica de Fechas y Tipado de Transacción
 * Autor: TallerPRO360 Core & W.J. Urquijo
 */
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function finanzasElite(container) {
  container.innerHTML = `<div class="p-10 text-center orbitron text-xs text-cyan-400 animate-pulse">EJECUTANDO AUDITORÍA HISTÓRICA V2.0.5...</div>`;

  const empresaId = (localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId") || "").trim();
  if (!empresaId) {
    container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron">ERROR DE SEGURIDAD: IDENTIDAD EMPRESARIAL NO VALIDADA</div>`;
    return;
  }

  // Estructura de Balance Base
  let balanceEstructurado = {
    ingresos_mo: 0,         
    ingresos_rep: 0,        
    anticipos_diversos: 0,  
    costos_rep: 0,          
    gastos_personal: 0,     
    arriendos_servicios: 0, 
    gastos_diversos: 0      
  };

  // Convertidor ultra-seguro para asegurar extracción de datos (soporta int64, strings, nulos)
  const safeNumber = (v) => {
    if (typeof v === "number") return v;
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
            <p class="text-[9px] text-slate-500 font-mono tracking-[0.2em] mt-1">QUANTUM-ERP AUDITOR // MÓDULO CONTABLE N°. 02 // V2.0.5 // COMPATIBILIDAD HISTÓRICA FIRESTORE</p>
          </div>
          <div class="flex flex-wrap gap-2 items-center bg-[#0d1117] p-3 rounded-xl border border-white/5 w-full lg:w-auto">
            <input type="date" id="fInicio" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 font-mono">
            <input type="date" id="fFin" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 font-mono">
            <button id="btnCalcularElite" class="px-4 py-2 bg-cyan-600 text-black text-[10px] font-black orbitron rounded-xl hover:bg-cyan-400 transition-all">RECALCULAR</button>
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
              <p id="txtRunway" class="text-xs text-slate-300 font-mono">Calculando ciclos contables...</p>
            </div>
            
            <div class="bg-cyan-950/20 border border-cyan-500/20 p-5 rounded-2xl">
              <span class="text-[8px] font-black orbitron text-cyan-400 block mb-1 uppercase tracking-widest">🧠 NEXUS-AI AUDIT INSIGHT</span>
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

    // Reiniciar contadores del P&G
    Object.keys(balanceEstructurado).forEach(k => balanceEstructurado[k] = 0);
    let rampaActivaTotal = 0;

    try {
      // Modificamos la consulta para traer los registros de la empresa y resolver la discrepancia de fechas en la app (JS side)
      const qCont = query(
        collection(db, "contabilidad"), 
        where("empresaId", "==", empresaId)
      );
      
      const snapCont = await getDocs(qCont);

      snapCont.docs.forEach(docSnap => {
        const transaccion = docSnap.data();
        
        // Estrategia polimórfica para capturar la fecha real del documento físico
        let fechaDocumento = transaccion.fecha_registro || transaccion.fecha || transaccion.fecha_creacion || "";
        if (fechaDocumento && typeof fechaDocumento.toDate === "function") {
          fechaDocumento = fechaDocumento.toDate().toISOString().split('T')[0];
        }
        
        // Forzar filtrado de rango en el cliente para evitar problemas de índices compuestos rotos
        if (fechaDocumento < strI || fechaDocumento > strF) return;

        // Recuperar códigos PUC o fallbacks de transacciones antiguas
        const pucCode = String(transaccion.puc || transaccion.cuentaContable || transaccion.cuenta || "").trim();
        const tipoTransaccion = String(transaccion.tipo || transaccion.naturaleza || "").toLowerCase();
        
        let valMonto = safeNumber(transaccion.monto || transaccion.debito || transaccion.credito || 0);
        if (valMonto === 0) return;

        // LÓGICA REFORZADA DE ENRUTAMIENTO CONTABLE (PUC + Tipo de Fallback)
        if (pucCode.startsWith("413505") || tipoTransaccion === "ingreso_mano_obra") {
          balanceEstructurado.ingresos_mo += valMonto;
        } else if (pucCode.startsWith("413510") || tipoTransaccion === "venta_repuestos" || (tipoTransaccion === "ingreso" && pucCode.startsWith("4135"))) {
          balanceEstructurado.ingresos_rep += valMonto;
        } else if (pucCode.startsWith("1105") || tipoTransaccion === "anticipo" || tipoTransaccion === "ingreso") {
          // Si es un ingreso genérico de caja, mapear a acumulado preventivo
          balanceEstructurado.anticipos_diversos += valMonto;
        } else if (pucCode.startsWith("6135") || tipoTransaccion === "compra_repuestos") {
          balanceEstructurado.costos_rep += valMonto;
        } else if (pucCode.startsWith("5105") || tipoTransaccion === "nomina" || tipoTransaccion === "egreso_nomina") {
          balanceEstructurado.gastos_personal += valMonto;
        } else if (pucCode.startsWith("5120") || tipoTransaccion === "arriendo" || tipoTransaccion === "servicios") {
          balanceEstructurado.arriendos_servicios += valMonto;
        } else if (pucCode.startsWith("5195") || tipoTransaccion === "egreso" || tipoTransaccion === "gasto_diverso") {
          balanceEstructurado.gastos_diversos += valMonto;
        }
      });

      // Procesamiento de Órdenes en Patio / Rampa
      const qOrd = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
      const snapOrd = await getDocs(qOrd);
      const nominaMap = {};

      snapOrd.docs.forEach(d => {
        const o = d.data();
        const total = safeNumber(o.total || 0);
        const est = String(o.estado || "").toUpperCase();
        let fechaOT = o.fecha_creacion_manual || o.fecha_creacion || "";
        if (fechaOT && typeof fechaOT.toDate === "function") {
          fechaOT = fechaOT.toDate().toISOString().split('T')[0];
        } else {
          fechaOT = String(fechaOT).split('T')[0];
        }

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
      console.error("❌ Error en Auditoría Global v2.0.5:", e);
    }
  };

  const actualizarPanelesUI = (rampaActivaTotal) => {
    // Si la base de datos no usó PUC específicos, consolidamos ingresos globales detectados
    const totalIngresosFacturados = balanceEstructurado.ingresos_mo + balanceEstructurado.ingresos_rep;
    const egConsolidados = balanceEstructurado.costos_rep + balanceEstructurado.gastos_personal + 
                           balanceEstructurado.arriendos_servicios + balanceEstructurado.gastos_diversos;
    
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
      ? `🚨 ALERTA: 0 Días de Caja. El flujo operativo disponible está en rangos mínimos.` 
      : `💡 CAJA DISPONIBLE: ~ ${diasRunway} días de cobertura según ritmo de gasto actual ($${Math.round(costoDiario).toLocaleString('es-CO')}/día).`;

    document.getElementById("txtAlertaForense").innerText = utOperativaNeto < 0 
      ? `AUDITORÍA CONCLUIDA: Déficit detectado en rango seleccionado. Validar si existen facturas pendientes de asentar en contabilidad.`
      : `AUDITORÍA CONCLUIDA: Datos cruzados con éxito. P&G Operativo neto: $${Math.round(utOperativaNeto).toLocaleString('es-CO')}.`;
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
        <span class="text-[10px] bg-white/5 px-2 py-1 rounded font-mono text-slate-400">${val.count} OT</span>
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
    const margenEbitda = totalIngresosFacturados > 0 ? ((utOperativaNeto / totalIngresosFacturados) * 100).toFixed(2) : 0;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Estado_Resultados_Quantum_${empresaId}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; background-color: #ffffff; }
            .header-container { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
            .brand-title { font-weight: 800; font-size: 22px; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px; }
            .brand-subtitle { font-size: 9px; color: #64748b; font-family: monospace; tracking: 1px; }
            .meta-box { text-align: right; font-size: 11px; color: #334155; font-family: monospace; }
            .kpi-grid { display: flex; gap: 15px; margin-bottom: 30px; }
            .kpi-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: #f8fafc; }
            .kpi-title { font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase; }
            .kpi-value { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
            th { text-align: left; padding: 10px; color: #0f172a; border-bottom: 2px solid #0f172a; font-size: 10px; font-weight: 600; text-transform: uppercase; }
            td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
            .row-group { font-weight: 600; background-color: #f1f5f9; color: #0f172a; }
            .row-total { font-weight: 800; background-color: #0f172a; color: #ffffff; }
            .text-right { text-align: right; }
            .signature-block { margin-top: 60px; display: flex; justify-content: space-between; }
            .firma { border-top: 1px solid #cbd5e1; width: 45%; font-size: 10px; color: #475569; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <div class="brand-title">TallerPRO360 ERP Contable</div>
              <div class="brand-subtitle font-mono">ESTADO DE RESULTADOS // GENERACIÓN DE BALANCE HISTÓRICO</div>
            </div>
            <div class="meta-box">
              <strong>ID ESTABLECIMIENTO:</strong> ${empresaId}<br>
              <strong>CICLO FISCAL:</strong> ${strI} al ${strF}<br>
              <strong>CONTROL AUDITOR:</strong> CERTIFICADO v2.0.5
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-title">UTILIDAD OPERATIVA (EBITDA)</div>
              <div class="kpi-value" style="color: ${utOperativaNeto >= 0 ? '#16a34a' : '#dc2626'}">$ ${Math.round(utOperativaNeto).toLocaleString('es-CO')}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">RENDIMIENTO MARGEN</div>
              <div class="kpi-value">${margenEbitda}%</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title font-bold text-blue-600">PROYECCIÓN DE COBRO EN RAMPA</div>
              <div class="kpi-value">$ ${Math.round(rampaTotal).toLocaleString('es-CO')}</div>
            </div>
          </div>

          <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">Estado de Pérdidas y Ganancias (P&G)</h3>
          <table>
            <thead>
              <tr>
                <th>Cuentas Contables Registradas (Mapeo Completo)</th>
                <th class="text-right">Balance Total</th>
              </tr>
            </thead>
            <tbody>
              <tr class="row-group"><td colspan="2">INGRESOS DE OPERACIÓN</td></tr>
              <tr><td>&nbsp;&nbsp;&nbsp;&nbsp;(+) Mano de Obra Ejecutada (PUC 413505 / Servicios)</td><td class="text-right">$ ${Math.round(balanceEstructurado.ingresos_mo).toLocaleString('es-CO')}</td></tr>
              <tr><td>&nbsp;&nbsp;&nbsp;&nbsp;(+) Ventas de Repuestos e Insumos (PUC 413510)</td><td class="text-right">$ ${Math.round(balanceEstructurado.ingresos_rep).toLocaleString('es-CO')}</td></tr>
              <tr style="font-weight: 600; color: #16a34a;"><td>(=) TOTAL DE INGRESOS OPERATIVOS RECAUDADOS</td><td class="text-right">$ ${Math.round(totalIngresosFacturados).toLocaleString('es-CO')}</td></tr>
              
              <tr class="row-group"><td colspan="2">COSTOS Y GASTOS OPERATIVOS</td></tr>
              <tr><td>&nbsp;&nbsp;&nbsp;&nbsp;(-) Costo de Ventas en Repuestos (PUC 6135)</td><td class="text-right">$ ${Math.round(balanceEstructurado.costos_rep).toLocaleString('es-CO')}</td></tr>
              <tr><td>&nbsp;&nbsp;&nbsp;&nbsp;(-) Gastos Administrativos y Operarios (PUC 5105)</td><td class="text-right">$ ${Math.round(balanceEstructurado.gastos_personal).toLocaleString('es-CO')}</td></tr>
              <tr><td>&nbsp;&nbsp;&nbsp;&nbsp;(-) Cuentas de Arrendamiento y Servicios (PUC 5120)</td><td class="text-right">$ ${Math.round(balanceEstructurado.arriendos_servicios).toLocaleString('es-CO')}</td></tr>
              <tr><td>&nbsp;&nbsp;&nbsp;&nbsp;(-) Egresos Varios / Gastos de Caja (PUC 5195)</td><td class="text-right">$ ${Math.round(balanceEstructurado.gastos_diversos).toLocaleString('es-CO')}</td></tr>
              <tr style="font-weight: 600; color: #dc2626;"><td>(=) TOTAL DE GASTOS ASENTADOS</td><td class="text-right">$ ${Math.round(egConsolidados).toLocaleString('es-CO')}</td></tr>
              
              <tr class="row-total">
                <td>UTILIDAD OPERATIVA LIQUIDA (MESA DIRECTIVA)</td>
                <td class="text-right">$ ${Math.round(utOperativaNeto).toLocaleString('es-CO')}</td>
              </tr>
            </tbody>
          </table>

          <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; margin-top: 20px; margin-bottom: 8px;">Disponibilidad de Fondos Adicionales</h3>
          <table>
            <tbody>
              <tr><td style="width: 70%;">Efectivo en Caja / Anticipos Acumulados (PUC 1105)</td><td class="text-right" style="font-weight: 600; color: #b45309;">$ ${Math.round(balanceEstructurado.anticipos_diversos).toLocaleString('es-CO')}</td></tr>
            </tbody>
          </table>

          <div class="signature-block">
            <div class="firma">
              <strong>W. Jeffry Urquijo Cubillos</strong><br>
              Auditor e Ingeniero de Sistemas - Nexus AI
            </div>
            <div class="firma">
              <strong>Mesa Directiva</strong><br>
              Aprobación de Balance General
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  renderLayout();
  await analizarEjercicioFinanciero();
}
