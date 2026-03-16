/*
=====================================
app-init.js
inicializador del erp
tallerpro360
=====================================
*/

import { panel } from "/app/js/modules/panel.js";

export async function iniciarApp(){

console.log("🚀 iniciando erp tallerpro360");

const container=document.getElementById("appContent");

if(!container){

console.error("❌ no existe appContent");

return;

}


/* ===============================
verificar sesión
=============================== */

const uid=localStorage.getItem("uid");

if(!uid){

console.warn("⚠️ no hay sesión");

window.location="/login.html";

return;

}

console.log("usuario activo:",uid);


/* ===============================
cargar panel
=============================== */

try{

await panel(container,uid);

console.log("✅ panel cargado");

}
catch(error){

console.error("❌ error cargando panel",error);

container.innerHTML=`

<h1 style="padding:40px">
error cargando el erp
</h1>

`;

}

}