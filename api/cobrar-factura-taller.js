/**
 * TALLERPRO360 - NODO NEXUS-X
 * Versión: 2.0.0-production
 * Descripción: Pasarela delegada. Permite que cada taller use SU PROPIA cuenta de Bold.
 * Última Modificación: Abril 2026
 */

import admin from "firebase-admin";

// 1. Inicialización Unificada Nexus-X
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}

const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Protocolo requiere POST" });

    const { empresaId, facturaId, monto, descripcion, emailCliente } = req.body;

    try {
        // 2. BUSCAR LAS LLAVES PRIVADAS DEL TALLER EN FIRESTORE
        // Buscamos en la colección 'empresas' el documento del taller específico
        const empresaDoc = await db.collection("empresas").doc(empresaId).get();
        
        if (!empresaDoc.exists) {
            return res.status(404).json({ error: "Taller no registrado en Nexus-X" });
        }

        const configBold = empresaDoc.data().configuracion?.bold;

        // Si el taller no ha pegado sus llaves de Bold en su perfil, no puede cobrar
        if (!configBold?.apiKey || !configBold?.identity) {
            return res.status(400).json({ error: "El taller no ha vinculado su cuenta de Bold en la configuración." });
        }

        // 3. GENERAR LINK DE PAGO USANDO LAS CREDENCIALES DEL TALLER
        // Nota: Aquí NO usamos tus variables de entorno, usamos las del documento de la DB
        const boldResponse = await fetch("https://api.bold.co/v2/payment-links", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${configBold.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: descripcion || `Servicio Técnico - Factura ${facturaId}`,
                amount: Math.round(monto),
                currency: "COP",
                order_id: `FACT-${facturaId}-${Date.now()}`,
                notification_url: "https://tallerpro360.vercel.app/api/webhook-bold", // El mismo webhook procesa todo
                redirect_url: `https://tallerpro360.vercel.app/factura-confirmada.html?id=${facturaId}`,
                customer_email: emailCliente || "",
                metadata: {
                    tipo_pago: "SERVICIO_TALLER", // Metadata vital para el webhook
                    facturaId: String(facturaId),
                    empresaId: String(empresaId),
                    v_nexus: "2.0.0"
                }
            })
        });

        const data = await boldResponse.json();

        if (data.payload && data.payload.payment_url) {
            console.log(`🔧 [NEXUS-TALLER] Link generado para taller: ${empresaId}`);
            return res.status(200).json({ url: data.payload.payment_url });
        } else {
            console.error("❌ Error API Bold Taller:", data);
            return res.status(400).json({ error: "La pasarela del taller rechazó la solicitud." });
        }

    } catch (error) {
        console.error("❌ Fallo Cobro Taller:", error.message);
        return res.status(500).json({ error: "Error interno en el Nodo de Cobro." });
    }
}
