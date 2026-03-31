/**
 * create-bold-checkout.js - TallerPRO360 V14.5.0 🚀
 * MOTOR DINÁMICO DE PAGOS NEXUS-X (INTEGRACIÓN BOLD)
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "NEXUS_DENIED", message: "Solo POST" });
  }

  const { planId, meses, uid, empresaId, emailCliente } = req.body;

  // 1. TABLA DE PRECIOS BASE (COP)
  const PRECIO_MES_BASE = { 
    basico: 49900, 
    pro: 79900, 
    elite: 129000 
  };
  
  // 2. ALGORITMO DE DESCUENTOS NEXUS-X
  let factor = 1.0;
  if (meses >= 12) factor = 0.70;      // 30% OFF
  else if (meses >= 6) factor = 0.80;  // 20% OFF
  else if (meses >= 3) factor = 0.90;  // 10% OFF

  const montoTotal = Math.round((PRECIO_MES_BASE[planId] * meses) * factor);

  try {
    // Usamos el endpoint estándar de Bold para máxima compatibilidad
    const boldRes = await fetch("https://api.bold.co/checkout/v1/payment", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${process.env.BOLD_API_SECRET}`, 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: montoTotal,
        currency: "COP",
        description: `Plan ${planId.toUpperCase()} - ${meses} Mes(es) TallerPRO360`,
        order_id: `NEXUS-${empresaId || 'NEW'}-${Date.now()}`,
        notification_url: "https://tallerpro360.vercel.app/api/webhook-bold",
        redirection_url: "https://tallerpro360.vercel.app/home.html?pago=exitoso",
        metadata: { 
            empresaId: empresaId || "NUEVO_TALLER", 
            planId: planId, 
            meses: meses.toString(),
            email: emailCliente || "soporte@tallerpro360.com"
        }
      })
    });

    const data = await boldRes.json();

    if (data.url) {
        return res.status(200).json({ url: data.url });
    } else {
        console.error("❌ Respuesta Bold:", data);
        return res.status(400).json({ error: "No se pudo generar el link", details: data });
    }

  } catch (error) {
    console.error("❌ Fallo Crítico Nexus-X Checkout:", error);
    return res.status(500).json({ error: "Fallo de comunicación con Bold" });
  }
}
