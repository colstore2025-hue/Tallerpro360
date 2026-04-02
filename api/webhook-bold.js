/**
 * TALLERPRO360 - NODO NEXUS-X
 * Versión: 1.3.2-production
 * Descripción: Webhook Mixto (Suscripciones + Órdenes de Taller)
 */

import admin from "firebase-admin";

// 1. Inicialización Protegida (Evita duplicidad en Vercel)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}

const db = admin.firestore();

export default async function handler(req, res) {
    // Solo aceptamos POST de Bold
    if (req.method !== 'POST') return res.status(405).send("Method Not Allowed");

    try {
        const evento = req.body;
        
        // 2. Validación de Seguridad (Identidad Bold)
        // Verificamos que el pago realmente venga de tu comercio registrado
        if (evento.merchant_id !== process.env.BOLD_API_IDENTITY) {
            console.error("⚠️ Intento de acceso no autorizado detectado.");
            return res.status(401).send("UNAUTHORIZED_MERCHANT");
        }

        // 3. Extraer Metadata y Estado
        // Bold suele enviar el estado en data.status o status
        const status = (evento.data?.status || evento.status || "").toLowerCase();
        const meta = evento.data?.metadata || evento.metadata || {};
        
        const aprobado = ["approved", "successful", "completed"].includes(status);

        if (!aprobado) {
            console.log(`ℹ️ Pago no aprobado (Estado: ${status}). No se ejecutan cambios.`);
            return res.status(200).send("PAYMENT_NOT_READY");
        }

        const batch = db.batch();

        // --- LÓGICA DE DISTRIBUCIÓN NEXUS-X ---

        // CASO A: Suscripción de Software (Tu negocio)
        if (meta.planId && meta.empresaId) {
            console.log(`🚀 Activando Plan ${meta.planId} para Empresa: ${meta.empresaId}`);
            const empresaRef = db.collection("empresas").doc(meta.empresaId);
            
            batch.update(empresaRef, {
                "suscripcion.plan": meta.planId,
                "suscripcion.estado": "ACTIVO",
                "suscripcion.fecha_pago": admin.firestore.FieldValue.serverTimestamp(),
                "suscripcion.meses_contratados": meta.meses || "1"
            });
        } 
        
        // CASO B: Pago de Orden de Trabajo (Negocio del taller)
        else if (meta.ordenId) {
            console.log(`🔧 Marcando Orden Pagada: ${meta.ordenId}`);
            const ordenRef = db.collection("ordenes").doc(meta.ordenId);
            
            batch.update(ordenRef, {
                "estado_pago": "PAGADO",
                "fecha_pago_cliente": admin.firestore.FieldValue.serverTimestamp()
            });

            // Registrar en contabilidad del taller (opcional)
            const pagoRef = db.collection("pagos").doc(`PAGO_${Date.now()}`);
            batch.set(pagoRef, {
                ordenId: meta.ordenId,
                monto: evento.data?.amount || 0,
                fecha: admin.firestore.FieldValue.serverTimestamp(),
                tipo: "RECAUDO_TALLER"
            });
        }

        await batch.commit();
        console.log("✅ Nexus-X: Sincronización de base de datos completada.");
        return res.status(200).send("OK_NEXUS_SYNC");

    } catch (error) {
        console.error("❌ ERROR CRÍTICO WEBHOOK:", error.message);
        return res.status(500).send("INTERNAL_SERVER_ERROR");
    }
}
