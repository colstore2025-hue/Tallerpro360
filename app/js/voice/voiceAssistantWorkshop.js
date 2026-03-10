/*
===============================================
VOICE ASSISTANT WORKSHOP
Asistente global del sistema del taller
Ubicación: /app/js/voice/voiceAssistantWorkshop.js
===============================================
*/

import { iniciarVoiceMechanic } from "./voiceMechanicAI.js";

import { procesarOrdenGlobal } from "../erp/procesarOrdenGlobal.js";

import { buscarCliente } from "../clientes/clientesLista.js";

import { generarFactura } from "../finanzas/generarFactura.js";


const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;



export function iniciarAsistenteWorkshop(){

if(!SpeechRecognition){

console.warn("Reconocimiento de voz no soportado");

return;

}

recognition = new SpeechRecognition();

recognition.lang = "es-ES";
recognition.continuous = true;
recognition.interimResults = false;

recognition.onstart = ()=>{

console.log("🤖 Asistente del taller activo");

hablar("Asistente del taller activado");

};


recognition.onresult = async (event)=>{

const comando = event.results[event.results.length-1][0].transcript.toLowerCase();

console.log("Comando:",comando);

await interpretarComando(comando);

};


recognition.onerror = (e)=>{

console.error("Error voz:",e);

};


recognition.start();

}



export function detenerAsistenteWorkshop(){

if(recognition){

recognition.stop();

hablar("Asistente desactivado");

}

}



async function interpretarComando(comando){

/*
COMANDOS DISPONIBLES
-------------------

crear orden
buscar cliente
generar factura
abrir inventario
abrir reportes
asistente mecanico
*/


if(comando.includes("crear orden")){

hablar("Creando nueva orden");

await procesarOrdenGlobal({accion:"crear"});

return;

}


if(comando.includes("buscar cliente")){

hablar("Buscando cliente");

await buscarCliente();

return;

}


if(comando.includes("generar factura")){

hablar("Generando factura");

await generarFactura();

return;

}


if(comando.includes("abrir inventario")){

hablar("Abriendo inventario");

window.location.href = "/inventario.html";

return;

}


if(comando.includes("abrir reportes")){

hablar("Mostrando reportes");

window.location.href = "/reportes.html";

return;

}


if(comando.includes("asistente mecanico")){

hablar("Activando asistente del mecánico");

iniciarVoiceMechanic();

return;

}


hablar("No entendí el comando");

}



function hablar(texto){

const speech = new SpeechSynthesisUtterance(texto);

speech.lang = "es-ES";

window.speechSynthesis.speak(speech);

}