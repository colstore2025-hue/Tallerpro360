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

    const planSnap = await db.collection("planes").doc(planId).get();

    if (!planSnap.exists) {
      return res.status(404).json({ error: "Plan no existe" });
    }

    const plan = planSnap.data();

    const preference = {
      items: [
        {
          title: `TallerPRO360 · ${plan.nombre}`,
          quantity: 1,
          currency_id: "COP",
          unit_price: plan.precio
        }
      ],
      metadata: {
        uid,
        planId
      },
      back_urls: {
        success: "https://tallerpro360.com/pago-exitoso.html",
        failure: "https://tallerpro360.com/pago-fallido.html",
        pending: "https://tallerpro360.com/pago-pendiente.html"
      },
      auto_return: "approved",
      notification_url:
        "https://tallerpro360.vercel.app/api/webhookMP"
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

    res.status(200).json({
      init_point: data.init_point
    });

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: true });

  }

}