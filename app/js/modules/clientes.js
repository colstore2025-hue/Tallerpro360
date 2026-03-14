/**
 * clientes.js
 * Módulo Clientes
 * TallerPRO360 ERP
 */

export function clientes(container){

container.innerHTML = `

<div class="card">

<h1 style="font-size:26px;margin-bottom:20px;">
👥 Clientes
</h1>

<p>Gestión de clientes del taller.</p>

<button id="nuevoCliente" style="
padding:10px 20px;
background:#16a34a;
border:none;
border-radius:6px;
color:white;
cursor:pointer;
margin-top:10px;
">
➕ Nuevo Cliente
</button>

</div>

<div class="card">

<h3>Lista de Clientes</h3>

<div id="listaClientes">
No hay clientes registrados aún.
</div>

</div>

`;

}