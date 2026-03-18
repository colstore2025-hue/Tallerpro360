import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    )
  });
}

const db = admin.firestore();

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  try {

    // 🔐 VALIDAR TOKEN FIREBASE
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: "planId faltante" });
    }

    // 🔍 Buscar plan
    const planSnap = await db.collection("planes").doc(planId).get();

    if (!planSnap.exists) {
      return res.status(404).json({ error: "Plan no existe" });
    }

    const plan = planSnap.data();

    // 🔥 ID único para evitar duplicados
    const externalRef = `pago_${uid}_${Date.now()}`;

    const preference = {
      items: [
        {
          title: `TallerPRO360 · ${plan.nombre}`,
          quantity: 1,
          currency_id: "COP",
          unit_price: Number(plan.precio)
        }
      ],

      external_reference: externalRef,

      metadata: {
        uid,
        planId,
        precio: plan.precio
      },

      back_urls: {
        success: "https://tallerpro360.com/pago-exitoso.html",
        failure: "https://tallerpro360.com/pago-fallido.html",
        pending: "https://tallerpro360.com/pago-pendiente.html"
      },

      auto_return: "approved",

      notification_url:
        "https://tallerpro360.vercel.app/api/webhookMP",

      statement_descriptor: "TallerPRO360"
    };

    const mpResp = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
        },
        body: JSON.stringify(preference)
      }
    );

    const data = await mpResp.json();

    if (!data.init_point) {
      console.error(data);
      return res.status(500).json({ error: "Error MercadoPago" });
    }

    // 💾 Guardar intento de pago
    await db.collection("pagos").doc(externalRef).set({
      uid,
      planId,
      estado: "pendiente",
      creadoEn: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({
      init_point: data.init_point
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno" });
  }
}