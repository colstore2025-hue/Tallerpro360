/**
 * TALLERPRO360 - NODO NEXUS-X
 * Versión: 1.3.0-production
 * Descripción: Generador Maestro de links de pago Bold (Con descuentos integrados)
 * Última Modificación: Abril 2026
 */

import { PLANS_CONFIG } from './plans-config.js';

export default async function handler(req, res) {
    // 1. Control de Protocolo
    if (req.method !== 'POST') {
        return res.status(405).json({ status: "NEXUS_DENIED", message: "Protocolo requiere POST" });
    }

    // 2. Extracción de Datos
    const { planId, months, userEmail, userId, empresaId } = req.body;

    if (!planId || !months || !empresaId) {
        return res.status(400).json({ error: "Datos insuficientes (Falta planId, months o empresaId)" });
    }

    try {
        // 3. Validación de Llaves (Usando SECRET según tu Vercel)
        const BOLD_SECRET = process.env.BOLD_API_SECRET;
        
        if (!BOLD_SECRET) {
            console.error("❌ ERROR: BOLD_API_SECRET no configurada en Vercel.");
            throw new Error("Error de configuración en el servidor.");
        }

        // 4. Lógica de Precios Nexus-X
        const selectedPlan = PLANS_CONFIG[planId];
        if (!selectedPlan) throw new Error("El plan seleccionado no existe.");

        const amountTotal = selectedPlan.prices[String(months)];
        if (!amountTotal) throw new Error("La duración (meses) no es válida para este plan.");

        // 5. Preparación de Referencia y Montos
        const reference = `NEXUS_${empresaId}_${Date.now()}`;
        const totalAmountRounded = Math.round(amountTotal);

        /**
         * 6. CONEXIÓN CON BOLD API V2
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
                customer_email: userEmail || "pago@tallerpro360.com",
                metadata: {
                    empresaId: String(empresaId),
                    planId: String(planId),
                    meses: String(months),
                    usuarioId: String(userId || "N/A"),
                    v_nexus: "1.3.0"
                }
            })
        });

        const data = await boldResponse.json();

        // 7. Respuesta Final
        if (data.payload && data.payload.payment_url) {
            console.log(`✅ [NEXUS-V1.3.0] Link Generado: ${reference} por $${totalAmountRounded}`);
            res.status(200).json({ 
                url: data.payload.payment_url, 
                reference: reference,
                monto: totalAmountRounded,
                plan: selectedPlan.name
            });
        } else {
            console.error("❌ [BOLD_API_ERROR]:", data);
            throw new Error(data.message || "La pasarela no pudo procesar la solicitud.");
        }

    } catch (error) {
        console.error("❌ [NEXUS_FATAL_ERROR]:", error.message);
        res.status(500).json({ error: error.message });
    }
}
