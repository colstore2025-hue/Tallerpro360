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

    console.log("Webhook recibido:", req.body);

    const paymentId = req.body?.data?.id;
    const type = req.body?.type;

    // ✅ Solo procesar pagos
    if (type !== "payment" || !paymentId) {
      return res.status(200).json({ message: "Evento ignorado" });
    }

    // ✅ Consultar pago real en MercadoPago
    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      }
    );

    const paymentData = await paymentResponse.json();

    if (!paymentResponse.ok) {
      console.error("Error consultando pago:", paymentData);
      return res.status(500).json({ error: "Error consultando pago" });
    }

    console.log("Pago consultado:", paymentData.status);

    // ✅ Solo activar si está aprobado
    if (paymentData.status !== "approved") {
      return res.status(200).json({ message: "Pago no aprobado aún" });
    }

    const plan = paymentData.metadata?.plan;
    const userId = paymentData.metadata?.userId;

    if (!plan || !userId) {
      console.error("Metadata incompleta");
      return res.status(400).json({ error: "Metadata inválida" });
    }

    // ✅ Verificar que no esté ya activado (evitar duplicados)
    const tallerRef = db.collection("talleres").doc(userId);
    const tallerDoc = await tallerRef.get();

    if (!tallerDoc.exists) {
      console.error("Usuario no encontrado en Firestore");
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const tallerData = tallerDoc.data();

    if (tallerData.plan === plan && tallerData.estado === "activo") {
      console.log("Plan ya estaba activo");
      return res.status(200).json({ message: "Plan ya activo" });
    }

    // 🔥 ACTIVAR PLAN
    await tallerRef.update({
      plan: plan,
      estado: "activo",
      fechaActivacion: new Date(),
      ultimoPagoId: paymentId
    });

    console.log(`Plan ${plan} activado para usuario ${userId}`);

    return res.status(200).json({
      message: "Plan activado correctamente"
    });

  } catch (error) {

    console.error("Error en webhook:", error);

    return res.status(500).json({
      error: "Error interno en webhook"
    });

  }
}