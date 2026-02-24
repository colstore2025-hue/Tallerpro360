// utils/helpers.js

const admin = require("firebase-admin");

function generarConsecutivo(prefijo = "ORD") {
  const numero = Date.now();
  return `${prefijo}-${numero}`;
}

function calcularTotales(items) {
  let subtotal = 0;

  items.forEach(item => {
    subtotal += item.precio * item.cantidad;
  });

  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  return { subtotal, iva, total };
}

function timestamp() {
  return admin.firestore.Timestamp.now();
}

module.exports = {
  generarConsecutivo,
  calcularTotales,
  timestamp
};