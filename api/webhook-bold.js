import { PLANS_CONFIG } from './plans-config.js';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializar Firebase Admin (Usa variables de entorno para seguridad)
if (!getApps().length) {
    initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = getFirestore();

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const paymentData = req.body;

    // 1. Verificar si el pago fue aprobado por Bold
    if (paymentData.status === 'APPROVED') {
        const reference = paymentData.reference; // Ej: T360_USR123_PRO_6M_1711920000
        
        try {
            // 2. Extraer datos de la referencia
            const [prefix, userId, planId, monthsRaw] = reference.split('_');
            const months = parseInt(monthsRaw.replace('M', ''));

            // 3. Calcular fecha de vencimiento
            const now = new Date();
            const expireDate = new Date(now.setMonth(now.getMonth() + months));

            // 4. Actualizar el documento del Taller en Firestore
            const shopRef = db.collection('talleres').doc(userId);
            
            await shopRef.update({
                subscription: {
                    plan: planId,
                    status: 'ACTIVE',
                    startDate: new Date().toISOString(),
                    endDate: expireDate.toISOString(),
                    lastPaymentRef: reference,
                    updatedAt: new Date().toISOString()
                }
            });

            console.log(`✅ Taller ${userId} activado hasta ${expireDate.toLocaleDateString()}`);
            return res.status(200).json({ success: true });

        } catch (error) {
            console.error("❌ Error actualizando Firestore:", error);
            return res.status(500).json({ error: "Error interno al activar suscripción" });
        }
    }

    // Si el pago es rechazado o pendiente, solo respondemos 200 para que Bold no reintente
    res.status(200).json({ status: 'ignored' });
}
