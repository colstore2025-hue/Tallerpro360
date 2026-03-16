/*
=====================================
app-init.js
inicializador del erp
tallerpro360
=====================================
*/

import { panel } from "../modules/panel.js";

export async function iniciarApp(){

console.log("🚀 iniciando erp");

const container=document.getElementById("appContent");

if(!container){

console.error("no existe appContent");

return;

}


/* ===============================
verificar sesión
=============================== */

const uid=localStorage.getItem("uid");

if(!uid){

console.warn("no hay sesión");

window.location="/login.html";

return;

}

console.log("usuario activo:",uid);


/* ===============================
cargar panel
=============================== */

await panel(container,uid);

}