/**
 * create-bold-checkout.js - TallerPRO360 V15.0.0 🚀
 * MOTOR DINÁMICO DE PAGOS NEXUS-X (SINCRO STARLINK & BOLD)
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "NEXUS_DENIED", message: "Protocolo requiere POST" });
  }

  const { planId, meses, uid, empresaId, emailCliente } = req.body;

  if (!planId || !meses || !emailCliente || !empresaId) {
    return res.status(400).json({ error: "Datos insuficientes (Falta empresaId o Plan)" });
  }

  // Precios Base Nexus-X (COP)
  const PRECIO_MES_BASE = { 
    basico: 49900, 
    pro: 79900, 
    elite: 129000 
  };

  const precioUnitario = PRECIO_MES_BASE[planId] || 49900;
  
  // Algoritmo de Descuentos Nexus-X
  let factor = 1.0;
  if (meses >= 12) factor = 0.70;      
  else if (meses >= 6) factor = 0.80;  
  else if (meses >= 3) factor = 0.90;  

  // El monto DEBE ser entero para Bold
  const montoTotal = Math.round((precioUnitario * meses) * factor);

  try {
    const response = await fetch('https://api.bold.co/v2/payment-links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BOLD_API_KEY}`, 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: `Suscripción Nexus-X: ${planId.toUpperCase()} (${meses} Meses)`,
        amount: montoTotal,
        currency: "COP",
        order_id: `NEXUS-${empresaId}-${Date.now()}`,
        // URL de tu Webhook que ya configuramos
        notification_url: "https://tallerpro360.vercel.app/api/webhook-bold",
        redirect_url: "https://tallerpro360.vercel.app/dashboard?pago=exitoso",
        customer_email: emailCliente,
        // ESTOS METADATOS SON LOS QUE LEE TU WEBHOOK-BOLD.JS
        metadata: { 
          empresaId: String(empresaId), 
          planId: String(planId), 
          meses: String(meses),
          uid: String(uid || "N/A")
        }
      })
    });

    const data = await response.json();

    if (data.payload && data.payload.payment_url) {
      return res.status(200).json({ 
        url: data.payload.payment_url,
        monto: montoTotal,
        ahorro: Math.round((precioUnitario * meses) - montoTotal)
      });
    } else {
      console.error("❌ Error de Bold API:", data);
      return res.status(400).json({ error: "No se pudo generar el enlace de pago", details: data });
    }

  } catch (error) {
    console.error("❌ Fallo Crítico:", error);
    return res.status(500).json({ error: "Fallo de enlace Nexus-X" });
  }
}
