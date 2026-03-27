/**
 * planManager.js - TallerPRO360 V14.5.0 🛰️
 * Motor de Suscripciones Nexus-X Starlink (Powered by Bold)
 * Optimización: Detección Automática de Entorno & Integridad de Datos
 */

export const PLANES_CONFIG = {
    basico: {
        nombre: "Básico",
        mensual: 49900,
        trimestral: 134700,
        semestral: 239500,
        anual: 419200
    },
    pro: {
        nombre: "PRO",
        mensual: 79900,
        trimestral: 215700,
        semestral: 383500,
        anual: 671200
    },
    elite: {
        nombre: "ELITE",
        mensual: 129000,
        trimestral: 348300,
        semestral: 619200,
        anual: 1083600
    }
};

/**
 * PROCESAR SUSCRIPCIÓN BOLD
 * @param {string} planId - 'basico', 'pro', 'elite'
 * @param {string} periodo - 'mensual', 'trimestral', 'semestral', 'anual'
 * @param {string} uid - ID del usuario de Firebase
 * @param {string} email - Email para recibo de Bold
 */
export async function procesarSuscripcionBold(planId, periodo, uid, email = "") {
    const plan = PLANES_CONFIG[planId.toLowerCase()];
    if (!plan) throw new Error("ERROR NEXUS: PLAN NO IDENTIFICADO");

    const monto = plan[periodo.toLowerCase()];
    if (!monto) throw new Error("ERROR NEXUS: PERIODO INVÁLIDO");

    const nombreSuscripcion = `[${periodo.toUpperCase()}] PLAN ${plan.nombre.toUpperCase()} - NEXUS-X STARLINK`;
    
    // Generador de referencia única estilo Blockchain
    const referenciaNexus = `NXS-SUB-${uid.substring(0,5)}-${Date.now()}`;

    console.log(`🛰️ PROTOCOLO DE PAGO INICIADO: ${nombreSuscripcion} por $${monto.toLocaleString()}`);

    // --- CONFIGURACIÓN DE LLAVES (AUTO-DETECT) ---
    // Si la URL contiene 'localhost' usa pruebas, si no, usa tus llaves de producción
    const isLocal = window.location.hostname === "localhost";
    
    const BOLD_CREDENTIALS = {
        apiKey: isLocal 
            ? 'c0S_rTfd6bmQY99Nrc_t68MEOM2zV4IHk-Yr3zP3-v4' // Pruebas
            : 'Msbo2MPoBdHPDV9SL5WLoUNWlR1mVkyTwgvdB6rjsU0', // Tu Llave Producción
        integrityKey: isLocal
            ? 'zPuNOc2IDS3JGW809m0RMw' // Pruebas
            : 'xdAB11ZPl0UqH_VmG91dcA' // Tu Llave Integridad Producción
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
            metadata: {
                firebase_uid: uid,
                plan_tipo: planId,
                periodo: periodo,
                engine_version: "V14.5-STARLINK",
                plataforma: "TallerPRO360"
            }
        });

        checkout.open();
        
    } catch (error) {
        console.error("❌ FALLA CRÍTICA EN GATEWAY BOLD:", error);
        alert("NEXUS-X: Error al conectar con la pasarela de pagos. Verifique su conexión.");
    }
}
