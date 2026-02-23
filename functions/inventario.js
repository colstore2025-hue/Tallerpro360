const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * Crear producto en inventario
 */
exports.crearProducto = functions.https.onCall(async (data, context) => {

  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "No autenticado");
  }

  const { empresaId, sucursalId, nombre, stockInicial } = data;

  if (!empresaId || !sucursalId || !nombre) {
    throw new functions.https.HttpsError("invalid-argument", "Datos incompletos");
  }

  const productoRef = db
    .collection("empresas")
    .doc(empresaId)
    .collection("sucursales")
    .doc(sucursalId)
    .collection("inventario")
    .doc();

  await productoRef.set({
    nombre,
    stock: stockInicial || 0,
    creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    creadoPor: context.auth.uid
  });

  return { ok: true };
});

/**
 * Ajustar stock
 */
exports.ajustarStock = functions.https.onCall(async (data, context) => {

  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "No autenticado");
  }

  const { empresaId, sucursalId, productoId, cantidad } = data;

  const productoRef = db
    .collection("empresas")
    .doc(empresaId)
    .collection("sucursales")
    .doc(sucursalId)
    .collection("inventario")
    .doc(productoId);

  await db.runTransaction(async (tx) => {

    const snap = await tx.get(productoRef);

    if (!snap.exists) {
      throw new functions.https.HttpsError("not-found", "Producto no encontrado");
    }

    const stockActual = snap.data().stock || 0;
    const nuevoStock = stockActual + cantidad;

    if (nuevoStock < 0) {
      throw new functions.https.HttpsError("failed-precondition", "Stock insuficiente");
    }

    tx.update(productoRef, {
      stock: nuevoStock
    });

  });

  return { ok: true };
});