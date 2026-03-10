// app/js/ai/iaMecanica.js
// Motor de diagnóstico IA para TallerPRO360

export async function detectarRepuestos(descripcion){

if(!descripcion || descripcion.trim().length < 5){
throw new Error("Descripción de falla inválida");
}

const prompt = `
Eres un mecánico experto en diagnóstico automotriz.

Analiza la siguiente descripción de falla:

"${descripcion}"

Devuelve SOLO JSON válido con esta estructura:

{
"diagnostico":"explicación corta del problema",
"repuestos":[
{"nombre":"","prioridad":"alta"},
{"nombre":"","prioridad":"media"}
],
"acciones":[
"acción recomendada 1",
"acción recomendada 2"
]
}

No agregues texto fuera del JSON.
`;

try{

const respuesta = await fetch("/api/diagnosticoIA",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
prompt
})
});

if(!respuesta.ok){
throw new Error("Error en API IA");
}

const data = await respuesta.json();

return data;

}catch(error){

console.error("Error IA repuestos:",error);

return{
diagnostico:"No se pudo generar diagnóstico IA",
repuestos:[],
acciones:[]
};

}

}