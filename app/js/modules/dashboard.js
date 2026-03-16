/*
=========================================================
dashboard.js - Dashboard Gerencial ERP TallerPRO360
Versión Final Premium para Gerente
=========================================================
*/

import { db } from "../core/firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Importamos Chart.js desde CDN
const chartJsCDN = "https://cdn.jsdelivr.net/npm/chart.js";

export async function dashboard(container, userId) {
  console.log("🚀 Cargando dashboard gerencial premium");

  container.innerHTML = `
<h1 style="font-size:28px;margin-bottom:20px;">📊 Dashboard Gerencial - TallerPRO360</h1>

<div style="display:flex; flex-wrap:wrap; gap:15px; margin-bottom:30px;">
  <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;flex:1;min-width:200px;">
    Órdenes Hoy: <span id="ordenesDia">0</span>
  </div>
  <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;flex:1;min-width:200px;">
    Ingresos Hoy: $<span id="ingresosDia">0</span>
  </div>
  <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;flex:1;min-width:200px;">
    Clientes Activos: <span id="clientesActivos">0</span>
  </div>
  <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;flex:1;min-width:200px;">
    Nuevos Clientes Hoy: <span id="clientesNuevos">0</span>
  </div>
  <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;flex:1;min-width:200px;">
    Órdenes Completadas Hoy: <span id="ordenesCompletadas">0</span>
  </div>
</div>

<div style="display:flex; flex-wrap:wrap; gap:30px;">
  <canvas id="graficaOrdenesEstado" style="background:#1e293b;border-radius:10px;padding:15px;flex:1;min-width:300px; height:300px;"></canvas>
  <canvas id="graficaTecnicos" style="background:#1e293b;border-radius:10px;padding:15px;flex:1;min-width:300px; height:300px;"></canvas>
</div>

<div style="margin-top:30px;">
  <canvas id="graficaIngresosSemana" style="background:#1e293b;border-radius:10px;padding:15px; width:100%; height:350px;"></canvas>
</div>
`;

  // Cargar Chart.js dinámicamente
  if (!window.Chart) {
    await cargarChartJS();
  }

  await actualizarDashboard();

  async function actualizarDashboard() {
    try {
      const hoy = new Date();
      const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

      const ordenesSnap = await getDocs(query(collection(db, "ordenes"), orderBy("fecha", "desc")));
      const clientesSnap = await getDocs(collection(db, "clientes"));

      let ordenesDia = 0;
      let ingresosDia = 0;
      let ordenesCompletadas = 0;
      let clientesNuevos = 0;
      const estadoConteo = { Recepción: 0, Reparación: 0, Entregado: 0 };
      const tecnicoConteo = {};

      ordenesSnap.forEach(docSnap => {
        const o = docSnap.data();
        const fecha = o.fecha.toDate();
        if (fecha >= inicioDia && fecha < finDia) {
          ordenesDia++;
          ingresosDia += Number(o.total || 0);
          if (o.estado === "Entregado") ordenesCompletadas++;
        }

        estadoConteo[o.estado] = (estadoConteo[o.estado] || 0) + 1;
        if (o.tecnico) tecnicoConteo[o.tecnico] = (tecnicoConteo[o.tecnico] || 0) + 1;
      });

      clientesSnap.forEach(docSnap => {
        const c = docSnap.data();
        const fechaRegistro = c.createdAt?.toDate?.() || new Date(0);
        if (fechaRegistro >= inicioDia && fechaRegistro < finDia) clientesNuevos++;
      });

      document.getElementById("ordenesDia").innerText = ordenesDia;
      document.getElementById("ingresosDia").innerText = ingresosDia.toLocaleString();
      document.getElementById("clientesActivos").innerText = clientesSnap.size;
      document.getElementById("clientesNuevos").innerText = clientesNuevos;
      document.getElementById("ordenesCompletadas").innerText = ordenesCompletadas;

      generarGraficaOrdenesEstado(estadoConteo);
      generarGraficaTecnicos(tecnicoConteo);
      generarGraficaIngresosSemana(ordenesSnap);
    } catch (e) {
      console.error("Error actualizando dashboard:", e);
    }
  }

  async function cargarChartJS() {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = chartJsCDN;
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  function generarGraficaOrdenesEstado(data) {
    const ctx = document.getElementById("graficaOrdenesEstado").getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(data),
        datasets: [{
          data: Object.values(data),
          backgroundColor: ["#facc15","#6366f1","#16a34a"]
        }]
      },
      options: {
        plugins: { legend: { labels: { color: "white" } } }
      }
    });
  }

  function generarGraficaTecnicos(data) {
    const ctx = document.getElementById("graficaTecnicos").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: "Órdenes completadas",
          data: Object.values(data),
          backgroundColor: "#16a34a"
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "white" } },
          y: { ticks: { color: "white" } }
        }
      }
    });
  }

  function generarGraficaIngresosSemana(ordenesSnap) {
    const ctx = document.getElementById("graficaIngresosSemana").getContext("2d");
    const hoy = new Date();
    const etiquetas = [];
    const ingresos = [];

    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
      etiquetas.push(`${dia.getDate()}/${dia.getMonth()+1}`);
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
          ingresos[6-i] += Number(o.total || 0);
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
          backgroundColor: "rgba(16,163,52,0.2)",
          borderColor: "#10a334",
          tension: 0.3
        }]
      },
      options: {
        plugins: { legend: { labels: { color: "white" } } },
        scales: {
          x: { ticks: { color: "white" } },
          y: { ticks: { color: "white" } }
        }
      }
    });
  }
}