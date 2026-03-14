/**
 * workshopBrain.js
 * Motor de diagnóstico IA
 */

import { detectarRepuestos } from "./iaMecanica.js";

class WorkshopBrain {

constructor(){

console.log("🧠 WorkshopBrain iniciado");

}

/* ===============================
DIAGNOSTICO IA
=============================== */

async runDiagnosis(vehicleData){

try{

const descripcion = vehicleData?.problem || "";

if(!descripcion){

return {

diagnosis:"Sin descripción del problema",

partsNeeded:[],
estimatedLaborHours:1

};

}

const ia = await detectarRepuestos(descripcion);


/* convertir repuestos IA a solo nombres */

const partsNeeded = (ia?.repuestos || []).map(r =>

typeof r === "string"
? r
: r.nombre

);

return {

diagnosis: ia?.diagnostico || "Diagnóstico generado por IA",

partsNeeded: partsNeeded,

estimatedLaborHours: 2

};

}
catch(error){

console.error("❌ Error en diagnóstico IA:",error);

return {

diagnosis:"No se pudo generar diagnóstico",

partsNeeded:[],
estimatedLaborHours:1

};

}

}


/* ===============================
APRENDIZAJE IA
=============================== */

async trainModel(repairData){

try{

console.log("📚 IA aprendiendo reparación",repairData);

/* futuro: guardar datos para mejorar predicciones */

return true;

}
catch(error){

console.error("Error entrenamiento IA:",error);

return false;

}

}

}

export default WorkshopBrain;