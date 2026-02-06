// serviceOrders.updateStage.js
import { db } from "./firebase-config.js";
import {
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function updateServiceStage(orderId, stage, user) {
  const ref = doc(db, "serviceOrders", orderId);

  await updateDoc(ref, {
    status: stage,
    history: arrayUnion({
      stage,
      user,
      at: new Date().toISOString()
    }),
    updatedAt: serverTimestamp()
  });
}