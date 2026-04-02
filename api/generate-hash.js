const crypto = require('crypto');

export default function handler(req, res) {
    // Solo permitimos POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        // En Vercel, req.body ya viene parseado si envías el Content-Type correcto
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { monto, referencia } = body;

        // 1. USO DE TUS VARIABLES REALES DE VERCEL
        const secretKey = process.env.BOLD_API_SECRET; 

        if (!secretKey) {
            console.error("❌ ERROR: BOLD_API_SECRET no detectada en Vercel");
            return res.status(500).json({ error: 'Configuración de servidor incompleta' });
        }

        // 2. CONCATENACIÓN ESTÁNDAR BOLD (Referencia + Monto + Moneda + Secreto)
        // Ejemplo: NEXUS_USER_BASIC_1M49900COPXXXXXXXXX
        const cadena = `${referencia}${monto}COP${secretKey}`;

        // 3. GENERACIÓN DEL HASH SHA-256
        const hash = crypto.createHash('sha256').update(cadena).digest('hex');

        console.log(`✅ Hash generado para Ref: ${referencia}`);
        
        return res.status(200).json({ 
            hash: hash,
            integrity_identity: process.env.BOLD_API_IDENTITY // También la enviamos si el checkout la requiere
        });

    } catch (error) {
        console.error("❌ Error en generate-hash:", error.message);
        return res.status(500).json({ error: 'Error interno al generar firma' });
    }
}
