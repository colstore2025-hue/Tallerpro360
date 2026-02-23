const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * Obtener plan activo de empresa
 */
exports.obtenerPlan = functions.https.onCall(async (data, context) => {

  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "No autenticado");
  }

  const { empresaId } = data;

  const empresaSnap = await db.collection("empresas").doc(empresaId).get();

  if (!empresaSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Empresa no encontrada");
  }

  return empresaSnap.data().plan;
});