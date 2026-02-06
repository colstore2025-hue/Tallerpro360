// serviceOrders.create.js
import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  setDoc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function createServiceOrder(data) {
  const counterRef = doc(db, "counters", "serviceOrders");

  return await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);

    let current = 0;
    if (counterSnap.exists()) {
      current = counterSnap.data().current;
    }

    const next = current + 1;
    const year = new Date().getFullYear();
    const orderId = `TP360-CO-${year}-${String(next).padStart(6, "0")}`;

    const orderRef = doc(db, "serviceOrders", orderId);

    transaction.set(orderRef, {
      orderId,
      status: "INGRESO",
      createdAt: serverTimestamp(),
      history: [{
        stage: "INGRESO",
        at: new Date().toISOString()
      }],
      ...data
    });

    transaction.set(counterRef, { current: next });

    return orderId;
  });
}