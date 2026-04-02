import { PLANS_CONFIG } from './plans-config.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST_REQUIRED' });

    // Extraemos empresaId para asegurar la vinculación con tu DB
    const { planId, months, userEmail, userId, empresaId } = req.body;

    try {
        const selectedPlan = PLANS_CONFIG[planId];
        const amountTotal = selectedPlan?.prices[months];

        if (!amountTotal) throw new Error("Plan o duración no válida en configuración.");

        // Referencia única Nexus-X para rastreo en el panel de Bold
        const reference = `NEXUS_${empresaId || userId}_${Date.now()}`;

        // Limpieza de montos (Bold V2 no acepta decimales)
        const totalAmountRounded = Math.round(amountTotal);

        /**
         * CONEXIÓN API BOLD V2
         * Usamos BOLD_API_KEY con Bearer Token (Estándar 2026)
         */
        const boldResponse = await fetch('https://api.bold.co/v2/payment-links', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.BOLD_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: `Suscripción TallerPRO360: ${selectedPlan.name} (${months} Meses)`,
                amount: totalAmountRounded,
                currency: "COP",
                order_id: reference,
                notification_url: "https://tallerpro360.vercel.app/api/webhook-bold",
                redirect_url: "https://tallerpro360.vercel.app/home.html?pago=exitoso",
                customer_email: userEmail,
                // META-DATA: Esto es lo que "alimenta" a tus webhooks
                metadata: {
                    empresaId: String(empresaId || userId),
                    planId: String(planId),
                    meses: String(months),
                    usuarioId: String(userId)
                }
            })
        });

        const data = await boldResponse.json();

        if (data.payload && data.payload.payment_url) {
            console.log(`✅ Link Nexus Generado: ${reference}`);
            res.status(200).json({ 
                url: data.payload.payment_url, 
                reference: reference,
                monto: totalAmountRounded 
            });
        } else {
            console.error("❌ Error de Bold API:", data);
            throw new Error(data.message || "No se pudo generar el link.");
        }

    } catch (error) {
        console.error("❌ Fallo en Create-Payment:", error.message);
        res.status(500).json({ error: error.message });
    }
}