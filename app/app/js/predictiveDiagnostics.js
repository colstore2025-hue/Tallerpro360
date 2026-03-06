// predictiveDiagnostics.js

import { diagnosticarVehiculo } from "./motorIAglobal.js";

export async function predecirFallas(vehiculo, km, sintomas){

const prompt=`

Vehiculo: ${vehiculo}
Kilometraje: ${km}

Síntomas:
${sintomas}

Analiza con experiencia mecánica y devuelve JSON:

{
probables:[
{falla:"",probabilidad:0},
{falla:"",probabilidad:0}
]
}

`;

const resultado = await diagnosticarVehiculo(prompt);

return resultado;

}