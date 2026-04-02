import admin from "firebase-admin";

// Inicialización usando tu JSON completo de Vercel
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
        });
    } catch (e) {
        console.error("❌ Error Firebase:", e.message);
    }
}
const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).send("DENIED");

    try {
        const evento = req.body;
        const meta = evento.metadata || {};
        const aprobado = ["approved", "successful", "completed"].includes(evento.status?.toLowerCase());

        // 1. SEGURIDAD: Validar contra tu BOLD_API_IDENTITY de Vercel
        if (evento.business_id && evento.business_id !== process.env.BOLD_API_IDENTITY) {
            return res.status(401).send("UNAUTHORIZED");
        }

        if (aprobado && meta.ordenId) {
            const batch = db.batch();
            const monto = evento.amount?.total || evento.amount;

            // 2. ACTUALIZAR COLECCIÓN PRINCIPAL: 'ordenes' (Donde vive la placa y el total)
            const ordenRef = db.collection("ordenes").doc(meta.ordenId);
            batch.update(ordenRef, {
                "estado_pago": "PAGADO",
                "bold_id": evento.id,
                "fecha_sincronizacion": admin.firestore.FieldValue.serverTimestamp()
            });

            // 3. REGISTRAR EN COLECCIÓN PRINCIPAL: 'contabilidad' (Ingreso de caja)
            const contaRef = db.collection("contabilidad").doc();
            batch.set(contaRef, {
                tipo: "ingreso",
                monto: monto,
                concepto: `Pago Recibido Orden #${meta.ordenId}`,
                placa: meta.placa || "N/A",
                empresaId: meta.empresaId, // ID del taller para filtrar su contabilidad
                fecha: admin.firestore.FieldValue.serverTimestamp(),
                referencia: evento.id
            });

            // 4. REGISTRAR EN COLECCIÓN PRINCIPAL: 'pagos' (Auditoría de pasarela)
            const pagoRef = db.collection("pagos").doc(evento.id);
            batch.set(pagoRef, {
                ordenId: meta.ordenId,
                monto: monto,
                status: "APROBADO",
                email_cliente: evento.customer_email || "N/A",
                fecha: admin.firestore.FieldValue.serverTimestamp()
            });

            await batch.commit();
            console.log(`✅ Sincronización Exitosa: Orden ${meta.ordenId}`);
            return res.status(200).send("OK");
        }
        
        return res.status(200).send("NOT_ACTIONABLE");
    } catch (e) {
        console.error("❌ Fallo Crítico:", e.message);
        return res.status(200).send("ERROR_LOGGED");
    }
}
