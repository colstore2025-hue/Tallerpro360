/**
 * globalDiagnosticsAI.js
 * TallerPRO360 Global Brain
 * IA que aprende de diagnósticos de talleres
 */

import { db } from "./firebase.js";

import {
collection,
addDoc,
getDocs,
query,
where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ================================
GUARDAR DIAGNÓSTICO GLOBAL
================================ */

export async function guardarDiagnosticoGlobal(data){

try{

await addDoc(
collection(db,"globalDiagnostics"),
{
marca: data.marca || "",
modelo: data.modelo || "",
anio: data.anio || "",
falla: data.falla || "",
repuestos: data.repuestos || [],
acciones: data.acciones || [],
fecha: Date.now()
}
)

console.log("🌎 Diagnóstico agregado a IA global")

}catch(e){

console.error("Error guardando diagnóstico global:",e)

}

}


/* ================================
ANALIZAR FALLA GLOBAL
================================ */

export async function analizarFallaGlobal(marca,modelo,falla){

try{

const q = query(
collection(db,"globalDiagnostics"),
where("marca","==",marca),
where("modelo","==",modelo)
)

const snap = await getDocs(q)

let contador = {}

snap.forEach(doc=>{

const data = doc.data()

if(data.repuestos){

data.repuestos.forEach(r=>{

const nombre = r.nombre || r

if(!contador[nombre]){
contador[nombre] = 0
}

contador[nombre]++

})

}

})


const ranking = Object.entries(contador)
.sort((a,b)=>b[1]-a[1])
.slice(0,5)

return ranking

}catch(e){

console.error("Error IA global:",e)

return []

}

}