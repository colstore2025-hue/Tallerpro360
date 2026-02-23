const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {
  validarUsuario,
  obtenerUsuarioEmpresa,
  validarPermiso
} = require("./utils/seguridad");

const db = admin.firestore();

exports.ajustarStock = functions.https.onCall(async (data, context) => {

  const uid = await validarUsuario(context);
  const { empresaId, sucursalId, productoId, cantidad } = data;

  const usuario = await obtenerUsuarioEmpresa(empresaId, uid);
  await validarPermiso(empresaId, usuario.rol, "editarInventario");

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

    tx.update(productoRef, { stock: nuevoStock });

    // 📊 Registrar movimiento
    const movRef = productoRef.collection("movimientos").doc();
    tx.set(movRef, {
      cantidad,
      stockAnterior: stockActual,
      stockNuevo: nuevoStock,
      realizadoPor: uid,
      fecha: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  return { ok: true };
});