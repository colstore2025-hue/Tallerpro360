// pricingAI.js

export function calcularPrecioInteligente(costoRepuestos, horasTrabajo){

const margen = 0.45;

const manoObra = horasTrabajo * 60000;

const total = (costoRepuestos + manoObra) * (1 + margen);

return Math.round(total);

}