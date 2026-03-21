/**
 * firestoreGuardianGod.js - V3 ULTRA
 * El Centinela de Datos de Nexus-X Starlink SAS
 */
import { 
  collection, onSnapshot, updateDoc, doc, addDoc, getDocs, query, limit 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export function activarModoDiosGuardian(empresaId) {
  if (!empresaId) return;

  console.log("🔥 NEXUS-X: GUARDIAN GOD ACTIVADO");
  const base = `empresas/${empresaId}`;

  // Ejecutar limpieza inicial de forma silenciosa
  fixTotalInicial(empresaId);

  // Iniciar vigilancia activa
  escucharOrdenes(base);
  escucharInventario(base);
}

async function fixTotalInicial(empresaId) {
  const base = `empresas/${empresaId}`;
  try {
    const ordenesSnap = await getDocs(collection(db, `${base}/ordenes`));
    for (const d of ordenesSnap.docs) {
      validarYCorregirOrden(base, d.id, d.data());
    }
  } catch (e) { console.error("❌ Fallo en barrido inicial:", e); }
}

function escucharOrdenes(base) {
  onSnapshot(collection(db, `${base}/ordenes`), snapshot => {
    snapshot.docChanges().forEach(change => {
      // Solo actuar si es una adición o modificación externa
      if (["added", "modified"].includes(change.type)) {
        const data = change.doc.data();
        // Evitar bucle: Si el cambio ya viene con la firma del Guardian, ignorar
        if (data.lastFixBy === "GuardianGod") return;
        validarYCorregirOrden(base, change.doc.id, data);
      }
    });
  });
}

async function validarYCorregirOrden(base, id, data) {
  const update = {};

  // 1. Reglas Financieras de Oro
  if (data.total < 0) update.total = 0;
  
  // Si el costo es mayor al total, la utilidad no puede ser negativa en el sistema
  const costo = data.costoTotal || 0;
  const total = data.total || 0;
  if (costo > total) {
    update.utilidad = 0;
    update.alertaIA = "Costo excede al total";
  } else {
    update.utilidad = total - costo;
  }

  // 2. Integridad de Proceso
  if (!data.estado) update.estado = "diagnostico";
  if (!data.fechaPromesa && data.estado === "abierta") {
     update.alertaIA = "Sin fecha de entrega definida";
  }

  // APLICAR CORRECCIÓN CON FIRMA (Para evitar bucles)
  if (Object.keys(update).length > 0) {
    update.lastFixBy = "GuardianGod";
    update.updatedAt = new Date();
    await updateDoc(doc(db, `${base}/ordenes`, id), update);
    registrarEvento(base, "FIX_ORDEN", id, update);
  }
}

function escucharInventario(base) {
  onSnapshot(collection(db, `${base}/repuestos`), snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === "modified") {
        const data = change.doc.data();
        if (data.lastFixBy === "GuardianGod") return;
        validarYCorregirStock(base, change.doc.id, data);
      }
    });
  });
}

async function validarYCorregirStock(base, id, data) {
  const update = {};
  
  // 1. Regla de Margen: Mínimo 30% de ganancia si el precio es absurdo
  if (data.precioVenta <= data.precioCompra) {
    update.precioVenta = Math.round((data.precioCompra * 1.30));
    update.alertaIA = "Margen de ganancia corregido al 30%";
  }

  if (data.stock < 0) update.stock = 0;

  if (Object.keys(update).length > 0) {
    update.lastFixBy = "GuardianGod";
    await updateDoc(doc(db, `${base}/repuestos`, id), update);
    registrarEvento(base, "FIX_STOCK", id, update);
  }
}

async function registrarEvento(base, tipo, refId, cambios) {
  try {
    await addDoc(collection(db, `${base}/ia_logs`), {
      tipo,
      refId,
      cambios,
      fecha: new Date(),
      emisor: "Nexus-X Guardian"
    });
  } catch (e) { /* Silencioso */ }
}
