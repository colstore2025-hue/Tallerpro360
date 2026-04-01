import { PLANS_CONFIG } from './plans-config.js';
// Aquí importarías tu lógica de admin de Firebase para actualizar Firestore

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const paymentData = req.body;

    // Bold envía el estado en el campo 'status' o 'data.status' según versión
    if (paymentData.status === 'APPROVED') {
        const reference = paymentData.reference; // Ej: T360_USR123_PRO_6M_12345
        
        // 1. Descomponer la referencia para saber qué activar
        const parts = reference.split('_');
        const userId = parts[1];
        const planId = parts[2];
        const months = parseInt(parts[3].replace('M', ''));

        // 2. Calcular nueva fecha de vencimiento
        const expireDate = new Date();
        expireDate.setMonth(expireDate.getMonth() + months);

        // 3. LOGICA DE ACTUALIZACIÓN EN FIRESTORE
        // Aquí conectas con tu DB para poner al usuario como "ACTIVE" 
        // y guardar su vencimiento: expireDate.toISOString()

        console.log(`✅ Pago Aprobado: Usuario ${userId} activado por ${months} meses.`);
        
        return res.status(200).json({ received: true });
    }

    res.status(200).json({ status: 'ignored' });
}
