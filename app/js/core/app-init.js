/**
 * app-init.js - TallerPRO360 ULTRA
 * 🔥 Versión Estabilizada: Sin dependencias circulares y rutas corregidas.
 */
import dashboard from "../modules/dashboard.js";
import ordenes from "../modules/ordenes.js";
import clientes from "../modules/clientes.js";
import inventario from "../modules/inventario.js";
import gerenteAI from "../modules/gerenteAI.js"; 
import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import orquestador from "./orquestadorSupremo.js";

// --- ESTADO GLOBAL ---
const state = {
  uid: localStorage.getItem("uid"),
  empresaId: localStorage.getItem("empresaId"),
  rol: localStorage.getItem("rol"),
  rolGlobal: localStorage.getItem("rolGlobal"),
  nombre: localStorage.getItem("nombre") || "Usuario",
  planTipo: localStorage.getItem("planTipo") || "pro"
};

// --- SELECTORES (Alineados con index.html) ---
const container = document.getElementById("appContainer");
const menuArea = document.getElementById("menuItems"); // ✅ Corregido: ID exacto del sidebar

/**
 * MOTOR DE ARRANQUE (Llamado desde index.html)
 */
export async function initApp() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, user => {
      if (!user) {
        localStorage.clear();
        window.location.href = "login.html";
        return;
      }

      state.uid = user.uid;
      state.empresaId = state.empresaId || localStorage.getItem("empresaId");

      if (state.empresaId || state.rolGlobal === 'superadmin') {
        renderMenu();
        loadModule("dashboard");
        
        // Iniciar protección en segundo plano
        orquestador.activarOrquestadorSupremo(state);
        resolve(true);
      } else {
        console.error("❌ Error: empresaId no encontrado");
        container.innerHTML = `<div style="color:white; text-align:center;">Perfil incompleto. Contacte a soporte.</div>`;
        resolve(false);
      }
    });
  });
}

/**
 * CARGADOR DE MÓDULOS
 */
export async function loadModule(name) {
  if (!container) return;

  // Feedback visual de carga
  container.innerHTML = `
    <div style="text-align:center;margin-top:50px;">
      <div style="display:inline-block; width:30px; height:30px; border:3px solid #0ff2; border-top-color:#00ffff; border-radius:50%; animation: spin 1s linear infinite;"></div>
      <p style="color:#0ff; margin-top:15px; font-size:14px;">Abriendo ${name}...</p>
    </div>
  `;

  const modules = {
    dashboard, 
    ordenes, 
    clientes, 
    inventario,
    gerenteAI
  };

  try {
    const mod = modules[name];
    if (!mod) throw new Error(`Módulo [${name}] no existe en el registro.`);
    
    // Ejecutar el módulo
    await mod(container, state);

    // Actualizar estado visual del menú
    actualizarEstadoMenu(name);

  } catch (e) {
    console.error(`❌ Error Crítico en módulo ${name}:`, e);
    container.innerHTML = `
      <div style="background:rgba(255,0,0,0.1); border:1px solid red; padding:20px; border-radius:10px; color:#ff4444;">
        <h3 style="margin-top:0;">⚠️ Error al cargar componente</h3>
        <p>${e.message}</p>
        <button onclick="location.reload()" style="background:red; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">Reiniciar</button>
      </div>
    `;
  }
}

/**
 * RENDERIZADO DEL MENÚ (Sidebar)
 */
function renderMenu() {
  if (!menuArea) return;

  const items = [
    { id: "dashboard", n: "📊 Dashboard", icon: "fa-chart-pie" },
    { id: "ordenes",   n: "🧾 Órdenes",   icon: "fa-file-invoice" },
    { id: "clientes",  n: "👥 Clientes",  icon: "fa-users" },
    { id: "inventario",n: "📦 Inventario",icon: "fa-boxes-stacked" },
    { id: "gerenteAI", n: "👑 Gerente AI",icon: "fa-brain" }
  ];

  menuArea.innerHTML = items.map(i => `
    <button data-module="${i.id}" class="nav-btn">
      <i class="fas ${i.icon}" style="width:20px; margin-right:10px; opacity:0.7;"></i>
      ${i.n}
    </button>
  `).join("");

  menuArea.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => loadModule(btn.dataset.module);
  });
}

/**
 * Feedback visual de botón activo
 */
function actualizarEstadoMenu(name) {
  menuArea?.querySelectorAll("button").forEach(btn => {
    if (btn.dataset.module === name) {
      btn.classList.add("active");
      btn.style.background = "rgba(0, 255, 255, 0.1)";
      btn.style.color = "#00ffff";
    } else {
      btn.classList.remove("active");
      btn.style.background = "transparent";
      btn.style.color = "#94a3b8";
    }
  });
}

// Estilo de rotación para el loader
const style = document.createElement('style');
style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
