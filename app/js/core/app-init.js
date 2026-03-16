/*
=====================================
app-init.js
inicializador del erp
tallerpro360
=====================================
*/

import { panel } from "../modules/panel.js";


/* =====================================
INICIAR APLICACIÓN
===================================== */

export async function iniciarApp(){

console.log("🚀 iniciando erp");

try{

/* ===============================
CONTENEDOR PRINCIPAL
=============================== */

const container = document.getElementById("appContent");

if(!container){

console.error("❌ no existe #appContent en el DOM");
return;

}


/* ===============================
VERIFICAR SESIÓN
=============================== */

const uid = localStorage.getItem("uid");

if(!uid){

console.warn("⚠️ sesión no encontrada");

window.location.href = "/login.html";

return;

}

console.log("👤 usuario activo:", uid);


/* ===============================
CARGAR PANEL ERP
=============================== */

await panel(container, uid);

console.log("✅ panel cargado correctamente");

}
catch(error){

console.error("❌ error iniciando el erp:", error);

const container = document.getElementById("appContent");

if(container){

container.innerHTML = `

<div style="
display:flex;
align-items:center;
justify-content:center;
height:100vh;
">

<div style="
background:#020617;
padding:30px;
border-radius:10px;
border:1px solid #1e293b;
text-align:center;
max-width:420px;
">

<h2 style="margin-bottom:10px">
error cargando el erp
</h2>

<p style="color:#94a3b8;margin-bottom:20px">
ocurrió un problema iniciando el sistema
</p>

<button
onclick="location.reload()"
style="
padding:10px 20px;
background:#16a34a;
border:none;
border-radius:6px;
color:white;
cursor:pointer;
"
>

reiniciar sistema

</button>

</div>

</div>

`;

}

}

}