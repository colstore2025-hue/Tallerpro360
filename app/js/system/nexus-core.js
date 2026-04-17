/**
 * NEXUS-X CORE SYSTEM V1.0 🏛️
 * Ubicación: app/js/system/nexus-core.js
 * Función: Guardian de Integridad y Saneamiento Firestore
 */

// 1. EL "MAPA PERFECTO" (La Hoja de Ruta que el sistema 'aprende')
const SCHEMA_MAP = {
    contabilidad: {
        fields: ['empresaId', 'concepto', 'monto', 'tipo', 'creadoEn'],
        aliases: { 
            'valor': 'monto', 
            'pago': 'monto', 
            'categoria': 'tipo',
            'descripcion': 'concepto'
        }
    },
    // Aquí puedes añadir 'inventario', 'logistica', etc.
};

export const NexusSystem = {
    
    /**
     * SANEAMIENTO AUTOMÁTICO
     * Evita que errores de palabras en el script dañen Firestore
     */
    sanitize: (collectionName, rawData) => {
        const schema = SCHEMA_MAP[collectionName];
        if (!schema) return rawData;

        let cleanData = {};
        
        // Traducir alias (si usaste una palabra vieja o diferente)
        Object.keys(rawData).forEach(key => {
            const standardKey = schema.aliases[key] || key;
            if (schema.fields.includes(standardKey)) {
                cleanData[standardKey] = rawData[key];
            }
        });

        // Asegurar que no falten campos críticos
        schema.fields.forEach(field => {
            if (cleanData[field] === undefined) {
                console.warn(`⚠️ Nexus System: Campo '${field}' ausente en la maniobra.`);
                cleanData[field] = field === 'monto' ? 0 : '';
            }
        });

        return cleanData;
    },

    /**
     * BUNKER LOCAL (Resiliencia)
     * Guarda el último éxito para evitar el $0 en pantalla
     */
    saveBunker: (key, data) => {
        const storageKey = `nexus_bunker_${key}`;
        localStorage.setItem(storageKey, JSON.stringify({
            data: data,
            timestamp: Date.now()
        }));
    },

    loadBunker: (key) => {
        const bunker = localStorage.getItem(`nexus_bunker_${key}`);
        return bunker ? JSON.parse(bunker).data : null;
    },

    /**
     * CONTROL DE ESTABILIDAD (Modo Pro)
     * Si el script de la reforma falla, informa para el rollback
     */
    monitor: (moduleName, executionFn) => {
        try {
            return executionFn();
        } catch (error) {
            console.error(`🚨 FALLO DE REFORMA en ${moduleName}:`, error);
            // Aquí se activaría la alerta para volver al script anterior
            return null;
        }
    }
};
