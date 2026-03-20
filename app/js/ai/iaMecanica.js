/**
 * iaMecanica.js
 * Motor de diagnóstico IA
 * PRO360 · Versión estable compatible
 */

/* ===============================
FUNCIÓN PRINCIPAL COMPATIBLE
=============================== */

export async function diagnosticarProblema(descripcion){

  const res = await detectarRepuestos(descripcion);

  // 🔥 Convertir a texto usable por UI
  let texto = `🔧 ${res.diagnostico}\n\n`;

  if(res.repuestos?.length){
    texto += "🧩 Repuestos sugeridos:\n";
    res.repuestos.forEach(r=>{
      texto += `- ${r.nombre} (${r.prioridad})\n`;
    });
    texto += "\n";
  }

  if(res.acciones?.length){
    texto += "⚙️ Acciones recomendadas:\n";
    res.acciones.forEach(a=>{
      texto += `- ${a}\n`;
    });
  }

  return texto;
}


/* ===============================
FUNCIÓN ORIGINAL (NO SE TOCA)
=============================== */

export async function detectarRepuestos(descripcion){

  if(!descripcion || descripcion.trim().length < 5){
    console.warn("⚠️ Descripción inválida para diagnóstico IA");

    return {
      diagnostico:"Descripción insuficiente para análisis",
      repuestos:[],
      acciones:[]
    };
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
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({prompt})
    });

    if(!respuesta.ok){
      throw new Error(`API IA respondió ${respuesta.status}`);
    }

    const data = await respuesta.json();

    if(!data || typeof data !== "object"){
      throw new Error("Respuesta IA inválida");
    }

    return {
      diagnostico:data.diagnostico || "Diagnóstico no disponible",
      repuestos:data.repuestos || [],
      acciones:data.acciones || []
    };

  } catch(error){

    console.error("❌ Error IA repuestos:",error);

    return {
      diagnostico:"No se pudo generar diagnóstico IA",
      repuestos:[],
      acciones:[]
    };
  }
}