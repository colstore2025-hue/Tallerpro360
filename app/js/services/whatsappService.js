/**
 * whatsappService.js
 * Servicio de notificación por WhatsApp
 * TallerPRO360 ERP
 */


/* ======================================
   ENVIAR MENSAJE WHATSAPP
====================================== */

export function enviarWhatsApp(telefono, mensaje){

try{

if(!telefono){
console.warn("⚠️ Número de teléfono vacío");
return;
}

telefono = telefono.replace(/\D/g,"");

if(telefono.length < 8){
console.warn("⚠️ Teléfono inválido");
return;
}

if(!telefono.startsWith("57")){
telefono = "57" + telefono;
}

const mensajeCodificado =
encodeURIComponent(mensaje);

const url =
`https://wa.me/${telefono}?text=${mensajeCodificado}`;

window.open(url,"_blank");

}catch(error){

console.error("❌ Error enviando WhatsApp:",error);

}

}



/* ======================================
   NOTIFICACIÓN AUTOMÁTICA CLIENTE
====================================== */

export function notificarCliente(telefono, cliente, estado, vehiculo){

try{

const estadoEmoji = obtenerEmojiEstado(estado);

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

enviarWhatsApp(telefono, mensaje.trim());

}catch(error){

console.error("❌ Error notificando cliente:",error);

}

}



/* ======================================
   EMOJI SEGÚN ESTADO
====================================== */

function obtenerEmojiEstado(estado){

if(!estado) return "ℹ️";

const e = estado.toLowerCase();

if(e.includes("activa")) return "📋";
if(e.includes("proceso")) return "🔧";
if(e.includes("diagnostico")) return "🧠";
if(e.includes("listo")) return "✅";
if(e.includes("entregado")) return "🚘";

return "ℹ️";

}