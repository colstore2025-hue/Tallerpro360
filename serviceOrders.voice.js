// serviceOrders.voice.js

/**
 * Genera voz automática cuando una orden cambia de etapa
 * Usa Web Speech API (compatible con Chrome / Android)
 * Preparado para Colombia (es-CO)
 */

const stageMessages = {
  INGRESO: "Su vehículo ha sido ingresado al taller.",
  DIAGNOSTICO: "Su vehículo está en diagnóstico técnico.",
  APROBACION: "Su vehículo está pendiente de aprobación.",
  REPARACION: "Su vehículo se encuentra en reparación.",
  PRUEBAS: "El vehículo está en pruebas finales.",
  FACTURACION: "Su vehículo está en proceso de facturación.",
  LISTO: "Su vehículo está listo para ser entregado.",
  ENTREGADO: "Gracias por confiar en TallerPRO360. Su vehículo fue entregado."
};

/**
 * Ejecuta voz si la etapa es nueva
 * @param {string} orderId
 * @param {string} stage
 */
export function speakStage(orderId, stage) {
  if (!("speechSynthesis" in window)) {
    console.warn("❌ Voz no soportada en este navegador");
    return;
  }

  const message = stageMessages[stage];
  if (!message) {
    console.warn(`❌ No hay mensaje de voz para la etapa ${stage}`);
    return;
  }

  // Evitar repetir voz
  const lastSpoken = localStorage.getItem(`tp360_voice_${orderId}`);
  if (lastSpoken === stage) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(
    `Taller PRO tres seis cero informa: ${message}`
  );

  utterance.lang = "es-CO";
  utterance.rate = 0.95;
  utterance.pitch = 1;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  localStorage.setItem(`tp360_voice_${orderId}`, stage);
}