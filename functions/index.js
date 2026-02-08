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