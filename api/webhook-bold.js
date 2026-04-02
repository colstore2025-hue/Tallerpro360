import admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).send("DENIED");

    try {
        const evento = req.body;
        const meta = evento.metadata || {};
        const aprobado = ["approved", "successful", "completed"].includes(evento.status?.toLowerCase());

        // Validación de seguridad con tu ID de Bold en Vercel
        if (evento.business_id && evento.business_id !== process.env.BOLD_API_IDENTITY) {
            return res.status(401).send("UNAUTHORIZED");
        }

        if (aprobado && meta.empresaId) {
            const batch = db.batch();
            const { empresaId, planId, meses } = meta;
            const monto = evento.amount?.total || evento.amount;

            // 1. ACTUALIZAR LA EMPRESA (Suscripción)
            // Según tus fotos, los datos del taller están en 'empresas' o 'talleres'
            // Usamos 'empresas' porque ahí es donde gestionas los módulos de cobro
            const empresaRef = db.collection("empresas").doc(empresaId);
            
            const fechaExpira = new Date();
            fechaExpira.setMonth(fechaExpira.getMonth() + (parseInt(meses) || 1));

            batch.update(empresaRef, {
                "suscripcion.plan": planId,
                "suscripcion.estado": "ACTIVO",
                "suscripcion.fecha_vencimiento": fechaExpira.toISOString(),
                "suscripcion.ultima_actualizacion": admin.firestore.FieldValue.serverTimestamp()
            });

            // 2. REGISTRAR EN COLECCIÓN PRINCIPAL: 'contabilidad'
            // Este es TU ingreso por la venta del software
            const contaRef = db.collection("contabilidad").doc();
            batch.set(contaRef, {
                tipo: "ingreso_software",
                monto: monto,
                concepto: `Venta Plan ${planId} - Empresa ID: ${empresaId}`,
                fecha: admin.firestore.FieldValue.serverTimestamp(),
                referencia_bold: evento.id
            });

            // 3. REGISTRAR EN COLECCIÓN PRINCIPAL: 'pagos'
            const pagoRef = db.collection("pagos").doc(evento.id);
            batch.set(pagoRef, {
                tipo: "suscripcion_nexus",
                empresaId: empresaId,
                monto: monto,
                fecha: admin.firestore.FieldValue.serverTimestamp(),
                data_bold: {
                    tarjeta: evento.payment_method_type,
                    email: evento.customer_email
                }
            });

            await batch.commit();
            console.log(`✅ Suscripción Activada: Empresa ${empresaId} en plan ${planId}`);
            return res.status(200).send("OK");
        }
        return res.status(200).send("NOT_ACTIONABLE");
    } catch (e) {
        console.error("❌ Error en Webhook Suscripciones:", e.message);
        return res.status(200).send("ERROR_LOGGED");
    }
}
