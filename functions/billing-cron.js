const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();

exports.verificarVencimientos = functions.pubsub
  .schedule("every day 01:00")
  .timeZone("America/Bogota")
  .onRun(async () => {

    const hoy = new Date();
    const snap = await db.collection("talleres")
      .where("estadoPlan", "!=", "SUSPENDIDO")
      .get();

    for (const doc of snap.docs) {
      const t = doc.data();
      if (!t.venceEn) continue;

      const vence = t.venceEn.toDate();
      const dias = Math.ceil((vence - hoy) / 86400000);

      let estado = "ACTIVO";
      if (dias <= 7 && dias > 3) estado = "AVISO";
      else if (dias <= 3 && dias > 0) estado = "LIMITADO";
      else if (dias <= 0) estado = "SUSPENDIDO";

      await doc.ref.update({
        estadoPlan: estado,
        diasRestantes: dias
      });
    }

    return null;
  });