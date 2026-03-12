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

  try {

    const paymentId = req.query["data.id"];

    if (!paymentId) {
      return res.status(200).send("ok");
    }

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      }
    );

    const payment = await response.json();

    if (payment.status !== "approved") {
      return res.status(200).send("ok");
    }

    const { uid, planId } = payment.metadata;

    const planSnap = await db.collection("planes").doc(planId).get();

    if (!planSnap.exists) {
      return res.status(200).send("ok");
    }

    const plan = planSnap.data();

    const ahora = admin.firestore.Timestamp.now();

    const vence = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + plan.duracion_dias * 86400000)
    );

    await db.collection("talleres").doc(uid).set(
      {
        planId,
        planNombre: plan.nombre,
        estadoPlan: "ACTIVO",
        inicioPlan: ahora,
        venceEn: vence,
        metodoPago: "mercado_pago",
        alertas: {
          d7: false,
          d3: false,
          d1: false
        }
      },
      { merge: true }
    );

    await db.collection("pagos").add({
      uid,
      planId,
      monto: plan.precio,
      estado: "aprobado",
      metodo: "mercado_pago",
      creadoEn: ahora
    });

    res.status(200).send("ok");

  } catch (error) {

    console.error(error);
    res.status(500).send("error");

  }

}