/**
 * moduleScanner.js
 * AI Module Scanner
 * Detecta módulos automáticamente
 * TallerPRO360 ERP
 */

console.log("🧠 Module Scanner iniciado");

/* =====================================
LISTA REAL DE MODULOS DEL ERP
===================================== */

const modules = [

/* CORE ERP */

"dashboard",
"clientes",
"ordenes",
"inventario",
"reportes",

/* FINANZAS */

"finanzas",
"contabilidad",
"pagosTaller",

/* ADMIN */

"configuracion",
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

const key = name.toLowerCase();

sections[key] = {

name: formatName(name),

path:`./modules/${name}.js`

};

});

console.log("📦 Módulos detectados:",Object.keys(sections));

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