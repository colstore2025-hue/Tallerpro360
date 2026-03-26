/**
 * create-bold-checkout.js - Pago de Suscripción a Nexus-X
 */
export default async function handler(req, res) {
  const { planId, meses, uid, empresaId } = req.body;

  const PRECIO_MES_BASE = { basico: 49900, pro: 79900, elite: 129000 };
  
  // Algoritmo idéntico al Front-end
  let factor = 1.0;
  if (meses >= 12) factor = 0.70;
  else if (meses >= 6) factor = 0.80;
  else if (meses >= 3) factor = 0.90;

  const montoTotal = Math.round((PRECIO_MES_BASE[planId] * meses) * factor);

  // Tus llaves de Nexus-X (configuradas en Vercel)
  const BOLD_SECRET = process.env.BOLD_API_SECRET; 
  const BOLD_ID = process.env.BOLD_API_IDENTITY;

  try {
    const boldRes = await fetch("https://api.bold.co/v2/checkout", {
      method: "POST",
      headers: { "X-API-KEY": BOLD_SECRET, "X-IDENTITY": BOLD_ID, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: montoTotal,
        currency: "COP",
        description: `Plan ${planId.toUpperCase()} - ${meses} Meses`,
        order_id: `SUSC-${empresaId}-${Date.now()}`,
        notification_url: "https://tallerpro360.vercel.app/api/webhook-bold", // Este activa el tiempo en la DB
        metadata: { firebase_uid: uid, empresaId, planId, meses }
      })
    });
    const data = await boldRes.json();
    return res.status(200).json({ url: data.payment_url || data.url });
  } catch (e) {
    return res.status(500).json({ error: "Error de conexión Bold" });
  }
}
