/*
================================================
VOICEASSISTANTWORKSHOP.JS - Versión Final
Asistente de voz global para TallerPRO360
Ubicación: /app/js/modules/voice/voiceAssistantWorkshop.js
================================================
*/

/* ===========================
INICIAR ASISTENTE DE VOZ
=========================== */
export function iniciarAsistenteWorkshop() {
  
  if (!("speechSynthesis" in window) || !(window.SpeechRecognition || window.webkitSpeechRecognition)) {
    console.warn("🎙 Navegador no soporta voz completa");
    return;
  }

  console.log("🎤 Asistente de voz inicializado");

}

/* ===========================
DICTADO GENERAL
=========================== */
export function dictarInput(inputId) {
  const input = document.getElementById(inputId);
  if(!input) return hablar("Campo no encontrado");

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition) return hablar("Tu navegador no soporta dictado por voz");

  const recognition = new SpeechRecognition();
  recognition.lang = "es-ES";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => hablar("Comienza a dictar");
  recognition.onerror = (e) => {
    console.error("Error dictado:", e);
    hablar("Ocurrió un error en dictado de voz");
  };
  recognition.onresult = (event) => {
    const texto = event.results[0][0].transcript;
    input.value += texto + " ";
    hablar(`Texto agregado: ${texto}`);
  };
  recognition.start();
}

/* ===========================
DICTADO PARA PRODUCTOS
=========================== */
export function dictarProductoVoz(inputId = "productoNombre") {
  dictarInput(inputId);
}

/* ===========================
SÍNTESIS DE VOZ
=========================== */
export function hablar(texto) {
  if (!texto) return;
  const speech = new SpeechSynthesisUtterance(texto);
  speech.lang = "es-ES";
  speech.rate = 1;
  speech.pitch = 1;
  speech.volume = 1;
  window.speechSynthesis.speak(speech);
}

/* ===========================
UTILIDADES GLOBALES
=========================== */
// Se pueden agregar aquí futuras funciones de dictado inteligente,
// lectura de órdenes, alertas de inventario o notificaciones.