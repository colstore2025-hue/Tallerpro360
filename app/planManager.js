/**
 * planManager.js
 * Control de módulos por plan
 */

import { db } from "./core/firebase-config.js";

import {
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const PLANES = {

freemium:[
"dashboard",
"clientes",
"ordenes",
"inventario",
"reportes",
"configuracion"
],

pro:[
"dashboard",
"clientes",
"ordenes",
"inventario",
"finanzas",
"pagos",
"reportes",
"configuracion"
],

enterprise:[
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


/* ========================= */

export async function getModulosDisponibles(uid){

try{

const ref = doc(db,"usuariosGlobal",uid);

const snap = await getDoc(ref);

if(!snap.exists()){

return PLANES.freemium;

}

const data = snap.data();

const plan = data.planTipo || "freemium";

console.log("📊 plan detectado:",plan);

return PLANES[plan] || PLANES.freemium;

}
catch(error){

console.error("error obteniendo plan",error);

return PLANES.freemium;

}

}