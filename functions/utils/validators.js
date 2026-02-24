// utils/validators.js

function validarStock(stockActual, cantidad) {
  if (stockActual < cantidad) {
    throw new Error("Stock insuficiente");
  }
}

function validarLimiteOrdenes(empresa) {
  if (empresa.metricas.ordenesMes >= empresa.limites.ordenesMes) {
    throw new Error("Límite de órdenes alcanzado para el plan actual");
  }
}

function validarPlanActivo(empresa) {
  if (empresa.plan.estado !== "activo") {
    throw new Error("El plan no está activo");
  }
}

module.exports = {
  validarStock,
  validarLimiteOrdenes,
  validarPlanActivo
};