/**
 * router.js
 * Smart SPA Router
 * TallerPRO360 ERP
 */

console.log("📦 Smart Router iniciado");


/* =========================================
SECCIONES DEL ERP
========================================= */

const sections = {

dashboard:{name:"Dashboard",path:"./modules/dashboard.js"},
clientes:{name:"Clientes",path:"./modules/clientes.js"},
ordenes:{name:"Órdenes",path:"./modules/ordenes.js"},
inventario:{name:"Inventario",path:"./modules/inventario.js"},
finanzas:{name:"Finanzas",path:"./modules/finanzas.js"},
pagos:{name:"Pagos",path:"./modules/pagos.js"},
ceo:{name:"CEO",path:"./modules/ceo.js"},
aiadvisor:{name:"AI Advisor",path:"./modules/aiAdvisor.js"}

};


/* =========================================
CACHE DE MODULOS
========================================= */

const moduleCache = {};


/* =========================================
CONSTRUIR MENÚ
========================================= */

export function buildMenu(){

const menu = document.getElementById("menu");

if(!menu){

console.error("❌ No existe #menu");
return;

}

menu.innerHTML = "";

Object.entries(sections).forEach(([key,section])=>{

const btn = document.createElement("button");

btn.innerText = section.name;

btn.className = "menu-btn";

btn.onclick = ()=>{

window.location.hash = key;

};

menu.appendChild(btn);

});

}


/* =========================================
INICIAR ROUTER
========================================= */

export function initRouter(){

console.log("🚦 Router iniciado");

window.addEventListener("hashchange", handleHashChange);

handleHashChange();

}


/* =========================================
MANEJAR CAMBIO DE HASH
========================================= */

function handleHashChange(){

let hash = window.location.hash.replace("#","");

if(!sections[hash]){

hash = "dashboard";

}

loadSection(hash);

}


/* =========================================
CARGAR SECCIÓN
========================================= */

async function loadSection(section){

const container = document.getElementById("appContent");

if(!container){

console.error("❌ No existe #appContent");
return;

}

const selected = sections[section];

if(!selected){

container.innerHTML = `
<div class="card">
Sección no encontrada
</div>
`;

return;

}


/* loader */

container.innerHTML = `
<div class="card">
⏳ Cargando ${selected.name}...
</div>
`;


try{

let module;


/* ================================
CACHE INTELIGENTE
================================ */

if(moduleCache[section]){

module = moduleCache[section];

}else{

module = await import(selected.path);

moduleCache[section] = module;

}


/* ================================
OBTENER FUNCIÓN DEL MÓDULO
================================ */

const moduleFunction =
module[section] ||
module.default ||
Object.values(module)[0];

if(typeof moduleFunction !== "function"){

throw new Error("El módulo no exporta función");

}


/* ================================
EJECUTAR MÓDULO
================================ */

await moduleFunction(container);

activarMenu(section);

}
catch(error){

console.error("❌ Error cargando módulo:",error);

container.innerHTML = `
<div class="card">
❌ Error cargando módulo ${section}
</div>
`;

}

}


/* =========================================
ACTIVAR BOTÓN MENÚ
========================================= */

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