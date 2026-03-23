import { doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

/**
 * Descuenta repuestos del inventario real
 * @param {string} empresaId - ID del taller
 * @param {Array} items - Lista de repuestos usados en la orden
 */
export async function procesarSalidaInventario(empresaId, items) {
    const promesas = items.map(item => {
        // SOLO si el repuesto es del taller (tiene un ID de inventario)
        if (item.idInventario && item.origen === 'TALLER') {
            const itemRef = doc(db, `empresas/${empresaId}/inventario`, item.idInventario);
            return updateDoc(itemRef, {
                cantidad: increment(-Math.abs(item.cantidad))
            });
        }
        return Promise.resolve(); // Si es del cliente, no hace nada
    });

    return Promise.all(promesas);
}
