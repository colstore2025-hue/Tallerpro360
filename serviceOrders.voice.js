// serviceOrders.voice.js
/**
 * Voz automática por cambio de etapa
 * TallerPRO360 – Colombia
 */

const stageMessages = {
  INGRESO: "Su vehículo ha sido ingresado al taller.",
  DIAGNOSTICO: "Su vehículo está en diagnóstico técnico.",
  APROBACION: "Su vehículo está pendiente de aprobación.",
  REPARACION: "Su vehículo se encuentra en reparación.",
  PRUEBAS: "El vehículo está en pruebas finales.",
  FACTURACION: "Su vehículo está en proceso de facturación.",
  LISTO: "Su vehículo está listo para ser entregado.",
  ENTREGADO: "Gracias por confiar en Taller Pro tres seis cero. Su vehículo fue entregado."
};

let voicesLoaded = false;

/**
 * Inicializa voces (OBLIGATORIO llamar tras un click del usuario)
 */
export function initVoice() {
  if (!("speechSynthesis" in window)) return;

  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => {
    voicesLoaded = true;
  };
}

/**
 * Habla una etapa solo si es nueva
 */
export function speakStage(orderId, stage) {
  if (!("speechSynthesis" in window)) return;

  const message = stageMessages[stage];
  if (!message) return;

  const lastSpoken = localStorage.getItem(`tp360_voice_${orderId}`);
  if (lastSpoken === stage) return;

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(
      `Atención. Taller Pro tres seis cero informa. ${message}`
    );

    const voices = speechSynthesis.getVoices();
    const voiceES = voices.find(v => v.lang.startsWith("es"));

    if (voiceES) utterance.voice = voiceES;

    utterance.lang = "es-CO";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    speechSynthesis.speak(utterance);
    localStorage.setItem(`tp360_voice_${orderId}`, stage);
  };

  // Evitar bug Android
  if (!voicesLoaded) {
    setTimeout(speak, 500);
  } else {
    speak();
  }
}