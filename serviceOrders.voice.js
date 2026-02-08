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
// 💬 Introducciones dinámicas
// ===============================
const STAGE_INTRO = {
  INGRESO: "Hola,",
  DIAGNOSTICO: "Atención,",
  APROBADO: "Importante:",
  "EN PROCESO": "Información:",
  LISTO: "Buenas noticias:",
  ENTREGADO: "Gracias por su confianza,"
};

// ===============================
// 🔐 Control local para no repetir mensajes por orden
// ===============================
function alreadySpoken(orderCode, stage) {
  const data = JSON.parse(localStorage.getItem('tp360_voice') || '{}');
  return data[orderCode] === stage;
}

function markAsSpoken(orderCode, stage) {
  const data = JSON.parse(localStorage.getItem('tp360_voice') || '{}');
  data[orderCode] = stage;
  localStorage.setItem('tp360_voice', JSON.stringify(data));
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
    `${STAGE_INTRO[order.estado] || ""} ${message}`
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
// 🔄 Inicialización de voz para PWA/móvil
// ===============================
export function initVoiceActivation() {
  document.body.addEventListener('click', () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // activa la voz
      console.log("🎤 TallerPRO360: Voz activada manualmente (PWA/Android)");
    }
  }, { once: true });
}

// ===============================
// 🔄 Listener Firestore para actualización automática
// ===============================
export function listenOrderVoice(db, orderId) {
  import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js")
    .then(({ doc, onSnapshot }) => {
      try {
        const ref = doc(db, "ordenes", orderId);

        onSnapshot(ref, (snap) => {
          if (!snap.exists()) return;
          speakOrderStage(snap.data());
        });
      } catch (err) {
        console.error("❌ Error escuchando Firestore:", err);
        // Reintento automático cada 5s
        setTimeout(() => listenOrderVoice(db, orderId), 5000);
      }
    });
}