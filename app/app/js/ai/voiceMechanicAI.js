// voiceMechanicAI.js
// IA de voz para mecánicos

export class VoiceMechanicAI {

constructor(){

this.recognition = null;

if ('webkitSpeechRecognition' in window) {

this.recognition = new webkitSpeechRecognition();
this.recognition.lang = "es-ES";
this.recognition.continuous = false;
this.recognition.interimResults = false;

}

}

iniciar(callback){

if(!this.recognition){
alert("El navegador no soporta reconocimiento de voz");
return;
}

this.recognition.start();

this.recognition.onresult = (event)=>{

const texto = event.results[0][0].transcript;

console.log("Comando voz:",texto);

const comando = this.procesarComando(texto);

callback(comando);

};

}

procesarComando(texto){

texto = texto.toLowerCase();

if(texto.includes("crear orden")){

return{
tipo:"crear_orden",
detalle:texto.replace("crear orden","").trim()
}

}

if(texto.includes("cotizar")){

return{
tipo:"cotizar",
detalle:texto.replace("cotizar","").trim()
}

}

if(texto.includes("buscar cliente")){

return{
tipo:"buscar_cliente",
detalle:texto.replace("buscar cliente","").trim()
}

}

return{
tipo:"desconocido",
detalle:texto
}

}

}