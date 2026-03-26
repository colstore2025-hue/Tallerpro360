/**
 * webhook-bold.js - TallerPRO360 V13.5.0 🚀
 * NEXUS-X STARLINK: Procesador Inteligente de Tiempo Dinámico y Recaudos
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

    // Solo procesamos transacciones exitosas
    const estadosExitosos = ["approved", "successful", "completed"];
    if (!estadosExitosos.includes(status?.toLowerCase())) {
      return res.status(200).send("PAYMENT_PENDING_OR_FAILED");
    }

    const batch = db.batch();

    // --- CASO A: ACTIVACIÓN DE SUSCRIPCIÓN NEXUS-X (Taller nos paga a nosotros) ---
    // Metadata enviada desde create-bold-checkout: { empresaId, planId, meses }
    if (metadata && metadata.empresaId && metadata.planId) {
      const { empresaId, planId, meses } = metadata;
      const numMeses = parseInt(meses) || 1;
      const diasASumar = numMeses * 30;

      const tallerRef = db.collection("empresas").doc(empresaId);
      const tallerDoc = await tallerRef.get();
      
      let fechaBase = new Date();
      
      // Si el plan ya existe y no ha vencido, sumamos el tiempo a la fecha de vencimiento actual
      if (tallerDoc.exists && tallerDoc.data().venceEn) {
        const actualVence = tallerDoc.data().venceEn.toDate();
        if (actualVence > fechaBase) {
          fechaBase = actualVence;
        }
      }

      const nuevaFechaVencimiento = new Date(fechaBase);
      nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + diasASumar);

      batch.set(tallerRef, {
        planActual: planId.toUpperCase(),
        estadoPlan: "ACTIVO",
        venceEn: admin.firestore.Timestamp.fromDate(nuevaFechaVencimiento),
        ultimaRenovacion: admin.firestore.FieldValue.serverTimestamp(),
        tracking: {
            ultimaTransaccionId: order_id,
            montoSuscripcion: amount
        },
        versionEngine: "13.5.0-STARLINK"
      }, { merge: true });

      console.log(`✅ Nexus-X: Suscripción extendida para ${empresaId}. Vence: ${nuevaFechaVencimiento}`);
    } 
    
    // --- CASO B: RECAUDO DE ORDEN DE SERVICIO (Cliente paga al taller) ---
    // Metadata enviada desde cobrar-factura-taller: { empresaId, facturaId, placa }
    else if (metadata && metadata.empresaId && metadata.facturaId) {
      const { empresaId, facturaId, placa } = metadata;
      
      // 1. Actualizar Factura/Orden
      // Nota: Ajusta 'finanzas' o 'ordenes' según tu sub-colección preferida
      const ordenRef = db.collection("empresas").doc(empresaId).collection("ordenes").doc(facturaId);
      
      batch.set(ordenRef, {
        pago: {
            estado: "PAGADA",
            metodo: "BOLD_ONLINE",
            monto: amount,
            transaccion: order_id,
            fecha: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });

      // 2. Registrar en Contabilidad/Caja automáticamente
      const contaRef = db.collection("empresas").doc(empresaId).collection("contabilidad").doc();
      batch.set(contaRef, {
        tipo: "ingreso",
        concepto: `Pago Online - Factura ${facturaId} (Placa: ${placa || 'N/A'})`,
        monto: amount,
        referencia: order_id,
        fecha: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Nexus-X: Recaudo procesado para Taller ${empresaId} - Orden ${facturaId}`);
    }

    await batch.commit();
    return res.status(200).send("NEXUS_SYNC_OK");

  } catch (error) {
    console.error("❌ Fallo Crítico en Webhook:", error);
    return res.status(500).send("WEBHOOK_INTERNAL_ERROR");
  }
}
