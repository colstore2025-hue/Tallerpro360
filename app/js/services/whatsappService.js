/**
 * whatsappService.js - TallerPRO360 ULTRA
 * Motor de Comunicaciones Nexus-X
 */
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

/* ======================================
   LIMPIADOR DE TELÉFONO (Único punto de verdad)
====================================== */
const formatearTelefono = (tel) => {
  let limpio = tel.replace(/\D/g, "");
  if (limpio.length === 10) limpio = "57" + limpio; // Colombia default
  return limpio;
};

/* ======================================
   SISTEMA DE COLA (AUTOMÁTICO)
   Este método guarda el mensaje en Firestore y un
   Bot externo (o Vercel Cron) lo envía solo.
====================================== */
/**
 * whatsappService.js - Segmentación por Taller
 */

export async function encolarMensaje(telefono, mensaje) {
  // 1. Recuperamos las credenciales del taller actual
  const wsToken = localStorage.getItem("ws_api_token"); 
  const wsInstance = localStorage.getItem("ws_instance");

  if (!wsToken || !wsInstance) {
    console.warn("⚠️ Taller sin API de WhatsApp configurada. Usando fallback manual.");
    return lanzarWhatsAppManual(telefono, mensaje);
  }

  // 2. Guardamos en la cola incluyendo las credenciales del taller
  await addDoc(collection(db, "cola_whatsapp"), {
    telefono: formatearTelefono(telefono),
    mensaje: mensaje.trim(),
    estado: "pendiente",
    fecha: serverTimestamp(),
    // IMPORTANTE: Esto le dice a tu Bridge de quién es este mensaje
    token: wsToken, 
    instance: wsInstance,
    empresaId: localStorage.getItem("empresaId")
  });
}

/* ======================================
   NOTIFICACIÓN DE ESTADO (IA + EMOJIS)
====================================== */
export function notificarEstadoAuto(orden) {
  const emojis = { 
    diagnostico: "🧠", taller: "🔧", listo: "✅", entregado: "🚘" 
  };
  const emoji = emojis[orden.estado?.toLowerCase()] || "📋";

  const mensaje = `
*${orden.empresaNombre || 'TallerPRO360'}* 🚗
Hola *${orden.clienteNombre}*,

Actualización de tu vehículo: *${orden.vehiculo}* (${orden.placa})
Estado: ${emoji} *${orden.estado?.toUpperCase()}*

${orden.estado === 'listo' ? 'Ya puedes pasar por tu vehículo. 🏁' : 'Seguimos trabajando con precisión.'}

_Enviado automáticamente por Nexus-X Starlink_
  `;

  encolarMensaje(orden.clienteTelefono, mensaje, "update_estado");
}

/* ======================================
   ENVÍO DE FACTURA PROFESIONAL
====================================== */
export function enviarFacturaPro(orden) {
  let itemsTxt = orden.items.map(i => `• ${i.nombre} (x${i.cantidad})`).join("\n");
  
  const mensaje = `
*FACTURA DIGITAL* 🧾
--------------------------
Cliente: ${orden.clienteNombre}
Vehículo: ${orden.placa}

*Servicios:*
${itemsTxt}

*TOTAL:* $${new Intl.NumberFormat("es-CO").format(orden.total)}
--------------------------
Puedes ver el detalle completo en nuestro portal.
Gracias por tu confianza.
  `;

  encolarMensaje(orden.clienteTelefono, mensaje, "factura");
}

/* ======================================
   FALLBACK (EL PLAN B)
====================================== */
function lanzarWhatsAppManual(telefono, mensaje) {
  const num = formatearTelefono(telefono);
  const url = `https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}
