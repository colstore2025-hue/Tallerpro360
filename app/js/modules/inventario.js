/**
 * inventario.js
 * Módulo de Inventario
 * TallerPRO360 ERP
 */

export function inventario(container){

if(!container){
console.error("❌ Contenedor no recibido en módulo inventario");
return;
}

container.innerHTML = `

<div class="card">

<h1 class="text-2xl font-bold mb-6">
Inventario
</h1>

<div class="card">

<button id="btnNuevoProducto"
style="
background:#16a34a;
color:white;
padding:10px 16px;
border:none;
border-radius:8px;
cursor:pointer;
">

+ Agregar Producto

</button>

</div>

<div class="card">

<h2 style="margin-bottom:10px;">
Productos Registrados
</h2>

<div id="listaInventario">

<p style="color:#94a3b8;">
Inventario vacío.
</p>

</div>

</div>

</div>

`;

}