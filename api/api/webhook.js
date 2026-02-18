export default async function handler(req, res) {

  // ✅ MercadoPago envía POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {

    console.log("Webhook recibido:", req.body);

    const paymentId = req.body?.data?.id;
    const type = req.body?.type;

    // ✅ Solo procesamos pagos
    if (type !== "payment" || !paymentId) {
      return res.status(200).json({ message: "Evento ignorado" });
    }

    // ✅ Consultar el pago real en MercadoPago (anti-fraude)
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

    console.log("Pago consultado:", paymentData);

    // ✅ Verificar estado aprobado
    if (paymentData.status !== "approved") {
      console.log("Pago no aprobado:", paymentData.status);
      return res.status(200).json({ message: "Pago no aprobado aún" });
    }

    // ✅ Extraer metadata
    const plan = paymentData.metadata?.plan;

    if (!plan) {
      console.error("No se encontró plan en metadata");
      return res.status(400).json({ error: "Metadata inválida" });
    }

    // 🔥 AQUÍ ACTIVAMOS EL PLAN EN FIRESTORE
    // -------------------------------------------------
    // Ejemplo:
    // await db.collection("talleres").doc(userId).update({
    //   plan: plan,
    //   estado: "activo",
    //   fechaActivacion: new Date()
    // });
    // -------------------------------------------------

    console.log(`Plan ${plan} activado correctamente`);

    return res.status(200).json({ message: "Plan activado correctamente" });

  } catch (error) {

    console.error("Error en webhook:", error);

    return res.status(500).json({
      error: "Error interno en webhook"
    });

  }
}