// ceoAI.js

import { analizarRentabilidad } from "./motorIAglobal.js";

export async function analisisCEO(data){

const analisis = await analizarRentabilidad(data);

return analisis;

}