/**
 * webhookBold.js - TallerPRO360 V11.0.0 🛰️
 * NEXUS-X STARLINK: Procesador Universal de Pagos (Suscripciones + Órdenes)
 */
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { status, order_id, metadata, amount } = req.body;

    // Procesamos solo pagos aprobados
    if (status === "approved" || status === "completed") {
      const batch = db.batch();

      // CASO A: Es una suscripción del dueño del taller (Nexus-X SaaS)
      if (metadata.plan_tipo) {
        const { firebase_uid, plan_tipo, periodo } = metadata;
        const DIAS = { mensual: 30, trimestral: 90, semestral: 180, anual: 365 };
        const vence = new Date();
        vence.setDate(vence.getDate() + (DIAS[periodo] || 30));

        const tallerRef = db.collection("talleres").doc(firebase_uid);
        batch.set(tallerRef, {
          planId: plan_tipo,
          estadoPlan: "ACTIVO",
          venceEn: admin.firestore.Timestamp.fromDate(vence),
          ultimaTransaccion: order_id
        }, { merge: true });
      } 
      
      // CASO B: Es el pago de una Orden de Servicio de un cliente (Terminal)
      else if (metadata.empresaId && metadata.placa) {
        const { empresaId, placa, idOrden } = metadata;
        const ordenRef = db.collection("empresas").doc(empresaId).collection("ordenes").doc(idOrden);
        
        batch.update(ordenRef, {
          estado: "PAGADA",
          metodoPago: "BOLD_ONLINE",
          transaccionId: order_id,
          fechaPago: admin.firestore.FieldValue.serverTimestamp()
        });

        // Registro en contabilidad automática
        const contaRef = db.collection("empresas").doc(empresaId).collection("contabilidad").doc();
        batch.set(contaRef, {
          concepto: `Recaudo Bold - Placa ${placa}`,
          monto: amount,
          tipo: "ingreso",
          fecha: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      await batch.commit();
    }

    return res.status(200).send("NEXUS_SYNC_OK");
  } catch (error) {
    return res.status(500).send("WEBHOOK_ERROR");
  }
}
