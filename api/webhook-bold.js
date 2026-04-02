import admin from "firebase-admin";
import nodemailer from "nodemailer";

// 1. Inicialización de Firebase con tu variable exacta de Vercel
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
        });
    } catch (e) {
        console.error("❌ Error FATAL inicializando Firebase:", e.message);
    }
}
const db = admin.firestore();

// 2. Configuración de Correo (Usando tu variable EMAIL_PASS)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'pro360core@gmail.com',
        pass: process.env.EMAIL_PASS 
    }
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    // Bold envía el cuerpo como objeto automáticamente en Vercel
    const paymentData = req.body;

    // AUDITORÍA DE SEGURIDAD: Verificar que el pago es para tu comercio
    // Usamos BOLD_API_IDENTITY que ya tienes en Vercel
    if (paymentData.business_id && paymentData.business_id !== process.env.BOLD_API_IDENTITY) {
        console.warn("⚠️ Intento de acceso desde un Business ID no autorizado.");
        return res.status(401).json({ error: "No autorizado" });
    }

    if (paymentData.status === 'APPROVED') {
        const reference = paymentData.reference; // Ej: NEXUS_USER123_ELITE_1M
        
        try {
            const parts = reference.split('_');
            if (parts.length < 3) throw new Error("Formato de referencia inválido");

            const [prefix, userId, planId, monthsRaw] = parts;
            const months = parseInt(monthsRaw.replace(/[^0-9]/g, '')) || 1;
            
            const now = new Date();
            const expireDate = new Date();
            expireDate.setMonth(now.getMonth() + months);

            const tallerRef = db.collection('talleres').doc(userId);
            const userSnap = await tallerRef.get();
            
            if (!userSnap.exists) {
                console.error(`❌ Taller con ID ${userId} no encontrado en Firestore.`);
                return res.status(404).json({ error: "Taller no existe" });
            }

            const userData = userSnap.data();

            // A. Actualizar Suscripción en Firestore
            await tallerRef.update({
                "subscription.plan": planId,
                "subscription.status": 'ACTIVE',
                "subscription.endDate": expireDate.toISOString(),
                "subscription.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
                "subscription.lastTransactionId": paymentData.id || "N/A"
            });

            // B. Crear Notificación interna
            await tallerRef.collection('notifications').add({
                title: "🚀 Nodo Nexus-X Activado",
                message: `Tu plan ${planId} está listo hasta el ${expireDate.toLocaleDateString()}.`,
                type: "SUBSCRIPTION_SUCCESS",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                read: false
            });

            // C. Enviar Correo de Bienvenida (Si el usuario tiene email)
            const targetEmail = userData.email || paymentData.customer_email;
            if (targetEmail) {
                await enviarCorreoBienvenida(targetEmail, userData.nombreTaller || "Tu Taller", planId, expireDate);
            }

            console.log(`✅ Sincronización Exitosa: Taller ${userId} en plan ${planId}.`);
            return res.status(200).json({ success: true });

        } catch (error) {
            console.error("❌ Error en el proceso de Webhook:", error.message);
            return res.status(500).json({ error: "Error de sincronización interna" });
        }
    }

    // Responder 200 a Bold siempre para que no reintente el envío infinitamente
    res.status(200).json({ status: 'processed_but_not_approved' });
}

async function enviarCorreoBienvenida(email, tallerNombre, plan, fechaFin) {
    const mailOptions = {
        from: `"Nexus-X Starlink" <pro360core@gmail.com>`,
        to: email,
        subject: `🚀 ¡Bienvenido al Ecosistema Nexus-X!`,
        html: `
            <div style="font-family: Arial, sans-serif; background-color: #020617; color: #ffffff; padding: 40px; border-radius: 20px; border: 1px solid #06b6d4; max-width: 600px; margin: auto;">
                <h1 style="color: #06b6d4; text-transform: uppercase;">Nexus-X: Enlace Establecido</h1>
                <p>Hola <strong>${tallerNombre}</strong>,</p>
                <p>Tu infraestructura digital ha sido actualizada con éxito.</p>
                <div style="background: #0f172a; padding: 20px; border-left: 5px solid #06b6d4; margin: 25px 0;">
                    <p style="margin: 5px 0;"><strong>Plan:</strong> ${plan}</p>
                    <p style="margin: 5px 0;"><strong>Vence:</strong> ${fechaFin.toLocaleDateString()}</p>
                </div>
                <a href="https://tallerpro360.com" style="background: #06b6d4; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">INICIAR PANEL CORE</a>
                <p style="font-size: 10px; color: #475569; margin-top: 50px;">SISTEMA LOGÍSTICO NEXUS-X STARLINK | 2026</p>
            </div>
        `
    };
    return transporter.sendMail(mailOptions);
}
