/**
 * planManager.js
 * Control de acceso a módulos según plan activo
 * TallerPRO360 ERP - Versión Final Integrada
 */

import { db } from "./core/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Obtiene los módulos habilitados para un usuario según su plan
 * @param {string} userId - ID del usuario en Firestore
 * @returns {Promise<string[]>} Lista de módulos disponibles
 */
export async function getModulosDisponibles(userId){
  try {
    const planSnap = await getDoc(doc(db, "usuariosPlanes", userId));
    if(!planSnap.exists()) return [];

    const planData = planSnap.data();
    const plan = planData.plan || "Freemium";

    // Validación de duración del plan
    const hoy = new Date();
    if(planData.inicio && planData.fin){
      const inicio = planData.inicio.toDate ? planData.inicio.toDate() : new Date(planData.inicio);
      const fin = planData.fin.toDate ? planData.fin.toDate() : new Date(planData.fin);
      if(hoy < inicio || hoy > fin){
        console.warn(`Plan expirado o no activo para usuario ${userId}`);
        return ["dashboard","clientes","ordenes","inventario"]; // Módulos mínimos Freemium
      }
    }

    // Definición de módulos por plan
    const planes = {
      "Freemium": ["dashboard","clientes","ordenes","inventario"],
      "Profesional": ["dashboard","clientes","ordenes","inventario","finanzas","pagos"],
      "Enterprise": ["dashboard","clientes","ordenes","inventario","finanzas","pagos","contabilidad","ceo","iaAssistant","aiAdvisor","aiCommand","configuracion"]
    };

    return planes[plan] || [];
  } catch(e){
    console.error("Error cargando plan de usuario:", e);
    return [];
  }
}