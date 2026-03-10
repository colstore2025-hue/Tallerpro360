/**
 * inventoryAI.js
 * IA de inventario para talleres
 * TallerPRO360
 */

import { db } from "../core/firebase-config.js";
import { obtenerEmpresaId } from "../core/empresa-context.js";

import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


class InventoryAI {

  constructor(){
    this.parts = [];
  }


  /* ===============================
     CARGAR INVENTARIO
  =============================== */

  async loadInventory(){

    const empresaId = obtenerEmpresaId();

    if(!empresaId){
      console.warn("Empresa no definida");
      return [];
    }

    const snapshot = await getDocs(
      collection(db,"empresas",empresaId,"inventario")
    );

    this.parts = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    return this.parts;

  }


  /* ===============================
     DETECTAR STOCK BAJO
  =============================== */

  detectLowStock(){

    return this.parts.filter(
      part => part.stock <= part.minStock
    );

  }


  /* ===============================
     PREDECIR DEMANDA
  =============================== */

  predictDemand(part){

    if(!part.usageHistory || part.usageHistory.length === 0)
      return "Sin datos";

    const avg =
      part.usageHistory.reduce((a,b)=>a+b,0)
      / part.usageHistory.length;

    if(avg > 20) return "Alta demanda";
    if(avg > 10) return "Demanda media";

    return "Demanda baja";

  }


  /* ===============================
     ACTUALIZAR STOCK
  =============================== */

  async updateStock(partId,newStock){

    const empresaId = obtenerEmpresaId();

    const ref = doc(
      db,
      "empresas",
      empresaId,
      "inventario",
      partId
    );

    await updateDoc(ref,{
      stock:newStock
    });

  }


  /* ===============================
     PLAN DE REABASTECIMIENTO
  =============================== */

  generateRestockPlan(){

    return this.parts
      .map(part => {

        if(part.stock <= part.minStock){

          return {

            part: part.name || part.nombre,
            action: "Reordenar",
            suggestedQty: part.minStock * 2

          };

        }

        return null;

      })
      .filter(x => x !== null);

  }

}


/* ===============================
   EXPORT IA INVENTARIO
=============================== */

export const inventoryAI = new InventoryAI();