import admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const paymentData = req.body;
    console.log(`📩 Webhook Nexus-X: Procesando ${paymentData.reference}`);

    if (paymentData.status === 'APPROVED') {
        const reference = paymentData.reference;
        
        try {
            // Desglosar la referencia: NEXUS_12345_PRO_1M
            const parts = reference.split('_');
            if (parts.length < 4) throw new Error("Referencia mal formada");

            const [prefix, userId, planId, monthsRaw] = parts;
            const months = parseInt(monthsRaw.replace(/[^0-9]/g, '')) || 1;

            const now = new Date();
            const expireDate = new Date();
            expireDate.setMonth(now.getMonth() + months);

            // 1. REFERENCIA AL DOCUMENTO DEL TALLER
            const tallerRef = db.collection('talleres').doc(userId);

            // 2. ACTUALIZACIÓN DE SUSCRIPCIÓN
            await tallerRef.update({
                "subscription.plan": planId,
                "subscription.status": 'ACTIVE',
                "subscription.endDate": expireDate.toISOString(),
                "subscription.updatedAt": admin.firestore.FieldValue.serverTimestamp()
            });

            // 3. CREACIÓN DE NOTIFICACIÓN PARA EL APP (Interfaz del usuario)
            await tallerRef.collection('notifications').add({
                title: "🚀 Nodo Nexus-X Activado",
                message: `Tu plan ${planId} ha sido activado. Vence el: ${expireDate.toLocaleDateString()}`,
                type: "SUBSCRIPTION_SUCCESS",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                read: false
            });

            console.log(`✅ ÉXITO: Taller ${userId} actualizado a ${planId}`);
            return res.status(200).json({ success: true });

        } catch (error) {
            console.error("❌ ERROR WEBHOOK:", error.message);
            return res.status(500).json({ error: "Error interno en activación" });
        }
    }
    
    res.status(200).json({ status: 'ignored' });
}
