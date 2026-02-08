/************************************************
 * TallerPRO360 · Firebase Functions (Index)
 * Núcleo SaaS: Auth · Planes · Pagos · Trial
 ************************************************/

const admin = require("firebase-admin");
const functions = require("firebase-functions");
const mercadopago = require("mercadopago");

// ================================
// 🔥 INIT FIREBASE ADMIN
// ================================
admin.initializeApp();
const db = admin.firestore();

// ================================
// 🔐 CONFIG MERCADO PAGO
// ================================
// Ejecutar una sola vez:
// firebase functions:config:set mp.token="ACCESS_TOKEN_MERCADO_PAGO"

mercadopago.configure({
  access_token: functions.config().mp.token
});

// ================================
// 📦 IMPORTAR MÓDULOS DEL SISTEMA
// ================================

// 🆓 Trial automático al crear taller
const { trialOnCreate } = require("./trial-on-create");

// ⏰ Cron de facturación / vencimientos
const { billingCron } = require("./billing-cron");

// 💳 Pagos Mercado Pago (planes)
const { crearPago, webhookMP } = require("./pagos-mercadopago");

// ================================
// 🚀 EXPORTAR FUNCTIONS
// ================================

// Trial
exports.trialOnCreate = trialOnCreate;

// Cron diario
exports.billingCron = billingCron;

// Mercado Pago
exports.crearPago = crearPago;
exports.webhookMP = webhookMP;

/* ===============================
   🔰 ACTIVAR PLAN TRIAL AL REGISTRO
================================ */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const ahora = admin.firestore.Timestamp.now();

  const vence = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + 7 * 86400000)
  );

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

  console.log(`✅ Trial activado para usuario ${uid}`);
});