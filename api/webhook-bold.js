/**
 * webhook-bold.js - TallerPRO360 V13.0.0 🚀
 * NEXUS-X STARLINK: Procesador Inteligente de Tiempo Dinámico
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

    // Protocolo de validación Bold (Aprobado)
    const estadosExitosos = ["approved", "successful", "completed"];
    
    if (estadosExitosos.includes(status?.toLowerCase())) {
      const batch = db.batch();

      // --- CASO A: ACTIVACIÓN DINÁMICA DE PLAN (1 a 12 meses) ---
      if (metadata && metadata.firebase_uid && metadata.plan_tipo) {
        const { firebase_uid, plan_tipo, meses_comprados } = metadata;
        
        // Convertimos meses a días (Si no llega meses_comprados por error, default a 30 días)
        const numeroDeMeses = parseInt(meses_comprados) || 1;
        const diasASumar = numeroDeMeses * 30;

        // Calculamos fecha de vencimiento: Si el plan está activo, sumamos a la fecha actual
        const vence = new Date();
        vence.setDate(vence.getDate() + diasASumar);

        const tallerRef = db.collection("talleres").doc(firebase_uid);
        batch.set(tallerRef, {
          planId: plan_tipo.toUpperCase(),
          estadoPlan: "ACTIVO",
          mesesContratados: numeroDeMeses,
          venceEn: admin.firestore.Timestamp.fromDate(vence),
          ultimaTransaccion: order_id,
          montoPago: amount,
          fechaUltimoPago: admin.firestore.FieldValue.serverTimestamp(),
          versionEngine: "13.0.0-DYNAMIC"
        }, { merge: true });
        
        console.log(`✅ Nexus-X: Activados ${diasASumar} días para taller ${firebase_uid}`);
      } 
      
      // --- CASO B: RECAUDO DE ORDEN DE SERVICIO (SE MANTIENE ESTABLE) ---
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
    console.error("❌ Fallo Crítico en Webhook:", error);
    return res.status(500).send("WEBHOOK_INTERNAL_ERROR");
  }
}
