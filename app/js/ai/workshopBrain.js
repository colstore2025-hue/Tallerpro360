/**
 * workshopBrain.js - TallerPRO360 NEXUS-X V31.0 🧠
 * Motor central de diagnóstico IA PRO360 · ULTRA
 */

import { detectarRepuestos } from "./iaMecanica.js";
import VehicleScanner from "./vehicleScanner.js";
import { PredictiveMaintenanceAI } from "./predictiveMaintenanceAI.js";

class WorkshopBrain {
  constructor() {
    this.scanner = new VehicleScanner();
    this.predictiveAI = new PredictiveMaintenanceAI();
    console.log("🧠 WorkshopBrain V31.0: Sistema de diagnóstico aeroespacial activo.");
  }

  /* ===============================
     NORMALIZAR REPUESTOS
     ============================== */
  normalizeParts(repuestos) {
    if (!Array.isArray(repuestos)) return [];
    return repuestos.map(r => {
      if (typeof r === "string") return r;
      if (typeof r === "object") return r.nombre || r.descripcion || "";
      return "";
    }).filter(Boolean);
  }

  /* ===============================
     CALCULAR HORAS INTELIGENTE (Logística de tiempo)
     ============================== */
  calcularHoras(technical, parts) {
    let horas = 1.0; // Base: Diagnóstico inicial
    // Lógica por complejidad de partes
    if (parts.length > 3) horas += 1.5;
    if (parts.length > 6) horas += 3.0;
    // Lógica por hallazgos técnicos (sensores/OBD)
    if (technical?.length > 2) horas += 2.0;
    
    return parseFloat(horas.toFixed(1));
  }

  /* ===============================
     DIAGNÓSTICO COMPLETO (El "Doctor" Digital)
     ============================== */
  async runDiagnosis(vehicleData) {
    try {
      console.log("🔧 Ejecutando Protocolo Nexus-X...");

      // 1. ESCANEO TÉCNICO (OBD + Sensores)
      const technicalDiagnosis = await this.scanner.scanVehicle(
        vehicleData?.obd || {},
        vehicleData?.symptoms || []
      );

      // 2. IA MECÁNICA (Procesamiento de Lenguaje Natural)
      const descripcion = vehicleData?.problem || "";
      let iaResult = { repuestos: [], diagnostico: "Análisis pendiente de revisión humana." };

      if (descripcion && descripcion.length > 5) {
        try {
          iaResult = await detectarRepuestos(descripcion);
        } catch (e) {
          console.warn("⚠️ IA mecánica fuera de línea, usando fallback.");
        }
      }

      // 3. NORMALIZACIÓN Y PREDICCIÓN (Historial de la Placa)
      const partsNeeded = this.normalizeParts(iaResult?.repuestos);
      
      let predictiveAlerts = [];
      try {
        // Aquí es donde consultamos el historial global para prevenir fallas
        predictiveAlerts = this.predictiveAI.predict(vehicleData?.history || {});
      } catch (e) {
        console.warn("⚠️ Módulo predictivo no disponible.");
      }

      // 4. CÁLCULO DE ESFUERZO (Gerente de Operaciones)
      const estimatedLaborHours = this.calcularHoras(technicalDiagnosis, partsNeeded);

      // 5. RESULTADO FINAL PARA ORDENES.JS
      const result = {
        diagnosis: iaResult?.diagnostico || "Diagnóstico estructural generado.",
        technicalFindings: technicalDiagnosis,
        predictiveAlerts: predictiveAlerts,
        partsNeeded: partsNeeded,
        estimatedLaborHours: estimatedLaborHours,
        timestamp: new Date().toISOString(),
        confidenceScore: iaResult ? 0.85 : 0.40 // Nivel de confianza de la IA
      };

      console.log("🧠 Diagnóstico Aeroespacial Completo");
      
      // Persistencia en el log de IA
      await this.logDiagnosis(result, vehicleData);

      return result;

    } catch (error) {
      console.error("❌ Error Crítico en WorkshopBrain:", error);
      return {
        diagnosis: "Error en el motor de diagnóstico.",
        technicalFindings: [],
        predictiveAlerts: [],
        partsNeeded: [],
        estimatedLaborHours: 1
      };
    }
  }

  /* ===============================
     LOG IA (Persistencia para analítica futura)
     ============================== */
  async logDiagnosis(result, input) {
    try {
      const { guardarConsultaIA } = await import("./motorIAglobal.js");
      await guardarConsultaIA({
        tipo: "diagnostico_full",
        placa: input.placa || "ANONIMO",
        input,
        output: result
      });
    } catch (e) {
      console.warn("⚠️ El log de IA no pudo ser guardado.");
    }
  }
}

// CORRECCIÓN: Se exporta la instancia o la clase correctamente, no el nombre del archivo.
export default WorkshopBrain;
