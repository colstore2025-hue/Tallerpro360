/*
=====================================
dashboard.js
Dashboard ERP - TallerPRO360 (Versión Final)
=====================================
*/

import { db } from "../core/firebase-config.js";
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function dashboard(container, userId) {
  console.log("📊 cargando dashboard dinámico");

  container.innerHTML = `
<h1 style="font-size:28px;margin-bottom:20px">📊 Dashboard ERP</h1>
<p>Bienvenido al ERP TallerPRO360</p>

<div style="margin-top:30px; display:flex; gap:15px; flex-wrap:wrap;">
  <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;flex:1;min-width:200px;">
    Órdenes del día: <span id="ordenesDia">0</span>
  </div>

  <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;flex:1;min-width:200px;">
    Ingresos del día: $<span id="ingresosDia">0</span>
  </div>

  <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;flex:1;min-width:200px;">
    Clientes activos: <span id="clientesActivos">0</span>
  </div>
</div>

<canvas id="graficaIngresos" style="margin-top:30px;background:#1e293b;border-radius:10px;padding:15px;"></canvas>
`;

  // ===========================
  // Cargar datos dinámicos
  // ===========================
  await actualizarDashboard();

  async function actualizarDashboard() {
    try {
      const hoy = new Date();
      const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

      // Órdenes del día
      const ordenesSnap = await getDocs(query(collection(db, "ordenes"), orderBy("fecha", "desc")));
      let ordenesDia = 0;
      let ingresosDia = 0;
      ordenesSnap.forEach(docSnap => {
        const o = docSnap.data();
        const fecha = o.fecha.toDate();
        if (fecha >= inicioDia && fecha < finDia) {
          ordenesDia++;
          ingresosDia += Number(o.total || 0);
        }
      });
      document.getElementById("ordenesDia").innerText = ordenesDia;
      document.getElementById("ingresosDia").innerText = ingresosDia.toLocaleString();

      // Clientes activos
      const clientesSnap = await getDocs(collection(db, "clientes"));
      document.getElementById("clientesActivos").innerText = clientesSnap.size;

      // Gráfica de ingresos últimos 7 días
      generarGraficaIngresos();
    } catch (e) {
      console.error("Error cargando dashboard:", e);
    }
  }

  // ===========================
  // Gráfica de ingresos últimos 7 días
  // ===========================
  async function generarGraficaIngresos() {
    const canvas = document.getElementById("graficaIngresos");
    if (!canvas) return;

    const hoy = new Date();
    const etiquetas = [];
    const ingresos = [];

    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
      const diaStr = `${dia.getDate()}/${dia.getMonth() + 1}`;
      etiquetas.push(diaStr);
      ingresos.push(0);
    }

    const ordenesSnap = await getDocs(collection(db, "ordenes"));
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

    // Dibujar gráfica simple
    dibujarGraficaBarras(canvas, etiquetas, ingresos);
  }

  // ===========================
  // Función gráfica de barras simple
  // ===========================
  function dibujarGraficaBarras(canvas, labels, data) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width / (data.length * 2);
    const max = Math.max(...data) || 1;

    // Etiquetas y barras
    labels.forEach((label, i) => {
      const x = i * 2 * width + width;
      const barHeight = (data[i] / max) * (canvas.height - 50);
      // Barra
      ctx.fillStyle = "#16a34a";
      ctx.fillRect(x, canvas.height - barHeight - 30, width, barHeight);
      // Etiqueta
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(label, x + width / 2, canvas.height - 10);
      // Valor
      ctx.fillText(data[i].toLocaleString(), x + width / 2, canvas.height - barHeight - 35);
    });
  }
}