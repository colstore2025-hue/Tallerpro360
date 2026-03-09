/**
 * Fraud Detection AI
 * TallerPRO360
 * Detecta anomalías en órdenes, inventario y técnicos
 */

export class FraudDetectionAI {

analizarOrdenes(ordenes){

let alertas = []

ordenes.forEach(o=>{

/* ==============================
ORDEN CON TOTAL ANORMAL
============================== */

if(o.total > 5000000){

alertas.push({
tipo:"orden",
nivel:"medio",
mensaje:`Orden ${o.id} con valor inusualmente alto`,
orden:o.id
})

}


/* ==============================
MARGEN NEGATIVO
============================== */

let costo = 0
let venta = 0

if(o.acciones){

o.acciones.forEach(a=>{

venta += Number(a.costo || 0)
costo += Number(a.costoInterno || 0)

})

}

if(costo > venta){

alertas.push({
tipo:"financiero",
nivel:"alto",
mensaje:`Orden ${o.id} tiene margen negativo`,
orden:o.id
})

}

})


return alertas

}


/* ==============================
DETECTAR TÉCNICOS SOSPECHOSOS
============================== */

analizarTecnicos(ordenes){

let mapa = {}

ordenes.forEach(o=>{

const tecnico = o.tecnico || "Sin asignar"

if(!mapa[tecnico]){
mapa[tecnico] = 0
}

mapa[tecnico] += Number(o.total || 0)

})

let alertas = []

Object.entries(mapa).forEach(t=>{

if(t[1] > 20000000){

alertas.push({
tipo:"tecnico",
nivel:"medio",
mensaje:`${t[0]} tiene facturación inusualmente alta`
})

}

})

return alertas

}


/* ==============================
DETECTAR FUGA DE INVENTARIO
============================== */

analizarInventario(movimientos){

let alertas = []

movimientos.forEach(m=>{

if(m.tipo === "salida" && !m.ordenId){

alertas.push({
tipo:"inventario",
nivel:"alto",
mensaje:`Salida de inventario sin orden registrada`
})

}

})

return alertas

}

}