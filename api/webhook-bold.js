// api/webhook-bold.js
import admin from "firebase-admin";

// ... (Inicialización de Admin que ya tenemos) ...

export default async function handler(req, res) {
    const evento = req.body;
    const meta = evento.metadata || {};
    const aprobado = ["approved", "successful", "completed"].includes(evento.status?.toLowerCase());

    if (!aprobado) return res.status(200).send("NOT_ACTIONABLE");

    const batch = db.batch();

    // CASO A: Es una suscripción de Software (Tu negocio)
    if (meta.planId) {
        const empresaRef = db.collection("empresas").doc(meta.empresaId);
        batch.update(empresaRef, { "suscripcion.plan": meta.planId, "suscripcion.estado": "ACTIVO" });
        // Registrar ingreso en tu contabilidad
    } 
    
    // CASO B: Es un pago de una Orden de Trabajo (Negocio del taller)
    else if (meta.ordenId) {
        const ordenRef = db.collection("ordenes").doc(meta.ordenId);
        batch.update(ordenRef, { "estado_pago": "PAGADO" });
        // Registrar en la contabilidad del taller
    }

    await batch.commit();
    return res.status(200).send("OK_NEXUS");
}
