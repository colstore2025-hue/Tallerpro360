/**
 * create-bold-checkout.js - TallerPRO360 V13.5.0 🚀
 * NEXUS-X STARLINK: Motor de Suscripción con Descuentos Escalonados
 */

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("NEXUS_DENIED");

  const { planId, meses, uid, empresaId } = req.body;

  // TABLA DE PRECIOS OFICIAL NEXUS-X 2026
  const PRECIO_MES_BASE = { 
    basico: 49900, 
    pro: 79900, 
    elite: 129000 
  };
  
  // ALGORITMO DE FIDELIZACIÓN (DESCUENTOS)
  let factor = 1.0;
  if (meses >= 12) factor = 0.70;      // 30% OFF (Anual)
  else if (meses >= 6) factor = 0.80;  // 20% OFF (Semestral)
  else if (meses >= 3) factor = 0.90;  // 10% OFF (Trimestral)

  const montoTotal = Math.round((PRECIO_MES_BASE[planId] * meses) * factor);

  // CREDENCIALES DESDE VERCEL ENVIRONMENT VARIABLES
  const BOLD_SECRET = process.env.BOLD_API_SECRET; 
  // Nota: En la API V2 de Bold suele usarse Bearer Token o X-API-KEY según el tipo de integración.

  try {
    const boldRes = await fetch("https://api.bold.co/v2/checkouts", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${BOLD_SECRET}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        amount: montoTotal,
        currency: "COP",
        description: `Suscripción TallerPRO360: Plan ${planId.toUpperCase()} (${meses} Meses)`,
        order_id: `SUSC-${empresaId}-${Date.now()}`,
        notification_url: "https://tallerpro360.vercel.app/api/webhook-bold",
        // REDIRECCIÓN TRAS EL PAGO
        redirection_url: "https://tallerpro360.vercel.app/pago-exitoso.html",
        // METADATA: El ADN que lee el Webhook
        metadata: { 
            firebase_uid: uid, 
            empresaId: empresaId, 
            planId: planId, 
            meses: meses.toString(),
            tipo_operacion: "SUSCRIPCION_NEXUS"
        }
      })
    });

    const data = await boldRes.json();

    if (!data.url && !data.payment_url) {
        console.error("❌ Bold API Error:", data);
        return res.status(400).json({ error: "Bold no generó la URL de pago", details: data });
    }

    // Retornamos la URL para que el Front-end haga window.location.href
    return res.status(200).json({ url: data.payment_url || data.url });

  } catch (e) {
    console.error("❌ Fallo de conexión:", e);
    return res.status(500).json({ error: "Error de comunicación con la pasarela" });
  }
}
