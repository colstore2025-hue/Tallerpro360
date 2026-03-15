/**
 * app-init.js
 * Inicializador del sistema
 */

import { panel } from "../modules/panel.js";

export async function iniciarApp(){

console.log("🚀 Iniciando TallerPRO360");

const container = document.getElementById("appContent");

const uid = localStorage.getItem("uid");

/* ==========================
SI NO HAY LOGIN
========================== */

if(!uid){

container.innerHTML = `
<div class="card">
<h2>No hay sesión</h2>
<p>Debes iniciar sesión</p>
<a href="/login.html">
<button>Ir a Login</button>
</a>
</div>
`;

return;

}

/* ==========================
CARGAR PANEL ERP
========================== */

await panel(container,uid);

}