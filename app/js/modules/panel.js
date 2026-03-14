/**
 * panel.js
 * Panel Estratégico TallerPRO360 - Versión Final Integrada
 */

import { dashboard } from "./modules/dashboard.js";
import { clientes } from "./modules/clientes.js";
import { ordenes } from "./modules/ordenes.js";
import { inventario } from "./modules/inventario.js";
import { finanzas } from "./modules/finanzas.js";
import { contabilidad } from "./modules/contabilidad.js";
import { pagosTaller } from "./modules/pagosTaller.js";
import { ceo } from "./modules/ceo.js";
import { aiAssistant } from "./modules/aiAssistant.js";
import { aiAdvisor } from "./modules/aiAdvisor.js";
import aiCommandCenter from "./ai/aiCommandCenter.js";
import { configuracion } from "./modules/configuracion.js";
import { loadAICore } from "./system/aiCoreLoader.js";

export async function panel(container) {
  container.innerHTML = `
    <div style="display:flex;height:100vh;">
      <nav id="menuLateral" style="width:280px;background:#111827;color:white;padding:20px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;">
        <h2 style="text-align:center;">TallerPRO360 BSC</h2>
        <button class="btnModulo" data-modulo="dashboard">Dashboard</button>
        <button class="btnModulo" data-modulo="clientes">Clientes</button>
        <button class="btnModulo" data-modulo="ordenes">Órdenes</button>
        <button class="btnModulo" data-modulo="inventario">Inventario</button>
        <button class="btnModulo" data-modulo="finanzas">Finanzas</button>
        <button class="btnModulo" data-modulo="contabilidad">Contabilidad</button>
        <button class="btnModulo" data-modulo="pagos">Pagos / Caja</button>
        <button class="btnModulo" data-modulo="ceo">CEO</button>
        <button class="btnModulo" data-modulo="aiAssistant">IA Assistant</button>
        <button class="btnModulo" data-modulo="aiCommand">AI Command Center</button>
        <button class="btnModulo" data-modulo="aiAdvisor">AI Advisor</button>
        <button class="btnModulo" data-modulo="configuracion">Configuración</button>
      </nav>
      <main id="contenedorPrincipal" style="flex:1;padding:25px;overflow-y:auto;background:#1e293b;color:white;">
        <h2>Cargando panel estratégico...</h2>
      </main>
    </div>
  `;

  // ===========================
  // Cargar IA Core
  // ===========================
  await loadAICore();

  const contenedor = document.getElementById("contenedorPrincipal");

  const modulos = {
    dashboard,
    clientes,
    ordenes,
    inventario,
    finanzas,
    contabilidad,
    pagos: pagosTaller,
    ceo,
    iaAssistant,
    aiAdvisor,
    aiCommand: async()=>aiCommandCenter,
    configuracion
  };

  // ===========================
  // Función para cargar módulo
  // ===========================
  async function cargarModulo(nombre){
    contenedor.style.opacity="0.5";
    contenedor.innerHTML=`<p>Cargando ${nombre}...</p>`;
    await new Promise(r=>setTimeout(r,150));
    const fnModulo = modulos[nombre];
    try{
      if(fnModulo){
        const resultado = typeof fnModulo==="function" ? await fnModulo(contenedor) : null;
        contenedor.style.opacity="1";
      } else{
        contenedor.innerHTML=`<p style="color:red;">⚠️ Módulo no encontrado: ${nombre}</p>`;
        contenedor.style.opacity="1";
      }
    } catch(e){
      console.error(`Error cargando módulo ${nombre}:`,e);
      contenedor.innerHTML=`<p style="color:red;">⚠️ Error cargando módulo: ${nombre}</p>`;
      contenedor.style.opacity="1";
    }
  }

  // ===========================
  // Configurar botones del menú
  // ===========================
  document.querySelectorAll(".btnModulo").forEach(btn=>{
    btn.style.padding="12px";
    btn.style.border="none";
    btn.style.borderRadius="6px";
    btn.style.background="#1f2937";
    btn.style.color="white";
    btn.style.cursor="pointer";
    btn.style.transition="all 0.2s";
    btn.onmouseenter=()=>btn.style.background="#374151";
    btn.onmouseleave=()=>btn.style.background="#1f2937";
    btn.onclick=()=>cargarModulo(btn.dataset.modulo);
  });

  // ===========================
  // Tecla rápida para Dashboard
  // ===========================
  window.addEventListener("keydown", e=>{
    if(e.altKey && e.key.toLowerCase()==="d"){
      cargarModulo("dashboard");
      hablar("Abriendo panel del taller");
    }
  });

  // ===========================
  // Cargar módulo inicial
  // ===========================
  cargarModulo("dashboard");

  // ===========================
  // Función de síntesis de voz
  // ===========================
  function hablar(texto){
    if(!texto) return;
    const speech = new SpeechSynthesisUtterance(texto);
    speech.lang = "es-ES";
    speech.rate=1;
    speech.pitch=1;
    speech.volume=1;
    window.speechSynthesis.speak(speech);
  }
}