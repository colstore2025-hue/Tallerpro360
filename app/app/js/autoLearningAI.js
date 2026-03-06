// autoLearningAI.js
// IA de autoaprendizaje para talleres

export class AutoLearningAI {

constructor(){

this.baseConocimiento = [];

}

entrenar(ordenes){

ordenes.forEach(orden => {

const registro = {

vehiculo: orden.vehiculo,
marca: orden.marca,
modelo: orden.modelo,
problema: orden.problema,
repuestos: orden.repuestos,
horas: orden.horas,
costo: orden.costo

};

this.baseConocimiento.push(registro);

});

console.log("IA entrenada con",this.baseConocimiento.length,"registros");

}

predecirProblema(vehiculo,marca,modelo){

const coincidencias = this.baseConocimiento.filter(r =>

r.marca === marca && r.modelo === modelo

);

if(coincidencias.length === 0){

return {
prediccion:"Sin datos suficientes",
probabilidad:0
};

}

const conteo = {};

coincidencias.forEach(c => {

conteo[c.problema] = (conteo[c.problema] || 0) + 1;

});

let problemaProbable = "";
let max = 0;

for(const p in conteo){

if(conteo[p] > max){

max = conteo[p];
problemaProbable = p;

}

}

return {

vehiculo,
marca,
modelo,
prediccion: problemaProbable,
probabilidad: (max / coincidencias.length)

};

}

recomendarRepuestos(problema){

const resultados = this.baseConocimiento.filter(r =>

r.problema === problema

);

const repuestos = {};

resultados.forEach(r => {

r.repuestos.forEach(rep => {

repuestos[rep] = (repuestos[rep] || 0) + 1;

});

});

return Object.keys(repuestos).sort((a,b)=>repuestos[b]-repuestos[a]);

}

}