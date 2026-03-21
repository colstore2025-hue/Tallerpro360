/**
 * inventoryAI.js - Sincronizado con Ruta Real
 */
import { db } from "../core/firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

class InventoryAI {
  constructor() { this.parts = []; }

  async loadInventory(empresaId) {
    if (!empresaId) return [];
    try {
      // ✅ AJUSTADO A TU RUTA REAL
      const snapshot = await getDocs(collection(db, "empresas", empresaId, "inventario"));

      this.parts = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        nombre: docSnap.data().nombre || "",
        stock: Number(docSnap.data().cantidad || 0), // Mapeo de tu campo 'cantidad'
        precio: Number(docSnap.data().precio || 0),   // Mapeo de tu campo 'precio'
        stockMinimo: 5 // Umbral inteligente por defecto
      }));
      return this.parts;
    } catch (e) {
      console.error("❌ Error IA Inventario:", e);
      return [];
    }
  }

  detectLowStock() {
    return this.parts.filter(p => p.stock <= p.stockMinimo);
  }
}
export default InventoryAI;
