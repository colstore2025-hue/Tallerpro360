/************************************************
 * TallerPRO360 · Módulo Órdenes ULTRA ENTERPRISE
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
const { registrarAsiento } = require("../contabilidad");

const db = admin.firestore();

// ===============================================
// 🧠 CONFIGURACIÓN PIPELINE DEFAULT
// ===============================================

const PIPELINE_DEFAULT = [
  "Ingreso",
  "Diagnóstico",
  "Aprobación",
  "Reparación",
  "Control Calidad",
  "Listo para Entrega",
  "Entregado"
];

// ===============================================
// 🚀 CREAR ORDEN ULTRA
// ===============================================

exports.crearOrden = functions.https.onCall(async (data, context) => {

  try {

    const uid = await validarUsuario(context);

    const {
      empresaId,
      sucursalId,
      orden,
      modoVoz = false,
      metadataVoz = null
    } = data;

    if (!empresaId || !sucursalId || !orden) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Datos incompletos"
      );
    }

    if (!orden.items || orden.items.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "La orden debe tener items"
      );
    }

    const usuario = await obtenerUsuarioEmpresa(empresaId, uid);
    await validarPermiso(empresaId, usuario.rol, "crearOrden");
    await validarLimitePlan(empresaId, "ordenes");

    const empresaRef = db.collection("empresas").doc(empresaId);
    const sucursalRef = empresaRef.collection("sucursales").doc(sucursalId);

    const empresaSnap = await empresaRef.get();
    if (!empresaSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Empresa no encontrada");
    }

    const empresaData = empresaSnap.data();

    const pipeline = empresaData.configuracion?.pipelinePersonalizado || PIPELINE_DEFAULT;

    // ===============================================
    // 📊 CÁLCULO FINANCIERO
    // ===============================================

    const { subtotal, iva, total } = calcularTotales(orden.items);

    let ordenId;
    let consecutivoFinal;
    let costoTotal = 0;

    await db.runTransaction(async (transaction) => {

      const empresaDoc = await transaction.get(empresaRef);
      const empresaDataTx = empresaDoc.data();

      consecutivoFinal = (empresaDataTx.consecutivoOrdenes || 0) + 1;

      const ordenRef = sucursalRef.collection("ordenes").doc();
      ordenId = ordenRef.id;

      // ==========================
      // 📦 INVENTARIO AUTOMÁTICO
      // ==========================

      for (const item of orden.items) {

        if (item.tipo === "repuesto" && item.inventarioId) {

          const invRef = empresaRef.collection("inventario").doc(item.inventarioId);
          const invDoc = await transaction.get(invRef);

          if (!invDoc.exists) {
            throw new Error("Repuesto no encontrado");
          }

          const invData = invDoc.data();

          if (invData.stock < item.cantidad) {
            throw new Error(`Stock insuficiente para ${invData.nombre}`);
          }

          costoTotal += invData.costoUnitario * item.cantidad;

          transaction.update(invRef, {
            stock: admin.firestore.FieldValue.increment(-item.cantidad)
          });

        }

      }

      const margen = total - costoTotal;

      // ==========================
      // 🧠 ESTRUCTURA ORDEN 4.0
      // ==========================

      transaction.set(ordenRef, {

        ...orden,
        consecutivo: consecutivoFinal,

        subtotal,
        iva,
        total,

        costoTotal,
        margen,

        pagado: 0,
        saldo: total,

        estadoActual: pipeline[0],
        pipeline,
        historialEstados: [
          {
            estado: pipeline[0],
            fecha: admin.firestore.FieldValue.serverTimestamp(),
            usuario: uid
          }
        ],

        asignadoA: null,
        SLAHoras: orden.SLAHoras || 24,

        creadoPor: uid,
        modoVoz,
        metadataVoz,

        creadoEn: admin.firestore.FieldValue.serverTimestamp(),
        ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      });

      transaction.update(empresaRef, {
        consecutivoOrdenes: consecutivoFinal,
        "metricas.ordenesMes": admin.firestore.FieldValue.increment(1),
        "metricas.ingresosMes": admin.firestore.FieldValue.increment(total)
      });

    });

    // ===============================================
    // 📘 CONTABILIDAD AUTOMÁTICA
    // ===============================================

    if (empresaData.configuracion?.contabilidadAvanzada) {

      await registrarAsiento({
        empresaId,
        tipo: "orden",
        referenciaId: ordenId,
        creadoPor: uid,
        movimientos: [
          { cuenta: "1305", debe: total, haber: 0 },
          { cuenta: "4135", debe: 0, haber: subtotal },
          { cuenta: "2408", debe: 0, haber: iva }
        ]
      });

    }

    // ===============================================
    // 🧠 CRM INTELIGENTE
    // ===============================================

    if (orden.clienteId) {

      const clienteRef = empresaRef.collection("clientes").doc(orden.clienteId);

      await clienteRef.update({
        ultimaOrden: admin.firestore.FieldValue.serverTimestamp(),
        totalFacturado: admin.firestore.FieldValue.increment(total),
        numeroOrdenes: admin.firestore.FieldValue.increment(1)
      });

    }

    // ===============================================
    // 📊 MÉTRICAS PREDICTIVAS
    // ===============================================

    const mesKey = new Date().toISOString().slice(0,7);

    await empresaRef.collection("metricasMensuales").doc(mesKey).set({
      ingresos: admin.firestore.FieldValue.increment(total),
      ordenes: admin.firestore.FieldValue.increment(1)
    }, { merge: true });

    return {
      ok: true,
      ordenId,
      consecutivo: consecutivoFinal,
      margen
    };

  } catch (error) {

    console.error("Error creando orden ULTRA:", error);

    throw new functions.https.HttpsError(
      error.code || "internal",
      error.message || "Error interno al crear orden"
    );
  }

});