export function ceo(container) {
  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-6">Panel CEO</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

      <div class="bg-white p-4 rounded shadow">
        <h2 class="font-semibold mb-3">Empresas Activas</h2>
        <p class="text-3xl font-bold">0</p>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <h2 class="font-semibold mb-3">Suscripciones Activas</h2>
        <p class="text-3xl font-bold">0</p>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <h2 class="font-semibold mb-3">Ingresos MRR</h2>
        <p class="text-3xl font-bold">$0</p>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <h2 class="font-semibold mb-3">Planes Activos</h2>
        <p class="text-3xl font-bold">0</p>
      </div>

    </div>
  `;
}