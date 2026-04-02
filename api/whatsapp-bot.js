/**
 * TALLERPRO360 - NODO NEXUS-X
 * Versión: 1.4.0-production
 * Descripción: Encolador de mensajes para WhatsApp (Triggers de Starlink)
 * Última Modificación: Abril 2026
 */

import admin from "firebase-admin";

// 1. Inicialización de Master Admin
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
        });
    } catch (e) {
        console.error("❌ [NEXUS_FIREBASE_ERROR]:", e.message);
    }
}

const db = admin.firestore();

export default async function handler(req, res) {
    // Solo permitimos disparos vía POST
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    try {
        const { ordenId, tallerId, mensaje, telefono } = req.body;

        // 2. Validación de datos mínimos
        if (!ordenId || !telefono || !mensaje) {
            return res.status(400).json({ error: "Datos insuficientes para el envío (orden/tel/msj)" });
        }

        // 3. Normalización del Teléfono (Eliminar espacios, guiones o el +)
        const cleanPhone = String(telefono).replace(/\D/g, "");

        const batch = db.batch();

        // 4. REGISTRO EN 'cola_whatsapp' [Referencia: 1000312223.jpg]
        const colaRef = db.collection("cola_whatsapp").doc();
        batch.set(colaRef, {
            ordenId: String(ordenId),
            tallerId: String(tallerId || "GENERAL"),
            telefono: cleanPhone,
            mensaje: mensaje,
            estado: "PENDIENTE", // El bot de Starlink buscará este estado
            fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
            intentos: 0,
            v_nexus: "1.4.0"
        });

        // 5. ACTUALIZACIÓN DE LA ORDEN EN 'ordenes'
        const ordenRef = db.collection("ordenes").doc(String(ordenId));
        batch.update(ordenRef, {
            "notificaciones.ultimo_ws": admin.firestore.FieldValue.serverTimestamp(),
            "notificaciones.estado": "EN_COLA",
            "telefono_notificado": cleanPhone
        });

        await batch.commit();
        
        console.log(`🚀 [NEXUS-V1.4.0] Mensaje encolado: Orden ${ordenId} -> Tel ${cleanPhone}`);
        return res.status(200).json({ 
            success: true, 
            ref: colaRef.id,
            status: "EN_COLA" 
        });

    } catch (e) {
        console.error("❌ [NEXUS_BOT_FATAL]:", e.message);
        return res.status(500).json({ error: "Internal Server Error", detail: e.message });
    }
}
