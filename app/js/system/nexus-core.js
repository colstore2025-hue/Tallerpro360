/**
 * NEXUS-X CORE SYSTEM V1.2 🏛️ - REFORMADO
 * Ubicación: app/js/system/nexus-core.js
 * Función: Facilitador de Integridad (No restrictivo)
 */

const SCHEMA_MAP = {
    contabilidad: {
        // Campos maestros requeridos
        fields: ['empresaId', 'concepto', 'monto', 'tipo', 'creadoEn', 'estado', 'cuenta_puc'],
        aliases: { 
            'valor': 'monto', 
            'pago': 'monto', 
            'importe': 'monto',
            'categoria': 'tipo',
            'descripcion': 'concepto',
            'detalle': 'concepto',
            'fecha': 'creadoEn'
        }
    }
};

export const NexusSystem = {
    
    /**
     * SANEAMIENTO ELÁSTICO
     * Si no conoce el campo, lo deja pasar igual (Evita el $0)
     */
    sanitize: (collectionName, rawData) => {
        const schema = SCHEMA_MAP[collectionName];
        if (!schema) return rawData;

        let cleanData = { ...rawData }; // Mantiene TODO lo que venga originalmente
        
        // Traducir alias conocidos para estandarizar
        Object.keys(rawData).forEach(key => {
            const standardKey = schema.aliases[key];
            if (standardKey) {
                cleanData[standardKey] = rawData[key];
                // No borramos la original, solo aseguramos que la estandarizada exista
            }
        });

        // Garantía de integridad para campos numéricos críticos
        if (cleanData['monto'] === undefined || cleanData['monto'] === null) {
            console.warn("⚠️ Nexus System: Monto no detectado, inicializando en 0.");
            cleanData['monto'] = 0;
        }

        return cleanData;
    },

    /**
     * RESILIENCIA DINÁMICA
     */
    saveBunker: (key, data) => {
        try {
            const storageKey = `nexus_bunker_${key}`;
            localStorage.setItem(storageKey, JSON.stringify({
                data: data,
                timestamp: Date.now(),
                version: "2.17"
            }));
        } catch(e) { console.error("Error en Bunker Save", e); }
    },

    loadBunker: (key) => {
        const bunker = localStorage.getItem(`nexus_bunker_${key}`);
        if (!bunker) return null;
        const parsed = JSON.parse(bunker);
        // Si el bunker es de una versión muy vieja, ignorarlo para forzar actualización
        return (Date.now() - parsed.timestamp < 86400000) ? parsed.data : null;
    }
};
