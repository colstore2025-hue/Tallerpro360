/**
 * create-bold-checkout.js - TallerPRO360 V14.0.0 🚀
 * MOTOR DINÁMICO DE PAGOS NEXUS-X (INTEGRACIÓN V2 BOLD)
 */

export default async function handler(req, res) {
  // Solo permitimos peticiones POST desde nuestro propio dominio
  if (req.method !== "POST") {
    return res.status(405).json({ status: "NEXUS_DENIED", message: "Solo peticiones POST permitidas" });
  }

  const { planId, meses, uid, empresaId, emailCliente } = req.body;

  // 1. TABLA DE PRECIOS BASE (COP)
  const PRECIO_MES_BASE = { 
    basico: 49900, 
    pro: 79900, 
    elite: 129000 
  };
  
  // 2. ALGORITMO DE DESCUENTOS ESCALONADOS (NEXUS-X LOGISTICS)
  let factor = 1.0;
  if (meses >= 12) factor = 0.70;      // 30% OFF (Anual)
  else if (meses >= 6) factor = 0.80;  // 20% OFF (Semestral)
  else if (meses >= 3) factor = 0.90;  // 10% OFF (Trimestral)

  // Cálculo del monto final redondeado
  const montoTotal = Math.round((PRECIO_MES_BASE[planId] * meses) * factor);

  // 3. SEGURIDAD: Bearer Token de Bold (Configurado en Vercel env)
  const BOLD_SECRET = process.env.BOLD_API_SECRET; 

  try {
    // Llamada al Checkout dinámico de Bold
    const boldRes = await fetch("https://api.bold.co/v2/checkouts", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${BOLD_SECRET}`, 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        amount: montoTotal,
        currency: "COP",
        description: `Suscripción TallerPRO360: ${planId.toUpperCase()} x ${meses} Meses`,
        order_id: `TP360-${empresaId}-${Date.now()}`,
        notification_url: "https://tallerpro360.vercel.app/api/webhook-bold",
        redirection_url: "https://tallerpro360.vercel.app/pago-exitoso.html",
        
        // Datos del pagador para pre-llenar la pasarela
        customer_email: emailCliente || "",
        
        // METADATA: Vital para que el Webhook sepa a quién activar
        metadata: { 
            firebase_uid: uid, 
            empresa_id: empresaId, 
            plan_id: planId, 
            meses_contratados: meses.toString(),
            promo_aplicada: (1 - factor).toString(),
            origen: "WEB_NEXUS_X"
        }
      })
    });

    const data = await boldRes.json();

    // Verificación de integridad de la respuesta
    if (!data.url && !data.payment_url) {
        console.error("❌ Error de Pasarela Bold:", data);
        return res.status(400).json({ 
            error: "No se pudo generar el portal de pago", 
            details: data.errors || data.message 
        });
    }

    // Retornamos la URL dinámica para redirección inmediata
    return res.status(200).json({ 
        url: data.payment_url || data.url,
        monto: montoTotal 
    });

  } catch (error) {
    console.error("❌ Fallo Crítico Nexus-X Checkout:", error);
    return res.status(500).json({ error: "Fallo de comunicación con el motor de pagos" });
  }
}
