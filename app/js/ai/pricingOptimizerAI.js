/**
 * pricingOptimizerAI.js
 * Calcula precio inteligente del servicio
 */

export function calcularPrecioInteligente({

costoRepuestos = 0,
horasTrabajo = 0,
tipoCliente = "normal"

}){

const valorHora = 60000

let margen = 0.45


switch(tipoCliente){

case "vip":
margen = 0.40
break

case "empresa":
margen = 0.35
break

case "flota":
margen = 0.30
break

default:
margen = 0.45

}


const manoObra = horasTrabajo * valorHora

let subtotal = costoRepuestos + manoObra

let total = subtotal * (1 + margen)


if(total < 30000){
total = 30000
}

total = Math.round(total / 1000) * 1000

return total

}