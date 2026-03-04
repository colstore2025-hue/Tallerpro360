export function pagos(container) {
  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-6">Pagos y Suscripciones</h1>

    <div class="bg-white p-4 rounded shadow mb-6">
      <button class="bg-purple-600 text-white px-4 py-2 rounded">
        Gestionar Suscripción
      </button>
    </div>

    <div class="bg-white p-4 rounded shadow">
      <h2 class="font-semibold mb-3">Historial de Pagos</h2>
      <p class="text-gray-500">No hay pagos registrados.</p>
    </div>
  `;
}