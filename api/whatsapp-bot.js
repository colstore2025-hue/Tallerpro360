import admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
    });
}
const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).send("DENIED");

    try {
        const evento = req.body;
        const meta = evento.metadata || {};

        if (evento.status?.toLowerCase() === "approved" && meta.empresaId) {
            const batch = db.batch();
            const { empresaId, facturaId, placa } = meta;

            // Actualizar Factura
            const finanzasRef = db.collection("empresas").doc(empresaId)
                                  .collection("finanzas").doc(facturaId);
            batch.set(finanzasRef, { estado: "PAGADA", recaudoId: evento.id }, { merge: true });

            // Registrar en Libro Diario
            const libroRef = db.collection("empresas").doc(empresaId).collection("contabilidad").doc();
            batch.set(libroRef, {
                tipo: "ingreso",
                monto: evento.amount?.total || evento.amount,
                concepto: `Pago Factura #${facturaId} | Placa: ${placa}`
            });

            await batch.commit();
            return res.status(200).send("OK");
        }
        return res.status(200).send("NOT_ACTIONABLE");
    } catch (e) { return res.status(200).send("ERROR"); }
}
