/**
 * vehicleScanner.js
 * TallerPRO360 ERP
 * Escáner de vehículo y diagnóstico inicial
 */

class VehicleScanner {

constructor(){

this.vehicleData = {}

console.log("🔎 VehicleScanner listo")

}


/* ===============================
ESCANEAR VEHICULO
=============================== */

scanVehicle(obdData = {}, customerSymptoms = []){

console.log("🔎 Escaneando vehículo...")

this.vehicleData.obd = obdData || {}
this.vehicleData.symptoms = customerSymptoms || []

return this.analyze()

}


/* ===============================
ANALISIS TECNICO
=============================== */

analyze(){

let diagnosis = []

const obd = this.vehicleData.obd || {}
const symptoms = this.vehicleData.symptoms || []


/* TEMPERATURA MOTOR */

if(obd.engineTemp && obd.engineTemp > 105){

diagnosis.push("Sobrecalentamiento del motor")

}


/* BATERIA */

if(obd.batteryVoltage && obd.batteryVoltage < 12){

diagnosis.push("Batería baja o alternador defectuoso")

}


/* FRENOS */

if(symptoms.includes("ruido frenos")){

diagnosis.push("Posible desgaste de pastillas")

}

return diagnosis

}

}

export default VehicleScanner