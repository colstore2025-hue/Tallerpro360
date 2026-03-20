/**
 * aiAssistant.js
 * Asistente Inteligente PRO360 · FIX TOTAL
 */

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { generarSugerencias } from "../ai/aiAdvisor.js";
import { hablar, iniciarVoz } from "../voice/voiceCore.js";

const db = window.db;

/* =========================
MODULE
========================= */
export default async function aiAssistantModule(container, state) {

  if (!state?.empresaId) {
    container.innerHTML = `❌ Empresa no definida`;
    return;
  }

  const base = `empresas/${state.empresaId}`;

  container.innerHTML = `
    <h1 style="color:#0ff;">🤖 Asistente IA PRO360</h1>

    <textarea id="consultaIA"
      placeholder="Pregunta al asistente..."
      style="width:100%;height:80px;background:#111;color:#0ff;padding:10px;border-radius:8px;"></textarea>

    <div style="margin-top:10px;">
      <button id="consultarIA">💬 Consultar</button>
      <button id="vozIA">🎤 Voz</button>
      <button id="limpiarChat">🧹 Limpiar</button>
    </div>

    <div id="respuestaIA"
      style="background:#111;padding:15px;margin-top:10px;border-radius:10px;color:#0ff;min-height:150px;"></div>
  `;

  const input = document.getElementById("consultaIA");
  const output = document.getElementById("respuestaIA");

  let historial = [];

  /* =========================
  RESUMEN REAL FIRESTORE
  ========================= */
  async function generarResumenOrdenes() {

    try {

      const snap = await getDocs(
        query(
          collection(db, `${base}/ordenes`),
          orderBy("creadoEn", "desc")
        )
      );

      let ordenes = [];
      let ingresos = 0;
      let costos = 0;
      let abiertas = 0;

      snap.forEach(doc => {
        const o = doc.data();
        ordenes.push(o);

        ingresos += Number(o.total || 0);
        costos += Number(o.costoTotal || 0);

        if (o.estado !== "cerrada" && o.estado !== "aprobada") {
          abiertas++;
        }
      });

      return {
        ordenes,
        inventario: [], // opcional (puedes integrarlo después)
        ingresos,
        utilidad: ingresos - costos,
        ordenesAbiertas: abiertas
      };

    } catch (e) {

      console.error("❌ Error resumen IA:", e);

      return {
        ordenes: [],
        inventario: [],
        ingresos: 0,
        utilidad: 0,
        ordenesAbiertas: 0
      };
    }
  }

  /* =========================
  PROCESAR CONSULTA
  ========================= */
  async function procesarConsulta(pregunta) {

    if (!pregunta) return;

    output.innerHTML += `<p style="color:#ff0;">> ${pregunta}</p>`;

    try {

      const resumen = await generarResumenOrdenes();

      const { sugerencias } = await generarSugerencias({
        ordenes: resumen.ordenes,
        inventario: resumen.inventario,
        empresaId: state.empresaId
      });

      const respuesta = `
        <p>🧾 Resumen:</p>
        <ul>
          <li>Ingresos: $${fmt(resumen.ingresos)}</li>
          <li>Utilidad: $${fmt(resumen.utilidad)}</li>
          <li>Órdenes abiertas: ${resumen.ordenesAbiertas}</li>
        </ul>

        <p>💡 IA recomienda:</p>
        <ul>
          ${sugerencias.map(s => `<li>${s}</li>`).join("")}
        </ul>
      `;

      historial.push({ pregunta, respuesta });

      output.innerHTML += respuesta;
      output.scrollTop = output.scrollHeight;

      hablar("Aquí tienes el análisis del negocio");

    } catch (e) {

      console.error(e);

      output.innerHTML += `<p style="color:red;">❌ Error IA</p>`;
      hablar("Error procesando la información");
    }
  }

  /* =========================
  EVENTOS
  ========================= */

  document.getElementById("consultarIA").onclick = async () => {
    const q = input.value.trim();
    input.value = "";
    await procesarConsulta(q);
  };

  document.getElementById("vozIA").onclick = () => {
    iniciarVoz(async (texto) => {
      input.value = texto;
      await procesarConsulta(texto);
    });
  };

  document.getElementById("limpiarChat").onclick = () => {
    historial = [];
    output.innerHTML = "";
  };
}

/* =========================
UTIL
========================= */
function fmt(v) {
  return new Intl.NumberFormat("es-CO").format(v || 0);
}