/**
 * stockService.js - Motor de Integridad Nexus-X 🛰️
 * Control de inventario automático tras transacciones.
 */
import { doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

/**
 * Descuenta repuestos del inventario real de forma atómica.
 * @param {string} empresaId - ID único del taller (tenant)
 * @param {Array} items - Lista de repuestos vinculados a la orden
 */
export async function procesarSalidaInventario(empresaId, items) {
    if (!items || !Array.isArray(items)) return;

    try {
        const promesas = items.map(item => {
            // SOLO si el repuesto es del taller y tiene un ID de referencia en inventario
            if (item.idInventario && item.origen === 'TALLER') {
                const itemRef = doc(db, `empresas/${empresaId}/inventario`, item.idInventario);
                
                // Usamos increment con valor negativo para restar de forma segura en Firebase
                return updateDoc(itemRef, {
                    cantidad: increment(-Math.abs(item.cantidad || 1))
                });
            }
            // Si es repuesto de cliente, se ignora el descuento de stock
            return Promise.resolve(); 
        });

        await Promise.all(promesas);
        console.log("🛰️ Nexus-X: Inventario actualizado correctamente.");
    } catch (error) {
        console.error("❌ Error en stockService:", error);
        throw error; // Re-lanzamos para que el módulo de pagos sepa que falló
    }
}
