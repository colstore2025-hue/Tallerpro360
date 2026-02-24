/************************************************
 * TallerPRO360 · Módulo Órdenes ENTERPRISE
 ************************************************/

const functions = require("firebase-functions");
const admin = require("firebase-admin");

const {
  validarUsuario,
  obtenerUsuarioEmpresa,
  validarPermiso,
  validarLimitePlan
} = require("../utils/seguridad");

const { calcularTotales } = require("../utils/helpers");
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
    // 📊 CALCULAR TOTALES EN BACKEND
    // =====================================

    const { subtotal, iva, total } = calcularTotales(orden.items);

    let ordenId;
    let consecutivoFinal;

    // =====================================
    // 🔄 TRANSACCIÓN SEGURA
    // =====================================

    await db.runTransaction(async (transaction) => {

      const empresaDoc = await transaction.get(empresaRef);
      const empresaData = empresaDoc.data();

      const consecutivoActual = empresaData.consecutivoOrdenes || 0;
      consecutivoFinal = consecutivoActual + 1;

      const ordenRef = sucursalRef.collection("ordenes").doc();
      ordenId = ordenRef.id;

      transaction.set(ordenRef, {
        ...orden,
        consecutivo: consecutivoFinal,
        subtotal,
        iva,
        total,
        pagado: 0,
        saldo: total,
        creadoPor: uid,
        estado: "Ingreso",
        creadoEn: admin.firestore.FieldValue.serverTimestamp(),
        ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      });

      transaction.update(empresaRef, {
        consecutivoOrdenes: consecutivoFinal,
        "metricas.ordenesMes": admin.firestore.FieldValue.increment(1)
      });

    });

    // =====================================
    // 📘 CONTABILIDAD (SOLO SI ACTIVA)
    // =====================================

    const empresaData = empresaSnap.data();

    if (empresaData.configuracion?.contabilidadAvanzada) {

      await registrarAsiento({
        empresaId,
        tipo: "orden",
        referenciaId: ordenId,
        creadoPor: uid,
        movimientos: [
          {
            cuenta: "1305",
            debe: total,
            haber: 0
          },
          {
            cuenta: "4135",
            debe: 0,
            haber: subtotal
          },
          {
            cuenta: "2408",
            debe: 0,
            haber: iva
          }
        ]
      });

    }

    return {
      ok: true,
      ordenId,
      consecutivo: consecutivoFinal
    };

  } catch (error) {

    console.error("Error creando orden:", error);

    throw new functions.https.HttpsError(
      error.code || "internal",
      error.message || "Error interno al crear orden"
    );
  }

});