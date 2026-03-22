/**
 * finanzas.js - V3.5 ULTRA (Predictive & Visual)
 * Dashboard Financiero con Barra de Progreso y Motor de IA Nexus-X
 */
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { RevenueForecastAI } from "../ai/revenueForecastAI.js";

export default async function finanzasModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  const ia = new RevenueForecastAI();

  // 1. ESTRUCTURA UI CON PROGRESS TRACKER
  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen pb-24 text-white animate-fade-in">
      
      <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-xl font-black italic tracking-tighter">FINANZAS / <span class="text-cyan-400 uppercase">Proyecciones</span></h1>
            <p class="text-[9px] text-slate-500 uppercase font-bold tracking-[0.2em]">Nexus-X Predictive Engine</p>
        </div>
        <div id="badgeConfianza" class="bg-slate-800 border border-slate-700 px-3 py-1 rounded-full transition-all">
            <span class="text-[9px] text-slate-400 font-black uppercase tracking-widest">Sincronizando...</span>
        </div>
      </div>

      <div class="bg-gradient-to-br from-cyan-600 to-blue-800 p-6 rounded-[2.5rem] shadow-2xl mb-6 relative overflow-hidden group border border-white/10">
         <div class="absolute -right-4 -top-4 opacity-10 text-8xl group-hover:scale-110 transition-transform"><i class="fas fa-brain"></i></div>
         
         <h4 class="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Estimación Cierre de Mes</h4>
         <div id="txtProyeccion" class="text-4xl font-black tracking-tighter mb-4">$ ---.---</div>
         
         <div class="space-y-2 mb-4">
            <div class="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-80">
                <span>Progreso Real</span>
                <span id="txtPorcentaje">0%</span>
            </div>
            <div class="w-full h-3 bg-black/30 rounded-full overflow-hidden border border-white/5">
                <div id="barProgreso" class="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] transition-all duration-1000 ease-out" style="width: 0%"></div>
            </div>
         </div>

         <div id="txtSaludIA" class="text-[9px] font-black bg-black/30 backdrop-blur-md inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 uppercase">
            <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> Analizando tendencia...
         </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-slate-900/50 p-4 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
           <span class="text-[9px] text-slate-500 font-black uppercase tracking-widest block mb-1">Facturación Real</span>
           <div id="kpiIngresos" class="text-xl font-black text-emerald-400 tracking-tight">$0</div>
        </div>
        <div class="bg-slate-900/50 p-4 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
           <span class="text-[9px] text-slate-500 font-black uppercase tracking-widest block mb-1">En el Taller</span>
           <div id="kpiAbierto" class="text-xl font-black text-cyan-400 tracking-tight">$0</div>
        </div>
      </div>

      <div class="bg-slate-900/40 p-5 rounded-[2.5rem] border border-slate-800/50">
        <div class="flex justify-between items-center mb-6 px-2">
            <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Histórico Diario</h3>
            <div class="flex items-center gap-2 text-[9px] font-bold text-cyan-500/50">
                <i class="fas fa-wave-square"></i>
                <span>FLUJO ACTIVO</span>
            </div>
        </div>
        <canvas id="graficaFlujo" style="max-height: 160px;"></canvas>
      </div>
    </div>
  `;

  async function loadDataAndRender() {
    try {
      const unMesAtras = new Date();
      unMesAtras.setDate(unMesAtras.getDate() - 30);

      const q = query(
        collection(db, `empresas/${empresaId}/ordenes`),
        where("creadoEn", ">=", unMesAtras),
        orderBy("creadoEn", "asc")
      );

      const snap = await getDocs(q);
      const ordenes = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 🧠 MOTOR DE IA
      ia.setData(ordenes);
      const reporte = ia.calcularProyeccionFinDeMes();
      const salud = ia.analizarSalud();

      // 📊 CÁLCULO DE PROGRESO VISUAL
      const porcentaje = Math.min(100, Math.round((reporte.ingresosActuales / (reporte.proyeccionFinalMes || 1)) * 100));

      // UI UPDATES
      document.getElementById("txtProyeccion").innerText = `$${fmt(reporte.proyeccionFinalMes)}`;
      document.getElementById("kpiIngresos").innerText = `$${fmt(reporte.ingresosActuales)}`;
      document.getElementById("kpiAbierto").innerText = `$${fmt(reporte.potencialEnTaller)}`;
      document.getElementById("txtPorcentaje").innerText = `${porcentaje}%`;
      
      // Animación de barra
      setTimeout(() => {
          document.getElementById("barProgreso").style.width = `${porcentaje}%`;
      }, 300);

      // Badge de Confianza
      const badge = document.getElementById("badgeConfianza");
      const colorConfianza = reporte.confianza === "Alta" ? "text-emerald-400 border-emerald-500/30" : (reporte.confianza === "Media" ? "text-cyan-400 border-cyan-500/30" : "text-amber-400 border-amber-500/30");
      badge.className = `border px-3 py-1 rounded-full transition-all ${colorConfianza} bg-black/20`;
      badge.innerHTML = `<span class="text-[9px] font-black uppercase tracking-widest">Confianza ${reporte.confianza}</span>`;

      document.getElementById("txtSaludIA").innerHTML = `<div class="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div> ${salud}`;

      renderGrafica(ordenes);

    } catch (e) {
      console.error("Falla Nexus-X Finance:", e);
    }
  }

  function fmt(v) { return new Intl.NumberFormat("es-CO").format(v || 0); }

  function renderGrafica(ordenes) {
    const ctx = document.getElementById("graficaFlujo");
    if (!ctx || typeof Chart === "undefined") return;

    const agrupado = {};
    ordenes.forEach(o => {
        const d = o.creadoEn?.toDate ? o.creadoEn.toDate().getDate() : '?';
        agrupado[d] = (agrupado[d] || 0) + Number(o.total || 0);
    });

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: Object.keys(agrupado),
        datasets: [{
          data: Object.values(agrupado),
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { 
            y: { display: false }, 
            x: { 
                grid: { display: false, drawBorder: false },
                ticks: { color: '#475569', font: { size: 9, weight: 'bold' } }
            } 
        }
      }
    });
  }

  loadDataAndRender();
}
