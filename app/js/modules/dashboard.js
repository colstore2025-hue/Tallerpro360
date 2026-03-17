import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function dashboard(container) {

  container.innerHTML = `
    <h1>📊 Dashboard Gerencial</h1>

    <div id="kpis" style="
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
      gap:15px;
      margin-top:20px;
    "></div>

    <canvas id="graficoIngresos" height="100"></canvas>

    <div id="alertas" style="margin-top:20px;"></div>
  `;

  const kpis = document.getElementById("kpis");
  const alertasDiv = document.getElementById("alertas");

  async function cargarDashboard() {

    const ordenesSnap = await getDocs(collection(window.db, "ordenes"));
    const clientesSnap = await getDocs(collection(window.db, "clientes"));

    let ingresos = 0;
    let ordenesActivas = 0;
    let ordenesFinalizadas = 0;
    let alertas = [];

    const ingresosPorDia = {};

    ordenesSnap.forEach(doc => {
      const o = doc.data();

      const valor = Number(o.valorTrabajo || 0);
      ingresos += valor;

      if (o.estado === "abierta" || o.estado === "en_proceso") {
        ordenesActivas++;
      }

      if (o.estado === "finalizada") {
        ordenesFinalizadas++;
      }

      // Alertas IA
      if (o.alertasIA && o.alertasIA.length > 0) {
        alertas.push(...o.alertasIA);
      }

      // Agrupar por fecha
      if (o.creadoEn) {
        const fecha = new Date(o.creadoEn.seconds * 1000)
          .toISOString()
          .split("T")[0];

        ingresosPorDia[fecha] = (ingresosPorDia[fecha] || 0) + valor;
      }
    });

    const totalClientes = clientesSnap.size;

    // KPIs
    kpis.innerHTML = `
      <div class="card">💵 Ingresos: $${ingresos}</div>
      <div class="card">🧾 Activas: ${ordenesActivas}</div>
      <div class="card">✅ Finalizadas: ${ordenesFinalizadas}</div>
      <div class="card">👥 Clientes: ${totalClientes}</div>
    `;

    // Gráfico
    const ctx = document.getElementById("graficoIngresos");

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(ingresosPorDia),
        datasets: [{
          label: "Ingresos diarios",
          data: Object.values(ingresosPorDia)
        }]
      }
    });

    // Alertas IA
    if (alertas.length > 0) {
      alertasDiv.innerHTML = `
        <h3>⚠️ Alertas IA</h3>
        ${alertas.map(a => `<div style="color:#ff4d4d;">• ${a}</div>`).join("")}
      `;
    } else {
      alertasDiv.innerHTML = `<h3>✅ Sin alertas</h3>`;
    }
  }

  cargarDashboard();
}