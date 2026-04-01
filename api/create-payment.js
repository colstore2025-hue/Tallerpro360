import { PLANS_CONFIG } from './plans-config.js';

export default async function handler(req, res) {
    // 1. Solo permitir peticiones POST (Seguridad)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { planId, months, userEmail, userId } = req.body;

    try {
        // 2. Validar que el plan y los meses existan en la configuración que grabamos
        const selectedPlan = PLANS_CONFIG[planId];
        const amountTotal = selectedPlan?.prices[months];

        if (!amountTotal) {
            throw new Error("Plan o duración no válida en la configuración.");
        }

        // 3. Crear Referencia Única para el Webhook (Crucial para automatizar)
        // Estructura: T360_IDUSUARIO_PLAN_MESES_TIMESTAMP
        const reference = `T360_${userId}_${planId}_${months}M_${Date.now()}`;

        // 4. Cálculo de impuestos (IVA 19% incluido)
        const baseAmount = Math.round(amountTotal / 1.19);
        const taxAmount = amountTotal - baseAmount;

        // 5. Petición a la API de Bold (Usando tu x-api-key de la foto)
        const boldResponse = await fetch('https://integrations.api.bold.co/payments/app-checkout', {
            method: 'POST',
            headers: {
                'Authorization': `x-api-key ${process.env.BOLD_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: {
                    currency: "COP",
                    taxes: [
                        {
                            type: "VAT",
                            base: baseAmount,
                            value: taxAmount
                        }
                    ],
                    tip_amount: 0,
                    total_amount: amountTotal
                },
                payment_method: "PAY_BY_LINK", // Para que genere el link de PSE/Tarjeta
                reference: reference,
                description: `${selectedPlan.name} - ${months} Mes(es) de suscripción`,
                user_email: "vendedor@tallerpro360.com", // Tu correo de comercio Bold
                payer: {
                    email: userEmail
                }
            })
        });

        const data = await boldResponse.json();

        // 6. Manejo de errores de la API de Bold
        if (data.errors && data.errors.length > 0) {
            console.error("Errores de Bold:", data.errors);
            return res.status(400).json({ error: "Bold no pudo generar el link. Revisa la x-api-key." });
        }

        // 7. Respuesta exitosa: Entregamos el link para abrir en el navegador
        res.status(200).json({ 
            url: data.payload.payment_link, 
            reference: reference 
        });

    } catch (error) {
        console.error("Error en el proceso de pago:", error);
        res.status(500).json({ error: error.message });
    }
}
