/*
===============================================
VOICE ASSISTANT WORKSHOP - Avanzado
Asistente global del taller
Ubicación: /app/js/voice/voiceAssistantWorkshop.js
===============================================
*/

import { iniciarVoiceMechanic } from "./voiceMechanicAI.js";
import { procesarOrdenGlobal } from "../erp/procesarOrdenGlobal.js";
import { buscarCliente } from "../clientes/clientesLista.js";
import { generarFactura } from "../finanzas/generarFactura.js";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let activo = false;

export function iniciarAsistenteWorkshop() {
  if (!SpeechRecognition) {
    console.warn("Reconocimiento de voz no soportado");
    alert("⚠️ Tu navegador no soporta reconocimiento de voz");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "es-ES";
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onstart = () => {
    activo = true;
    console.log("🤖 Asistente del taller activo");
    hablar("Asistente del taller activado");
  };

  recognition.onresult = async (event) => {
    if (!activo) return;
    const comando = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    console.log("Comando detectado:", comando);
    await interpretarComando(comando);
  };

  recognition.onerror = (e) => {
    console.error("Error en reconocimiento de voz:", e);
  };

  recognition.onend = () => {
    if (activo) recognition.start(); // reinicia automáticamente
  };

  recognition.start();
}

export function detenerAsistenteWorkshop() {
  if (recognition) {
    activo = false;
    recognition.stop();
    hablar("Asistente desactivado");
  }
}

// ============================================
// Interpretación de comandos
// ============================================
async function interpretarComando(comando) {
  try {
    if (comando.includes("crear orden")) {
      hablar("Creando nueva orden");
      await procesarOrdenGlobal({ accion: "crear" });
      return;
    }

    if (comando.includes("buscar cliente")) {
      hablar("Buscando cliente");
      await buscarCliente();
      return;
    }

    if (comando.includes("generar factura")) {
      hablar("Generando factura");
      await generarFactura();
      return;
    }

    if (comando.includes("abrir inventario")) {
      hablar("Abriendo inventario");
      window.location.href = "/inventario.html";
      return;
    }

    if (comando.includes("abrir reportes")) {
      hablar("Mostrando reportes");
      window.location.href = "/reportes.html";
      return;
    }

    if (comando.includes("asistente mecanico")) {
      hablar("Activando asistente del mecánico");
      iniciarVoiceMechanic();
      return;
    }

    // Aquí se pueden añadir más comandos futuros
    hablar("No entendí el comando, por favor repite");
  } catch (error) {
    console.error("Error ejecutando comando de voz:", error);
    hablar("Ocurrió un error al ejecutar el comando");
  }
}

// ============================================
// Función de síntesis de voz
// ============================================
function hablar(texto) {
  if (!texto) return;
  const speech = new SpeechSynthesisUtterance(texto);
  speech.lang = "es-ES";
  speech.rate = 1;       // velocidad normal
  speech.pitch = 1;      // tono normal
  speech.volume = 1;     // volumen máximo
  window.speechSynthesis.speak(speech);
}