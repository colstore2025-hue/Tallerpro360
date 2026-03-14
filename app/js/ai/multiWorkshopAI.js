/**
 * multiWorkshopAI.js
 * IA comparativa entre talleres
 */

import { db } from "../core/firebase-config.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function analizarEcosistemaTalleres(){

try{

const snap = await getDocs(collection(db,"empresas"));

let talleres = 0
let ingresosTotales = 0

const serviciosGlobal = {}
const tecnicosGlobal = {}

snap.forEach(docSnap => {

const empresa = docSnap.data() || {}

talleres++

const ingresos = Number(empresa.ingresosMensuales || 0)

ingresosTotales += ingresos


if(Array.isArray(empresa.servicios)){

empresa.servicios.forEach(servicio=>{

const s = servicio.toLowerCase().trim()

serviciosGlobal[s] = (serviciosGlobal[s] || 0) + 1

})

}


if(Array.isArray(empresa.tecnicos)){

empresa.tecnicos.forEach(tecnico=>{

const t = tecnico.toLowerCase().trim()

tecnicosGlobal[t] = (tecnicosGlobal[t] || 0) + 1

})

}

})


const topServicios = Object.entries(serviciosGlobal)
.map(([servicio,talleres])=>({servicio,talleres}))
.sort((a,b)=>b.talleres-a.talleres)
.slice(0,10)


const topTecnicos = Object.entries(tecnicosGlobal)
.map(([tecnico,talleres])=>({tecnico,talleres}))
.sort((a,b)=>b.talleres-a.talleres)
.slice(0,10)


const promedioIngresos = talleres
? Math.round(ingresosTotales / talleres)
: 0


const resultado = {

talleresAnalizados:talleres,
ingresosPromedio:promedioIngresos,
topServicios,
topTecnicos

}

localStorage.setItem(
"ecosistemaTalleres",
JSON.stringify(resultado)
)

return resultado

}
catch(e){

console.error("Error analizando ecosistema:",e)
return null

}

}


export function obtenerAnalisisEcosistema(){

try{

return JSON.parse(
localStorage.getItem("ecosistemaTalleres") || "{}"
)

}catch{

return {}

}

}