/**
 * app-init.js
 * Inicializador del sistema
 */

import { panel } from "../modules/panel.js";

export async function iniciarApp(){

console.log("🚀 Iniciando TallerPRO360");

const container = document.getElementById("appContent");

if(!container){
console.error("❌ Contenedor #appContent no encontrado");
return;
}

const uid = localStorage.getItem("uid");

/* ==========================
SI NO HAY LOGIN
========================== */

if(!uid){

container.innerHTML = `
<div style="padding:40px;text-align:center;font-family:Arial">

<h2>No hay sesión activa</h2>

<p>Debes iniciar sesión para continuar</p>

<a href="/login.html">
<button style="
padding:10px 20px;
background:#2563eb;
color:white;
border:none;
border-radius:6px;
cursor:pointer;
">
Ir a Login
</button>
</a>

</div>
`;

return;

}

/* ==========================
CARGAR PANEL ERP
========================== */

try{

await panel(container, uid);

}catch(e){

console.error("❌ Error iniciando panel:",e);

container.innerHTML=`
<div style="padding:40px;text-align:center">

<h2>⚠ Error cargando el sistema</h2>

<p>${e.message}</p>

<button onclick="location.reload()"
style="
padding:10px;
background:#dc2626;
border:none;
color:white;
border-radius:6px;
cursor:pointer;
">

Reiniciar sistema

</button>

</div>
`;

}

}