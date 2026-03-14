/**
 * autoRepairLearningAI.js
 * Sistema de aprendizaje automático de reparaciones
 * TallerPRO360 ERP
 */

import { guardarDiagnosticoGlobal } from "./globalDiagnosticsAI.js";

class AutoRepairLearningAI {

constructor(){

console.log("🧠 AutoRepair Learning AI iniciada");

}


/* ======================================
REGISTRAR REPARACIÓN
====================================== */

async learnFromRepair(repairData){

try{

if(!repairData){

console.warn("⚠️ repairData vacío")
return

}

console.log("📚 IA aprendiendo de reparación")


/* ==============================
ESTRUCTURA DE DATOS
============================== */

const record = {

marca: repairData.marca || "",
modelo: repairData.modelo || "",
anio: repairData.anio || "",

falla: repairData.falla || "",

repuestos: repairData.repuestos || [],

acciones: repairData.acciones || [],

tecnico: repairData.tecnico || "",

tiempoReparacion: repairData.tiempoReparacion || 0,

fecha: Date.now()

}


/* ==============================
GUARDAR EN IA GLOBAL
============================== */

await guardarDiagnosticoGlobal({

marca:record.marca,
modelo:record.modelo,
anio:record.anio,
falla:record.falla,
repuestos:record.repuestos,
acciones:record.acciones

})


/* ==============================
GUARDAR LOCAL (CACHE IA)
============================== */

this.saveLocalLearning(record)


console.log("🧠 Reparación aprendida por la IA")

}
catch(error){

console.error("❌ Error aprendizaje IA:",error)

}

}


/* ======================================
CACHE LOCAL DE APRENDIZAJE
====================================== */

saveLocalLearning(record){

try{

const key = "ai_repair_learning"

const data = JSON.parse(
localStorage.getItem(key) || "[]"
)

data.push(record)

localStorage.setItem(
key,
JSON.stringify(data)
)

}
catch(e){

console.warn("⚠️ No se pudo guardar aprendizaje local")

}

}


/* ======================================
ANALIZAR PATRONES LOCALES
====================================== */

getLocalPatterns(){

try{

const data = JSON.parse(
localStorage.getItem("ai_repair_learning") || "[]"
)

const contador = {}

data.forEach(r=>{

if(!r.repuestos) return

r.repuestos.forEach(rep=>{

const nombre = (rep.nombre || rep || "").toLowerCase()

if(!contador[nombre]){

contador[nombre] = 0

}

contador[nombre]++

})

})


const ranking = Object.entries(contador)
.sort((a,b)=>b[1]-a[1])
.slice(0,10)
.map(r=>({

repuesto:r[0],
frecuencia:r[1]

}))


return ranking

}
catch(error){

console.error("❌ Error analizando patrones IA")

return []

}

}

}


/* ======================================
INSTANCIA GLOBAL
====================================== */

const autoRepairLearningAI = new AutoRepairLearningAI()

export default autoRepairLearningAI


/* ======================================
DEBUG GLOBAL
====================================== */

if(typeof window !== "undefined"){

window.AutoRepairLearningAI = autoRepairLearningAI

}