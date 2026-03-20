/**
 * motorIAglobal.js
 * Motor central IA PRO360 · FIX TOTAL
 */

import { db } from "../core/firebase-config.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ===========================
LLAMADA IA CENTRAL
=========================== */
async function consultarIA(prompt){

  try{

    const resp = await fetch("/api/ai",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({prompt})
    });

    if(!resp.ok){
      throw new Error(`API IA error ${resp.status}`);
    }

    const data = await resp.json();

    return data.resultado || data.response || "";

  } catch(error){

    console.error("❌ Error IA:",error);
    return "";
  }
}

/* ===========================
SAFE JSON PARSE
=========================== */
function safeJSON(text){

  try{
    return JSON.parse(text);
  } catch(e){
    console.warn("⚠️ JSON inválido IA:", text);
    return null;
  }
}

/* ===========================
DIAGNÓSTICO VEHÍCULO
=========================== */
export async function diagnosticarVehiculo(descripcion){

  const prompt = `
Analiza esta falla automotriz:

"${descripcion}"

Devuelve SOLO JSON válido:

{
"diagnostico":"",
"causaProbable":"",
"repuestos":[],
"acciones":[]
}
`;

  try{

    const respuesta = await consultarIA(prompt);
    const json = safeJSON(respuesta);

    if(!json){
      throw new Error("IA devolvió JSON inválido");
    }

    return json;

  } catch(error){

    console.error("❌ Error diagnóstico IA:", error);

    return {
      diagnostico:"No se pudo generar diagnóstico",
      causaProbable:"",
      repuestos:[],
      acciones:[]
    };
  }
}

/* ===========================
ANÁLISIS CEO (🔥 FALTABA)
=========================== */
export async function analizarRentabilidad(data){

  const prompt = `
Eres un experto en negocios automotrices.

Analiza estos datos del taller:

${JSON.stringify(data)}

Devuelve JSON:

{
"alertas":[],
"recomendaciones":[]
}
`;

  try{

    const respuesta = await consultarIA(prompt);
    const json = safeJSON(respuesta);

    return json || { alertas:[], recomendaciones:[] };

  } catch(error){

    console.error("❌ Error análisis CEO:", error);

    return { alertas:[], recomendaciones:[] };
  }
}

/* ===========================
LOG IA
=========================== */
export async function guardarConsultaIA(data){

  try{

    await addDoc(
      collection(db,"ia_logs"),
      {
        ...data,
        fecha:serverTimestamp()
      }
    );

  } catch(error){

    console.error("❌ Error guardando consulta IA",error);
  }
}