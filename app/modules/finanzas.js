export function finanzas(container) {
  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-6">Finanzas</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-green-100 p-4 rounded shadow">
        <h3 class="font-semibold">Ingresos</h3>
        <p class="text-2xl font-bold">$0</p>
      </div>

      <div class="bg-red-100 p-4 rounded shadow">
        <h3 class="font-semibold">Gastos</h3>
        <p class="text-2xl font-bold">$0</p>
      </div>

      <div class="bg-blue-100 p-4 rounded shadow">
        <h3 class="font-semibold">Balance</h3>
        <p class="text-2xl font-bold">$0</p>
      </div>
    </div>

    <div class="bg-white p-4 rounded shadow">
      <h2 class="font-semibold mb-3">Movimientos Financieros</h2>
      <p class="text-gray-500">Sin registros.</p>
    </div>
  `;
}