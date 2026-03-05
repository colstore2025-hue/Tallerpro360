import { iniciarVoz } from "../js/voiceAssistant.js";

document.getElementById("btnVoz")
.onclick = iniciarVoz;
export function iniciarVoz(){

const recognition = new webkitSpeechRecognition();

recognition.lang = "es-CO";
recognition.continuous = false;

recognition.onresult = function(event){

const texto = event.results[0][0].transcript;

console.log("Voz:",texto);

procesarComando(texto);

};

recognition.start();

}

function procesarComando(texto){

texto = texto.toLowerCase();

if(texto.includes("crear orden")){

alert("Comando detectado: crear orden");

}

}