// api/webhooks-bold.js
import admin from "firebase-admin";

export default async function handler(req, res) {
    const data = req.body;
    const meta = data.payload?.metadata;

    // Si tiene planId, es una suscripción del sistema
    if (meta?.planId) {
        // ... Lógica que ya teníamos para activar planes en 'empresas' ...
    } 
    // Si no tiene planId pero tiene empresaId, es un pago de un taller
    else if (meta?.empresaId) {
        // ... Lógica que ya teníamos para actualizar 'ordenes' y 'contabilidad' ...
    }
    
    res.status(200).send("NEXUS_SYNC_OK");
}
