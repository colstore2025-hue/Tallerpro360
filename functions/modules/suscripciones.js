// modules/suscripciones.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.cancelarSuscripcion = functions.https.onCall(async (data) => {

  const { empresaId } = data;
  const db = admin.firestore();

  await db.collection("empresas").doc(empresaId).update({
    "plan.estado": "cancelado"
  });

  return { success: true };
});
