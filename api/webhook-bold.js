/**
 * /api/webhook-bold.js - TallerPRO360 V13.5.0 🚀
 * Ajustado para Vercel Serverless & Firebase Admin
 */
import admin from "firebase-admin";

// Inicialización ultra-segura para Vercel
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  } catch (error) {
    console.error("❌ Error inicializando Firebase Admin:", error);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  // Solo permitimos POST desde Bold
  if (req.method !== "POST") return res.status(405).send("NEXUS_DENIED");

  try {
    // Bold a veces envía la data dentro de un objeto 'data' o directo en el body
    const payload = req.body.data || req.body; 
    const { status, order_id, metadata, amount } = payload;

    // 1. Filtro de Seguridad: Solo estados de éxito
    const estadosExitosos = ["approved", "successful", "completed", "accepted"];
    if (!estadosExitosos.includes(status?.toLowerCase())) {
      console.log(`[LOG]: Pago ${order_id} en estado ${status}. No se requiere acción.`);
      return res.status(200).send("PAYMENT_PENDING_OR_FAILED");
    }

    const batch = db.batch();

    // --- CASO A: ACTIVACIÓN / RENOVACIÓN DE SUSCRIPCIÓN DEL TALLER ---
    if (metadata && metadata.empresaId && metadata.planId) {
      const { empresaId, planId, meses } = metadata;
      const numMeses = parseInt(meses) || 1;
      const diasASumar = numMeses * 30;

      // Importante: Referencia a la colección 'empresas'
      const tallerRef = db.collection("empresas").doc(empresaId);
      const tallerDoc = await tallerRef.get();
      
      let fechaBase = new Date();
      
      // Lógica de Tiempo Dinámico: Si aún tiene días, se le suman a los que ya tiene
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
            montoSuscripcion: amount,
            statusBold: status
        },
        versionEngine: "13.5.0-STARLINK"
      }, { merge: true });

      console.log(`✅ Suscripción Activa: ${empresaId} hasta ${nuevaFechaVencimiento}`);
    } 
    
    // --- CASO B: RECAUDO DE ORDEN DE SERVICIO (Cliente paga al taller) ---
    else if (metadata && metadata.empresaId && metadata.facturaId) {
      const { empresaId, facturaId, placa } = metadata;
      
      // 1. Marcamos la Orden como PAGADA
      const ordenRef = db.collection("empresas").doc(empresaId).collection("ordenes").doc(facturaId);
      
      batch.set(ordenRef, {
        pago: {
            estado: "PAGADA",
            metodo: "BOLD_ONLINE",
            monto: amount,
            referencia_bold: order_id,
            fecha_pago: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });

      // 2. Inyectamos el ingreso en el Libro Contable del Taller
      const contaRef = db.collection("empresas").doc(empresaId).collection("contabilidad").doc();
      batch.set(contaRef, {
        tipo: "ingreso",
        concepto: `Recaudo Bold: Factura ${facturaId} (Placa: ${placa || 'N/A'})`,
        monto: amount,
        referencia: order_id,
        fecha: admin.firestore.FieldValue.serverTimestamp(),
        origen: "AUTOMATICO_NEXUS"
      });

      console.log(`✅ Recaudo Exitoso: Taller ${empresaId} - Factura ${facturaId}`);
    }

    // Ejecutamos todos los cambios en un solo movimiento atómico
    await batch.commit();
    return res.status(200).send("NEXUS_SYNC_OK");

  } catch (error) {
    console.error("❌ Fallo Crítico en Webhook:", error);
    // Respondemos 200 para que Bold no siga reintentando si es un error de lógica nuestro
    return res.status(200).send("ERROR_BUT_LOGGED"); 
  }
}
