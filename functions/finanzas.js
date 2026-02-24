/************************************************
 * TallerPRO360 · Módulo Finanzas ENTERPRISE
 ************************************************/

const functions = require("firebase-functions");
const admin = require("firebase-admin");

const {
  validarUsuario,
  obtenerUsuarioEmpresa,
  validarPermiso
} = require("../utils/seguridad");

const db = admin.firestore();

/**
 * 🔹 Registrar Ingreso Manual (Seguro)
 * Para ingresos que NO provienen de órdenes
 */
exports.registrarIngreso = functions.https.onCall(async (data, context) => {

  try {

    // =====================================
    // 🔐 VALIDAR USUARIO
    // =====================================

    const uid = await validarUsuario(context);

    const { empresaId, sucursalId, monto, referencia } = data;

    if (!empresaId || !sucursalId || !monto) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Datos incompletos"
      );
    }

    if (monto <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "El monto debe ser mayor a 0"
      );
    }

    const usuario = await obtenerUsuarioEmpresa(empresaId, uid);
    await validarPermiso(empresaId, usuario.rol, "registrarIngreso");

    const empresaRef = db.collection("empresas").doc(empresaId);
    const sucursalRef = empresaRef.collection("sucursales").doc(sucursalId);

    const empresaSnap = await empresaRef.get();

    if (!empresaSnap.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Empresa no encontrada"
      );
    }

    // =====================================
    // 🔄 TRANSACCIÓN SEGURA
    // =====================================

    await db.runTransaction(async (transaction) => {

      const movimientoRef = sucursalRef
        .collection("movimientosFinancieros")
        .doc();

      transaction.set(movimientoRef, {
        tipo: "ingreso",
        monto,
        referencia: referencia || "Ingreso manual",
        creadoPor: uid,
        creadoEn: admin.firestore.FieldValue.serverTimestamp()
      });

      // Actualizar métricas reales
      transaction.update(empresaRef, {
        "metricas.ingresosMes": admin.firestore.FieldValue.increment(monto)
      });

    });

    return { ok: true };

  } catch (error) {

    console.error("Error registrando ingreso:", error);

    throw new functions.https.HttpsError(
      error.code || "internal",
      error.message || "Error interno al registrar ingreso"
    );
  }

});


/**
 * 🔹 Registrar Pago de Orden (Flujo de Caja Real)
 */
exports.registrarPagoOrden = functions.https.onCall(async (data, context) => {

  try {

    const uid = await validarUsuario(context);

    const { empresaId, sucursalId, ordenId, monto } = data;

    if (!empresaId || !sucursalId || !ordenId || !monto) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Datos incompletos"
      );
    }

    if (monto <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Monto inválido"
      );
    }

    const usuario = await obtenerUsuarioEmpresa(empresaId, uid);
    await validarPermiso(empresaId, usuario.rol, "registrarPago");

    const empresaRef = db.collection("empresas").doc(empresaId);
    const ordenRef = empresaRef
      .collection("sucursales")
      .doc(sucursalId)
      .collection("ordenes")
      .doc(ordenId);

    await db.runTransaction(async (transaction) => {

      const ordenSnap = await transaction.get(ordenRef);

      if (!ordenSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Orden no encontrada"
        );
      }

      const orden = ordenSnap.data();

      const nuevoPagado = (orden.pagado || 0) + monto;
      const nuevoSaldo = orden.total - nuevoPagado;

      if (nuevoSaldo < 0) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "El pago excede el total de la orden"
        );
      }

      // Actualizar orden
      transaction.update(ordenRef, {
        pagado: nuevoPagado,
        saldo: nuevoSaldo,
        ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      });

      // Registrar movimiento en orden
      const pagoRef = ordenRef.collection("pagos").doc();

      transaction.set(pagoRef, {
        monto,
        registradoPor: uid,
        fecha: admin.firestore.FieldValue.serverTimestamp()
      });

      // Registrar movimiento financiero general
      const movimientoRef = empresaRef
        .collection("sucursales")
        .doc(sucursalId)
        .collection("movimientosFinancieros")
        .doc();

      transaction.set(movimientoRef, {
        tipo: "ingreso_orden",
        ordenId,
        monto,
        creadoPor: uid,
        creadoEn: admin.firestore.FieldValue.serverTimestamp()
      });

      // Actualizar métricas reales
      transaction.update(empresaRef, {
        "metricas.ingresosMes": admin.firestore.FieldValue.increment(monto)
      });

    });

    return { ok: true };

  } catch (error) {

    console.error("Error registrando pago:", error);

    throw new functions.https.HttpsError(
      error.code || "internal",
      error.message || "Error interno al registrar pago"
    );
  }

});