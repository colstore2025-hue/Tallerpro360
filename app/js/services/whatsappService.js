/**
 * whatsappService.js
 * Servicio de notificación por WhatsApp
 * TallerPRO360 ERP
 */


/* ======================================
   NOTIFICACIÓN AUTOMÁTICA WHATSAPP
====================================== */

export function notificarCliente(telefono, cliente, estado, vehiculo) {

  try {

    /* ==============================
       VALIDAR TELÉFONO
    ============================== */

    if (!telefono) {
      console.warn("Número de teléfono no válido");
      return;
    }

    // eliminar caracteres no numéricos
    telefono = telefono.replace(/\D/g, "");

    if (telefono.length < 8) {
      console.warn("Teléfono inválido");
      return;
    }

    // agregar código país si no existe
    if (!telefono.startsWith("57")) {
      telefono = "57" + telefono;
    }


    /* ==============================
       ESTADO CON EMOJI
    ============================== */

    const estadoEmoji = obtenerEmojiEstado(estado);


    /* ==============================
       MENSAJE
    ============================== */

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

    const mensajeCodificado =
      encodeURIComponent(mensaje.trim());


    /* ==============================
       URL WHATSAPP
    ============================== */

    const url =
      `https://wa.me/${telefono}?text=${mensajeCodificado}`;


    /* ==============================
       ABRIR WHATSAPP
    ============================== */

    window.open(url, "_blank");


  } catch (error) {

    console.error(
      "Error enviando WhatsApp:",
      error
    );

  }

}



/* ======================================
   EMOJIS SEGÚN ESTADO
====================================== */

function obtenerEmojiEstado(estado) {

  if (!estado) return "ℹ️";

  const e = estado.toLowerCase();

  if (e.includes("activa")) return "📋";
  if (e.includes("proceso")) return "🔧";
  if (e.includes("diagnostico")) return "🧠";
  if (e.includes("listo")) return "✅";
  if (e.includes("entregado")) return "🚘";

  return "ℹ️";

}