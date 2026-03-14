/**
 * panel.js
 * Panel principal avanzado ERP TallerPRO360
 * Integración de todos los módulos: Dashboard, Clientes, Órdenes, Inventario, Finanzas, Contabilidad, Pagos y IA
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

export async function panel(container) {

  container.innerHTML = `
  <div style="display:flex;height:100vh;font-family:sans-serif;">
    <!-- Menú lateral -->
    <nav id="menuLateral" style="width:240px;background:#111827;color:white;padding:15px;display:flex;flex-direction:column;gap:10px;overflow-y:auto;">
      <h2 style="margin-bottom:20px;text-align:center;">TallerPRO360</h2>

      <!-- Secciones principales -->
      <button class="btnModulo" data-modulo="dashboard">Dashboard</button>
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
    <main id="contenedorPrincipal" style="flex:1;padding:20px;overflow-y:auto;background:#1e293b;color:white;">
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
  // Función para cargar módulo
  // ===========================
  function cargarModulo(nombre) {
    contenedor.innerHTML = `<p>Cargando ${nombre}...</p>`;
    const fnModulo = modulos[nombre];
    if(fnModulo){
      fnModulo(contenedor);
    } else {
      contenedor.innerHTML = `<p style="color:red;">Módulo no encontrado: ${nombre}</p>`;
    }
  }

  // ===========================
  // Inicializar dashboard por defecto
  // ===========================
  cargarModulo("dashboard");

  // ===========================
  // Eventos botones
  // ===========================
  const botones = document.querySelectorAll(".btnModulo");
  botones.forEach(btn => {
    btn.style.padding = "10px";
    btn.style.border = "none";
    btn.style.borderRadius = "6px";
    btn.style.background = "#1f2937";
    btn.style.color = "white";
    btn.style.cursor = "pointer";

    btn.onclick = () => {
      cargarModulo(btn.dataset.modulo);
    };
  });

}