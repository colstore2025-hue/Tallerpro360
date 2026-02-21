import {
  doc,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  collection
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "./firebase-config.js";

/**
 * Cambia estado de orden (ERP completo)
 * - Multiempresa
 * - Timeline array
 * - Descuento inventario
 * - Movimiento financiero
 */
export async function cambiarEstadoOrden(
  empresaId,
  ordenId,
  nuevoEstado,
  userRole = "taller"
) {
  if (!empresaId || !ordenId || !nuevoEstado) {
    throw new Error("empresaId, ordenId y nuevoEstado son obligatorios");
  }

  return await runTransaction(db, async (transaction) => {

    const ordenRef = doc(
      db,
      "talleres",
      empresaId,
      "ordenes",
      ordenId
    );

    const ordenSnap = await transaction.get(ordenRef);

    if (!ordenSnap.exists()) {
      throw new Error(`La orden ${ordenId} no existe`);
    }

    const ordenData = ordenSnap.data();
    const estadoActual = ordenData.estado;

    if (estadoActual === nuevoEstado) {
      console.warn("La orden ya está en ese estado");
      return;
    }

    // 🔒 No permitir reprocesar entrega
    if (estadoActual === "ENTREGADO") {
      throw new Error("La orden ya fue entregada");
    }

    // ============================================
    // 1️⃣ ACTUALIZAR ESTADO + TIMELINE
    // ============================================

    transaction.update(ordenRef, {
      estado: nuevoEstado,
      actualizadoEn: serverTimestamp(),
      lastChangedBy: userRole,
      timeline: arrayUnion({
        estado: nuevoEstado,
        fecha: serverTimestamp(),
        por: userRole
      })
    });

    // ============================================
    // 2️⃣ SI ES ENTREGADO → INVENTARIO + FINANZAS
    // ============================================

    if (nuevoEstado === "ENTREGADO") {

      // 🧰 DESCONTAR INVENTARIO
      if (ordenData.repuestos?.length) {

        for (const repuesto of ordenData.repuestos) {

          const itemRef = doc(
            db,
            "talleres",
            empresaId,
            "inventario",
            repuesto.inventarioId
          );

          const itemSnap = await transaction.get(itemRef);

          if (!itemSnap.exists()) {
            throw new Error(`Repuesto no existe: ${repuesto.inventarioId}`);
          }

          const stockActual = itemSnap.data().stockActual;
          const nuevoStock = stockActual - repuesto.cantidad;

          if (nuevoStock < 0) {
            throw new Error(`Stock insuficiente para ${repuesto.inventarioId}`);
          }

          transaction.update(itemRef, {
            stockActual: nuevoStock
          });
        }
      }

      // 💰 CREAR MOVIMIENTO FINANCIERO
      const movimientoRef = doc(
        collection(db, "talleres", empresaId, "movimientos")
      );

      transaction.set(movimientoRef, {
        tipo: "INGRESO",
        origen: "orden",
        referenciaId: ordenId,
        monto: ordenData.totales?.total || 0,
        categoria: "servicios",
        descripcion: `Ingreso por orden ${ordenData.codigo || ordenId}`,
        fecha: serverTimestamp()
      });
    }

    console.log(
      `✔ [TP360] Orden ${ordenId} pasó de ${estadoActual} a ${nuevoEstado}`
    );
  });
}