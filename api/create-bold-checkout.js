// /api/create-bold-checkout.js (Transformación para Bold)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  // 1. Ahora necesitamos la API KEY de BOLD (No la de Mercado Pago)
  const BOLD_API_KEY = process.env.BOLD_API_KEY; 

  const { planId, uid, email } = req.body;

  // 2. Mantenemos tus Planes y Precios (Están perfectos)
  const PLANES = {
    basico: { title: "Plan Básico", price: 49900 },
    pro: { title: "Plan PRO", price: 79900 },
    elite: { title: "Plan Elite", price: 129000 },
    enterprise: { title: "Plan Enterprise", price: 259900 }
  };

  const selectedPlan = PLANES[planId];

  try {
    // 3. CAMBIO CLAVE: Llamada a la API de Bold para generar el link
    // Nota: Bold usa una estructura diferente a Mercado Pago
    const boldResponse = await fetch("https://api.bold.co/v2/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${BOLD_API_KEY}`
      },
      body: JSON.stringify({
        amount: selectedPlan.price,
        currency: "COP",
        description: selectedPlan.title,
        order_id: `NEXUS-${uid}-${Date.now()}`, // ID único para rastrear
        notification_url: "https://tallerpro360.vercel.app/api/webhook-bold",
        redirection_url: "https://tallerpro360.vercel.app/app/index.html?pago=exitoso"
      })
    });

    const data = await boldResponse.json();
    
    // Retornamos la URL de Bold para que el cliente pague
    return res.status(200).json({ url: data.payment_url });

  } catch (error) {
    return res.status(500).json({ error: "Error conectando con Bold" });
  }
}


