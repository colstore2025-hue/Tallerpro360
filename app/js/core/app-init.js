/*
=====================================
app-init.js
inicializador del sistema
tallerpro360
=====================================
*/

import { panel } from "../modules/panel.js";

export function iniciarapp(){

console.log("🚀 iniciando erp");

/* ===============================
contenedor principal
=============================== */

const container=document.getElementById("appContent");

if(!container){

console.error("no existe #appContent");

return;

}


/* ===============================
verificar sesión
=============================== */

const uid=localStorage.getItem("uid");


/* ===============================
si no hay sesión
=============================== */

if(!uid){

container.innerHTML=`

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
">

<h2>bienvenido a tallerpro360</h2>

<p>erp inteligente para talleres automotrices</p>

<a href="/login.html">

<button style="
margin-top:15px;
padding:10px 20px;
background:#16a34a;
border:none;
border-radius:6px;
color:white;
cursor:pointer;
">
iniciar sesión
</button>

</a>

</div>

</div>

`;

return;

}


/* ===============================
cargar panel ERP
=============================== */

console.log("👤 usuario activo:",uid);

panel(container,uid);

}