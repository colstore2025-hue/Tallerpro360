/*
================================================
PANEL.JS - Panel Estratégico TallerPRO360
Versión Final Avanzada para Dueños de Taller
Integración completa con AI y KPIs
================================================
*/

import { dashboard } from "./dashboard.js";
import { clientes } from "./clientes.js";
import { ordenes } from "./ordenes.js";
import { inventario } from "./inventario.js";
import { finanzas } from "./finanzas.js";
import { contabilidad } from "./contabilidad.js";
import { pagos } from "./pagos.js";
import { ia } from "./ia.js";
import { aiCommand } from "./aiComand.js";
import { aiAssistant } from "./aiAssistant.js";
import { aiAdvisor } from "./aiAdvisor.js";

export async function panel(container) {

  container.innerHTML = `
  <div style="display:flex;height:100vh;font-family:sans-serif;">
    <!-- Menú lateral -->
    <nav id="menuLateral" style="width:280px;background:#111827;color:white;padding:20px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;">
      <h2 style="margin-bottom:20px;text-align:center;">TallerPRO360 BSC</h2>

      <!-- Secciones principales -->
      <button class="btnModulo" data-modulo="dashboard">Dashboard Taller</button>
      <button class="btnModulo" data-modulo="clientes">Clientes</button>
      <button class="btnModulo" data-modulo="ordenes">Órdenes</button>
      <button class="btnModulo" data-modulo="inventario">Inventario</button>
      <button class="btnModulo" data-modulo="finanzas">Finanzas</button>
      <button class="btnModulo" data-modulo="contabilidad">Contabilidad</button>
      <button class="btnModulo" data-modulo="pagos">Pagos / Suscripciones</button>
      <button class="btnModulo" data-modulo="ia">IA Mecánica</button>

      <!-- IA estratégica -->
      <button class="btnModulo" data-modulo="aiAssistant">AI Assistant</button>
      <button class="btnModulo" data-modulo="aiCommand">AI Command Center</button>
      <button class="btnModulo" data-modulo="aiAdvisor">AI Service Advisor</button>
    </nav>

    <!-- Contenedor principal -->
    <main id="contenedorPrincipal" style="flex:1;padding:25px;overflow-y:auto;background:#1e293b;color:white;transition:all 0.3s;">
      <h2>Cargando panel estratégico...</h2>
    </main>
  </div>
  `;

  const contenedor = document.getElementById("contenedorPrincipal");

  // ===========================
  // Módulos disponibles
  // ===========================
  const modulos = {
    dashboard,
    clientes,
    ordenes,
    inventario,
    finanzas,
    contabilidad,
    pagos,
    ia,
    aiAssistant,
    aiCommand,
    aiAdvisor
  };

  // ===========================
  // Función para cargar módulo con animación
  // ===========================
  async function cargarModulo(nombre){
    contenedor.style.opacity = "0.5";
    contenedor.innerHTML = `<p>Cargando ${nombre}...</p>`;
    await new Promise(r => setTimeout(r, 150));
    const fnModulo = modulos[nombre];
    if(fnModulo){
      await fnModulo(contenedor);

      // Actualizar métricas IA si están disponibles
      if(window.aiMetrics && typeof window.aiMetrics.actualizarKPI === "function"){
        window.aiMetrics.actualizarKPI(contenedor);
      }

      contenedor.style.opacity = "1";
    } else {
      contenedor.innerHTML = `<p style="color:red;">Módulo no encontrado: ${nombre}</p>`;
      contenedor.style.opacity = "1";
    }
  }

  // ===========================
  // Inicializar módulo principal
  // ===========================
  cargarModulo("dashboard");

  // ===========================
  // Configurar botones menú lateral
  // ===========================
  const botones = document.querySelectorAll(".btnModulo");
  botones.forEach(btn=>{
    btn.style.padding = "12px";
    btn.style.border = "none";
    btn.style.borderRadius = "6px";
    btn.style.background = "#1f2937";
    btn.style.color = "white";
    btn.style.cursor = "pointer";
    btn.style.transition = "all 0.2s";

    btn.onmouseenter = ()=> btn.style.background = "#374151";
    btn.onmouseleave = ()=> btn.style.background = "#1f2937";

    btn.onclick = ()=> cargarModulo(btn.dataset.modulo);
  });

  // ===========================
  // Tecla rápida Alt+D -> Dashboard
  // ===========================
  window.addEventListener("keydown", e=>{
    if(e.altKey && e.key.toLowerCase()==="d"){
      cargarModulo("dashboard");
      hablar("Abriendo panel del taller");
    }
  });
}

// ===========================
// Síntesis de voz integrada
// ===========================
function hablar(texto){
  if(!texto) return;
  const speech = new SpeechSynthesisUtterance(texto);
  speech.lang = "es-ES";
  speech.rate = 1;
  speech.pitch = 1;
  speech.volume = 1;
  window.speechSynthesis.speak(speech);
}