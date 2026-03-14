/**
 * predictiveMaintenanceAI.js
 * IA de mantenimiento predictivo
 * TallerPRO360 ERP
 */

import { analizarFallaGlobal } from "./globalDiagnosticsAI.js";

class PredictiveMaintenanceAI {

constructor(){

console.log("🔮 Predictive Maintenance AI iniciada");

}


/* ======================================
PREDICCION PRINCIPAL
====================================== */

async predict(vehicleHistory = {}){

try{

const alerts = []

if(!vehicleHistory) return alerts


/* ==============================
ACEITE
============================== */

if(vehicleHistory.kmUltimoAceite){

const km =
(vehicleHistory.kmActual || 0) -
(vehicleHistory.kmUltimoAceite || 0)

if(km > 8000){

alerts.push({

type:"maintenance",
component:"engine_oil",
message:"Cambio de aceite recomendado",
priority:"alta",
km

})

}

}


/* ==============================
FRENOS
============================== */

if(vehicleHistory.brakeWear){

if(vehicleHistory.brakeWear > 70){

alerts.push({

type:"safety",
component:"brakes",
message:"Pastillas de freno próximas a cambio",
priority:"alta"

})

}

}


/* ==============================
SUSPENSION
============================== */

if(vehicleHistory.kmActual > 90000){

alerts.push({

type:"maintenance",
component:"suspension",
message:"Revisar sistema de suspensión",
priority:"media"

})

}


/* ==============================
BATERIA
============================== */

if(vehicleHistory.batteryAge){

if(vehicleHistory.batteryAge > 3){

alerts.push({

type:"maintenance",
component:"battery",
message:"Revisar estado de batería",
priority:"media"

})

}

}


/* ==============================
IA GLOBAL (MUY IMPORTANTE)
============================== */

if(
vehicleHistory.marca &&
vehicleHistory.modelo &&
vehicleHistory.fallaActual
){

try{

const globalData = await analizarFallaGlobal(

vehicleHistory.marca,
vehicleHistory.modelo,
vehicleHistory.fallaActual

)

if(globalData && globalData.length){

alerts.push({

type:"ai_prediction",
component:"global_pattern",
message:"IA global detecta repuestos comunes para esta falla",
priority:"media",
data:globalData

})

}

}catch(e){

console.warn("IA global no disponible")

}

}


/* ==============================
RESULTADO
============================== */

return alerts

}
catch(error){

console.error("❌ Error Predictive Maintenance:",error)

return []

}

}


/* ======================================
EVALUAR SALUD DEL VEHICULO
====================================== */

vehicleHealthScore(vehicleHistory = {}){

let score = 100


if(vehicleHistory.brakeWear > 70){
score -= 20
}

if(vehicleHistory.batteryAge > 3){
score -= 10
}

if(vehicleHistory.kmActual > 100000){
score -= 15
}

if(vehicleHistory.kmUltimoAceite){

const km =
(vehicleHistory.kmActual || 0) -
(vehicleHistory.kmUltimoAceite || 0)

if(km > 8000){
score -= 10
}

}

if(score < 0) score = 0

return score

}

}


/* ======================================
INSTANCIA GLOBAL
====================================== */

const predictiveMaintenanceAI = new PredictiveMaintenanceAI()

export default predictiveMaintenanceAI


/* ======================================
GLOBAL DEBUG
====================================== */

if(typeof window !== "undefined"){

window.PredictiveMaintenanceAI = predictiveMaintenanceAI

}