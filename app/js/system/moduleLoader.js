/**
 * moduleLoader.js
 * AI Module AutoLoader
 * TallerPRO360 ERP
 */

console.log("🧠 AI Module Loader iniciado");

/* ======================================
DEFINICIÓN DE MÓDULOS
====================================== */

const modules = {

dashboard:{name:"Dashboard"},
clientes:{name:"Clientes"},
ordenes:{name:"Órdenes"},
inventario:{name:"Inventario"},
finanzas:{name:"Finanzas"},
pagos:{name:"Pagos"},
ceo:{name:"CEO"},
aiadvisor:{name:"AI Advisor"},
aicommand:{name:"AI Command"}

};


/* ======================================
GENERAR CONFIGURACIÓN
====================================== */

export function getModules(){

const result = {};

Object.entries(modules).forEach(([key,data])=>{

result[key] = {

name:data.name,
path:`./modules/${key}.js`

};

});

return result;

}