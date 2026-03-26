/**
 * create-bold-checkout.js - TallerPRO360 V11.5.0 🛰️
 * PROTOCOLO ESTABILIZADO: Soporta Test y Producción
 */

export default async function handler(req, res) {
  // 1. Seguridad: Solo peticiones POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // 2. Carga de llaves desde Vercel (Nombres actualizados según tu captura)
  const BOLD_API_SECRET = process.env.BOLD_API_SECRET;     
  const BOLD_API_IDENTITY = process.env.BOLD_API_IDENTITY; 
  const PAYMENT_MODE = process.env.NEXT_PUBLIC_PAYMENT_MODE || 'test'; // Por defecto test si no existe

  if (!BOLD_API_SECRET || !BOLD_API_IDENTITY) {
    console.error("❌ Error Nexus-X: Llaves ausentes en Vercel");
    return res.status(500).json({ error: "Configuración incompleta en Vercel" });
  }

  const { planId, uid, email } = req.body;

  // 3. Diccionario de Planes Nexus-X
  const PLANES = {
    freemium: { title: "Plan Trial - TallerPRO360", price: 0 },
    basico: { title: "Plan Básico - TallerPRO360", price: 49900 },
    pro: { title: "Plan PRO - TallerPRO360", price: 79900 },
    elite: { title: "Plan ELITE NEXUS - TallerPRO360", price: 129000 },
    enterprise: { title: "Plan ENTERPRISE - TallerPRO360", price: 259900 }
  };

  const selectedPlan = PLANES[planId];
  if (!selectedPlan) return res.status(400).json({ error: "Plan no válido" });

  // 4. FÓRMULA DE ESTABILIZACIÓN: Ajuste de monto para pruebas
  // Si el modo es 'test', cobramos el mínimo ($1,000 COP) para no afectar tu bolsillo
  const finalAmount = PAYMENT_MODE === 'production' ? selectedPlan.price : 1000;
  const description = PAYMENT_MODE === 'production' 
    ? selectedPlan.title 
    : `TEST: ${selectedPlan.title}`;

  try {
    // 5. Conexión con Bold API V2
    const boldResponse = await fetch("https://api.bold.co/v2/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": BOLD_API_SECRET,
        "X-IDENTITY": BOLD_API_IDENTITY
      },
      body: JSON.stringify({
        amount: finalAmount,
        currency: "COP",
        description: description,
        order_id: `NEXUS-${uid}-${Date.now()}`,
        notification_url: "https://tallerpro360.vercel.app/api/webhook-bold",
        redirection_url: "https://tallerpro360.vercel.app/app/index.html?pago=exitoso",
        metadata: {
          plan_tipo: planId,
          firebase_uid: uid,
          mode: PAYMENT_MODE 
        }
      })
    });

    const data = await boldResponse.json();

    if (!boldResponse.ok) {
      return res.status(boldResponse.status).json({ error: "Bold rechazó la petición", details: data });
    }

    return res.status(200).json({ url: data.payment_url || data.url });

  } catch (error) {
    console.error("❌ Fallo Crítico Nexus-X:", error);
    return res.status(500).json({ error: "Error de conexión con Bold" });
  }
}
