import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
    })
  });
}

const db = admin.firestore();

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Falta userId" });
    }

    const doc = await db.collection("talleres").doc(userId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const data = doc.data();

    if (data.estado !== "activo") {
      return res.status(403).json({ error: "Plan inactivo" });
    }

    if (data.fechaVencimiento) {
      const hoy = new Date();
      const vencimiento = data.fechaVencimiento.toDate();

      if (vencimiento < hoy) {
        return res.status(403).json({ error: "Plan vencido" });
      }
    }

    return res.status(200).json({
      plan: data.plan,
      estado: "activo"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Error verificando plan"
    });

  }
}