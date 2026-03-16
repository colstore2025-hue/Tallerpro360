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

container.innerHTML=`

<div style="display:flex;height:100vh">

<nav style="width:250px;background:#020617;padding:20px">

<h2>TallerPRO360</h2>

<div id="menu"></div>

</nav>

<main id="mainPanel" style="flex:1;padding:20px">

Cargando...

</main>

</div>

`;

const menu=document.getElementById("menu");
const main=document.getElementById("mainPanel");

/* registrar módulos */

moduleLoader.register("dashboard",dashboard);
moduleLoader.register("clientes",clientes);
moduleLoader.register("ordenes",ordenes);
moduleLoader.register("inventario",inventario);
moduleLoader.register("finanzas",finanzas);
moduleLoader.register("contabilidad",contabilidad);
moduleLoader.register("pagos",pagosTaller);
moduleLoader.register("configuracion",configuracion);
moduleLoader.register("reportes",reportes);

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

modulos.forEach(nombre=>{

const btn=document.createElement("button");

btn.textContent=nombre;

btn.style.display="block";
btn.style.width="100%";
btn.style.margin="8px 0";

btn.onclick=()=>moduleLoader.load(nombre,main,userId);

menu.appendChild(btn);

});

/* cargar primero */

await moduleLoader.load("dashboard",main,userId);

}