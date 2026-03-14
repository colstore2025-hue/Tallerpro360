/**
 * planManager.js
 * Control de acceso a módulos según plan activo
 * TallerPRO360 ERP
 */
import { db } from "./core/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function getModulosDisponibles(userId){
  try {
    const planSnap = await getDoc(doc(db, "usuariosPlanes", userId));
    if(!planSnap.exists()) return [];

    const planData = planSnap.data();
    const plan = planData.plan || "Freemium";

    // Definición de módulos por plan
    const planes = {
      "Freemium": ["dashboard","clientes","ordenes","inventario"],
      "Profesional": ["dashboard","clientes","ordenes","inventario","finanzas","pagos"],
      "Enterprise": ["dashboard","clientes","ordenes","inventario","finanzas","pagos","contabilidad","ceo","aiAssistant","aiAdvisor","aiCommand","configuracion"]
    };

    return planes[plan] || [];
  } catch(e){
    console.error("Error cargando plan de usuario:", e);
    return [];
  }
}