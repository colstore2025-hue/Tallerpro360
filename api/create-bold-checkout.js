/**
 * create-bold-checkout.js - TallerPRO360 V13.0.0 🚀
 * ESTRATEGIA: Cálculo Dinámico Bajo Demanda (1 a 12 meses)
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Denegado" });

  const { planId, meses, uid, empresaNombre } = req.body; // 'meses' es un número del 1 al 12

  // --- CONFIGURACIÓN DE PRECIOS BASE (Modifica solo aquí en el futuro) ---
  const PRECIO_MES_BASE = {
    basico: 49900,
    pro: 79900,
    elite: 129000
  };

  // --- LÓGICA DE DESCUENTO DINÁMICO ---
  let factorDescuento = 1.0; 
  if (meses >= 12) factorDescuento = 0.70; // 30% OFF
  else if (meses >= 6) factorDescuento = 0.80; // 20% OFF
  else if (meses >= 3) factorDescuento = 0.90; // 10% OFF

  const precioUnitario = PRECIO_MES_BASE[planId] || 49900;
  const montoTotal = Math.round((precioUnitario * meses) * factorDescuento);

  // MODO TEST / PROD
  const BOLD_SECRET = process.env.BOLD_API_SECRET;
  const BOLD_ID = process.env.BOLD_API_IDENTITY;
  const MODO = process.env.NEXT_PUBLIC_PAYMENT_MODE || 'test';
  const finalAmount = MODO === 'production' ? montoTotal : 1000;

  try {
    const boldRes = await fetch("https://api.bold.co/v2/checkout", {
      method: "POST",
      headers: { "X-API-KEY": BOLD_SECRET, "X-IDENTITY": BOLD_ID, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: finalAmount,
        currency: "COP",
        description: `Suscripción ${meses} mes(es) - Plan ${planId.toUpperCase()}`,
        order_id: `NEX-${uid}-${Date.now()}`,
        notification_url: "https://tallerpro360.vercel.app/api/webhook-bold",
        metadata: { 
            firebase_uid: uid, 
            plan_tipo: planId, 
            meses_comprados: meses // Enviamos esto al Webhook
        }
      })
    });

    const data = await boldRes.json();
    return res.status(200).json({ url: data.payment_url || data.url });
  } catch (e) {
    return res.status(500).json({ error: "Error en conexión Nexus-Bold" });
  }
}
