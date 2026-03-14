/**
 * superAI-orchestrator.js
 * Cerebro central IA TallerPRO360
 */

import WorkshopBrain from "./workshopBrain.js";
import InventoryAI from "./inventoryAI.js";
import VehicleScanner from "./vehicleScanner.js";
import { calcularPrecioInteligente } from "./pricingOptimizerAI.js";
import CustomerManager from "../modules/customerManager.js";


class SuperAIOrchestrator {

constructor(){

try{

this.workshopBrain = new WorkshopBrain();
this.inventoryAI = new InventoryAI();
this.customerManager = new CustomerManager();
this.vehicleScanner = new VehicleScanner();

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


/* ===============================
1 BUSCAR CLIENTE
============================== */

let customer = await this.customerManager.searchCustomer(
customerData?.phone
);


/* ===============================
2 CREAR CLIENTE
============================== */

if(!customer){

const id = await this.customerManager.createCustomer(customerData);

if(!id) return null;

customer = { id, ...customerData };

}else{

if(customer?.id){
await this.customerManager.updateVisit(customer.id);
}

}


/* ===============================
3 ESCÁNER MECÁNICO
============================== */

const scannerDiagnosis = this.vehicleScanner.scanVehicle(
vehicleData?.obd || {},
vehicleData?.symptoms || []
);


/* ===============================
4 DIAGNÓSTICO IA
============================== */

const diagnosis = await this.workshopBrain.runDiagnosis(vehicleData);


/* ===============================
5 INVENTARIO
============================== */

await this.inventoryAI.loadInventory();

const partsNeeded = diagnosis?.partsNeeded || [];
const inventoryParts = this.inventoryAI.parts || [];

const partsStatus = partsNeeded.map(part=>{

const found = inventoryParts.find(
p => p.name === part || p.nombre === part
);

return{
part,
available:!!found,
price:found?.price || 0
};

});


/* ===============================
6 ESTIMACIÓN
============================== */

const partsCost = partsStatus.reduce(
(sum,p)=>sum + (p.price || 0),0
);

const totalPrice = calcularPrecioInteligente({

costoRepuestos: partsCost,
horasTrabajo: diagnosis?.estimatedLaborHours || 1,
tipoCliente: customer?.tipo || "normal"

});


/* ===============================
7 ORDEN FINAL
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

console.log("🧠 Orden de trabajo generada con IA");

return workOrder;

}
catch(error){

console.error("❌ Error en proceso IA:",error);
return null;

}

}


/* ===================================
APRENDIZAJE IA
=================================== */

async learnFromRepair(repairData){

try{

console.log("📚 IA aprendiendo reparación");

await this.workshopBrain.trainModel(repairData);

}
catch(error){

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

}
catch(error){

console.error("❌ IA no pudo iniciarse:",error);

}

export default superAI;

if(typeof window !== "undefined"){
window.SuperAI = superAI;
}