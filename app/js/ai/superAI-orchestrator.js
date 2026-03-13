/**
 * superAI-orchestrator.js
 * Cerebro central IA TallerPRO360
 */

import WorkshopBrain from "./workshopBrain.js";
import CustomerManager from "../modules/customerManager.js";
import InventoryAI from "./inventoryAI.js";


class SuperAIOrchestrator {

constructor(){

try{

this.workshopBrain = new WorkshopBrain();
this.customerManager = new CustomerManager();
this.inventoryAI = new InventoryAI();

console.log("🧠 Super AI Orchestrator iniciado");

}
catch(error){

console.error("❌ Error iniciando IA:",error);

}

}


/* ===================================
PROCESO COMPLETO DE SERVICIO
=================================== */

async processVehicleService(vehicleData,customerData){

try{

if(!vehicleData){
console.warn("⚠️ Datos de vehículo faltantes");
return null;
}

console.log("🚗 Iniciando proceso inteligente de servicio...");


/* 1 BUSCAR CLIENTE */

let customer = await this.customerManager.searchCustomer(
customerData?.phone
);


/* 2 CREAR SI NO EXISTE */

if(!customer){

const id = await this.customerManager.createCustomer(customerData);

if(!id){
console.warn("⚠️ No se pudo crear cliente");
return null;
}

customer = {
id:id,
...customerData
};

}
else{

if(customer?.id){
await this.customerManager.updateVisit(customer.id);
}

}


/* 3 DIAGNOSTICO IA */

const diagnosis = await this.workshopBrain.runDiagnosis(vehicleData);


/* 4 INVENTARIO */

await this.inventoryAI.loadInventory();

const partsNeeded = diagnosis?.partsNeeded || [];

const inventoryParts = this.inventoryAI.parts || [];

const inventoryStatus = partsNeeded.map(part=>{

const found = inventoryParts.find(
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

customerId: customer?.id || null,

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
catch(error){

console.error("❌ Error en proceso IA:",error);

return null;

}

}


/* ===================================
ESTIMACION COSTOS
=================================== */

calculateEstimate(diagnosis,inventoryStatus){

try{

let laborCost =
(diagnosis?.estimatedLaborHours || 0) * 40;

let partsCost = 0;

inventoryStatus?.forEach(part=>{

partsCost += part.price || 0;

});

return{

labor:laborCost,
parts:partsCost,
total:laborCost + partsCost

};

}
catch(error){

console.error("❌ Error calculando estimación",error);

return{
labor:0,
parts:0,
total:0
};

}

}


/* ===================================
APRENDIZAJE IA
=================================== */

async learnFromRepair(repairData){

try{

console.log("📚 IA aprendiendo de reparación");

await this.workshopBrain.trainModel(repairData);

}
catch(error){

console.error("❌ Error entrenamiento IA",error);

}

}

}


/* ===================================
CREAR INSTANCIA GLOBAL SEGURA
=================================== */

let superAI = null;

try{

superAI = new SuperAIOrchestrator();

console.log("🚀 Super AI listo");

}
catch(error){

console.error("❌ IA no pudo iniciarse:",error);

}


/* ===================================
EXPORT
=================================== */

export default superAI;


/* ===================================
GLOBAL DEBUG
=================================== */

if(typeof window !== "undefined"){

window.SuperAI = superAI;

}