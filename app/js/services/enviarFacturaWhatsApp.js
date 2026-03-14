/**
 * enviarFacturaWhatsApp.js
 * Envía factura al cliente por WhatsApp
 * TallerPRO360 ERP
 */

export function enviarFacturaWhatsApp(orden){

if(!orden.telefono){

alert("El cliente no tiene teléfono registrado")

return

}

/* limpiar teléfono */

let telefono = orden.telefono.replace(/\D/g,"")

if(!telefono.startsWith("57")){
telefono = "57" + telefono
}


/* construir mensaje */

let mensaje = `🚗 *TallerPRO360*\n\n`

mensaje += `Hola ${orden.cliente}\n\n`

mensaje += `Tu vehículo *${orden.vehiculo}*`

if(orden.placa)
mensaje += ` (${orden.placa})`

mensaje += ` ya está listo.\n\n`

mensaje += `🧾 *Detalle de la orden*\n\n`


/* items */

if(orden.items){

orden.items.forEach(item=>{

mensaje += `• ${item.nombre} x${item.cantidad} - $${item.precio * item.cantidad}\n`

})

}


/* mano de obra */

if(orden.manoObra){

mensaje += `• Mano de obra - $${orden.manoObra}\n`

}


/* total */

mensaje += `\n💰 *Total:* $${orden.total}\n\n`

mensaje += `Gracias por confiar en nuestro taller.`


/* codificar mensaje */

const texto = encodeURIComponent(mensaje)


/* abrir WhatsApp */

const url = `https://wa.me/${telefono}?text=${texto}`

window.open(url,"_blank")

}