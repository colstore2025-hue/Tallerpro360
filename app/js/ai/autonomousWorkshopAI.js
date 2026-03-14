/**
 * autonomousWorkshopAI.js
 * IA autónoma de gestión de taller
 * TallerPRO360 ERP
 */

import AutoRepairLearningAI from "./autoRepairLearningAI.js";
import PredictiveMaintenanceAI from "./predictiveMaintenanceAI.js";
import InventoryAI from "./inventoryAI.js";

class AutonomousWorkshopAI {

constructor(){

this.inventoryAI = new InventoryAI();

console.log("🤖 Autonomous Workshop AI iniciada");

}


/* =========================================
ANALIZAR OPERACIÓN DEL TALLER
========================================= */

async analyzeWorkshop(data = {}){

try{

const insights = [];

const ordenes = data.ordenes || [];
const ingresos = data.ingresos || 0;


/* ================================
INGRESOS
================================ */

if(ingresos < 2000000){

insights.push({

type:"business",
priority:"media",
message:"Los ingresos del taller están bajos. Considera promociones o paquetes de mantenimiento."

});

}


/* ================================
ANALISIS DE SERVICIOS
================================ */

const servicios = {};

ordenes.forEach(o => {

const tipo = o.servicio || "general";

if(!servicios[tipo]){

servicios[tipo] = 0;

}

servicios[tipo]++;

});


const rankingServicios = Object.entries(servicios)
.sort((a,b)=>b[1]-a[1])
.slice(0,5);

if(rankingServicios.length){

insights.push({

type:"analytics",
priority:"info",
message:"Servicios más solicitados",
data:rankingServicios

});

}


/* ================================
PATRONES IA
================================ */

const patrones = AutoRepairLearningAI.getLocalPatterns();

if(patrones.length){

insights.push({

type:"ai_learning",
priority:"info",
message:"Repuestos más utilizados según IA",
data:patrones

});

}


/* ================================
INVENTARIO
================================ */

await this.inventoryAI.loadInventory();

const inventario = this.inventoryAI.parts || [];

const bajoStock = inventario.filter(p =>

(p.stock || 0) < 3

);

if(bajoStock.length){

insights.push({

type:"inventory",
priority:"alta",
message:"Repuestos con stock bajo",
data:bajoStock.slice(0,5)

});

}


/* ================================
MANTENIMIENTO PREDICTIVO CLIENTES
================================ */

if(data.vehiculos){

const alertas = [];

for(const v of data.vehiculos){

const pred = await PredictiveMaintenanceAI.predict(v);

if(pred.length){

alertas.push({

vehiculo:v.plate || "",
alertas:pred

});

}

}

if(alertas.length){

insights.push({

type:"predictive",
priority:"media",
message:"Vehículos que requieren mantenimiento pronto",
data:alertas.slice(0,5)

});

}

}


/* ================================
RESULTADO
================================ */

return {

timestamp:Date.now(),
insights

};

}
catch(error){

console.error("❌ Error AutonomousWorkshopAI:",error);

return {

timestamp:Date.now(),
insights:[]

};

}

}


/* =========================================
RECOMENDACIONES AUTOMÁTICAS
========================================= */

generateRecommendations(analysis){

if(!analysis || !analysis.insights) return [];

const rec = [];

analysis.insights.forEach(i => {

if(i.type === "inventory"){

rec.push("Comprar repuestos críticos para evitar retrasos en reparaciones");

}

if(i.type === "business"){

rec.push("Crear campañas de servicio rápido o revisión gratuita");

}

if(i.type === "analytics"){

rec.push("Promocionar los servicios más vendidos para aumentar ingresos");

}

if(i.type === "predictive"){

rec.push("Contactar clientes para mantenimiento preventivo");

}

});

return rec;

}

}


/* =========================================
INSTANCIA GLOBAL
========================================= */

const autonomousWorkshopAI = new AutonomousWorkshopAI();

export default autonomousWorkshopAI;


/* =========================================
DEBUG GLOBAL
========================================= */

if(typeof window !== "undefined"){

window.AutonomousWorkshopAI = autonomousWorkshopAI;

}