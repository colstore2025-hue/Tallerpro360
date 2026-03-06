/**
 * autoRepairBrain.js
 * TallerPRO360
 * Cerebro IA de diagnóstico automotriz
 */

import { sugerirSolucion } from "./globalWorkshopLearning.js";
import { detectarRepuestos } from "./iaMecanica.js";
import { calcularPrecioInteligente } from "./pricingAI.js";


/* ===============================
ANALIZAR FALLA COMPLETA
=============================== */

export async function analizarFallaCompleta(descripcion, horasTrabajo=2){

if(!descripcion){
throw new Error("Debe ingresar una descripción de la falla");
}

try{

/* ===============================
1️⃣ CONSULTAR IA GLOBAL
=============================== */

const conocimientoGlobal = sugerirSolucion(descripcion);


/* ===============================
2️⃣ CONSULTAR IA MECÁNICA
=============================== */

const iaLocal = await detectarRepuestos(descripcion);


/* ===============================
3️⃣ REPUESTOS COMBINADOS
=============================== */

const repuestos = new Set();

if(iaLocal?.repuestos){

iaLocal.repuestos.forEach(r=>{
repuestos.add(r.nombre || r);
});

}

if(conocimientoGlobal?.repuestosRecomendados){

conocimientoGlobal.repuestosRecomendados.forEach(r=>{
repuestos.add(r);
});

}

const listaRepuestos = Array.from(repuestos);


/* ===============================
4️⃣ ACCIONES DE REPARACIÓN
=============================== */

const acciones = [];

if(iaLocal?.acciones){

iaLocal.acciones.forEach(a=>acciones.push(a));

}

if(conocimientoGlobal?.accionesRecomendadas){

conocimientoGlobal.accionesRecomendadas.forEach(a=>acciones.push(a));

}


/* ===============================
5️⃣ COSTO ESTIMADO
=============================== */

const costoRepuestosEstimado = listaRepuestos.length * 45000;

const precioSugerido = calcularPrecioInteligente(
costoRepuestosEstimado,
horasTrabajo
);


/* ===============================
6️⃣ TIEMPO ESTIMADO
=============================== */

const tiempoEstimado = Math.max(
1,
Math.round(listaRepuestos.length * 0.6 + horasTrabajo)
);


/* ===============================
RESULTADO FINAL
=============================== */

return {

diagnostico:

iaLocal?.diagnostico ||
conocimientoGlobal?.falla ||
"Revisión mecánica general recomendada",

repuestos: listaRepuestos,

acciones: acciones,

precioEstimado: precioSugerido,

tiempoHoras: tiempoEstimado,

nivelConfianza:

conocimientoGlobal
? "alto"
: "medio"

};

}
catch(e){

console.error("Error en AutoRepairBrain:",e);

return {

diagnostico:"Diagnóstico no disponible",
repuestos:[],
acciones:[],
precioEstimado:0,
tiempoHoras:0,
nivelConfianza:"bajo"

};

}

}