/**
 * aiAutopilot.js
 * TallerPRO360
 * Sistema de inteligencia autónoma del taller
 */

import { db } from "../core/firebase-config.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


class AIAutopilot {

constructor(){

this.report = null;

console.log("🤖 AI Autopilot iniciado");

}


/* =========================================
ANALIZAR NEGOCIO COMPLETO
========================================= */

async analizarTaller(){

try{

console.log("📊 Analizando negocio...");


const ordenesSnap = await getDocs(collection(db,"ordenes"));
const inventarioSnap = await getDocs(collection(db,"inventario"));
const clientesSnap = await getDocs(collection(db,"clientes"));


let ingresos = 0;
let ordenes = 0;

let servicios = {};
let repuestos = {};

ordenesSnap.forEach(doc=>{

const o = doc.data();

ordenes++;

ingresos += Number(o?.estimatedCost?.total || 0);


/* ===============================
SERVICIOS
============================== */

const servicio = o?.diagnosis?.type || "general";

servicios[servicio] = (servicios[servicio] || 0) + 1;


/* ===============================
REPUESTOS
============================== */

o?.partsStatus?.forEach(p=>{

const nombre = p.part;

repuestos[nombre] = (repuestos[nombre] || 0) + 1;

});

});


/* =========================================
TOP SERVICIOS
========================================= */

const topServicios = Object.entries(servicios)
.map(([nombre,cantidad])=>({nombre,cantidad}))
.sort((a,b)=>b.cantidad-a.cantidad)
.slice(0,5);


/* =========================================
REPUESTOS MÁS USADOS
========================================= */

const topRepuestos = Object.entries(repuestos)
.map(([nombre,cantidad])=>({nombre,cantidad}))
.sort((a,b)=>b.cantidad-a.cantidad)
.slice(0,5);


/* =========================================
CLIENTES
========================================= */

let clientes = clientesSnap.size || 0;


/* =========================================
RECOMENDACIONES IA
========================================= */

const recomendaciones = [];


if(ingresos < 5000000){

recomendaciones.push(
"Incrementar campañas de mantenimiento preventivo."
);

}


if(topServicios.length){

recomendaciones.push(
`Promocionar el servicio "${topServicios[0].nombre}" ya que es el más demandado.`
);

}


if(topRepuestos.length){

recomendaciones.push(
`Mantener stock alto de "${topRepuestos[0].nombre}".`
);

}


if(clientes < 50){

recomendaciones.push(
"Implementar programa de fidelización de clientes."
);

}


/* =========================================
REPORTE FINAL
========================================= */

this.report = {

ordenes,
clientes,
ingresos,
topServicios,
topRepuestos,
recomendaciones,
fecha:new Date()

};

console.log("🤖 Reporte AI Autopilot generado");

return this.report;

}
catch(error){

console.error("Error AI Autopilot:",error);

return null;

}

}


/* =========================================
OBTENER REPORTE
========================================= */

getReport(){

return this.report;

}

}


const aiAutopilot = new AIAutopilot();

export default aiAutopilot;


if(typeof window !== "undefined"){

window.AIAutopilot = aiAutopilot;

}