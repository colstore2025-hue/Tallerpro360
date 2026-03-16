/**
 * planManager.js
 * Control de acceso a módulos según plan
 * TallerPRO360 ERP
 * Versión Estable SaaS
 */

import { db } from "./core/firebase-config.js";

import {
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ============================
DEFINICIÓN DE PLANES
============================ */

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

enterprise:[
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
]

};



/* ============================
OBTENER MÓDULOS SEGÚN PLAN
============================ */

export async function getModulosDisponibles(userId){

try{

/* seguridad básica */

if(!userId){

console.warn("⚠ userId no recibido → freemium");

return PLANES.freemium;

}


/* consultar usuario */

const ref = doc(db,"usuariosGlobal",userId);

const snap = await getDoc(ref);

let plan="freemium";


/* usuario encontrado */

if(snap.exists()){

const data = snap.data() || {};

plan = (data.planTipo || "freemium")
.toString()
.toLowerCase()
.trim();

}else{

console.warn("⚠ usuario no encontrado → freemium");

}


/* validar plan */

if(!PLANES[plan]){

console.warn("⚠ plan desconocido:",plan);

plan="freemium";

}


console.log("📦 Plan usuario:",plan);

console.log("🧩 Módulos habilitados:",PLANES[plan]);

return PLANES[plan];


}catch(e){

console.error("❌ Error leyendo plan:",e);

/* fallback seguro */

return PLANES.freemium;

}

}