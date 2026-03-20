// app/js/ai/ceoEngine.js

import { analizarRentabilidad } from "./motorIAglobal.js";

export async function analisisCEO(data){
  return await analizarRentabilidad(data);
}