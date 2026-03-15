/**
 * router.js
 * Router simple compatible con moduleLoader
 * TallerPRO360 ERP
 */

import { moduleLoader } from "./system/moduleLoader.js";

console.log("🧭 Router iniciado");

export function initRouter(){

window.addEventListener("hashchange",handleHashChange);

handleHashChange();

}

function handleHashChange(){

let hash = window.location.hash.replace("#","");

if(!hash){

hash="dashboard";

}

const container=document.getElementById("mainPanel");

if(!container){

console.error("❌ mainPanel no encontrado");
return;

}

moduleLoader.load(hash,container);

}