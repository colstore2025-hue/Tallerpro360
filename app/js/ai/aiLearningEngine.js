/**
 * IA QUE APRENDE DEL TALLER
 */

import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

// 🔥 GUARDAR APRENDIZAJE AUTOMÁTICO
export async function aprenderDeOrden(orden) {
  try {
    if (!orden || !orden.diagnostico) return;

    await addDoc(collection(db, "aprendizajeIA"), {
      diagnostico: orden.diagnostico,
      valorTrabajo: Number(orden.valorTrabajo || 0),
      total: Number(orden.total || 0),
      fecha: new Date(),
      vehiculo: orden.vehiculo?.marca || "",
    });

    console.log("🧠 IA aprendió de esta orden");

  } catch (e) {
    console.warn("Error aprendizaje IA:", e.message);
  }
}

export async function sugerirDesdeHistorial(diagnostico) {
  try {
    const snapshot = await getDocs(collection(db, "aprendizajeIA"));

    let coincidencias = [];

    snapshot.forEach(doc => {
      const data = doc.data();

      if (data.diagnostico?.toLowerCase().includes(diagnostico.toLowerCase())) {
        coincidencias.push(data);
      }
    });

    if (coincidencias.length === 0) return null;

    // 📊 Promedio inteligente
    const promedioTrabajo =
      coincidencias.reduce((acc, c) => acc + c.valorTrabajo, 0) / coincidencias.length;

    const promedioTotal =
      coincidencias.reduce((acc, c) => acc + c.total, 0) / coincidencias.length;

    return {
      valorTrabajo: Math.round(promedioTrabajo),
      total: Math.round(promedioTotal),
      confianza: coincidencias.length
    };

  } catch (e) {
    console.warn("Error sugerencias IA:", e.message);
    return null;
  }
}