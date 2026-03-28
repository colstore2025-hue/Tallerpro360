/**
 * dataService.js - TallerPRO360 NEXUS-X V5 🛰️
 * Motor de Sincronización de Alta Disponibilidad
 * Optimización: Query Raíz + Filtrado por EmpresaId
 */

import { 
  collection, getDocs, addDoc, query, where, 
  limit, serverTimestamp, doc, getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

/**
 * 🛰️ MOTOR DE EXTRACCIÓN GLOBAL (RAÍZ)
 * Ahora busca en colecciones principales filtrando por empresaId
 */
async function fetchNexusData(coleccion, empresaId, options = {}) {
  // 1. Identificar al taller (Prioriza el ID real sobre el de sesión)
  const idTaller = empresaId || localStorage.getItem("nexus_empresaId");
  const maxDocs = options.limit || 50;

  if (!idTaller) {
    console.warn(`📡 Nexus-X: Sin ID de empresa para ${coleccion}. Abortando.`);
    return [];
  }

  try {
    // REFERENCIA A COLECCIÓN RAÍZ (Más rápido y compatible con las nuevas reglas)
    const colRef = collection(db, coleccion);
    
    // QUERY FILTRADA: Solo trae lo que pertenece a este taller
    const q = query(
      colRef, 
      where("empresaId", "==", idTaller), 
      limit(maxDocs)
    );

    const snap = await getDocs(q);
    if (snap.empty) return [];

    // 🔄 NORMALIZACIÓN DINÁMICA V5
    return snap.docs.map(d => {
        const raw = d.data();
        return {
            id: d.id,
            ...raw,
            // Normalización Numérica (Previene errores de gráfica)
            total: Number(raw.total || raw.valor || 0),
            cantidad: Number(raw.cantidad || raw.stock || 0),
            
            // Normalización de Identidad
            nombre: raw.nombre || raw.cliente || raw.descripcion || "Sin identificar",
            placa: raw.placa || "N/A",
            
            // Timestamp a Fecha Humana
            fechaISO: raw.creadoEn?.toDate ? raw.creadoEn.toDate().toISOString() : new Date().toISOString()
        };
    });

  } catch (e) {
    console.error(`🔥 Critical Error en ${coleccion}:`, e);
    return []; // Retorna array vacío para no romper el .map() del dashboard
  }
}

/* ======================================================
   📦 CONECTORES DE ALTA PRIORIDAD (EXPORTADOS)
   ====================================================== */

export const getClientes = (id) => fetchNexusData("clientes", id, { limit: 100 });
export const getOrdenes = (id) => fetchNexusData("ordenes", id, { limit: 50 });
export const getInventario = (id) => fetchNexusData("inventario", id, { limit: 200 });

/**
 * 🏢 OBTENER DATOS DE LA EMPRESA (Perfil, Plan, Vencimiento)
 */
export async function getEmpresaData(empresaId) {
    const id = empresaId || localStorage.getItem("nexus_empresaId");
    const docRef = doc(db, "empresas", id);
    return await getDoc(docRef);
}

/**
 * ✍️ CREADOR UNIVERSAL (Inyección de Seguridad)
 */
export async function createDocument(coleccion, data) {
  const idTaller = localStorage.getItem("nexus_empresaId");
  
  try {
    const docRef = await addDoc(collection(db, coleccion), {
      ...data,
      empresaId: idTaller, // 🔑 Vínculo de seguridad obligatorio
      creadoEn: serverTimestamp(),
      total: Number(data.total || 0)
    });
    return docRef.id;
  } catch (e) {
    console.error("Error en creación de documento:", e);
    throw e;
  }
}

/**
 * 🛡️ SISTEMA DE LOGS IA
 */
export async function saveLog(tipo, data) {
  try {
    await addDoc(collection(db, "ia_logs"), {
      ...data,
      tipo,
      empresaId: localStorage.getItem("nexus_empresaId"),
      fecha: serverTimestamp()
    });
  } catch (e) { }
}
