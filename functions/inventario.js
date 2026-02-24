/************************************************
 * TallerPRO360 · Módulo Inventario
 * Ajuste Manual de Stock + Auditoría
 ************************************************/

const functions = require("firebase-functions");
const admin = require("firebase-admin");

const {
  validarUsuario,
  obtenerUsuarioEmpresa,
  validarPermiso
} = require("../utils/seguridad");

const db = admin.firestore();

exports.ajustarStock = functions.https.onCall(async (data, context) => {

  try {

    // =====================================
    // 🔐 VALIDAR USUARIO
    // =====================================

    const uid = await validarUsuario(context);

    const { empresaId, sucursalId, productoId, cantidad, motivo } = data;

    if (!empresaId || !sucursalId || !productoId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Datos incompletos"
      );
    }

    if (typeof cantidad !== "number" || isNaN(cantidad)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Cantidad inválida"
      );
    }

    if (cantidad === 0) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "El ajuste no puede ser 0"
      );
    }

    const usuario = await obtenerUsuarioEmpresa(empresaId, uid);
    await validarPermiso(empresaId, usuario.rol, "editarInventario");

    // =====================================
    // 📦 REFERENCIA PRODUCTO
    // =====================================

    const productoRef = db
      .collection("empresas")
      .doc(empresaId)
      .collection("sucursales")
      .doc(sucursalId)
      .collection("inventario")
      .doc(productoId);

    // =====================================
    // 🔄 TRANSACCIÓN SEGURA
    // =====================================

    await db.runTransaction(async (tx) => {

      const snap = await tx.get(productoRef);

      if (!snap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Producto no encontrado"
        );
      }

      const producto = snap.data();
      const stockActual = Number(producto.stock || 0);
      const nuevoStock = stockActual + cantidad;

      if (nuevoStock < 0) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Stock insuficiente"
        );
      }

      // Determinar tipo de movimiento
      let tipoMovimiento = "ajuste";
      if (cantidad > 0) tipoMovimiento = "entrada";
      if (cantidad < 0) tipoMovimiento = "salida";

      // Actualizar stock
      tx.update(productoRef, {
        stock: nuevoStock,
        actualizadoEn: admin.firestore.FieldValue.serverTimestamp()
      });

      // Registrar movimiento (Auditoría completa)
      const movRef = productoRef.collection("movimientos").doc();

      tx.set(movRef, {
        tipo: tipoMovimiento,
        cantidad,
        stockAnterior: stockActual,
        stockNuevo: nuevoStock,
        motivo: motivo || "Ajuste manual",
        realizadoPor: uid,
        fecha: admin.firestore.FieldValue.serverTimestamp()
      });

    });

    return { ok: true };

  } catch (error) {

    console.error("Error ajustando stock:", error);

    throw new functions.https.HttpsError(
      error.code || "internal",
      error.message || "Error interno al ajustar stock"
    );
  }

});