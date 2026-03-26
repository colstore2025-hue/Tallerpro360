/**
 * webhook-bold.js - TallerPRO360 V11.5.0 🛰️
 * NEXUS-X STARLINK: Procesador Universal de Pagos (PRODUCCIÓN)
 */
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("NEXUS_DENIED");

  try {
    const payload = req.body.data || req.body; 
    const { status, order_id, metadata, amount } = payload;

    // Validación de estados según protocolo Bold Producción
    const estadosExitosos = ["approved", "successful", "completed"];
    
    if (estadosExitosos.includes(status?.toLowerCase())) {
      const batch = db.batch();

      // CASO A: Activación de Suscripción Nexus-X
      if (metadata && metadata.plan_tipo) {
        const { firebase_uid, plan_tipo, periodo } = metadata;
        const DIAS = { mensual: 30, trimestral: 90, semestral: 180, anual: 365 };
        const vence = new Date();
        vence.setDate(vence.getDate() + (DIAS[periodo] || 30));

        const tallerRef = db.collection("talleres").doc(firebase_uid);
        batch.set(tallerRef, {
          planId: plan_tipo.toUpperCase(),
          estadoPlan: "ACTIVO",
          venceEn: admin.firestore.Timestamp.fromDate(vence),
          ultimaTransaccion: order_id,
          fechaUltimoPago: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } 
      
      // CASO B: Recaudo de Orden de Servicio
      else if (metadata && metadata.empresaId && metadata.placa) {
        const { empresaId, placa, idOrden } = metadata;
        const ordenRef = db.collection("empresas").doc(empresaId).collection("ordenes").doc(idOrden);
        batch.update(ordenRef, {
          estado: "PAGADA",
          metodoPago: "BOLD_ONLINE",
          transaccionId: order_id,
          fechaPago: admin.firestore.FieldValue.serverTimestamp()
        });

        const contaRef = db.collection("empresas").doc(empresaId).collection("contabilidad").doc();
        batch.set(contaRef, {
          concepto: `Recaudo Bold Online - Placa ${placa}`,
          monto: amount,
          tipo: "ingreso",
          referencia: order_id,
          fecha: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      await batch.commit();
      return res.status(200).send("NEXUS_SYNC_OK");
    }

    return res.status(200).send("PAYMENT_PENDING");

  } catch (error) {
    console.error("❌ Fallo en Webhook:", error);
    return res.status(500).send("WEBHOOK_INTERNAL_ERROR");
  }
}
