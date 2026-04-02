/**
 * TALLERPRO360 - NODO NEXUS-X
 * Versión: 1.5.0-production
 * Descripción: Activación de Trial 7 días + Inicialización de Estructura Multitenant
 */

import admin from "firebase-admin";

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
        });
    } catch (e) {
        console.error("❌ Error Firebase en Trial:", e.message);
    }
}
const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    const { empresaId, nombreEmpresa, usuarioId, email } = req.body;
    
    if (!empresaId || !usuarioId) return res.status(400).json({ error: "Faltan IDs críticos" });

    const batch = db.batch();
    const ahora = admin.firestore.FieldValue.serverTimestamp();
    const finTrialDate = new Date();
    finTrialDate.setDate(finTrialDate.getDate() + 7);
    const finTrialISO = finTrialDate.toISOString();

    try {
        // 1. Registro en 'empresas' (Con estructura BOLD automática)
        const empresaRef = db.collection("empresas").doc(empresaId);
        batch.set(empresaRef, {
            nombre: nombreEmpresa,
            id: empresaId,
            estado: "trial",
            suscripcion: {
                plan: "TRIAL_7_DIAS",
                estado: "ACTIVO",
                fecha_vencimiento: finTrialISO,
                creado_en: ahora
            },
            // AQUÍ SE CREA AUTOMÁTICAMENTE LO QUE VIMOS EN LA FOTO
            configuracion: {
                bold: {
                    apiKey: "PENDIENTE",
                    identity: "PENDIENTE"
                },
                modulos: ["ordenes", "inventario", "contabilidad"]
            },
            fecha_registro: ahora
        });

        // 2. Vinculación de Usuario
        const usuarioRef = db.collection("usuarios").doc(usuarioId);
        batch.set(usuarioRef, {
            uid: usuarioId,
            empresaId: empresaId,
            rol: "dueno",
            email: email,
            estado: "activo",
            v_nexus: "1.5.0"
        }, { merge: true });

        // 3. Primer registro contable de sistema
        const contaRef = db.collection("contabilidad").doc();
        batch.set(contaRef, {
            empresaId: empresaId,
            tipo: "SISTEMA",
            monto: 0,
            concepto: "Apertura Nodo Nexus-X Trial",
            fecha: ahora
        });

        await batch.commit();
        
        console.log(`🚀 [NEXUS] Trial Activado: ${nombreEmpresa}`);
        res.status(200).json({ 
            status: "success", 
            expira: finTrialISO,
            mensaje: "Estructura multitenant inicializada correctamente" 
        });

    } catch (e) {
        console.error("❌ [NEXUS_TRIAL_ERROR]:", e.message);
        res.status(500).json({ error: e.message });
    }
}
