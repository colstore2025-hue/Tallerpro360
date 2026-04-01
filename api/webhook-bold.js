import admin from "firebase-admin";
import nodemailer from "nodemailer";

// 1. Inicialización de Firebase
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = admin.firestore();

// 2. Configuración de Correo (Usando tu nueva cuenta de Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'pro360core@gmail.com',
        pass: process.env.EMAIL_PASS // Aquí va la "Contraseña de Aplicación" de 16 dígitos
    }
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const paymentData = req.body;

    if (paymentData.status === 'APPROVED') {
        const reference = paymentData.reference;
        
        try {
            // Extraer datos de la referencia: NEXUS_USERID_PLAN_1M
            const [prefix, userId, planId, monthsRaw] = reference.split('_');
            const months = parseInt(monthsRaw.replace(/[^0-9]/g, '')) || 1;
            
            const now = new Date();
            const expireDate = new Date();
            expireDate.setMonth(now.getMonth() + months);

            const tallerRef = db.collection('talleres').doc(userId);
            const userSnap = await tallerRef.get();
            const userData = userSnap.data();

            // A. Actualizar Suscripción en Firestore
            await tallerRef.update({
                "subscription.plan": planId,
                "subscription.status": 'ACTIVE',
                "subscription.endDate": expireDate.toISOString(),
                "subscription.updatedAt": admin.firestore.FieldValue.serverTimestamp()
            });

            // B. Crear Notificación interna para el App
            await tallerRef.collection('notifications').add({
                title: "🚀 Nodo Nexus-X Activado",
                message: `Tu plan ${planId} está listo. Expira el ${expireDate.toLocaleDateString()}.`,
                type: "SUBSCRIPTION_SUCCESS",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                read: false
            });

            // C. Enviar Correo de Bienvenida
            if (userData && userData.email) {
                await enviarCorreoBienvenida(userData.email, userData.nombreTaller || "Tu Taller", planId, expireDate);
            }

            console.log(`✅ Sistema Sincronizado: Taller ${userId} activo.`);
            return res.status(200).json({ success: true });

        } catch (error) {
            console.error("❌ Error en el proceso:", error.message);
            return res.status(500).json({ error: "Error de sincronización" });
        }
    }
    res.status(200).json({ status: 'ignored' });
}

async function enviarCorreoBienvenida(email, tallerNombre, plan, fechaFin) {
    const mailOptions = {
        from: `"Nexus-X Starlink" <pro360core@gmail.com>`,
        to: email,
        subject: `🚀 ¡Bienvenido al Ecosistema Nexus-X!`,
        html: `
            <div style="font-family: 'Orbitron', sans-serif; background-color: #020617; color: #ffffff; padding: 40px; border-radius: 20px; border: 1px solid #06b6d4;">
                <h1 style="color: #06b6d4; text-transform: uppercase;">Nexus-X: Enlace Establecido</h1>
                <p>Hola <strong>${tallerNombre}</strong>,</p>
                <p>Tu infraestructura digital ha sido actualizada con éxito a los protocolos de grado aeroespacial.</p>
                <div style="background: #0f172a; padding: 20px; border-left: 5px solid #06b6d4; margin: 25px 0;">
                    <p style="margin: 5px 0;"><strong>Plan Activado:</strong> ${plan}</p>
                    <p style="margin: 5px 0;"><strong>Cobertura hasta:</strong> ${fechaFin.toLocaleDateString()}</p>
                    <p style="margin: 5px 0;"><strong>Estado del Nodo:</strong> OPERATIVO</p>
                </div>
                <p>Ya puedes acceder a todas las funciones de TallerPRO360 desde tu panel de control.</p>
                <br>
                <a href="https://tallerpro360.com" style="background: #06b6d4; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">INICIAR SISTEMA</a>
                <p style="font-size: 10px; color: #475569; margin-top: 50px;">SISTEMA LOGÍSTICO NEXUS-X STARLINK | TODOS LOS DERECHOS RESERVADOS 2026</p>
            </div>
        `
    };
    return transporter.sendMail(mailOptions);
}
