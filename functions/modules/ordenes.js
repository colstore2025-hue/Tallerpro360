/************************************************
 * TallerPRO360 · Módulo Órdenes 3.0 ENTERPRISE
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

    const uid = await validarUsuario(context);
    const { empresaId, sucursalId, orden } = data;

    if (!empresaId || !sucursalId || !orden)
      throw new functions.https.HttpsError("invalid-argument", "Datos incompletos");

    if (!orden.items || orden.items.length === 0)
      throw new functions.https.HttpsError("invalid-argument", "Debe tener items");

    const usuario = await obtenerUsuarioEmpresa(empresaId, uid);

    await validarPermiso(empresaId, usuario.rol, "crearOrden");
    await validarLimitePlan(empresaId, "ordenes");

    const empresaRef = db.collection("empresas").doc(empresaId);
    const sucursalRef = empresaRef.collection("sucursales").doc(sucursalId);

    const empresaSnap = await empresaRef.get();
    const empresaData = empresaSnap.data();

    const { subtotal, iva, total } = calcularTotales(orden.items);

    // =============================
    // 🧮 CALCULAR UTILIDAD REAL
    // =============================

    let costoTotal = 0;

    orden.items.forEach(item => {
      costoTotal += (item.costoUnitario || 0) * item.cantidad;
    });

    const utilidadBruta = total - costoTotal;
    const margenGlobal = total > 0 ? (utilidadBruta / total) * 100 : 0;

    let ordenId;
    let consecutivoFinal;

    await db.runTransaction(async (transaction) => {

      const empresaDoc = await transaction.get(empresaRef);
      const consecutivoActual = empresaDoc.data().consecutivoOrdenes || 0;
      consecutivoFinal = consecutivoActual + 1;

      const ordenRef = sucursalRef.collection("ordenes").doc();
      ordenId = ordenRef.id;

      transaction.set(ordenRef, {

        ...orden,

        consecutivo: consecutivoFinal,

        financieros: {
          subtotal,
          iva,
          total,
          costoTotal,
          utilidadBruta,
          margenGlobal
        },

        flujoTrabajo: {
          etapaActual: "Ingreso",
          historial: [
            {
              etapa: "Ingreso",
              iniciadoEn: admin.firestore.FieldValue.serverTimestamp(),
              responsable: uid
            }
          ]
        },

        logistica: {
          prioridad: orden.prioridad || "media",
          tecnicoPrincipal: orden.tecnicoPrincipal || null,
          fechaPromesaEntrega: orden.fechaPromesaEntrega || null
        },

        estado: "Ingreso",
        pagado: 0,
        saldo: total,
        creadoPor: uid,
        canalCreacion: orden.canalCreacion || "manual",

        creadoEn: admin.firestore.FieldValue.serverTimestamp(),
        ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      });

      transaction.update(empresaRef, {
        consecutivoOrdenes: consecutivoFinal,
        "metricas.ordenesMes": admin.firestore.FieldValue.increment(1),
        "metricas.ingresosMes": admin.firestore.FieldValue.increment(total),
        "metricas.utilidadMes": admin.firestore.FieldValue.increment(utilidadBruta)
      });

    });

    // =============================
    // 📦 INVENTARIO AUTOMÁTICO
    // =============================

    for (const item of orden.items) {

      if (item.tipo === "repuesto" && item.repuestoId) {

        const repuestoRef = empresaRef.collection("inventario").doc(item.repuestoId);

        await repuestoRef.update({
          stock: admin.firestore.FieldValue.increment(-item.cantidad)
        });

      }
    }

    // =============================
    // 🧠 ACTUALIZAR CRM CLIENTE
    // =============================

    if (orden.cliente?.id) {

      const clienteRef = empresaRef.collection("clientes").doc(orden.cliente.id);

      await clienteRef.update({
        totalFacturado: admin.firestore.FieldValue.increment(total),
        visitas: admin.firestore.FieldValue.increment(1),
        ultimaVisita: admin.firestore.FieldValue.serverTimestamp()
      });

    }

    // =============================
    // 📘 CONTABILIDAD AVANZADA
    // =============================

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

    return {
      ok: true,
      ordenId,
      consecutivo: consecutivoFinal,
      utilidadBruta,
      margenGlobal
    };

  } catch (error) {

    console.error("Error creando orden:", error);

    throw new functions.https.HttpsError(
      error.code || "internal",
      error.message || "Error interno al crear orden"
    );
  }

});