/**
 * planManager.js
 * Gestor ULTRA de planes SaaS
 * TallerPRO360 ERP
 */

import { db } from "./core/firebase-config.js";

import {
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================
TODOS LOS MÓDULOS DEL SISTEMA
========================================= */

const TODOS_MODULOS = [

"dashboard",
"clientes",
"ordenes",
"inventario",
"reportes",
"finanzas",
"pagos",
"contabilidad",
"ceo",
"aiassistant",
"aiadvisor",
"configuracion"

];


/* =========================================
PLANES DEL SISTEMA
========================================= */

const PLANES = {

freemium:[
"dashboard",
"clientes",
"ordenes",
"inventario",
"reportes",
"configuracion"
],

basico:[
"dashboard",
"clientes",
"ordenes",
"inventario",
"reportes",
"finanzas",
"pagos",
"configuracion"
],

pro:[
"dashboard",
"clientes",
"ordenes",
"inventario",
"reportes",
"finanzas",
"pagos",
"contabilidad",
"configuracion"
],

elite:[
"dashboard",
"clientes",
"ordenes",
"inventario",
"reportes",
"finanzas",
"pagos",
"contabilidad",
"ceo",
"aiassistant",
"aiadvisor",
"configuracion"
],

enterprise:TODOS_MODULOS

};



/* =========================================
UTILIDAD: limpiar lista de módulos
========================================= */

function limpiarModulos(lista){

if(!Array.isArray(lista)) return [];

return [...new Set(lista.map(m=>m.toLowerCase().trim()))];

}



/* =========================================
OBTENER MÓDULOS DISPONIBLES
========================================= */

export async function getModulosDisponibles(userId){

try{

/* ---------------------------
VALIDACIÓN BÁSICA
--------------------------- */

if(!userId){

console.warn("⚠ userId no recibido");

return PLANES.freemium;

}


/* ---------------------------
CONSULTAR FIRESTORE
--------------------------- */

const ref = doc(db,"usuariosGlobal",userId);

const snap = await getDoc(ref);

let plan="freemium";
let rolGlobal="";
let activo=true;


/* ---------------------------
DATOS DE USUARIO
--------------------------- */

if(snap.exists()){

const data = snap.data() || {};

plan = (data.planTipo || "freemium")
.toString()
.toLowerCase()
.trim();

rolGlobal = (data.rolGlobal || "")
.toString()
.toLowerCase()
.trim();

activo = data.activo !== false;

}else{

console.warn("⚠ usuario no encontrado");

}


/* ---------------------------
USUARIO DESACTIVADO
--------------------------- */

if(!activo){

console.warn("⛔ usuario desactivado");

return [];

}


/* ---------------------------
SUPERADMIN
--------------------------- */

if(rolGlobal === "superadmin"){

console.log("🧠 SuperAdmin detectado");

return limpiarModulos(TODOS_MODULOS);

}


/* ---------------------------
VALIDAR PLAN
--------------------------- */

if(!PLANES[plan]){

console.warn("⚠ plan inválido:",plan);

plan="freemium";

}


/* ---------------------------
OBTENER MÓDULOS
--------------------------- */

const modulos = limpiarModulos(PLANES[plan]);


/* ---------------------------
LOGS DE DIAGNÓSTICO
--------------------------- */

console.log("──────── TallerPRO360 SaaS ────────");

console.log("👤 Usuario:",userId);

console.log("📦 Plan:",plan);

console.log("🏢 Rol Global:",rolGlobal);

console.log("🧩 Módulos:",modulos);

console.log("────────────────────────────────");


return modulos;


}catch(e){

console.error("❌ Error planManager:",e);

/* fallback seguro */

return PLANES.freemium;

}

}