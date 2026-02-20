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

    // 🔎 1. Buscar usuario
    const userDoc = await db.collection("usuarios").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "Usuario no existe" });
    }

    const userData = userDoc.data();

    if (!userData.empresaId) {
      return res.status(400).json({ error: "Usuario sin empresa asignada" });
    }

    // 🔎 2. Buscar empresa (taller principal)
    const tallerDoc = await db
      .collection("talleres")
      .doc(userData.empresaId)
      .get();

    if (!tallerDoc.exists) {
      return res.status(404).json({ error: "Empresa no encontrada" });
    }

    const data = tallerDoc.data();

    // 🔒 3. Validar estado
    if (data.estado !== "activo") {
      return res.status(403).json({ error: "Plan inactivo" });
    }

    // 📅 4. Validar vencimiento (si existe)
    if (data.fechaVencimiento) {

      const hoy = new Date();
      const vencimiento = data.fechaVencimiento.toDate();

      if (vencimiento < hoy) {
        return res.status(403).json({ error: "Plan vencido" });
      }
    }

    return res.status(200).json({
      plan: data.plan || "demo",
      estado: "activo"
    });

  } catch (error) {

    console.error("Error en verificar-plan:", error);

    return res.status(500).json({
      error: "Error verificando plan"
    });

  }
}