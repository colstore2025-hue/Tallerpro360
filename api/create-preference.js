export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { plan } = req.body;

  const planes = {
    basico: {
      title: "Plan Básico - TallerPRO360",
      price: 1000
    },
    pro: {
      title: "Plan PRO - TallerPRO360",
      price: 2000
    },
    pro_anual: {
      title: "Plan PRO Anual - TallerPRO360",
      price: 5000
    }
  };

  const selected = planes[plan];

  if (!selected) {
    return res.status(400).json({ error: "Plan inválido" });
  }

  try {

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        items: [
          {
            title: selected.title,
            quantity: 1,
            currency_id: "COP",
            unit_price: selected.price
          }
        ],
        back_urls: {
          success: "https://tallerpro360.vercel.app/success.html",
          failure: "https://tallerpro360.vercel.app/error.html"
        },
        auto_return: "approved",
        notification_url: "https://tallerpro360.vercel.app/api/webhook",
        metadata: {
          plan: plan
        }
      })
    });

    const data = await mpResponse.json();

    res.status(200).json({ init_point: data.init_point });

  } catch (error) {
    res.status(500).json({ error: "Error creando preferencia" });
  }
}
