/**
 * gerenteAI.js
 * Módulo Gerente IA PRO360 🔥
 * Analiza el taller completo y propone mejoras en todas las áreas
 */

import { collection, getDocs, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = window.db;

export default async function gerenteAI(container, state) {

  renderBaseUI(container);

  if (!state?.empresaId) {
    container.innerHTML = `<h2 style="color:red;">❌ Empresa no definida</h2>`;
    return;
  }

  try {
    const data = await fetchData(state.empresaId);
    renderAll(data);
  } catch (e) {
    console.error("❌ Error gerenteAI:", e);
    container.innerHTML = `<h2 style="color:red;">⚠️ Error cargando datos</h2><pre>${e.message}</pre>`;
  }
}

/* ================= UI BASE ================= */

function renderBaseUI(container) {
  container.innerHTML = `
    <h1 style="text-align:center;color:#00ffcc;">🧠 Gerente IA PRO360</h1>
    <div id="kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:15px;margin:20px 0;"></div>
    <div id="alertas" style="margin-top:30px;"></div>
    <div id="recomendaciones" style="margin-top:20px;"></div>
    <button id="voz" style="margin-top:20px;padding:12px;background:#00ff99;border:none;border-radius:10px;font-weight:bold;cursor:pointer;">🎤 Escuchar Resumen IA</button>
  `;
}

/* ================= FETCH DATA ================= */

async function fetchData(empresaId) {
  const colecciones = [
    `empresas/${empresaId}/ordenes`,
    `empresas/${empresaId}/clientes`,
    `empresas/${empresaId}/repuestos`,
    `empresas/${empresaId}/finanzas`
  ];

  const data = {
    ordenes: [],
    clientes: [],
    inventario: [],
    finanzas: []
  };

  for (let col of colecciones) {
    const snap = await getDocs(query(collection(db, col)));
    const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (col.includes("ordenes")) data.ordenes = arr;
    else if (col.includes("clientes")) data.clientes = arr;
    else if (col.includes("repuestos")) data.inventario = arr;
    else if (col.includes("finanzas")) data.finanzas = arr;
  }

  return data;
}

/* ================= RENDER GLOBAL ================= */

function renderAll(data) {

  const kpis = calcularKPIs(data);
  const alertas = generarAlertas(kpis, data);
  const recomendaciones = generarRecomendaciones(kpis, data);
  const sugerencias = generarSugerencias(kpis, data);

  renderKPIs(kpis);
  renderAlertas(alertas);
  renderRecomendaciones(recomendaciones, sugerencias);

  document.getElementById("voz").onclick = () => {
    hablarResumen(kpis, alertas);
  };
}

/* ================= KPIs ================= */

function calcularKPIs(data) {
  const ingresos = data.ordenes.reduce((a, o) => a + Number(o.total || 0), 0);
  const costos = data.ordenes.reduce((a, o) => a + Number(o.costoTotal || 0), 0);
  const utilidad = ingresos - costos;
  const ordenesCount = data.ordenes.length;
  const clientesCount = data.clientes.length;
  const ticketPromedio = ordenesCount ? ingresos / ordenesCount : 0;
  const margen = ingresos ? (utilidad / ingresos) * 100 : 0;
  const inventarioValor = data.inventario.reduce((a, i) => a + Number(i.costo || 0), 0);

  return { ingresos, costos, utilidad, ordenesCount, clientesCount, ticketPromedio, margen, inventarioValor };
}

function renderKPIs(kpis) {
  const el = document.getElementById("kpis");
  el.innerHTML = `
    <div style="background:#111827;padding:15px;border-radius:10px;text-align:center;">
      💰 Ingresos<br/><strong>$${fmt(kpis.ingresos)}</strong>
    </div>
    <div style="background:#111827;padding:15px;border-radius:10px;text-align:center;">
      📉 Costos<br/><strong>$${fmt(kpis.costos)}</strong>
    </div>
    <div style="background:#111827;padding:15px;border-radius:10px;text-align:center;">
      📈 Utilidad<br/><strong>$${fmt(kpis.utilidad)}</strong>
    </div>
    <div style="background:#111827;padding:15px;border-radius:10px;text-align:center;">
      🧾 Órdenes<br/><strong>${kpis.ordenesCount}</strong>
    </div>
    <div style="background:#111827;padding:15px;border-radius:10px;text-align:center;">
      👥 Clientes<br/><strong>${kpis.clientesCount}</strong>
    </div>
    <div style="background:#111827;padding:15px;border-radius:10px;text-align:center;">
      📊 Margen<br/><strong>${kpis.margen.toFixed(2)}%</strong>
    </div>
    <div style="background:#111827;padding:15px;border-radius:10px;text-align:center;">
      💾 Inventario<br/><strong>$${fmt(kpis.inventarioValor)}</strong>
    </div>
    <div style="background:#111827;padding:15px;border-radius:10px;text-align:center;">
      🎯 Ticket Promedio<br/><strong>$${fmt(kpis.ticketPromedio)}</strong>
    </div>
  `;
}

/* ================= ALERTAS ================= */

function generarAlertas(kpis, data) {
  const a = [];
  if (kpis.utilidad < 0) a.push("❌ Negocio en pérdida");
  if (kpis.ordenesCount < 5) a.push("⚠️ Pocas órdenes");
  if (kpis.margen < 20) a.push("⚠️ Margen bajo");
  if (kpis.inventarioValor > kpis.ingresos * 0.5) a.push("⚠️ Inventario elevado");
  if (data.ordenes.filter(o => (o.total - o.costoTotal) < 20000).length > data.ordenes.length * 0.4) {
    a.push("⚠️ Muchas órdenes poco rentables");
  }
  return a;
}

function renderAlertas(alertas) {
  const el = document.getElementById("alertas");
  el.innerHTML = `<h2 style="color:#ff4444;">⚠️ Alertas</h2>` + (alertas.length ? alertas.map(a => `<p>${a}</p>`).join("") : "<p>Sin alertas</p>");
}

/* ================= RECOMENDACIONES ================= */

function generarRecomendaciones(kpis, data) {
  const r = [];
  if (kpis.utilidad > 0) r.push("✅ Negocio rentable");
  if (kpis.ticketPromedio < 100000) r.push("📈 Aumenta ticket promedio");
  if (kpis.margen > 30) r.push("🚀 Escalar negocio posible");
  if (data.inventario.length) r.push("🔧 Optimizar repuestos más usados");
  if (data.clientes.length) r.push("💬 Revisar fidelización de clientes");
  return r;
}

function generarSugerencias(kpis, data) {
  const s = [];
  if (kpis.ticketPromedio < 100000) s.push("Subir precios en servicios de bajo valor");
  if (kpis.costos > kpis.ingresos * 0.7) s.push("Revisar proveedores y costos");
  if (data.ordenes.length < 10) s.push("Activar promociones o WhatsApp clientes");
  if (kpis.inventarioValor > kpis.ingresos * 0.5) s.push("Liquidar stock lento");
  return s;
}

function renderRecomendaciones(recomendaciones, sugerencias) {
  const el = document.getElementById("recomendaciones");
  el.innerHTML = `<h2 style="color:#00ffcc;">💡 Recomendaciones y Acciones</h2>
    <ul>
      ${recomendaciones.map(r => `<li>${r}</li>`).join("")}
      ${sugerencias.map(s => `<li>💡 ${s}</li>`).join("")}
    </ul>
  `;
}

/* ================= VOZ ================= */

function hablarResumen(kpis, alertas) {
  try {
    const texto = `
      Resumen Gerente IA.
      Ingresos ${kpis.ingresos}.
      Utilidad ${kpis.utilidad}.
      Margen ${kpis.margen.toFixed(2)} por ciento.
      ${alertas.join(". ")}
    `;
    import("../voice/voiceCore.js").then(v => v.hablar(texto));
  } catch {}
}

/* ================= UTILS ================= */

function fmt(v) {
  return new Intl.NumberFormat("es-CO").format(v || 0);
}