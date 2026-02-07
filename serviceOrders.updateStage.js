// serviceOrders.updateStage.js
import { db } from "./firebase-config.js";
import {
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  collection
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Cambia la etapa de una orden de servicio
 * @param {string} orderId - ID de la orden (TP360-CO-YYYY-XXXXXX)
 * @param {string} newStage - Nueva etapa del proceso
 * @param {string} userRole - quien hace el cambio (taller | sistema | admin)
 */
export async function updateServiceStage(orderId, newStage, userRole = "taller") {

  const orderRef = doc(db, "serviceOrders", orderId);

  // 1️⃣ Actualizar estado principal (rápido para UI)
  await updateDoc(orderRef, {
    status: newStage,
    updatedAt: serverTimestamp()
  });

  // 2️⃣ Guardar trazabilidad en subcolección
  const stageRef = doc(
    collection(orderRef, "stages"),
    newStage
  );

  await setDoc(stageRef, {
    stage: newStage,
    at: serverTimestamp(),
    by: userRole
  });

  // 3️⃣ (HOOK) Aquí luego se conecta voz, notificaciones, métricas
  console.log(`✔ Orden ${orderId} pasó a etapa ${newStage}`);
}