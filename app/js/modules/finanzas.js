import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function (container, state) {

  container.innerHTML = `
    <h1>💰 Finanzas del Taller</h1>

    <div id="kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;"></div>

    <canvas id="graficoIngresos" height="100"></canvas>
  `;

  const kpis = document.getElementById("kpis");

  async function cargarFinanzas() {

    const snap = await getDocs(collection(window.db, "ordenes"));

    let totalIngresos = 0;
    let totalCostos = 0;
    let totalUtilidad = 0;
    let ordenesCompletadas = 0;

    const ingresosPorDia = {};

    snap.forEach(doc => {
      const o = doc.data();

      const valor = Number(o.valorTrabajo || 0);
      const costo = Number(o.diagnosticoIA?.costoestimado || 0);

      totalIngresos += valor;
      totalCostos += costo;

      if (o.estado === "finalizada") {
        ordenesCompletadas++;
      }

      // Agrupar por fecha
      if (o.creadoEn) {
        const fecha = new Date(o.creadoEn.seconds * 1000)
          .toISOString()
          .split("T")[0];

        ingresosPorDia[fecha] = (ingresosPorDia[fecha] || 0) + valor;
      }
    });

    totalUtilidad = totalIngresos - totalCostos;

    // KPIs
    kpis.innerHTML = `
      <div class="card">💵 Ingresos: $${totalIngresos}</div>
      <div class="card">💸 Costos: $${totalCostos}</div>
      <div class="card">📈 Utilidad: $${totalUtilidad}</div>
      <div class="card">🧾 Órdenes finalizadas: ${ordenesCompletadas}</div>
    `;

    // Gráfico
    const ctx = document.getElementById("graficoIngresos");

    new Chart(ctx, {
      type: "line",
      data: {
        labels: Object.keys(ingresosPorDia),
        datasets: [{
          label: "Ingresos por día",
          data: Object.values(ingresosPorDia)
        }]
      }
    });
  }

  cargarFinanzas();
}