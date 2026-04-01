/**
 * /api/webhook-taller.js - El Automatizador Nexus-X 🚀
 * Propósito: Conciliación automática de pagos de clientes finales a talleres.
 */
import admin from "firebase-admin";

// Inicialización Robusta para Vercel (Private Key Fix)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Limpieza de caracteres de escape en la llave privada
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error("❌ Fallo Crítico: Firebase Admin no pudo iniciar:", error);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "NEXUS_ACCESS_DENIED" });

  try {
    // Normalización: Bold 2026 suele enviar el cuerpo en la raíz del body en Webhooks
    const evento = req.body; 
    
    // Extraemos los datos según el manual de Bold API
    const status = evento.status;
    const order_id = evento.order_id || evento.id;
    // Bold envía el monto como objeto, extraemos el total:
    const totalAmount = evento.amount?.total || evento.amount || 0; 
    
    // Buscamos la metadata (donde viajan tus IDs de TallerPRO360)
    const meta = evento.metadata || evento.extra_data || {};

    const aprobado = ["approved", "successful", "completed"].includes(status?.toLowerCase());

    // Validamos que existan los IDs mínimos para saber a qué taller abonar
    if (aprobado && meta.empresaId && meta.facturaId) {
      const { empresaId, facturaId, placa, clienteEmail } = meta;

      const batch = db.batch();

      // --- ACCIÓN A: FACTURACIÓN ---
      const finanzasRef = db.collection("empresas").doc(empresaId)
                            .collection("finanzas").doc(facturaId);
      
      batch.set(finanzasRef, {
        estado: "PAGADA",
        fechaPago: admin.firestore.FieldValue.serverTimestamp(),
        metodo: "Bold Online (Nexus-X)",
        recaudoId: order_id,
        montoRecibido: totalAmount,
        cliente: clienteEmail || "Sin definir",
        placa: placa || "N/A"
      }, { merge: true });

      // --- ACCIÓN B: LIBRO DIARIO ---
      const libroRef = db.collection("empresas").doc(empresaId)
                         .collection("contabilidad").doc();
      
      batch.set(libroRef, {
        fecha: admin.firestore.FieldValue.serverTimestamp(),
        concepto: `Recaudo Factura #${facturaId} | Placa: ${placa || 'N/A'}`,
        tipo: "ingreso",
        monto: totalAmount,
        referencia: order_id,
        categoria: "Venta de Servicios/Repuestos"
      });

      await batch.commit();

      console.log(`✅ Nexus-X: Recaudo procesado para Taller ${empresaId}. Total: ${totalAmount}`);
      return res.status(200).send("NEXUS_PROCESSED_OK");
    }

    return res.status(200).send("EVENT_RECEIVED_BUT_NOT_ACTIONABLE");

  } catch (error) {
    console.error("❌ Fallo en Webhook Taller:", error);
    return res.status(200).json({ status: "ERROR_LOGGED" });
  }
}
