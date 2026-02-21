// ordenes.getTimeline.js

import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function getServiceTimeline(empresaId, ordenId) {

  const ordenRef = doc(db, "talleres", empresaId, "ordenes", ordenId);

  const snap = await getDoc(ordenRef);

  if (!snap.exists()) {
    throw new Error("Orden no existe");
  }

  const data = snap.data();

  return data.timeline || [];
}