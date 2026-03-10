/**
 * maintenanceAI.js
 * IA de mantenimiento inteligente
 * TallerPRO360
 */

import { sugerirServicios } from "../motorIAglobal.js";


/* ===============================
   MANTENIMIENTO INTELIGENTE
=============================== */

export async function mantenimientoInteligente(vehiculo, km){

  if(!vehiculo){
    console.warn("Vehículo no definido");
    return [];
  }

  try{

    const servicios = await sugerirServicios(vehiculo, km);

    return servicios || [];

  }
  catch(e){

    console.error("Error en mantenimiento inteligente:", e);

    return [];

  }

}