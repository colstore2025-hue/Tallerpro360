/**
 * inventarioService.js
 * Gestión de inventario PRO360
 */

import {
  doc,
  updateDoc,
  increment,
  addDoc,
  collection
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function usarRepuesto({ repuestoId, cantidad, ordenId, empresaId }) {

  if (!empresaId) throw new Error("empresaId requerido");

  const base = `empresas/${empresaId}`;

  try {

    await updateDoc(
      doc(window.db, `${base}/repuestos`, repuestoId),
      {
        stock: increment(-cantidad)
      }
    );

    await addDoc(
      collection(window.db, `${base}/movimientosInventario`),
      {
        repuestoId,
        cantidad,
        tipo: "salida",
        ordenId: ordenId || null,
        fecha: new Date()
      }
    );

    console.log("✅ Repuesto usado correctamente");

  } catch (e) {
    console.error("❌ Error usando repuesto:", e);
    throw e;
  }
}