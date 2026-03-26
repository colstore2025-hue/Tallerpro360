/**
 * webhook-taller.js - El Automatizador
 * Escucha cuando un cliente le paga a un taller y actualiza Firestore.
 */

import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const evento = req.body;

  // Solo procesamos si el pago fue exitoso
  if (evento.status === "approved" || evento.data?.status === "approved") {
    const { facturaId, empresaId } = evento.data?.metadata || evento.metadata;

    try {
      // MARCAR FACTURA COMO PAGADA
      await db.collection("empresas").doc(empresaId)
              .collection("finanzas").doc(facturaId)
              .update({
                estado: "pagada",
                fechaPago: admin.firestore.Timestamp.now(),
                metodo: "Bold Online"
              });

      console.log(`✅ Factura ${facturaId} del taller ${empresaId} PAGADA.`);
      return res.status(200).send("OK");
    } catch (e) {
      console.error("Error actualizando factura:", e);
      return res.status(500).send("Error");
    }
  }

  return res.status(200).send("Evento recibido pero no procesado");
}
