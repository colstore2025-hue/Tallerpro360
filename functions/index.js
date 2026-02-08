const functions = require("firebase-functions");
const admin = require("firebase-admin");
const mercadopago = require("mercadopago");

admin.initializeApp();

// Configuración Mercado Pago (TOKEN OCULTO)
mercadopago.configure({
  access_token: functions.config().mp.token
});

/**
 * CREA EL PAGO (Checkout)
 */
exports.crearPago = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Usuario no autenticado"
    );
  }

  const { plan, precio } = data;
  const uid = context.auth.uid;
  const email = context.auth.token.email;

  const preference = {
    items: [
      {
        title: `TallerPRO360 - Plan ${plan}`,
        quantity: 1,
        currency_id: "COP",
        unit_price: precio
      }
    ],
    payer: { email },
    metadata: { uid, plan },
    back_urls: {
      success: "https://tudominio.com/pago-exitoso.html",
      failure: "https://tudominio.com/pago-fallido.html",
      pending: "https://tudominio.com/pago-pendiente.html"
    },
    auto_return: "approved",
    notification_url:
      "https://us-central1-tallerpro360.cloudfunctions.net/webhookMP"
  };

  const response = await mercadopago.preferences.create(preference);
  return { init_point: response.body.init_point };
});

/**
 * WEBHOOK (ACTIVA EL PLAN)
 */
exports.webhookMP = functions.https.onRequest(async (req, res) => {
  try {
    const paymentId = req.query?.["data.id"];
    if (!paymentId) return res.sendStatus(200);

    const payment = await mercadopago.payment.findById(paymentId);
    const data = payment.body;

    if (data.status !== "approved") return res.sendStatus(200);

    const { uid, plan } = data.metadata;

    const ahora = admin.firestore.Timestamp.now();
    const vence = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );

    await admin.firestore().collection("talleres").doc(uid).update({
      plan,
      estadoPlan: "activo",
      inicioPlan: ahora,
      venceEn: vence,
      alertas: { d7: false, d3: false, d1: false }
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});