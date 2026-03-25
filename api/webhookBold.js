/**
 * webhookBold.js - TallerPRO360 V10.6.5 🛰️
 * Escucha las confirmaciones de Bold y activa los planes en Firebase.
 */
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  // Bold envía un POST cuando cambia el estado de una transacción
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { status, order_id, metadata } = req.body;

    // Solo procesamos si el pago fue exitoso (COMPLETED)
    if (status === "approved" || status === "completed") {
      const { firebase_uid, plan_tipo, periodo } = metadata;

      // Definición de días según el periodo elegido
      const DIAS = { mensual: 30, trimestral: 90, semestral: 180, anual: 365 };
      const diasAAgregar = DIAS[periodo] || 30;

      const vence = new Date();
      vence.setDate(vence.getDate() + diasAAgregar);

      const batch = db.batch();

      // 1. Activar o Renovación del Taller
      const tallerRef = db.collection("talleres").doc(firebase_uid);
      batch.set(tallerRef, {
        planId: plan_tipo,
        periodo: periodo,
        estadoPlan: "ACTIVO",
        venceEn: admin.firestore.Timestamp.fromDate(vence),
        ultimaTransaccion: order_id,
        actualizadoEn: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // 2. Registrar el pago en el historial global
      const pagoRef = db.collection("pagos_suscripciones").doc(order_id);
      batch.set(pagoRef, {
        uid: firebase_uid,
        plan: plan_tipo,
        monto: req.body.amount,
        estado: "aprobado",
        fecha: admin.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();
      console.log(`✅ Plan ${plan_tipo} activado para el usuario ${firebase_uid}`);
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    return res.status(500).send("Internal Server Error");
  }
}
