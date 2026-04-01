/**
 * planManager.js - TallerPRO360 V14.5.0 🛰️
 * Motor de Suscripciones Nexus-X Starlink (Powered by Bold)
 */

export const PLANES_CONFIG = {
    basico: { nombre: "Básico", mensual: 49900, trimestral: 134700, semestral: 239500, anual: 419200 },
    pro: { nombre: "PRO", mensual: 79900, trimestral: 215700, semestral: 383500, anual: 671200 },
    elite: { nombre: "ELITE", mensual: 129000, trimestral: 348300, semestral: 619200, anual: 1083600 }
};

export async function procesarSuscripcionBold(planId, periodo, uid, email = "") {
    const plan = PLANES_CONFIG[planId.toLowerCase()];
    if (!plan) throw new Error("ERROR NEXUS: PLAN NO IDENTIFICADO");

    const monto = plan[periodo.toLowerCase()];
    if (!monto) throw new Error("ERROR NEXUS: PERIODO INVÁLIDO");

    const nombreSuscripcion = `[${periodo.toUpperCase()}] PLAN ${plan.nombre.toUpperCase()} - NEXUS-X STARLINK`;
    const referenciaNexus = `NXS-SUB-${uid ? uid.substring(0,5) : 'GUEST'}-${Date.now()}`;

    const isLocal = window.location.hostname === "localhost";
    
    // Llaves de producción detectadas de tu configuración previa
    const BOLD_CREDENTIALS = {
        apiKey: isLocal ? 'c0S_rTfd6bmQY99Nrc_t68MEOM2zV4IHk-Yr3zP3-v4' : 'Msbo2MPoBdHPDV9SL5WLoUNWlR1mVkyTwgvdB6rjsU0',
        integrityKey: isLocal ? 'zPuNOc2IDS3JGW809m0RMw' : 'xdAB11ZPl0UqH_VmG91dcA'
    };

    try {
        const checkout = new BoldCheckout({
            orderId: referenciaNexus,
            amount: monto,
            currency: 'COP',
            description: nombreSuscripcion,
            apiKey: BOLD_CREDENTIALS.apiKey,
            integrityKey: BOLD_CREDENTIALS.integrityKey,
            redirectionUrl: 'https://tallerpro360.vercel.app/app/success.html',
            tax: 0,
            metadata: { firebase_uid: uid, plan_tipo: planId, periodo: periodo, engine_version: "V14.5-STARLINK" }
        });
        checkout.open();
    } catch (error) {
        console.error("❌ FALLA CRÍTICA EN GATEWAY BOLD:", error);
        alert("Error de conexión con Bold. Verifique su red.");
    }
}
