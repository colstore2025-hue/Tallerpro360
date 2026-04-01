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

    if (paymentData.status === 'APPROVED') {
        const reference = paymentData.reference;
        
        try {
            const [prefix, userId, planId, monthsRaw] = reference.split('_');
            const months = parseInt(monthsRaw.replace('M', ''));
            const expireDate = new Date();
            expireDate.setMonth(expireDate.getMonth() + months);

            await db.collection('talleres').doc(userId).update({
                subscription: {
                    plan: planId,
                    status: 'ACTIVE',
                    endDate: expireDate.toISOString(),
                    updatedAt: new Date().toISOString()
                }
            });

            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: "Error en activación" });
        }
    }
    res.status(200).json({ status: 'ignored' });
}
