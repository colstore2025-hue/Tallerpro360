const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {
  validarUsuario,
  obtenerUsuarioEmpresa,
  validarPermiso,
  validarLimitePlan
} = require("./utils/seguridad");

const db = admin.firestore();

exports.crearOrden = functions.https.onCall(async (data, context) => {

  const uid = await validarUsuario(context);
  const { empresaId, sucursalId, orden } = data;

  const usuario = await obtenerUsuarioEmpresa(empresaId, uid);

  await validarPermiso(empresaId, usuario.rol, "crearOrden");
  await validarLimitePlan(empresaId, "ordenes");

  const ordenRef = db
    .collection("empresas")
    .doc(empresaId)
    .collection("sucursales")
    .doc(sucursalId)
    .collection("ordenes")
    .doc();

  await ordenRef.set({
    ...orden,
    creadoPor: uid,
    creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    estado: "Ingreso"
  });

  // 📊 Incrementar métricas
  await db.collection("empresas").doc(empresaId).update({
    "metricas.ordenesMes": admin.firestore.FieldValue.increment(1),
    "metricas.ingresosMes": admin.firestore.FieldValue.increment(orden.total || 0)
  });

  return { ok: true };
});