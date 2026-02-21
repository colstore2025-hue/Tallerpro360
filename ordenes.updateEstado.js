import {
  doc,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  collection
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "./firebase-config.js";

/* =====================================================
   🔄 FLUJO OFICIAL DE ESTADOS (Máquina de estados)
===================================================== */

const FLUJO_ESTADOS = {
  INGRESADO: ["DIAGNOSTICO"],
  DIAGNOSTICO: ["APROBADO", "CANCELADO"],
  APROBADO: ["REPARACION", "CANCELADO"],
  REPARACION: ["LISTO"],
  LISTO: ["ENTREGADO"],
  ENTREGADO: [],
  CANCELADO: []
};

/* =====================================================
   🔐 PERMISOS POR ROL
===================================================== */

const PERMISOS_ROL = {
  tecnico: ["DIAGNOSTICO", "REPARACION", "LISTO"],
  admin: [
    "DIAGNOSTICO",
    "APROBADO",
    "REPARACION",
    "LISTO",
    "ENTREGADO",
    "CANCELADO"
  ],
  taller: [
    "DIAGNOSTICO",
    "APROBADO",
    "REPARACION",
    "LISTO",
    "ENTREGADO",
    "CANCELADO"
  ],
  sistema: ["ENTREGADO"]
};

/* =====================================================
   🚀 FUNCIÓN PRINCIPAL
===================================================== */

/**
 * Cambia estado de orden (ERP completo)
 * - Multiempresa
 * - Máquina de estados
 * - Permisos por rol
 * - Inventario automático
 * - Movimiento financiero
 * - Timeline inmutable
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

    /* =====================================================
       ✅ VALIDACIONES
    ===================================================== */

    // 1️⃣ Validar que el estado exista
    if (!FLUJO_ESTADOS.hasOwnProperty(nuevoEstado)) {
      throw new Error(`Estado inválido: ${nuevoEstado}`);
    }

    // 2️⃣ Evitar mismo estado
    if (estadoActual === nuevoEstado) {
      console.warn("La orden ya está en ese estado");
      return;
    }

    // 3️⃣ Validar transición permitida
    const estadosPermitidos = FLUJO_ESTADOS[estadoActual] || [];

    if (!estadosPermitidos.includes(nuevoEstado)) {
      throw new Error(
        `Transición inválida: no se puede pasar de ${estadoActual} a ${nuevoEstado}`
      );
    }

    // 4️⃣ Validar permisos por rol
    const permisos = PERMISOS_ROL[userRole] || [];

    if (!permisos.includes(nuevoEstado)) {
      throw new Error(
        `El rol ${userRole} no puede cambiar al estado ${nuevoEstado}`
      );
    }

    /* =====================================================
       🔄 ACTUALIZAR ESTADO + TIMELINE
    ===================================================== */
const ahora = new Date();

let duracionEstadoAnterior = null;

if (ordenData.fechaInicioEstado?.toDate) {
  const inicio = ordenData.fechaInicioEstado.toDate();
  duracionEstadoAnterior =
    Math.floor((ahora - inicio) / 1000); // segundos
}
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

    /* =====================================================
       📦 SI ES ENTREGADO → INVENTARIO + FINANZAS
    ===================================================== */

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
            throw new Error(
              `Repuesto no existe: ${repuesto.inventarioId}`
            );
          }

          const stockActual = itemSnap.data().stockActual;
          const nuevoStock = stockActual - repuesto.cantidad;

          if (nuevoStock < 0) {
            throw new Error(
              `Stock insuficiente para ${repuesto.inventarioId}`
            );
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
        fecha: serverTimestamp(),
        creadoPor: userRole
      });
    }

    console.log(
      `✔ [TP360] Orden ${ordenId} pasó de ${estadoActual} a ${nuevoEstado}`
    );
  });
}