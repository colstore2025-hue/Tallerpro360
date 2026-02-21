import {
  doc,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  collection
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "./firebase-config.js";

export async function cambiarEstadoOrden(empresaId, ordenId, nuevoEstado) {

  return await runTransaction(db, async (transaction) => {

    const ordenRef = doc(db, "talleres", empresaId, "ordenes", ordenId);
    const ordenSnap = await transaction.get(ordenRef);

    if (!ordenSnap.exists()) {
      throw "Orden no existe";
    }

    const ordenData = ordenSnap.data();
    const estadoActual = ordenData.estado;

    // 🔒 Evitar re-procesar si ya está entregado
    if (estadoActual === "ENTREGADO") {
      throw "La orden ya fue entregada";
    }

    // ==================================================
    // 🔄 ACTUALIZAR ESTADO Y TIMELINE
    // ==================================================

    transaction.update(ordenRef, {
      estado: nuevoEstado,
      actualizadoEn: serverTimestamp(),
      timeline: arrayUnion({
        estado: nuevoEstado,
        fecha: serverTimestamp()
      })
    });

    // ==================================================
    // 🚗 SI PASA A ENTREGADO → INVENTARIO + FINANZAS
    // ==================================================

    if (nuevoEstado === "ENTREGADO") {

      // 1️⃣ Descontar inventario
      if (ordenData.repuestos && ordenData.repuestos.length > 0) {

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
            throw `Repuesto no existe: ${repuesto.inventarioId}`;
          }

          const stockActual = itemSnap.data().stockActual;
          const nuevoStock = stockActual - repuesto.cantidad;

          if (nuevoStock < 0) {
            throw `Stock insuficiente para ${repuesto.inventarioId}`;
          }

          transaction.update(itemRef, {
            stockActual: nuevoStock
          });
        }
      }

      // 2️⃣ Crear movimiento financiero
      const movimientoRef = doc(
        collection(db, "talleres", empresaId, "movimientos")
      );

      transaction.set(movimientoRef, {
        tipo: "INGRESO",
        origen: "orden",
        referenciaId: ordenId,
        monto: ordenData.totales?.total || 0,
        categoria: "servicios",
        fecha: serverTimestamp()
      });
    }

  });
}