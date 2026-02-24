// modules/finanzas.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.registrarIngreso = functions.https.onCall(async (data) => {

  const { empresaId, sucursalId, monto, referencia } = data;
  const db = admin.firestore();

  await db
    .collection("empresas")
    .doc(empresaId)
    .collection("sucursales")
    .doc(sucursalId)
    .collection("movimientosFinancieros")
    .add({
      tipo: "ingreso",
      monto,
      referencia,
      fecha: admin.firestore.FieldValue.serverTimestamp()
    });

  return { success: true };
});