/**
 * 📲 WHATSAPP SERVICE - NEXUS-X ULTRA AI
 * Infraestructura + Inteligencia + Automatización
 */

import { collection, addDoc, serverTimestamp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../core/firebase-config.js";

// ======================================================
// 📞 FORMATEO TELÉFONO
// ======================================================

const formatearTelefono = (tel) => {
  let limpio = tel.replace(/\D/g, "");
  if (limpio.length === 10) limpio = "57" + limpio;
  return limpio;
};

// ======================================================
// ⛔ CONTROL ANTI-SPAM (IA CONTROL)
// ======================================================

const lastMessages = new Map();

function canSend(key, cooldown = 1000 * 60 * 30) {
  const now = Date.now();
  const last = lastMessages.get(key);

  if (!last || (now - last > cooldown)) {
    lastMessages.set(key, now);
    return true;
  }
  return false;
}

// ======================================================
// 🚀 COLA MULTI-TALLER (TU SISTEMA BASE)
// ======================================================

export async function encolarMensaje(telefono, mensaje, tipo = "general") {

  const wsToken = localStorage.getItem("ws_api_token"); 
  const wsInstance = localStorage.getItem("ws_instance");

  if (!wsToken || !wsInstance) {
    console.warn("⚠️ Sin API configurada → fallback manual");
    return lanzarWhatsAppManual(telefono, mensaje);
  }

  await addDoc(collection(db, "cola_whatsapp"), {
    telefono: formatearTelefono(telefono),
    mensaje: mensaje.trim(),
    tipo,
    estado: "pendiente",
    fecha: serverTimestamp(),
    token: wsToken,
    instance: wsInstance,
    empresaId: localStorage.getItem("empresaId")
  });
}

// ======================================================
// 🤖 MENSAJES INTELIGENTES (CEO AI)
// ======================================================

export function sendFinancialAlert(phone, analysis) {

  if (!canSend("financial_alert")) return;

  const msg = `
🚨 *ALERTA FINANCIERA*

Estado: ${analysis.estado}
Riesgo: ${analysis.riesgo.nivel}

${analysis.riesgo.mensaje}

💰 Proyección: $${analysis.revenuePrediction.toLocaleString()}
📊 Score: ${analysis.score}/100
`;

  encolarMensaje(phone, msg, "alerta_financiera");
}

// ------------------------------------------------------

export function sendCEODecisions(phone, decisiones = []) {

  if (!decisiones.length || !canSend("ceo_decisions")) return;

  const lista = decisiones
    .map(d => `• (${d.prioridad}) ${d.accion}`)
    .join("\n");

  const msg = `
🧠 *CEO AI - DECISIONES*

${lista}
`;

  encolarMensaje(phone, msg, "ceo_ai");
}

// ------------------------------------------------------

export function sendCashCritical(phone, caja) {

  if (caja >= 0 || !canSend("cash_critical", 1000 * 60 * 10)) return;

  const msg = `
🚨 *CAJA CRÍTICA*

Saldo actual:
$${caja.toLocaleString()}

Acción inmediata requerida.
`;

  encolarMensaje(phone, msg, "cash_alert");
}

// ------------------------------------------------------

export function sendInventoryAlert(phone, inventario, ingresos) {

  if (inventario < ingresos * 1.5 || !canSend("inventory_alert")) return;

  const msg = `
📦 *CAPITAL DETENIDO*

Inventario alto detectado.

Convierte stock en liquidez.
`;

  encolarMensaje(phone, msg, "inventory_alert");
}

// ------------------------------------------------------

export function sendDailyReport(phone, analysis) {

  if (!canSend("daily_report", 1000 * 60 * 60 * 24)) return;

  const msg = `
📊 *REPORTE DIARIO*

Estado: ${analysis.estado}
Score: ${analysis.score}

Proyección:
$${analysis.revenuePrediction.toLocaleString()}

Riesgo: ${analysis.riesgo.nivel}
`;

  encolarMensaje(phone, msg, "daily_report");
}

// ======================================================
// 🚀 MOTOR AUTÓNOMO (AQUÍ ESTÁ LA MAGIA)
// ======================================================

export function runWhatsAppAutomation(phone, analysis, data) {

  if (!phone) return;

  // 🔥 Nivel crítico
  if (analysis.score < 40) {
    sendFinancialAlert(phone, analysis);
    sendCEODecisions(phone, analysis.decisiones);
  }

  // ⚠️ Caja negativa
  sendCashCritical(phone, data.caja);

  // 📦 Inventario alto
  sendInventoryAlert(phone, data.inventario, data.ingresos);

  // 📊 Reporte diario
  sendDailyReport(phone, analysis);
}

// ======================================================
// 📩 FUNCIONES ORIGINALES (CLIENTES)
// ======================================================

export function notificarEstadoAuto(orden) {

  const emojis = { 
    diagnostico: "🧠", 
    taller: "🔧", 
    listo: "✅", 
    entregado: "🚘" 
  };

  const emoji = emojis[orden.estado?.toLowerCase()] || "📋";

  const mensaje = `
*${orden.empresaNombre || 'TallerPRO360'}* 🚗

Hola *${orden.clienteNombre}*,

Estado de tu vehículo:
${emoji} *${orden.estado?.toUpperCase()}*

${orden.estado === 'listo'
  ? 'Ya puedes recoger tu vehículo.'
  : 'Seguimos trabajando con precisión.'}
`;

  encolarMensaje(orden.clienteTelefono, mensaje, "estado_cliente");
}

// ------------------------------------------------------

export function enviarFacturaPro(orden) {

  let itemsTxt = orden.items
    .map(i => `• ${i.nombre} (x${i.cantidad})`)
    .join("\n");

  const mensaje = `
🧾 *FACTURA DIGITAL*

Cliente: ${orden.clienteNombre}
Vehículo: ${orden.placa}

${itemsTxt}

*TOTAL:* $${new Intl.NumberFormat("es-CO").format(orden.total)}
`;

  encolarMensaje(orden.clienteTelefono, mensaje, "factura");
}

// ======================================================
// 🔗 FALLBACK
// ======================================================

function lanzarWhatsAppManual(telefono, mensaje) {
  const num = formatearTelefono(telefono);
  const url = `https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}