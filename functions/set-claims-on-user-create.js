const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.setClaimsOnUserCreate = functions.firestore
  .document("empresas/{empresaId}/usuarios/{uid}")
  .onCreate(async (snap, context) => {

    const data = snap.data();
    const { empresaId, uid } = context.params;

    try {
      await admin.auth().setCustomUserClaims(uid, {
        empresaId: empresaId,
        rol: data.rol || "empleado",
        activo: data.activo === true,
        planActivo: true
      });

      console.log("Claims asignados correctamente");

    } catch (error) {
      console.error("Error asignando claims:", error);
    }
  });