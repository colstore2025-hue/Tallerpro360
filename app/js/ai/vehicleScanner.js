/**
 * vehicleScanner.js
 * Escáner inteligente PRO360
 */

class VehicleScanner {

  constructor(){

    this.vehicleData = {};

    console.log("🔎 VehicleScanner listo");
  }

  /* ===============================
  NORMALIZAR TEXTO
  ============================== */
  normalize(text){
    if(!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .trim();
  }

  /* ===============================
  ESCANEAR VEHICULO
  ============================== */
  scanVehicle(obdData = {}, customerSymptoms = []){

    console.log("🔎 Escaneando vehículo...");

    this.vehicleData.obd = obdData || {};
    this.vehicleData.symptoms = (customerSymptoms || []).map(s => this.normalize(s));

    return this.analyze();
  }

  /* ===============================
  ANALISIS TECNICO INTELIGENTE
  ============================== */
  analyze(){

    const findings = [];

    const obd = this.vehicleData.obd || {};
    const symptoms = this.vehicleData.symptoms || [];

    /* ===============================
    TEMPERATURA MOTOR
    ============================== */
    if(obd.engineTemp){

      if(obd.engineTemp > 105){
        findings.push({
          problema: "Sobrecalentamiento del motor",
          gravedad: "alta"
        });
      }

      if(obd.engineTemp > 95 && obd.engineTemp <= 105){
        findings.push({
          problema: "Temperatura elevada del motor",
          gravedad: "media"
        });
      }
    }

    /* ===============================
    BATERÍA
    ============================== */
    if(obd.batteryVoltage){

      if(obd.batteryVoltage < 12){
        findings.push({
          problema: "Batería baja o alternador defectuoso",
          gravedad: "alta"
        });
      }

      if(obd.batteryVoltage >= 12 && obd.batteryVoltage < 12.5){
        findings.push({
          problema: "Nivel de batería bajo",
          gravedad: "media"
        });
      }
    }

    /* ===============================
    FRENOS
    ============================== */
    const tieneRuidoFrenos = symptoms.some(s =>
      s.includes("freno") && s.includes("ruido")
    );

    if(tieneRuidoFrenos){
      findings.push({
        problema: "Posible desgaste de pastillas de freno",
        gravedad: "media"
      });
    }

    /* ===============================
    MOTOR (SÍNTOMAS)
    ============================== */
    const ruidoMotor = symptoms.some(s =>
      s.includes("ruido") && s.includes("motor")
    );

    if(ruidoMotor){
      findings.push({
        problema: "Ruido anormal en el motor",
        gravedad: "alta"
      });
    }

    /* ===============================
    RESULTADO FINAL
    ============================== */
    return findings;
  }

}

export default VehicleScanner;