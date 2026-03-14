/**
 * moduleScanner.js
 * AI Module Scanner
 * Detecta módulos automáticamente
 * TallerPRO360 ERP
 */

console.log("🧠 Module Scanner iniciado");


/* =====================================
LISTA DE MODULOS DEL ERP
===================================== */

const modules = [

"dashboard",
"clientes",
"ordenes",
"inventario",
"finanzas",
"pagos",
"ceo",

/* IA */

"aiAdvisor",
"aiAssistant",
"aiCommand"

];


/* =====================================
GENERAR CONFIGURACIÓN DE SECCIONES
===================================== */

export function scanModules(){

const sections = {};

modules.forEach(name=>{

sections[name.toLowerCase()] = {

name: formatName(name),
path:`./modules/${name}.js`

};

});

return sections;

}


/* =====================================
FORMATEAR NOMBRE PARA MENÚ
===================================== */

function formatName(name){

return name
.replace(/([A-Z])/g," $1")
.replace(/^./,s=>s.toUpperCase())
.trim();

}