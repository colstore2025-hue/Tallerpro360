/*
=========================================================
dashboard.js - Dashboard Gerencial Premium Futurista
TallerPRO360 - Última Generación
=========================================================
*/

import { db } from "../core/firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const chartJsCDN = "https://cdn.jsdelivr.net/npm/chart.js";

export async function dashboard(container, userId) {
  container.innerHTML = `
<h1 style="font-size:32px;color:#00ff88;margin-bottom:20px;">🚀 Dashboard Gerencial</h1>

<div style="display:flex; flex-wrap:wrap; gap:20px; margin-bottom:40px;">
  <div class="card-neon" id="ordenesDia">Órdenes Hoy: 0</div>
  <div class="card-neon" id="ingresosDia">Ingresos Hoy: $0</div>
  <div class="card-neon" id="gananciaDia">Ganancia Neta Hoy: $0</div>
  <div class="card-neon" id="clientesNuevos">Clientes Nuevos Hoy: 0</div>
</div>

<div style="display:flex; flex-wrap:wrap; gap:30px; margin-bottom:40px;">
  <canvas id="graficaEstado" class="chart-neon"></canvas>
  <canvas id="graficaTecnicos" class="chart-neon"></canvas>
</div>

<div style="margin-bottom:40px;">
  <canvas id="graficaIngresosSemana" class="chart-neon" style="height:350px;"></canvas>
</div>

<div>
  <h3 style="color:#00ff88;">Alertas Críticas</h3>
  <ul id="alertasOrdenes" style="color:#ff0055;"></ul>
</div>

<style>
  .card-neon {
    background:#0f172a;
    padding:25px;
    border-radius:12px;
    flex:1;
    min-width:200px;
    font-size:18px;
    font-weight:bold;
    color:#00ff88;
    text-shadow: 0 0 10px #00ff88;
    border:1px solid #00ff88;
  }
  .chart-neon {
    background:#1e293b;
    border-radius:12px;
    padding:15px;
  }
</style>
`;

  if (!window.Chart) await cargarChartJS();
  await actualizarDashboard();

  async function actualizarDashboard() {
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

    const ordenesSnap = await getDocs(query(collection(db, "ordenes"), orderBy("fecha", "desc")));
    const clientesSnap = await getDocs(collection(db, "clientes"));

    let ordenesDia = 0, ingresosDia = 0, costosDia = 0, clientesNuevos = 0, gananciaDia = 0;
    const estadoConteo = { Recepción: 0, Reparación: 0, Entregado: 0 };
    const tecnicoConteo = {};
    const tiempoTecnico = [];
    const alertas = [];

    ordenesSnap.forEach(docSnap => {
      const o = docSnap.data();
      const fecha = o.fecha.toDate();
      if (fecha >= inicioDia && fecha < finDia) {
        ordenesDia++;
        ingresosDia += Number(o.total || 0);
        costosDia += Number(o.costoTotal || 0);
      }
      estadoConteo[o.estado] = (estadoConteo[o.estado] || 0) + 1;

      if (o.tecnico) {
        tecnicoConteo[o.tecnico] = (tecnicoConteo[o.tecnico] || 0) + 1;
        if (o.tiempoEstimado) tiempoTecnico.push({ tecnico: o.tecnico, tiempo: Number(o.tiempoEstimado) });
      }

      if (o.estado !== "Entregado" && (hoy - fecha) / (1000 * 60 * 60) > 48) {
        alertas.push(`⚠️ Orden de ${o.clientePhone || o.clienteId} retrasada >48h`);
      }
    });

    clientesSnap.forEach(docSnap => {
      const c = docSnap.data();
      const fechaRegistro = c.createdAt?.toDate?.() || new Date(0);
      if (fechaRegistro >= inicioDia && fechaRegistro < finDia) clientesNuevos++;
    });

    gananciaDia = ingresosDia - costosDia;

    // KPIs
    document.getElementById("ordenesDia").innerText = `Órdenes Hoy: ${ordenesDia}`;
    document.getElementById("ingresosDia").innerText = `Ingresos Hoy: $${ingresosDia.toLocaleString()}`;
    document.getElementById("gananciaDia").innerText = `Ganancia Neta Hoy: $${gananciaDia.toLocaleString()}`;
    document.getElementById("clientesNuevos").innerText = `Clientes Nuevos Hoy: ${clientesNuevos}`;

    // Alertas
    const alertasContainer = document.getElementById("alertasOrdenes");
    alertasContainer.innerHTML = alertas.length ? alertas.map(a => `<li>${a}</li>`).join("") : "<li>No hay alertas críticas</li>";

    // Gráficas
    generarGraficaEstado(estadoConteo);
    generarGraficaTecnicos(tecnicoConteo, tiempoTecnico);
    generarGraficaIngresosSemana(ordenesSnap);
  }

  async function cargarChartJS() {
    return new Promise(resolve => {
      const script = document.createElement("script");
      script.src = chartJsCDN;
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  function generarGraficaEstado(data) {
    const ctx = document.getElementById("graficaEstado").getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(data),
        datasets: [{ data: Object.values(data), backgroundColor: ["#00ff88", "#6366f1", "#ff00aa"] }]
      },
      options: { plugins: { legend: { labels: { color: "#00ff88" } } } }
    });
  }

  function generarGraficaTecnicos(ordenesData, tiempos) {
    const ctx = document.getElementById("graficaTecnicos").getContext("2d");
    const labels = Object.keys(ordenesData);
    const dataOrdenes = Object.values(ordenesData);
    const dataTiempo = labels.map(l => {
      const t = tiempos.filter(x => x.tecnico === l).map(x => x.tiempo);
      return t.length ? Math.round(t.reduce((a, b) => a + b, 0) / t.length) : 0;
    });

    new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Órdenes completadas", data: dataOrdenes, backgroundColor: "#00ff88" },
          { label: "Tiempo promedio (h)", data: dataTiempo, backgroundColor: "#6366f1" }
        ]
      },
      options: { plugins: { legend: { labels: { color: "#00ff88" } } }, scales: { x: { ticks: { color: "#00ff88" } }, y: { ticks: { color: "#00ff88" } } } }
    });
  }

  function generarGraficaIngresosSemana(ordenesSnap) {
    const ctx = document.getElementById("graficaIngresosSemana").getContext("2d");
    const hoy = new Date();
    const etiquetas = [];
    const ingresos = [];
    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
      etiquetas.push(`${dia.getDate()}/${dia.getMonth() + 1}`);
      ingresos.push(0);
    }

    ordenesSnap.forEach(docSnap => {
      const o = docSnap.data();
      const fecha = o.fecha.toDate();
      for (let i = 6; i >= 0; i--) {
        const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
        if (fecha.getFullYear() === dia.getFullYear() &&
            fecha.getMonth() === dia.getMonth() &&
            fecha.getDate() === dia.getDate()) {
          ingresos[6 - i] += Number(o.total || 0);
        }
      }
    });

    new Chart(ctx, {
      type: "line",
      data: {
        labels: etiquetas,
        datasets: [{
          label: "Ingresos últimos 7 días",
          data: ingresos,
          fill: true,
          backgroundColor: "rgba(0,255,136,0.2)",
          borderColor: "#00ff88",
          tension: 0.3
        }]
      },
      options: { plugins: { legend: { labels: { color: "#00ff88" } } }, scales: { x: { ticks: { color: "#00ff88" } }, y: { ticks: { color: "#00ff88" } } } }
    });
  }
}