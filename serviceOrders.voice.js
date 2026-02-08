/**
 * serviceOrders.voice.js
 * Voz automática por cambio de estado de orden
 * TallerPRO360
 * Compatible Chrome / Android / PWA
 * Idioma: Español Colombia (es-CO)
 */

// ===============================
// 🎙️ Mensajes por estado
// ===============================
const STAGE_MESSAGES = {
  INGRESO: "Su vehículo ha sido ingresado al taller.",
  DIAGNOSTICO: "Su vehículo está en diagnóstico técnico.",
  APROBADO: "El servicio de su vehículo ha sido aprobado.",
  "EN PROCESO": "Su vehículo se encuentra en reparación.",
  LISTO: "Su vehículo está listo para ser entregado.",
  ENTREGADO: "Gracias por confiar en Taller PRO tres seis cero. Su vehículo fue entregado."
};

// ===============================
// 🔐 Control local para no repetir
// ===============================
function alreadySpoken(orderCode, stage) {
  return localStorage.getItem(`tp360_voice_${orderCode}`) === stage;
}

function markAsSpoken(orderCode, stage) {
  localStorage.setItem(`tp360_voice_${orderCode}`, stage);
}

// ===============================
// 🔊 Función principal de voz
// ===============================
export function speakOrderStage(order) {
  if (!("speechSynthesis" in window)) {
    console.warn("🔇 Navegador sin soporte de voz");
    return;
  }

  if (!order || !order.estado || !order.codigo) return;

  const message = STAGE_MESSAGES[order.estado];
  if (!message) return;

  if (alreadySpoken(order.codigo, order.estado)) return;

  const utterance = new SpeechSynthesisUtterance(
    `Taller PRO tres seis cero informa. ${message}`
  );

  utterance.lang = "es-CO";
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Cancelar cualquier voz anterior
  window.speechSynthesis.cancel();

  // Esperar carga de voces (Android fix)
  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
    markAsSpoken(order.codigo, order.estado);
  }, 300);
}

// ===============================
// 🔄 Listener Firestore (opcional)
// ===============================
// Úsalo si quieres que el script se conecte solo
// al documento de la orden

export function listenOrderVoice(db, orderId) {
  import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js")
    .then(({ doc, onSnapshot }) => {
      const ref = doc(db, "ordenes", orderId);

      onSnapshot(ref, (snap) => {
        if (!snap.exists()) return;
        speakOrderStage(snap.data());
      });
    });
}