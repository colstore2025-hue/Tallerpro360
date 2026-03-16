/**
 * /app/js/migrations/migracionFirestoreFinal.js
 * Migración Firestore: unifica empresaId, usuarios, roles, planes y colecciones críticas
 * Ideal para ERP TallerPRO360
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({
  credential: applicationDefault()
});

const db = getFirestore();
const empresaIdDefault = "taller_001"; // Empresa principal

// Colecciones a migrar
const colecciones = ["ordenes", "repuestos", "facturas", "inventario", "gastos", "clientes", "empleados", "configuracion", "sucursales"];

// Función principal
async function migrarFirestore() {
  console.log("🚀 Iniciando migración Firestore completa...");

  // 1️⃣ Migrar documentos de colecciones críticas
  for (const col of colecciones) {
    console.log(`📂 Migrando colección: ${col}`);
    const snapshot = await db.collection(col).get();
    let count = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.empresaId) {
        await db.collection(col).doc(doc.id).update({ empresaId: empresaIdDefault });
        count++;
      }
    }
    console.log(`✅ ${count} documentos actualizados en ${col}`);
  }

  // 2️⃣ Normalizar usuariosGlobal
  console.log("👥 Normalizando usuariosGlobal...");
  const usersSnap = await db.collection("usuariosGlobal").get();
  let countUsers = 0;
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const update = {};
    if (!data.empresaId || data.empresaId !== empresaIdDefault) update.empresaId = empresaIdDefault;
    if (!data.rol) update.rol = "dueno";
    if (!data.rolGlobal) update.rolGlobal = "superadmin";
    if (!("activo" in data) || data.activo !== true) update.activo = true;
    if (!data.sucursalId) update.sucursalId = "principal";

    if (Object.keys(update).length > 0) {
      await db.collection("usuariosGlobal").doc(doc.id).update(update);
      countUsers++;
    }
  }
  console.log(`✅ ${countUsers} usuariosGlobal actualizados`);

  // 3️⃣ Normalizar usuarios locales
  console.log("👥 Normalizando usuarios locales...");
  const usuariosSnap = await db.collection("usuarios").get();
  let countLocals = 0;
  for (const doc of usuariosSnap.docs) {
    const data = doc.data();
    const update = {};
    if (!data.empresaId || data.empresaId !== empresaIdDefault) update.empresaId = empresaIdDefault;
    if (!data.rol) update.rol = "dueno";
    if (!("activo" in data) || data.activo !== true) update.activo = true;

    if (Object.keys(update).length > 0) {
      await db.collection("usuarios").doc(doc.id).update(update);
      countLocals++;
    }
  }
  console.log(`✅ ${countLocals} usuarios locales actualizados`);

  // 4️⃣ Normalizar empresas
  console.log("🏢 Normalizando empresas...");
  const empSnap = await db.collection("empresas").get();
  let countEmp = 0;
  for (const doc of empSnap.docs) {
    const data = doc.data();
    const update = {};
    if (!("estado" in data) || data.estado.trim() === "") update.estado = "activo";
    if (!("tipo" in data) || data.tipo.trim() === "") update.tipo = "enterprise";
    if (!data.nombre) update.nombre = "Taller Los Motores";
    if (!data.empresaId) update.empresaId = empresaIdDefault;

    if (Object.keys(update).length > 0) {
      await db.collection("empresas").doc(doc.id).update(update);
      countEmp++;
    }
  }
  console.log(`✅ ${countEmp} empresas actualizadas`);

  console.log("🎯 Migración completa: Firestore lista para ERP TallerPRO360");
}

// Ejecutar solo desde Node.js / Cloud
if (typeof window === "undefined") {
  migrarFirestore().catch(console.error);
}

export { migrarFirestore };