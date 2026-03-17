/**
 * Inventario básico
 */
export async function usarRepuesto({repuestoId,cantidad,ordenId}){
  console.log("Usando repuesto:", repuestoId,cantidad,ordenId);
  return true;
}