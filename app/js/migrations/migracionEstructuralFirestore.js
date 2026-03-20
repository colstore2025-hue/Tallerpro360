/**
 * migracionEstructuralFirestore.js
 * 🔥 MIGRA A ESTRUCTURA REAL PRO360
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({
  credential: applicationDefault()
});

const db = getFirestore();
const empresaId = "taller_001";

const colecciones = [
  "ordenes",
  "clientes",
  "repuestos",
  "inventario",
  "facturas"
];

async function migrarEstructura() {

  console.log("🚀 MIGRACIÓN ESTRUCTURAL PRO360");

  for (const col of colecciones) {

    console.log(`📦 Migrando ${col}`);

    const snap = await db.collection(col).get();

    for (const docSnap of snap.docs) {

      const data = docSnap.data();

      const newRef = db
        .collection("empresas")
        .doc(empresaId)
        .collection(col)
        .doc(docSnap.id);

      await newRef.set({
        ...data,
        empresaId,
        creadoEn: data.creadoEn || new Date()
      });

      console.log("✔ movido:", docSnap.id);
    }

  }

  console.log("🎯 MIGRACIÓN ESTRUCTURAL COMPLETA");
}

if (typeof window === "undefined") {
  migrarEstructura().catch(console.error);
}

export { migrarEstructura };