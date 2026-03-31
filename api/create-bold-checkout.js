/**
 * create-bold-checkout.js - TallerPRO360 V15.0.0 🚀
 * MOTOR DINÁMICO DE PAGOS NEXUS-X (SINCRO STARLINK & BOLD)
 * * Este script calcula montos con descuentos y genera el Link de Pago oficial.
 */

export default async function handler(req, res) {
  // 1. Protección de Método
  if (req.method !== "POST") {
    return res.status(405).json({ status: "NEXUS_DENIED", message: "Protocolo requiere POST" });
  }

  const { planId, meses, uid, empresaId, emailCliente } = req.body;

  // 2. Validación de Parámetros Críticos
  if (!planId || !meses || !emailCliente) {
    return res.status(400).json({ error: "Datos insuficientes para la transacción Nexus" });
  }

  // 3. Tabla de Precios Base Nexus-X (COP)
  const PRECIO_MES_BASE = { 
    basico: 49900, 
    pro: 79900, 
    elite: 129000 
  };

  const precioUnitario = PRECIO_MES_BASE[planId] || 49900;
  
  // 4. Algoritmo de Descuentos Nexus-X
  // 12 meses: 30% OFF | 6 meses: 20% OFF | 3 meses: 10% OFF
  let factor = 1.0;
  if (meses >= 12) factor = 0.70;      
  else if (meses >= 6) factor = 0.80;  
  else if (meses >= 3) factor = 0.90;  

  const montoTotal = Math.round((precioUnitario * meses) * factor);

  try {
    /**
     * CONEXIÓN CON API BOLD V2 (Payment Links)
     * Se usa el API_KEY de entorno para seguridad.
     */
    const response = await fetch('https://api.bold.co/v2/payment-links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BOLD_API_KEY}`, 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: `Plan ${planId.toUpperCase()} - TallerPRO360 (${meses} Meses)`,
        amount: montoTotal,
        currency: "COP",
        order_id: `NEXUS-${empresaId || 'NEW'}-${Date.now()}`,
        notification_url: "https://tallerpro360.vercel.app/api/webhook-bold",
        redirect_url: "https://tallerpro360.vercel.app/home.html?pago=exitoso",
        customer_email: emailCliente,
        // Metadatos cruciales para que el Webhook procese la activación en Firebase
        metadata: { 
          empresaId: empresaId || "NUEVO_TALLER", 
          planId: planId, 
          meses: meses.toString(),
          uid: uid || "N/A"
        }
      })
    });

    const data = await response.json();

    // 5. Respuesta al Frontend
    // Bold V2 devuelve el link en payload.payment_url
    if (data.payload && data.payload.payment_url) {
      console.log(`✅ Link Bold generado: ${planId} - $${montoTotal}`);
      return res.status(200).json({ 
        url: data.payload.payment_url,
        monto: montoTotal,
        ahorro: Math.round((precioUnitario * meses) - montoTotal)
      });
    } else {
      console.error("❌ Error de Bold:", data);
      return res.status(400).json({ 
        error: "Bold no retornó Link de Pago", 
        details: data 
      });
    }

  } catch (error) {
    console.error("❌ Fallo Crítico en Comunicación Bold:", error);
    return res.status(500).json({ 
      error: "Fallo de enlace con el nodo de pagos Bold",
      code: "NEXUS_COMM_FAIL"
    });
  }
}
