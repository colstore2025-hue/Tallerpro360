import {
  doc,
  updateDoc,
  increment,
  addDoc,
  collection,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * 🔻 Descuenta stock cuando se usa en una orden
 */
export async function usarRepuesto({ repuestoId, cantidad, ordenId }) {

  const ref = doc(window.db, "repuestos", repuestoId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Repuesto no existe");
  }

  const data = snap.data();

  if (data.stock < cantidad) {
    throw new Error("Stock insuficiente");
  }

  // 🔻 Descontar stock
  await updateDoc(ref, {
    stock: increment(-cantidad)
  });

  // 🧾 Registrar movimiento
  await addDoc(collection(window.db, "movimientosInventario"), {
    repuestoId,
    tipo: "salida",
    cantidad,
    ordenId,
    fecha: new Date()
  });

  return data;
}