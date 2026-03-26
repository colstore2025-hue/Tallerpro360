/**
 * create-bold-checkout.js - TallerPRO360 V12.5.0 🛰️
 * PROTOCOLO STARLINK: Procesador Dinámico de 12 Planes
 */

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Denied" });

  const BOLD_API_SECRET = process.env.BOLD_API_SECRET;     
  const BOLD_API_IDENTITY = process.env.BOLD_API_IDENTITY; 
  const PAYMENT_MODE = process.env.NEXT_PUBLIC_PAYMENT_MODE || 'test';

  if (!BOLD_API_SECRET || !BOLD_API_IDENTITY) {
    return res.status(500).json({ error: "NEXUS_KEYS_MISSING_IN_VERCEL" });
  }

  // Recibimos planId (basico, pro, elite) y periodo (mensual, trimestral, semestral, anual)
  const { planId, periodo, uid, email, empresaNombre } = req.body;

  // --- LA MATRIZ DE VERDAD (Sincronizada con config.js) ---
  const MATRIZ = {
    basico: { mensual: 49900, trimestral: 134700, semestral: 239500, anual: 419200 },
    pro:    { mensual: 79900, trimestral: 215700, semestral: 383500, anual: 671200 },
    elite:  { mensual: 129000, trimestral: 348300, semestral: 619200, anual: 1083600 }
  };

  try {
    const basePrice = MATRIZ[planId]?.[periodo];
    if (!basePrice) return res.status(400).json({ error: "PLAN_OR_PERIOD_INVALID" });

    // FÓRMULA DE ESTABILIZACIÓN
    const finalAmount = PAYMENT_MODE === 'production' ? basePrice : 1000;
    const planName = `[${periodo.toUpperCase()}] Plan ${planId.toUpperCase()} - Nexus-X`;

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
        description: `${planName} para ${empresaNombre || 'Taller'}`,
        order_id: `NEX-PAGO-${Date.now()}`,
        notification_url: "https://tallerpro360.vercel.app/api/webhook-bold",
        redirection_url: "https://tallerpro360.vercel.app/app/#configuracion?pago=exitoso",
        metadata: {
          firebase_uid: uid,
          plan_tipo: planId,
          periodo: periodo, // CRÍTICO: Para que el webhook sepa cuántos días sumar
          modo: PAYMENT_MODE 
        }
      })
    });

    const data = await boldResponse.json();
    return res.status(200).json({ url: data.payment_url || data.url });

  } catch (error) {
    console.error("❌ Fallo Crítico:", error);
    return res.status(500).json({ error: "BOLD_CONNECTION_FAILED" });
  }
}
