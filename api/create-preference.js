export default async function handler(req, res) {

  // ✅ Solo permitir POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // ✅ Verificar que exista token
  if (!process.env.MP_ACCESS_TOKEN) {
    return res.status(500).json({ error: "Access Token no configurado" });
  }

  const { plan } = req.body;

  if (!plan) {
    return res.status(400).json({ error: "Plan no especificado" });
  }

  // ✅ Planes reales SaaS
  const PLANES = {
    basico: {
      title: "Plan Básico - TallerPRO360",
      price: 29900
    },
    pro: {
      title: "Plan PRO - TallerPRO360",
      price: 59900
    },
    pro_anual: {
      title: "Plan PRO Anual - TallerPRO360",
      price: 599000
    }
  };

  const selectedPlan = PLANES[plan];

  if (!selectedPlan) {
    return res.status(400).json({ error: "Plan inválido" });
  }

  try {

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify({

        items: [
          {
            title: selectedPlan.title,
            quantity: 1,
            currency_id: "COP",
            unit_price: selectedPlan.price
          }
        ],

        back_urls: {
          success: "https://tallerpro360.vercel.app/success.html",
          failure: "https://tallerpro360.vercel.app/error.html",
          pending: "https://tallerpro360.vercel.app/pending.html"
        },

        auto_return: "approved",

        notification_url: "https://tallerpro360.vercel.app/api/webhook",

        statement_descriptor: "TALLERPRO360",

        metadata: {
          plan: plan,
          environment: process.env.NODE_ENV || "production",
          created_at: new Date().toISOString()
        }

      })
    });

    const data = await response.json();

    // ✅ Validar respuesta de MercadoPago
    if (!response.ok || !data.init_point) {
      console.error("Error MercadoPago:", data);
      return res.status(500).json({ error: "Error creando preferencia en MercadoPago" });
    }

    return res.status(200).json({
      init_point: data.init_point
    });

  } catch (error) {

    console.error("Error interno:", error);

    return res.status(500).json({
      error: "Error interno del servidor"
    });

  }

}