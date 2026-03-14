/**
 * panel.js
 * Panel Estratégico TallerPRO360 - Versión Final Avanzada con control de planes
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
import aiCommandCenter from "./modules/aiCommandCenter.js";
import { loadAICore } from "./system/aiCoreLoader.js";
import { configuracion } from "./modules/configuracion.js";
import { getModulosDisponibles } from "./planManager.js";

export async function panel(container, userId){
  container.innerHTML = `
    <div style="display:flex;height:100vh;flex-direction:row;">
      <nav id="menuLateral" style="width:280px;background:#111827;color:white;padding:20px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;">
        <h2 style="text-align:center;margin-bottom:20px;">TallerPRO360 BSC</h2>
        <div id="menuModulos"></div>
        <button id="btnSalirPanel" style="margin-top:20px;background:#dc2626;border:none;padding:10px;border-radius:6px;color:white;cursor:pointer;">Salir</button>
      </nav>
      <main id="contenedorPrincipal" style="flex:1;padding:25px;overflow-y:auto;background:#1e293b;color:white;display:flex;align-items:center;justify-content:center;">
        <p>Cargando panel estratégico...</p>
      </main>
    </div>
  `;

  // Botón salir dentro del panel
  document.getElementById("btnSalirPanel").onclick = ()=>{
    localStorage.removeItem("uid");
    localStorage.removeItem("empresaId");
    window.location.href="./login.html";
  };

  // ===========================
  // Inicializar AI Core
  // ===========================
  await loadAICore();

  const contenedor = document.getElementById("contenedorPrincipal");
  const menuModulos = document.getElementById("menuModulos");

  // ===========================
  // Todos los módulos disponibles
  // ===========================
  const todosModulos = {
    dashboard,
    clientes,
    ordenes,
    inventario,
    finanzas,
    contabilidad,
    pagos: pagosTaller,
    ceo,
    iaAssistant: aiAssistant,
    aiAdvisor,
    aiCommand: async()=>aiCommandCenter,
    configuracion
  };

  // ===========================
  // Obtener módulos según plan
  // ===========================
  const modulosPermitidos = await getModulosDisponibles(userId);

  if(modulosPermitidos.length === 0){
    contenedor.innerHTML = `<p style="color:red;">No se encontraron módulos para tu plan. Contacta soporte.</p>`;
    return;
  }

  // ===========================
  // Pintar menú lateral dinámicamente
  // ===========================
  menuModulos.innerHTML = "";
  modulosPermitidos.forEach(mod=>{
    const btn = document.createElement("button");
    btn.className="btnModulo";
    btn.dataset.modulo = mod;
    btn.innerText = mod.charAt(0).toUpperCase() + mod.slice(1).replace(/([A-Z])/g," $1");
    menuModulos.appendChild(btn);
  });

  // ===========================
  // Función para cargar módulo
  // ===========================
  async function cargarModulo(nombre){
    contenedor.style.opacity="0.5";
    contenedor.innerHTML = `<p>Cargando ${nombre}...</p>`;
    await new Promise(r=>setTimeout(r,150)); // Simulación carga

    const fnModulo = todosModulos[nombre];
    try{
      if(fnModulo){
        // Limpia contenedor antes de cargar
        contenedor.innerHTML = "";
        const resultado = typeof fnModulo==="function" ? await fnModulo(contenedor) : null;
        contenedor.style.opacity="1";
      } else{
        contenedor.innerHTML = `<p style="color:red;">Módulo no encontrado: ${nombre}</p>`;
        contenedor.style.opacity="1";
      }
    } catch(e){
      console.error(`Error cargando módulo ${nombre}:`, e);
      contenedor.innerHTML = `<p style="color:red;">⚠️ Error cargando módulo: ${nombre}</p>`;
      contenedor.style.opacity="1";
    }
  }

  // ===========================
  // Eventos de botones del menú
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
  // Atajo ALT+D para dashboard
  // ===========================
  window.addEventListener("keydown", e=>{
    if(e.altKey && e.key.toLowerCase()==="d"){
      cargarModulo("dashboard"); hablar("Abriendo panel del taller");
    }
  });

  // ===========================
  // Cargar dashboard por defecto
  // ===========================
  await cargarModulo("dashboard");

  // ===========================
  // Función de voz opcional
  // ===========================
  function hablar(texto){
    if(!texto) return;
    const speech = new SpeechSynthesisUtterance(texto);
    speech.lang="es-ES";
    speech.rate=1; speech.pitch=1; speech.volume=1;
    window.speechSynthesis.speak(speech);
  }
}