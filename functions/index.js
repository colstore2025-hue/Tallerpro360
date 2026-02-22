/************************************************
 * TallerPRO360 · Firebase Functions (Index)
 * Arquitectura SaaS Enterprise · ERP + CRM
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
   📦 IMPORTAR MÓDULOS EXISTENTES
================================= */

const { trialOnCreate } = require("./trial-on-create");
const { billingCron } = require("./billing-cron");
const { crearPago, webhookMP } = require("./pagos-mercadopago");

/* =================================
   🚀 EXPORTAR MÓDULOS EXISTENTES
================================= */

exports.trialOnCreate = trialOnCreate;
exports.billingCron = billingCron;
exports.crearPago = crearPago;
exports.webhookMP = webhookMP;

/* =================================
   🏢 CREAR EMPRESA + TRIAL + CLAIMS
================================= */

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {

  const uid = user.uid;
  const ahora = admin.firestore.Timestamp.now();

  try {

    // 1️⃣ Crear empresa nueva
    const empresaRef = db.collection("empresas").doc();
    const empresaId = empresaRef.id;

    const vence = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 7 * 86400000) // 7 días trial
    );

    await empresaRef.set({
      nombre: "Mi Taller",
      creadoEn: ahora,
      plan: {
        tipo: "trial",
        estado: "activo",
        fechaInicio: ahora,
        fechaVencimiento: vence
      }
    });

    // 2️⃣ Crear usuario dueño dentro de empresa
    await empresaRef.collection("usuarios").doc(uid).set({
      rol: "dueno",
      activo: true,
      creadoEn: ahora
    });

    // 3️⃣ Crear sucursal principal
    await empresaRef.collection("sucursales").doc("principal").set({
      nombre: "Sucursal Principal",
      creadoEn: ahora
    });

    // 4️⃣ Crear configuración base del CRM (Pipeline)
    const stages = [
      { nombre: "Ingreso", orden: 1, color: "#3b82f6" },
      { nombre: "Diagnóstico", orden: 2, color: "#f59e0b" },
      { nombre: "Reparación", orden: 3, color: "#06b6d4" },
      { nombre: "Listo", orden: 4, color: "#22c55e" },
      { nombre: "Entregado", orden: 5, color: "#16a34a" }
    ];

    const batch = db.batch();

    stages.forEach(stage => {
      const stageRef = empresaRef
        .collection("sucursales")
        .doc("principal")
        .collection("stagesConfig")
        .doc();

      batch.set(stageRef, {
        ...stage,
        creadoEn: ahora
      });
    });

    await batch.commit();

    // 5️⃣ Asignar Custom Claims Enterprise
    await admin.auth().setCustomUserClaims(uid, {
      empresaId: empresaId,
      rol: "dueno",
      activo: true,
      planActivo: true
    });

    console.log(`✅ Empresa ${empresaId} creada correctamente para ${uid}`);

  } catch (error) {
    console.error("❌ Error creando empresa:", error);
  }
});