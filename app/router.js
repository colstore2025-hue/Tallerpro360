import { dashboard } from "./modules/dashboard.js";
import { clientes } from "./modules/clientes.js";
import { ordenes } from "./modules/ordenes.js";
import { inventario } from "./modules/inventario.js";
import { finanzas } from "./modules/finanzas.js";
import { ceo } from "./modules/ceo.js";
import { pagos } from "./modules/pagos.js";

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

btn.className="w-full text-left p-3 rounded hover:bg-gray-700";

btn.onclick=()=>loadSection(key);

menu.appendChild(btn);

});

}


/* ===========================
INICIAR ROUTER
=========================== */

export function initRouter(){

loadSection("dashboard");

}


/* ===========================
CARGAR SECCION
=========================== */

function loadSection(section){

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

try{

selected.module(container);

}catch(error){

console.error(error);

container.innerHTML=`<div class="p-6 text-red-500">Error cargando módulo</div>`;

}

}