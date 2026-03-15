/**
 * router.js
 * Smart Router + AI Module Scanner
 * TallerPRO360 ERP
 */

import { scanModules } from "./system/moduleScanner.js";

console.log("📦 Router inteligente iniciado");

/* =====================================
ESCANEAR MODULOS
===================================== */

let sections = {};

try{

sections = scanModules();

}catch(e){

console.error("Error escaneando módulos:",e);

}

/* fallback si scanner falla */

if(!sections || Object.keys(sections).length===0){

console.warn("⚠️ Scanner vacío. Usando fallback");

sections = {

dashboard:{
name:"Dashboard",
path:"./modules/dashboard.js"
},

clientes:{
name:"Clientes",
path:"./modules/clientes.js"
},

ordenes:{
name:"Órdenes",
path:"./modules/ordenes.js"
},

inventario:{
name:"Inventario",
path:"./modules/inventario.js"
},

reportes:{
name:"Reportes",
path:"./modules/reportes.js"
},

configuracion:{
name:"Configuración",
path:"./modules/configuracion.js"
}

};

}

/* =====================================
CACHE DE MODULOS
===================================== */

const moduleCache = {};


/* =====================================
CREAR MENU
===================================== */

export function buildMenu(){

const menu = document.getElementById("menu");

if(!menu){

console.error("❌ Menu no encontrado");
return;

}

menu.innerHTML = "";

Object.entries(sections).forEach(([key,section])=>{

const btn = document.createElement("button");

btn.innerText = section.name;

btn.dataset.module = key;

btn.style.display="block";
btn.style.width="100%";
btn.style.margin="8px 0";
btn.style.padding="10px";
btn.style.borderRadius="6px";
btn.style.border="1px solid #1e293b";
btn.style.background="#0f172a";
btn.style.color="white";
btn.style.cursor="pointer";

btn.onclick = ()=>{

window.location.hash = key;

};

menu.appendChild(btn);

});

console.log("📋 Menu generado:",Object.keys(sections).length,"módulos");

}


/* =====================================
INICIAR ROUTER
===================================== */

export function initRouter(){

console.log("🧭 Router iniciado");

/* generar menu */

buildMenu();

window.addEventListener("hashchange",handleHashChange);

handleHashChange();

/* precargar dashboard */

preloadModule("dashboard");

}


/* =====================================
GESTION HASH
===================================== */

function handleHashChange(){

let hash = window.location.hash.replace("#","");

if(!sections[hash]){

hash = "dashboard";

}

loadSection(hash);

}


/* =====================================
CARGAR MODULO
===================================== */

async function loadSection(section){

/* IMPORTANTE */
const container = document.getElementById("mainPanel");

if(!container){

console.error("❌ mainPanel no encontrado");
return;

}

const selected = sections[section];

container.innerHTML = `
<div class="card">
⏳ Cargando ${selected.name}...
</div>
`;

try{

let module;

/* usar cache */

if(moduleCache[section]){

module = moduleCache[section];

}else{

module = await import(selected.path);

moduleCache[section] = module;

}

/* detectar función */

let moduleFunction = module[section];

if(!moduleFunction){

moduleFunction = module.default;

}

if(!moduleFunction){

moduleFunction = Object.values(module).find(v=>typeof v==="function");

}

if(!moduleFunction){

throw new Error("El módulo no exporta función válida");

}

/* ejecutar módulo */

await moduleFunction(container);

activateMenu(section);

console.log("✅ Módulo cargado:",section);

}
catch(error){

console.error("❌ Error cargando módulo:",section,error);

container.innerHTML = `
<div class="card">

<h2>⚠️ Error cargando módulo</h2>

<p>Módulo: <b>${section}</b></p>

<button onclick="location.hash='dashboard'">
Volver al Dashboard
</button>

</div>
`;

}

}


/* =====================================
PRELOAD MODULO
===================================== */

async function preloadModule(name){

if(!sections[name]) return;

try{

await import(sections[name].path);

console.log("⚡ Módulo precargado:",name);

}catch(e){

console.warn("⚠️ No se pudo precargar:",name);

}

}


/* =====================================
MENU ACTIVO
===================================== */

function activateMenu(section){

const buttons = document.querySelectorAll("#menu button");

buttons.forEach(btn=>{

btn.classList.remove("activo");

if(btn.dataset.module===section){

btn.classList.add("activo");

}

});

}