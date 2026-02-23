const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * Verificar permiso dinámico
 */
exports.verificarPermiso = functions.https.onCall(async (data, context) => {

  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "No autenticado");
  }

  const { empresaId, permiso } = data;

  const userSnap = await db
    .collection("empresas")
    .doc(empresaId)
    .collection("usuarios")
    .doc(context.auth.uid)
    .get();

  if (!userSnap.exists) {
    throw new functions.https.HttpsError("permission-denied", "Usuario no pertenece a empresa");
  }

  const rol = userSnap.data().rol;

  const rolSnap = await db
    .collection("empresas")
    .doc(empresaId)
    .collection("roles")
    .doc(rol)
    .get();

  if (!rolSnap.exists) {
    throw new functions.https.HttpsError("permission-denied", "Rol no configurado");
  }

  const permisos = rolSnap.data().permisos || {};

  return {
    permitido: permisos[permiso] === true
  };
});