/**
 * panel.js
 * Panel principal del ERP
 * TallerPRO360
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

import { getModulosDisponibles } from "../planManager.js";
import { loadAICore } from "../system/aiCoreLoader.js";

export async function panel(container,userId){

console.log("🧠 Cargando Panel ERP");

container.innerHTML=`

<div style="display:flex;height:100vh;">

<nav style="width:260px;background:#020617;padding:20px;color:white;overflow:auto">

<h2>TallerPRO360</h2>

<div id="menu"></div>

<button id="logoutBtn"
style="margin-top:20px;background:#dc2626;color:white;padding:10px;border:none;border-radius:6px;cursor:pointer;">
Salir
</button>

</nav>

<main id="mainPanel"
style="flex:1;padding:25px;background:#1e293b;overflow:auto">

Cargando sistema...

</main>

</div>

`;

await loadAICore();

const menu=document.getElementById("menu");
const main=document.getElementById("mainPanel");

/* ===============================
MAPA DE MÓDULOS
=============================== */

const modulos={

dashboard,
clientes,
ordenes,
inventario,
finanzas,
contabilidad,
pagos:pagosTaller,
ceo,
aiAssistant,
aiAdvisor,
configuracion

};

/* ===============================
CARGAR PLAN DEL USUARIO
=============================== */

let permitidos=[];

try{

permitidos=await getModulosDisponibles(userId);

}catch(e){

console.error("Error cargando plan:",e);

}

/* ===============================
FALLBACK SI NO HAY PLAN
=============================== */

if(!permitidos || permitidos.length===0){

console.warn("Plan no encontrado. Usando fallback.");

permitidos=["dashboard","clientes","ordenes"];

}

/* ===============================
GENERAR MENÚ
=============================== */

menu.innerHTML="";

permitidos.forEach(nombre=>{

const btn=document.createElement("button");

btn.textContent=nombre.charAt(0).toUpperCase()+nombre.slice(1);

btn.style.display="block";
btn.style.width="100%";
btn.style.margin="8px 0";
btn.style.padding="10px";
btn.style.background="#0f172a";
btn.style.border="1px solid #1e293b";
btn.style.color="white";
btn.style.cursor="pointer";
btn.style.borderRadius="6px";

btn.onclick=()=>cargarModulo(nombre);

menu.appendChild(btn);

});

/* ===============================
CARGADOR DE MÓDULOS
=============================== */

async function cargarModulo(nombre){

main.innerHTML="Cargando módulo...";

const fn=modulos[nombre];

if(!fn){

main.innerHTML="<h3>Módulo no encontrado</h3>";
return;

}

try{

await fn(main);

}catch(e){

console.error("Error módulo:",nombre,e);

main.innerHTML=`
<h3>Error cargando módulo</h3>
<p>${nombre}</p>
`;

}

}

/* ===============================
CARGAR DASHBOARD
=============================== */

cargarModulo("dashboard");

/* ===============================
LOGOUT
=============================== */

document.getElementById("logoutBtn").onclick=()=>{

localStorage.removeItem("uid");
localStorage.removeItem("empresaId");

location.href="/login.html";

};

}