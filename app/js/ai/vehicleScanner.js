/**
 * vehicleScanner.js - NEXUS-X V31.2 🛰️
 * Escáner inteligente PRO360 - "The Digital Stethoscope"
 */

class VehicleScanner {
  constructor() {
    this.vehicleData = {};
    console.log("🔎 VehicleScanner: Sensores térmicos y acústicos calibrados.");
  }

  normalize(text) {
    if (!text) return "";
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  /* ===============================
  ESCANEAR VEHICULO (Integración OBD + Voz)
  ============================== */
  scanVehicle(obdData = {}, customerSymptoms = []) {
    this.vehicleData.obd = obdData || {};
    // Si viene un string (desde la voz), lo convertimos en array
    const symptomsArray = Array.isArray(customerSymptoms) ? customerSymptoms : [customerSymptoms];
    this.vehicleData.symptoms = symptomsArray.map(s => this.normalize(s));

    return this.analyze();
  }

  analyze() {
    const findings = [];
    const { engineTemp, batteryVoltage, oilPressure } = this.vehicleData.obd;
    const symptoms = this.vehicleData.symptoms;

    // --- ANÁLISIS TÉRMICO ---
    if (engineTemp) {
      if (engineTemp > 105) findings.push({ id: "HOT_CRITICAL", problema: "Sobrecalentamiento Crítico", gravedad: "alta", icon: "🔥" });
      else if (engineTemp > 98) findings.push({ id: "HOT_WARN", problema: "Temperatura fuera de rango", gravedad: "media", icon: "🌡️" });
    }

    // --- ANÁLISIS ELÉCTRICO ---
    if (batteryVoltage) {
      if (batteryVoltage < 11.8) findings.push({ id: "BAT_DEAD", problema: "Batería/Alternador en fallo", gravedad: "alta", icon: "🪫" });
      else if (batteryVoltage < 12.4) findings.push({ id: "BAT_LOW", problema: "Batería con carga baja", gravedad: "media", icon: "⚡" });
    }

    // --- ANÁLISIS DE SÍNTOMAS ACÚSTICOS Y VIBRACIÓN (NLP Simple) ---
    const check = (keywords) => symptoms.some(s => keywords.every(k => s.includes(k)));

    if (check(["freno", "ruido"]) || check(["freno", "chilla"])) 
        findings.push({ id: "BRAKE_WEAR", problema: "Desgaste de Pastillas/Discos", gravedad: "media", icon: "🛑" });

    if (check(["motor", "ruido"]) || check(["golpe", "motor"])) 
        findings.push({ id: "ENG_NOISE", problema: "Ruido interno de motor (Posible biela/valvulas)", gravedad: "alta", icon: "⚙️" });

    if (check(["vibracion"]) || check(["tiembla"])) 
        findings.push({ id: "VIB_ISSUE", problema: "Inestabilidad/Vibración (Soportes o Balanceo)", gravedad: "media", icon: "📳" });

    if (check(["humo", "azul"]) || check(["humo", "negro"])) 
        findings.push({ id: "EMISSION_FAIL", problema: "Emisiones contaminantes elevadas", gravedad: "alta", icon: "💨" });

    return findings;
  }
}

export default VehicleScanner;
