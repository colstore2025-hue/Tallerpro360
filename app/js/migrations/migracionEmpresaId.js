/**
 * /app/js/migrations/migracionEmpresaId.js
 * Migración Firestore: asegura que todos los documentos tengan empresaId
 * Compatible para ejecutar desde app web con Admin SDK o entorno cloud
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Inicializar Firebase Admin (Cloud / GitHub Actions)
initializeApp({
  credential: applicationDefault()
});

const db = getFirestore();

// Cambiar por la empresaId de tu taller
const empresaIdDefault = "ID_EMPRESA_TALLER360";

// Colecciones a migrar
const colecciones = ["ordenes", "repuestos", "facturas", "inventario", "gastos", "configuracion"];

export async function migrarEmpresaId() {
  console.log("🚀 Iniciando migración de empresaId...");

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

  console.log("🎯 Migración completada: todos los documentos ahora tienen empresaId");
}

// Solo ejecutar si se llama directamente (modo testing en web cloud)
if (typeof window === "undefined") {
  migrarEmpresaId().catch(console.error);
}