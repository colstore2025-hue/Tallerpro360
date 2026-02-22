/************************************************
 * TallerPRO360 · Firebase Functions (Index)
 * Núcleo SaaS Enterprise
 ************************************************/

const admin = require("firebase-admin");
const functions = require("firebase-functions");
const mercadopago = require("mercadopago");

admin.initializeApp();
const db = admin.firestore();

/* =================================
   🔐 MERCADO PAGO
================================= */

mercadopago.configure({
  access_token: functions.config().mp.token
});

/* =================================
   📦 IMPORTAR MÓDULOS
================================= */

const { trialOnCreate } = require("./trial-on-create");
const { billingCron } = require("./billing-cron");
const { crearPago, webhookMP } = require("./pagos-mercadopago");

/* =================================
   🚀 EXPORTAR EXISTENTES
================================= */

exports.trialOnCreate = trialOnCreate;
exports.billingCron = billingCron;
exports.crearPago = crearPago;
exports.webhookMP = webhookMP;

/* =================================
   🔰 ACTIVAR PLAN TRIAL + CLAIMS
================================= */

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {

  const uid = user.uid;
  const ahora = admin.firestore.Timestamp.now();

  const vence = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + 7 * 86400000)
  );

  // Crear documento del taller
  await db.collection("talleres").doc(uid).set({
    planId: "trial",
    planNombre: "Trial",
    tipoPlan: "trial",
    estadoPlan: "ACTIVO",
    inicioPlan: ahora,
    venceEn: vence,
    ordenesCreadas: 0,
    limites: {
      ordenes_max: 10,
      usuarios: 1
    },
    features: {
      inventario: true,
      reportes: true,
      excel: false,
      multiusuario: false,
      facturacion: false
    },
    metodoPago: "trial",
    creadoEn: ahora
  });

  // 🔥 ASIGNAR CUSTOM CLAIMS ENTERPRISE
  await admin.auth().setCustomUserClaims(uid, {
    tallerId: uid,
    rol: "dueno",
    activo: true,
    planActivo: true
  });

  console.log(`✅ Trial y Claims activados para ${uid}`);
});