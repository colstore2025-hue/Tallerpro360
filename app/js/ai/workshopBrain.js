/**
 * workshopBrain.js
 * Motor central de diagnóstico IA PRO360 · ULTRA
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
  NORMALIZAR REPUESTOS
  ============================== */
  normalizeParts(repuestos){
    if(!Array.isArray(repuestos)) return [];

    return repuestos.map(r=>{
      if(typeof r === "string") return r;
      if(typeof r === "object") return r.nombre || "";
      return "";
    }).filter(Boolean);
  }

  /* ===============================
  CALCULAR HORAS INTELIGENTE
  ============================== */
  calcularHoras(technical, parts){

    let horas = 1;

    if(parts.length > 3) horas += 1;
    if(parts.length > 6) horas += 1;

    if(technical?.length > 2) horas += 1;

    return horas;
  }

  /* ===============================
  DIAGNÓSTICO COMPLETO
  ============================== */
  async runDiagnosis(vehicleData){

    try{

      console.log("🔧 Iniciando diagnóstico completo...");

      /* ===============================
      1 ESCANEO TECNICO
      ============================== */

      const technicalDiagnosis = await Promise.resolve(
        this.scanner.scanVehicle(
          vehicleData?.obd || {},
          vehicleData?.symptoms || []
        )
      );

      /* ===============================
      2 IA MECÁNICA
      ============================== */

      const descripcion = vehicleData?.problem || "";

      let ia = null;

      if(descripcion && descripcion.length > 5){
        try{
          ia = await detectarRepuestos(descripcion);
        } catch(e){
          console.warn("⚠️ IA mecánica falló");
        }
      }

      /* ===============================
      3 REPUESTOS NORMALIZADOS
      ============================== */

      const partsNeeded = this.normalizeParts(ia?.repuestos);

      /* ===============================
      4 PREDICTIVO
      ============================== */

      let predictiveAlerts = [];

      try{
        predictiveAlerts = this.predictiveAI.predict(
          vehicleData?.history || {}
        );
      } catch(e){
        console.warn("⚠️ Predictive AI falló");
      }

      /* ===============================
      5 HORAS INTELIGENTES
      ============================== */

      const estimatedLaborHours = this.calcularHoras(
        technicalDiagnosis,
        partsNeeded
      );

      /* ===============================
      6 RESULTADO FINAL
      ============================== */

      const result = {

        diagnosis: ia?.diagnostico || "Diagnóstico generado por IA",

        technicalFindings: technicalDiagnosis,

        predictiveAlerts,

        partsNeeded,

        estimatedLaborHours

      };

      console.log("🧠 Diagnóstico completo generado");

      /* 🔥 LOG IA */
      this.logDiagnosis(result, vehicleData);

      return result;

    } catch(error){

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
  LOG IA
  ============================== */
  async logDiagnosis(result, input){

    try{

      const { guardarConsultaIA } = await import("./motorIAglobal.js");

      await guardarConsultaIA({
        tipo:"diagnostico",
        input,
        output: result
      });

    } catch(e){
      console.warn("⚠️ No se pudo guardar diagnóstico IA");
    }
  }

  /* ===============================
  APRENDIZAJE IA
  ============================== */
  async trainModel(repairData){

    try{

      console.log("📚 IA aprendiendo reparación",repairData);

      /*
      FUTURO:
      - guardar dataset real
      - mejorar precisión
      */

      return true;

    } catch(error){

      console.error("❌ Error entrenamiento IA:",error);
      return false;
    }
  }

}

export default WorkshopBrain;