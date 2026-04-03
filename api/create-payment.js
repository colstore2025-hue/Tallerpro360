/**
 * TALLERPRO360 - NODO NEXUS-X 
 * Versión: 1.5.0-production (Sincronización API v1)
 * Ajuste basado en documentación física: integrations.api.bold.co
 */

import { PLANS_CONFIG } from './plans-config.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: "NEXUS_DENIED", message: "POST requerido" });
    }

    const { planId, months, userEmail, userId, empresaId } = req.body;

    // 1. Validación de campos obligatorios
    if (!planId || !months || !empresaId) {
        return res.status(400).json({ error: "Faltan parámetros: planId, months o empresaId" });
    }

    try {
        // USO DE TUS VARIABLES DE VERCEL (Basado en Foto 1 de tu doc)
        const apiIdentity = process.env.BOLD_API_IDENTITY; 
        
        if (!apiIdentity) {
            console.error("❌ ERROR: BOLD_API_IDENTITY no encontrada en Vercel.");
            throw new Error("Configuración de llaves incompleta.");
        }

        // 2. Lógica de selección de Plan
        const selectedPlan = PLANS_CONFIG[planId.toLowerCase()];
        if (!selectedPlan) throw new Error(`Plan ${planId} no reconocido.`);

        const rawAmount = selectedPlan.prices[String(months)];
        if (!rawAmount) throw new Error("Duración de suscripción no válida.");

        // Referencia única para evitar duplicados en Bold
        const reference = `NEXUS_${empresaId}_${Date.now()}`;
        const totalAmount = Math.round(rawAmount);

        /**
         * CONEXIÓN CON BOLD API v1 (Integrations)
         * Según Foto 1: URL base https://integrations.api.bold.co
         * Según Foto 4: Endpoint /online/link/v1
         */
        const boldResponse = await fetch('https://integrations.api.bold.co/online/link/v1', {
            method: 'POST',
            headers: {
                // Header exacto según tu documentación (Foto 1)
                'Authorization': `x-api-key ${apiIdentity}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount_type: "CLOSE", // Obligatorio para montos fijos
                amount: {
                    currency: "COP",
                    total_amount: totalAmount
                },
                reference: reference,
                description: `TallerPRO360: ${selectedPlan.name} - ${months} Mes(es)`,
                callback_url: "https://tallerpro360.vercel.app/home.html?status=success",
                payer_email: userEmail || "pago@tallerpro360.com",
                // Nota: La v1 de links usa 'payer_email' en lugar de 'customer_email'
            })
        });

        const data = await boldResponse.json();

        // 3. Validación de respuesta (Según esquema Foto 1 de respuesta)
        if (data.payload && data.payload.url) {
            res.status(200).json({ 
                url: data.payload.url, 
                reference: reference,
                payment_link_id: data.payload.payment_link
            });
        } else {
            console.error("❌ BOLD API ERROR:", data);
            throw new Error(data.errors?.[0]?.message || "Error al generar link en Bold v1");
        }

    } catch (error) {
        console.error("❌ NEXUS_FATAL:", error.message);
        res.status(500).json({ error: `Fallo de conexión con Bold: ${error.message}` });
    }
}
