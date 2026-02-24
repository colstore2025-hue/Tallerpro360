// modules/planes.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { PLANES } = require("../utils/constants");

exports.actualizarPlan = functions.https.onCall(async (data, context) => {

  const { empresaId, nuevoPlan } = data;
  const db = admin.firestore();

  if (!PLANES[nuevoPlan]) {
    throw new Error("Plan no válido");
  }

  const empresaRef = db.collection("empresas").doc(empresaId);

  await empresaRef.update({
    plan: {
      tipo: nuevoPlan,
      estado: "activo",
      fechaInicio: admin.firestore.Timestamp.now()
    },
    limites: {
      sucursales: PLANES[nuevoPlan].sucursales,
      ordenesMes: PLANES[nuevoPlan].ordenesMes
    },
    configuracion: {
      facturacionElectronica: PLANES[nuevoPlan].facturacionElectronica,
      contabilidadAvanzada: PLANES[nuevoPlan].contabilidadAvanzada
    }
  });

  return { success: true };
});