import admin from "firebase-admin";

// Usamos tu JSON de Vercel para no fallar en la inicialización
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
    if (req.method !== "POST") return res.status(405).end();

    const { empresaId, nombreEmpresa, usuarioId, email } = req.body;
    const batch = db.batch();
    
    // Configuración de Trial (7 días)
    const ahora = admin.firestore.FieldValue.serverTimestamp();
    const hoy = new Date();
    const finTrialDate = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);
    const finTrialISO = finTrialDate.toISOString();

    try {
        // 1. Registro en Colección Principal: 'empresas'
        // Aquí es donde vive la configuración del taller
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
            config: {
                modulos_activos: ["ordenes", "inventario", "contabilidad", "ia_logs"],
                notificaciones_ws: true
            }
        });

        // 2. Registro en Colección Principal: 'usuarios'
        // Vinculamos al dueño con su empresa
        const usuarioRef = db.collection("usuarios").doc(usuarioId);
        batch.set(usuarioRef, {
            uid: usuarioId,
            empresaId: empresaId,
            rol: "dueno",
            email: email,
            ultimo_acceso: ahora,
            estado: "activo"
        }, { merge: true });

        // 3. Inicialización de 'contabilidad' para el Trial
        // Creamos un registro de "Apertura" en la colección raíz
        const contaRef = db.collection("contabilidad").doc();
        batch.set(contaRef, {
            empresaId: empresaId,
            tipo: "sistema",
            monto: 0,
            concepto: "Inicialización de Nodo Nexus-X (Trial)",
            fecha: ahora
        });

        await batch.commit();
        
        console.log(`🚀 Trial Activado para: ${nombreEmpresa} (ID: ${empresaId})`);
        res.status(200).json({ 
            status: "success", 
            expira: finTrialISO,
            nodo: "Nexus-X Starlink Operational" 
        });

    } catch (e) {
        console.error("❌ Error en Activación Trial:", e.message);
        res.status(500).json({ error: e.message });
    }
}
