/**
 * serviceOrders.voice.js
 * Sistema inteligente de voz por cambio de estado
 * TallerPRO360 ERP SaaS
 * Versión PRO 2026
 * Compatible Chrome / Android / iOS / PWA
 * Idioma: Español Colombia (es-CO)
 */

// ======================================================
// 🎙️ MENSAJES POR ESTADO (status real del sistema)
// ======================================================

const STAGE_MESSAGES = {
  INGRESO: "Su vehículo ha sido ingresado al taller.",
  DIAGNOSTICO: "Su vehículo está en diagnóstico técnico.",
  APROBADO: "El servicio de su vehículo ha sido aprobado.",
  EN_PROCESO: "Su vehículo se encuentra en reparación.",
  LISTO: "Su vehículo está listo para ser entregado.",
  ENTREGADO: "Gracias por confiar en Taller Pro tres sesenta. Su vehículo fue entregado."
};

// ======================================================
// 💬 INTRODUCCIONES DINÁMICAS
// ======================================================

const STAGE_INTRO = {
  INGRESO: "Hola,",
  DIAGNOSTICO: "Atención,",
  APROBADO: "Importante:",
  EN_PROCESO: "Información:",
  LISTO: "Buenas noticias:",
  ENTREGADO: "Gracias por su confianza,"
};

// ======================================================
// 🔐 CONTROL LOCAL ANTI-REPETICIÓN
// ======================================================

function getVoiceMemory() {
  return JSON.parse(localStorage.getItem("tp360_voice") || "{}");
}

function alreadySpoken(orderCode, stage) {
  const data = getVoiceMemory();
  return data[orderCode] === stage;
}

function markAsSpoken(orderCode, stage) {
  const data = getVoiceMemory();
  data[orderCode] = stage;
  localStorage.setItem("tp360_voice", JSON.stringify(data));
}

// ======================================================
// 🎤 SELECCIÓN INTELIGENTE DE VOZ
// ======================================================

function getBestSpanishVoice() {
  const voices = speechSynthesis.getVoices();

  // Prioridad 1: Español Colombia
  let voice = voices.find(v => v.lang === "es-CO");

  // Prioridad 2: Español general
  if (!voice) {
    voice = voices.find(v => v.lang.startsWith("es"));
  }

  return voice || null;
}

// ======================================================
// 🔊 FUNCIÓN PRINCIPAL
// ======================================================

export function speakOrderStage(order) {

  if (typeof speechSynthesis === "undefined" || !speechSynthesis) {
    console.warn("🔇 Navegador sin soporte de voz");
    return;
  }

  if (!order || !order.status || !order.codigo) return;

  const stage = order.status;
  const message = STAGE_MESSAGES[stage];

  if (!message) return;

  // Evita repetir
  if (alreadySpoken(order.codigo, stage)) return;

  const fullMessage = `${STAGE_INTRO[stage] || ""} ${message}`;

  const utterance = new SpeechSynthesisUtterance(fullMessage);

  utterance.lang = "es-CO";
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;

  const selectedVoice = getBestSpanishVoice();
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  // Limpia cola anterior
  window.speechSynthesis.cancel();

  // Delay pequeño para estabilidad en móviles
  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
    markAsSpoken(order.codigo, stage);
  }, 250);
}

// ======================================================
// 📱 ACTIVACIÓN PARA PWA / iOS
// ======================================================

export function initVoiceActivation() {

  const activate = () => {
    if (typeof speechSynthesis !== "undefined") {
      const dummy = new SpeechSynthesisUtterance("");
      speechSynthesis.speak(dummy);
      speechSynthesis.cancel();
      console.log("🎤 Voz activada correctamente");
    }
  };

  document.addEventListener("click", activate, { once: true });
  document.addEventListener("touchstart", activate, { once: true });
}

// ======================================================
// 🔄 LISTENER FIRESTORE MULTIEMPRESA (VERSIÓN ERP)
// ======================================================

import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Escucha cambios en una orden específica
 * @param {object} db - instancia Firestore
 * @param {string} empresaId - ID del taller
 * @param {string} ordenId - código de orden
 */
export function listenOrderVoice(db, empresaId, ordenId) {

  try {

    const ref = doc(db, "talleres", empresaId, "ordenes", ordenId);

    onSnapshot(ref, (snap) => {

      if (!snap.exists()) return;

      const data = snap.data();

      if (!data.status) return;

      speakOrderStage(data);

    });

  } catch (err) {

    console.error("❌ Error escuchando orden:", err);

    // Reintento automático
    setTimeout(() => {
      listenOrderVoice(db, empresaId, ordenId);
    }, 5000);

  }
}