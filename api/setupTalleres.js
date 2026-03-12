import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();

export default async function handler(req, res) {

  try {

    const usuarios = await db.collection("usuariosGlobal").get();

    for (const doc of usuarios.docs) {

      const uid = doc.id;

      const ref = db.collection("talleres").doc(uid);
      const snap = await ref.get();

      if (!snap.exists) {

        const ahora = admin.firestore.Timestamp.now();

        const vence = admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 7 * 86400000)
        );

        await ref.set({
          planId: "freemium",
          planNombre: "Plan Freemium",
          estadoPlan: "ACTIVO",
          inicioPlan: ahora,
          venceEn: vence,
          metodoPago: "manual",
          alertas: { d7:false, d3:false, d1:false }
        });

      }

    }

    res.status(200).json({ ok:true });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error:true });

  }

}