// autoManagerAI.js
// IA CEO para talleres

export function analizarOperacion(ordenes){

let totalIngresos = 0;
let totalCostos = 0;

const tecnicos={};

ordenes.forEach(o=>{

totalIngresos += o.precio;
totalCostos += o.costo;

if(!tecnicos[o.tecnico]){

tecnicos[o.tecnico]={
trabajos:0,
horas:0
}

}

tecnicos[o.tecnico].trabajos++;
tecnicos[o.tecnico].horas += o.horas;

});

const margen = totalIngresos - totalCostos;

const rendimientoTecnicos = Object.keys(tecnicos).map(t=>{

return{

tecnico:t,
eficiencia: tecnicos[t].trabajos / tecnicos[t].horas

}

});

return{

ingresos:totalIngresos,
costos:totalCostos,
ganancia:margen,
tecnicos:rendimientoTecnicos

}

}