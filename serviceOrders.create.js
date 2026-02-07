import { db } from "./firebase-config.js";
import {
  doc,
  setDoc,
  runTransaction,
  serverTimestamp,
  collection
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function createServiceOrder(data) {
  const counterRef = doc(db, "counters", "serviceOrders");

  return await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    const current = counterSnap.exists() ? counterSnap.data().current : 0;

    const next = current + 1;
    const year = new Date().getFullYear();
    const orderId = `TP360-CO-${year}-${String(next).padStart(6, "0")}`;

    const orderRef = doc(db, "serviceOrders", orderId);

    // Documento principal
    transaction.set(orderRef, {
      orderId,
      status: "INGRESO",
      createdAt: serverTimestamp(),
      ...data
    });

    // Subcolección de etapas (trazabilidad)
    const stageRef = doc(
      collection(orderRef, "stages"),
      "INGRESO"
    );

    transaction.set(stageRef, {
      stage: "INGRESO",
      at: serverTimestamp(),
      source: "system"
    });

    transaction.set(counterRef, { current: next });

    return orderId;
  });
}