import admin from "firebase-admin";

// Inicialización segura del SDK
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
        });
    } catch (e) {
        console.error("❌ Error inicializando Firebase Admin:", e);
    }
}

const db = admin.firestore();

export default async function handler(req, res) {
    // Solo permitir POST (Protocolo de seguridad)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const paymentData = req.body;

    // Log de auditoría para debug en tiempo real
    console.log(`📩 Recibido evento de pago: ${paymentData.reference} - Status: ${paymentData.status}`);

    // Verificar si el pago fue aprobado por la pasarela (Bold/Nexus-X)
    if (paymentData.status === 'APPROVED') {
        const reference = paymentData.reference;
        
        try {
            // Estructura esperada: TALLER_USERID_PLAN_MESES (ej: NEXUS_12345_PRO_12M)
            const parts = reference.split('_');
            
            if (parts.length < 4) {
                throw new Error("Formato de referencia inválido");
            }

            const [prefix, userId, planId, monthsRaw] = parts;
            const months = parseInt(monthsRaw.replace(/[^0-9]/g, '')) || 1; // Extraer solo números

            // Calcular fecha de expiración con precisión
            const now = new Date();
            const expireDate = new Date();
            expireDate.setMonth(now.getMonth() + months);

            // Referencia al documento del taller
            const tallerRef = db.collection('talleres').doc(userId);

            // Actualización atómica en Firestore
            await tallerRef.update({
                "subscription.plan": planId,
                "subscription.status": 'ACTIVE',
                "subscription.activationDate": now.toISOString(),
                "subscription.endDate": expireDate.toISOString(),
                "subscription.lastPaymentId": paymentData.id || 'N/A',
                "subscription.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
                "metadata.lastSync": admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`✅ Suscripción activada para Taller ID: ${userId} (${planId})`);
            return res.status(200).json({ 
                success: true, 
                message: "Suscripción actualizada correctamente" 
            });

        } catch (error) {
            console.error("❌ Error en activación Nexus-X:", error.message);
            return res.status(500).json({ 
                error: "Fallo en la actualización de base de datos",
                detail: error.message 
            });
        }
    }

    // Si el pago no está aprobado o es otro evento, respondemos con éxito pero sin acción
    return res.status(200).json({ 
        status: 'received', 
        message: `Estado ${paymentData.status} ignorado por lógica de negocio.` 
    });
}
