/**
 * dashboard.js
 * Dashboard PRO360 modular con Neon KPIs
 */

import { getClientes, getOrdenes, getInventario } from "../services/dataService.js";
import { store, subscribe } from "../core/store.js";

let charts = {};

/**
 * Inicializa el dashboard
 */
export default async function dashboard(container) {
  container.innerHTML = `<h2 style="color:#00ffff">Cargando Dashboard...</h2>`;

  const empresaId = store.empresa?.id;
  if (!empresaId) {
    container.innerHTML = `<p style="color:red">Empresa no definida</p>`;
    return;
  }

  try {
    const [clientes, ordenes, inventario] = await Promise.all([
      getClientes(empresaId),
      getOrdenes(empresaId),
      getInventario(empresaId),
    ]);

    renderDashboard(container, { clientes, ordenes, inventario });

  } catch (e) {
    console.error("Error dashboard:", e);
    container.innerHTML = `<p style="color:red">Error cargando dashboard</p>`;
  }
}

/**
 * Render principal del dashboard
 */
function renderDashboard(container, data) {
  const { clientes, ordenes, inventario } = data;

  container.innerHTML = `
    <div style="color:#fff">
      <h1 style="color:#00ffff;">🧠 Dashboard PRO360</h1>
      <p>Clientes: ${clientes.length}</p>
      <p>Órdenes: ${ordenes.length}</p>
      <p>Items inventario: ${inventario.length}</p>
    </div>
  `;

  // Aquí luego agregamos charts y KPIs neon
}