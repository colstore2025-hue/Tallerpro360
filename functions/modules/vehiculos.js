const functions = require("firebase-functions");
const admin = require("firebase-admin");

const {
  validarUsuario,
  obtenerUsuarioEmpresa,
  validarPermiso
} = require("../utils/seguridad");

const db = admin.firestore();

/**
 * Registrar vehículo
 */
exports.crearVehiculo = functions.https.onCall(async (data, context) => {

  const uid = await validarUsuario(context);
  const { empresaId, sucursalId, vehiculo } = data;

  const usuario = await obtenerUsuarioEmpresa(empresaId, uid);
  await validarPermiso(empresaId, usuario.rol, "crearVehiculo");

  const vehiculoRef = db
    .collection("empresas")
    .doc(empresaId)
    .collection("sucursales")
    .doc(sucursalId)
    .collection("vehiculos")
    .doc();

  await vehiculoRef.set({
    ...vehiculo,
    creadoPor: uid,
    creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    estado: "activo"
  });

  return { ok: true, vehiculoId: vehiculoRef.id };
});