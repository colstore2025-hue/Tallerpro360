/**
 * voiceAIController.js
 * Controlador de voz del ERP
 */

import { VoiceMechanicAI } from "./voiceMechanicAI.js"
import AICommandCenter from "./aiCommandCenter.js"

class VoiceAIController {

constructor(){

this.voice = new VoiceMechanicAI()

console.log("🎤 Voice AI Controller listo")

}


/* ==============================
ACTIVAR VOZ
============================== */

listen(){

this.voice.start((command,text)=>{

console.log("🧠 Comando voz:",command)


switch(command.type){

case "crear_orden":

AICommandCenter.execute("crear orden")
break


case "cotizar":

AICommandCenter.execute("ordenes")
break


case "buscar_cliente":

AICommandCenter.execute("clientes")
break


case "abrir_inventario":

AICommandCenter.execute("inventario")
break


case "abrir_clientes":

AICommandCenter.execute("clientes")
break


case "abrir_ordenes":

AICommandCenter.execute("ordenes")
break


default:

console.warn("⚠️ Comando voz no reconocido:",text)

}

})

}


}


/* ==============================
INSTANCIA GLOBAL
============================== */

const voiceAI = new VoiceAIController()

export default voiceAI


if(typeof window !== "undefined"){

window.VoiceAI = voiceAI

}