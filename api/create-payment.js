/**
 * TALLERPRO360 - NODO NEXUS-X
 * Versión: 1.4.0-production (Auditoría de Nomenclatura)
 * Ruta: api/create-payment.js
 */

import { PLANS_CONFIG } from './plans-config.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: "NEXUS_DENIED", message: "POST requerido" });
    }

    const { planId, months, userEmail, userId, empresaId } = req.body;

    // Validación de campos obligatorios para el handshake
    if (!planId || !months || !empresaId) {
        return res.status(400).json({ error: "Faltan parámetros: planId, months o empresaId" });
    }

    try {
        // USO DE TUS VARIABLES EXACTAS DE VERCEL
        const apiKey = process.env.BOLD_API_SECRET;
        const apiIdentity = process.env.BOLD_API_IDENTITY;
        const mode = process.env.NEXT_PUBLIC_PAYMENT_MODE; // Por si necesitas switch de Sandbox

        if (!apiKey || !apiIdentity) {
            console.error("❌ ERROR: Credenciales BOLD incompletras en Vercel (Secret o Identity).");
            throw new Error("Error de configuración de llaves.");
        }

        const selectedPlan = PLANS_CONFIG[planId.toLowerCase()];
        if (!selectedPlan) throw new Error(`Plan ${planId} no reconocido.`);

        const rawAmount = selectedPlan.prices[String(months)];
        if (!rawAmount) throw new Error("Duración de suscripción no válida.");

        const reference = `NEXUS_${empresaId}_${Date.now()}`;
        const totalAmount = Math.round(rawAmount);

        /**
         * CONEXIÓN SEGURA CON BOLD V2
         * Usando Identity y Secret según tu configuración
         */
        const boldResponse = await fetch('https://api.bold.co/v2/payment-links', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'X-API-ID': apiIdentity, // Usando tu variable BOLD_API_IDENTITY
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: `TallerPRO360: ${selectedPlan.name} - ${months} Mes(es)`,
                amount: totalAmount,
                currency: "COP",
                order_id: reference,
                notification_url: "https://tallerpro360.vercel.app/api/webhook-bold",
                redirect_url: "https://tallerpro360.vercel.app/home.html?status=success",
                customer_email: userEmail || "pago@tallerpro360.com",
                metadata: {
                    empresaId: String(empresaId),
                    planId: String(planId),
                    usuarioId: String(userId || "N/A"),
                    modo: mode || "production"
                }
            })
        });

        const data = await boldResponse.json();

        if (data.payload && data.payload.payment_url) {
            res.status(200).json({ 
                url: data.payload.payment_url, 
                reference: reference 
            });
        } else {
            console.error("❌ BOLD ERROR:", data);
            throw new Error(data.message || "Error al generar link en Bold");
        }

    } catch (error) {
        console.error("❌ NEXUS_FATAL:", error.message);
        res.status(500).json({ error: error.message });
    }
}