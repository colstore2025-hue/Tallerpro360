/**
 * firestoreGuardianGod.js
 * MODO DIOS 🔥
 * Watcher + Corrección + Detección Inteligente
 */

import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = window.db;

/* ================= INIT ================= */

export function activarModoDiosGuardian(empresaId) {

  if (!empresaId) {
    console.warn("⚠️ Guardian Dios: empresaId requerido");
    return;
  }

  console.log("😈 MODO DIOS ACTIVADO");

  const base = `empresas/${empresaId}`;

  escucharOrdenes(base);
  escucharInventario(base);
}

/* ================= ÓRDENES WATCHER ================= */

function escucharOrdenes(base) {

  onSnapshot(collection(db, `${base}/ordenes`), snapshot => {

    snapshot.docChanges().forEach(async change => {

      if (change.type !== "added" && change.type !== "modified") return;

      const data = change.doc.data();
      const id = change.doc.id;

      const update = {};

      /* 🔥 VALIDACIONES AUTOMÁTICAS */

      if (data.total < 0) update.total = 0;

      if (data.costoTotal > data.total) {
        update.utilidad = 0;
      }

      if (!data.estado) update.estado = "abierta";

      /* 💰 DETECCIÓN DE ANOMALÍAS */

      if (data.total > 10000000) {
        await log(base, {
          tipo: "alerta",
          modulo: "ordenes",
          mensaje: "Orden sospechosamente alta",
          ordenId: id
        });
      }

      if (Object.keys(update).length > 0) {

        await updateDoc(
          doc(db, `${base}/ordenes`, id),
          update
        );

        await log(base, {
          tipo: "fix",
          modulo: "ordenes",
          ordenId: id,
          cambios: update
        });
      }

    });

  });
}

/* ================= INVENTARIO WATCHER ================= */

function escucharInventario(base) {

  onSnapshot(collection(db, `${base}/repuestos`), snapshot => {

    snapshot.docChanges().forEach(async change => {

      if (change.type !== "modified") return;

      const data = change.doc.data();
      const id = change.doc.id;

      const update = {};

      /* 🔥 STOCK NEGATIVO */
      if (data.stock < 0) {
        update.stock = 0;

        await log(base, {
          tipo: "alerta",
          modulo: "inventario",
          mensaje: "Stock negativo corregido",
          repuestoId: id
        });
      }

      /* 🚨 STOCK CRÍTICO */
      if (data.stock <= data.stockMinimo) {
        await log(base, {
          tipo: "alerta",
          modulo: "inventario",
          mensaje: `Stock bajo: ${data.nombre}`,
          repuestoId: id
        });
      }

      /* 💰 PRECIOS ILEGALES */
      if (data.precioVenta < data.precioCompra) {
        update.precioVenta = data.precioCompra * 1.3;

        await log(base, {
          tipo: "fix",
          modulo: "inventario",
          mensaje: "Precio corregido automáticamente",
          repuestoId: id
        });
      }

      if (Object.keys(update).length > 0) {

        await updateDoc(
          doc(db, `${base}/repuestos`, id),
          update
        );
      }

    });

  });
}

/* ================= LOG CENTRAL ================= */

async function log(base, data) {

  try {

    await addDoc(
      collection(db, `${base}/ia_logs`),
      {
        ...data,
        fecha: new Date()
      }
    );

  } catch (e) {
    console.warn("Error log guardian dios");
  }
}