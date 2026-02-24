/************************************************
 * TallerPRO360 · Módulo Órdenes
 * Crear Orden + Métricas + Contabilidad
 ************************************************/

const functions = require("firebase-functions");
const admin = require("firebase-admin");

const {
  validarUsuario,
  obtenerUsuarioEmpresa,
  validarPermiso,
  validarLimitePlan
} = require("../utils/seguridad");

const {
  generarConsecutivo,
  calcularTotales
} = require("../utils/helpers");

const { registrarAsiento } = require("./contabilidad");

const db = admin.firestore();

exports.crearOrden = functions.https.onCall(async (data, context) => {

  try {

    // =====================================
    // 🔐 VALIDAR USUARIO
    // =====================================

    const uid = await validarUsuario(context);

    const { empresaId, sucursalId, orden } = data;

    if (!empresaId || !sucursalId || !orden) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Datos incompletos"
      );
    }

    if (!orden.items || !Array.isArray(orden.items) || orden.items.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "La orden debe tener al menos un item"
      );
    }

    const usuario = await obtenerUsuarioEmpresa(empresaId, uid);

    await validarPermiso(empresaId, usuario.rol, "crearOrden");
    await validarLimitePlan(empresaId, "ordenes");

    // =====================================
    // 📊 CALCULAR TOTALES EN BACKEND
    // =====================================

    const { subtotal, iva, total } = calcularTotales(orden.items);

    const consecutivo = generarConsecutivo("ORD");

    const ordenRef = db
      .collection("empresas")
      .doc(empresaId)
      .collection("sucursales")
      .doc(sucursalId)
      .collection("ordenes")
      .doc();

    // =====================================
    // 🔄 TRANSACCIÓN PARA SEGURIDAD
    // =====================================

    await db.runTransaction(async (transaction) => {

      transaction.set(ordenRef, {
        ...orden,
        consecutivo,
        subtotal,
        iva,
        total,
        creadoPor: uid,
        creadoEn: admin.firestore.FieldValue.serverTimestamp(),
        estado: "Ingreso"
      });

      const empresaRef = db.collection("empresas").doc(empresaId);

      transaction.update(empresaRef, {
        "metricas.ordenesMes": admin.firestore.FieldValue.increment(1),
        "metricas.ingresosMes": admin.firestore.FieldValue.increment(total)
      });

    });

    // =====================================
    // 📘 CONTABILIDAD AUTOMÁTICA (si aplica)
    // =====================================

    const empresaDoc = await db.collection("empresas").doc(empresaId).get();
    const empresa = empresaDoc.data();

    if (empresa.configuracion?.contabilidadAvanzada) {

      await registrarAsiento({
        empresaId,
        tipo: "orden",
        referenciaId: ordenRef.id,
        creadoPor: uid,
        movimientos: [
          {
            cuenta: "1305", // Clientes
            debe: total,
            haber: 0
          },
          {
            cuenta: "4135", // Ingresos servicios
            debe: 0,
            haber: subtotal
          },
          {
            cuenta: "2408", // IVA por pagar
            debe: 0,
            haber: iva
          }
        ]
      });

    }

    return {
      ok: true,
      ordenId: ordenRef.id,
      consecutivo
    };

  } catch (error) {

    console.error("Error creando orden:", error);

    throw new functions.https.HttpsError(
      error.code || "internal",
      error.message || "Error interno al crear orden"
    );
  }

});