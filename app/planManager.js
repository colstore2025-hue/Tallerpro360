/**
 * planManager.js
 * Control de módulos según plan del usuario
 * Compatible con Firestore actual de TallerPRO360
 */

import { db } from "./core/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function getModulosDisponibles(userId){

try{

const userSnap = await getDoc(doc(db,"usuariosGlobal",userId));

let plan="freemium";

if(userSnap.exists()){

const data=userSnap.data();

plan=(data.planTipo || "freemium").toLowerCase();

}else{

console.warn("Usuario no encontrado en usuariosGlobal");

}

/* PLANES TALLERPRO360 */

const planes={

freemium:[
"dashboard",
"clientes",
"ordenes",
"inventario",
"configuracion"
],

basico:[
"dashboard",
"clientes",
"ordenes",
"inventario",
"finanzas",
"pagos",
"configuracion"
],

pro:[
"dashboard",
"clientes",
"ordenes",
"inventario",
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

console.error("Error obteniendo plan:",e);

return [
"dashboard",
"clientes",
"ordenes",
"inventario",
"configuracion"
];

}

}