/**
 * globalWorkshopLearning.js
 * TallerPRO360
 * IA colectiva entre talleres
 */

import { db } from "../core/firebase-config.js";

import {
collection,
query,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===============================
ANALIZAR FALLAS GLOBALES
=============================== */

export async function analizarFallasGlobales(){

try{

const q = query(collection(db,"ordenesGlobal"));

const snapshot = await getDocs(q);

const fallas = {};

snapshot.forEach(doc=>{

const orden = doc.data();

const descripcion = (orden.falla || "").toLowerCase();

if(!descripcion) return;

if(!fallas[descripcion]){

fallas[descripcion] = {
conteo:0,
repuestos:{},
acciones:{}
};

}

fallas[descripcion].conteo++;


/* ===============================
REPUESTOS
=============================== */

if(Array.isArray(orden.repuestos)){

orden.repuestos.forEach(r=>{

const repuesto = typeof r === "string" ? r : r.nombre;

if(!repuesto) return;

if(!fallas[descripcion].repuestos[repuesto]){

fallas[descripcion].repuestos[repuesto] = 0;

}

fallas[descripcion].repuestos[repuesto]++;

});

}


/* ===============================
ACCIONES
=============================== */

if(Array.isArray(orden.acciones)){

orden.acciones.forEach(a=>{

const accion = a.descripcion || a;

if(!accion) return;

if(!fallas[descripcion].acciones[accion]){

fallas[descripcion].acciones[accion] = 0;

}

fallas[descripcion].acciones[accion]++;

});

}

});


/* ===============================
CONSTRUIR BASE DE CONOCIMIENTO
=============================== */

const conocimiento = [];

Object.keys(fallas).forEach(falla=>{

const data = fallas[falla];

const repuestos = Object.entries(data.repuestos)
.sort((a,b)=>b[1]-a[1])
.slice(0,3)
.map(r=>r[0]);

const acciones = Object.entries(data.acciones)
.sort((a,b)=>b[1]-a[1])
.slice(0,3)
.map(a=>a[0]);

conocimiento.push({

falla,
frecuencia:data.conteo,
repuestosRecomendados:repuestos,
accionesRecomendadas:acciones

});

});


/* ordenar por frecuencia */

conocimiento.sort((a,b)=>b.frecuencia-a.frecuencia);


/* guardar cache local */

localStorage.setItem(
"knowledgeTallerGlobal",
JSON.stringify(conocimiento)
);

return conocimiento;

}
catch(e){

console.error("Error IA global:",e);
return [];

}

}


/* ===============================
CONSULTAR FALLA
=============================== */

export function sugerirSolucion(falla){

const base = JSON.parse(
localStorage.getItem("knowledgeTallerGlobal") || "[]"
);

const f = falla.toLowerCase();

const resultado = base.find(x=>f.includes(x.falla));

return resultado || null;

}