/**
 * activar-trial.js - Ecosistema Nexus-X
 * Crea Empresa, Sucursal, Empleado e Inicializa Contabilidad.
 */
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
    if (req.method !== "POST") return res.status(405).end();

    const { empresaId, nombreEmpresa, usuarioId, email } = req.body;
    const batch = db.batch();
    const ahora = admin.firestore.Timestamp.now();
    const finTrial = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    try {
        // Documento Maestro Empresa
        batch.set(db.collection("empresas").doc(empresaId), {
            nombre: nombreEmpresa,
            estado: "trial",
            plan: { tipo: "freemium", fin: finTrial },
            creadoEn: ahora
        });

        // Vincular Usuario
        batch.set(db.collection("usuarios").doc(usuarioId), {
            empresaId, rol: "dueno", email
        }, { merge: true });

        // Inicializar subcolecciones críticas
        const subs = ["ordenes", "clientes", "finanzas"];
        subs.forEach(s => {
            batch.set(db.collection("empresas").doc(empresaId).collection(s).doc("__init__"), { active: true });
        });

        await batch.commit();
        res.status(200).json({ status: "success", expira: finTrial.toDate() });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
