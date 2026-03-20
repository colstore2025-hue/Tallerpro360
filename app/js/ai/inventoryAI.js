/**
 * inventoryAI.js
 * IA de inventario PRO360 · ULTRA
 */

import { db } from "../core/firebase-config.js";
import { obtenerEmpresaId } from "../core/empresa-context.js";

import {
  collection,
  getDocs,
  updateDoc,
  doc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

class InventoryAI {

  constructor(){
    this.parts = [];
  }

  /* ===============================
  NORMALIZAR
  ============================== */
  normalize(text){
    if(!text) return "";
    return text.toLowerCase().trim();
  }

  /* ===============================
  CARGAR INVENTARIO
  ============================== */
  async loadInventory(){

    try{

      const empresaId = obtenerEmpresaId();

      if(!empresaId){
        console.warn("⚠️ Empresa no definida");
        return [];
      }

      const snapshot = await getDocs(
        collection(db, "empresas", empresaId, "repuestos") // 🔥 UNIFICADO
      );

      this.parts = snapshot.docs.map(docSnap => ({

        id: docSnap.id,
        nombre: docSnap.data().nombre || docSnap.data().name || "",
        stock: Number(docSnap.data().stock || 0),
        stockMinimo: Number(docSnap.data().stockMinimo || docSnap.data().minStock || 0),
        precio: Number(docSnap.data().precioVenta || docSnap.data().price || 0),
        ...docSnap.data()

      }));

      return this.parts;

    } catch(e){

      console.error("❌ Error cargando inventario IA:", e);
      return [];

    }
  }

  /* ===============================
  STOCK BAJO
  ============================== */
  detectLowStock(){

    return this.parts.filter(part =>
      part.stock <= part.stockMinimo
    );
  }

  /* ===============================
  PREDECIR DEMANDA (MEJORADO)
  ============================== */
  predictDemand(part){

    if(!part || !Array.isArray(part.usageHistory) || !part.usageHistory.length){
      return { nivel:"sin_datos", valor:0 };
    }

    const historial = part.usageHistory;

    const total = historial.reduce((a,b)=>a+b,0);
    const promedio = total / historial.length;

    let nivel = "baja";

    if(promedio > 20) nivel = "alta";
    else if(promedio > 10) nivel = "media";

    return {
      nivel,
      promedio: Math.round(promedio)
    };
  }

  /* ===============================
  ACTUALIZAR STOCK (SEGURO)
  ============================== */
  async updateStock(partId, cantidad){

    try{

      const empresaId = obtenerEmpresaId();

      if(!empresaId) return;

      const ref = doc(
        db,
        "empresas",
        empresaId,
        "repuestos",
        partId
      );

      await updateDoc(ref, {
        stock: increment(cantidad)
      });

    } catch(e){

      console.error("❌ Error actualizando stock IA:", e);

    }
  }

  /* ===============================
  BUSCAR REPUESTO (🔥 NUEVO)
  ============================== */
  findPart(nombre){

    const n = this.normalize(nombre);

    return this.parts.find(p =>
      this.normalize(p.nombre).includes(n)
    );
  }

  /* ===============================
  PLAN REABASTECIMIENTO
  ============================== */
  generateRestockPlan(){

    return this.parts
      .map(part => {

        if(part.stock <= part.stockMinimo){

          return {

            part: part.nombre,
            action: "Reordenar",
            suggestedQty: (part.stockMinimo || 5) * 2,
            prioridad: part.stock === 0 ? "urgente" : "media"

          };
        }

        return null;

      })
      .filter(Boolean);
  }

}

export default InventoryAI;