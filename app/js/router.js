import { dashboard } from "./modules/dashboard.js";
import { clientes } from "./modules/clientes.js";
import { ordenes } from "./modules/ordenes.js";
import { inventario } from "./modules/inventario.js";
import { finanzas } from "./modules/finanzas.js";
import { ceo } from "./modules/ceo.js";
import { pagos } from "./modules/pagos.js";

console.log("📦 Router cargado");


const sections = {

dashboard:{name:"Dashboard",module:dashboard},
clientes:{name:"Clientes",module:clientes},
ordenes:{name:"Órdenes",module:ordenes},
inventario:{name:"Inventario",module:inventario},
finanzas:{name:"Finanzas",module:finanzas},
ceo:{name:"CEO",module:ceo},
pagos:{name:"Pagos",module:pagos}

};


export function buildMenu(){

const menu=document.getElementById("menu");

if(!menu){

console.error("❌ No existe #menu");
return;

}

menu.innerHTML="";

Object.keys(sections).forEach(key=>{

const btn=document.createElement("button");

btn.innerText=sections[key].name;

btn.onclick=()=>loadSection(key);

menu.appendChild(btn);

});

}


export function initRouter(){

const hash=window.location.hash.replace("#","");

if(hash && sections[hash]){

loadSection(hash);

}else{

loadSection("dashboard");

}

window.addEventListener("hashchange",()=>{

const newHash=window.location.hash.replace("#","");

if(sections[newHash]){

loadSection(newHash);

}

});

}


async function loadSection(section){

const container=document.getElementById("appContent");

if(!container){

console.error("❌ No existe #appContent");
return;

}

container.innerHTML=`Cargando ${section}...`;

const selected=sections[section];

if(!selected){

container.innerHTML="Sección no encontrada";
return;

}

window.location.hash=section;

try{

await selected.module(container);

}
catch(error){

console.error("Error cargando módulo:",error);

container.innerHTML=`Error cargando módulo ${section}`;

}

}