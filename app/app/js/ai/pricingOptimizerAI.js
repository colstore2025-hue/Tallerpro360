/**
 * Pricing Optimizer AI
 * Calcula precio inteligente del servicio
 */

export function calcularPrecioInteligente({

costoRepuestos = 0,
horasTrabajo = 0,
tipoCliente = "normal"

}){

/* ==============================
CONFIGURACIÓN
============================== */

const valorHora = 60000
let margen = 0.45


/* ==============================
AJUSTE POR CLIENTE
============================== */

if(tipoCliente === "vip"){
margen = 0.40
}

if(tipoCliente === "empresa"){
margen = 0.35
}


/* ==============================
CÁLCULO
============================== */

const manoObra = horasTrabajo * valorHora

let subtotal = costoRepuestos + manoObra

let total = subtotal * (1 + margen)


/* ==============================
PRECIO MÍNIMO
============================== */

if(total < 30000){
total = 30000
}


/* ==============================
REDONDEO COMERCIAL
============================== */

total = Math.round(total / 1000) * 1000

return total

}