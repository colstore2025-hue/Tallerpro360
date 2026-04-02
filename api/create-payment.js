/**
 * TALLERPRO360 - NODO NEXUS-X
 * Versión: 1.2.1-production
 * Descripción: Generador de links de pago Bold (Suscripciones)
 * Última Modificación: Abril 2026
 */

import { PLANS_CONFIG } from './plans-config.js';

export default async function handler(req, res) {
    // 1. Control de Método
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST_REQUIRED' });

    // 2. Extracción de datos del Body
    const { planId, months, userEmail, userId, empresaId } = req.body;

    try {
        // 3. Validación de Variables de Entorno (Ajustadas a tu Vercel)
        const BOLD_SECRET = process.env.BOLD_API_SECRET; // Cambiado de BOLD_API_KEY a BOLD_API_SECRET
        
        if (!BOLD_SECRET) {
            console.error("❌ ERROR: BOLD_API_SECRET no encontrada en Vercel.");
            throw new Error("Configuración de servidor incompleta.");
        }

        // 4. Lógica de Negocio: Selección de Plan
        const selectedPlan = PLANS_CONFIG[planId];
        const amountTotal = selectedPlan?.prices[months];

        if (!amountTotal) throw new Error("Plan o duración no válida en configuración.");

        // Referencia única Nexus-X
        const reference = `NEXUS_${empresaId || userId}_${Date.now()}`;
        const totalAmountRounded = Math.round(amountTotal);

        /**
         * 5. CONEXIÓN API BOLD V2 (Ajustada)
         * Usamos BOLD_API_SECRET según tu captura de Vercel
         */
        const boldResponse = await fetch('https://api.bold.co/v2/payment-links', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BOLD_SECRET}`,
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
                metadata: {
                    empresaId: String(empresaId || userId),
                    planId: String(planId),
                    meses: String(months),
                    usuarioId: String(userId),
                    v_nexus: "1.2.1"
                }
            })
        });

        const data = await boldResponse.json();

        // 6. Respuesta al Frontend
        if (data.payload && data.payload.payment_url) {
            console.log(`✅ [NEXUS-V1.2.1] Link Generado: ${reference}`);
            res.status(200).json({ 
                url: data.payload.payment_url, 
                reference: reference,
                monto: totalAmountRounded 
            });
        } else {
            console.error("❌ [BOLD_ERROR]:", data);
            throw new Error(data.message || "Error en la pasarela de pagos.");
        }

    } catch (error) {
        console.error("❌ [NEXUS_FATAL_ERROR]:", error.message);
        res.status(500).json({ error: error.message });
    }
}
