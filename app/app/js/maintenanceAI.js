// maintenanceAI.js

import { sugerirServicios } from "./motorIAglobal.js";

export async function mantenimientoInteligente(vehiculo, km){

const servicios = await sugerirServicios(vehiculo,km);

return servicios;

}