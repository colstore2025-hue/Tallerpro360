/**
 * workshopRankingAI.js
 * TallerPRO360 Global Network
 * Ranking mundial de talleres con IA
 */

import { db } from "./firebase.js";
import {
  collection,
  query,
  getDocs,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =====================================================
CONFIGURACIÓN
===================================================== */
const TOP_TALLERES = 20; // Top talleres global
const TOP_TECNICOS = 20; // Top técnicos global

/* =====================================================
OBTENER RANKING DE TALLERES
===================================================== */
export async function rankingTalleres() {
  try {
    const q = query(
      collection(db, "empresas"),
      orderBy("ingresosTotales", "desc"),
      limit(TOP_TALLERES)
    );

    const snapshot = await getDocs(q);
    const ranking = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      ranking.push({
        id: doc.id,
        nombre: data.nombre || "Taller sin nombre",
        ingresosTotales: data.ingresosTotales || 0,
        margenUtilidad: data.margenUtilidad || 0,
        satisfaccionCliente: data.satisfaccionCliente || 0,
        rankingGlobal: data.rankingGlobal || 0,
      });
    });

    return ranking;
  } catch (err) {
    console.error("Error obteniendo ranking de talleres:", err);
    return [];
  }
}

/* =====================================================
OBTENER TOP TÉCNICOS
===================================================== */
export async function rankingTecnicos() {
  try {
    const q = query(
      collection(db, "usuariosGlobal"),
      orderBy("rendimiento", "desc"),
      limit(TOP_TECNICOS)
    );

    const snapshot = await getDocs(q);
    const ranking = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      ranking.push({
        uid: doc.id,
        nombre: data.nombre || "Técnico sin nombre",
        tallerId: data.empresaId || "No asignado",
        rendimiento: data.rendimiento || 0,
        tareasCompletadas: data.tareasCompletadas || 0,
        rankingGlobal: data.rankingGlobal || 0,
      });
    });

    return ranking;
  } catch (err) {
    console.error("Error obteniendo ranking de técnicos:", err);
    return [];
  }
}

/* =====================================================
ACTUALIZAR RANKING GLOBAL DE TALLER
===================================================== */
export async function actualizarRankingTaller(tallerId, rankingGlobal) {
  try {
    const tallerRef = collection(db, "empresas");
    const docRef = tallerRef.doc(tallerId);
    await docRef.update({
      rankingGlobal,
    });
    console.log(`🏆 Ranking global actualizado para taller ${tallerId}: ${rankingGlobal}`);
  } catch (err) {
    console.error("Error actualizando ranking de taller:", err);
  }
}

/* =====================================================
PREDICCIÓN DE RANKING
===================================================== */
export function predecirRanking(ingresosTotales, margenUtilidad, satisfaccionCliente) {
  // Algoritmo simple de puntuación global (0-100)
  const score =
    ingresosTotales * 0.5 +
    margenUtilidad * 0.3 +
    satisfaccionCliente * 0.2;
  return Math.round(score);
}

/* =====================================================
ACTUALIZAR TODOS LOS RANKINGS GLOBAL
===================================================== */
export async function actualizarRankingGlobal() {
  try {
    const talleres = await rankingTalleres();

    for (let t of talleres) {
      const score = predecirRanking(
        t.ingresosTotales,
        t.margenUtilidad,
        t.satisfaccionCliente
      );
      await actualizarRankingTaller(t.id, score);
    }

    console.log("🌎 Ranking global de talleres actualizado ✅");
  } catch (err) {
    console.error("Error actualizando ranking global:", err);
  }
}

/* =====================================================
UTILIDADES PARA FRONTEND
===================================================== */
export function mostrarRankingHTML(ranking, contId) {
  const cont = document.getElementById(contId);
  if (!cont) return;

  cont.innerHTML = "";

  ranking.forEach((t, i) => {
    const div = document.createElement("div");
    div.className = "flex justify-between p-2 border-b text-sm";
    div.innerHTML = `
      <span>${i + 1}. ${t.nombre}</span>
      <span>Ingresos: ${formatoCOP(t.ingresosTotales || t.rendimiento)}</span>
      <span>Margen: ${t.margenUtilidad || t.rankingGlobal}%</span>
    `;
    cont.appendChild(div);
  });
}

/* =====================================================
FORMATO MONEDA COP
===================================================== */
export function formatoCOP(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor);
}