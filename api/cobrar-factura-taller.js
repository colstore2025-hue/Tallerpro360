/**
 * cobrar-factura-taller.js - TallerPRO360 🛰️
 * Este script permite que CADA TALLER cobre con SU PROPIA cuenta de Bold.
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
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const { empresaId, facturaId, monto, descripcion } = req.body;

  try {
    // 1. BUSCAR LAS LLAVES DEL TALLER EN FIRESTORE
    const empresaDoc = await db.collection("empresas").doc(empresaId).get();
    
    if (!empresaDoc.exists) {
      return res.status(404).json({ error: "Empresa no encontrada" });
    }

    const configBold = empresaDoc.data().configuracion?.bold;

    if (!configBold || !configBold.apiKey || !configBold.identity) {
      return res.status(400).json({ error: "El taller no ha configurado su pasarela Bold" });
    }

    // 2. GENERAR EL CHECKOUT CON LAS LLAVES DEL CLIENTE
    const boldResponse = await fetch("https://api.bold.co/v2/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": configBold.apiKey,      // Llave del Dueño del Taller
        "X-IDENTITY": configBold.identity    // Identidad del Dueño del Taller
      },
      body: JSON.stringify({
        amount: monto,
        currency: "COP",
        description: `Factura ${facturaId} - ${empresaDoc.data().nombre}`,
        order_id: `FACT-${facturaId}-${Date.now()}`,
        notification_url: "https://tallerpro360.vercel.app/api/webhook-taller",
        redirection_url: `https://tallerpro360.vercel.app/app/factura.html?id=${facturaId}&pago=exitoso`,
        metadata: {
          tipo_pago: "servicio_taller",
          facturaId: facturaId,
          empresaId: empresaId
        }
      })
    });

    const data = await boldResponse.json();
    return res.status(200).json({ url: data.payment_url || data.url });

  } catch (error) {
    console.error("Error cobro taller:", error);
    return res.status(500).json({ error: "Error conectando con la pasarela del taller" });
  }
}
