/*
================================================
VOICE MECHANIC AI
Asistente de voz para talleres
Ubicación: /app/app/js/voice/voiceMechanicAI.js
================================================
*/

import { procesarOrdenGlobal } from "../erp/procesarOrdenGlobal.js";

// Verificar compatibilidad del navegador
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  console.warn("Reconocimiento de voz no soportado en este navegador");
}

let recognition = null;

export function iniciarVoiceMechanic() {
  recognition = new SpeechRecognition();

  recognition.lang = "es-ES";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    console.log("🎤 Escuchando comando...");
  };

  recognition.onresult = async (event) => {
    const comando = event.results[0][0].transcript.toLowerCase();

    console.log("🗣 Comando detectado:", comando);

    await interpretarComando(comando);
  };

  recognition.onerror = (event) => {
    console.error("Error reconocimiento voz:", event.error);
  };

  recognition.start();
}

export function detenerVoiceMechanic() {
  if (recognition) {
    recognition.stop();
  }
}

async function interpretarComando(comando) {
  /*
  COMANDOS SOPORTADOS
  -------------------
  crear orden
  ver órdenes
  buscar cliente
  estado orden
  */

  if (comando.includes("crear orden")) {
    hablar("Iniciando creación de orden");

    await procesarOrdenGlobal({
      accion: "crear"
    });

    return;
  }

  if (comando.includes("ver órdenes")) {
    hablar("Mostrando lista de órdenes");

    window.location.href = "/ordenes.html";

    return;
  }

  if (comando.includes("buscar cliente")) {
    hablar("Abriendo buscador de clientes");

    window.location.href = "/clientes.html";

    return;
  }

  if (comando.includes("estado de orden")) {
    hablar("Buscando estado de la orden");

    // Aquí puedes conectar con IA o Firestore
    console.log("Consultar estado de orden");

    return;
  }

  hablar("No entendí el comando");
}

function hablar(texto) {
  const speech = new SpeechSynthesisUtterance(texto);

  speech.lang = "es-ES";

  window.speechSynthesis.speak(speech);
}