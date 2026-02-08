const functions = require("firebase-functions");
const admin = require("firebase-admin");
const mercadopago = require("mercadopago");

admin.initializeApp();
const db = admin.firestore();

/* ===============================
   CONFIG MERCADO PAGO
================================ */
mercadopago.configure({
  access_token: functions.config().mp.token
});

/* ===============================
   1️⃣ CREAR PAGO (Callable)
================================ */
exports.crearPago = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Usuario no autenticado"
    );
  }

  const { planId } = data;
  const uid = context.auth.uid;
  const email = context.auth.token.email;

  // 🔎 Buscar plan
  const planRef = db.collection("planes").doc(planId);
  const planSnap = await planRef.get();

  if (!planSnap.exists || !planSnap.data().activo) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Plan inválido o inactivo"
    );
  }

  const plan = planSnap.data();

  const preference = {
    items: [{
      title: `TallerPRO360 · ${plan.nombre}`,
      quantity: 1,
      currency_id: "COP",
      unit_price: plan.precio
    }],
    payer: { email },
    metadata: { uid, planId },
    auto_return: "approved",
    back_urls: {
      success: "https://tallerpro360.com/pago-exitoso.html",
      failure: "https://tallerpro360.com/pago-fallido.html",
      pending: "https://tallerpro360.com/pago-pendiente.html"
    },
    notification_url:
      "https://us-central1-tallerpro360.cloudfunctions.net/webhookMP"
  };

  const resp = await mercadopago.preferences.create(preference);
  return { init_point: resp.body.init_point };
});

/* ===============================
   2️⃣ WEBHOOK MERCADO PAGO
================================ */
exports.webhookMP = functions.https.onRequest(async (req, res) => {
  try {
    const paymentId = req.query["data.id"];
    if (!paymentId) return res.sendStatus(200);

    const payment = await mercadopago.payment.findById(paymentId);
    const data = payment.body;

    if (data.status !== "approved") return res.sendStatus(200);

    const { uid, planId } = data.metadata;

    const planSnap = await db.collection("planes").doc(planId).get();
    if (!planSnap.exists) return res.sendStatus(200);

    const plan = planSnap.data();

    const ahora = admin.firestore.Timestamp.now();
    const vence = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + plan.duracion_dias * 86400000)
    );

    // 🔥 ACTIVACIÓN AUTOMÁTICA SaaS
    await db.collection("talleres").doc(uid).set({
      planId,
      planNombre: plan.nombre,
      estadoPlan: "ACTIVO",
      inicioPlan: ahora,
      venceEn: vence,
      metodoPago: "mercado_pago",
      diasRestantes: plan.duracion_dias,
      alertas: { d7: false, d3: false, d1: false }
    }, { merge: true });

    // Log contable
    await db.collection("pagos").add({
      uid,
      planId,
      monto: plan.precio,
      estado: "aprobado",
      metodo: "mercado_pago",
      creadoEn: ahora
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});