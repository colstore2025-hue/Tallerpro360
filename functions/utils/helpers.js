// /utils/helpers.js
/************************************************
 * TallerPRO360 · Helpers y utilidades
 ************************************************/

const admin = require("firebase-admin");

/**
 * 🔹 Genera un consecutivo único
 * @param {string} prefijo - Prefijo del consecutivo (ORD, FAC, MOV, etc.)
 * @returns {string} consecutivo único
 */
function generarConsecutivo(prefijo = "ORD") {
  const timestamp = Date.now(); // milisegundos desde 1970
  const random = Math.floor(Math.random() * 1000); // añadir aleatorio para evitar colisiones
  return `${prefijo}-${timestamp}-${random}`;
}

/**
 * 🔹 Calcula subtotal, IVA y total de un arreglo de items
 * @param {Array} items - [{ precio: number, cantidad: number }]
 * @param {number} porcentajeIVA - Porcentaje de IVA (default 19%)
 * @returns {Object} { subtotal, iva, total }
 */
function calcularTotales(items = [], porcentajeIVA = 0.19) {
  let subtotal = 0;

  items.forEach(item => {
    const precio = Number(item.precio) || 0;
    const cantidad = Number(item.cantidad) || 0;
    subtotal += precio * cantidad;
  });

  const iva = subtotal * porcentajeIVA;
  const total = subtotal + iva;

  return { subtotal, iva, total };
}

/**
 * 🔹 Timestamp actual compatible con Firestore
 * @returns {FirebaseFirestore.Timestamp}
 */
function timestamp() {
  return admin.firestore.Timestamp.now();
}

module.exports = {
  generarConsecutivo,
  calcularTotales,
  timestamp
};