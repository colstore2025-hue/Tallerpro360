/**
 * Predictive Maintenance AI
 * TallerPRO360
 * Predicción inteligente de mantenimiento
 */

export class PredictiveMaintenanceAI {

predict(vehicleHistory){

let alerts = []

if(!vehicleHistory) return alerts


/* ==============================
CAMBIO ACEITE
============================== */

if(vehicleHistory.kmUltimoAceite){

const km = vehicleHistory.kmActual - vehicleHistory.kmUltimoAceite

if(km > 8000){
alerts.push({
tipo:"mantenimiento",
mensaje:"Cambio de aceite recomendado",
prioridad:"alta"
})
}

}


/* ==============================
FRENOS
============================== */

if(vehicleHistory.brakeWear){

if(vehicleHistory.brakeWear > 70){

alerts.push({
tipo:"seguridad",
mensaje:"Pastillas de freno próximas a cambio",
prioridad:"alta"
})

}

}


/* ==============================
SUSPENSIÓN
============================== */

if(vehicleHistory.kmActual > 90000){

alerts.push({
tipo:"mantenimiento",
mensaje:"Revisar sistema de suspensión",
prioridad:"media"
})

}


/* ==============================
BATERÍA
============================== */

if(vehicleHistory.batteryAge){

if(vehicleHistory.batteryAge > 3){

alerts.push({
tipo:"mantenimiento",
mensaje:"Revisar estado de batería",
prioridad:"media"
})

}

}


return alerts

}

}