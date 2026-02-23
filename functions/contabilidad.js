const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

/* ==========================================
   📘 CREAR PLAN DE CUENTAS AUTOMÁTICO
========================================== */

exports.crearPlanCuentas = async (empresaId) => {

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

  const batch = db.batch();
  const cuentasRef = db.collection("empresas").doc(empresaId).collection("contabilidad").doc("cuentas");

  cuentasBase.forEach(cuenta => {
    const ref = cuentasRef.collection("lista").doc(cuenta.codigo);
    batch.set(ref, {
      ...cuenta,
      creadoEn: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  await batch.commit();
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
    totalDebe += m.debe || 0;
    totalHaber += m.haber || 0;
  });

  if (totalDebe !== totalHaber) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "El asiento no está balanceado"
    );
  }

  await libroRef.set({
    tipo,
    referenciaId,
    movimientos,
    totalDebe,
    totalHaber,
    fecha: admin.firestore.FieldValue.serverTimestamp(),
    creadoPor
  });

  return true;
};