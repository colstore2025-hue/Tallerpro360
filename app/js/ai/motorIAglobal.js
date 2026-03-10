// app/js/ai/motorIAglobal.js
// Motor central de Inteligencia Artificial de TallerPRO360

import { db } from "../core/firebase-config.js";

import {
collection,
addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===============================================
FUNCION PRINCIPAL IA
=============================================== */

async function consultarIA(prompt){

  try{

    const resp = await fetch("/api/ai",{

      method:"POST",

      headers:{
        "Content-Type":"application/json"
      },

      body:JSON.stringify({
        prompt
      })

    });

    const data = await resp.json();

    return data.resultado || "";

  }catch(error){

    console.error("Error consultando IA:",error);
    return "";

  }

}


/* ===============================================
DIAGNOSTICO AUTOMOTRIZ
=============================================== */

export async function diagnosticarVehiculo(descripcion){

const prompt = `

Analiza esta falla automotriz:

"${descripcion}"

Devuelve JSON:

{
diagnostico:"",
causaProbable:"",
repuestos:[
{nombre:"",prioridad:"alta/media/baja"}
],
acciones:[]
}

Solo JSON
`;

try{

const respuesta = await consultarIA(prompt);

return JSON.parse(respuesta);

}catch(error){

console.error("Error IA diagnóstico",error);

return{
diagnostico:"",
causaProbable:"",
repuestos:[],
acciones:[]
}

}

}


/* ===============================================
SUGERIR SERVICIOS
=============================================== */

export async function sugerirServicios(vehiculo,kilometraje){

const prompt = `

Vehiculo: ${vehiculo}
Kilometraje: ${kilometraje}

Sugiere servicios de mantenimiento recomendados.

Devuelve JSON:

{
servicios:[
{nombre:"",prioridad:"alta/media/baja"}
]
}

Solo JSON
`;

try{

const respuesta = await consultarIA(prompt);

return JSON.parse(respuesta);

}catch(error){

return { servicios:[] }

}

}


/* ===============================================
ANALISIS DE RENTABILIDAD
=============================================== */

export async function analizarRentabilidad(datos){

const prompt = `

Eres consultor de negocios automotrices.

Analiza estos datos del taller:

${JSON.stringify(datos)}

Devuelve JSON:

{
analisis:"",
recomendaciones:[]
}

`;

try{

const respuesta = await consultarIA(prompt);

return JSON.parse(respuesta);

}catch(error){

return{
analisis:"",
recomendaciones:[]
}

}

}


/* ===============================================
GUARDAR CONSULTA IA
=============================================== */

export async function guardarConsultaIA(data){

try{

await addDoc(

collection(db,"ia_consultas"),

{
...data,
fecha:serverTimestamp()
}

);

}catch(error){

console.error("Error guardando consulta IA",error);

}

}