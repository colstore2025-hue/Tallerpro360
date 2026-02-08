const functions = require("firebase-functions");
const admin = require("firebase-admin");
const mercadopago = require("mercadopago");

admin.initializeApp();

// 🔐 ACCESS TOKEN (guárdalo luego en config)
mercadopago.configure({
  access_token: functions.config().mp.token
});

exports.crearPago = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "No autorizado");
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
    back_urls: {
      success: "https://tallerpro360.vercel.app/pago-exitoso.html",
      failure: "https://tallerpro360.vercel.app/pago-fallido.html",
      pending: "https://tallerpro360.vercel.app/pago-pendiente.html"
    },
    auto_return: "approved",
    metadata: {
      uid,
      plan
    },
    notification_url:
      "https://us-central1-tallerpro360.cloudfunctions.net/webhookMP"
  };

  const res = await mercadopago.preferences.create(preference);
  return { init_point: res.body.init_point };
});