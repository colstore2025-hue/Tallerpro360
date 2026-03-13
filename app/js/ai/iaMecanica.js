/**
 * iaMecanica.js
 * Motor de diagnóstico IA
 * TallerPRO360 ERP
 */

export async function detectarRepuestos(descripcion){

/* ===============================
VALIDACIÓN
=============================== */

if(!descripcion || descripcion.trim().length < 5){

console.warn("⚠️ Descripción inválida para diagnóstico IA");

return {
diagnostico:"Descripción insuficiente para análisis",
repuestos:[],
acciones:[]
};

}


/* ===============================
PROMPT IA
=============================== */

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


/* ===============================
LLAMADA API IA
=============================== */

try{

const respuesta = await fetch("/api/diagnosticoIA",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({prompt})

});


if(!respuesta.ok){

throw new Error(`API IA respondió ${respuesta.status}`);

}


/* ===============================
PARSEAR RESPUESTA
=============================== */

const data = await respuesta.json();


/* ===============================
VALIDAR JSON
=============================== */

if(!data || typeof data !== "object"){

throw new Error("Respuesta IA inválida");

}

return {
diagnostico:data.diagnostico || "Diagnóstico no disponible",
repuestos:data.repuestos || [],
acciones:data.acciones || []
};


}catch(error){

console.error("❌ Error IA repuestos:",error);

return {
diagnostico:"No se pudo generar diagnóstico IA",
repuestos:[],
acciones:[]
};

}

}