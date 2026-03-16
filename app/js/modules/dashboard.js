/*
=========================================================
dashboardAvanzado.js - Dashboard Gerencial Premium ERP
TallerPRO360 - Versión Final Avanzada
=========================================================
*/

import { db } from "../core/firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const chartJsCDN = "https://cdn.jsdelivr.net/npm/chart.js";

export async function dashboardAvanzado(container, userId) {
  console.log("🚀 Cargando dashboard gerencial avanzado");

  container.innerHTML = `
<h1 style="font-size:28px;margin-bottom:20px;">📊 Dashboard Gerencial Avanzado</h1>

<div style="display:flex; flex-wrap:wrap; gap:15px; margin-bottom:30px;">
  <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;flex:1;min-width:200px;">
    Órdenes Hoy: <span id="ordenesDia">0</span>
  </div>
  <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;flex:1;min-width:200px;">
    Ingresos Hoy: $<span id="ingresosDia">0</span>
  </div>
  <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;flex:1;min-width:200px;">
    Ganancia Neta Hoy: $<span id="gananciaDia">0</span>
  </div>
  <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;flex:1;min-width:200px;">
    Clientes Nuevos Hoy: <span id="clientesNuevos">0</span>
  </div>
</div>

<div style="display:flex; flex-wrap:wrap; gap:30px; margin-bottom:30px;">
  <canvas id="graficaOrdenesEstado" style="background:#1e293b;border-radius:10px;padding:15px;flex:1;min-width:300px; height:300px;"></canvas>
  <canvas id="graficaTecnicos" style="background:#1e293b;border-radius:10px;padding:15px;flex:1;min-width:300px; height:300px;"></canvas>
</div>

<div style="margin-bottom:30px;">
  <canvas id="graficaIngresosSemana" style="background:#1e293b;border-radius:10px;padding:15px; width:100%; height:350px;"></canvas>
</div>

<div style="margin-bottom:30px;">
  <h3 style="color:white;">Alertas de Órdenes Retrasadas</h3>
  <ul id="alertasOrdenes" style="color:white;"></ul>
</div>
`;

  if (!window.Chart) await cargarChartJS();

  await actualizarDashboard();

  async function actualizarDashboard() {
    try {
      const hoy = new Date();
      const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

      const ordenesSnap = await getDocs(query(collection(db, "ordenes"), orderBy("fecha", "desc")));
      const clientesSnap = await getDocs(collection(db, "clientes"));
      const gastosSnap = await getDocs(collection(db, "gastos"));

      let ordenesDia = 0;
      let ingresosDia = 0;
      let costosDia = 0;
      let clientesNuevos = 0;
      let gananciaDia = 0;

      const estadoConteo = { Recepción: 0, Reparación: 0, Entregado: 0 };
      const tecnicoConteo = {};
      const tiempoTecnico = {};

      const alertas = [];

      ordenesSnap.forEach(docSnap => {
        const o = docSnap.data();
        const fecha = o.fecha.toDate();

        // Órdenes del día
        if (fecha >= inicioDia && fecha < finDia) {
          ordenesDia++;
          ingresosDia += Number(o.total || 0);
          costosDia += Number(o.costoTotal || 0);
        }

        // Estado de órdenes
        estadoConteo[o.estado] = (estadoConteo[o.estado] || 0) + 1;

        // Técnico y eficiencia
        if (o.tecnico) {
          tecnicoConteo[o.tecnico] = (tecnicoConteo[o.tecnico] || 0) + 1;
          const tiempo = o.tiempoEstimado ? Number(o.tiempoEstimado) : 0;
          if (!tiempoTecnico[o.tecnico]) tiempoTecnico[o.tecnico] = [];
          tiempoTecnico[o.tecnico].push(tiempo);
        }

        // Alertas de retraso (>48h en estado no entregado)
        if (o.estado !== "Entregado" && (hoy - fecha) / (1000*60*60) > 48) {
          alertas.push(`⚠️ Orden de ${o.clientePhone || o.clienteId} retrasada más de 48h`);
        }
      });

      clientesSnap.forEach(docSnap => {
        const c = docSnap.data();
        const fechaRegistro = c.createdAt?.toDate?.() || new Date(0);
        if (fechaRegistro >= inicioDia && fechaRegistro < finDia) clientesNuevos++;
      });

      gananciaDia = ingresosDia - costosDia;

      // Actualizar KPIs
      document.getElementById("ordenesDia").innerText = ordenesDia;
      document.getElementById("ingresosDia").innerText = ingresosDia.toLocaleString();
      document.getElementById("gananciaDia").innerText = gananciaDia.toLocaleString();
      document.getElementById("clientesNuevos").innerText = clientesNuevos;

      // Generar gráficas
      generarGraficaOrdenesEstado(estadoConteo);
      generarGraficaTecnicos(tecnicoConteo, tiempoTecnico);
      generarGraficaIngresosSemana(ordenesSnap);

      // Mostrar alertas
      const alertasContainer = document.getElementById("alertasOrdenes");
      alertasContainer.innerHTML = alertas.length ? alertas.map(a => `<li>${a}</li>`).join("") : "<li>No hay alertas</li>";

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
        datasets: [{ data: Object.values(data), backgroundColor: ["#facc15","#6366f1","#16a34a"] }]
      },
      options: { plugins: { legend: { labels: { color: "white" } } } }
    });
  }

  function generarGraficaTecnicos(ordenesData, tiempoData) {
    const ctx = document.getElementById("graficaTecnicos").getContext("2d");
    const labels = Object.keys(ordenesData);
    const dataOrdenes = Object.values(ordenesData);
    const dataTiempo = labels.map(l => {
      const tiempos = tiempoData[l] || [0];
      return Math.round(tiempos.reduce((a,b)=>a+b,0)/tiempos.length);
    });

    new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Órdenes completadas", data: dataOrdenes, backgroundColor: "#16a34a" },
          { label: "Tiempo promedio (h)", data: dataTiempo, backgroundColor: "#6366f1" }
        ]
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