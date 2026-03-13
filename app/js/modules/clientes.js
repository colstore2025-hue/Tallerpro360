/**
 * clientes.js
 * Módulo de gestión de clientes
 * TallerPRO360 ERP
 */

export function clientes(container){

if(!container){

console.error("❌ Contenedor no recibido en módulo clientes");

return;

}

container.innerHTML = `

<div class="card">

<h1 class="text-2xl font-bold mb-4">
Clientes
</h1>

<p class="text-gray-400">
Módulo en construcción.
</p>

</div>

`;

}