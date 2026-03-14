/**
 * aiCommandCenter.js
 * Centro de comandos IA
 * TallerPRO360 ERP
 */

class AICommandCenter {

constructor(){

console.log("🤖 AI Command Center iniciado");

this.commands = {

inventario:["inventario","stock","repuestos","productos"],

clientes:["clientes","cliente","buscar cliente"],

ordenes:["orden","ordenes","crear orden","orden trabajo"],

finanzas:["finanzas","dinero","estado financiero"],

dashboard:["dashboard","inicio","panel"],

pagos:["pagos","facturas","cobros"]

}

}

/* ==============================
PROCESAR COMANDO
============================== */

processCommand(text){

if(!text) return null

const command = text.toLowerCase()

for(const module in this.commands){

const keywords = this.commands[module]

for(const word of keywords){

if(command.includes(word)){

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

const module = this.processCommand(text)

if(!module){

console.warn("Comando no reconocido")

return

}

console.log("🧠 IA abre módulo:",module)

window.location.hash = module

}

}

export default AICommandCenter