const functions = require("firebase-functions");
const admin = require("firebase-admin");

const {
  validarUsuario,
  obtenerUsuarioEmpresa,
  validarPermiso
} = require("../utils/seguridad");

const db = admin.firestore();

/**
 * Registrar movimiento financiero
 */
exports.registrarMovimiento = functions.https.onCall(async (data, context) => {

  const uid = await validarUsuario(context);
  const { empresaId, sucursalId, tipo, monto, referencia } = data;

  if (!["ingreso", "egreso"].includes(tipo)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Tipo de movimiento inválido"
    );
  }

  const usuario = await obtenerUsuarioEmpresa(empresaId, uid);
  await validarPermiso(empresaId, usuario.rol, "registrarMovimiento");

  const movimientoRef = db
    .collection("empresas")
    .doc(empresaId)
    .collection("sucursales")
    .doc(sucursalId)
    .collection("movimientosFinancieros")
    .doc();

  await movimientoRef.set({
    tipo,
    monto,
    referencia: referencia || "",
    creadoPor: uid,
    fecha: admin.firestore.FieldValue.serverTimestamp()
  });

  // Actualizar métricas financieras
  const empresaRef = db.collection("empresas").doc(empresaId);

  if (tipo === "ingreso") {
    await empresaRef.update({
      "metricas.ingresosMes": admin.firestore.FieldValue.increment(monto)
    });
  } else {
    await empresaRef.update({
      "metricas.egresosMes": admin.firestore.FieldValue.increment(monto)
    });
  }

  return { ok: true };
});