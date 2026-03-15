/**
 * planManager.js
 * Control de acceso a módulos según plan
 * TallerPRO360 ERP
 */

import { db } from "./core/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function getModulosDisponibles(userId){

try{

const planSnap = await getDoc(doc(db,"usuariosPlanes",userId));

let plan="Freemium";

if(planSnap.exists()){

const data=planSnap.data();

plan=data.plan || "Freemium";

if(data.inicio && data.fin){

const hoy=new Date();

const inicio=data.inicio.toDate ? data.inicio.toDate() : new Date(data.inicio);
const fin=data.fin.toDate ? data.fin.toDate() : new Date(data.fin);

if(hoy<inicio || hoy>fin){

console.warn("Plan expirado → Freemium");
plan="Freemium";

}

}

}

const planes={

Freemium:[
"dashboard",
"clientes",
"ordenes",
"inventario",
"configuracion"
],

Basico:[
"dashboard",
"clientes",
"ordenes",
"inventario",
"finanzas",
"pagos",
"configuracion"
],

Pro:[
"dashboard",
"clientes",
"ordenes",
"inventario",
"finanzas",
"pagos",
"contabilidad",
"configuracion"
],

Elite:[
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

Enterprise:[
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

return planes[plan] || planes["Freemium"];

}catch(e){

console.error("Error cargando plan:",e);

return [
"dashboard",
"clientes",
"ordenes",
"inventario",
"configuracion"
];

}

}