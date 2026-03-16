/**
 * planManager.js
 * Control de módulos por plan
 * TallerPRO360
 */

import { db } from "./js/core/firebase-config.js";

import {
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================
MÓDULOS POR PLAN
========================================= */

const PLANES = {

freemium: [
"dashboard",
"clientes",
"ordenes",
"inventario",
"reportes",
"configuracion"
],

pro: [
"dashboard",
"clientes",
"ordenes",
"inventario",
"finanzas",
"pagos",
"reportes",
"configuracion"
],

enterprise: [
"dashboard",
"clientes",
"ordenes",
"inventario",
"finanzas",
"contabilidad",
"pagos",
"ceo",
"aiassistant",
"aiadvisor",
"reportes",
"configuracion"
]

};


/* =========================================
OBTENER PLAN USUARIO
========================================= */

export async function obtenerPlanUsuario(uid){

try{

const ref = doc(db,"usuariosGlobal",uid);

const snap = await getDoc(ref);

if(!snap.exists()){

console.warn("usuario no existe");

return "freemium";

}

const data = snap.data();

return data.planTipo || "freemium";

}
catch(e){

console.error("error obteniendo plan",e);

return "freemium";

}

}


/* =========================================
MÓDULOS DISPONIBLES
========================================= */

export async function getModulosDisponibles(uid){

const plan = await obtenerPlanUsuario(uid);

console.log("plan usuario:",plan);

const modulos = PLANES[plan];

if(!modulos){

return PLANES["freemium"];

}

return modulos;

}