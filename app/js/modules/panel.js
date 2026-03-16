/*
=====================================
panel.js
panel principal erp
tallerpro360
=====================================
*/

import { moduleLoader } from "../system/moduleLoader.js";

import { dashboard } from "./dashboard.js";
import { clientes } from "./clientes.js";
import { ordenes } from "./ordenes.js";
import { inventario } from "./inventario.js";
import { finanzas } from "./finanzas.js";
import { contabilidad } from "./contabilidad.js";
import { pagosTaller } from "./pagosTaller.js";
import { configuracion } from "./configuracion.js";
import { reportes } from "./reportes.js";


export async function panel(container,userId){

console.log("🚀 panel iniciado");


/* =========================
LAYOUT ERP
========================= */

container.innerHTML=`

<div style="display:flex;height:100vh">

<nav style="
width:240px;
background:#020617;
padding:20px;
color:white;
overflow:auto;
">

<h2 style="margin-bottom:20px">
TallerPRO360
</h2>

<div id="menu"></div>

<button id="logoutBtn"
style="
margin-top:20px;
width:100%;
padding:10px;
background:#dc2626;
border:none;
border-radius:6px;
color:white;
cursor:pointer;
">

Cerrar sesión

</button>

</nav>

<main id="mainPanel"
style="
flex:1;
padding:20px;
background:#1e293b;
color:white;
overflow:auto;
">

Cargando módulo...

</main>

</div>

`;


/* =========================
DOM
========================= */

const menu=document.getElementById("menu");
const main=document.getElementById("mainPanel");


if(!menu || !main){

console.error("error creando layout");

return;

}


/* =========================
REGISTRO DE MODULOS
========================= */

moduleLoader.register("dashboard",dashboard);
moduleLoader.register("clientes",clientes);
moduleLoader.register("ordenes",ordenes);
moduleLoader.register("inventario",inventario);
moduleLoader.register("finanzas",finanzas);
moduleLoader.register("contabilidad",contabilidad);
moduleLoader.register("pagos",pagosTaller);
moduleLoader.register("configuracion",configuracion);
moduleLoader.register("reportes",reportes);



/* =========================
MENU ERP
========================= */

const modulos=[

"dashboard",
"clientes",
"ordenes",
"inventario",
"finanzas",
"contabilidad",
"pagos",
"reportes",
"configuracion"

];


menu.innerHTML="";

modulos.forEach(nombre=>{

const btn=document.createElement("button");

btn.textContent=nombre;

btn.style.display="block";
btn.style.width="100%";
btn.style.margin="8px 0";
btn.style.padding="10px";
btn.style.background="#0f172a";
btn.style.border="1px solid #1e293b";
btn.style.color="white";
btn.style.cursor="pointer";

btn.onclick=()=>{

console.log("📦 cargando módulo:",nombre);

moduleLoader.load(nombre,main,userId);

};

menu.appendChild(btn);

});


/* =========================
LOGOUT
========================= */

document.getElementById("logoutBtn").onclick=()=>{

localStorage.clear();

window.location="/login.html";

};



/* =========================
CARGA INICIAL
========================= */

try{

await moduleLoader.load("dashboard",main,userId);

console.log("✅ dashboard cargado");

}
catch(error){

console.error("error cargando dashboard",error);

main.innerHTML=`

<h2>Error cargando dashboard</h2>

<p>Revisa el módulo dashboard.js</p>

`;

}

}