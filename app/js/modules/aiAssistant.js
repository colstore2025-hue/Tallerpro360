/**
 * Simulación IA Avanzada
 */
export async function generarOrdenIA(texto){
  return {
    cliente:{clienteId:"C001"},
    vehiculo:{placa:"ABC123"},
    cotizacion:[
      {pieza:"Filtro aceite",cantidad:1,preciounitario:50000},
      {pieza:"Aceite motor",cantidad:5,preciounitario:40000}
    ]
  };
}
export async function init(){console.log("AI Assistant listo");}