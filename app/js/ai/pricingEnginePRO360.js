/**
 * pricingEnginePRO360.js - Nexus-X V5 🚀
 * Motor de Precios Dinámicos Adaptativo
 */

export function calcularPrecioInteligentePRO360(data, mercadoReferencia = null) {
  const {
    costoRepuestos = 0,
    horasTrabajo = 1,
    tipoVehiculo = "medio", // economico | medio | premium
    tipoTrabajo = "general",
    urgencia = "normal",
    perfilCliente = "normal"
  } = data;

  // Valor hora base ajustado a realidad Colombia (Ibagué/Bogotá)
  let valorHora = 60000; 
  if(tipoVehiculo === "premium") valorHora = 135000; // Ref: Especializados
  if(tipoVehiculo === "economico") valorHora = 45000;

  let costoBase = costoRepuestos + (horasTrabajo * valorHora);
  let factor = 1;

  // Moduladores de Inteligencia de Mercado
  if(urgencia === "urgente") factor += 0.25;
  if(tipoTrabajo === "diagnostico") factor += 0.15; // El conocimiento se cobra
  
  // Moduladores de Perfil de Cliente
  if(perfilCliente === "premium") factor += 0.10;
  if(perfilCliente === "sensible") factor -= 0.10;

  let precioSugerido = Math.round(costoBase * factor);

  // Validación contra Radar de Mercado (Ref: Autolab / C3 Care)
  if (mercadoReferencia) {
    const { min, max } = mercadoReferencia;
    // Si el precio sugerido es menor al min del mercado, lo protegemos
    if (precioSugerido < min) precioSugerido = min;
    // Si excede el máximo, lanzamos una alerta en la UI
  }

  return {
    costoBase,
    precioSugerido,
    margenEstimado: (((precioSugerido - costoBase) / precioSugerido) * 100).toFixed(1) + "%",
    alertaMercado: mercadoReferencia && precioSugerido > mercadoReferencia.max ? "ALTO" : "COMPETITIVO"
  };
}
