import admin from "firebase-admin";

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
        });
    } catch (e) {
        console.error("❌ Error Firebase en Bot:", e.message);
    }
}
const db = admin.firestore();

export default async function handler(req, res) {
    // El bot usualmente recibe triggers de cambios o peticiones de envío
    if (req.method !== "POST") return res.status(405).send("DENIED");

    try {
        const { ordenId, tallerId, mensaje, telefono } = req.body;

        if (!ordenId || !telefono) {
            return res.status(400).send("Faltan datos para el envío");
        }

        const batch = db.batch();

        // 1. REGISTRAR EN LA COLECCIÓN PRINCIPAL: 'cola_whatsapp'
        // Esta es la colección que vi en tu foto 1000312223.jpg
        const colaRef = db.collection("cola_whatsapp").doc();
        batch.set(colaRef, {
            ordenId: ordenId,
            tallerId: tallerId,
            telefono: telefono,
            mensaje: mensaje,
            estado: "PENDIENTE",
            fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
            intentos: 0
        });

        // 2. ACTUALIZAR LA ORDEN: 'ordenes' (Para saber que ya se notificó)
        const ordenRef = db.collection("ordenes").doc(ordenId);
        batch.update(ordenRef, {
            "ultimo_aviso_ws": admin.firestore.FieldValue.serverTimestamp(),
            "estado_notificacion": "EN_COLA"
        });

        await batch.commit();
        
        console.log(`🚀 Mensaje en cola para la Orden: ${ordenId}`);
        return res.status(200).json({ success: true, msg: "Mensaje encolado en Nexus-X" });

    } catch (e) {
        console.error("❌ Error en WhatsApp Bot:", e.message);
        return res.status(500).send("INTERNAL_ERROR");
    }
}
