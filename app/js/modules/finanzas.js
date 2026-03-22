/**
 * finanzas.js - V3 ULTRA (Optimized & Economic)
 * Dashboard Financiero Predictivo con IA
 */
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { RevenueForecastAI } from "../ai/revenueForecastAI.js";

export default async function finanzasModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  const ia = new RevenueForecastAI();

  // 1. Estructura UI con Skeletons (UX de alta gama)
  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen pb-24 text-white animate-fade-in">
      <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-xl font-black italic tracking-tighter">FINANZAS / <span class="text-cyan-400 uppercase">Proyecciones</span></h1>
            <p class="text-[9px] text-slate-500 uppercase font-bold tracking-[0.2em]">Nexus-X Predictive Engine</p>
        </div>
        <div class="bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
            <span class="text-[10px] text-cyan-400 font-black animate-pulse">● LIVE</span>
        </div>
      </div>

      <div class="bg-gradient-to-br from-cyan-600 to-blue-800 p-6 rounded-[2rem] shadow-2xl mb-6 relative overflow-hidden group">
         <div class="absolute -right-4 -top-4 opacity-10 text-8xl group-hover:scale-110 transition-transform"><i class="fas fa-brain"></i></div>
         <h4 class="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Estimación Cierre de Mes</h4>
         <div id="txtProyeccion" class="text-4xl font-black tracking-tighter">$ ---.---</div>
         <div id="txtSaludIA" class="mt-3 text-[9px] font-black bg-black/30 backdrop-blur-md inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 uppercase">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div> Calculando Tendencia...
         </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
           <span class="text-[9px] text-slate-500 font-black uppercase tracking-widest block mb-1">Facturación Real</span>
           <div id="kpiIngresos" class="text-lg font-black text-emerald-400 tracking-tight">$0</div>
        </div>
        <div class="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
           <span class="text-[9px] text-slate-500 font-black uppercase tracking-widest block mb-1">Ventas en Taller</span>
           <div id="kpiAbierto" class="text-lg font-black text-cyan-400 tracking-tight">$0</div>
        </div>
      </div>

      <div class="bg-slate-900/40 p-5 rounded-[2rem] border border-slate-800/50">
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Flujo de Caja Mensual</h3>
            <i class="fas fa-chart-line text-cyan-500/50 text-xs"></i>
        </div>
        <canvas id="graficaFlujo" style="max-height: 180px;"></canvas>
      </div>
    </div>
  `;

  async function loadDataAndRender() {
    try {
      // 🎯 ECONOMÍA: Filtramos solo órdenes de los últimos 30 días
      const unMesAtras = new Date();
      unMesAtras.setDate(unMesAtras.getDate() - 30);

      const q = query(
        collection(db, `empresas/${empresaId}/ordenes`),
        where("creadoEn", ">=", unMesAtras),
        orderBy("creadoEn", "asc")
      );

      const snap = await getDocs(q);
      const ordenes = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 🧠 IA
      ia.setData(ordenes);
      const reporte = ia.calcularProyeccionFinDeMes();
      const salud = ia.analizarSalud();

      // UI Update
      document.getElementById("txtProyeccion").innerText = `$${fmt(reporte.proyeccionFinalMes)}`;
      document.getElementById("txtSaludIA").innerHTML = `<div class="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div> ${salud}`;
      document.getElementById("kpiIngresos").innerText = `$${fmt(reporte.ingresosActuales)}`;
      document.getElementById("kpiAbierto").innerText = `$${fmt(reporte.potencialEnTaller)}`;

      renderGrafica(ordenes);

    } catch (e) {
      console.error("Falla Financiera:", e);
      // Notificar a Nexus-X Logs
    }
  }

  function fmt(v) { return new Intl.NumberFormat("es-CO").format(v || 0); }

  function renderGrafica(ordenes) {
    const ctx = document.getElementById("graficaFlujo");
    if (!ctx || typeof Chart === "undefined") return;

    const labels = [];
    const data = [];
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
                grid: { display: false },
                ticks: { color: '#475569', font: { size: 9, weight: 'bold' } }
            } 
        }
      }
    });
  }

  loadDataAndRender();
}
