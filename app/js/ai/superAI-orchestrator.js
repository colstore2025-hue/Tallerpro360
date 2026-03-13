/**
 * SUPER AI ORCHESTRATOR
 * Cerebro central del sistema IA para talleres
 * Coordina diagnóstico, clientes, inventario y aprendizaje automático
 */

import WorkshopBrain from "./workshopBrain.js";
import CustomerManager from "./customerManager.js";
import InventoryAI from "./inventoryAI.js";

class SuperAIOrchestrator {

constructor(){

this.workshopBrain = new WorkshopBrain();
this.customerManager = new CustomerManager();
this.inventoryAI = new InventoryAI();

console.log("🧠 Super AI Orchestrator iniciado");

}

/**
 * Proceso completo de atención de vehículo
 */
async processVehicleService(vehicleData, customerData){

console.log("🚗 Iniciando proceso inteligente de servicio...");

// 1 Registrar o actualizar cliente
const customer = await this.customerManager.registerOrUpdateCustomer(customerData);

// 2 Diagnóstico IA
const diagnosis = await this.workshopBrain.runDiagnosis(vehicleData);

// 3 Revisar inventario
const partsNeeded = diagnosis.partsNeeded || [];

const inventoryStatus = await this.inventoryAI.checkParts(partsNeeded);

// 4 Generar orden inteligente
const workOrder = {

customerId: customer.id,

vehicle: vehicleData,

diagnosis: diagnosis,

partsStatus: inventoryStatus,

estimatedCost: this.calculateEstimate(diagnosis, inventoryStatus),

timestamp: new Date()

};

console.log("🧠 Orden de trabajo generada con IA");

return workOrder;

}

/**
 * Estimación automática de costos
 */
calculateEstimate(diagnosis, inventoryStatus){

let laborCost = (diagnosis.estimatedLaborHours || 0) * 40;

let partsCost = 0;

inventoryStatus.forEach(part => {

partsCost += part.price || 0;

});

return {

labor: laborCost,

parts: partsCost,

total: laborCost + partsCost

};

}

/**
 * Aprendizaje automático
 */
async learnFromRepair(repairData){

console.log("📚 IA aprendiendo de reparación");

await this.workshopBrain.trainModel(repairData);

await this.inventoryAI.updateDemandPrediction(
repairData.partsUsed || []
);

}

}

/* ===============================
INSTANCIA GLOBAL IA
=============================== */

const superAI = new SuperAIOrchestrator();

/* ===============================
EXPORT PARA MODULOS
=============================== */

export default superAI;

/* ===============================
DISPONIBLE GLOBALMENTE
=============================== */

window.SuperAI = superAI;

console.log("🚀 Super AI listo");