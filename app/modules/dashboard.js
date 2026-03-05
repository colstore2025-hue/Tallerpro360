import { db } from "../js/firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function dashboard(container) {

  container.innerHTML = `
  <div class="p-6">

    <h1 class="text-2xl font-bold mb-6">
      Dashboard TallerPRO360
    </h1>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

      <div class="bg-white p-4 rounded shadow">
        <h3 class="text-gray-500 text-sm">Órdenes activas</h3>
        <p id="ordenesActivas" class="text-2xl font-bold">0</p>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <h3 class="text-gray-500 text-sm">Ingresos hoy</h3>
        <p id="ingresosHoy" class="text-2xl font-bold">$0</p>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <h3 class="text-gray-500 text-sm">Vehículos en proceso</h3>
        <p id="vehiculosProceso" class="text-2xl font-bold">0</p>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <h3 class="text-gray-500 text-sm">Total órdenes</h3>
        <p id="totalOrdenes" class="text-2xl font-bold">0</p>
      </div>

    </div>

    <div class="bg-white p-4 rounded shadow">

      <h2 class="font-semibold mb-3">
        Últimas órdenes
      </h2>

      <div id="ultimasOrdenes">
      Cargando...
      </div>

    </div>

  </div>
  `;

  cargarDashboard();
}

async function cargarDashboard() {

  try {

    const snapshot = await getDocs(collection(db, "ordenes"));

    let totalOrdenes = 0;
    let ordenesActivas = 0;
    let vehiculosProceso = 0;
    let ingresosHoy = 0;

    let html = "";

    snapshot.forEach(doc => {

      const data = doc.data();

      totalOrdenes++;

      if (data.estado === "activa") ordenesActivas++;
      if (data.estado === "proceso") vehiculosProceso++;

      ingresosHoy += data.total || 0;

      html += `
      <div class="border p-3 rounded mb-2 flex justify-between">

        <div>
          <strong>${data.cliente}</strong><br>
          ${data.vehiculo} - ${data.placa}
        </div>

        <div class="text-sm text-gray-500">
          ${data.estado}
        </div>

      </div>
      `;
    });

    document.getElementById("ordenesActivas").innerText = ordenesActivas;
    document.getElementById("vehiculosProceso").innerText = vehiculosProceso;
    document.getElementById("totalOrdenes").innerText = totalOrdenes;
    document.getElementById("ingresosHoy").innerText =
      "$ " + ingresosHoy.toLocaleString("es-CO");

    document.getElementById("ultimasOrdenes").innerHTML = html || "Sin datos";

  } catch (error) {

    console.error("Error cargando dashboard:", error);

  }
}