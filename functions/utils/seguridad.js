const admin = require("firebase-admin");
const functions = require("firebase-functions");

const db = admin.firestore();

/**
 * Validar autenticación
 */
async function validarUsuario(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "No autenticado");
  }
  return context.auth.uid;
}

/**
 * Obtener usuario interno
 */
async function obtenerUsuarioEmpresa(empresaId, uid) {
  const snap = await db
    .collection("empresas")
    .doc(empresaId)
    .collection("usuarios")
    .doc(uid)
    .get();

  if (!snap.exists) {
    throw new functions.https.HttpsError("permission-denied", "Usuario no pertenece a empresa");
  }

  return snap.data();
}

/**
 * Validar permiso dinámico
 */
async function validarPermiso(empresaId, rol, permiso) {
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

  if (permisos[permiso] !== true) {
    throw new functions.https.HttpsError("permission-denied", "No tiene permiso");
  }
}

/**
 * Validar plan y límites
 */
async function validarLimitePlan(empresaId, tipo) {

  const empresaSnap = await db.collection("empresas").doc(empresaId).get();
  const empresa = empresaSnap.data();

  if (!empresa.plan || empresa.plan.estado !== "activo") {
    throw new functions.https.HttpsError("failed-precondition", "Plan inactivo");
  }

  if (tipo === "ordenes") {
    if (empresa.metricas.ordenesMes >= empresa.plan.limiteOrdenes) {
      throw new functions.https.HttpsError("resource-exhausted", "Límite de órdenes alcanzado");
    }
  }
}

module.exports = {
  validarUsuario,
  obtenerUsuarioEmpresa,
  validarPermiso,
  validarLimitePlan
};