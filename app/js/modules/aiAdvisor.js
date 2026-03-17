/**
 * 🧠 IA Advisor PRO360
 * TallerPRO360 – Recomendaciones, alertas y KPIs
 */

import { getDocs, collection, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export let Advisor = {
  empresaId: null,
  ordenes: [],
  alertas: [],
  recomendaciones: [],
  resumen: {}
};

// Inicializar IA Advisor
export async function init({ empresaId } = {}) {
  if (!empresaId) {
    console.warn("⚠️ Advisor no inicializado: empresaId requerido");
    return;
  }

  Advisor.empresaId = empresaId;
  console.log("🧠 IA Advisor PRO360 inicializando para:", empresaId);

  await actualizarAdvisor();
}

// Actualizar análisis y recomendaciones
export async function actualizarAdvisor() {
  if (!Advisor.empresaId) return;

  try {
    // 🔍 Obtener órdenes de la empresa
    const q = query(
      collection(db, "ordenes"),
      where("empresaId", "==", Advisor.empresaId)
    );

    const snapshot = await getDocs(q);
    const ordenes = [];

    snapshot.forEach(doc => {
      ordenes.push(doc.data());
    });

    Advisor.ordenes = ordenes;

    // 📊 Generar resumen de KPIs
    const ingresos = ordenes.reduce((sum, o) => sum + (o.total || 0), 0);
    const costos = ordenes.reduce((sum, o) => sum + (o.costoTotal || 0), 0);
    const utilidad = ingresos - costos;
    const ticketPromedio = ordenes.length ? ingresos / ordenes.length : 0;
    const margen = ingresos ? Math.round((utilidad / ingresos) * 100) : 0;

    Advisor.resumen = { ingresos, costos, utilidad, ticketPromedio, margen };

    // 🚨 Generar alertas automáticas
    const alertas = [];
    if (margen < 20) alertas.push("Margen bajo: revisar precios y costos");
    if (ordenes.length === 0) alertas.push("No hay órdenes registradas");

    Advisor.alertas = alertas;

    // 💡 Generar recomendaciones
    const recomendaciones = [];
    if (alertas.includes("Margen bajo: revisar precios y costos")) {
      recomendaciones.push("Revisar costo de repuestos y optimizar precios de venta");
    }
    if (alertas.includes("No hay órdenes registradas")) {
      recomendaciones.push("Iniciar campañas de marketing y contacto con clientes");
    }

    Advisor.recomendaciones = recomendaciones;

    console.log("✅ Advisor actualizado:", Advisor);

  } catch (e) {
    console.error("❌ Error actualizando Advisor:", e);
  }
}

// Renderizar sugerencias en un contenedor HTML
export function renderSugerencias(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { alertas, recomendaciones, resumen } = Advisor;

  container.innerHTML = `
    <div style="
      background:#111827; 
      color:#00ffcc; 
      padding:15px; 
      border-radius:10px;
      box-shadow:0 0 15px #00ff99;">
      
      <h3>🧠 IA Advisor</h3>
      <p>💰 Ingresos: $${formatear(resumen.ingresos)}</p>
      <p>📉 Costos: $${formatear(resumen.costos)}</p>
      <p>📈 Utilidad: $${formatear(resumen.utilidad)}</p>
      <p>🎯 Ticket Promedio: $${formatear(resumen.ticketPromedio)}</p>
      <p>📊 Margen: ${resumen.margen}%</p>

      <h4>🚨 Alertas</h4>
      ${alertas.length ? alertas.map(a => `<p>${a}</p>`).join("") : "<p>Sin alertas</p>"}

      <h4>💡 Recomendaciones</h4>
      ${recomendaciones.length ? recomendaciones.map(r => `<p>${r}</p>`).join("") : "<p>Sin recomendaciones</p>"}
    </div>
  `;
}

// Notificar alertas por voz
export function notificarAlertas() {
  Advisor.alertas.forEach(a => hablar(`🚨 Alerta: ${a}`));
}

// Formatear números a moneda
function formatear(valor) {
  return new Intl.NumberFormat("es-CO").format(valor || 0);
}