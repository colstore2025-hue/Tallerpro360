/*
================================================
VOICE MECHANIC AI - Versión Avanzada
Asistente de voz para talleres - TallerPRO360
Ubicación: /app/js/voice/voiceMechanicAI.js
================================================
*/

import { procesarOrdenGlobal } from "../erp/procesarOrdenGlobal.js";
import { buscarCliente } from "../modules/clientes.js";
import { abrirInventario } from "../modules/inventario.js";

// Compatibilidad del navegador
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  console.warn("Reconocimiento de voz no soportado en este navegador");
}

let recognition = null;
let escuchando = false;

/**
 * Inicia el asistente de voz para el mecánico
 * @param {boolean} continuo - Si la escucha debe continuar indefinidamente
 */
export function iniciarVoiceMechanic(continuo = false) {
  if (!SpeechRecognition) return;

  recognition = new SpeechRecognition();
  recognition.lang = "es-ES";
  recognition.continuous = continuo; // escucha continua si se requiere
  recognition.interimResults = false;

  recognition.onstart = () => {
    escuchando = true;
    console.log("🎤 Asistente de mecánico activo");
    hablar("Asistente del mecánico activado");
  };

  recognition.onresult = async (event) => {
    const comando = event.results[event.results.length - 1][0].transcript.toLowerCase();
    console.log("🗣 Comando detectado:", comando);
    await interpretarComando(comando);

    // Si no es escucha continua, reiniciar para siguiente comando
    if (!continuo) recognition.start();
  };

  recognition.onerror = (event) => {
    console.error("Error reconocimiento voz:", event.error);
    hablar("Hubo un error con el reconocimiento de voz");
  };

  recognition.onend = () => {
    escuchando = false;
    console.log("🎤 Asistente detenido");
    if (continuo) recognition.start(); // reinicia si modo continuo
  };

  recognition.start();
}

/**
 * Detener el asistente de voz
 */
export function detenerVoiceMechanic() {
  if (recognition && escuchando) {
    recognition.stop();
    hablar("Asistente del mecánico desactivado");
    escuchando = false;
  }
}

/**
 * Interpreta el comando de voz y ejecuta acciones
 * @param {string} comando
 */
async function interpretarComando(comando) {
  if (comando.includes("crear orden")) {
    hablar("Iniciando creación de orden");
    await procesarOrdenGlobal({ accion: "crear" });
    return;
  }

  if (comando.includes("ver órdenes")) {
    hablar("Mostrando lista de órdenes");
    window.location.href = "/ordenes.html";
    return;
  }

  if (comando.includes("buscar cliente")) {
    hablar("Abriendo buscador de clientes");
    await buscarCliente();
    return;
  }

  if (comando.includes("abrir inventario")) {
    hablar("Abriendo inventario");
    abrirInventario();
    return;
  }

  if (comando.includes("estado de orden")) {
    hablar("Consultando estado de la orden");
    console.log("Consultar estado de orden (pendiente integración IA)");
    return;
  }

  hablar("No entendí el comando, por favor repite");
}

/**
 * Función de síntesis de voz
 * @param {string} texto
 */
function hablar(texto) {
  const speech = new SpeechSynthesisUtterance(texto);
  speech.lang = "es-ES";
  speech.rate = 1;
  speech.pitch = 1;
  window.speechSynthesis.speak(speech);
}