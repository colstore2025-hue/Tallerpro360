/**
 * predictiveDiagnostics.js
 * TallerPRO360 ERP
 * IA de diagnóstico predictivo de fallas
 */

import { diagnosticarVehiculo } from "./motorIAglobal.js";


/* ===============================
PREDICCIÓN DE FALLAS
=============================== */

export async function predecirFallas(vehiculo, km, sintomas){

  if(!vehiculo || !sintomas){

    console.warn("Datos insuficientes para diagnóstico");

    return null;

  }

  const prompt = `
Eres un mecánico experto en diagnóstico automotriz.

Analiza el siguiente caso:

Vehículo: ${vehiculo}
Kilometraje: ${km}

Síntomas reportados:
${sintomas}

Devuelve SOLO JSON válido con esta estructura:

{
  "probables":[
    {"falla":"", "probabilidad":0},
    {"falla":"", "probabilidad":0}
  ]
}

No agregues texto fuera del JSON.
`;

  try{

    const resultado = await diagnosticarVehiculo(prompt);

    return resultado;

  }
  catch(error){

    console.error("Error en diagnóstico predictivo:", error);

    return {
      probables: []
    };

  }

}