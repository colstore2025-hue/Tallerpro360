import admin from "firebase-admin";

// Inicialización con tu variable FIREBASE_SERVICE_ACCOUNT de Vercel
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const evento = req.body;
    const aprobado = ["approved", "successful", "completed"].includes(evento.status?.toLowerCase());
    
    // Seguridad: Validar contra tu BOLD_API_IDENTITY de Vercel
    if (evento.business_id && evento.business_id !== process.env.BOLD_API_IDENTITY) {
        return res.status(401).json({ error: "No autorizado" });
    }

    if (aprobado) {
        // En el link de cobro que el taller le envía al cliente,
        // la metadata debe incluir estos dos IDs.
        const { tallerId, ordenId } = evento.metadata || {};

        if (tallerId && ordenId) {
            try {
                const batch = db.batch();
                
                // Referencia a la orden según la estructura de tu foto
                const ordenRef = db.collection('talleres').doc(tallerId)
                                   .collection('ordenes').doc(ordenId);

                // Actualizamos los campos de la orden basándome en tu captura
                batch.update(ordenRef, {
                    "estado_pago": "APROBADO", // Campo nuevo para tu App
                    "fecha_pago": admin.firestore.FieldValue.serverTimestamp(),
                    "bold_id": evento.id,
                    "monto_recibido": evento.amount?.total || evento.amount
                });

                // Registro en notificaciones (la sub-colección que vi en la foto anterior)
                const notifRef = db.collection('talleres').doc(tallerId)
                                   .collection('notificaciones').doc();
                
                batch.set(notifRef, {
                    "titulo": "💰 PAGO RECIBIDO",
                    "mensaje": `La orden #${ordenId} ha sido pagada exitosamente via Bold.`,
                    "fecha": admin.firestore.FieldValue.serverTimestamp(),
                    "leido": false
                });

                await batch.commit();
                console.log(`✅ Nexus-X: Orden ${ordenId} sincronizada.`);
                return res.status(200).json({ success: true });

            } catch (error) {
                console.error("❌ Error en el Webhook:", error.message);
                return res.status(500).json({ error: "Fallo en Firestore" });
            }
        }
    }

    // Respuesta obligatoria para Bold
    res.status(200).json({ status: 'recibido_sin_accion' });
}
