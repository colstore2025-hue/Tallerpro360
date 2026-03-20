/**
 * pricingOptimizerAI.js
 * Motor de precios inteligente PRO360
 */

export function calcularPrecioInteligente({

  costoRepuestos = 0,
  horasTrabajo = 1,
  tipoCliente = "normal",
  tipoTrabajo = "general",
  urgencia = "normal"

}){

  /* =========================
  VALOR BASE POR HORA
  ========================= */
  let valorHora = 60000;

  if(tipoTrabajo === "especializado") valorHora = 80000;
  if(tipoTrabajo === "diagnostico") valorHora = 50000;

  /* =========================
  MARGEN BASE
  ========================= */
  let margen = 0.45;

  switch(tipoCliente){

    case "vip": margen = 0.40; break;
    case "empresa": margen = 0.35; break;
    case "flota": margen = 0.30; break;

  }

  /* =========================
  AJUSTE POR URGENCIA
  ========================= */
  if(urgencia === "alta") margen += 0.10;
  if(urgencia === "media") margen += 0.05;

  /* =========================
  MANO DE OBRA
  ========================= */
  const manoObra = horasTrabajo * valorHora;

  /* =========================
  SUBTOTAL
  ========================= */
  let subtotal = costoRepuestos + manoObra;

  /* =========================
  TOTAL CON MARGEN
  ========================= */
  let total = subtotal * (1 + margen);

  /* =========================
  PRECIO MÍNIMO
  ========================= */
  if(total < 30000){
    total = 30000;
  }

  /* =========================
  REDONDEO COMERCIAL
  ========================= */
  total = Math.round(total / 1000) * 1000;

  /* =========================
  RETORNO COMPLETO (🔥 NUEVO)
  ========================= */
  return {
    total,
    detalle: {
      costoRepuestos,
      manoObra,
      horasTrabajo,
      valorHora,
      margen,
      tipoCliente,
      tipoTrabajo,
      urgencia
    }
  };

}