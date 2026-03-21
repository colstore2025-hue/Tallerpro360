/**
 * dataService.js - Versión de Producción para TallerPRO360
 * Centraliza la comunicación con Firestore y el sistema de Logs de IA.
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
 * GUARDAR LOGS (Para errores de sistema o actividad de IA)
 * Esta función es llamada por el CORE cuando un módulo falla 5 veces.
 */
export async function saveLog(tipoLog, data) {
  try {
    const empresaId = data.empresaId || localStorage.getItem("empresaId");
    if (!empresaId) return;

    await addDoc(collection(db, `empresas/${empresaId}/ia_logs`), {
      ...data,
      tipo: tipoLog,
      timestamp: serverTimestamp() // Hora oficial de Google, no del celular
    });
    console.log(`[Log] Evento registrado en ia_logs: ${tipoLog}`);
  } catch (e) {
    console.error("Error guardando log en Firestore:", e);
  }
}

/**
 * OBTENER DATOS (Genérico con manejo de errores)
 * Optimizado para subcolecciones de empresa.
 */
async function fetchData(subcoleccion, empresaId) {
  try {
    // Eliminamos el orderBy temporalmente para saltar el error de índices
    const q = query(collection(db, `empresas/${empresaId}/${subcoleccion}`));
    const snap = await getDocs(q);
    
    if (snap.empty) {
        console.log(`⚠️ La subcolección ${subcoleccion} está vacía.`);
        return [];
    }

    return snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        // Normalizamos la fecha aquí mismo para que el Dashboard no sufra
        creadoEn: d.data().creadoEn?.toDate ? d.data().creadoEn.toDate() : d.data().creadoEn 
    }));
  } catch (e) {
    console.error(`🔥 Error crítico obteniendo ${subcoleccion}:`, e);
    return [];
  }
}

// Funciones específicas para los módulos
export const getClientes = (id) => fetchData("clientes", id);
export const getOrdenes = (id) => fetchData("ordenes", id);
export const getVehiculos = (id) => fetchData("vehiculos", id);
export const getInventario = (id) => fetchData("inventario", id); // Usando 'inventario' como acordamos

/**
 * REGISTRAR NUEVA ORDEN / CLIENTE
 * Ejemplo de cómo escribir datos de forma segura
 */
export async function createDocument(subcoleccion, empresaId, data) {
  return await addDoc(collection(db, `empresas/${empresaId}/${subcoleccion}`), {
    ...data,
    creadoEn: serverTimestamp(),
    estado: data.estado || "activo"
  });
}
