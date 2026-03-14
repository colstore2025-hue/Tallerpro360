/*
================================================
PANEL.JS - Panel Principal Avanzado
TallerPRO360 ERP - Versión Final Avanzada
================================================
*/

import { dashboard } from "./dashboard.js";
import { clientes } from "./clientes.js";
import { ordenes } from "./ordenes.js";
import { inventario } from "./inventario.js";
import { configuracion } from "./configuracion.js";
import { finanzas } from "./finanzas.js";
import { contabilidad } from "./contabilidad.js";
import { pagos } from "./pagos.js";
import { ia } from "./ia.js";
import { aiCommand } from "./aiComand.js";
import { aiAssistant } from "./aiAssistant.js";
import { aiAdvisor } from "./aiAdvisor.js";
import { ceo } from "./ceo.js";

export async function panel(container) {

  container.innerHTML = `
  <div style="display:flex;height:100vh;font-family:sans-serif;">
    <!-- Menú lateral -->
    <nav id="menuLateral" style="width:260px;background:#111827;color:white;padding:15px;display:flex;flex-direction:column;gap:10px;overflow-y:auto;">
      <h2 style="margin-bottom:20px;text-align:center;">TallerPRO360</h2>

      <!-- Secciones principales -->
      <button class="btnModulo" data-modulo="dashboard">Dashboard</button>
      <button class="btnModulo" data-modulo="ceo">Panel CEO</button>
      <button class="btnModulo" data-modulo="clientes">Clientes</button>
      <button class="btnModulo" data-modulo="ordenes">Órdenes</button>
      <button class="btnModulo" data-modulo="inventario">Inventario</button>
      <button class="btnModulo" data-modulo="finanzas">Finanzas</button>
      <button class="btnModulo" data-modulo="contabilidad">Contabilidad</button>
      <button class="btnModulo" data-modulo="pagos">Pagos / Suscripciones</button>
      <button class="btnModulo" data-modulo="ia">IA Mecánica</button>
      
      <!-- Sección IA avanzada -->
      <button class="btnModulo" data-modulo="aiAssistant">AI Assistant</button>
      <button class="btnModulo" data-modulo="aiCommand">AI Command Center</button>
      <button class="btnModulo" data-modulo="aiAdvisor">AI Service Advisor</button>

      <!-- Configuración general -->
      <button class="btnModulo" data-modulo="configuracion">Configuración</button>
    </nav>

    <!-- Contenedor principal -->
    <main id="contenedorPrincipal" style="flex:1;padding:20px;overflow-y:auto;background:#1e293b;color:white;transition:all 0.3s;">
      Cargando módulo...
    </main>
  </div>
  `;

  const contenedor = document.getElementById("contenedorPrincipal");

  // ===========================
  // Módulos disponibles
  // ===========================
  const modulos = {
    dashboard,
    ceo,
    clientes,
    ordenes,
    inventario,
    configuracion,
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
  async function cargarModulo(nombre) {
    contenedor.style.opacity = "0.5";
    contenedor.innerHTML = `<p>Cargando ${nombre}...</p>`;
    await new Promise(r => setTimeout(r, 150)); // efecto de transición
    const fnModulo = modulos[nombre];
    if(fnModulo){
      await fnModulo(contenedor);
      contenedor.style.opacity = "1";
    } else {
      contenedor.innerHTML = `<p style="color:red;">Módulo no encontrado: ${nombre}</p>`;
      contenedor.style.opacity = "1";
    }
  }

  // ===========================
  // Inicializar dashboard por defecto
  // ===========================
  cargarModulo("dashboard");

  // ===========================
  // Eventos botones menú
  // ===========================
  const botones = document.querySelectorAll(".btnModulo");
  botones.forEach(btn => {
    btn.style.padding = "10px";
    btn.style.border = "none";
    btn.style.borderRadius = "6px";
    btn.style.background = "#1f2937";
    btn.style.color = "white";
    btn.style.cursor = "pointer";
    btn.style.transition = "all 0.2s";

    btn.onmouseenter = ()=> btn.style.background = "#374151";
    btn.onmouseleave = ()=> btn.style.background = "#1f2937";

    btn.onclick = () => {
      cargarModulo(btn.dataset.modulo);
    };
  });

  // ===========================
  // Tecla rápida para abrir Dashboard
  // ===========================
  window.addEventListener("keydown", e => {
    if(e.altKey && e.key.toLowerCase() === "d"){
      cargarModulo("dashboard");
      hablar("Abriendo Dashboard");
    }
  });

}

// ===========================
// Función de síntesis de voz
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