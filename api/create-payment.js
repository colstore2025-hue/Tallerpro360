import { PLANS_CONFIG } from './plans-config.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    const { planId, months, userEmail, userId } = req.body;

    try {
        const selectedPlan = PLANS_CONFIG[planId];
        const amountTotal = selectedPlan?.prices[months];

        if (!amountTotal) throw new Error("Plan o duración no válida.");

        // Referencia única Nexus-X
        const reference = `T360_${userId}_${planId}_${months}M_${Date.now()}`;

        const baseAmount = Math.round(amountTotal / 1.19);
        const taxAmount = amountTotal - baseAmount;

        const boldResponse = await fetch('https://integrations.api.bold.co/payments/app-checkout', {
            method: 'POST',
            headers: {
                // Usamos la identidad de comercio grabada en Vercel
                'Authorization': `x-api-key ${process.env.BOLD_API_IDENTITY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: {
                    currency: "COP",
                    taxes: [{ type: "VAT", base: baseAmount, value: taxAmount }],
                    total_amount: amountTotal
                },
                payment_method: "PAY_BY_LINK",
                reference: reference,
                description: `${selectedPlan.name} - ${months} Mes(es)`,
                user_email: "vendedor@tallerpro360.com",
                payer: { email: userEmail }
            })
        });

        const data = await boldResponse.json();
        if (data.errors) throw new Error("Error en Bold API");

        res.status(200).json({ url: data.payload.payment_link, reference });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
