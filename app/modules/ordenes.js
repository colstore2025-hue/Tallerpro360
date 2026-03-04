export function ordenes(container) {
  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-6">Gestión de Órdenes</h1>

    <div class="bg-white p-4 rounded shadow mb-6">
      <button id="nuevaOrden" class="bg-blue-600 text-white px-4 py-2 rounded">
        + Nueva Orden
      </button>
    </div>

    <div class="bg-white p-4 rounded shadow">
      <h2 class="font-semibold mb-3">Listado de Órdenes</h2>
      <div id="listaOrdenes">
        <p class="text-gray-500">No hay órdenes registradas.</p>
      </div>
    </div>
  `;
}