/**
 * router.js
 * Router SPA principal
 * TallerPRO360 ERP
 */

import { dashboard } from "./modules/dashboard.js";
import { clientes } from "./modules/clientes.js";
import { ordenes } from "./modules/ordenes.js";
import { inventario } from "./modules/inventario.js";
import { finanzas } from "./modules/finanzas.js";
import { ceo } from "./modules/ceo.js";
import { pagos } from "./modules/pagos.js";

console.log("📦 Router cargado");


/* =====================================
SECCIONES DEL SISTEMA
===================================== */

const sections = {

dashboard:{name:"Dashboard",module:dashboard},
clientes:{name:"Clientes",module:clientes},
ordenes:{name:"Órdenes",module:ordenes},
inventario:{name:"Inventario",module:inventario},
finanzas:{name:"Finanzas",module:finanzas},
ceo:{name:"CEO",module:ceo},
pagos:{name:"Pagos",module:pagos}

};


/* =====================================
CONSTRUIR MENÚ
===================================== */

export function buildMenu(){

const menu = document.getElementById("menu");

if(!menu){

console.error("❌ No existe #menu");
return;

}

menu.innerHTML = "";

Object.keys(sections).forEach(key=>{

const btn = document.createElement("button");

btn.innerText = sections[key].name;

btn.className = "menu-btn";

btn.onclick = ()=>{

loadSection(key);

};

menu.appendChild(btn);

});

}


/* =====================================
INICIALIZAR ROUTER
===================================== */

export function initRouter(){

let hash = window.location.hash.replace("#","");

if(!sections[hash]){

hash = "dashboard";

}

loadSection(hash);

window.addEventListener("hashchange", handleHashChange);

}


/* =====================================
MANEJAR CAMBIO DE HASH
===================================== */

function handleHashChange(){

const hash = window.location.hash.replace("#","");

if(sections[hash]){

loadSection(hash);

}

}


/* =====================================
CARGAR SECCIÓN
===================================== */

async function loadSection(section){

const container = document.getElementById("appContent");

if(!container){

console.error("❌ No existe #appContent");
return;

}

const selected = sections[section];

if(!selected){

container.innerHTML = "Sección no encontrada";
return;

}

container.innerHTML = `Cargando ${selected.name}...`;

if(window.location.hash !== "#"+section){

window.location.hash = section;

}

try{

await selected.module(container);

activarMenu(section);

}
catch(error){

console.error("❌ Error cargando módulo:",error);

container.innerHTML = `Error cargando módulo ${section}`;

}

}


/* =====================================
ACTIVAR BOTON MENU
===================================== */

function activarMenu(section){

const buttons = document.querySelectorAll("#menu button");

buttons.forEach(btn=>{

btn.classList.remove("activo");

});

const index = Object.keys(sections).indexOf(section);

if(buttons[index]){

buttons[index].classList.add("activo");

}

}