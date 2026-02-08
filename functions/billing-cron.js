const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * ⏰ Corre todos los días a las 6:00 AM (hora Colombia)
 */
exports.verificarVencimientos = functions.pubsub
  .schedule("0 6 * * *")
  .timeZone("America/Bogota")
  .onRun(async () => {

    const hoy = new Date();
    const usuariosSnap = await db
      .collection("usuarios")
      .where("estadoPlan", "==", "ACTIVO")
      .get();

    for (const doc of usuariosSnap.docs) {
      const u = doc.data();
      if (!u.venceEn) continue;

      const vence = u.venceEn.toDate();
      const diffMs = vence - hoy;
      const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let tipo = null;

      if (dias === 7) tipo = "AVISO_7_DIAS";
      if (dias === 3) tipo = "AVISO_3_DIAS";
      if (dias === 1) tipo = "AVISO_1_DIA";

      // 🚨 VENCIDO
      if (dias <= 0) {
        await doc.ref.update({
          estadoPlan: "VENCIDO",
          acceso: false
        });

        await db.collection("alertas").add({
          uid: doc.id,
          tipo: "PLAN_VENCIDO",
          fecha: admin.firestore.Timestamp.now(),
          visto: false
        });

        continue;
      }

      // 🔔 Crear alerta solo si aplica
      if (tipo) {
        const existe = await db.collection("alertas")
          .where("uid", "==", doc.id)
          .where("tipo", "==", tipo)
          .get();

        if (existe.empty) {
          await db.collection("alertas").add({
            uid: doc.id,
            tipo,
            diasRestantes: dias,
            fecha: admin.firestore.Timestamp.now(),
            visto: false
          });
        }
      }
    }

    console.log("✅ Verificación de vencimientos completada");
    return null;
  });