/**
 * voiceAssistant.js
 * TallerPRO360 ERP SaaS
 * Modo Técnico Manos Libres – Versión Industrial
 */

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { speakOrderStage } from "./serviceOrders.voice.js";

// ===============================
// 🔎 UTILIDADES
// ===============================
const normalize = (t = "") =>
  t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// ===============================
// 🎙️ CLASE PRINCIPAL
// ===============================
export class VoiceAssistant {

  constructor(db, empresaId) {
    this.db = db;
    this.empresaId = empresaId;
    this.recognition = null;
    this.isListening = false;
    this.currentOrderId = null;
    this.technicalMode = false;
  }

  // ======================================================
  // 🚀 INIT
  // ======================================================

  init() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Reconocimiento no soportado");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = "es-CO";
    this.recognition.continuous = true;
    this.recognition.interimResults = false;

    this.recognition.onresult = (e) => {
      const text = normalize(
        e.results[e.results.length - 1][0].transcript
      );

      console.log("🎤:", text);
      this.process(text);
    };

    this.recognition.onend = () => {
      if (this.isListening) this.recognition.start();
    };

    document.body.addEventListener("click", () => {
      this.start();
    }, { once: true });
  }

  start() {
    if (!this.recognition) return;
    this.isListening = true;
    this.recognition.start();
    this.speak("Asistente técnico activado");
  }

  // ======================================================
  // 🧠 PROCESADOR
  // ======================================================

  async process(text) {

    // 🔧 Activar modo técnico
    if (text.includes("iniciar modo tecnico orden")) {
      const code = text.split("orden")[1]?.trim()?.toUpperCase();
      await this.activateTechnicalMode(code);
      return;
    }

    if (text.includes("finalizar modo tecnico")) {
      this.technicalMode = false;
      this.currentOrderId = null;
      this.speak("Modo técnico finalizado");
      return;
    }

    if (this.technicalMode && this.currentOrderId) {
      await this.saveTechnicalNote(text);
      return;
    }

    // Cambiar estado por voz
    if (text.includes("cambiar estado a listo")) {
      await this.changeStatus("LISTO");
      return;
    }

    if (text.includes("cambiar estado a en proceso")) {
      await this.changeStatus("EN_PROCESO");
      return;
    }

    if (text.includes("estado orden")) {
      const code = text.split("orden")[1]?.trim()?.toUpperCase();
      await this.readOrderStatus(code);
      return;
    }
  }

  // ======================================================
  // 🔧 ACTIVAR MODO TÉCNICO
  // ======================================================

  async activateTechnicalMode(code) {

    if (!code) {
      this.speak("No entendí el código de orden");
      return;
    }

    const q = query(
      collection(this.db, "talleres", this.empresaId, "ordenes"),
      where("codigo", "==", code)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      this.speak("Orden no encontrada");
      return;
    }

    this.currentOrderId = snap.docs[0].id;
    this.technicalMode = true;

    this.speak(`Modo técnico activado para orden ${code}`);
  }

  // ======================================================
  // 📝 GUARDAR NOTA TÉCNICA AUTOMÁTICA
  // ======================================================

  async saveTechnicalNote(text) {

    if (!this.currentOrderId) return;

    const stagesRef = collection(
      this.db,
      "talleres",
      this.empresaId,
      "ordenes",
      this.currentOrderId,
      "stages"
    );

    await addDoc(stagesRef, {
      type: "nota_tecnica",
      message: text,
      by: "tecnico",
      at: serverTimestamp()
    });

    await updateDoc(
      doc(
        this.db,
        "talleres",
        this.empresaId,
        "ordenes",
        this.currentOrderId
      ),
      {
        updatedAt: serverTimestamp()
      }
    );

    console.log("📝 Nota técnica guardada");
  }

  // ======================================================
  // 🔄 CAMBIAR ESTADO POR VOZ
  // ======================================================

  async changeStatus(newStatus) {

    if (!this.currentOrderId) {
      this.speak("No hay orden activa");
      return;
    }

    const orderRef = doc(
      this.db,
      "talleres",
      this.empresaId,
      "ordenes",
      this.currentOrderId
    );

    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    this.speak("Estado actualizado");

  }

  // ======================================================
  // 🔎 LEER ESTADO
  // ======================================================

  async readOrderStatus(code) {

    const q = query(
      collection(this.db, "talleres", this.empresaId, "ordenes"),
      where("codigo", "==", code)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      this.speak("Orden no encontrada");
      return;
    }

    speakOrderStage(snap.docs[0].data());
  }

  // ======================================================
  // 🔊 VOZ
  // ======================================================

  speak(text) {
    if (typeof speechSynthesis === "undefined") return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-CO";
    u.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
}