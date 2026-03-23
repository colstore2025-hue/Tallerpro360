/**
 * dataService.js - TallerPRO360 ULTRA V4 🚀
 * Blindado contra errores de índices y nombres de campos inconsistentes.
 */

import { 
  collection, getDocs, addDoc, query, where, 
  orderBy, limit, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

// 🧠 CACHÉ INTELIGENTE
const _cache = { data: {}, lastUpdate: {} };

/**
 * 📡 MOTOR DE EXTRACCIÓN CON AUTOCORRECCIÓN
 */
async function fetchDataOptimized(subcoleccion, empresaId, options = {}) {
  const idReal = empresaId || localStorage.getItem("empresaId") || "taller_001";
  const maxDocs = options.limit || 50;

  try {
    const colRef = collection(db, "empresas", idReal, subcoleccion);
    
    // 🛡️ REPARACIÓN DE QUERY: 
    // Si no tienes índices en Firebase, el orderBy causará error 404/Empty.
    // Usamos una query simple si no hay filtros complejos para asegurar que SIEMPRE cargue.
    let q = query(colRef, limit(maxDocs));

    const snap = await getDocs(q);
    if (snap.empty) return [];

    // 🔄 NORMALIZACIÓN DINÁMICA (El secreto de la estabilidad)
    const results = snap.docs.map(d => {
        const raw = d.data();
        return {
            id: d.id,
            ...raw,
            // Normalización de Precios/Totales (Evita el $0)
            total: Number(raw.total || raw.valor || raw.precio || 0),
            costo: Number(raw.costo || raw.costoTotal || 0),
            cantidad: Number(raw.cantidad || raw.stock || 0),
            
            // Normalización de Nombres (Evita el undefined)
            nombre: raw.nombre || raw.cliente || raw.descripcion || "Sin identificar",
            placa: raw.placa || raw.id_vehiculo || "N/A",
            
            // Normalización de Fechas
            fechaFormateada: raw.creadoEn?.toDate ? raw.creadoEn.toDate().toLocaleDateString() : 'Reciente'
        };
    });

    _cache.data[subcoleccion] = results;
    return results;

  } catch (e) {
    console.error(`🔥 Nexus-X Critical Error [${subcoleccion}]:`, e);
    return _cache.data[subcoleccion] || [];
  }
}

/* ======================================================
   📦 SERVICIOS EXPORTADOS (CONECTORES DE ALTA PRIORIDAD)
   ====================================================== */

export const getClientes = (id) => fetchDataOptimized("clientes", id, { limit: 100 });
export const getOrdenes = (id) => fetchDataOptimized("ordenes", id, { limit: 50 });
export const getInventario = (id) => fetchDataOptimized("inventario", id, { limit: 200 });

// Dashboard: Alias para mantener compatibilidad
export const getRecentOrdenes = (id) => getOrdenes(id);

/**
 * ✍️ CREADOR UNIVERSAL (Con limpieza de datos)
 */
export async function createDocument(subcoleccion, data) {
  const empresaId = localStorage.getItem("empresaId") || "taller_001";
  try {
    const docRef = await addDoc(collection(db, "empresas", empresaId, subcoleccion), {
      ...data,
      creadoEn: serverTimestamp(),
      estado: data.estado || "activo",
      // Aseguramos que los números se guarden como números
      total: Number(data.total || 0),
      cantidad: Number(data.cantidad || 0)
    });
    return docRef.id;
  } catch (e) {
    console.error("Error al crear documento:", e);
    throw e;
  }
}

/**
 * 🛡️ LOGS DE AUDITORÍA
 */
export async function saveLog(tipoLog, data) {
  const empresaId = localStorage.getItem("empresaId") || "taller_001";
  try {
    await addDoc(collection(db, "empresas", empresaId, "ia_logs"), {
      ...data,
      tipo: tipoLog,
      fecha: serverTimestamp()
    });
  } catch (e) { }
}
