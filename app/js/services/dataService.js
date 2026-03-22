/**
 * dataService.js - TallerPRO360 ULTRA V3 🚀
 * Optimizado para ESCALABILIDAD y AHORRO de costos (Firebase Saver Mode)
 */

import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

// 🧠 CACHÉ EN MEMORIA (Evita re-lecturas innecesarias en la misma sesión)
const _cache = {
  data: {},
  lastUpdate: {}
};

/**
 * 📡 MOTOR DE EXTRACCIÓN OPTIMIZADO
 * @param {string} subcoleccion - Nombre de la subcolección
 * @param {Object} options - Filtros, límites y orden
 */
async function fetchDataOptimized(subcoleccion, empresaId, options = {}) {
  const idReal = empresaId || localStorage.getItem("empresaId") || "taller_001";
  
  // 1. LÓGICA DE LÍMITES (Economía de Firebase)
  const maxDocs = options.limit || 50; // Nunca traemos más de 50 por defecto
  const orderField = options.orderBy || "creadoEn";
  const orderDir = options.direction || "desc";

  try {
    const colRef = collection(db, "empresas", idReal, subcoleccion);
    
    // 2. CONSTRUCCIÓN DE QUERY (Filtrado inteligente)
    let q = query(
      colRef, 
      orderBy(orderField, orderDir), 
      limit(maxDocs)
    );

    // Si queremos filtrar por estado (ej. solo órdenes 'activas')
    if (options.status) {
      q = query(q, where("estado", "==", options.status));
    }

    const snap = await getDocs(q);
    
    if (snap.empty) return [];

    const results = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      // Normalización de fechas para UI
      fechaFormateada: d.data().creadoEn?.toDate ? d.data().creadoEn.toDate().toLocaleString() : 'Reciente'
    }));

    // Guardamos en caché rápida
    _cache.data[subcoleccion] = results;
    return results;

  } catch (e) {
    console.error(`🔥 Error en fetchData [${subcoleccion}]:`, e);
    // Retornamos caché si existe, o vacío
    return _cache.data[subcoleccion] || [];
  }
}

/* ======================================================
   📦 SERVICIOS EXPORTADOS (CON FILTROS DE AHORRO)
   ====================================================== */

// Dashboard: Solo necesita las últimas 5 órdenes (Ahorro máximo)
export const getRecentOrdenes = (id) => fetchDataOptimized("ordenes", id, { limit: 5 });

// Listados Generales: Limitados a 50 para no saturar
export const getClientes = (id) => fetchDataOptimized("clientes", id, { limit: 50 });
export const getOrdenes = (id) => fetchDataOptimized("ordenes", id, { limit: 50 });
export const getVehiculos = (id) => fetchDataOptimized("vehiculos", id, { limit: 50 });
export const getInventario = (id) => fetchDataOptimized("inventario", id, { limit: 100 });

/**
 * 🛡️ LOGS DE AUDITORÍA (Nexus-X AI)
 */
export async function saveLog(tipoLog, data) {
  const empresaId = data.empresaId || localStorage.getItem("empresaId") || "taller_001";
  try {
    await addDoc(collection(db, "empresas", empresaId, "ia_logs"), {
      ...data,
      tipo: tipoLog,
      fecha: serverTimestamp(),
      plataforma: "TallerPRO360-V3"
    });
  } catch (e) { console.error("Error Log:", e); }
}

/**
 * ✍️ CREADOR DE DOCUMENTOS
 */
export async function createDocument(subcoleccion, data) {
  const empresaId = localStorage.getItem("empresaId") || "taller_001";
  try {
    const docRef = await addDoc(collection(db, "empresas", empresaId, subcoleccion), {
      ...data,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
      estado: data.estado || "activo"
    });
    return docRef.id;
  } catch (e) {
    throw e;
  }
}
