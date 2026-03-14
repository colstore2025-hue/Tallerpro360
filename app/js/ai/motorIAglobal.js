/**
 * motorIAglobal.js
 * Motor central IA TallerPRO360
 */

import { db } from "../core/firebase-config.js";

import {
collection,
addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


async function consultarIA(prompt){

try{

const resp = await fetch("/api/ai",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({prompt})

})

const data = await resp.json()

return data.resultado || ""

}
catch(error){

console.error("Error IA:",error)
return ""

}

}


export async function diagnosticarVehiculo(descripcion){

const prompt = `
Analiza esta falla automotriz:

"${descripcion}"

Devuelve JSON:

{
diagnostico:"",
causaProbable:"",
repuestos:[],
acciones:[]
}
`;

try{

const respuesta = await consultarIA(prompt)

return JSON.parse(respuesta)

}
catch{

return{
diagnostico:"",
causaProbable:"",
repuestos:[],
acciones:[]
}

}

}


export async function guardarConsultaIA(data){

try{

await addDoc(

collection(db,"ia_consultas"),

{
...data,
fecha:serverTimestamp()
}

)

}
catch(error){

console.error("Error guardando consulta IA",error)

}

}