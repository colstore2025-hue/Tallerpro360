/**
 * 🤖 IA Assistant PRO360
 * TallerPRO360 – ERP + IA + Voz
 */

import { analizarNegocio } from "./aiManager.js";
import { escucharVoz, hablar } from "../voice/voiceCore.js";

export let IA = {
  estado: "inactiva",
  empresaId: null,
  resumen: {},
  alertas: [],
  recomendaciones: []
};

// Inicializar IA operativa
export async function init({ empresaId } = {}) {
  if (!empresaId) {
    console.warn("⚠️ IA no inicializada: empresaId requerido");
    return;
  }

  IA.empresaId = empresaId;
  IA.estado = "inicializando";

  console.log("🤖 IA Assistant PRO360 inicializando para:", empresaId);

  try {
    await actualizarIA();

    // Inicializar voz si está disponible
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      escucharVoz((texto) => {
        console.log("🎤 Comando por voz detectado:", texto);
        // Aquí puedes enviar a generarOrdenIA, generar alertas, etc.
      });
    }

    IA.estado = "activa";
    console.log("✅ IA Assistant PRO360 activa");
  } catch (e) {
    IA.estado = "error";
    console.error("❌ Error inicializando IA:", e);
  }
}

// Actualizar datos IA
export async function actualizarIA() {
  if (!IA.empresaId) return;

  try {
    const data = await analizarNegocio({ empresaId: IA.empresaId });

    IA.resumen = data.resumen || {};
    IA.alertas = data.alertas || [];
    IA.recomendaciones = data.recomendaciones || [];

    console.log("📊 IA actualizada:", IA.resumen);

  } catch (e) {
    console.error("❌ Error actualizando IA:", e);
  }
}

// Notificar alertas por voz
export function notificarAlertas() {
  if (!IA.alertas.length) return;
  IA.alertas.forEach(alerta => hablar(`🚨 Alerta: ${alerta}`));
}

// Función para obtener estado actual
export function estadoIA() {
  return {
    estado: IA.estado,
    resumen: IA.resumen,
    alertas: IA.alertas,
    recomendaciones: IA.recomendaciones
  };
}