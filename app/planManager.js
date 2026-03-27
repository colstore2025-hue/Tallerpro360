/**
 * planManager.js - TallerPRO360 V10.6.0 🛰️
 * Motor de Suscripciones Nexus-X Starlink (Powered by Bold)
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

export async function procesarSuscripcionBold(planId, periodo, uid, email) {
    const plan = PLANES_CONFIG[planId];
    if (!plan) throw new Error("Plan no identificado");

    const monto = plan[periodo];
    const nombreCompleto = `[${periodo.toUpperCase()}] Plan ${plan.nombre} - Nexus-X`;
    
    console.log(`🛰️ Iniciando protocolo de pago: ${nombreCompleto} por $${monto}`);

    // Referencia única para seguimiento en Firebase
    const referenciaNexus = `SUB_${uid}_${Date.now()}`;

    // CONFIGURACIÓN DEL CHECKOUT BOLD
    // Nota: Usamos las llaves de PRUEBA que me diste
    const checkout = new BoldCheckout({
        orderId: referenciaNexus,
        amount: monto,
        currency: 'COP',
        description: nombreCompleto,
        apiKey: 'Msbo2MPoBdHPDV9SL5WLoUNWlR1mVkyTwgvdB6rjsU0', // Tu llave de identidad (Pruebas)
        integrityKey: 'xdAB11ZPl0UqH_VmG91dcA', // Tu llave secreta (Pruebas)
        redirectionUrl: 'https://tallerpro360.vercel.app/app/success.html',
        tax: 0,
        metadata: {
            firebase_uid: uid,
            plan_tipo: planId,
            periodo: periodo
        }
    });

    checkout.open();
}
