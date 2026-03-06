export async function detectarRepuestos(descripcion){

const texto = descripcion.toLowerCase();

let repuestos = [];
let acciones = [];
let diagnostico = "Diagnóstico preliminar generado por IA.";

if(texto.includes("freno")){

repuestos.push("Pastillas de freno");

acciones.push({
nombre:"Revisión sistema de frenos",
costo:40000
});

}

if(texto.includes("bateria") || texto.includes("batería")){

repuestos.push("Batería");

acciones.push({
nombre:"Revisión sistema eléctrico",
costo:30000
});

}

if(texto.includes("aceite")){

repuestos.push("Aceite motor");

acciones.push({
nombre:"Cambio de aceite",
costo:50000
});

}

if(acciones.length === 0){

acciones.push({
nombre:"Diagnóstico general",
costo:30000
});

}

return{
diagnostico,
repuestos,
acciones
};

}