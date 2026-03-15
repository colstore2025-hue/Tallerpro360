/**
 * planManager.js
 * Control de acceso a módulos según plan
 * TallerPRO360
 */

import { db } from "./core/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function getModulosDisponibles(userId){

try{

const snap = await getDoc(doc(db,"usuariosGlobal",userId));

let plan="freemium";

if(snap.exists()){

const data=snap.data();

plan=(data.planTipo || "freemium").toLowerCase();

}

/* ============================
PLANES DEL ERP
============================ */

const planes={

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
"aiAssistant",
"aiAdvisor",
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
"aiAssistant",
"aiAdvisor",
"configuracion"
]

};

return planes[plan] || planes["freemium"];

}catch(e){

console.error("Error leyendo plan:",e);

/* fallback seguro */

return [
"dashboard",
"clientes",
"ordenes",
"inventario",
"reportes",
"configuracion"
];

}

}