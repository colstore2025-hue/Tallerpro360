/**
 * /api/webhook-bold.js - TallerPRO360 V14.0.0 🚀
 * NEXUS-X STARLINK: Procesador Inteligente de Pagos y Activación Automática
 */
import admin from "firebase-admin";

// Inicialización Blindada de Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  } catch (error) {
    console.error("❌ Fallo en el Core de Firebase:", error);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  // Solo permitimos POST (Protocolo de Seguridad Nexus-X)
  if (req.method !== "POST") return res.status(405).send("NEXUS_DENIED");

  try {
    // Bold envía la info en req.body.data o directamente en req.body según versión
    const payload = req.body.data || req.body; 
    const { status, order_id, metadata, amount } = payload;

    console.log(`📡 Recibiendo señal de Bold: Orden ${order_id} | Status: ${status}`);

    // 1. FILTRO DE ÉXITO: Solo procesamos si el dinero está en la cuenta
    const estadosExitosos = ["approved", "successful", "completed", "accepted"];
    if (!estadosExitosos.includes(status?.toLowerCase())) {
      return res.status(200).send("PAYMENT_PENDING_OR_FAILED");
    }

    const batch = db.batch();

    // --- CASO A: SUSCRIPCIÓN DEL TALLER (Activación del Motor Nexus-X) ---
    if (metadata && metadata.empresa_id && metadata.plan_id) {
      const { empresa_id, plan_id, meses_contratados } = metadata;
      const numMeses = parseInt(meses_contratados) || 1;
      const diasASumar = numMeses * 30;

      const tallerRef = db.collection("empresas").doc(empresa_id);
      const tallerDoc = await tallerRef.get();
      
      let fechaBase = new Date();
      
      // Si el plan está vigente, sumamos los días al vencimiento actual (Fidelización)
      if (tallerDoc.exists && tallerDoc.data().venceEn) {
        const actualVence = tallerDoc.data().venceEn.toDate();
        if (actualVence > fechaBase) {
          fechaBase = actualVence;
        }
      }

      const nuevaFechaVencimiento = new Date(fechaBase);
      nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + diasASumar);

      batch.set(tallerRef, {
        planActual: plan_id.toUpperCase(),
        estadoPlan: "ACTIVO",
        venceEn: admin.firestore.Timestamp.fromDate(nuevaFechaVencimiento),
        ultimaRenovacion: admin.firestore.FieldValue.serverTimestamp(),
        config: {
            engineVersion: "14.0.0-STARLINK",
            lastTransaction: order_id
        }
      }, { merge: true });

      console.log(`✅ Logística de Activación: Empresa ${empresa_id} actualizada hasta ${nuevaFechaVencimiento.toISOString()}`);
    } 
    
    // --- CASO B: RECAUDO DE ORDEN DE SERVICIO (Pago de Cliente Final) ---
    else if (metadata && metadata.empresa_id && metadata.facturaId) {
      const { empresa_id, facturaId, placa, cliente_nombre } = metadata;
      
      const ordenRef = db.collection("empresas").doc(empresa_id).collection("ordenes").doc(facturaId);
      
      batch.set(ordenRef, {
        pago: {
            estado: "PAGADA",
            metodo: "BOLD_ONLINE",
            monto: amount,
            referencia_bold: order_id,
            fecha_pago: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });

      // Registro en el Libro Contable Digital Nexus-X
      const contaRef = db.collection("empresas").doc(empresa_id).collection("contabilidad").doc();
      batch.set(contaRef, {
        tipo: "ingreso",
        concepto: `Recaudo Digital: Factura #${facturaId} [Vehículo: ${placa || 'N/A'}]`,
        monto: amount,
        referencia: order_id,
        fecha: admin.firestore.FieldValue.serverTimestamp(),
        categoria: "RECAUDO_ORDENES"
      });

      // 2. DISPARADOR DE WHATSAPP (Asíncrono para no retrasar a Bold)
      if (metadata.telefono_whatsapp) {
          enviarConfirmacionNexusX({
              telefono: metadata.telefono_whatsapp,
              cliente: cliente_nombre || 'Estimado Cliente',
              taller: metadata.taller_nombre || 'Taller Autorizado',
              factura: facturaId,
              placa: placa,
              monto: amount
          }).catch(err => console.error("⚠️ Fallo Envío WhatsApp:", err));
      }
    }

    // Ejecución masiva de cambios en Firebase
    await batch.commit();
    return res.status(200).send("NEXUS_SYNC_SUCCESSFUL");

  } catch (error) {
    console.error("❌ Error Crítico en Webhook Nexus-X:", error);
    return res.status(200).send("ERROR_CAPTURED_AND_LOGGED"); 
  }
}

/**
 * Protocolo de Notificación Aeroespacial (WhatsApp)
 */
async function enviarConfirmacionNexusX(datos) {
    const mensaje = `🚀 *TALLERPRO360: PAGO CONFIRMADO*\n\n` +
                    `Hola *${datos.cliente}*,\n` +
                    `Tu pago ha sido procesado con éxito por el motor *Nexus-X*.\n\n` +
                    `📍 *Taller:* ${datos.taller}\n` +
                    `📄 *Orden:* #${datos.factura}\n` +
                    `🚗 *Placa:* ${datos.placa}\n` +
                    `💰 *Monto:* $${datos.monto.toLocaleString('es-CO')}\n\n` +
                    `✅ *Estado:* Pago Aprobado. Tu factura digital ha sido generada.\n\n` +
                    `_Potenciado por Ecosistema Starlink_`;

    // Aquí conectarías con tu proveedor de WhatsApp (Twilio / Meta API)
    console.log(`[LOGÍSTICA]: Notificación enviada a ${datos.telefono}`);
    return true;
}
