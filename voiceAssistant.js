/**
 * voiceAssistant.js
 * Asistente de Voz Avanzado – TallerPRO360
 * Dictado técnico + control operativo por voz
 * Chrome / Android / iOS (parcial) / PWA
 * Idioma: Español Colombia (es-CO)
 */

import * as XLSX from "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
import { speakOrderStage } from "./serviceOrders.voice.js";

// ===============================
// 🔎 Utilidades
// ===============================
const normalize = (t = "") =>
  t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const money = (n = 0) => n.toLocaleString("es-CO");

// ===============================
// 🎙️ Voice Assistant Class
// ===============================
export class VoiceAssistant {
  constructor(db) {
    this.db = db;
    this.recognition = null;
    this.isListening = false;
    this.dictationMode = false;

    this.commands = [
      { pattern: /crear orden/, action: this.startOrderDictation.bind(this) },
      { pattern: /finalizar dictado/, action: this.finishDictation.bind(this) },
      { pattern: /mostrar ordenes entre (.*) y (.*)/, action: this.showOrdersByDate.bind(this) },
      { pattern: /exportar inventario/, action: this.exportInventory.bind(this) },
      { pattern: /exportar finanzas/, action: this.exportFinanzas.bind(this) },
      { pattern: /leer kpi|resumen kpi/, action: this.readKPIs.bind(this) },
      { pattern: /estado orden (.*)/, action: this.readOrderStatus.bind(this) }
    ];

    this.tempOrder = {};
  }

  // ===============================
  // 🚀 Inicialización
  // ===============================
  init() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("🔇 Reconocimiento de voz no soportado");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = "es-CO";
    this.recognition.continuous = true;
    this.recognition.interimResults = false;

    this.recognition.onresult = (e) => {
      const text = normalize(e.results[e.results.length - 1][0].transcript);
      console.log("🎤 Voz:", text);
      this.processSpeech(text);
    };

    this.recognition.onerror = (e) => {
      console.error("❌ Error voz:", e.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      if (this.isListening) this.recognition.start();
    };

    // Activación obligatoria por interacción (iOS / PWA)
    document.body.addEventListener("click", () => this.start(), { once: true });
  }

  start() {
    if (this.recognition && !this.isListening) {
      this.isListening = true;
      this.recognition.start();
      this.speak("Asistente de voz activado");
    }
  }

  // ===============================
  // 🧠 Procesador principal
  // ===============================
  processSpeech(text) {
    if (this.dictationMode) {
      this.captureDictation(text);
      return;
    }

    for (const cmd of this.commands) {
      if (cmd.pattern.test(text)) {
        const match = text.match(cmd.pattern);
        cmd.action(...(match?.slice(1) || []));
        return;
      }
    }

    this.speak("No entendí el comando");
  }

  // ===============================
  // 🛠️ CREACIÓN DE ÓRDENES POR VOZ
  // ===============================
  startOrderDictation() {
    this.dictationMode = true;
    this.tempOrder = {};
    this.speak(
      "Iniciando creación de orden. Diga: cliente, placa, vehículo, diagnóstico y trabajos realizados."
    );
  }

  captureDictation(text) {
    if (text.includes("cliente")) {
      this.tempOrder.cliente = text.replace("cliente", "").trim();
      this.speak("Cliente registrado");
    }

    if (text.includes("placa")) {
      this.tempOrder.placa = text.replace("placa", "").trim().toUpperCase();
      this.speak("Placa registrada");
    }

    if (text.includes("vehiculo")) {
      this.tempOrder.vehiculo = text.replace("vehiculo", "").trim();
      this.speak("Vehículo registrado");
    }

    if (text.includes("diagnostico")) {
      this.tempOrder.diagnostico = text.replace("diagnostico", "").trim();
      this.speak("Diagnóstico registrado");
    }

    if (text.includes("trabajos")) {
      this.tempOrder.trabajos = text.replace("trabajos", "").trim();
      this.speak("Trabajos registrados");
    }
  }

  async finishDictation() {
    this.dictationMode = false;

    if (!this.tempOrder.cliente || !this.tempOrder.placa) {
      this.speak("La orden está incompleta");
      return;
    }

    const order = {
      ...this.tempOrder,
      estado: "INGRESO",
      creadoEn: new Date(),
      actualizadoEn: new Date(),
      total: 0
    };

    await this.db.collection("ordenes").add(order);
    this.speak("Orden creada correctamente");
    this.tempOrder = {};
  }

  // ===============================
  // 📊 REPORTES / KPIs
  // ===============================
  async showOrdersByDate(startText, endText) {
    const start = new Date(startText);
    const end = new Date(endText);
    const snap = await this.db.collection("ordenes").get();

    const orders = snap.docs.filter((d) => {
      const f = d.data().actualizadoEn?.toDate?.() || new Date();
      return f >= start && f <= end;
    });

    this.speak(`Se encontraron ${orders.length} órdenes`);
    console.table(orders.map((o) => o.data()));
  }

  async readKPIs() {
    const snap = await this.db.collection("ordenes").get();
    let ingresos = 0,
      costos = 0,
      activas = 0;

    snap.docs.forEach((d) => {
      const o = d.data();
      ingresos += o.total || 0;
      costos += o.costoRepuestos || 0;
      if (o.estado !== "ENTREGADO") activas++;
    });

    this.speak(
      `Órdenes activas ${activas}. Ingresos ${money(
        ingresos
      )}. Utilidad ${money(ingresos - costos)}`
    );
  }

  async exportInventory() {
    const snap = await this.db.collection("inventario").get();
    const data = snap.docs.map((d) => d.data());
    this.exportExcel(data, "Inventario");
  }

  async exportFinanzas() {
    const snap = await this.db.collection("ordenes").get();
    const data = snap.docs.map((d) => {
      const o = d.data();
      return {
        codigo: o.codigo,
        cliente: o.cliente?.nombre,
        total: o.total,
        costo: o.costoRepuestos,
        utilidad: (o.total || 0) - (o.costoRepuestos || 0)
      };
    });
    this.exportExcel(data, "Finanzas");
  }

  exportExcel(data, name) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, name);
    XLSX.writeFile(wb, `${name}.xlsx`);
    this.speak(`Reporte ${name} exportado`);
  }

  async readOrderStatus(code) {
    const snap = await this.db
      .collection("ordenes")
      .where("codigo", "==", code.toUpperCase())
      .get();

    if (snap.empty) {
      this.speak("Orden no encontrada");
      return;
    }

    const order = snap.docs[0].data();
    speakOrderStage(order);
  }

  // ===============================
  // 🔊 Voz
  // ===============================
  speak(text) {
    if (typeof speechSynthesis === "undefined") return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-CO";
    u.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
}