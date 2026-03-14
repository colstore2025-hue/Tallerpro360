/**
 * workshopBrain.js
 * Motor central de diagnóstico IA
 * TallerPRO360 ERP
 */

import { detectarRepuestos } from "./iaMecanica.js";
import VehicleScanner from "./vehicleScanner.js";
import { PredictiveMaintenanceAI } from "./predictiveMaintenanceAI.js";

class WorkshopBrain {

constructor(){

this.scanner = new VehicleScanner();
this.predictiveAI = new PredictiveMaintenanceAI();

console.log("🧠 WorkshopBrain iniciado");

}


/* ===============================
DIAGNOSTICO COMPLETO
=============================== */

async runDiagnosis(vehicleData){

try{

console.log("🔧 Iniciando diagnóstico completo...");

/* ===============================
1 ESCANEO TECNICO
=============================== */

const technicalDiagnosis = this.scanner.scanVehicle(
vehicleData?.obd || {},
vehicleData?.symptoms || []
);


/* ===============================
2 IA MECANICA
=============================== */

const descripcion = vehicleData?.problem || "";

let ia = null;

if(descripcion){

ia = await detectarRepuestos(descripcion);

}


/* ===============================
3 REPUESTOS IA
=============================== */

const partsNeeded = (ia?.repuestos || []).map(r =>

typeof r === "string"
? r
: r.nombre

);


/* ===============================
4 MANTENIMIENTO PREDICTIVO
=============================== */

const predictiveAlerts = this.predictiveAI.predict(
vehicleData?.history || {}
);


/* ===============================
5 RESULTADO FINAL
=============================== */

return {

diagnosis: ia?.diagnostico || "Diagnóstico generado por IA",

technicalFindings: technicalDiagnosis,

predictiveAlerts: predictiveAlerts,

partsNeeded: partsNeeded,

estimatedLaborHours: 2

};

}
catch(error){

console.error("❌ Error en diagnóstico IA:",error);

return {

diagnosis:"No se pudo generar diagnóstico",

technicalFindings:[],

predictiveAlerts:[],

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

/*
FUTURO:

guardar historial de:
- falla
- repuestos usados
- tiempo reparación
- vehículo
*/

return true;

}
catch(error){

console.error("Error entrenamiento IA:",error);

return false;

}

}

}

export default WorkshopBrain;