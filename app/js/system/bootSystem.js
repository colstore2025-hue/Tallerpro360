/**
 * bootSystem.js
 * Sistema de arranque principal
 * TallerPRO360 ERP
 */

/* =====================================
IMPORTS
===================================== */

import "../system/autoRegisterModules.js";
import { iniciarApp } from "../core/app-init.js";
import { bootStatus } from "./bootDiagnostic.js";


/* =====================================
PREVENIR DOBLE ARRANQUE
===================================== */

let systemStarted = false;


/* =====================================
BOOT PRINCIPAL
===================================== */

export async function bootSystem(){

if(systemStarted){
console.warn("⚠ Boot ya ejecutado");
return;
}

systemStarted = true;

console.log("🚀 Boot System iniciado");

try{

/* =====================================
1. VERIFICAR NAVEGADOR
===================================== */

bootStatus("Verificando navegador");

if(!window.localStorage){
throw new Error("LocalStorage no disponible");
}


/* =====================================
2. VERIFICAR DOM
===================================== */

bootStatus("Verificando DOM");

const app = document.getElementById("appContent");

if(!app){
throw new Error("Contenedor #appContent no existe");
}


/* =====================================
3. VERIFICAR SESIÓN
===================================== */

bootStatus("Verificando sesión");

const uid = localStorage.getItem("uid");

if(!uid){

console.warn("⚠ Sesión no encontrada");

window.location.href="/login.html";

return;

}

console.log("👤 Usuario activo:",uid);


/* =====================================
4. PANTALLA DE ARRANQUE
===================================== */

bootStatus("Inicializando sistema");

app.innerHTML = `
<div style="
padding:40px;
text-align:center;
font-family:Arial;
">

<h2 style="margin-bottom:10px">
🚀 Iniciando TallerPRO360
</h2>

<p style="color:#64748b">
Preparando ERP inteligente...
</p>

</div>
`;


/* =====================================
5. INICIAR ERP
===================================== */

bootStatus("Cargando panel ERP");

await iniciarApp();


/* =====================================
6. SISTEMA LISTO
===================================== */

bootStatus("Sistema listo");

console.log("✅ TallerPRO360 cargado correctamente");

}
catch(error){

console.error("❌ Error Boot System:",error);

mostrarError(error);

}

}


/* =====================================
PANTALLA DE ERROR SEGURA
===================================== */

function mostrarError(error){

const app = document.getElementById("appContent");

if(!app) return;

app.innerHTML = `
<div style="
padding:40px;
text-align:center;
font-family:Arial;
">

<h2 style="color:#dc2626">
⚠ Error iniciando el sistema
</h2>

<p style="margin:20px 0">
${error.message}
</p>

<button
onclick="location.reload()"
style="
padding:12px 20px;
background:#16a34a;
border:none;
border-radius:6px;
color:white;
cursor:pointer;
font-weight:bold;
">

Reiniciar Sistema

</button>

</div>
`;

}