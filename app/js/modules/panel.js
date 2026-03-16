/**
 * panel.js
 * Panel principal del ERP
 * TallerPRO360 - Versión SaaS Estable
 */

import { dashboard } from "./dashboard.js";
import { clientes } from "./clientes.js";
import { ordenes } from "./ordenes.js";
import { inventario } from "./inventario.js";
import { finanzas } from "./finanzas.js";
import { contabilidad } from "./contabilidad.js";
import { pagosTaller } from "./pagosTaller.js";
import { ceo } from "./ceo.js";
import { aiAssistant } from "./aiAssistant.js";
import { aiAdvisor } from "./aiAdvisor.js";
import { configuracion } from "./configuracion.js";
import { reportes } from "./reportes.js";

/* RUTA CORREGIDA */
import { getModulosDisponibles } from "../../planManager.js";

import { loadAICore } from "../system/aiCoreLoader.js";
import { moduleLoader } from "../system/moduleLoader.js";


export async function panel(container,userId){

console.log("🧠 Iniciando Panel TallerPRO360");


/* ===============================
INTERFAZ PRINCIPAL
=============================== */

container.innerHTML = `
<div style="display:flex;height:100vh;font-family:Arial">

<nav style="width:260px;background:#020617;padding:20px;color:white;overflow:auto">

<h2 style="margin-top:0;">TallerPRO360</h2>

<div id="menu"></div>

<button id="logoutBtn"
style="margin-top:20px;background:#dc2626;color:white;padding:10px;border:none;border-radius:6px;width:100%;cursor:pointer;">
Cerrar sesión
</button>

</nav>

<main id="mainPanel"
style="flex:1;padding:25px;background:#1e293b;color:white;overflow:auto">

Inicializando sistema...

</main>

</div>
`;


/* ===============================
REFERENCIAS DOM
=============================== */

const menu = document.getElementById("menu");
const main = document.getElementById("mainPanel");


/* ===============================
INICIAR IA DEL SISTEMA
=============================== */

try{

await loadAICore();
console.log("🤖 IA del sistema cargada");

}catch(e){

console.warn("IA no cargó:",e);

}


/* ===============================
REGISTRAR MÓDULOS
=============================== */

moduleLoader.register("dashboard",dashboard);
moduleLoader.register("clientes",clientes);
moduleLoader.register("ordenes",ordenes);
moduleLoader.register("inventario",inventario);
moduleLoader.register("finanzas",finanzas);
moduleLoader.register("contabilidad",contabilidad);
moduleLoader.register("pagos",pagosTaller);
moduleLoader.register("ceo",ceo);

/* IA */

moduleLoader.register("aiassistant",aiAssistant);
moduleLoader.register("aiadvisor",aiAdvisor);

moduleLoader.register("configuracion",configuracion);
moduleLoader.register("reportes",reportes);


/* ===============================
OBTENER PLAN DEL USUARIO
=============================== */

let modulosPermitidos=[];

try{

modulosPermitidos = await getModulosDisponibles(userId);
console.log("📦 módulos permitidos:",modulosPermitidos);

}catch(e){

console.error("Error obteniendo plan:",e);

}


/* ===============================
FALLBACK SI FALLA FIRESTORE
=============================== */

if(!modulosPermitidos || modulosPermitidos.length===0){

console.warn("⚠ Usando módulos mínimos");

modulosPermitidos=[
"dashboard",
"clientes",
"ordenes",
"inventario",
"reportes",
"configuracion"
];

}


/* ===============================
GENERAR MENÚ DINÁMICO
=============================== */

menu.innerHTML="";

modulosPermitidos.forEach(nombre=>{

const btn=document.createElement("button");

/* nombre amigable */

btn.textContent = nombre
.replace(/([A-Z])/g," $1")
.replace(/^./,c=>c.toUpperCase())
.trim();


btn.style.display="block";
btn.style.width="100%";
btn.style.margin="8px 0";
btn.style.padding="10px";
btn.style.background="#0f172a";
btn.style.border="1px solid #1e293b";
btn.style.color="white";
btn.style.cursor="pointer";
btn.style.borderRadius="6px";


/* cargar módulo */

btn.onclick=()=>moduleLoader.load(nombre.toLowerCase(),main,userId);

menu.appendChild(btn);

});


/* ===============================
CARGAR DASHBOARD INICIAL
=============================== */

await moduleLoader.load("dashboard",main,userId);


/* ===============================
LOGOUT
=============================== */

document.getElementById("logoutBtn").onclick=()=>{

localStorage.removeItem("uid");
localStorage.removeItem("empresaId");

location.href="/login.html";

};


console.log("✅ Panel cargado correctamente");

/* diagnóstico */

moduleLoader.diagnostic();

}