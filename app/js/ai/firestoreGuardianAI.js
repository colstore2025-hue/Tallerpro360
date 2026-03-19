/**
 * firestoreGuardianAI.js
 * IA AUTÓNOMA DE SANIDAD FIRESTORE
 * TallerPRO360 · Nivel Tesla
 */

import {
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* 🔥 DB GLOBAL */
const db = window.db;

/* ================= GUARDIAN PRINCIPAL ================= */

export async function runFirestoreGuardian(empresaId) {

  if (!empresaId) {
    console.warn("⚠️ Guardian: empresaId requerido");
    return;
  }

  console.log("🧠 Guardian IA iniciado...");

  const base = `empresas/${empresaId}`;

  try {

    await repararOrdenes(base);
    await repararClientes(base);
    await repararInventario(base);

    console.log("✅ Guardian completado");

  } catch (e) {

    console.error("🔥 Guardian error:", e);

    await logIA(base, {
      tipo: "error",
      modulo: "guardian",
      mensaje: e.message
    });
  }
}

/* ================= REPARAR ÓRDENES ================= */

async function repararOrdenes(base) {

  const snap = await getDocs(collection(db, `${base}/ordenes`));

  for (const d of snap.docs) {

    const data = d.data();
    const update = {};

    // 🧠 Normalizar arrays
    if (!Array.isArray(data.alertasIA)) update.alertasIA = [];
    if (!Array.isArray(data.cotizacion)) update.cotizacion = [];
    if (!Array.isArray(data.historialEstados)) update.historialEstados = [];

    // 🔢 Tipos numéricos
    if (typeof data.total === "string") update.total = Number(data.total);
    if (typeof data.costoTotal === "string") update.costoTotal = Number(data.costoTotal);

    // 📅 Timestamp seguro
    if (!data.creadoEn) update.creadoEn = Timestamp.now();

    // 🧾 Defaults
    if (!data.estado) update.estado = "abierta";

    if (Object.keys(update).length > 0) {

      await updateDoc(doc(db, `${base}/ordenes`, d.id), update);

      await logIA(base, {
        tipo: "fix",
        modulo: "ordenes",
        docId: d.id,
        cambios: update
      });
    }
  }
}

/* ================= REPARAR CLIENTES ================= */

async function repararClientes(base) {

  const snap = await getDocs(collection(db, `${base}/clientes`));

  for (const d of snap.docs) {

    const data = d.data();
    const update = {};

    if (!data.nombre) update.nombre = "Cliente sin nombre";
    if (!data.estado) update.estado = "activo";
    if (!data.creadoEn) update.creadoEn = Timestamp.now();

    if (Object.keys(update).length > 0) {

      await updateDoc(doc(db, `${base}/clientes`, d.id), update);

      await logIA(base, {
        tipo: "fix",
        modulo: "clientes",
        docId: d.id,
        cambios: update
      });
    }
  }
}

/* ================= REPARAR INVENTARIO ================= */

async function repararInventario(base) {

  const snap = await getDocs(collection(db, `${base}/repuestos`));

  for (const d of snap.docs) {

    const data = d.data();
    const update = {};

    if (typeof data.stock !== "number") update.stock = Number(data.stock) || 0;
    if (typeof data.stockMinimo !== "number") update.stockMinimo = Number(data.stockMinimo) || 0;

    if (typeof data.precioCompra !== "number") update.precioCompra = Number(data.precioCompra) || 0;
    if (typeof data.precioVenta !== "number") update.precioVenta = Number(data.precioVenta) || 0;

    if (!data.creadoEn) update.creadoEn = Timestamp.now();

    if (Object.keys(update).length > 0) {

      await updateDoc(doc(db, `${base}/repuestos`, d.id), update);

      await logIA(base, {
        tipo: "fix",
        modulo: "inventario",
        docId: d.id,
        cambios: update
      });
    }
  }
}

/* ================= LOG IA ================= */

async function logIA(base, data) {

  try {

    await addDoc(
      collection(db, `${base}/ia_logs`),
      {
        ...data,
        fecha: new Date()
      }
    );

  } catch (e) {
    console.warn("⚠️ Error guardando log IA");
  }
}