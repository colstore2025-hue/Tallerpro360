const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * Registrar movimiento financiero
 * Tipo: ingreso | egreso
 */
exports.crearMovimientoFinanciero = functions.https.onCall(async (data, context) => {

  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "No autenticado");
  }

  const { empresaId, tipo, monto, descripcion } = data;

  if (!empresaId || !tipo || !monto) {
    throw new functions.https.HttpsError("invalid-argument", "Datos incompletos");
  }

  const movimientoRef = db
    .collection("empresas")
    .doc(empresaId)
    .collection("finanzas")
    .doc();

  await movimientoRef.set({
    tipo,
    monto,
    descripcion: descripcion || "",
    creadoPor: context.auth.uid,
    creadoEn: admin.firestore.FieldValue.serverTimestamp()
  });

  return { ok: true };
});