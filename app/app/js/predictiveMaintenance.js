class PredictiveMaintenance {

predict(vehicleHistory){

let alerts = []

if(vehicleHistory.km > 90000){
alerts.push("Revisar sistema de suspensión")
}

if(vehicleHistory.lastOilChange > 8000){
alerts.push("Cambio de aceite recomendado")
}

if(vehicleHistory.brakeWear > 70){
alerts.push("Cambio de pastillas pronto")
}

return alerts

}

}

module.exports = PredictiveMaintenance