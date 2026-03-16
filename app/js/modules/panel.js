/**
 * panel.js
 * Panel principal ERP
 */

import { moduleLoader } from "../system/moduleLoader.js";

/* módulos */

import { dashboard } from "./dashboard.js";
import { clientes } from "./clientes.js";
import { ordenes } from "./ordenes.js";
import { inventario } from "./inventario.js";
import { finanzas } from "./finanzas.js";
import { contabilidad } from "./contabilidad.js";
import { pagosTaller } from "./pagosTaller.js";
import { ceo } from "./ceo.js";
import { aiAssistant } from "./aiAssistant.js";
import { aiAdvisor } from "./aiAdvisor.js";
import { configuracion } from "./configuracion.js";
import { reportes } from "./reportes.js";


export async function panel(container,userId){

console.log("🚀 Cargando Panel ERP");


/* ==========================
INTERFAZ
========================== */

container.innerHTML=`

<div style="display:flex;height:100vh">

<nav style="
width:260px;
background:#020617;
padding:20px;
color:white;
overflow:auto;
">

<h2>TallerPRO360</h2>

<div id="menu"></div>

</nav>

<main id="mainPanel"
style="
flex:1;
padding:25px;
background:#1e293b;
color:white;
overflow:auto;
">

Cargando ERP...

</main>

</div>

`;


const menu=document.getElementById("menu");
const main=document.getElementById("mainPanel");


/* ==========================
REGISTRAR MODULOS
========================== */

moduleLoader.register("dashboard",dashboard);
moduleLoader.register("clientes",clientes);
moduleLoader.register("ordenes",ordenes);
moduleLoader.register("inventario",inventario);
moduleLoader.register("finanzas",finanzas);
moduleLoader.register("contabilidad",contabilidad);
moduleLoader.register("pagos",pagosTaller);
moduleLoader.register("ceo",ceo);

moduleLoader.register("aiassistant",aiAssistant);
moduleLoader.register("aiadvisor",aiAdvisor);

moduleLoader.register("configuracion",configuracion);
moduleLoader.register("reportes",reportes);


/* ==========================
MENÚ ERP
========================== */

const modulos = [

"dashboard",
"clientes",
"ordenes",
"inventario",
"finanzas",
"contabilidad",
"pagos",
"ceo",
"aiassistant",
"aiadvisor",
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

btn.onclick=()=>{

moduleLoader.load(nombre,main,userId);

};

menu.appendChild(btn);

});


/* ==========================
CARGA INICIAL
========================== */

await moduleLoader.load("dashboard",main,userId);


/* diagnóstico */

moduleLoader.diagnostic();

}