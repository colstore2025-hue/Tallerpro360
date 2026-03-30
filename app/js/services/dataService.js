/**
 * dataService.js - TallerPRO360 NEXUS-X V5.1 🛰️
 * Motor de Sincronización de Alta Disponibilidad
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { 
  collection, getDocs, addDoc, query, where, 
  limit, serverTimestamp, doc, getDoc, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

/**
 * 🛰️ MOTOR DE EXTRACCIÓN GLOBAL (RAÍZ)
 * Normalización total para asegurar compatibilidad con Dashboards Pro
 */
async function fetchNexusData(coleccion, empresaId, options = {}) {
  const idTaller = empresaId || localStorage.getItem("nexus_empresaId");
  const maxDocs = options.limit || 50;

  if (!idTaller) {
    console.warn(`📡 Nexus-X: Sin ID de empresa para ${coleccion}.`);
    return [];
  }

  try {
    const colRef = collection(db, coleccion);
    
    // Agregamos un try/catch interno para el query por si no hay índices en Firebase
    const q = query(
      colRef, 
      where("empresaId", "==", idTaller), 
      limit(maxDocs)
    );

    const snap = await getDocs(q);
    if (snap.empty) return [];

    return snap.docs.map(d => {
        const raw = d.data();
        return {
            id: d.id,
            ...raw,
            // 💰 PROTECCIÓN FINANCIERA: Asegura que siempre haya un número
            total: Number(raw.total || raw.valor || raw.precio || 0),
            cantidad: Number(raw.cantidad || raw.stock || 0),
            
            // 👤 PROTECCIÓN DE IDENTIDAD
            nombre: raw.nombre || raw.cliente || raw.descripcion || "Sin identificar",
            tecnico: raw.tecnico || "Staff",
            estado: raw.estado || "INGRESO",
            
            // 📅 PROTECCIÓN DE TIEMPO: Evita errores de "toDate is not a function"
            fechaIngreso: raw.fechaIngreso || raw.creadoEn || { toDate: () => new Date() }
        };
    });

  } catch (e) {
    console.error(`🔥 Critical Error en ${coleccion}:`, e);
    return []; 
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
    if(!id) return { exists: () => false };
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
      empresaId: idTaller, 
      creadoEn: serverTimestamp(),
      total: Number(data.total || 0)
    });
    return docRef.id;
  } catch (e) {
    console.error("Error en creación:", e);
    throw e;
  }
}
