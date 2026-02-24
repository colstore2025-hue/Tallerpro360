/************************************************
 * TallerPRO360 · Seguridad Enterprise
 ************************************************/

const admin = require("firebase-admin");
const functions = require("firebase-functions");

const db = admin.firestore();

/**
 * 🔐 Validar autenticación
 */
async function validarUsuario(context) {

  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Usuario no autenticado"
    );
  }

  return context.auth.uid;
}

/**
 * 👤 Obtener usuario interno de empresa
 */
async function obtenerUsuarioEmpresa(empresaId, uid) {

  const empresaRef = db.collection("empresas").doc(empresaId);
  const empresaSnap = await empresaRef.get();

  if (!empresaSnap.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "Empresa no encontrada"
    );
  }

  const usuarioSnap = await empresaRef
    .collection("usuarios")
    .doc(uid)
    .get();

  if (!usuarioSnap.exists) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Usuario no pertenece a la empresa"
    );
  }

  const usuario = usuarioSnap.data();

  if (!usuario.activo) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Usuario deshabilitado"
    );
  }

  return usuario;
}

/**
 * 🛡 Validar permiso dinámico por rol
 */
async function validarPermiso(empresaId, rol, permiso) {

  const rolSnap = await db
    .collection("empresas")
    .doc(empresaId)
    .collection("roles")
    .doc(rol)
    .get();

  if (!rolSnap.exists) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Rol no configurado"
    );
  }

  const permisos = rolSnap.data().permisos || {};

  if (permisos[permiso] !== true) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "No tiene permiso para esta acción"
    );
  }
}

/**
 * 📦 Validar plan activo y límites
 */
async function validarLimitePlan(empresaId, tipo) {

  const empresaSnap = await db.collection("empresas").doc(empresaId).get();

  if (!empresaSnap.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "Empresa no encontrada"
    );
  }

  const empresa = empresaSnap.data();

  // 🔹 Validar estado plan
  if (!empresa.plan || empresa.plan.estado !== "activo") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Plan inactivo"
    );
  }

  // 🔹 Validar vencimiento
  if (empresa.plan.fechaVencimiento) {
    const ahora = admin.firestore.Timestamp.now();

    if (empresa.plan.fechaVencimiento.seconds < ahora.seconds) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Plan vencido"
      );
    }
  }

  // 🔹 Validar límites dinámicos
  if (tipo === "ordenes") {

    const ordenesMes = empresa.metricas?.ordenesMes || 0;
    const limite = empresa.limites?.ordenesMes || 0;

    if (limite > 0 && ordenesMes >= limite) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Límite mensual de órdenes alcanzado"
      );
    }
  }

  if (tipo === "sucursales") {

    const limite = empresa.limites?.sucursales || 1;

    const sucursalesSnap = await db
      .collection("empresas")
      .doc(empresaId)
      .collection("sucursales")
      .get();

    if (sucursalesSnap.size >= limite) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Límite de sucursales alcanzado"
      );
    }
  }
}

module.exports = {
  validarUsuario,
  obtenerUsuarioEmpresa,
  validarPermiso,
  validarLimitePlan
};