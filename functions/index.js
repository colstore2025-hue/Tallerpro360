/************************************************
 * TallerPRO360 · Firebase Functions (Index)
 * Arquitectura SaaS Enterprise · ERP + CRM
 ************************************************/

const admin = require("firebase-admin");
const functions = require("firebase-functions");
const mercadopago = require("mercadopago");

// =============================================
// 🔥 INICIALIZACIÓN GLOBAL
// =============================================

admin.initializeApp();
const db = admin.firestore();

// =============================================
// 🔐 CONFIGURACIÓN MERCADO PAGO
// =============================================

mercadopago.configure({
  access_token: functions.config().mercadopago.access_token
});

// =============================================
// 📦 IMPORTAR MÓDULOS
// =============================================

const ordenes = require("./modules/ordenes");
const inventario = require("./modules/inventario");
const movimientos = require("./modules/movimientos");
const planes = require("./modules/planes");
const suscripciones = require("./modules/suscripciones");
const clientes = require("./modules/clientes");
const vehiculos = require("./modules/vehiculos");

// =============================================
// 📦 UTILS
// =============================================

const { trialOnCreate } = require("./trial-on-create");
const { billingCron } = require("./billing-cron");
const { crearPago, webhookMP } = require("./pagos-mercadopago");

// =============================================
// 🚀 EXPORTAR FUNCIONES (INDIVIDUALES)
// =============================================

// Órdenes
exports.crearOrden = ordenes.crearOrden;
exports.actualizarEstadoOrden = ordenes.actualizarEstadoOrden;

// Inventario
exports.ajustarStock = inventario.ajustarStock;

// Finanzas
exports.registrarMovimiento = movimientos.registrarMovimiento;

// Clientes
exports.crearCliente = clientes.crearCliente;

// Vehículos
exports.crearVehiculo = vehiculos.crearVehiculo;

// Planes y Suscripciones
exports.crearPlan = planes.crearPlan;
exports.activarSuscripcion = suscripciones.activarSuscripcion;

// SaaS System
exports.trialOnCreate = trialOnCreate;
exports.billingCron = billingCron;
exports.crearPago = crearPago;
exports.webhookMP = webhookMP;

// =============================================
// 🏢 CREACIÓN AUTOMÁTICA DE EMPRESA (TRIAL)
// =============================================

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {

  const uid = user.uid;
  const ahora = admin.firestore.Timestamp.now();

  try {

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

      limites: {
        sucursales: 1,
        ordenesMes: 50
      },

      metricas: {
        ordenesMes: 0,
        ingresosMes: 0,
        egresosMes: 0
      },

      configuracion: {
        facturacionElectronica: false,
        contabilidadAvanzada: false
      }

    });

    // Usuario dueño
    await empresaRef.collection("usuarios").doc(uid).set({
      rol: "dueno",
      activo: true,
      creadoEn: ahora
    });

    // Sucursal principal
    await empresaRef.collection("sucursales").doc("principal").set({
      nombre: "Sucursal Principal",
      creadoEn: ahora,
      activa: true
    });

    // CRM Base
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

    // Claims
    await admin.auth().setCustomUserClaims(uid, {
      empresaId,
      rol: "dueno",
      activo: true,
      planActivo: true
    });

    console.log(`✅ Empresa ${empresaId} creada para ${uid}`);

  } catch (error) {
    console.error("❌ Error creando empresa:", error);
  }

});

// =============================================
// 💎 ACTIVAR TRIAL MANUAL (HTTPS Callable)
// =============================================

exports.activarTrial = functions.https.onCall(async (data, context) => {
  if (!context.auth) return { success: false, error: "Usuario no autenticado" };

  try {
    const uid = context.auth.uid;

    // Buscar empresa del usuario
    const userClaims = context.auth.token;
    const empresaId = userClaims.empresaId;
    if (!empresaId) return { success: false, error: "No se encuentra empresa asociada" };

    const empresaRef = db.collection("empresas").doc(empresaId);

    // Activar trial 7 días
    const ahora = admin.firestore.Timestamp.now();
    const vence = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 7 * 86400000)
    );

    await empresaRef.update({
      "plan.tipo": "trial",
      "plan.estado": "activo",
      "plan.fechaInicio": ahora,
      "plan.fechaVencimiento": vence
    });

    return { success: true, mensaje: "Trial activado por 7 días", plan: "trial" };

  } catch (error) {
    return { success: false, mensaje: error.message };
  }
});

// =============================================
// 💳 CREAR PAGO (BÁSICO, PRO, PRO ANUAL)
// =============================================

exports.iniciarPagoPlan = functions.https.onCall(async (data, context) => {
  if (!context.auth) return { success: false, error: "Usuario no autenticado" };

  try {
    const { plan, facturaElectronica } = data;
    const uid = context.auth.uid;
    const userClaims = context.auth.token;
    const empresaId = userClaims.empresaId;

    if (!empresaId) return { success: false, error: "Usuario no tiene empresa asignada" };

    let precioBase;
    let descripcion = "";

    switch (plan) {
      case "basico":
        precioBase = 29900;
        descripcion = "Plan Básico";
        break;
      case "pro":
        precioBase = 59900;
        descripcion = "Plan PRO";
        break;
      case "pro_anual":
        precioBase = 599000;
        descripcion = "Plan PRO Anual";
        break;
      default:
        return { success: false, error: "Plan no válido" };
    }

    // Ajuste factura electrónica
    const costoFactura = facturaElectronica ? 5000 : 0; // ejemplo, ajustar según aliado estratégico
    const total = precioBase + costoFactura;

    // Crear preferencia Mercado Pago
    const preference = {
      items: [
        {
          title: facturaElectronica ? `${descripcion} + Factura` : descripcion,
          unit_price: total,
          quantity: 1,
          currency_id: "COP"
        }
      ],
      back_urls: {
        success: "/erp",
        failure: "/erp",
        pending: "/erp"
      },
      auto_return: "approved",
      payer: { id: uid }
    };

    const mp = await mercadopago.preferences.create(preference);

    return { success: true, init_point: mp.body.init_point };

  } catch (error) {
    return { success: false, mensaje: error.message };
  }
});