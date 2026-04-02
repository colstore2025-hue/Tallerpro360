/**
 * TALLERPRO360 - NODO NEXUS-X
 * Versión: 1.1.0-production
 * Descripción: Configuración maestra de planes y precios.
 */

// 1. Exportación para uso interno de otros scripts (imports)
export const PLANS_CONFIG = {
    basico: {
        name: "Plan Básico",
        prices: { "1": 49900, "3": 134700, "6": 239500, "12": 419000 }
    },
    pro: {
        name: "Plan Pro",
        prices: { "1": 79900, "3": 215700, "6": 383500, "12": 671000 }
    },
    elite: {
        name: "Plan Élite",
        prices: { "1": 129000, "3": 348300, "6": 619200, "12": 1083600 }
    }
};

// 2. Exportación por defecto para que Vercel NO de error 500
// Esto permite que si alguien entra a /api/plans-config vea los datos
export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Respondemos con la configuración para que el frontend pueda leerla
    res.status(200).json(PLANS_CONFIG);
}
