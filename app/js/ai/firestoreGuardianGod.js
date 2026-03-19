/**
 * firestoreGuardianGod.js
 * MODO DIOS 🔥 ULTRA PRO360
 * Watcher + Fix Total Inicial + Corrección Inteligente
 * Integración completa con Orquestador Supremo
 */

import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = window.db;

/* ================= INIT MODO DIOS ================= */
export function activarModoDiosGuardian(empresaId) {
  if (!empresaId) {
    console.warn("⚠️ Guardian Dios: empresaId requerido");
    return;
  }

  console.log("😈 MODO DIOS ACTIVADO");

  const base = `empresas/${empresaId}`;

  // 🔹 Fix inicial
  fixTotalInicial(empresaId).then(() => {
    console.log("✅ Fix inicial completado, iniciando Watchers");
  });

  // 🔹 Watchers en tiempo real
  escucharOrdenes(base);
  escucharInventario(base);
}

/* ================= FIX TOTAL INICIAL ================= */
export async function fixTotalInicial(empresaId) {
  if (!empresaId) return;
  const base = `empresas/${empresaId}`;

  console.log("🔥 Ejecutando Fix Total Inicial...");

  // 🔹 Órdenes
  const ordenesSnap = await getDocs(collection(db, `${base}/ordenes`));
  for (const docSnap of ordenesSnap.docs) {
    const data = docSnap.data();
    const id = docSnap.id;
    const update = {};
    if (data.total < 0) update.total = 0;
    if (data.costoTotal > data.total) update.utilidad = 0;
    if (!data.estado) update.estado = "abierta";
    if (Object.keys(update).length > 0) {
      await updateDoc(doc(db, `${base}/ordenes`, id), update);
      await log(base, {
        tipo: "fix",
        modulo: "ordenes",
        ordenId: id,
        cambios: update
      });
    }
  }

  // 🔹 Inventario
  const repuestosSnap = await getDocs(collection(db, `${base}/repuestos`));
  for (const docSnap of repuestosSnap.docs) {
    const data = docSnap.data();
    const id = docSnap.id;
    const update = {};
    if (data.stock < 0) update.stock = 0;
    if (data.precioVenta < data.precioCompra) update.precioVenta = data.precioCompra * 1.3;
    if (Object.keys(update).length > 0) {
      await updateDoc(doc(db, `${base}/repuestos`, id), update);
      await log(base, {
        tipo: "fix",
        modulo: "inventario",
        repuestoId: id,
        cambios: update
      });
    }
  }

  console.log("✅ Fix Total Inicial completado");
}

/* ================= ÓRDENES WATCHER ================= */
function escucharOrdenes(base) {
  onSnapshot(collection(db, `${base}/ordenes`), snapshot => {
    snapshot.docChanges().forEach(async change => {
      if (!["added","modified"].includes(change.type)) return;

      const data = change.doc.data();
      const id = change.doc.id;
      const update = {};

      // 🔹 Validaciones automáticas
      if (data.total < 0) update.total = 0;
      if (data.costoTotal > data.total) update.utilidad = 0;
      if (!data.estado) update.estado = "abierta";

      // 🔹 Alertas
      if (data.total > 10000000) {
        await log(base, {
          tipo: "alerta",
          modulo: "ordenes",
          mensaje: "Orden sospechosamente alta",
          ordenId: id
        });
      }

      // 🔹 Correcciones automáticas
      if (Object.keys(update).length > 0) {
        await updateDoc(doc(db, `${base}/ordenes`, id), update);
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

      // 🔹 Stock negativo
      if (data.stock < 0) {
        update.stock = 0;
        await log(base, {
          tipo: "alerta",
          modulo: "inventario",
          mensaje: "Stock negativo corregido",
          repuestoId: id
        });
      }

      // 🔹 Stock crítico
      if (data.stock <= data.stockMinimo) {
        await log(base, {
          tipo: "alerta",
          modulo: "inventario",
          mensaje: `Stock bajo: ${data.nombre}`,
          repuestoId: id
        });
      }

      // 🔹 Precios ilegales
      if (data.precioVenta < data.precioCompra) {
        update.precioVenta = data.precioCompra * 1.3;
        await log(base, {
          tipo: "fix",
          modulo: "inventario",
          mensaje: "Precio corregido automáticamente",
          repuestoId: id
        });
      }

      // 🔹 Aplicar corrección
      if (Object.keys(update).length > 0) {
        await updateDoc(doc(db, `${base}/repuestos`, id), update);
      }
    });
  });
}

/* ================= LOG CENTRAL ================= */
async function log(base, data) {
  try {
    await addDoc(collection(db, `${base}/ia_logs`), {
      ...data,
      fecha: new Date()
    });
  } catch (e) {
    console.warn("Error log guardian dios", e);
  }
}