// iaMecanica.js
// Motor de diagnóstico IA para TallerPro360

import { db } from "./firebase-config.js";

/**
 * Detecta diagnóstico, repuestos y acciones a partir
 * de la descripción de la falla del vehículo.
 * 
 * La llamada real a OpenAI debe hacerse desde
 * un backend seguro o Cloud Function.
 */

export async function detectarRepuestos(descripcion){

  if(!descripcion || descripcion.trim().length < 5){
    throw new Error("Descripción de falla inválida");
  }

  const prompt = `
Eres un mecánico automotriz experto.

Analiza la siguiente falla del vehículo:

"${descripcion}"

Devuelve SOLO JSON con esta estructura:

{
 "diagnostico": "",
 "repuestos":[
   {"nombre":"", "prioridad":"alta|media|baja"}
 ],
 "acciones":[]
}

No agregues texto adicional.
`;

  try{

    const resp = await fetch("/api/diagnosticoIA",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        prompt
      })
    });

    const data = await resp.json();

    if(!data){
      throw new Error("Respuesta IA vacía");
    }

    return data;

  }catch(error){

    console.error("Error IA Mecánica:",error);

    return {
      diagnostico:"No se pudo generar diagnóstico automático",
      repuestos:[],
      acciones:[]
    };

  }

}


/**
 * Activar creación de orden por voz
 * (Integración futura con Web Speech API)
 */

export function iniciarVoz(){

  if(!('webkitSpeechRecognition' in window)){
    alert("Tu navegador no soporta reconocimiento de voz");
    return;
  }

  const recognition = new webkitSpeechRecognition();

  recognition.lang = "es-ES";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = function(event){

    const texto = event.results[0][0].transcript;

    console.log("Descripción detectada:",texto);

    const inputDescripcion = document.getElementById("descripcionFalla");

    if(inputDescripcion){
      inputDescripcion.value = texto;
    }

  };

  recognition.start();

}