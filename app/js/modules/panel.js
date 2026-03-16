/*
=====================================
panel.js
panel principal del erp
tallerpro360
=====================================
*/

import { moduleLoader } from "../system/moduleloader.js";

import { dashboard } from "./dashboard.js";
import { clientes } from "./clientes.js";
import { ordenes } from "./ordenes.js";
import { inventario } from "./inventario.js";
import { finanzas } from "./finanzas.js";
import { contabilidad } from "./contabilidad.js";
import { pagostaller } from "./pagostaller.js";
import { configuracion } from "./configuracion.js";
import { reportes } from "./reportes.js";

export async function panel(container,userid){

try{

console.log("🚀 panel iniciado");


/* =================================
crear layout erp
================================= */

container.innerHTML=`

<div style="display:flex;height:100vh;width:100%">

<!-- menu lateral -->

<nav
style="
width:240px;
background:#020617;
padding:20px;
border-right:1px solid #1e293b;
"
>

<h2 style="margin-bottom:20px">
tallerpro360
</h2>

<div id="menuerp"></div>

<div style="margin-top:30px">

<button
onclick="salir()"
style="
width:100%;
padding:10px;
background:#dc2626;
border:none;
border-radius:6px;
color:white;
cursor:pointer;
"
>
salir
</button>

</div>

</nav>


<!-- panel principal -->

<main
id="mainpanel"
style="
flex:1;
padding:25px;
background:#0f172a;
overflow:auto;
"
>

cargando módulo...

</main>

</div>

`;


/* =================================
dom
================================= */

const menu=document.getElementById("menuerp");
const main=document.getElementById("mainpanel");

if(!menu || !main){

throw new Error("no se pudo crear el layout erp");

}


/* =================================
registrar módulos
================================= */

moduleLoader.register("dashboard",dashboard);
moduleLoader.register("clientes",clientes);
moduleLoader.register("ordenes",ordenes);
moduleLoader.register("inventario",inventario);
moduleLoader.register("finanzas",finanzas);
moduleLoader.register("contabilidad",contabilidad);
moduleLoader.register("pagos",pagostaller);
moduleLoader.register("reportes",reportes);
moduleLoader.register("configuracion",configuracion);


/* =================================
lista módulos
================================= */

const modulos=[

{nombre:"dashboard",icono:"📊"},
{nombre:"clientes",icono:"👥"},
{nombre:"ordenes",icono:"🛠"},
{nombre:"inventario",icono:"📦"},
{nombre:"finanzas",icono:"💰"},
{nombre:"contabilidad",icono:"📑"},
{nombre:"pagos",icono:"💳"},
{nombre:"reportes",icono:"📈"},
{nombre:"configuracion",icono:"⚙"}

];


/* =================================
crear menú
================================= */

menu.innerHTML="";

modulos.forEach(m=>{

const btn=document.createElement("button");

btn.innerHTML=`
${m.icono} ${m.nombre}
`;

btn.style.display="block";
btn.style.width="100%";
btn.style.marginBottom="10px";
btn.style.padding="10px";
btn.style.background="#0f172a";
btn.style.border="1px solid #1e293b";
btn.style.color="white";
btn.style.borderRadius="6px";
btn.style.cursor="pointer";

btn.onclick=()=>{

console.log("cargando módulo:",m.nombre);

moduleLoader.load(m.nombre,main,userid);

};

menu.appendChild(btn);

});


/* =================================
cargar dashboard inicial
================================= */

await moduleLoader.load("dashboard",main,userid);

console.log("✅ panel erp cargado");

}
catch(error){

console.error("❌ error cargando panel:",error);

container.innerHTML=`

<div style="padding:40px">

<h2>error cargando erp</h2>

<p>${error.message}</p>

<button onclick="location.reload()"
style="
padding:10px 20px;
background:#16a34a;
border:none;
border-radius:6px;
color:white;
cursor:pointer;
"
>

reiniciar sistema

</button>

</div>

`;

}

}