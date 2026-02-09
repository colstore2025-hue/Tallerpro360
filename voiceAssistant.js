/**
 * voiceAssistant.js
 * Asistente de voz interactivo para TallerPRO360
 * Compatible Chrome / iOS / Android / PWA
 * Idioma: Español Colombia (es-CO)
 */

import * as XLSX from "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
import { speakOrderStage } from "./serviceOrders.voice.js"; // Mantiene voz de estados

export class VoiceAssistant {
  constructor(db) {
    this.db = db;
    this.recognition = null;
    this.isListening = false;
    this.commands = [
      { pattern: /mostrar ordenes (?:entre )?(\d{4}-\d{2}-\d{2}) (?:y|a) (\d{4}-\d{2}-\d{2})/, action: this.showOrdersByDate.bind(this) },
      { pattern: /exportar inventario (?:a excel)?/, action: this.exportInventory.bind(this) },
      { pattern: /mostrar ingresos(?: del mes)?/, action: this.showIngresos.bind(this) },
      { pattern: /exportar finanzas (?:a excel)?/, action: this.exportFinanzas.bind(this) },
      { pattern: /resumen kpi/, action: this.readKPIs.bind(this) },
    ];
  }

  init() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn("🔇 Navegador sin soporte de reconocimiento de voz");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-CO';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log("🎤 Comando detectado:", transcript);
      this.handleCommand(transcript);
    };

    this.recognition.onerror = (event) => {
      console.error("❌ Error reconocimiento voz:", event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => { this.isListening = false; };

    // Activación manual para PWA / móvil
    document.body.addEventListener('click', () => {
      if (!this.isListening) this.startListening();
    }, { once: true });
  }

  startListening() {
    if (this.recognition) {
      this.isListening = true;
      this.recognition.start();
      console.log("🎤 Asistente de voz activado");
    }
  }

  handleCommand(transcript) {
    for (let cmd of this.commands) {
      const match = transcript.match(cmd.pattern);
      if (match) {
        cmd.action(...match.slice(1));
        return;
      }
    }
    this.speak("No entendí el comando, por favor intente nuevamente.");
  }

  // ==========================
  // 🚀 Acciones
  // ==========================

  async showOrdersByDate(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const snap = await this.db.collection('ordenes').get();
    const filtered = snap.docs.filter(d => {
      const date = d.data().actualizadoEn?.toDate();
      return date && date >= start && date <= end;
    });
    this.speak(`Se encontraron ${filtered.length} órdenes entre ${startDate} y ${endDate}`);
    console.table(filtered.map(d => d.data()));
  }

  async exportInventory() {
    const snap = await this.db.collection('inventario').get();
    const data = snap.docs.map(d => d.data());
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, "Inventario.xlsx");
    this.speak("Inventario exportado a Excel");
  }

  async showIngresos() {
    const snap = await this.db.collection('ordenes').get();
    let ingresos = 0;
    snap.docs.forEach(d => ingresos += d.data().total || 0);
    this.speak(`Los ingresos totales son ${ingresos.toLocaleString()} pesos colombianos`);
  }

  async exportFinanzas() {
    const snap = await this.db.collection('ordenes').get();
    const data = snap.docs.map(d => {
      const o = d.data();
      return {
        codigo: o.codigo,
        cliente: o.cliente?.nombre,
        total: o.total,
        costo: o.costoRepuestos,
        utilidad: (o.total || 0) - (o.costoRepuestos || 0)
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Finanzas");
    XLSX.writeFile(wb, "Finanzas.xlsx");
    this.speak("Reporte de finanzas exportado a Excel");
  }

  async readKPIs() {
    const snap = await this.db.collection('ordenes').get();
    let ingresos=0, egresos=0, activas=0, clientes=new Set();
    snap.docs.forEach(d => {
      const o = d.data();
      if(o.estado !== "ENTREGADO") activas++;
      clientes.add(o.cliente?.nombre || "");
      ingresos += o.total || 0;
      egresos += o.costoRepuestos || 0;
    });
    const utilidad = ingresos - egresos;
    this.speak(`KPIs: Órdenes activas ${activas}, Clientes ${clientes.size}, Ingresos ${ingresos.toLocaleString()}, Egresos ${egresos.toLocaleString()}, Utilidad ${utilidad.toLocaleString()}`);
  }

  // ==========================
  // 🔊 Lectura por voz
  // ==========================
  speak(message) {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "es-CO";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
}