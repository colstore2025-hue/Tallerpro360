/************************************************
 * TallerPRO360 · Módulo Órdenes 5.0 SUPREME
 * ERP + CRM + Logística + IA + SaaS Metrics
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
const FieldValue = admin.firestore.FieldValue;

/* ======================================================
   🔥 CREAR ORDEN ULTRA ENTERPRISE
====================================================== */

exports.crearOrden = functions.https.onCall(async (data, context) => {

  try {

    /* =============================
       🔐 VALIDACIONES BASE
    ============================== */

    const uid = await validarUsuario(context);
    const { empresaId, sucursalId, orden } = data;

    if (!empresaId || !sucursalId || !orden)
      throw new functions.https.HttpsError("invalid-argument", "Datos incompletos");

    if (!orden.items || !Array.isArray(orden.items) || orden.items.length === 0)
      throw new functions.https.HttpsError("invalid-argument", "La orden debe tener items");

    const usuario = await obtenerUsuarioEmpresa(empresaId, uid);
    await validarPermiso(empresaId, usuario.rol, "crearOrden");
    await validarLimitePlan(empresaId, "ordenes");

    const empresaRef = db.collection("empresas").doc(empresaId);
    const sucursalRef = empresaRef.collection("sucursales").doc(sucursalId);
    const empresaSnap = await empresaRef.get();
    const empresaData = empresaSnap.data();

    if (!empresaSnap.exists)
      throw new functions.https.HttpsError("not-found", "Empresa no encontrada");

    /* =============================
       🧮 CÁLCULOS FINANCIEROS
    ============================== */

    const { subtotal, iva, total } = calcularTotales(orden.items);

    let costoTotal = 0;

    orden.items.forEach(item => {
      costoTotal += (item.costoUnitario || 0) * item.cantidad;
    });

    const utilidadBruta = total - costoTotal;
    const margenGlobal = total > 0 ? (utilidadBruta / total) * 100 : 0;

    /* =============================
       🧠 MOTOR IA BÁSICO
    ============================== */

    const probabilidadRetorno = total > 500000 ? 0.75 : 0.45;
    const ticketProyectadoProximo = total * 0.6;

    /* =============================
       👷 ASIGNACIÓN AUTOMÁTICA TÉCNICO
    ============================== */

    let tecnicoAsignado = orden.tecnicoPrincipal || null;

    if (!tecnicoAsignado && empresaData.configuracion?.asignacionAutomatica) {

      const tecnicosSnap = await empresaRef
        .collection("usuarios")
        .where("rol", "==", "tecnico")
        .get();

      if (!tecnicosSnap.empty) {
        tecnicoAsignado = tecnicosSnap.docs[0].id;
      }
    }

    /* =============================
       🔄 TRANSACCIÓN CENTRAL
    ============================== */

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
        tecnicoPrincipal: tecnicoAsignado,

        financieros: {
          subtotal,
          iva,
          total,
          costoTotal,
          utilidadBruta,
          margenGlobal
        },

        ia: {
          probabilidadRetorno,
          ticketProyectadoProximo,
          mantenimientoSugerido: []
        },

        flujoTrabajo: {
          etapaActual: "Ingreso",
          historial: [
            {
              etapa: "Ingreso",
              iniciadoEn: FieldValue.serverTimestamp(),
              responsable: uid
            }
          ]
        },

        logistica: {
          prioridad: orden.prioridad || "media",
          fechaPromesaEntrega: orden.fechaPromesaEntrega || null,
          tiempoEstimadoMin: orden.tiempoEstimadoMin || 60
        },

        estado: "Ingreso",
        pagado: 0,
        saldo: total,
        creadoPor: uid,
        canalCreacion: orden.canalCreacion || "manual",

        creadoEn: FieldValue.serverTimestamp(),
        ultimaActualizacion: FieldValue.serverTimestamp()
      });

      transaction.update(empresaRef, {
        consecutivoOrdenes: consecutivoFinal,
        "metricas.ordenesMes": FieldValue.increment(1),
        "metricas.ingresosMes": FieldValue.increment(total),
        "metricas.utilidadMes": FieldValue.increment(utilidadBruta)
      });

      /* 👑 MÉTRICAS GLOBALES SaaS */

      const globalRef = db.collection("plataformaStats").doc("global");

      transaction.set(globalRef, {
        ordenesTotales: FieldValue.increment(1),
        facturacionGlobal: FieldValue.increment(total)
      }, { merge: true });

    });

    /* =============================
       📦 INVENTARIO AUTOMÁTICO + ALERTAS
    ============================== */

    for (const item of orden.items) {

      if (item.tipo === "repuesto" && item.repuestoId) {

        const repuestoRef = empresaRef.collection("inventario").doc(item.repuestoId);
        const repuestoSnap = await repuestoRef.get();

        if (repuestoSnap.exists) {

          const stockActual = repuestoSnap.data().stock || 0;
          const nuevoStock = stockActual - item.cantidad;

          await repuestoRef.update({
            stock: FieldValue.increment(-item.cantidad)
          });

          if (nuevoStock <= (repuestoSnap.data().stockMinimo || 5)) {

            await empresaRef.collection("alertas").add({
              tipo: "stock_bajo",
              repuestoId: item.repuestoId,
              creadoEn: FieldValue.serverTimestamp(),
              visto: false
            });

          }
        }
      }
    }

    /* =============================
       🧠 ACTUALIZAR CRM CLIENTE
    ============================== */

    if (orden.cliente?.id) {

      const clienteRef = empresaRef.collection("clientes").doc(orden.cliente.id);

      await clienteRef.set({
        totalFacturado: FieldValue.increment(total),
        visitas: FieldValue.increment(1),
        ultimaVisita: FieldValue.serverTimestamp(),
        crmScore: FieldValue.increment(utilidadBruta > 0 ? 5 : 1)
      }, { merge: true });

    }

    /* =============================
       📘 CONTABILIDAD
    ============================== */

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

    /* =============================
       📲 EVENTO PARA WHATSAPP
       (Webhook externo escucha colección)
    ============================== */

    await empresaRef.collection("eventos").add({
      tipo: "orden_creada",
      ordenId,
      clienteTelefono: orden.cliente?.telefono || null,
      creadoEn: FieldValue.serverTimestamp(),
      procesado: false
    });

    return {
      ok: true,
      ordenId,
      consecutivo: consecutivoFinal,
      utilidadBruta,
      margenGlobal,
      probabilidadRetorno
    };

  } catch (error) {

    console.error("Error creando orden:", error);

    throw new functions.https.HttpsError(
      error.code || "internal",
      error.message || "Error interno al crear orden"
    );
  }

});