const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * Activar plan premium
 */
exports.activarPlan = functions.https.onCall(async (data, context) => {

  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "No autenticado");
  }

  const { empresaId, tipoPlan } = data;

  await db.collection("empresas").doc(empresaId).update({
    plan: {
      tipo: tipoPlan,
      estado: "activo",
      fechaInicio: admin.firestore.FieldValue.serverTimestamp()
    }
  });

  return { ok: true };
});