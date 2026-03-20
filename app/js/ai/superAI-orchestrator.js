/**
 * superAI-orchestrator.js
 * Cerebro central IA PRO360 · ULTRA FIX
 */

import WorkshopBrain from "./workshopBrain.js";
import InventoryAI from "./inventoryAI.js";
import VehicleScanner from "./vehicleScanner.js";
import { calcularPrecioInteligente } from "./pricingOptimizerAI.js";

/* ⚠️ MOVER ESTO A SERVICES SI PUEDES */
import CustomerManager from "../services/customerManager.js";

class SuperAIOrchestrator {

  constructor(){

    try{

      this.workshopBrain = new WorkshopBrain();
      this.inventoryAI = new InventoryAI();
      this.customerManager = new CustomerManager();
      this.vehicleScanner = new VehicleScanner();

      console.log("🧠 Super AI Orchestrator iniciado");

    } catch(error){

      console.error("❌ Error iniciando IA:",error);

    }
  }

  /* ===============================
  NORMALIZAR TEXTO
  ============================== */
  normalize(text){
    if(!text) return "";
    return text.toLowerCase().trim();
  }

  /* ===================================
  PROCESO COMPLETO DE SERVICIO
  =================================== */
  async processVehicleService(vehicleData, customerData){

    try{

      if(!vehicleData){
        console.warn("⚠️ Datos de vehículo faltantes");
        return null;
      }

      console.log("🚗 Iniciando proceso inteligente...");

      /* ===============================
      1 CLIENTE
      ============================== */

      let customer = await this.customerManager.searchCustomer(
        customerData?.phone
      );

      if(!customer){

        const id = await this.customerManager.createCustomer(customerData);
        if(!id) return null;

        customer = { id, ...customerData };

      } else {

        if(customer?.id){
          await this.customerManager.updateVisit(customer.id);
        }
      }

      /* ===============================
      2 ESCÁNER
      ============================== */

      const scannerDiagnosis = await Promise.resolve(
        this.vehicleScanner.scanVehicle(
          vehicleData?.obd || {},
          vehicleData?.symptoms || []
        )
      );

      /* ===============================
      3 DIAGNÓSTICO IA
      ============================== */

      const diagnosis = await this.workshopBrain.runDiagnosis(vehicleData);

      if(!diagnosis){
        console.warn("⚠️ IA no generó diagnóstico");
      }

      /* ===============================
      4 INVENTARIO
      ============================== */

      await this.inventoryAI.loadInventory();

      const partsNeeded = diagnosis?.partsNeeded || [];
      const inventoryParts = this.inventoryAI.parts || [];

      const partsStatus = partsNeeded.map(part => {

        const found = inventoryParts.find(p =>
          this.normalize(p.name || p.nombre) === this.normalize(part)
        );

        return {
          part,
          available: !!found,
          price: found?.price || found?.precio || 0
        };
      });

      /* ===============================
      5 COSTOS
      ============================== */

      const partsCost = partsStatus.reduce(
        (sum,p)=> sum + (p.price || 0), 0
      );

      const totalPrice = calcularPrecioInteligente({

        costoRepuestos: partsCost,
        horasTrabajo: diagnosis?.estimatedLaborHours || 1,
        tipoCliente: customer?.tipo || "normal"

      });

      /* ===============================
      6 ORDEN FINAL
      ============================== */

      const workOrder = {

        customerId: customer?.id || null,

        vehicle: vehicleData,

        diagnosis:{
          ...diagnosis,
          scannerInsights: scannerDiagnosis
        },

        partsStatus,

        estimatedCost:{
          total: totalPrice,
          parts: partsCost
        },

        timestamp: new Date()

      };

      console.log("🧠 Orden generada con IA");

      /* 🔥 LOG IA */
      this.logAI(workOrder);

      return workOrder;

    } catch(error){

      console.error("❌ Error en proceso IA:",error);
      return null;

    }
  }

  /* ===================================
  LOG IA (🔥 NUEVO)
  =================================== */
  async logAI(data){

    try{

      const { guardarConsultaIA } = await import("./motorIAglobal.js");

      await guardarConsultaIA({
        tipo:"orden_generada",
        data
      });

    } catch(e){
      console.warn("⚠️ No se pudo guardar log IA");
    }
  }

  /* ===================================
  APRENDIZAJE IA
  =================================== */
  async learnFromRepair(repairData){

    try{

      console.log("📚 IA aprendiendo");

      await this.workshopBrain.trainModel(repairData);

    } catch(error){

      console.error("❌ Error entrenamiento IA",error);

    }
  }
}

/* ===================================
INSTANCIA GLOBAL
=================================== */

let superAI = null;

try{

  superAI = new SuperAIOrchestrator();
  console.log("🚀 Super AI listo");

} catch(error){

  console.error("❌ IA no pudo iniciarse:",error);
}

export default superAI;

if(typeof window !== "undefined"){
  window.SuperAI = superAI;
}