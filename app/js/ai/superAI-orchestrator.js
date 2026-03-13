/**
 * SUPER AI ORCHESTRATOR
 * Cerebro central del sistema IA para talleres
 */

import WorkshopBrain from "./workshopBrain.js";
import CustomerManager from "../clientes/customerManager.js";
import InventoryAI from "./inventoryAI.js";

class SuperAIOrchestrator {

constructor(){

this.workshopBrain = new WorkshopBrain();
this.customerManager = new CustomerManager();
this.inventoryAI = new InventoryAI();

console.log("🧠 Super AI Orchestrator iniciado");

}

/* ===================================
PROCESO COMPLETO DE SERVICIO
=================================== */

async processVehicleService(vehicleData, customerData){

console.log("🚗 Iniciando proceso inteligente de servicio...");

/* 1 BUSCAR CLIENTE */

let customer = await this.customerManager.searchCustomer(
customerData.phone
);

/* 2 CREAR SI NO EXISTE */

if(!customer){

const id = await this.customerManager.createCustomer(customerData);

customer = {
id:id,
...customerData
};

}else{

await this.customerManager.updateVisit(customer.id);

}

/* 3 DIAGNOSTICO IA */

const diagnosis = await this.workshopBrain.runDiagnosis(vehicleData);

/* 4 INVENTARIO */

await this.inventoryAI.loadInventory();

const partsNeeded = diagnosis.partsNeeded || [];

const inventoryStatus = partsNeeded.map(part=>{

const found = this.inventoryAI.parts.find(
p => p.name === part || p.nombre === part
);

return{

part:part,
available:!!found,
price:found?.price || 0

};

});

/* 5 ORDEN INTELIGENTE */

const workOrder = {

customerId: customer.id,

vehicle: vehicleData,

diagnosis: diagnosis,

partsStatus: inventoryStatus,

estimatedCost: this.calculateEstimate(
diagnosis,
inventoryStatus
),

timestamp: new Date()

};

console.log("🧠 Orden de trabajo generada con IA");

return workOrder;

}

/* ===================================
ESTIMACION COSTOS
=================================== */

calculateEstimate(diagnosis,inventoryStatus){

let laborCost = (diagnosis.estimatedLaborHours || 0) * 40;

let partsCost = 0;

inventoryStatus.forEach(part=>{

partsCost += part.price || 0;

});

return{

labor: laborCost,

parts: partsCost,

total: laborCost + partsCost

};

}

/* ===================================
APRENDIZAJE IA
=================================== */

async learnFromRepair(repairData){

console.log("📚 IA aprendiendo de reparación");

await this.workshopBrain.trainModel(repairData);

}

}

/* ===================================
INSTANCIA GLOBAL
=================================== */

const superAI = new SuperAIOrchestrator();

/* EXPORT PARA MODULOS */

export default superAI;

/* GLOBAL PARA DEBUG */

window.SuperAI = superAI;

console.log("🚀 Super AI listo");