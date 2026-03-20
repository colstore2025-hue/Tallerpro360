/**
 * ========================================================
 * CEOAI.JS - Módulo IA Gerente PRO360 ULTRA FINAL v1.2
 * Compatible producción / window.db / estilo Power BI
 * ========================================================
 */

import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { analizarNegocio, hablarResumen } from "../ai/aiManager.js";
import { generarSugerencias } from "../ai/aiAdvisor.js";
import { analizarEmpresaAvanzado } from "../ai/ceoIntelligence.js";

const db = window.db;

export default async function CEOAIModule(container, state) {

  /* ===== VALIDACIÓN ===== */
  if (!state?.empresaId) {
    container.innerHTML = `<div style="color:red;">❌ empresaId no definido</div>`;
    return;
  }

  const base = `empresas/${state.empresaId}`;

  container.innerHTML = renderUI();
  const resultado = container.querySelector("#resultado");
  const btnAnalizar = container.querySelector("#analizar");
  const btnVoz = container.querySelector("#voz");

  /* =========================
  OBTENER DATA REAL
  ========================= */
  async function obtenerDatos() {
    try {
      const [ordenesSnap, invSnap] = await Promise.all([
        getDocs(query(collection(db, `${base}/ordenes`), orderBy("creadoEn", "desc"))),
        getDocs(query(collection(db, `${base}/repuestos`), orderBy("creadoEn", "desc")))
      ]);

      let ordenes = ordenesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      let inventario = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 🔥 FILTRO NEGOCIO REAL
      ordenes = ordenes.filter(o => o.estado === "aprobada" || o.estado === "cerrada");

      return { ordenes, inventario };
    } catch (e) {
      console.error("❌ Error obteniendo datos CEO:", e);
      return { ordenes: [], inventario: [] };
    }
  }

  /* =========================
  KPIs BASE
  ========================= */
  function calcularKPIs(ordenes) {
    const ingresos = ordenes.reduce((a, o) => a + Number(o.total || 0), 0);
    const costos = ordenes.reduce((a, o) => a + Number(o.costoTotal || 0), 0);
    const utilidad = ingresos - costos;
    const ordenesCount = ordenes.length;
    return {
      ingresos,
      utilidad,
      margen: ingresos ? (utilidad / ingresos) * 100 : 0,
      ordenes: ordenesCount,
      ticketPromedio: ordenesCount ? ingresos / ordenesCount : 0
    };
  }

  /* =========================
  ANALIZAR NEGOCIO
  ========================= */
  btnAnalizar.onclick = async () => {
    setLoading(resultado);
    try {
      const { ordenes, inventario } = await obtenerDatos();
      if (!ordenes.length) {
        resultado.innerHTML = renderEmpty();
        return;
      }

      const kpis = calcularKPIs(ordenes);

      // 🧠 Sugerencias IA
      let sugerencias = [];
      try {
        const res = await generarSugerencias({ ordenes, inventario, empresaId: state.empresaId });
        sugerencias = res?.sugerencias || [];
      } catch (e) {
        console.warn("⚠️ Error IA sugerencias:", e);
      }

      // 🧠 IA CEO Clásica
      let data = { alertas: [], recomendaciones: [] };
      try {
        data = await analizarNegocio({ ordenes, inventario, empresaId: state.empresaId, resumen: kpis, sugerencias });
      } catch (e) {
        console.warn("⚠️ Error IA análisis:", e);
      }

      // 🧠 IA NIVEL DIOS
      const analisisPro = analizarEmpresaAvanzado({ ordenes, inventario });

      renderResultado(resultado, data, sugerencias, kpis, analisisPro);

      // 🎤 Voz CEO
      try {
        hablarResumen({ resumen: kpis, analisisPro });
      } catch (e) {}

    } catch (error) {
      console.error("❌ CEO AI Error:", error);
      resultado.innerHTML = renderError(error);
    }
  };

  /* =========================
  VOZ MANUAL
  ========================= */
  btnVoz.onclick = async () => {
    try {
      const { hablar } = await import("../voice/voiceCore.js");
      hablar(resultado.innerText || "No hay datos");
    } catch (e) {
      console.warn("⚠️ Voz no disponible:", e);
    }
  };
}

/* =========================
UI BASE
========================= */
function renderUI() {
  return `
    <h1 style="color:#00ffff;">🧠 CEO AI PRO360</h1>
    <div style="margin:10px 0;">
      <button id="analizar" style="margin-right:10px;">🚀 Analizar Negocio</button>
      <button id="voz">🎤 Escuchar</button>
    </div>
    <div id="resultado" style="margin-top:20px; background:#111827; padding:15px; border-radius:12px;"></div>
  `;
}

/* =========================
RENDER
========================= */
function setLoading(el){ el.innerHTML = "🤖 Analizando negocio..."; }
function renderEmpty(){ return "⚠️ No hay órdenes aprobadas aún"; }
function renderError(e){ return `❌ ${e.message}`; }

/* =========================
RESULTADO NIVEL DIOS
========================= */
function renderResultado(el, data, sugerencias, kpis, analisisPro) {
  el.innerHTML = `
    <h2>🧠 Estado del Negocio</h2>
    <div style="font-size:18px;">Riesgo: <strong>${analisisPro.riesgo.toUpperCase()}</strong></div>

    <h2>📊 KPIs</h2>
    ${card("Ingresos", money(kpis.ingresos))}
    ${card("Utilidad", money(kpis.utilidad))}
    ${card("Margen", kpis.margen.toFixed(2)+"%")}
    ${card("Órdenes", kpis.ordenes)}
    ${card("Ticket Promedio", money(kpis.ticketPromedio))}

    <h2>🔮 Proyecciones</h2>
    ${card("7 días", money(analisisPro.proyecciones.proyeccion7dias))}
    ${card("30 días", money(analisisPro.proyecciones.proyeccion30dias))}

    <h2>🚨 Alertas Inteligentes</h2>
    ${list(analisisPro.alertas)}

    <h2>🧠 Decisiones Automáticas</h2>
    ${list(analisisPro.decisiones)}

    <h2>💡 Recomendaciones IA</h2>
    ${list(data.recomendaciones)}

    <h2>🤖 Sugerencias IA</h2>
    ${list(sugerencias)}
  `;
}

function card(t,v){ return `<div style="margin:5px 0;"><strong>${t}:</strong> ${v}</div>`; }
function list(arr){ return (!arr||!arr.length) ? "Sin datos" : arr.map(i=>`• ${i}`).join("<br>"); }
function money(v){ return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP"}).format(v||0); }