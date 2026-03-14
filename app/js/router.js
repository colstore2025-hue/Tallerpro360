/**
 * router.js
 * Smart SPA Router con AutoLoader
 */

import { getModules } from "./system/moduleLoader.js";

console.log("📦 Smart Router iniciado");


/* ======================================
CARGAR MODULOS AUTOMÁTICOS
====================================== */

const sections = getModules();


/* ======================================
CACHE
====================================== */

const moduleCache = {};


/* ======================================
MENU
====================================== */

export function buildMenu(){

const menu = document.getElementById("menu");

if(!menu) return;

menu.innerHTML="";

Object.entries(sections).forEach(([key,section])=>{

const btn=document.createElement("button");

btn.innerText=section.name;

btn.onclick=()=>{

window.location.hash=key;

};

menu.appendChild(btn);

});

}


/* ======================================
INIT ROUTER
====================================== */

export function initRouter(){

window.addEventListener("hashchange",handleHashChange);

handleHashChange();

}


/* ======================================
HASH
====================================== */

function handleHashChange(){

let hash=window.location.hash.replace("#","");

if(!sections[hash]){

hash="dashboard";

}

loadSection(hash);

}


/* ======================================
LOAD MODULE
====================================== */

async function loadSection(section){

const container=document.getElementById("appContent");

if(!container) return;

const selected=sections[section];

container.innerHTML=`
<div class="card">
⏳ Cargando ${selected.name}...
</div>
`;

try{

let module;

if(moduleCache[section]){

module=moduleCache[section];

}else{

module=await import(selected.path);

moduleCache[section]=module;

}

const moduleFunction=
module[section] ||
module.default ||
Object.values(module)[0];

if(typeof moduleFunction!=="function"){

throw new Error("El módulo no exporta función");

}

await moduleFunction(container);

activarMenu(section);

}
catch(error){

console.error("❌ Error cargando módulo:",error);

container.innerHTML=`
<div class="card">
❌ Error cargando módulo ${section}
</div>
`;

}

}


/* ======================================
MENU ACTIVO
====================================== */

function activarMenu(section){

const buttons=document.querySelectorAll("#menu button");

buttons.forEach(btn=>btn.classList.remove("activo"));

const index=Object.keys(sections).indexOf(section);

if(buttons[index]){

buttons[index].classList.add("activo");

}

}