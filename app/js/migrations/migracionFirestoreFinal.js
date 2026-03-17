/**
 * TallerPRO360
 * Migración profesional Firestore
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

initializeApp({
  credential: applicationDefault()
});

const db = getFirestore();
const empresaId = "taller_001";

const coleccionesEmpresa = [
  "ordenes",
  "clientes",
  "inventario",
  "facturas",
  "empleados",
  "sucursales"
];

async function migrarFirestore() {

  console.log("🚀 Migración profesional Firestore");

  const empresaRef = db.collection("empresas").doc(empresaId);

  // =========================
  // MIGRAR COLECCIONES EMPRESA
  // =========================

  for (const col of coleccionesEmpresa) {

    console.log("📂 Migrando:", col);

    const snap = await empresaRef.collection(col).get();

    for (const doc of snap.docs) {

      const data = doc.data();
      const update = {};

      if (!data.empresaId) update.empresaId = empresaId;

      if (col === "ordenes") {

        if (!Array.isArray(data.historialEstados))
          update.historialEstados = [];

        if (!Array.isArray(data.cotizacion))
          update.cotizacion = [];

        if (!Array.isArray(data.alertasIA))
          update.alertasIA = [];

        if (typeof data.valorTrabajo === "string")
          update.valorTrabajo = Number(data.valorTrabajo);

        if (!data.creadoEn)
          update.creadoEn = Timestamp.now();
      }

      if (Object.keys(update).length > 0) {

        await empresaRef
          .collection(col)
          .doc(doc.id)
          .update(update);

        console.log("✔ actualizado:", doc.id);

      }

    }

  }

  // =========================
  // NORMALIZAR USUARIOSGLOBAL
  // =========================

  console.log("👥 Normalizando usuariosGlobal");

  const users = await db.collection("usuariosGlobal").get();

  for (const doc of users.docs) {

    const data = doc.data();
    const update = {};

    if (!data.empresaId) update.empresaId = empresaId;
    if (!data.rol) update.rol = "dueno";
    if (!data.rolGlobal) update.rolGlobal = "superadmin";
    if (!data.activo) update.activo = true;
    if (!data.sucursalId) update.sucursalId = "principal";

    if (Object.keys(update).length > 0) {

      await db.collection("usuariosGlobal")
        .doc(doc.id)
        .update(update);

      console.log("✔ usuario actualizado:", doc.id);

    }

  }

  // =========================
  // NORMALIZAR EMPRESA
  // =========================

  console.log("🏢 Normalizando empresa");

  const empresa = await empresaRef.get();
  const data = empresa.data();
  const update = {};

  if (!data.estado) update.estado = "activo";
  if (!data.nombre) update.nombre = "Taller";
  if (!data.creadoEn) update.creadoEn = Timestamp.now();

  if (Object.keys(update).length > 0) {

    await empresaRef.update(update);
    console.log("✔ empresa actualizada");

  }

  console.log("🎯 Firestore optimizada para ERP TallerPRO360");

}

if (typeof window === "undefined") {
  migrarFirestore().catch(console.error);
}

export { migrarFirestore };