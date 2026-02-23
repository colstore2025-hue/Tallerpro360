const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.onCreateOrden = functions.firestore
  .document("empresas/{empresaId}/sucursales/{sucursalId}/ordenes/{ordenId}")
  .onCreate(async (snap, context) => {

    const { empresaId, sucursalId, ordenId } = context.params;
    const orden = snap.data();
    const db = admin.firestore();

    const empresaRef = db.doc(`empresas/${empresaId}`);
    const empresa = (await empresaRef.get()).data();

    // 🔒 1. Verificar límite del plan
    if (empresa.metricas.ordenesMes >= empresa.plan.limiteOrdenes) {
      throw new Error("Límite de órdenes alcanzado");
    }

    // 📦 2. Descontar inventario
    for (const item of orden.items) {
      const inventarioRef = db.doc(
        `empresas/${empresaId}/sucursales/${sucursalId}/inventario/${item.productoId}`
      );

      await db.runTransaction(async (tx) => {
        const invDoc = await tx.get(inventarioRef);
        const stockActual = invDoc.data().stockActual;

        if (stockActual < item.cantidad) {
          throw new Error("Stock insuficiente");
        }

        tx.update(inventarioRef, {
          stockActual: stockActual - item.cantidad
        });
      });
    }

    // 💰 3. Crear ingreso contable
    await db.collection(`empresas/${empresaId}/sucursales/${sucursalId}/gastos`)
      .add({
        tipo: "ingreso",
        monto: orden.total,
        fecha: admin.firestore.FieldValue.serverTimestamp(),
        referencia: ordenId
      });

    // 📊 4. Actualizar métricas
    await empresaRef.update({
      "metricas.ordenesMes": admin.firestore.FieldValue.increment(1),
      "metricas.ingresosMes": admin.firestore.FieldValue.increment(orden.total)
    });

  });