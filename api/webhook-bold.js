/**
 * webhook-bold.js - TallerPRO360 V11.5.0 🛰️
 * NEXUS-X STARLINK: Procesador Universal de Pagos
 * Ubicación: /api/webhook-bold.js
 */
import admin from "firebase-admin";

// Inicialización Segura de Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  // 1. Solo permitimos POST
  if (req.method !== "POST") return res.status(405).send("NEXUS_DENIED");

  try {
    // 2. Extracción de datos según el formato Real de Bold
    // Bold suele enviar la info dentro de req.body.data
    const payload = req.body.data || req.body; 
    const { status, order_id, metadata, amount } = payload;

    // 3. Filtro de Seguridad: Solo procesamos si el pago fue exitoso
    // Bold usa 'approved', 'successful' o 'completed' según la versión
    const estadosExitosos = ["approved", "successful", "completed"];
    
    if (estadosExitosos.includes(status?.toLowerCase())) {
      const batch = db.batch();

      // --- LÓGICA DE ENGRANAJE NEXUS-X ---

      // CASO A: Suscripción de Dueño de Taller (SaaS)
      // Identificamos por 'plan_tipo' en los metadatos
      if (metadata && metadata.plan_tipo) {
        const { firebase_uid, plan_tipo, periodo } = metadata;
        
        const DIAS = { mensual: 30, trimestral: 90, semestral: 180, anual: 365 };
        const vence = new Date();
        vence.setDate(vence.getDate() + (DIAS[periodo] || 30));

        // Actualizamos el documento del taller para activar funciones
        const tallerRef = db.collection("talleres").doc(firebase_uid);
        batch.set(tallerRef, {
          planId: plan_tipo.toUpperCase(),
          estadoPlan: "ACTIVO",
          venceEn: admin.firestore.Timestamp.fromDate(vence),
          ultimaTransaccion: order_id,
          fechaUltimoPago: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log(`✅ Plan ${plan_tipo} activado para UID: ${firebase_uid}`);
      } 
      
      // CASO B: Recaudo de Orden de Servicio (Terminal de Clientes)
      // Identificamos por 'empresaId' y 'placa'
      else if (metadata && metadata.empresaId && metadata.placa) {
        const { empresaId, placa, idOrden } = metadata;
        
        // 1. Actualizar la Orden de Servicio
        const ordenRef = db.collection("empresas").doc(empresaId).collection("ordenes").doc(idOrden);
        batch.update(ordenRef, {
          estado: "PAGADA",
          metodoPago: "BOLD_ONLINE",
          transaccionId: order_id,
          fechaPago: admin.firestore.FieldValue.serverTimestamp()
        });

        // 2. Registro en Contabilidad Automática (Ingresos)
        const contaRef = db.collection("empresas").doc(empresaId).collection("contabilidad").doc();
        batch.set(contaRef, {
          concepto: `Recaudo Bold Online - Placa ${placa}`,
          monto: amount,
          tipo: "ingreso",
          referencia: order_id,
          fecha: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Contabilidad sincronizada para Placa: ${placa}`);
      }

      // Ejecución atómica de todos los cambios
      await batch.commit();
      return res.status(200).send("NEXUS_SYNC_OK");
    }

    // Si el pago no fue aprobado, informamos pero no fallamos
    return res.status(200).send("PAYMENT_PENDING_OR_REJECTED");

  } catch (error) {
    console.error("❌ Error en Webhook Nexus-X:", error);
    return res.status(500).send("WEBHOOK_INTERNAL_ERROR");
  }
}
