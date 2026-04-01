/**
 * payments.js - Motor de Pagos TallerPRO360 🚀
 * Conecta el diseño espectacular con la API de Vercel y Bold.co
 */
import { auth } from "../core/firebase-config.js";

export const handleSubscription = async (planId, months) => {
    const user = auth.currentUser;

    // 1. Verificación de Seguridad: El usuario debe estar logueado
    if (!user) {
        alert("Por favor, inicia sesión para continuar con la suscripción.");
        // Aquí podrías abrir tu modal de login automáticamente
        return;
    }

    try {
        console.log(`🚀 Iniciando pago para ${planId} (${months} meses)...`);
        
        // 2. Llamada a tu función de Vercel
        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                planId: planId,           // BASIC, PRO o ELITE
                months: months,           // 1, 3, 6 o 12
                userEmail: user.email,    // Email del dueño del taller
                userId: user.uid          // ID único para Firestore
            })
        });

        const data = await response.json();

        if (data.url) {
            // 3. Redirección Automática a la Pasarela de Bold (PSE/Tarjeta)
            // Abrimos en la misma pestaña para mantener la experiencia fluida
            window.location.href = data.url;
        } else {
            throw new Error(data.error || "No se pudo generar el link de pago.");
        }

    } catch (error) {
        console.error("❌ Error en la suscripción:", error);
        alert("Hubo un problema al conectar con la pasarela. Intenta de nuevo.");
    }
};

// Exponer la función globalmente para usarla en los botones del HTML
window.subscribe = handleSubscription;
