/**
 * router.js
 * Router SPA inteligente
 */

console.log("📦 Smart Router cargado");


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

const moduleCache = {};


/* MENU */

export function buildMenu(){

const menu = document.getElementById("menu");

if(!menu) return;

menu.innerHTML = "";

Object.keys(sections).forEach(key=>{

const btn = document.createElement("button");

btn.innerText = sections[key].name;

btn.onclick = ()=>{

window.location.hash = key;

};

menu.appendChild(btn);

});

}


/* ROUTER */

export function initRouter(){

window.addEventListener("hashchange", handleHashChange);

handleHashChange();

}


function handleHashChange(){

let hash = window.location.hash.replace("#","");

if(!sections[hash]){

hash="dashboard";

}

loadSection(hash);

}


/* LOAD MODULE */

async function loadSection(section){

const container = document.getElementById("appContent");

if(!container) return;

const selected = sections[section];

container.innerHTML=`
<div class="card">
⏳ Cargando ${selected.name}...
</div>
`;

try{

let module;

if(moduleCache[section]){

module = moduleCache[section];

}else{

module = await import(selected.path);

moduleCache[section] = module;

}

const moduleFunction = module[section] || Object.values(module)[0];

await moduleFunction(container);

activarMenu(section);

}catch(error){

console.error(error);

container.innerHTML=`
<div class="card">
❌ Error cargando ${section}
</div>
`;

}

}


/* MENU ACTIVO */

function activarMenu(section){

const buttons = document.querySelectorAll("#menu button");

buttons.forEach(btn=>btn.classList.remove("activo"));

const index = Object.keys(sections).indexOf(section);

if(buttons[index]){

buttons[index].classList.add("activo");

}

}