/**
 * workshopBrain.js - TALLERPRO360 NEXUS-X V32.5 🧠
 * NÚCLEO DE DIAGNÓSTICO AEROESPACIAL (EDICIÓN PENTÁGONO)
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { detectarRepuestos } from "./iaMecanica.js";
import VehicleScanner from "./vehicleScanner.js";
import { PredictiveMaintenanceAI } from "./predictiveMaintenanceAI.js";

class WorkshopBrain {
  constructor() {
    this.scanner = new VehicleScanner();
    this.predictiveAI = new PredictiveMaintenanceAI();
    // Recuperación de contexto multi-fuente para evitar rupturas de enlace
    this.empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    console.log("🧠 WorkshopBrain V32.5: Escudo de diagnóstico Nexus-X activo.");
  }

  /**
   * 🛠️ NORMALIZACIÓN DE COMPONENTES
   * Convierte cualquier entrada de repuestos en un array limpio de strings.
   */
  normalizeParts(repuestos) {
    if (!Array.isArray(repuestos)) return [];
    return repuestos.map(r => {
      if (typeof r === "string") return r;
      if (typeof r === "object") return r.nombre || r.descripcion || r.label || "";
      return "";
    }).filter(Boolean);
  }

  /**
   * ⏱️ CÁLCULO DE ESFUERZO OPERATIVO (LOGÍSTICA DE TIEMPO)
   * Ajusta las horas de mano de obra según complejidad y hallazgos técnicos.
   */
  calcularHoras(technical, parts) {
    let horas = 1.2; // Base: Protocolo de entrada y diagnóstico inicial
    
    // Incremento por volumen de componentes (Logística de desarmado)
    if (parts.length > 3) horas += 1.8;
    if (parts.length > 7) horas += 3.5;
    
    // Incremento por complejidad electrónica (Hallazgos OBD/Sensores)
    if (technical && Array.isArray(technical) && technical.length > 2) {
        horas += (technical.length * 0.5);
    }
    
    return parseFloat(horas.toFixed(1));
  }

  /**
   * 🔬 PROTOCOLO DE DIAGNÓSTICO FULL (EL DOCTOR DIGITAL)
   * Integra escaneo físico, IA mecánica y predicción de fallas.
   */
  async runDiagnosis(vehicleData) {
    try {
      console.log("🔧 Iniciando Protocolo de Misión Nexus-X...");

      // 1. ESCANEO TÉCNICO (OBD + Sensores) con protección de falla
      const technicalDiagnosis = await this.scanner.scanVehicle(
        vehicleData?.obd || {},
        vehicleData?.symptoms || []
      ).catch(() => []);

      // 2. IA MECÁNICA (Procesamiento de Lenguaje Natural)
      const descripcion = vehicleData?.problem || vehicleData?.observaciones || "";
      let iaResult = { repuestos: [], diagnostico: "Inspección estructural requerida." };

      if (descripcion && descripcion.length > 5) {
        try {
          iaResult = await detectarRepuestos(descripcion);
        } catch (e) {
          console.warn("⚠️ IA mecánica operando en modo local (Fallback).");
        }
      }

      // 3. NORMALIZACIÓN Y ANÁLISIS PREDICTIVO
      const partsNeeded = this.normalizeParts(iaResult?.repuestos || []);
      
      let predictiveAlerts = [];
      try {
        // Analiza el historial para prevenir retornos por garantía (Crucial para TallerPRO360)
        predictiveAlerts = await this.predictiveAI.predict(vehicleData?.history || {});
      } catch (e) {
        console.warn("⚠️ Telemetría predictiva fuera de alcance.");
      }

      // 4. CÁLCULO DE ESFUERZO Y ROI
      const estimatedLaborHours = this.calcularHoras(technicalDiagnosis, partsNeeded);

      // 5. RESULTADO FINAL ESTRUCTURADO PARA DASHBOARD & ORDENES
      const result = {
        empresaId: this.empresaId,
        diagnosis: iaResult?.diagnostico || "Diagnóstico de núcleo generado.",
        technicalFindings: technicalDiagnosis,
        predictiveAlerts: predictiveAlerts,
        partsNeeded: partsNeeded,
        estimatedLaborHours: estimatedLaborHours,
        timestamp: new Date().toISOString(),
        confidenceScore: iaResult?.repuestos?.length > 0 ? 0.92 : 0.45,
        status: "SUCCESS"
      };

      console.log("✅ Diagnóstico Aeroespacial Finalizado.");
      
      // Persistencia obligatoria para analítica de ingresos
      await this.logDiagnosis(result, vehicleData);

      return result;

    } catch (error) {
      console.error("🚨 Error Crítico en WorkshopBrain (Núcleo):", error);
      return {
        empresaId: this.empresaId,
        diagnosis: "PROTOCOLO DE DIAGNÓSTICO INTERRUMPIDO",
        technicalFindings: [],
        predictiveAlerts: [],
        partsNeeded: [],
        estimatedLaborHours: 1,
        status: "CRITICAL_ERROR"
      };
    }
  }

  /**
   * 📁 LOG IA (PERSISTENCIA PARA EL MOTOR GLOBAL)
   * Alimenta el Balanced Scorecard del Dashboard.
   */
  async logDiagnosis(result, input) {
    try {
      const { guardarConsultaIA } = await import("./motorIAglobal.js");
      await guardarConsultaIA({
        tipo: "diagnostico_pentagono",
        placa: input.placa || "S/P",
        empresaId: this.empresaId,
        input,
        output: result
      });
    } catch (e) {
      console.warn("⚠️ Fallo en el registro orbital de IA.");
    }
  }
}

export default WorkshopBrain;
