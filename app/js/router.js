import { dashboard } from "./modules/dashboard.js";
import { clientes } from "./modules/clientes.js";
import { ordenes } from "./modules/ordenes.js";
import { inventario } from "./modules/inventario.js";
import { finanzas } from "./modules/finanzas.js";
import { ceo } from "./modules/ceo.js";
import { pagos } from "./modules/pagos.js";

/* ===========================
SECCIONES DEL SISTEMA
=========================== */

const sections = {

dashboard:{name:"Dashboard",module:dashboard},
clientes:{name:"Clientes",module:clientes},
ordenes:{name:"Órdenes",module:ordenes},
inventario:{name:"Inventario",module:inventario},
finanzas:{name:"Finanzas",module:finanzas},
ceo:{name:"CEO",module:ceo},
pagos:{name:"Pagos",module:pagos}

};


/* ===========================
CREAR MENU
=========================== */

export function buildMenu(){

const menu=document.getElementById("menu");

if(!menu){

console.error("No existe #menu");
return;

}

menu.innerHTML="";

Object.keys(sections).forEach(key=>{

const btn=document.createElement("button");

btn.innerText=sections[key].name;

btn.className="w-full text-left p-3 rounded hover:bg-gray-700 transition";

btn.onclick=()=>{

loadSection(key);

};

menu.appendChild(btn);

});

}


/* ===========================
INICIAR ROUTER
=========================== */

export function initRouter(){

const hash = window.location.hash.replace("#","");

if(hash && sections[hash]){

loadSection(hash);

}else{

loadSection("dashboard");

}

}


/* ===========================
CARGAR SECCION
=========================== */

async function loadSection(section){

const container=document.getElementById("appContent");

if(!container){

console.error("No existe #appContent");
return;

}

container.innerHTML=`<div class="p-6 text-gray-500">Cargando ${section}...</div>`;

const selected=sections[section];

if(!selected){

container.innerHTML=`<div class="p-6 text-red-500">Sección no encontrada</div>`;
return;

}

/* actualizar URL */

window.location.hash = section;

try{

if(typeof selected.module === "function"){

await selected.module(container);

}else{

throw new Error("Módulo inválido");

}

}catch(error){

console.error("Error cargando módulo:",error);

container.innerHTML=`
<div class="p-6 text-red-500">
Error cargando módulo: ${section}
</div>
`;

}

}