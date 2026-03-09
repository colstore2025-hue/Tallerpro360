/**
 * Revenue Forecast AI
 * TallerPRO360
 * Predicción de ingresos usando histórico de órdenes
 */

export class RevenueForecastAI {

constructor(){
this.historial = []
}


/* =========================
CARGAR DATOS HISTÓRICOS
========================= */

cargarOrdenes(ordenes){

this.historial = ordenes.map(o=>{

return {
fecha: new Date(o.fecha || Date.now()),
total: Number(o.total || 0)
}

})

}


/* =========================
AGRUPAR INGRESOS POR DÍA
========================= */

agruparPorDia(){

let mapa = {}

this.historial.forEach(o=>{

const dia = o.fecha.toISOString().split("T")[0]

if(!mapa[dia]){
mapa[dia] = 0
}

mapa[dia] += o.total

})

return mapa

}


/* =========================
PROMEDIO DIARIO
========================= */

calcularPromedio(){

const dias = this.agruparPorDia()

const valores = Object.values(dias)

if(valores.length === 0) return 0

const suma = valores.reduce((a,b)=>a+b,0)

return suma / valores.length

}


/* =========================
PREDICCIÓN 30 DÍAS
========================= */

predecir30Dias(){

const promedio = this.calcularPromedio()

return Math.round(promedio * 30)

}


/* =========================
TENDENCIA
========================= */

analizarTendencia(){

const dias = this.agruparPorDia()

const valores = Object.values(dias)

if(valores.length < 6){
return "datos_insuficientes"
}

const primeraMitad = valores.slice(0,Math.floor(valores.length/2))
const segundaMitad = valores.slice(Math.floor(valores.length/2))

const avg1 = primeraMitad.reduce((a,b)=>a+b,0)/primeraMitad.length
const avg2 = segundaMitad.reduce((a,b)=>a+b,0)/segundaMitad.length

if(avg2 > avg1) return "creciendo"

if(avg2 < avg1) return "bajando"

return "estable"

}


/* =========================
REPORTE COMPLETO
========================= */

generarReporte(){

const prediccion = this.predecir30Dias()

const tendencia = this.analizarTendencia()

return {

prediccionMensual: prediccion,

tendencia: tendencia,

mensaje: this.generarMensaje(prediccion,tendencia)

}

}


/* =========================
MENSAJE IA
========================= */

generarMensaje(prediccion,tendencia){

if(tendencia === "creciendo"){
return "El taller muestra tendencia de crecimiento"
}

if(tendencia === "bajando"){
return "Advertencia: los ingresos están bajando"
}

return "El negocio se mantiene estable"

}

}