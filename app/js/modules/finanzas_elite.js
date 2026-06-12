/**
 * 🧠 finanzas_elite.js - TALLERPRO360 QUANTUM-ERP AUDITOR
 * Estado de Resultados Dinámico, Auditoría Forense Automática y Generador de Informes Ejecutivos
 */
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function finanzasElite(container) {
  container.innerHTML = `<div class="p-10 text-center orbitron text-xs text-slate-500 animate-pulse">EXTRAYENDO MÉTRICAS CONSOLIDADAS QUANTUM...</div>`;

  const empresaId = (localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId") || "").trim();
  if (!empresaId) {
    container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron">ERROR DE SEGURIDAD: IDENTIDAD EMPRESARIAL NO VALIDADA</div>`;
    return;
  }

  let balanceEstructurado = { ingresos_mo: 0, ingresos_rep: 0, costos_rep: 0, costos_nomina: 0, gastos_fijos: 0, ajustes_auditoria: 0, rampa_activa: 0 };

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
            <p class="text-[9px] text-slate-500 font-mono tracking-[0.2em] mt-1">QUANTUM-ERP AUDITOR // AUTHORIZED BY W.J. URQUIJO</p>
          </div>
          <div class="flex flex-wrap gap-2 items-center bg-[#0d1117] p-3 rounded-xl border border-white/5 w-full lg:w-auto">
            <input type="date" id="fInicio" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10">
            <input type="date" id="fFin" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10">
            <button id="btnCalcularElite" class="px-4 py-2 bg-cyan-600 text-black text-[10px] font-black orbitron rounded-xl hover:bg-cyan-400 transition-all">CALCULAR MATRIX</button>
            <button id="btnBriefEjecutivo" class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-black text-[10px] font-black orbitron rounded-xl flex items-center gap-1">📋 BRIEF EJECUTIVO</button>
          </div>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-6xl">
          <div class="bg-[#0d1117] p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
            <span class="text-[9px] orbitron text-slate-400 uppercase tracking-widest block mb-4">Combustible Operativo / Balance</span>
            <div class="relative w-36 h-36 flex items-center justify-center rounded-full border-4 border-dashed border-red-500/30">
              <h2 id="txtUtilidadCentro" class="text-lg font-black orbitron text-white">$ 0</h2>
            </div>
          </div>

          <div class="md:col-span-2 space-y-4 flex flex-col justify-between">
            <div class="bg-red-950/20 border border-red-500/20 p-5 rounded-2xl">
              <span class="text-[8px] font-black orbitron text-red-400 block mb-1 uppercase tracking-widest">⚠️ AUTONOMÍA DE CAJA (RUNWAY)</span>
              <p id="txtRunway" class="text-xs text-slate-300 font-mono">Calculando días de supervivencia financiera basados en costos fijos y flujo real de caja...</p>
            </div>
            
            <div class="bg-cyan-950/20 border border-cyan-500/20 p-5 rounded-2xl">
              <span class="text-[8px] font-black orbitron text-cyan-400 block mb-1 uppercase tracking-widest">🧠 NEXUS-AI STRATEGIC INSIGHT</span>
              <p id="txtAlertaForense" class="text-xs text-slate-300 font-mono italic">Escaneando transacciones en busca de anomalías operacionales...</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-[#0d1117] p-4 rounded-xl border border-white/5"><span class="text-[8px] text-slate-400 block">INGRESOS OPERATIVOS</span><h3 id="elite-ingresos" class="text-lg font-black text-emerald-400">$ 0</h3></div>
          <div class="bg-[#0d1117] p-4 rounded-xl border border-white/5"><span class="text-[8px] text-slate-400 block">EGRESOS CONSOLIDADOS</span><h3 id="elite-egresos" class="text-lg font-black text-red-400">$ 0</h3></div>
          <div class="bg-[#0d1117] p-4 rounded-xl border border-white/5"><span class="text-[8px] text-slate-400 block">OPERACIÓN EN RAMPA (1305)</span><h3 id="elite-rampa" class="text-lg font-black text-cyan-400">$ 0</h3></div>
          <div class="bg-[#0d1117] p-4 rounded-xl border border-white/5"><span class="text-[8px] text-slate-400 block">AJUSTES AUDITORÍA (9999)</span><h3 id="elite-ajustes" class="text-lg font-black text-amber-500">$ 0</h3></div>
        </div>

        <div class="bg-[#0d1117] p-5 rounded-xl border border-white/5">
          <h3 class="text-xs font-black uppercase orbitron text-slate-400 mb-3 tracking-widest">PERFORMANCE & NÓMINA PASIVA</h3>
          <div id="gridNominaElite" class="grid grid-cols-1 md:grid-cols-3 gap-3"></div>
        </div>
      </div>`;

    const hoy = new Date();
    document.getElementById("fInicio").value = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    document.getElementById("fFin").value = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];

    document.getElementById("btnCalcularElite").onclick = analizarEjercicioFinanciero;
    document.getElementById("btnBriefEjecutivo").onclick = descargarBriefFinancieroCompleto;
  };

  const analizarEjercicioFinanciero = async () => {
    const strI = document.getElementById("fInicio").value;
    const strF = document.getElementById("fFin").value;

    Object.keys(balanceEstructurado).forEach(k => balanceEstructurado[k] = 0);

    if (window.NEXUS_ACCOUNTING_CONSOLIDATED) {
      Object.entries(window.NEXUS_ACCOUNTING_CONSOLIDATED).forEach(([per, data]) => {
        if (per >= strI.substring(0, 7) && per <= strF.substring(0, 7)) {
          Object.entries(data.cuentas).forEach(([puc, val]) => {
            if (puc.startsWith("413505")) balanceEstructurado.ingresos_mo += val;
            else if (puc.startsWith("413510")) balanceEstructurado.ingresos_rep += val;
            else if (puc.startsWith("6135")) balanceEstructurado.costos_rep += val;
            else if (puc.startsWith("5105")) balanceEstructurado.costos_nomina += val;
            else if (puc.startsWith("5120")) balanceEstructurado.gastos_fijos += val;
            else if (puc.startsWith("9999")) balanceEstructurado.ajustes_auditoria += val;
          });
        }
      });
    }

    try {
      const qOrd = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
      const snapOrd = await getDocs(qOrd);
      const nominaMap = {};

      snapOrd.docs.forEach(d => {
        const o = d.data();
        const total = safeNumber(o.total || 0);
        const est = String(o.estado || "").toUpperCase();

        if (['INGRESO', 'PROCESO', 'REPARACION'].includes(est)) balanceEstructurado.rampa_activa += total;

        if (['LISTO', 'ENTREGADO'].includes(est)) {
          const tec = o.tecnico_asignado || "MECÁNICO_PLANTA";
          if (!nominaMap[tec]) nominaMap[tec] = { total: 0, count: 0 };
          nominaMap[tec].total += (total * 0.30); // 30% Comisión Estándar SAP/Nexus
          nominaMap[tec].count++;
        }
      });

      renderNomina(nominaMap);
      actualizarPanelesUI();
    } catch (e) {
      console.error(e);
    }
  };

  const actualizarPanelesUI = () => {
    const ing = balanceEstructurado.ingresos_mo + balanceEstructurado.ingresos_rep;
    const eg = balanceEstructurado.costos_rep + balanceEstructurado.costos_nomina + balanceEstructurado.gastos_fijos;
    const neto = ing - eg + balanceEstructurado.ajustes_auditoria;

    document.getElementById("elite-ingresos").innerText = `$ ${Math.round(ing).toLocaleString('es-CO')}`;
    document.getElementById("elite-egresos").innerText = `$ ${Math.round(eg).toLocaleString('es-CO')}`;
    document.getElementById("elite-rampa").innerText = `$ ${Math.round(balanceEstructurado.rampa_activa).toLocaleString('es-CO')}`;
    document.getElementById("elite-ajustes").innerText = `$ ${Math.round(balanceEstructurado.ajustes_auditoria).toLocaleString('es-CO')}`;

    const txtCent = document.getElementById("txtUtilidadCentro");
    if (txtCent) {
      txtCent.innerText = `$ ${Math.round(neto).toLocaleString('es-CO')}`;
      txtCent.className = "text-md font-black orbitron " + (neto >= 0 ? "text-emerald-400" : "text-red-500");
    }

    // Algoritmos de Runway y Análisis Contable Forense Avanzado
    const costoDiario = eg / 30;
    const diasRunway = costoDiario > 0 ? Math.max(0, Math.round(neto / costoDiario)) : 999;
    document.getElementById("txtRunway").innerText = diasRunway <= 0 
      ? `🚨 CRÍTICO: 0 Días de Runway. El déficit operacional actual absorbió el fondo de caja.` 
      : `💡 AUTONOMÍA DE CAJA: Cuenta con ${diasRunway} días de vida financiera basados en el gasto fijo consolidado de $${Math.round(costoDiario).toLocaleString('es-CO')}/día.`;

    const txtAlerta = document.getElementById("txtAlertaForense");
    if (neto < 0) {
      txtAlerta.innerText = `ALERTA FORENSE: Déficit operacional detectado en el rango seleccionado. Tu costo diario consolidado es superior a la inyección de ingresos por servicios. Es imperativo revisar el diario de contabilidad.js y acelerar el recaudo de la cartera activa en patio ($${Math.round(balanceEstructurado.rampa_activa).toLocaleString('es-CO')}).`;
    } else {
      txtAlerta.innerText = `NEXUS-AI ANALYTICS: Estabilidad de rampa confirmada. Superávit saludable de $${Math.round(neto).toLocaleString('es-CO')}. Se aconseja provisionar el 15% para compras extemporáneas de insumos.`;
    }
  };

  const renderNomina = (mapa) => {
    const grid = document.getElementById("gridNominaElite");
    if (!grid) return;
    grid.innerHTML = Object.entries(mapa).map(([t, val]) => `
      <div class="bg-black/40 p-4 rounded-xl border border-white/5 flex justify-between items-center">
        <div>
          <span class="text-xs font-black uppercase text-slate-300 block">${t}</span>
          <span class="text-sm font-mono font-bold text-emerald-400">$ ${Math.round(val.total).toLocaleString('es-CO')}</span>
        </div>
        <span class="text-[10px] bg-white/5 px-2 py-1 rounded font-mono text-slate-400">${val.count} Órdenes</span>
      </div>`).join('');
  };

  const descargarBriefFinancieroCompleto = () => {
    // Generador de Copia de Informe en Formato Limpio de Impresión / Portapapeles Ejecutivo
    const ing = balanceEstructurado.ingresos_mo + balanceEstructurado.ingresos_rep;
    const eg = balanceEstructurado.costos_rep + balanceEstructurado.costos_nomina + balanceEstructurado.gastos_fijos;
    const neto = ing - eg + balanceEstructurado.ajustes_auditoria;

    const summaryText = `
    === BRIEF FINANCIERO EJECUTIVO TALLERPRO360 ===
    EMPRESA ID: ${empresaId}
    INGRESOS OPERATIVOS: $${Math.round(ing).toLocaleString('es-CO')}
    EGRESOS CONSOLIDADOS: $${Math.round(eg).toLocaleString('es-CO')}
    AJUSTES DE AUDITORÍA: $${Math.round(balanceEstructurado.ajustes_auditoria).toLocaleString('es-CO')}
    EJERCICIO NETO (EBITDA): $${Math.round(neto).toLocaleString('es-CO')}
    CARTERA EN PATIO (RAMPA): $${Math.round(balanceEstructurado.rampa_activa).toLocaleString('es-CO')}
    ==============================================
    `;
    
    navigator.clipboard.writeText(summaryText);
    Swal.fire("Brief Generado", "El balance ejecutivo ha sido copiado al portapapeles en formato limpio SAP estructurado.", "success");
  };

  renderLayout();
  await analizarEjercicioFinanciero();
}
