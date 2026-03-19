/**
 * firestoreGuardianAI.js
 * 🧠 IA Guardiana de Firestore
 * Auto-diagnóstico + auto-reparación ligera
 * TallerPRO360
 */

import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ================= CORE ================= */

export async function ejecutarGuardianIA({ empresaId }) {

  if (!empresaId) {
    console.warn("⚠️ GuardianIA: empresaId requerido");
    return;
  }

  console.log("🧠 Guardian IA iniciando...");

  const base = `empresas/${empresaId}`;

  try {

    await repararOrdenes(base);
    await repararRepuestos(base);

    console.log("✅ Guardian IA finalizado");

  } catch (e) {
    console.error("❌ Guardian IA error:", e);
  }
}

/* ================= ORDENES ================= */

async function repararOrdenes(base) {

  console.log("🔍 Analizando órdenes...");

  const snap = await getDocs(collection(window.db, `${base}/ordenes`));

  for (const docSnap of snap.docs) {

    const data = docSnap.data();
    const ref = doc(window.db, `${base}/ordenes`, docSnap.id);

    const update = {};

    // 🔧 empresaId faltante
    if (!data.empresaId) {
      update.empresaId = base.split("/")[1];
    }

    // 🔧 valorTrabajo string → number
    if (typeof data.valorTrabajo === "string") {
      update.valorTrabajo = Number(data.valorTrabajo) || 0;
    }

    // 🔧 alertasIA debe ser array
    if (!Array.isArray(data.alertasIA)) {
      try {
        update.alertasIA = JSON.parse(data.alertasIA || "[]");
      } catch {
        update.alertasIA = [];
      }
    }

    // 🔧 recomendaciones IA
    if (!Array.isArray(data?.diagnosticoIA?.recomendaciones)) {
      try {
        update["diagnosticoIA.recomendaciones"] =
          JSON.parse(data?.diagnosticoIA?.recomendaciones || "[]");
      } catch {
        update["diagnosticoIA.recomendaciones"] = [];
      }
    }

    // 🔧 fecha faltante
    if (!data.creadoEn) {
      update.creadoEn = new Date();
    }

    if (Object.keys(update).length > 0) {

      await updateDoc(ref, update);

      console.log("🛠 Orden reparada:", docSnap.id, update);

    }

  }

}

/* ================= INVENTARIO ================= */

async function repararRepuestos(base) {

  console.log("🔍 Analizando inventario...");

  const snap = await getDocs(collection(window.db, `${base}/repuestos`));

  for (const docSnap of snap.docs) {

    const data = docSnap.data();
    const ref = doc(window.db, `${base}/repuestos`, docSnap.id);

    const update = {};

    // 🔧 stock inválido
    if (typeof data.stock !== "number") {
      update.stock = Number(data.stock) || 0;
    }

    // 🔧 stock mínimo
    if (typeof data.stockMinimo !== "number") {
      update.stockMinimo = Number(data.stockMinimo) || 0;
    }

    // 🔧 precios
    if (typeof data.precioCompra === "string") {
      update.precioCompra = Number(data.precioCompra) || 0;
    }

    if (typeof data.precioVenta === "string") {
      update.precioVenta = Number(data.precioVenta) || 0;
    }

    if (!data.creadoEn) {
      update.creadoEn = new Date();
    }

    if (Object.keys(update).length > 0) {

      await updateDoc(ref, update);

      console.log("🛠 Repuesto reparado:", docSnap.id, update);

    }

  }

}