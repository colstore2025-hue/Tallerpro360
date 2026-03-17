/**
 * IA Assistant básico
 */
export async function generarOrdenIA(texto){
  // Simulación simple de IA
  return {
    cliente:{clienteId:"C001"},
    vehiculo:{placa:"ABC123"},
    cotizacion:[{pieza:"Filtro aceite",cantidad:1,preciounitario:50000},{pieza:"Aceite motor",cantidad:5,preciounitario:40000}]
  };
}