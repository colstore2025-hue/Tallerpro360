// cotizacionIA.js

import { diagnosticarVehiculo } from "./motorIAglobal.js";

export async function generarCotizacionIA(descripcionFalla){

try{

const resultado = await diagnosticarVehiculo(descripcionFalla);

const repuestos = resultado.repuestos || [];

let totalEstimado = 0;

const lista = repuestos.map(r=>{

let precio=0;

if(r.prioridad==="alta") precio=120000;
if(r.prioridad==="media") precio=70000;
if(r.prioridad==="baja") precio=30000;

totalEstimado += precio;

return{
nombre:r.nombre,
precio
}

});

return{

diagnostico:resultado.diagnostico,

repuestos:lista,

totalEstimado

};

}catch(error){

console.error("Error generando cotización",error);

return null;

}

}