/**
 * dataService.js - NEXUS-X STARLINK V6.0 🛰️
 * NÚCLEO DE SINCRONIZACIÓN NEURAL Y GESTIÓN DE ACTIVOS
 * Optimizado para ERP + CRM + IA Orquestador
 */

import { 
  collection, getDocs, addDoc, query, where, 
  limit, serverTimestamp, doc, getDoc, orderBy, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

/**
 * 🌀 MOTOR DE EXTRACCIÓN DE ALTA DISPONIBILIDAD
 * Implementa normalización de datos en tiempo de ejecución para evitar "Crashes" en el Dashboard.
 */
async function fetchNexusData(coleccion, empresaId, options = {}) {
  const idTaller = empresaId || localStorage.getItem("empresaId") || localStorage.getItem("nexus_empresaId");
  
  if (!idTaller) {
    console.error(`📡 STARLINK_ERROR: Nodo de empresa no identificado para [${coleccion}].`);
    return [];
  }

  try {
    const colRef = collection(db, coleccion);
    const q = query(
      colRef, 
      where("empresaId", "==", idTaller), 
      orderBy("creadoEn", "desc"), // Priorizamos datos recientes para la IA
      limit(options.limit || 100)
    );

    const snap = await getDocs(q);
    
    return snap.docs.map(d => {
        const raw = d.data();
        return {
            id: d.id,
            ...raw,
            // 💰 NORMALIZACIÓN FINANCIERA (Anti-NaN)
            total: Number(raw.total || raw.valor || 0),
            cantidad: Number(raw.cantidad || raw.stock || 0),
            
            // 🛠️ LÓGICA DE REPUESTOS (NUEVO: Taller vs Cliente)
            esRepuestoPropio: raw.origenRepuesto !== "CLIENTE",
            
            // 👤 ATRIBUTOS DE IDENTIDAD
            nombre: raw.nombre || raw.cliente || "USUARIO_ANONIMO",
            email: raw.email || "sin_correo@nexus.com", // Vital para el CRM
            tecnico: raw.tecnico || "STAFF_CENTRAL",
            
            // 📅 PROTECCIÓN DE TIMESTAMPS
            fechaIngreso: raw.creadoEn?.toDate() || new Date()
        };
    });

  } catch (e) {
    console.error(`🔥 CRITICAL_HALT en ${coleccion}:`, e);
    // Retornamos array vacío para que el dashboard no se rompa (Fail-Safe)
    return []; 
  }
}

/* ======================================================
   🛰️ CONECTORES DE ÓRBITA (EXPORTACIÓN DE MÓDULOS)
   ====================================================== */

export const getClientes = (id) => fetchNexusData("clientes", id, { limit: 200 });
export const getOrdenes = (id) => fetchNexusData("ordenes", id, { limit: 100 });
export const getInventario = (id) => fetchNexusData("inventario", id, { limit: 300 });

/**
 * 💼 SERVICIO CONTABLE (FINANZAS ELITE)
 * Registra asientos contables automáticos desde Órdenes o Gastos manuales.
 */
export async function registrarMovimientoContable(tipo, monto, descripcion, metadata = {}) {
    const idTaller = localStorage.getItem("empresaId");
    return await addDoc(collection(db, "contabilidad"), {
        empresaId: idTaller,
        tipo: tipo, // "INGRESO" o "EGRESO"
        monto: Number(monto),
        concepto: descripcion,
        moduloOrigen: metadata.modulo || "MANUAL",
        creadoEn: serverTimestamp(),
        ...metadata
    });
}

/**
 * 📦 GESTIÓN DE STOCK INTELIGENTE
 * Descuenta del inventario solo si el repuesto es del taller.
 */
export async function descontarStock(itemId, cantidadPedida) {
    try {
        const docRef = doc(db, "inventario", itemId);
        const itemSnap = await getDoc(docRef);
        
        if (itemSnap.exists()) {
            const stockActual = Number(itemSnap.data().cantidad || 0);
            const nuevoStock = stockActual - cantidadPedida;
            await updateDoc(docRef, { cantidad: Math.max(0, nuevoStock) });
            return true;
        }
    } catch (e) {
        console.error("🚨 STOCK_SYNC_ERROR:", e);
        return false;
    }
}

/**
 * 🏢 TELEMETRÍA DE EMPRESA
 */
export async function getEmpresaData(empresaId) {
    const id = empresaId || localStorage.getItem("empresaId");
    if(!id) return null;
    const docRef = doc(db, "empresas", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * ✍️ CREADOR UNIVERSAL (Protocolo de Inyección de Seguridad)
 */
export async function createDocument(coleccion, data) {
  const idTaller = localStorage.getItem("empresaId");
  if (!idTaller) throw new Error("NO_NEXUS_ID_DETECTED");

  try {
    const docRef = await addDoc(collection(db, coleccion), {
      ...data,
      empresaId: idTaller, 
      creadoEn: serverTimestamp(),
      total: Number(data.total || 0)
    });
    return docRef.id;
  } catch (e) {
    console.error(`🔥 ERROR_WRITE [${coleccion}]:`, e);
    throw e;
  }
}
