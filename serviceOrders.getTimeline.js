// serviceOrders.getTimeline.js
import { db } from "./firebase-config.js";
import {
  doc,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function getServiceTimeline(orderId) {
  const stagesRef = collection(
    doc(db, "serviceOrders", orderId),
    "stages"
  );

  const q = query(stagesRef, orderBy("at", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => doc.data());
}