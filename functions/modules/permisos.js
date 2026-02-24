// modules/permisos.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.verificarPermiso = functions.https.onCall(async (data, context) => {

  const { empresaId, permiso } = data;
  const uid = context.auth.uid;
  const db = admin.firestore();

  const userDoc = await db
    .collection("empresas")
    .doc(empresaId)
    .collection("usuarios")
    .doc(uid)
    .get();

  if (!userDoc.exists) {
    throw new Error("Usuario no pertenece a la empresa");
  }

  const rol = userDoc.data().rol;

  if (rol === "dueno" || rol === "admin") {
    return { permitido: true };
  }

  return { permitido: false };
});
