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

    const { uid, planId } = req.body;

    if (!uid || !planId) {
      return res.status(400).json({ error: "uid o planId faltante" });
    }

    // Buscar plan en Firestore
    const planSnap = await db.collection("planes").doc(planId).get();

    if (!planSnap.exists) {
      return res.status(404).json({ error: "Plan no existe" });
    }

    const plan = planSnap.data();

    // Crear preferencia de pago
    const preference = {
      items: [
        {
          title: `TallerPRO360 · ${plan.nombre}`,
          quantity: 1,
          currency_id: "COP",
          unit_price: Number(plan.precio)
        }
      ],

      metadata: {
        uid: uid,
        planId: planId
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

    const response = await fetch(
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

    const data = await response.json();

    if (!data.init_point) {
      console.error("Error creando preferencia:", data);
      return res.status(500).json({
        error: "No se pudo crear el pago"
      });
    }

    return res.status(200).json({
      init_point: data.init_point
    });

  } catch (error) {

    console.error("crearPago error:", error);

    return res.status(500).json({
      error: "Error interno"
    });

  }

}