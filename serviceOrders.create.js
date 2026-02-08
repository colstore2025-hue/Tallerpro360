import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const db = getFirestore();

export async function crearOrden(data) {
  const counterRef = doc(db, "counters", "serviceOrders");
  const counterSnap = await getDoc(counterRef);

  let current = counterSnap.exists() ? counterSnap.data().current : 0;
  current++;

  const codigo = `TP360-CO-2026-${String(current).padStart(6, "0")}`;

  const ordenRef = doc(db, "ordenes", codigo);

  await setDoc(ordenRef, {
    codigo,
    ...data,
    estado: "INGRESO",
    timeline: [
      { estado: "INGRESO", fecha: serverTimestamp() }
    ],
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp()
  });

  await updateDoc(counterRef, { current });

  return codigo;
}