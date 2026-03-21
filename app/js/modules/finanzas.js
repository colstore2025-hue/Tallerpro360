/**
 * finanzas.js - V3 ULTRA
 * Dashboard Financiero Predictivo
 */
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { RevenueForecastAI } from "../ai/revenueForecastAI.js";

export default async function finanzasModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  const base = `empresas/${empresaId}`;
  const ia = new RevenueForecastAI();

  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen pb-24 text-white">
      <div class="mb-6">
        <h1 class="text-2xl font-black italic">CONTROL / <span class="text-cyan-400">FINANZAS</span></h1>
        <p class="text-[10px] text-slate-500 uppercase tracking-widest">Métrica de Rendimiento Real</p>
      </div>

      <div id="iaForecast" class="bg-gradient-to-br from-blue-600 to-purple-700 p-6 rounded-3xl shadow-2xl mb-6 relative overflow-hidden">
         <div class="absolute top-0 right-0 p-4 opacity-20 text-6xl"><i class="fas fa-brain"></i></div>
         <h4 class="text-xs font-bold uppercase opacity-80 mb-1">Predicción Fin de Mes</h4>
         <div id="txtProyeccion" class="text-3xl font-black">$0</div>
         <p id="txtSaludIA" class="text-[10px] mt-2 font-bold bg-black/20 inline-block px-2 py-1 rounded-lg">Analizando tendencia...</p>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="bg-[#0f172a] p-4 rounded-2xl border border-slate-800">
           <span class="text-[9px] text-slate-500 font-bold uppercase">Ingresos Reales</span>
           <div id="kpiIngresos" class="text-lg font-bold text-emerald-400">$0</div>
        </div>
        <div id="kpiAbiertoCard" class="bg-[#0f172a] p-4 rounded-2xl border border-slate-800">
           <span class="text-[9px] text-slate-500 font-bold uppercase">En el Taller (Potencial)</span>
           <div id="kpiAbierto" class="text-lg font-bold text-cyan-400">$0</div>
        </div>
      </div>

      <div class="bg-[#0f172a] p-4 rounded-3xl border border-slate-800">
        <h3 class="text-xs font-bold text-slate-500 mb-4 uppercase">Flujo de Caja Mensual</h3>
        <canvas id="graficaFlujo" class="w-full h-48"></canvas>
      </div>
    </div>
  `;

  async function render() {
    try {
      // 1. Obtener Datos
      const ordenesSnap = await getDocs(query(collection(db, `${base}/ordenes`), orderBy("creadoEn", "asc")));
      const ordenes = ordenesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 2. Ejecutar IA
      ia.setData(ordenes);
      const reporte = ia.calcularProyeccionFinDeMes();
      const salud = ia.analizarSalud();

      // 3. Actualizar Interfaz
      document.getElementById("txtProyeccion").innerText = `$${fmt(reporte.proyeccionFinalMes)}`;
      document.getElementById("txtSaludIA").innerText = salud;
      document.getElementById("kpiIngresos").innerText = `$${fmt(reporte.ingresosActuales)}`;
      document.getElementById("kpiAbierto").innerText = `$${fmt(reporte.potencialEnTaller)}`;

      // 4. Lógica de Gráfica (Simplificada para el ejemplo)
      renderGrafica(ordenes);

    } catch (e) {
      console.error(e);
      container.innerHTML += `<p class="text-red-500 text-xs">Error de sincronización financiera.</p>`;
    }
  }

  function fmt(v) { return new Intl.NumberFormat("es-CO").format(v || 0); }

  function renderGrafica(ordenes) {
    const ctx = document.getElementById("graficaFlujo");
    if (!ctx || typeof Chart === "undefined") return;
    
    // Agrupamos por día para la gráfica
    const dias = {};
    ordenes.forEach(o => {
      const fecha = o.creadoEn?.toDate ? o.creadoEn.toDate().getDate() : 'S/F';
      dias[fecha] = (dias[fecha] || 0) + Number(o.total || 0);
    });

    new Chart(ctx, {
      type: "line",
      data: {
        labels: Object.keys(dias),
        datasets: [{
          label: "Ingresos Diarios",
          data: Object.values(dias),
          borderColor: "#06b6d4",
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0
        }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { grid: { display: false } } } }
    });
  }

  render();
}
