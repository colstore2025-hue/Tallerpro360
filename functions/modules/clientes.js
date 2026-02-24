const functions = require("firebase-functions");
const admin = require("firebase-admin");

const {
  validarUsuario,
  obtenerUsuarioEmpresa,
  validarPermiso
} = require("../utils/seguridad");

const db = admin.firestore();

/**
 * Crear cliente
 */
exports.crearCliente = functions.https.onCall(async (data, context) => {

  const uid = await validarUsuario(context);
  const { empresaId, sucursalId, cliente } = data;

  const usuario = await obtenerUsuarioEmpresa(empresaId, uid);
  await validarPermiso(empresaId, usuario.rol, "crearCliente");

  const clienteRef = db
    .collection("empresas")
    .doc(empresaId)
    .collection("sucursales")
    .doc(sucursalId)
    .collection("clientes")
    .doc();

  await clienteRef.set({
    ...cliente,
    creadoPor: uid,
    creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    estado: "activo"
  });

  return { ok: true, clienteId: clienteRef.id };
});