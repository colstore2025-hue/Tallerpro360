// ======================================
// NOTIFICACIÓN AUTOMÁTICA WHATSAPP
// ======================================

export function notificarCliente(telefono, cliente, estado, vehiculo) {
  try {

    // ==============================
    // VALIDAR TELÉFONO
    // ==============================
    if (!telefono) {
      alert("Número de teléfono no válido");
      return;
    }

    // Eliminar caracteres no numéricos
    telefono = telefono.replace(/\D/g, "");

    if (telefono.length < 8) {
      alert("Teléfono inválido");
      return;
    }

    // ==============================
    // ESTADO CON EMOJI
    // ==============================
    const estadoEmoji = obtenerEmojiEstado(estado);

    // ==============================
    // MENSAJE
    // ==============================
    const mensaje = `
Hola ${cliente}

Le informamos el estado de su vehículo:

🚗 Vehículo: ${vehiculo}

📊 Estado actual:
${estadoEmoji} ${estado}

Gracias por confiar en nosotros.

TallerPRO360
Servicio automotriz
`;

    // Codificar mensaje para URL
    const mensajeCodificado = encodeURIComponent(mensaje.trim());

    // URL WhatsApp
    const url = `https://wa.me/57${telefono}?text=${mensajeCodificado}`;

    // Abrir WhatsApp en nueva ventana
    window.open(url, "_blank");

  } catch (error) {
    console.error("Error enviando WhatsApp:", error);
    alert("No fue posible abrir WhatsApp");
  }
}

// ======================================
// FUNCION AUXILIAR: EMOJIS SEGÚN ESTADO
// ======================================
function obtenerEmojiEstado(estado) {
  const e = estado.toLowerCase();

  if (e.includes("activa")) return "📋";
  if (e.includes("proceso")) return "🔧";
  if (e.includes("listo")) return "✅";
  if (e.includes("entregado")) return "🚘";

  return "ℹ️";
}