/**
 * voiceMechanicAI.js
 * IA de voz para mecánicos
 * TallerPRO360
 */

export class VoiceMechanicAI {

constructor(){

this.recognition = null

const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition

if(SpeechRecognition){

this.recognition = new SpeechRecognition()

this.recognition.lang = "es-ES"
this.recognition.continuous = false
this.recognition.interimResults = false

}else{

console.warn("⚠️ Navegador sin soporte de voz")

}

}


/* ==============================
INICIAR ESCUCHA
============================== */

start(callback){

if(!this.recognition){

alert("El navegador no soporta reconocimiento de voz")
return

}

console.log("🎤 Escuchando...")

this.recognition.start()


this.recognition.onresult = (event)=>{

const texto = event.results[0][0].transcript

console.log("🎤 Voz detectada:",texto)

const comando = this.processCommand(texto)

if(callback){
callback(comando,texto)
}

}


this.recognition.onerror = (event)=>{

console.error("❌ Error reconocimiento voz:",event.error)

}


this.recognition.onend = ()=>{

console.log("🎤 Voz finalizada")

}

}


/* ==============================
DETENER
============================== */

stop(){

if(this.recognition){
this.recognition.stop()
}

}


/* ==============================
PROCESAR TEXTO
============================== */

processCommand(text){

const texto = text.toLowerCase()


if(texto.includes("crear orden")){

return{
type:"crear_orden",
detail:texto.replace("crear orden","").trim()
}

}


if(texto.includes("cotizar")){

return{
type:"cotizar",
detail:texto.replace("cotizar","").trim()
}

}


if(texto.includes("buscar cliente")){

return{
type:"buscar_cliente",
detail:texto.replace("buscar cliente","").trim()
}

}


if(texto.includes("abrir inventario")){

return{
type:"abrir_inventario"
}

}


if(texto.includes("abrir clientes")){

return{
type:"abrir_clientes"
}

}


if(texto.includes("abrir ordenes")){

return{
type:"abrir_ordenes"
}

}


return{
type:"desconocido",
detail:texto
}

}

}