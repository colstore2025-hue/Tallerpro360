/**
 * /api/webhook-bold.js - TallerPRO360 V13.5.0 🚀
 * NEXUS-X STARLINK: Procesador de Pagos y Notificaciones Automatizadas
 */
import admin from "firebase-admin";

// Inicialización de Firebase Admin para entornos Serverless
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
  if (req.method !== "POST") return res.status(405).send("NEXUS_DENIED");

  try {
    const payload = req.body.data || req.body; 
    const { status, order_id, metadata, amount } = payload;

    // Filtro de Seguridad: Solo procesar transacciones exitosas
    const estadosExitosos = ["approved", "successful", "completed", "accepted"];
    if (!estadosExitosos.includes(status?.toLowerCase())) {
      return res.status(200).send("PAYMENT_PENDING_OR_FAILED");
    }

    const batch = db.batch();

    // --- CASO A: ACTIVACIÓN / RENOVACIÓN DE SUSCRIPCIÓN DEL TALLER ---
    if (metadata && metadata.empresaId && metadata.planId) {
      const { empresaId, planId, meses } = metadata;
      const numMeses = parseInt(meses) || 1;
      const diasASumar = numMeses * 30;

      const tallerRef = db.collection("empresas").doc(empresaId);
      const tallerDoc = await tallerRef.get();
      
      let fechaBase = new Date();
      
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

      console.log(`✅ Suscripción Nexus-X: ${empresaId} extendida.`);
    } 
    
    // --- CASO B: RECAUDO DE ORDEN DE SERVICIO (Cliente paga al taller) ---
    else if (metadata && metadata.empresaId && metadata.facturaId) {
      const { empresaId, facturaId, placa } = metadata;
      
      // 1. Actualizar estado de la Orden
      const ordenRef = db.collection("empresas").doc(empresaId).collection("ordenes").doc(facturaId);
      batch.set(ordenRef, {
        pago: {
            estado: "PAGADA",
            metodo: "BOLD_ONLINE",
            monto: amount,
            referencia: order_id,
            fecha: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });

      // 2. Registro Contable Automático
      const contaRef = db.collection("empresas").doc(empresaId).collection("contabilidad").doc();
      batch.set(contaRef, {
        tipo: "ingreso",
        concepto: `Recaudo Bold: Factura ${facturaId} (Placa: ${placa || 'N/A'})`,
        monto: amount,
        referencia: order_id,
        fecha: admin.firestore.FieldValue.serverTimestamp(),
        origen: "AUTOMATICO_NEXUS"
      });

      // 3. DISPARADOR DE NOTIFICACIÓN WHATSAPP (Asíncrono)
      if (metadata.telefonoCliente) {
          // No usamos await aquí para no bloquear la respuesta al webhook si la API de mensajes tarda
          enviarNotificacionPago({
              telefono: metadata.telefonoCliente,
              cliente: metadata.nombreCliente || 'Usuario',
              taller: metadata.nombreEmpresa || 'Nuestro Taller',
              factura: facturaId,
              placa: placa,
              monto: amount
          }).catch(err => console.error("Error envío WhatsApp:", err));
      }

      console.log(`✅ Recaudo Nexus-X: Taller ${empresaId} - Factura ${facturaId}`);
    }

    await batch.commit();
    return res.status(200).send("NEXUS_SYNC_OK");

  } catch (error) {
    console.error("❌ Fallo Crítico Nexus-X:", error);
    return res.status(200).send("ERROR_LOGGED"); 
  }
}

/**
 * Función Auxiliar: Notificación de Pago vía WhatsApp
 * Formato "Tesla Style" para alta fidelidad de cliente
 */
async function enviarNotificacionPago(datos) {
    console.log(`[WHATSAPP]: Iniciando protocolo de envío a ${datos.telefono}`);

    const mensaje = `🚀 *NEXUS-X: PAGO CONFIRMADO*\n\n` +
                    `Hola *${datos.cliente}*,\n` +
                    `Hemos recibido con éxito el pago de tu servicio en *${datos.taller}*.\n\n` +
                    `📄 *ORDEN:* #${datos.factura}\n` +
                    `🚗 *PLACA:* ${datos.placa}\n` +
                    `💰 *MONTO:* $${datos.monto}\n` +
                    `✅ *ESTADO:* Pago Procesado / Orden Cerrada\n\n` +
                    `Tu vehículo cuenta con el respaldo digital de *TallerPRO360*. ¡Gracias por tu confianza!`;

    // Implementación de Fetch para tu API de WhatsApp seleccionada
    // Sustituir URL y TOKEN según tu proveedor (Twilio, Evolution API, etc.)
    /*
    await fetch('https://TU_API_WHATSAPP/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer TU_TOKEN' },
        body: JSON.stringify({
            number: datos.telefono,
            message: mensaje
        })
    });
    */
    
    return true;
}
