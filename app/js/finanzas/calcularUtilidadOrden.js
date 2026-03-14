/**
 * calcularUtilidadOrden.js
 * Calcula utilidad de una orden del taller
 * TallerPRO360 ERP
 */

export function calcularUtilidadOrden(orden){

let costoTotal = 0
let ventaTotal = 0


/* =====================================
CALCULAR REPUESTOS
===================================== */

if(orden.items){

orden.items.forEach(item=>{

const costo = Number(item.costo || 0) * Number(item.cantidad || 1)
const venta = Number(item.precio || 0) * Number(item.cantidad || 1)

costoTotal += costo
ventaTotal += venta

})

}


/* =====================================
MANO DE OBRA
===================================== */

const manoObra = Number(orden.manoObra || 0)

ventaTotal += manoObra


/* =====================================
UTILIDAD
===================================== */

const utilidad = ventaTotal - costoTotal

const margen = ventaTotal
? ((utilidad / ventaTotal) * 100).toFixed(2)
: 0


return {

costo: costoTotal,
venta: ventaTotal,
utilidad,
margen

}

}