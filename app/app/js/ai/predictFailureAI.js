// predictFailureAI.js
// IA predictiva para mantenimiento preventivo

export class PredictFailureAI {

constructor(){

this.historial = [];

}

entrenar(registros){

registros.forEach(r => {

this.historial.push({

vehiculo: r.vehiculo,
marca: r.marca,
modelo: r.modelo,
anio: r.anio,
kilometraje: r.kilometraje,
pieza: r.pieza,
diasFalla: r.diasFalla

});

});

console.log("Modelo predictivo cargado con",this.historial.length,"datos");

}

predecirProximaFalla(vehiculo){

const datos = this.historial.filter(h =>

h.vehiculo === vehiculo

);

if(datos.length === 0){

return {

prediccion:"Sin historial",
diasEstimados:null

};

}

const piezas = {};

datos.forEach(d => {

if(!piezas[d.pieza]){

piezas[d.pieza] = [];

}

piezas[d.pieza].push(d.diasFalla);

});

let piezaCritica = "";
let menorPromedio = Infinity;

for(const p in piezas){

const promedio = piezas[p].reduce((a,b)=>a+b,0) / piezas[p].length;

if(promedio < menorPromedio){

menorPromedio = promedio;
piezaCritica = p;

}

}

return {

vehiculo,
piezaProbable: piezaCritica,
diasEstimados: Math.round(menorPromedio)

};

}

recomendacionMantenimiento(vehiculo){

const pred = this.predecirProximaFalla(vehiculo);

if(pred.diasEstimados === null){

return "No hay datos suficientes";

}

if(pred.diasEstimados < 30){

return "Revisión urgente de " + pred.piezaProbable;

}

if(pred.diasEstimados < 90){

return "Programar mantenimiento preventivo";

}

return "Vehículo en buen estado";

}

}