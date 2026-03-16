/*
=====================================
app-init.js
inicializador del erp
tallerpro360
=====================================
*/

import { panel } from "../modules/panel.js";

export function iniciarapp(){

console.log("iniciando erp");

/* ==============================
contenedor principal
============================== */

const container=document.getElementById("appcontent");

if(!container){

console.error("contenedor appcontent no encontrado");

return;

}

/* ==============================
verificar sesión
============================== */

const uid=localStorage.getItem("uid");

if(!uid){

container.innerHTML=`
<div class="card">

<h2>no hay sesión</h2>

<p>debes iniciar sesión</p>

<a href="/login.html">
<button>ir a login</button>
</a>

</div>
`;

return;

}

/* ==============================
cargar panel erp
============================== */

panel(container,uid);

}