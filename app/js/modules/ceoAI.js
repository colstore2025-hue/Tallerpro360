/**
================================================
CEOAI.JS - Módulo IA Gerente PRO360 ULTRA FINAL
Estilo Power BI / GOD CORE
================================================
*/

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { analizarNegocio, hablarResumen } from "../ai/aiManager.js";
import { generarSugerencias } from "../ai/aiAdvisor.js";
import { analizarEmpresaAvanzado } from "../ai/ceoIntelligence.js";

const db = window.db; // 🔹 usa el db global igual que los demás módulos

export default async function CEOAIModule(container, state) {

  if (!state?.empresaId) {
    container.innerHTML = `<h2 style="color:red;">❌ Empresa no definida</h2>`;
    return;
  }

  const base = `empresas/${state.empresaId}`;
  container.innerHTML = renderUI();

  const resultado = container.querySelector("#resultado");
  const btnAnalizar = container.querySelector("#analizar");
  const btnVoz = container.querySelector("#voz");

  /* =========================
  BOTÓN ANALIZAR
  ========================= */
  btnAnalizar.onclick = async () => {
    setLoading(resultado);

    try {
      const { ordenes, inventario } = await obtenerDatos(base);

      if (!ordenes.length) {
        resultado.innerHTML = renderEmpty();
        return;
      }

      const kpis = calcularKPIs(ordenes);

      // Sugerencias IA
      let sugerencias = [];
      try {
        const res = await generarSugerencias({ ordenes, inventario, empresaId: state.empresaId });
        sugerencias = res?.sugerencias || [];
      } catch (e) {
        console.warn("⚠️ Error IA sugerencias:", e);
      }

      // Análisis IA gerente
      let data = { alertas: [], recomendaciones: [] };
      try {
        data = await analizarNegocio({ ordenes, inventario, empresaId: state.empresaId, resumen: kpis, sugerencias });
      } catch (e) {
        console.warn("⚠️ Error IA análisis:", e);
      }

      // IA CEO avanzado
      const analisisPro = analizarEmpresaAvanzado({ ordenes, inventario });

      renderResultado(resultado, data, sugerencias, kpis, analisisPro);

      // Voz resumen
      try { hablarResumen(kpis); } catch(e){}

    } catch (error) {
      console.error("❌ CEO AI Error:", error);
      resultado.innerHTML = renderError(error);
    }
  };

  /* =========================
  BOTÓN VOZ
  ========================= */
  btnVoz.onclick = () => {
    try {
      hablarResumen({ ingresos: 0, utilidad: 0, margen: 0 });
    } catch (e) {
      console.warn("⚠️ Voz no disponible:", e);
    }
  };
}

/* =========================
OBTENER DATOS
========================= */
async function obtenerDatos(base) {
  try {
    const [ordenesSnap, invSnap] = await Promise.all([
      getDocs(query(collection(db, `${base}/ordenes`), orderBy("creadoEn", "desc"))),
      getDocs(query(collection(db, `${base}/repuestos`), orderBy("creadoEn", "desc")))
    ]);

    let ordenes = ordenesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    let inventario = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Solo negocio real
    ordenes = ordenes.filter(o => o.estado === "aprobada" || o.estado === "cerrada");

    return { ordenes, inventario };
  } catch (e) {
    console.error("❌ Error obteniendo datos CEO:", e);
    return { ordenes: [], inventario: [] };
  }
}

/* =========================
CALCULO KPIs
========================= */
function calcularKPIs(ordenes) {
  const ingresos = ordenes.reduce((a,o)=>a+Number(o.total||0),0);
  const costos = ordenes.reduce((a,o)=>a+Number(o.costoTotal||0),0);
  const utilidad = ingresos - costos;
  const ordenesCount = ordenes.length;

  return {
    ingresos,
    utilidad,
    margen: ingresos ? (utilidad/ingresos)*100 : 0,
    ordenes: ordenesCount,
    ticketPromedio: ordenesCount ? ingresos/ordenesCount : 0
  };
}

/* =========================
RENDER UI
========================= */
function renderUI() {
  return `
    <h1 style="color:#00ffff;">🧠 CEO AI PRO360</h1>
    <div style="margin-bottom:15px;">
      <button id="analizar" style="padding:10px;background:#00ff99;border:none;border-radius:10px;margin-right:10px;cursor:pointer;">
        🚀 Analizar Negocio
      </button>
      <button id="voz" style="padding:10px;background:#ffcc00;border:none;border-radius:10px;cursor:pointer;">
        🎤 Escuchar Resumen
      </button>
    </div>
    <div id="resultado" style="margin-top:20px;background:#111827;padding:20px;border-radius:12px;color:#0ff;min-height:150px;"></div>
  `;
}

function setLoading(el) {
  el.innerHTML = "🤖 Analizando negocio...";
}

function renderEmpty() {
  return "⚠️ No hay órdenes aprobadas aún";
}

function renderError(e) {
  return `<div style="color:red;">❌ ${e.message}</div>`;
}

/* =========================
RENDER RESULTADO COMPLETO GOD CORE
========================= */
function renderResultado(el, data, sugerencias, kpis, analisisPro) {
  el.innerHTML = `
    <h2>🧠 Estado del Negocio</h2>
    <div>Riesgo: <strong>${analisisPro.riesgo.toUpperCase()}</strong></div>

    <h2>📊 KPIs</h2>
    ${card("Ingresos", money(kpis.ingresos))}
    ${card("Utilidad", money(kpis.utilidad))}
    ${card("Margen", kpis.margen.toFixed(2)+"%")}
    ${card("Órdenes", kpis.ordenes)}
    ${card("Ticket Promedio", money(kpis.ticketPromedio))}

    <h2>🔮 Proyecciones</h2>
    ${card("7 días", money(analisisPro.proyecciones?.proyeccion7dias))}
    ${card("30 días", money(analisisPro.proyecciones?.proyeccion30dias))}

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

function card(t,v) {
  return `<div style="background:#0f172a;padding:10px;margin:6px;border-radius:8px;">
            <strong>${t}:</strong> ${v}
          </div>`;
}

function list(arr) {
  if(!arr || !arr.length) return "Sin datos";
  return arr.map(i=>`• ${i}`).join("<br>");
}

function money(v){
  return new Intl.NumberFormat("es-CO",{ style:"currency", currency:"COP" }).format(v||0);
}