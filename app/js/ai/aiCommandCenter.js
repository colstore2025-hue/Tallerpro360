/**
 * aiCommandCenter.js
 * Centro de comandos IA
 * TallerPRO360 ERP
 */

class AICommandCenter {

constructor(){

console.log("🤖 AI Command Center iniciado")

this.history = []

this.commands = {

dashboard:[
"dashboard",
"inicio",
"panel",
"home"
],

inventario:[
"inventario",
"stock",
"repuestos",
"productos"
],

clientes:[
"clientes",
"cliente",
"buscar cliente",
"ver clientes"
],

ordenes:[
"orden",
"ordenes",
"orden trabajo",
"crear orden",
"nueva orden"
],

finanzas:[
"finanzas",
"dinero",
"estado financiero",
"ingresos",
"gastos"
],

pagos:[
"pagos",
"facturas",
"cobros",
"facturacion"
],

reportes:[
"reportes",
"estadisticas",
"analisis"
]

}

}


/* ==============================
NORMALIZAR TEXTO
============================== */

normalize(text){

return text
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g,"")

}


/* ==============================
PROCESAR COMANDO
============================== */

processCommand(text){

if(!text) return null

const command = this.normalize(text)

for(const module in this.commands){

const keywords = this.commands[module]

for(const word of keywords){

if(command.includes(this.normalize(word))){

return module

}

}

}

return null

}


/* ==============================
EJECUTAR COMANDO
============================== */

execute(text){

try{

const module = this.processCommand(text)

if(!module){

console.warn("⚠️ Comando no reconocido:",text)
return null

}

console.log("🧠 IA abre módulo:",module)

this.history.push({
command:text,
module,
date:new Date()
})

this.navigate(module)

return module

}
catch(error){

console.error("Error ejecutando comando IA:",error)

return null

}

}


/* ==============================
NAVEGAR AL MÓDULO
============================== */

navigate(module){

if(!module) return

if(typeof window !== "undefined"){

window.location.hash = module

}

}


/* ==============================
HISTORIAL
============================== */

getHistory(){

return this.history

}


/* ==============================
LIMPIAR HISTORIAL
============================== */

clearHistory(){

this.history = []

}

}


/* ==============================
INSTANCIA GLOBAL
============================== */

const aiCommandCenter = new AICommandCenter()

export default aiCommandCenter


/* ==============================
GLOBAL DEBUG
============================== */

if(typeof window !== "undefined"){

window.AICommandCenter = aiCommandCenter

}