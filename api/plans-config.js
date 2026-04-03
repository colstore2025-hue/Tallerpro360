/**
 * TALLERPRO360 - NODO NEXUS-X
 * Versión: 1.1.1-production
 * Descripción: Configuración maestra de planes y precios con descuentos por volumen.
 */

export const PLANS_CONFIG = {
    basico: {
        name: "Plan Básico",
        prices: { 
            "1": 49900, 
            "3": 134700, 
            "6": 239500, 
            "12": 419000 
        }
    },
    pro: {
        name: "Plan Pro",
        prices: { 
            "1": 79900, 
            "3": 215700, 
            "6": 383500, 
            "12": 671000 
        }
    },
    elite: {
        name: "Plan Élite",
        prices: { 
            "1": 129000, 
            "3": 348300, 
            "6": 619200, 
            "12": 1083600 
        }
    }
};

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    res.status(200).json(PLANS_CONFIG);
}
