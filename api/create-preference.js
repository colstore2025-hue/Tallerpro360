// /api/create-preference.js

export default async function handler(req, res) {
  // 1. Validar método POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // 2. Verificar que el Token exista en las variables de entorno de Vercel
  if (!process.env.MP_ACCESS_TOKEN) {
    console.error("ERROR: MP_ACCESS_TOKEN no configurado en Vercel");
    return res.status(500).json({ error: "Configuración de servidor incompleta" });
  }

  // 3. Recibir datos del frontend (Sincronizado con tu script: planId y uid)
  const { planId, uid, email } = req.body;

  if (!planId || !uid) {
    return res.status(400).json({ error: "Faltan datos obligatorios (planId o uid)" });
  }

  // 4. Configuración de Planes y Precios Actualizados
  const PLANES = {
    basico: { title: "Plan Básico - TallerPRO360", price: 49900 },
    pro: { title: "Plan PRO - TallerPRO360", price: 79900 },
    elite: { title: "Plan Elite - TallerPRO360", price: 129000 },
    enterprise: { title: "Plan Enterprise - TallerPRO360", price: 259900 }
  };

  const selectedPlan = PLANES[planId];

  if (!selectedPlan) {
    return res.status(400).json({ error: "El plan seleccionado no es válido" });
  }

  try {
    // 5. Llamada directa a la API de Mercado Pago
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        items: [{
          title: selectedPlan.title,
          quantity: 1,
          currency_id: "COP",
          unit_price: selectedPlan.price
        }],
        payer: {
          email: email || "usuario@tallerpro360.com" // Email opcional para pre-llenar checkout
        },
        back_urls: {
          success: "https://tallerpro360.vercel.app/app/index.html?payment=success",
          failure: "https://tallerpro360.vercel.app/app/index.html?payment=failure",
          pending: "https://tallerpro360.vercel.app/app/index.html?payment=pending"
        },
        auto_return: "approved",
        notification_url: "https://tallerpro360.vercel.app/api/webhook", // Para actualizar Firebase luego
        statement_descriptor: "TALLERPRO360",
        external_reference: uid, // Guardamos el UID de Firebase para identificar quién pagó
        metadata: {
          plan_id: planId,
          firebase_uid: uid
        }
      })
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok || !data.init_point) {
      console.error("Error de Mercado Pago:", data);
      return res.status(500).json({ error: "No se pudo generar el punto de pago" });
    }

    // 6. Retornar el link de pago al frontend
    return res.status(200).json({ init_point: data.init_point });

  } catch (error) {
    console.error("Error interno del servidor:", error);
    return res.status(500).json({ error: "Error de conexión con la pasarela" });
  }
}
