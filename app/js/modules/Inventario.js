export function inventario(container) {
  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-6">Inventario</h1>

    <div class="bg-white p-4 rounded shadow mb-6">
      <button class="bg-green-600 text-white px-4 py-2 rounded">
        + Agregar Producto
      </button>
    </div>

    <div class="bg-white p-4 rounded shadow">
      <h2 class="font-semibold mb-3">Productos Registrados</h2>
      <div id="listaInventario">
        <p class="text-gray-500">Inventario vacío.</p>
      </div>
    </div>
  `;
}