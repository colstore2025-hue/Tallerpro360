/**
 * router.js
 * Router SPA inteligente
 * TallerPRO360 ERP
 */

console.log("📦 Smart Router cargado");


/* =====================================
SECCIONES DEL SISTEMA
===================================== */

const sections = {

dashboard:{name:"Dashboard",path:"./modules/dashboard.js"},
clientes:{name:"Clientes",path:"./modules/clientes.js"},
ordenes:{name:"Órdenes",path:"./modules/ordenes.js"},
inventario:{name:"Inventario",path:"./modules/inventario.js"},
finanzas:{name:"Finanzas",path:"./modules/finanzas.js"},
pagos:{name:"Pagos",path:"./modules/pagos.js"},
ceo:{name:"CEO",path:"./modules/ceo.js"},

/* IA */

aiadvisor:{name:"AI Advisor",path:"./modules/aiAdvisor.js"}

};


/* =====================================
CACHE DE MODULOS
===================================== */

const moduleCache = {};


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

btn.onclick = ()=>loadSection(key);

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
CAMBIO DE HASH
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

container.innerHTML="Sección no encontrada";
return;

}

/* loader */

container.innerHTML=`
<div class="card">
⏳ Cargando ${selected.name}...
</div>
`;

/* actualizar URL */

if(window.location.hash !== "#"+section){

window.location.hash = section;

}

try{

let module;

/* =============================
CACHE INTELIGENTE
============================= */

if(moduleCache[section]){

module = moduleCache[section];

}else{

module = await import(selected.path);

moduleCache[section] = module;

}

/* =============================
EJECUTAR MODULO
============================= */

const moduleFunction = module[section] || Object.values(module)[0];

if(typeof moduleFunction !== "function"){

throw new Error("El módulo no exporta función");

}

await moduleFunction(container);

/* activar menu */

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