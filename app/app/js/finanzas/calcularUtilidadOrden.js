/**
 * Calcula la utilidad de una orden.
 * @param {Object} orden - Orden con sus acciones y costos.
 * @returns {Object} - Objeto con costo total, venta total, utilidad y margen %
 */
export function calcularUtilidadOrden(orden) {
  let costoTotal = 0;
  let ventaTotal = 0;

  // Recorrer todas las acciones de la orden
  orden.acciones.forEach(a => {
    costoTotal += Number(a.costoInterno || 0);
    ventaTotal += Number(a.costo || 0);
  });

  const utilidad = ventaTotal - costoTotal;

  return {
    costo: costoTotal,
    venta: ventaTotal,
    utilidad: utilidad,
    margen: ventaTotal ? ((utilidad / ventaTotal) * 100).toFixed(2) : 0
  };
}