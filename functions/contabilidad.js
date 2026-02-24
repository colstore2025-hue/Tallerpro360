/************************************************
 * TallerPRO360 · Módulo Contabilidad
 * Plan de Cuentas + Libro Diario
 ************************************************/

const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

/* ==========================================
   📘 CREAR PLAN DE CUENTAS AUTOMÁTICO
========================================== */

exports.crearPlanCuentas = async (empresaId) => {

  if (!empresaId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "empresaId es obligatorio"
    );
  }

  const empresaRef = db.collection("empresas").doc(empresaId);
  const empresaDoc = await empresaRef.get();

  if (!empresaDoc.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "La empresa no existe"
    );
  }

  const cuentasBase = [
    { codigo: "1105", nombre: "Caja", tipo: "activo" },
    { codigo: "1110", nombre: "Bancos", tipo: "activo" },
    { codigo: "1305", nombre: "Clientes", tipo: "activo" },
    { codigo: "1435", nombre: "Inventario", tipo: "activo" },

    { codigo: "2205", nombre: "Proveedores", tipo: "pasivo" },
    { codigo: "2408", nombre: "IVA por pagar", tipo: "pasivo" },

    { codigo: "3105", nombre: "Capital", tipo: "patrimonio" },

    { codigo: "4135", nombre: "Ingresos por servicios", tipo: "ingreso" },
    { codigo: "4175", nombre: "Venta de repuestos", tipo: "ingreso" },

    { codigo: "6135", nombre: "Costo de ventas", tipo: "costo" },

    { codigo: "5105", nombre: "Gastos administrativos", tipo: "gasto" }
  ];

  const cuentasRef = empresaRef
    .collection("contabilidad")
    .doc("cuentas")
    .collection("lista");

  const snapshot = await cuentasRef.limit(1).get();

  if (!snapshot.empty) {
    // Ya existe plan de cuentas
    return true;
  }

  const batch = db.batch();

  cuentasBase.forEach(cuenta => {
    const ref = cuentasRef.doc(cuenta.codigo);

    batch.set(ref, {
      ...cuenta,
      creadoEn: admin.firestore.FieldValue.serverTimestamp(),
      activo: true
    });
  });

  await batch.commit();

  return true;
};


/* ==========================================
   📒 REGISTRAR ASIENTO CONTABLE
========================================== */

exports.registrarAsiento = async ({
  empresaId,
  tipo,
  referenciaId,
  movimientos,
  creadoPor
}) => {

  if (!empresaId || !movimientos || !Array.isArray(movimientos)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Datos incompletos para registrar asiento"
    );
  }

  if (movimientos.length < 2) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Un asiento debe tener mínimo dos movimientos"
    );
  }

  const libroRef = db
    .collection("empresas")
    .doc(empresaId)
    .collection("contabilidad")
    .doc("libroDiario")
    .collection("asientos")
    .doc();

  let totalDebe = 0;
  let totalHaber = 0;

  movimientos.forEach(m => {

    if (!m.cuenta) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Cada movimiento debe tener cuenta"
      );
    }

    const debe = Number(m.debe || 0);
    const haber = Number(m.haber || 0);

    if (debe < 0 || haber < 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Los valores no pueden ser negativos"
      );
    }

    totalDebe += debe;
    totalHaber += haber;
  });

  // 🔥 Redondeo para evitar errores decimales
  totalDebe = Number(totalDebe.toFixed(2));
  totalHaber = Number(totalHaber.toFixed(2));

  if (totalDebe !== totalHaber) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "El asiento no está balanceado"
    );
  }

  await libroRef.set({
    tipo,                 // ejemplo: "orden", "pago", "compra"
    referenciaId,         // ID de orden o documento
    movimientos,
    totalDebe,
    totalHaber,
    fecha: admin.firestore.FieldValue.serverTimestamp(),
    creadoPor,
    estado: "confirmado"
  });

  return true;
};