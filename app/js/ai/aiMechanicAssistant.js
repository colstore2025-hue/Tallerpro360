/**
 * aiMechanicAssistant.js
 * Asistente inteligente del mecánico
 * TallerPRO360 ERP
 */

import { diagnosticarVehiculo } from "./motorIAglobal.js";
import { analizarFallaGlobal } from "./globalDiagnosticsAI.js";
import { calcularPrecioInteligente } from "./pricingOptimizer.js";
import InventoryAI from "./inventoryAI.js";

class AIMechanicAssistant {

constructor(){

this.inventoryAI = new InventoryAI();

console.log("🧠 AI Mechanic Assistant listo");

}


/* =========================================
DIAGNOSTICAR VEHÍCULO
========================================= */

async diagnosticarVehiculo(data){

try{

if(!data || !data.descripcion){

console.warn("⚠️ Falta descripción del problema");

return null;

}

console.log("🔎 Analizando falla con IA...");


/* ===============================
1 IA DIAGNOSTICO
============================== */

const ia = await diagnosticarVehiculo(data.descripcion);


/* ===============================
2 ANALISIS GLOBAL
============================== */

let globalRanking = [];

if(data.marca && data.modelo){

globalRanking = await analizarFallaGlobal(
data.marca,
data.modelo,
data.descripcion
);

}


/* ===============================
3 INVENTARIO
============================== */

await this.inventoryAI.loadInventory();

const inventario = this.inventoryAI.parts || [];


/* ===============================
4 REPUESTOS NECESARIOS
============================== */

const repuestosIA = ia?.repuestos || [];

const repuestosEstado = repuestosIA.map(r=>{

const nombre = r.nombre || r;

const encontrado = inventario.find(p=>

p.name === nombre || p.nombre === nombre
);

return{

nombre,
disponible:!!encontrado,
precio:encontrado?.price || 0

};

});


/* ===============================
5 COSTO REPUESTOS
============================== */

let costoRepuestos = 0;

repuestosEstado.forEach(r=>{

costoRepuestos += r.precio;

});


/* ===============================
6 PRECIO INTELIGENTE
============================== */

const precio = calcularPrecioInteligente({

costoRepuestos,
horasTrabajo:2,
tipoCliente:"normal"

});


/* ===============================
RESULTADO FINAL
============================== */

const resultado = {

diagnostico: ia?.diagnostico || "",

causaProbable: ia?.causaProbable || "",

repuestos: repuestosEstado,

diagnosticosGlobales: globalRanking,

precioEstimado: precio,

acciones: ia?.acciones || []

};


console.log("🧠 Diagnóstico completo generado");

return resultado;

}
catch(error){

console.error("❌ Error AI Mechanic Assistant:",error);

return null;

}

}

}


/* =========================================
INSTANCIA GLOBAL
========================================= */

const aiMechanicAssistant = new AIMechanicAssistant();

export default aiMechanicAssistant;


/* =========================================
DEBUG GLOBAL
========================================= */

if(typeof window !== "undefined"){

window.AIMechanicAssistant = aiMechanicAssistant;

}