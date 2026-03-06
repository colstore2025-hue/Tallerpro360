// motorIAglobal.js
// Motor central de Inteligencia Artificial de TallerPro360

import { db } from "./firebase-config.js";
import {
collection,
addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// API KEY debe almacenarse en entorno seguro
const API_KEY = "TU_API_KEY_OPENAI";

// Configuración modelo
const MODELO_IA = "gpt-4o-mini";

// ------------------------------------------------
// FUNCION PRINCIPAL IA
// ------------------------------------------------

async function consultarIA(prompt){

  try{

    const resp = await fetch("https://api.openai.com/v1/chat/completions",{

      method:"POST",

      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${API_KEY}`
      },

      body:JSON.stringify({
        model:MODELO_IA,
        messages:[
          {
            role:"system",
            content:"Eres un mecánico experto con 25 años de experiencia en diagnóstico automotriz."
          },
          {
            role:"user",
            content:prompt
          }
        ],
        temperature:0.2
      })

    });

    const data = await resp.json();

    return data.choices?.[0]?.message?.content || "";

  }catch(error){

    console.error("Error consultando IA:",error);
    return "";

  }

}

// ------------------------------------------------
// DIAGNOSTICO AUTOMOTRIZ
// ------------------------------------------------

export async function diagnosticarVehiculo(descripcion){

const prompt=`

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

// ------------------------------------------------
// SUGERIR SERVICIOS ADICIONALES
// ------------------------------------------------

export async function sugerirServicios(vehiculo, kilometraje){

const prompt=`

Vehiculo: ${vehiculo}
Kilometraje: ${kilometraje}

Sugiere servicios de mantenimiento recomendados.

Devuelve JSON:

{
servicios:[
{nombre:"",prioridad:"alta/media/baja"}
]
}

Solo JSON.
`;

try{

const respuesta = await consultarIA(prompt);

return JSON.parse(respuesta);

}catch(error){

return { servicios:[] }

}

}

// ------------------------------------------------
// ANALISIS DE RENTABILIDAD TALLER
// ------------------------------------------------

export async function analizarRentabilidad(datos){

const prompt=`

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

// ------------------------------------------------
// GUARDAR CONSULTA IA
// ------------------------------------------------

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