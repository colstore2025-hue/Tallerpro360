/**
 * /app/js/migrations/migracionFirestoreCompleta.js
 * Migración profesional Firestore - TallerPRO360
 * Limpia y unifica empresaId, roles, planes y estados
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Inicializar Firebase Admin (Cloud / GitHub Actions)
initializeApp({
  credential: applicationDefault()
});

const db = getFirestore();

// Configuración principal
const empresaIdDefault = "taller_001"; // ID principal de tu taller
const rolGlobalDefault = "superadmin";
const usuarioActivoDefault = true;
const planEstadoDefault = "activo";
const planTipoDefault = "enterprise";

// Colecciones a migrar
const coleccionesEmpresaId = ["ordenes", "repuestos", "facturas", "inventario", "gastos", "configuracion", "clientes", "empleados", "nomina", "movimientosInventario"];

const coleccionesUsuarios = ["usuariosGlobal", "usuarios"];

async function migrarEmpresaId() {
  console.log("🚀 Iniciando migración de empresaId...");

  for (const col of coleccionesEmpresaId) {
    console.log(`📂 Migrando colección: ${col}`);
    const snapshot = await db.collection(col).get();

    let count = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.empresaId || data.empresaId !== empresaIdDefault) {
        await doc.ref.update({ empresaId: empresaIdDefault });
        count++;
      }
    }
    console.log(`✅ ${count} documentos actualizados en ${col}`);
  }

  console.log("🎯 EmpresaId migrado correctamente en todas las colecciones");
}

async function migrarUsuarios() {
  console.log("👤 Migrando usuariosGlobal y usuarios...");

  for (const col of coleccionesUsuarios) {
    const snapshot = await db.collection(col).get();
    let count = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      let updateData = {};

      if (!data.empresaId || data.empresaId !== empresaIdDefault) updateData.empresaId = empresaIdDefault;
      if (!data.rolGlobal || data.rolGlobal === "") updateData.rolGlobal = rolGlobalDefault;
      if (data.activo !== true) updateData.activo = usuarioActivoDefault;

      if (Object.keys(updateData).length > 0) {
        await doc.ref.update(updateData);
        count++;
      }
    }

    console.log(`✅ ${count} usuarios actualizados en ${col}`);
  }

  console.log("🎯 Usuarios migrados correctamente");
}

async function migrarPlanes() {
  console.log("💳 Normalizando planes de empresas...");

  const snapshot = await db.collection("empresas").get();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    let updateData = {};

    // Normalizar estado empresa
    if (!data.estado || data.estado.trim() === "") updateData.estado = "activo";

    // Normalizar plan
    if (!data.plan) updateData.plan = { estado: planEstadoDefault, tipo: planTipoDefault, fechaInicio: Timestamp.now() };
    else {
      if (!data.plan.estado || data.plan.estado.trim() === "") updateData["plan.estado"] = planEstadoDefault;
      if (!data.plan.tipo || data.plan.tipo.trim() === "") updateData["plan.tipo"] = planTipoDefault;
      if (!data.plan.fechaInicio) updateData["plan.fechaInicio"] = Timestamp.now();
    }

    // EmpresaId
    if (!data.empresaId || data.empresaId !== empresaIdDefault) updateData.empresaId = empresaIdDefault;

    if (Object.keys(updateData).length > 0) {
      await doc.ref.update(updateData);
      count++;
    }
  }

  console.log(`✅ ${count} empresas normalizadas`);
}

async function main() {
  await migrarEmpresaId();
  await migrarUsuarios();
  await migrarPlanes();

  console.log("🎯 Migración Firestore completa. Todo listo para abrir ERP.");
}

main().catch(console.error);