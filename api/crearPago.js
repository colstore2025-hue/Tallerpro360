import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "No autorizado" });

    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;
    const { planId } = req.body;

    // CONFIGURACIÓN MAESTRA DE PRECIOS
    const PLANES = {
      basico: { nombre: "Básico", precio: 49900, dias: 30 },
      pro: { nombre: "Pro", precio: 79900, dias: 30 },
      elite: { nombre: "Elite", precio: 129000, dias: 30 },
      enterprise: { nombre: "Enterprise", precio: 259000, dias: 30 },
      test: { nombre: "Prueba Sistema", precio: 1000, dias: 1 } // PARA TUS PRUEBAS
    };

    const planSelected = PLANES[planId];
    if (!planSelected) return res.status(400).json({ error: "Plan inválido" });

    const externalRef = `pago_${uid}_${Date.now()}`;

    const preference = {
      items: [{
        title: `TallerPRO360 · Plan ${planSelected.nombre}`,
        quantity: 1,
        currency_id: "COP",
        unit_price: planSelected.precio
      }],
      external_reference: externalRef,
      metadata: { uid, planId, precio: planSelected.precio },
      back_urls: {
        success: "https://tallerpro360.vercel.app/app/index.html?pago=exitoso",
        failure: "https://tallerpro360.vercel.app/app/index.html?pago=fallido"
      },
      auto_return: "approved",
      notification_url: "https://tallerpro360.vercel.app/api/webhookMP",
      statement_descriptor: "TALLERPRO360"
    };

    const mpResp = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify(preference)
    });

    const data = await mpResp.json();
    
    // Guardar registro en Firebase antes de ir a MercadoPago
    await db.collection("pagos").doc(externalRef).set({
      uid, planId, monto: planSelected.precio, estado: "pendiente", creadoEn: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({ init_point: data.init_point });
  } catch (error) {
    return res.status(500).json({ error: "Error en el servidor" });
  }
}
