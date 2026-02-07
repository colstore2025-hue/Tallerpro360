// serviceOrders.updateStage.js
import { db } from "./firebase-config.js";
import {
  doc,
  updateDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Actualiza la etapa de una orden de servicio
 * Mantiene trazabilidad completa y prepara hooks futuros
 *
 * @param {string} orderId - TP360-CO-YYYY-XXXXXX
 * @param {string} newStage - Etapa del proceso
 * @param {string} userRole - taller | sistema | admin
 */
export async function updateServiceStage(
  orderId,
  newStage,
  userRole = "taller"
) {
  if (!orderId || !newStage) {
    throw new Error("orderId y newStage son obligatorios");
  }

  const orderRef = doc(db, "serviceOrders", orderId);

  // 1️⃣ Verificar que la orden exista
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) {
    throw new Error(`La orden ${orderId} no existe`);
  }

  const orderData = orderSnap.data();

  // 2️⃣ Evitar reescribir la misma etapa
  if (orderData.status === newStage) {
    console.warn(`ℹ La orden ya está en la etapa ${newStage}`);
    return;
  }

  // 3️⃣ Actualizar estado principal (rápido para UI)
  await updateDoc(orderRef, {
    status: newStage,
    updatedAt: serverTimestamp(),
    lastChangedBy: userRole
  });

  // 4️⃣ Guardar trazabilidad (evento inmutable)
  const stageRef = doc(
    collection(orderRef, "stages")
  );

  await setDoc(stageRef, {
    stage: newStage,
    at: serverTimestamp(),
    by: userRole,
    previousStage: orderData.status || null
  });

  // 5️⃣ HOOKS FUTUROS (NO BORRAR)
  // voiceHook(orderId, newStage)
  // notifyClient(orderId, newStage)
  // metricsHook(orderId, newStage)

  console.log(
    `✔ [TP360] Orden ${orderId} pasó de ${orderData.status} a ${newStage}`
  );
}