// inventoryAI.js
// IA de inventario para talleres

import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

class InventoryAI {

  constructor() {
    this.parts = [];
  }

  async loadInventory() {

    const snapshot = await getDocs(collection(db, "inventory"));

    this.parts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return this.parts;
  }

  detectLowStock() {

    return this.parts.filter(part => part.stock <= part.minStock);
  }

  predictDemand(part) {

    if (!part.usageHistory || part.usageHistory.length === 0)
      return "Sin datos";

    const avg = part.usageHistory.reduce((a, b) => a + b, 0)
      / part.usageHistory.length;

    if (avg > 20) return "Alta demanda";
    if (avg > 10) return "Demanda media";
    return "Demanda baja";
  }

  async updateStock(partId, newStock) {

    const ref = doc(db, "inventory", partId);

    await updateDoc(ref, {
      stock: newStock
    });
  }

  generateRestockPlan() {

    return this.parts.map(part => {

      if (part.stock <= part.minStock) {

        return {
          part: part.name,
          action: "Reordenar",
          suggestedQty: part.minStock * 2
        };

      }

      return null;

    }).filter(x => x !== null);
  }

}

export const inventoryAI = new InventoryAI();