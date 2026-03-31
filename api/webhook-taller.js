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
  // Protocolo de seguridad: Solo aceptamos POST de Bold
  if (req.method !== "POST") {
    return res.status(405).json({ error: "NEXUS_ACCESS_DENIED" });
  }

  try {
    // Normalización del Payload (Bold envía datos en .data o raíz según versión)
    const evento = req.body.data || req.body;
    const { status, order_id, amount, metadata } = evento;

    // 1. FILTRO DE APROBACIÓN: Solo actuamos si el dinero entró.
    const aprobado = ["approved", "successful", "completed"].includes(status?.toLowerCase());

    if (aprobado && metadata && metadata.empresaId && metadata.facturaId) {
      const { empresaId, facturaId, placa, clienteEmail } = metadata;

      console.log(`📡 Nexus-X: Procesando recaudo para Taller ${empresaId} | Factura: ${facturaId}`);

      const batch = db.batch();

      // --- ACCIÓN A: MARCAR FACTURA COMO PAGADA ---
      const finanzasRef = db.collection("empresas").doc(empresaId)
                            .collection("finanzas").doc(facturaId);
      
      batch.set(finanzasRef, {
        estado: "PAGADA",
        fechaPago: admin.firestore.FieldValue.serverTimestamp(),
        metodo: "Bold Online",
        recaudoId: order_id,
        montoRecibido: amount,
        logistica: "AUTOMATICO_NEXUS_X"
      }, { merge: true });

      // --- ACCIÓN B: REGISTRO EN EL LIBRO DIARIO (CONTABILIDAD) ---
      const libroRef = db.collection("empresas").doc(empresaId)
                         .collection("contabilidad").doc();
      
      batch.set(libroRef, {
        fecha: admin.firestore.FieldValue.serverTimestamp(),
        concepto: `Recaudo Online: Factura #${facturaId} (Placa: ${placa || 'N/A'})`,
        tipo: "ingreso",
        monto: amount,
        referencia: order_id,
        canal: "PASARELA_BOLD"
      });

      // Ejecutar cambios en bloque para integridad total de datos
      await batch.commit();

      console.log(`✅ Conciliación Exitosa: Factura ${facturaId} del taller ${empresaId} CERRADA.`);
      return res.status(200).send("NEXUS_PROCESSED_OK");
    }

    return res.status(200).send("EVENT_RECEIVED_SKIPPED");

  } catch (error) {
    console.error("❌ Error en la Automatización Nexus-X:", error);
    // Respondemos 200 para evitar que Bold reintente infinitamente si es un error de lógica
    return res.status(200).json({ status: "ERROR_LOGGED", message: error.message });
  }
}
