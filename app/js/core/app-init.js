/**
 * app-init.js
 * Inicializador principal del ERP
 */

import { panel } from "../modules/panel.js";

export async function iniciarApp(){

console.log("⚡ App Init iniciado");

const uid = localStorage.getItem("uid");

if(!uid){

console.warn("Usuario no autenticado");
window.location.href="/login.html";
return;

}

const container = document.getElementById("appContent");

if(!container){

console.error("No existe contenedor appContent");
return;

}

container.innerHTML = "<p>Cargando panel...</p>";

try{

await panel(container,uid);

}
catch(e){

console.error("Error cargando panel:",e);

container.innerHTML=`
<div style="text-align:center;">
<h2>Error cargando sistema</h2>
<p>Revisa la consola</p>
<button onclick="location.reload()">Reintentar</button>
</div>
`;

}

}