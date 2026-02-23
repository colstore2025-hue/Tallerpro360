/************************************************
 * TallerPRO360 · Firebase Functions (Index)
 * Arquitectura SaaS Enterprise · ERP + CRM
 ************************************************/

const admin = require("firebase-admin");
const functions = require("firebase-functions");
const mercadopago = require("mercadopago");

// =============================================
// 🔥 INICIALIZACIÓN GLOBAL (UNA SOLA VEZ)
// =============================================

admin.initializeApp();
const db = admin.firestore();

// =============================================
// 🔐 CONFIGURACIÓN MERCADO PAGO (SEGURA)
// =============================================

mercadopago.configure({
  access_token: functions.config().mercadopago.access_token
});

// =============================================
// 📦 IMPORTAR MÓDULOS DEL SISTEMA (MISMA CARPETA)
// =============================================

const ordenes = require("./ordenes");
const inventario = require("./inventario");
const finanzas = require("./finanzas");            // si lo creas después
const planes = require("./planes");                // futuro módulo
const suscripciones = require("./suscripciones");  // futuro módulo
const permisos = require("./permisos");            // sistema dinámico

const { trialOnCreate } = require("./trial-on-create");
const { billingCron } = require("./billing-cron");
const { crearPago, webhookMP } = require("./pagos-mercadopago");

// =============================================
// 🚀 EXPORTAR MÓDULOS ERP
// =============================================

exports.ordenes = ordenes;
exports.inventario = inventario;
exports.finanzas = finanzas;
exports.planes = planes;
exports.suscripciones = suscripciones;
exports.permisos = permisos;

exports.trialOnCreate = trialOnCreate;
exports.billingCron = billingCron;
exports.crearPago = crearPago;
exports.webhookMP = webhookMP;

// =============================================
// 🏢 CREAR EMPRESA + TRIAL + CLAIMS AUTOMÁTICO
// =============================================

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {

  const uid = user.uid;
  const ahora = admin.firestore.Timestamp.now();

  try {

    // 1️⃣ Crear empresa
    const empresaRef = db.collection("empresas").doc();
    const empresaId = empresaRef.id;

    const vence = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 7 * 86400000)
    );

    await empresaRef.set({
      nombre: "Mi Taller",
      creadoEn: ahora,
      plan: {
        tipo: "trial",
        estado: "activo",
        fechaInicio: ahora,
        fechaVencimiento: vence
      },
      metricas: {
        ordenesMes: 0,
        ingresosMes: 0
      }
    });

    // 2️⃣ Crear usuario dueño
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

    // 4️⃣ Crear Pipeline CRM Base
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