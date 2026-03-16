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

try{

console.log("🚀 Panel iniciado");

container.innerHTML="Cargando ERP...";

/* =========================
CREAR LAYOUT
========================= */

container.innerHTML=`
<div style="display:flex;height:100vh">

<nav style="
width:240px;
background:#020617;
padding:20px;
color:white;
">

<h2 style="margin-bottom:20px;">TallerPRO360</h2>

<div id="menu"></div>

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
DOM (usar container)
========================= */

const menu = container.querySelector("#menu");
const main = container.querySelector("#mainPanel");

if(!menu || !main){

throw new Error("No se pudo crear el layout");

}


/* =========================
REGISTRAR MÓDULOS
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
MENÚ
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

btn.onclick=async ()=>{

console.log("Cargando módulo:",nombre);

try{

await moduleLoader.load(nombre,main,userId);

}
catch(e){

console.error("Error cargando módulo:",e);

main.innerHTML=`
<h2>Error cargando módulo</h2>
<p>${e.message}</p>
`;

}

};

menu.appendChild(btn);

});


/* =========================
CARGA INICIAL
========================= */

try{

await moduleLoader.load("dashboard",main,userId);

}
catch(e){

console.error("Error cargando dashboard:",e);

main.innerHTML=`
<h2>Error cargando Dashboard</h2>
<p>${e.message}</p>
`;

}

console.log("✅ Panel cargado");

}
catch(error){

console.error("❌ Error en panel:",error);

container.innerHTML=`
<div style="padding:40px">

<h2>Error cargando el ERP</h2>

<p>${error.message}</p>

<button onclick="location.reload()">
Reintentar
</button>

</div>
`;

}

}