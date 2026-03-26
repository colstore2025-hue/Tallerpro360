/**
 * create-bold-checkout.js - TallerPRO360 V11.5.0 🛰️
 * NEXUS-X STARLINK: Generador de Checkout Automatizado
 */

export default async function handler(req, res) {
  // 1. Seguridad: Solo permitir peticiones POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // 2. Carga de llaves desde Vercel (Tal cual aparecen en tu captura)
  const BOLD_API_KEY = process.env.BOLD_API_KEY;           // Llave Secreta
  const BOLD_API_IDENTITY = process.env.BOLD_API_IDENTITY; // Llave de Identidad

  if (!BOLD_API_KEY || !BOLD_API_IDENTITY) {
    console.error("❌ Error Nexus-X: Llaves de Bold ausentes en Vercel Environment Variables");
    return res.status(500).json({ error: "Configuración de servidor incompleta en Vercel" });
  }

  const { planId, uid, email } = req.body;

  // 3. Diccionario de Planes Nexus-X (Mapeo exacto)
  const PLANES = {
    freemium: { title: "Plan Trial - TallerPRO360", price: 0 },
    basico: { title: "Plan Básico - TallerPRO360", price: 49900 },
    pro: { title: "Plan PRO - TallerPRO360", price: 79900 },
    elite: { title: "Plan Elite - TallerPRO360", price: 129000 },
    enterprise: { title: "Plan Enterprise - TallerPRO360", price: 259900 }
  };

  const selectedPlan = PLANES[planId];

  if (!selectedPlan) {
    return res.status(400).json({ error: "Plan seleccionado no válido: " + planId });
  }

  try {
    // 4. Conexión con el API de Checkout de Bold
    const boldResponse = await fetch("https://api.bold.co/v2/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": BOLD_API_KEY,
        "X-IDENTITY": BOLD_API_IDENTITY
      },
      body: JSON.stringify({
        amount: selectedPlan.price,
        currency: "COP",
        description: selectedPlan.title,
        order_id: `NEXUS-${uid}-${Date.now()}`,
        notification_url: "https://tallerpro360.vercel.app/api/webhook-bold",
        redirection_url: "https://tallerpro360.vercel.app/app/index.html?pago=exitoso",
        metadata: {
          plan_tipo: planId,
          firebase_uid: uid,
          periodo: "mensual"
        }
      })
    });

    const data = await boldResponse.json();

    if (!boldResponse.ok) {
      console.error("❌ Bold API Error:", data);
      return res.status(boldResponse.status).json({ error: "Bold rechazó la petición", details: data });
    }

    // 5. Retorno de URL (Soporta ambos formatos de API)
    return res.status(200).json({ url: data.payment_url || data.url });

  } catch (error) {
    console.error("❌ Fallo Crítico Nexus-X:", error);
    return res.status(500).json({ error: "Error interno de conexión con Bold" });
  }
}
