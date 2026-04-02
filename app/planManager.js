import { PLANS_CONFIG } from '../api/plans-config.js';

/**
 * Procesa la suscripción generando la referencia exacta para el Webhook
 */
export async function procesarSuscripcionBold(planId, meses, uid) {
    try {
        const planKey = planId.toUpperCase();
        const plan = PLANS_CONFIG[planKey];
        
        if (!plan) throw new Error(`Plan ${planId} no existe en la configuración.`);

        const monto = plan.prices[meses];
        if (!monto) throw new Error(`El periodo de ${meses} mes(es) no es válido.`);

        // 🛰️ REFERENCIA MAESTRA (Crucial para el Webhook-Bold.js)
        const referenciaNexus = `NEXUS_${uid}_${planKey}_${meses}M`;

        console.log(`🚀 Iniciando Checkout Nexus-X: ${plan.name}`);

        // Redirección directa para evitar bloqueos de scripts de terceros
        const urlBold = `https://bold.co/pay/tallerpro360?amount=${monto}&reference=${referenciaNexus}`;
        
        window.location.href = urlBold;

    } catch (error) {
        console.error("❌ FALLA CRÍTICA NEXUS-X:", error.message);
        alert("Error de conexión con la pasarela. Intente nuevamente.");
    }
}

/**
 * Motor de Activación de Prueba Gratis (Trial)
 */
export function iniciarTrial() {
    // Verificamos si el modal de trial existe en el DOM (creado en pasos anteriores)
    const modalTrial = document.getElementById('trial-modal') || document.querySelector('[onclick*="abrirTrial"]');
    
    if (window.abrirTrial) {
        window.abrirTrial();
    } else {
        alert("🛰️ Sincronizando módulo de prueba... Intente en 2 segundos.");
        location.reload(); // Recarga para asegurar que los scripts de UI cargaron
    }
}
