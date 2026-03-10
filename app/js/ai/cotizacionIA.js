// app/js/ai/cotizacionIA.js

import { diagnosticarVehiculo } from "./motorIAglobal.js";


export async function generarCotizacionIA(descripcionFalla){

try{

const resultado = await diagnosticarVehiculo(descripcionFalla);

if(!resultado){
return null;
}

const repuestos = resultado.repuestos || [];

let totalEstimado = 0;

const lista = repuestos.map(r=>{

let precio = 0;

switch(r.prioridad){

case "alta":
precio = 120000;
break;

case "media":
precio = 70000;
break;

case "baja":
precio = 30000;
break;

default:
precio = 50000;

}

totalEstimado += precio;

return{

nombre: r.nombre || "Repuesto",
precio

}

});


return{

diagnostico: resultado.diagnostico || "",
repuestos: lista,
totalEstimado

};

}catch(error){

console.error("Error generando cotización IA",error);

return null;

}

}