import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  // MercadoPago a veces envía notificaciones que no son pagos (ej. merchant_order)
  if (req.body.type !== "payment") return res.status(200).send("ok");

  try {
    const paymentId = req.body.data.id;
    const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    const payment = await mpResp.json();

    if (payment.status === "approved") {
      const { uid, planId } = payment.metadata;
      const external_reference = payment.external_reference;

      // Definir días según plan
      const diasPlan = planId === 'test' ? 1 : 30;
      const vence = new Date();
      vence.setDate(vence.getDate() + diasPlan);

      const batch = db.batch();

      // 1. Activar Taller
      const tallerRef = db.collection("talleres").doc(uid);
      batch.set(tallerRef, {
        planId,
        estadoPlan: "ACTIVO",
        venceEn: admin.firestore.Timestamp.fromDate(vence),
        ultimoPago: paymentId
      }, { merge: true });

      // 2. Marcar Pago como Aprobado
      const pagoRef = db.collection("pagos").doc(external_reference);
      batch.update(pagoRef, {
        estado: "aprobado",
        paymentId: paymentId,
        fechaAprobado: admin.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();
    }
    return res.status(200).send("ok");
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).send("error");
  }
}
