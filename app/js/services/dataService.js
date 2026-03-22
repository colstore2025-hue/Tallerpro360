/**
 * dataService.js - Versión de Producción para TallerPRO360
 * Centraliza la comunicación con Firestore y el sistema de Logs de IA.
 * Optimizado para Rutas: empresas/taller_001/[subcoleccion]
 */

import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

/**
 * 🛡️ GUARDAR LOGS (Para auditoría de IA y errores)
 */
export async function saveLog(tipoLog, data) {
  try {
    const empresaId = data.empresaId || localStorage.getItem("empresaId") || "taller_001";
    
    await addDoc(collection(db, "empresas", empresaId, "ia_logs"), {
      ...data,
      tipo: tipoLog,
      fecha: serverTimestamp() 
    });
    console.log(`[Nexus-X Log]: ${tipoLog} registrado.`);
  } catch (e) {
    console.error("❌ Error en Log Firestore:", e);
  }
}

/**
 * 📡 MOTOR DE EXTRACCIÓN (Genérico y Resiliente)
 * Maneja la ruta jerárquica: empresas -> taller_001 -> subcoleccion
 */
async function fetchData(subcoleccion, empresaId) {
  // Fallback de seguridad para evitar bloqueos si el ID no llega
  const idReal = empresaId || localStorage.getItem("empresaId") || "taller_001";

  try {
    // Referencia directa a la subcolección de la empresa
    const colRef = collection(db, "empresas", idReal, subcoleccion);
    const snap = await getDocs(colRef);
    
    if (snap.empty) {
        console.warn(`⚠️ Subcolección [${subcoleccion}] vacía en ${idReal}`);
        return [];
    }

    return snap.docs.map(d => {
        const data = d.data();
        return { 
            id: d.id, 
            ...data,
            // Normalización de fechas para evitar errores en Charts/Dashboard
            creadoEn: data.creadoEn?.toDate ? data.creadoEn.toDate() : (data.creadoEn || new Date())
        };
    });
  } catch (e) {
    console.error(`🔥 Error crítico en fetchData [${subcoleccion}]:`, e);
    // IMPORTANTE: Retornamos array vacío para que el Dashboard no se cuelgue
    return [];
  }
}

/* ======================================================
   📦 EXPORTACIÓN DE SERVICIOS
   ====================================================== */

// Consultas
export const getClientes = (id) => fetchData("clientes", id);
export const getOrdenes = (id) => fetchData("ordenes", id);
export const getVehiculos = (id) => fetchData("vehiculos", id);
export const getInventario = (id) => fetchData("inventario", id);
export const getFinanzas = (id) => fetchData("finanzas", id);

/**
 * ✍️ ESCRITURA DE DOCUMENTOS
 * Registra datos con marca de tiempo de servidor
 */
export async function createDocument(subcoleccion, empresaId, data) {
  const idReal = empresaId || localStorage.getItem("empresaId") || "taller_001";
  
  try {
    const docRef = await addDoc(collection(db, "empresas", idReal, subcoleccion), {
      ...data,
      creadoEn: serverTimestamp(),
      estado: data.estado || "activo"
    });
    return docRef.id;
  } catch (e) {
    console.error(`❌ Error creando documento en ${subcoleccion}:`, e);
    throw e;
  }
}
