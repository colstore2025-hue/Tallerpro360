/**
 * vehicleScanner.js
 * TallerPRO360 ERP
 * Escáner de vehículo y diagnóstico inicial
 */

class VehicleScanner {

  constructor(){
    this.vehicleData = {}
  }

  scanVehicle(obdData, customerSymptoms){

    console.log("🔎 Escaneando vehículo...")

    this.vehicleData.obd = obdData
    this.vehicleData.symptoms = customerSymptoms

    return this.analyze()
  }

  analyze(){

    let diagnosis = []

    if(this.vehicleData.obd.engineTemp > 105){
      diagnosis.push("Sobrecalentamiento del motor")
    }

    if(this.vehicleData.obd.batteryVoltage < 12){
      diagnosis.push("Batería baja o alternador defectuoso")
    }

    if(this.vehicleData.symptoms.includes("ruido frenos")){
      diagnosis.push("Posible desgaste de pastillas")
    }

    return diagnosis
  }

}

export default VehicleScanner;