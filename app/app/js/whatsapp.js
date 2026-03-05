export function notificarCliente(
  telefono,
  cliente,
  estado,
  vehiculo
){

  try{

    if(!telefono){
      alert("Número de teléfono no válido");
      return;
    }

    // limpiar teléfono
    telefono = telefono.replace(/\D/g,"");

    if(telefono.length < 8){
      alert("Teléfono inválido");
      return;
    }

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

    const mensajeCodificado = encodeURIComponent(mensaje.trim());

    const url = `https://wa.me/57${telefono}?text=${mensajeCodificado}`;

    window.open(url,"_blank");

  }catch(error){

    console.error("Error enviando WhatsApp:",error);

    alert("No fue posible abrir WhatsApp");

  }

}



function obtenerEmojiEstado(estado){

  const e = estado.toLowerCase();

  if(e.includes("activa")) return "📋";
  if(e.includes("proceso")) return "🔧";
  if(e.includes("listo")) return "✅";
  if(e.includes("entregado")) return "🚘";

  return "ℹ️";

}