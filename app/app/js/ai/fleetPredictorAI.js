/**
 * fleetPredictorAI.js
 * TallerPRO360
 * Predicción de mantenimiento para flotas
 */

import { db } from "./firebase.js";

import {
collection,
query,
where,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===============================
ANALIZAR FLOTA
=============================== */

export async function analizarFlota(empresaId){

try{

const vehiculosRef = collection(db,"empresas",empresaId,"vehiculos");

const snapshot = await getDocs(vehiculosRef);

let reporte = [];

snapshot.forEach(doc=>{

const v = doc.data();

const analisis = analizarVehiculo(v);

reporte.push({

vehiculoId:doc.id,
placa:v.placa || "N/A",
modelo:v.modelo || "",
marca:v.marca || "",
riesgo:analisis.riesgo,
alertas:analisis.alertas,
proximoServicio:analisis.proximoServicio,
costoEstimado:analisis.costoEstimado

});

});

return reporte;

}
catch(e){

console.error("Error analizando flota:",e);

return [];

}

}


/* ===============================
ANÁLISIS DE VEHÍCULO
=============================== */

function analizarVehiculo(v){

let alertas = [];

let riesgo = "bajo";

let costoEstimado = 0;


/* ===============================
ACEITE
=============================== */

if(v.kmUltimoAceite && v.kmActual){

const diff = v.k