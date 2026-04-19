/**
 * 🛰️ NEXUS-X CORE - CONSTANTS RECTOR V21.8
 * "El Diccionario de Verdad Único del Sistema"
 * @author William Jeffry Urquijo Cubillos
 */

export const NEXUS_CONFIG = {
    // 🗄️ COLECCIONES DE FIRESTORE (Nombres exactos de la DB)
    COLLECTIONS: {
        ACCOUNTING: "contabilidad",
        ORDERS: "ordenes",
        INVENTORY: "inventario",
        USERS: "usuarios",
        CLIENTS: "clientes",
        TASKS: "tareas"
    },

    // 🏛️ TIPOS FINANCIEROS (Crucial para Auditoría PUC)
    FINANCE_TYPES: {
        // INGRESOS (Cuenta 4135)
        REVENUE_OT: "ingreso_ot",             // Dinero por mano de obra/servicios
        REVENUE_PARTS: "venta_repuesto",      // Venta directa de piezas
        REVENUE_CAPITAL: "capital_inicial",    // Inyección de socios/apertura
        
        // GASTOS (Cuenta 5105 / 5195)
        EXPENSE_OPERATIONAL: "gasto_operativo", // Arriendos, servicios, etc.
        EXPENSE_PARTS: "gasto_insumos",        // Compra de repuestos a proveedores
        EXPENSE_PAYROLL: "nomina_pago"         // Pagos a técnicos y administrativos
    },

    // 💳 MÉTODOS DE PAGO
    PAYMENT_METHODS: {
        CASH: "EFECTIVO",
        TRANSFER: "TRANSFERENCIA",
        CARD: "TARJETA",
        CREDIT: "CREDITO"
    },

    // 🔧 ESTADOS DE ÓRDENES (Telemetría en Rampa)
    ORDER_STATUS: {
        IN_WORKSHOP: "EN_TALLER",
        DIAGNOSIS: "DIAGNOSTICO",
        REPAIR: "REPARACION",
        WAITING_PARTS: "ESPERA_REPUESTOS",
        READY: "LISTO_PARA_ENTREGA",
        DELIVERED: "ENTREGADO",
        CANCELLED: "CANCELADO"
    },

    // 🎨 COLORES Y UI (Tokens de diseño para consistencia)
    UI: {
        SUCCESS: "#10b981", // Emerald 500
        DANGER: "#ef4444",  // Red 500
        ACCENT: "#06b6d4",  // Cyan 500
        WARNING: "#f59e0b", // Amber 500
        DARK_BG: "#010409",
        CARD_BG: "#0d1117"
    }
};

/**
 * PROTOCOLO DE USO:
 * 1. Importar: import { NEXUS_CONFIG } from "./nexus_constants.js";
 * 2. Uso: where("tipo", "==", NEXUS_CONFIG.FINANCE_TYPES.REVENUE_OT)
 */
Object.freeze(NEXUS_CONFIG); // Congelar para evitar modificaciones accidentales en tiempo de ejecución
