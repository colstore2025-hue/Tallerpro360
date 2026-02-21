import {
  doc,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  collection
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "./firebase-config.js";

/* =====================================================
   🔄 FLUJO OFICIAL DE ESTADOS
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

    /* ================= VALIDACIONES ================= */

    if (!FLUJO_ESTADOS.hasOwnProperty(nuevoEstado)) {
      throw new Error(`Estado inválido: ${nuevoEstado}`);
    }

    if (estadoActual === nuevoEstado) {
      console.warn("La orden ya está en ese estado");
      return;
    }

    const estadosPermitidos = FLUJO_ESTADOS[estadoActual] || [];
    if (!estadosPermitidos.includes(nuevoEstado)) {
      throw new Error(
        `Transición inválida: ${estadoActual} → ${nuevoEstado}`
      );
    }

    const permisos = PERMISOS_ROL[userRole] || [];
    if (!permisos.includes(nuevoEstado)) {
      throw new Error(
        `El rol ${userRole} no puede cambiar al estado ${nuevoEstado}`
      );
    }

    /* ================= MÉTRICAS ================= */

    const ahora = new Date();
    let duracionEstadoAnterior = 0;

    if (ordenData.fechaInicioEstado?.toDate) {
      const inicio = ordenData.fechaInicioEstado.toDate();
      duracionEstadoAnterior =
        Math.floor((ahora - inicio) / 1000);
    }

    /* ================= ACTUALIZAR ORDEN ================= */

    transaction.update(ordenRef, {
      estado: nuevoEstado,
      actualizadoEn: serverTimestamp(),
      fechaInicioEstado: serverTimestamp(),
      lastChangedBy: userRole,
      timeline: arrayUnion({
        estado: nuevoEstado,
        fecha: serverTimestamp(),
        por: userRole
      }),
      metricas: arrayUnion({
        estado: estadoActual,
        duracionSegundos: duracionEstadoAnterior,
        cerradoEn: serverTimestamp()
      })
    });

    /* =====================================================
       📦 SI ES ENTREGADO → INVENTARIO + FINANZAS + KPI
    ===================================================== */

    if (nuevoEstado === "ENTREGADO") {

      /* ========= INVENTARIO ========= */

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

      /* ========= MOVIMIENTO FINANCIERO ========= */

      const movimientoRef = doc(
        collection(db, "talleres", empresaId, "movimientos")
      );

      const totalOrden = ordenData.totales?.total || 0;

      transaction.set(movimientoRef, {
        tipo: "INGRESO",
        origen: "orden",
        referenciaId: ordenId,
        monto: totalOrden,
        categoria: "servicios",
        descripcion: `Ingreso por orden ${ordenData.codigo || ordenId}`,
        fecha: serverTimestamp(),
        creadoPor: userRole
      });

      /* ========= ACTUALIZAR KPI GLOBAL ========= */

      const statsRef = doc(
        db,
        "talleres",
        empresaId,
        "estadisticas",
        "global"
      );

      const statsSnap = await transaction.get(statsRef);

      if (!statsSnap.exists()) {
        // Primera vez que se crea
        transaction.set(statsRef, {
          totalOrdenes: 0,
          ordenesActivas: 0,
          ordenesEntregadas: 1,
          ingresosTotales: totalOrden,
          ticketPromedio: totalOrden,
          actualizadoEn: serverTimestamp()
        });
      } else {
        const stats = statsSnap.data();

        const nuevasEntregadas =
          (stats.ordenesEntregadas || 0) + 1;

        const nuevosIngresos =
          (stats.ingresosTotales || 0) + totalOrden;

        const nuevoTicket =
          nuevasEntregadas > 0
            ? nuevosIngresos / nuevasEntregadas
            : 0;

        transaction.update(statsRef, {
          ordenesEntregadas: nuevasEntregadas,
          ingresosTotales: nuevosIngresos,
          ticketPromedio: nuevoTicket,
          actualizadoEn: serverTimestamp()
        });
      }
    }

    console.log(
      `✔ [TP360] Orden ${ordenId} pasó de ${estadoActual} a ${nuevoEstado}`
    );
  });
}