/**
 * app-init.js - TallerPRO360 ULTRA
 * 🔥 Versión de Desbloqueo Inmediato + Auditoría de IDs
 */
import dashboard from "../modules/dashboard.js";
import ordenes from "../modules/ordenes.js";
import clientes from "../modules/clientes.js";
import inventario from "../modules/inventario.js";
import gerenteAI from "../modules/gerenteAI.js"; 
import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import orquestador from "./orquestadorSupremo.js";

const state = {
  uid: localStorage.getItem("uid"),
  empresaId: localStorage.getItem("empresaId") || "taller_001", // 🛡️ Hardcode de rescate
  rolGlobal: localStorage.getItem("rolGlobal"),
  nombre: localStorage.getItem("nombre") || "Usuario"
};

// Intentamos capturar AMBOS posibles IDs para no fallar
const container = document.getElementById("appContainer") || document.getElementById("app-container");
const menuArea = document.getElementById("sidebar") || document.getElementById("menu");

export async function initApp() {
  console.log("🎬 Motor: Iniciando secuencia de arranque...");
  
  // Limpieza preventiva: Si el loader está pegado, lo marcamos para morir
  const bootLoader = document.getElementById("boot-loader") || document.querySelector(".loader");

  return new Promise((resolve) => {
    
    // 1. WATCHDOG: El "Salto de Fe" (Si Firebase/AppCheck tarda, entramos igual)
    const safetyTimer = setTimeout(() => {
      console.warn("⏳ App Check/Firebase lento. Forzando entrada al panel...");
      ejecutarArranqueVisual();
      resolve(true);
    }, 3800);

    onAuthStateChanged(auth, (user) => {
      clearTimeout(safetyTimer);
      console.log("🔑 AuthState: Respuesta recibida.");
      
      if (user) {
        state.uid = user.uid;
        // Si no hay empresaId en Storage, le asignamos el taller_001 por defecto
        if (!localStorage.getItem("empresaId")) {
            localStorage.setItem("empresaId", "taller_001");
        }
        state.empresaId = "taller_001"; 

        ejecutarArranqueVisual();
        orquestador.activarOrquestadorSupremo(state);
        resolve(true);
      } else {
        console.warn("🚫 Sin sesión activa. Redirigiendo...");
        window.location.href = "login.html";
      }
    }, (error) => {
      console.error("🔥 Error Auth:", error);
      // Incluso con error, si tenemos el ID local, intentamos entrar
      if (state.empresaId) ejecutarArranqueVisual();
    });
  });
}

function ejecutarArranqueVisual() {
    console.log("🚀 Desplegando Interfaz...");
    
    // Eliminamos CUALQUIER loader que esté estorbando
    document.getElementById("boot-loader")?.remove();
    document.querySelector("[id*='loader']")?.remove(); 
    
    renderMenu();
    loadModule("dashboard");
}

export async function loadModule(name) {
  // Recapturamos el contenedor por si el DOM cambió
  const activeContainer = document.getElementById("appContainer") || document.getElementById("app-container");
  
  if (!activeContainer) {
    console.error("❌ ERROR CRÍTICO: No existe el contenedor 'appContainer' en el HTML.");
    return;
  }

  console.log(`📦 Cargando: ${name}`);
  activeContainer.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:60vh; color:#00ffff; font-family:sans-serif;">
        <div class="animate-spin" style="width:40px; height:40px; border:4px solid #00ffff44; border-top-color:#00ffff; border-radius:50%;"></div>
        <p style="margin-top:20px; font-size:10px; letter-spacing:4px; text-transform:uppercase; opacity:0.6;">Nexus-X Procesando...</p>
    </div>`;

  const modules = { dashboard, ordenes, clientes, inventario, gerenteAI };

  try {
    const mod = modules[name];
    if (!mod) throw new Error(`Módulo ${name} no registrado.`);
    
    await mod(activeContainer, state);
    actualizarEstadoMenu(name);
  } catch (e) {
    console.error(`🔥 Error en ${name}:`, e);
    activeContainer.innerHTML = `<div style="color:#ff4444; padding:40px; text-align:center;">Error: ${e.message}</div>`;
  }
}

function renderMenu() {
  const menuDiv = document.getElementById("menuItems") || document.getElementById("sidebar") || menuArea;
  if (!menuDiv) return;

  const items = [
    { id: "dashboard", n: "Dashboard", icon: "fa-chart-pie" },
    { id: "ordenes",   n: "Órdenes",   icon: "fa-file-signature" },
    { id: "clientes",  n: "Clientes",  icon: "fa-user-gear" },
    { id: "inventario",n: "Stock",     icon: "fa-box-open" },
    { id: "gerenteAI", n: "Nexus Coach",icon: "fa-brain" }
  ];

  menuDiv.innerHTML = items.map(i => `
    <button data-module="${i.id}" style="width:100%; text-align:left; padding:12px; margin-bottom:5px; background:transparent; border:none; color:#94a3b8; display:flex; items-center; gap:10px; cursor:pointer;">
      <i class="fas ${i.icon}" style="width:20px;"></i>
      <span style="font-size:14px; font-weight:600;">${i.n}</span>
    </button>
  `).join("");

  menuDiv.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => loadModule(btn.dataset.module);
  });
}

function actualizarEstadoMenu(name) {
  document.querySelectorAll("[data-module]").forEach(btn => {
    if (btn.dataset.module === name) {
        btn.style.color = "#00ffff";
        btn.style.background = "rgba(0, 255, 255, 0.05)";
    } else {
        btn.style.color = "#94a3b8";
        btn.style.background = "transparent";
    }
  });
}
