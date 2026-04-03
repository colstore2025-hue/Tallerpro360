/**
 * TALLERPRO360 - NODO NEXUS-X 
 * Versión: 1.5.1-production (Sincronización Multimes con Descuentos)
 */

import { PLANS_CONFIG } from './plans-config.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: "NEXUS_DENIED", message: "POST requerido" });
    }

    const { planId, months, userEmail, userId, empresaId } = req.body;

    // Validación de parámetros
    if (!planId || !months || !empresaId) {
        return res.status(400).json({ error: "Faltan parámetros: planId, months o empresaId" });
    }

    try {
        const apiIdentity = process.env.BOLD_API_IDENTITY; 
        if (!apiIdentity) throw new Error("BOLD_API_IDENTITY no configurada en Vercel.");

        // 1. Buscar Plan
        const planKey = planId.toLowerCase();
        const selectedPlan = PLANS_CONFIG[planKey];
        if (!selectedPlan) throw new Error(`El plan '${planId}' no existe en la configuración.`);

        // 2. Buscar Precio con Descuento (Rehabilitación de 1, 3, 6, 12 meses)
        const monthKey = String(months);
        const totalAmount = selectedPlan.prices[monthKey];

        if (!totalAmount) {
            throw new Error(`La duración de ${months} mes(es) no tiene un precio configurado para el ${selectedPlan.name}.`);
        }

        const reference = `NEXUS_${empresaId}_${Date.now()}`;

        // 3. Conexión con Bold API v1
        const boldResponse = await fetch('https://integrations.api.bold.co/online/link/v1', {
            method: 'POST',
            headers: {
                'Authorization': `x-api-key ${apiIdentity}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount_type: "CLOSE",
                amount: {
                    currency: "COP",
                    total_amount: Math.round(totalAmount)
                },
                reference: reference,
                description: `Suscripción ${selectedPlan.name}: ${months} Mes(es)`,
                callback_url: "https://tallerpro360.vercel.app/home.html?status=success",
                payer_email: userEmail || "pago@tallerpro360.com"
            })
        });

        const data = await boldResponse.json();

        if (data.payload && data.payload.url) {
            res.status(200).json({ 
                url: data.payload.url, 
                reference: reference,
                amountPaid: totalAmount 
            });
        } else {
            console.error("❌ BOLD ERROR:", data);
            throw new Error(data.errors?.[0]?.message || "Error en Bold al procesar el monto con descuento.");
        }

    } catch (error) {
        console.error("❌ NEXUS_FATAL:", error.message);
        res.status(500).json({ error: error.message });
    }
}
