/**
 * TallerPRO360 Voice Assistant
 * Control por voz del sistema
 */

export function iniciarVoz(){

const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition

if(!SpeechRecognition){

alert("Tu navegador no soporta reconocimiento de voz")
return

}

const recognition = new SpeechRecognition()

recognition.lang = "es-CO"
recognition.continuous = false
recognition.interimResults = false

recognition.start()

recognition.onstart = ()=>{

console.log("🎙️ Asistente escuchando...")

}

recognition.onresult = (event)=>{

const texto = event.results[0][0].transcript

console.log("🗣️ Voz detectada:",texto)

procesarComando(texto)

}

recognition.onerror = (event)=>{

console.error("Error voz:",event.error)

}

}


/* ==============================
PROCESAR COMANDOS
============================== */

function procesarComando(texto){

texto = texto.toLowerCase()


/* CREAR ORDEN */

if(texto.includes("crear orden")){

alert("🛠️ Crear nueva orden")

window.location.href="/app/orden-nueva.html"

}


/* INVENTARIO */

else if(texto.includes("inventario")){

alert("📦 Abrir inventario")

window.location.href="/app/inventario.html"

}


/* DASHBOARD */

else if(texto.includes("dashboard")){

alert("📊 Abrir dashboard")

window.location.href="/app/index.html"

}


/* CLIENTES */

else if(texto.includes("clientes")){

alert("👥 Abrir clientes")

window.location.href="/app/clientes.html"

}


else{

alert("No entendí el comando: " + texto)

}

}