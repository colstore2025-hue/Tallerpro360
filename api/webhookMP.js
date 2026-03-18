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

    if (req.method !== "POST") {
      return res.status(200).send("ok");
    }

    if (req.body.type !== "payment") {
      return res.status(200).send("ok");
    }

    const paymentId = req.body?.data?.id;

    if (!paymentId) {
      return res.status(200).send("ok");
    }

    // 🔍 Consultar pago real
    const mpResp = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      }
    );

    const payment = await mpResp.json();

    if (payment.status !== "approved") {
      return res.status(200).send("ok");
    }

    const { uid, planId, precio } = payment.metadata;

    // 🔒 Validar plan
    const planSnap = await db.collection("planes").doc(planId).get();

    if (!planSnap.exists) {
      return res.status(200).send("ok");
    }

    const plan = planSnap.data();

    // 🔒 Validar monto REAL
    if (Number(payment.transaction_amount) !== Number(plan.precio)) {
      console.error("Monto alterado");
      return res.status(200).send("ok");
    }

    const pagoRef = db.collection("pagos").doc(payment.external_reference);

    const pagoSnap = await pagoRef.get();

    // 🛑 Evitar duplicados
    if (pagoSnap.exists && pagoSnap.data().estado === "aprobado") {
      return res.status(200).send("ok");
    }

    const ahora = admin.firestore.Timestamp.now();

    const vence = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + plan.duracion_dias * 86400000)
    );

    // 🔥 ACTIVAR PLAN
    await db.collection("talleres").doc(uid).set({
      planId,
      planNombre: plan.nombre,
      estadoPlan: "ACTIVO",
      inicioPlan: ahora,
      venceEn: vence,
      metodoPago: "mercado_pago"
    }, { merge: true });

    // 💾 Guardar pago aprobado
    await pagoRef.set({
      uid,
      planId,
      monto: plan.precio,
      estado: "aprobado",
      paymentId,
      actualizadoEn: ahora
    }, { merge: true });

    return res.status(200).send("ok");

  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).send("error");
  }
}