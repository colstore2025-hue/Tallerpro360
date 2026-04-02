const crypto = require('crypto');

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { monto, referencia } = JSON.parse(req.body);

        // 1. TU LLAVE SECRETA DE BOLD (Obtenida de tu panel de Bold)
        // Lo ideal es usar process.env.BOLD_SECRET_KEY en Vercel
        const secretKey = process.env.BOLD_SECRET_KEY || "TU_LLAVE_DE_INTEGRIDAD_AQUI";

        // 2. CONCATENACIÓN SEGÚN EL ESTÁNDAR DE BOLD
        // Formato: referencia + monto + moneda + llave_secreta
        const cadena = `${referencia}${monto}COP${secretKey}`;

        // 3. GENERACIÓN DEL HASH SHA-256
        const hash = crypto.createHash('sha256').update(cadena).digest('hex');

        return res.status(200).json({ hash: hash });

    } catch (error) {
        console.error("Error generando Hash Nexus-X:", error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}
