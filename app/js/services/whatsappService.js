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
