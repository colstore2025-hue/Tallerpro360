/**
 * planManager.js - TallerPRO360 V14.5.0 🛰️
 * Motor Unificado Nexus-X Starlink
 */

export const PLANES_CONFIG = {
    basico: { nombre: "Básico", mensual: 49900 },
    pro: { nombre: "PRO", mensual: 79900 },
    elite: { nombre: "ELITE", mensual: 129000 }
};

// 1. FUNCIÓN PARA COBRAR PLANES (BOLD)
export async function procesarSuscripcionBold(planId, periodo, uid) {
    try {
        const plan = PLANES_CONFIG[planId.toLowerCase()];
        const monto = plan.mensual; // O la lógica de periodo que prefieras
        
        // LA REFERENCIA DEBE COINCIDIR CON EL WEBHOOK
        // Formato: NEXUS_USERID_PLAN_MESES
        const referenciaNexus = `NEXUS_${uid}_${planId.toUpperCase()}_1M`;

        console.log("🛰️ Redirigiendo a Pasarela Nexus-X...");
        
        // Usamos URL Directa (más segura que el SDK para evitar bloqueos de script)
        const urlBold = `https://bold.co/pay/tallerpro360?amount=${monto}&reference=${referenciaNexus}`;
        
        window.location.href = urlBold;
    } catch (error) {
        console.error("❌ FALLA EN PROCESO BOLD:", error);
        alert("Error al generar el enlace de pago.");
    }
}

// 2. FUNCIÓN PARA EL TRIAL (PRUEBA GRATIS)
export function iniciarTrial(uid, email) {
    if(!uid || uid === "GUEST") {
        alert("Por favor inicia sesión para activar tu prueba gratis.");
        return;
    }
    
    // Aquí disparamos el modal que creamos en los pasos anteriores
    if (window.abrirTrial) {
        window.abrirTrial();
    } else {
        console.error("Nodo de Trial no cargado en el DOM");
    }
}
