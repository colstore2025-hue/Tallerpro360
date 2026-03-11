// /utils/validators.js
/************************************************
 * TallerPRO360 · Validadores Enterprise
 * Funciones helper para validar stock, límites
 * de órdenes y plan activo
 ************************************************/

/**
 * 🔹 Validar stock disponible
 * @param {number} stockActual - Stock disponible en inventario
 * @param {number} cantidad - Cantidad a consumir
 */
function validarStock(stockActual, cantidad) {
  if (typeof stockActual !== "number" || typeof cantidad !== "number") {
    throw new Error("Stock o cantidad inválida");
  }
  if (stockActual < cantidad) {
    throw new Error("Stock insuficiente");
  }
}

/**
 * 🔹 Validar límite de órdenes mensuales según plan
 * @param {object} empresa - Documento empresa de Firestore
 */
function validarLimiteOrdenes(empresa) {
  if (!empresa.metricas || !empresa.limites) return; // Ignorar si no hay métricas definidas
  const ordenesMes = empresa.metricas.ordenesMes || 0;
  const limite = empresa.limites.ordenesMes || 0;

  if (limite > 0 && ordenesMes >= limite) {
    throw new Error("Límite de órdenes alcanzado para el plan actual");
  }
}

/**
 * 🔹 Validar que el plan de la empresa esté activo
 * @param {object} empresa - Documento empresa de Firestore
 */
function validarPlanActivo(empresa) {
  if (!empresa.plan || empresa.plan.estado !== "activo") {
    throw new Error("El plan no está activo");
  }
  // Opcional: validar fecha de vencimiento
  if (empresa.plan.fechaVencimiento) {
    const ahora = new Date();
    const fechaVencimiento = empresa.plan.fechaVencimiento.toDate
      ? empresa.plan.fechaVencimiento.toDate()
      : new Date(empresa.plan.fechaVencimiento);
    if (fechaVencimiento < ahora) {
      throw new Error("El plan ha vencido");
    }
  }
}

module.exports = {
  validarStock,
  validarLimiteOrdenes,
  validarPlanActivo
};