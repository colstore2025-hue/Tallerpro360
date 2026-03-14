/**
 * globalDiagnosticsAI.js
 * IA global de diagnósticos
 */

import { db } from "../core/firebase-config.js";

import {
collection,
addDoc,
getDocs,
query,
where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function guardarDiagnosticoGlobal(data){

try{

await addDoc(

collection(db,"globalDiagnostics"),

{
marca:data.marca || "",
modelo:data.modelo || "",
anio:data.anio || "",
falla:data.falla || "",
repuestos:data.repuestos || [],
acciones:data.acciones || [],
fecha:Date.now()
}

)

console.log("🌎 Diagnóstico agregado")

}
catch(e){

console.error("Error guardando diagnóstico:",e)

}

}



export async function analizarFallaGlobal(marca,modelo){

try{

const q = query(
collection(db,"globalDiagnostics"),
where("marca","==",marca),
where("modelo","==",modelo)
)

const snap = await getDocs(q)

const contador = {}

snap.forEach(docSnap=>{

const data = docSnap.data()

if(!Array.isArray(data.repuestos)) return

data.repuestos.forEach(r=>{

const nombre = (r.nombre || r || "").toLowerCase()

if(!nombre) return

contador[nombre] = (contador[nombre] || 0) + 1

})

})


return Object.entries(contador)
.sort((a,b)=>b[1]-a[1])
.slice(0,5)
.map(([repuesto,frecuencia])=>({repuesto,frecuencia}))

}
catch(e){

console.error("Error IA global:",e)

return []

}

}