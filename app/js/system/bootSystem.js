/*
=====================================
bootsystem.js
arranque principal del sistema
tallerpro360
=====================================
*/

import { iniciarapp } from "../core/app-init.js";

let systemstarted=false;

export function bootsystem(){

if(systemstarted){
console.warn("boot ya ejecutado");
return;
}

systemstarted=true;

console.log("🚀 iniciando tallerpro360");

/* ==============================
verificar contenedor app
============================== */

const container=document.getElementById("appcontent");

if(!container){

console.error("no existe #appcontent");

return;

}

/* ==============================
verificar sesión
============================== */

const uid=localStorage.getItem("uid");

if(!uid){

console.warn("no hay sesión activa");

window.location.href="/login.html";

return;

}

console.log("usuario activo:",uid);

/* ==============================
pantalla carga
============================== */

container.innerHTML=`
<div style="
padding:40px;
text-align:center;
font-family:Arial;
">

<h2>🚀 iniciando tallerpro360</h2>

<p style="color:#94a3b8">
cargando sistema...
</p>

</div>
`;

/* ==============================
iniciar app
============================== */

iniciarapp();

}