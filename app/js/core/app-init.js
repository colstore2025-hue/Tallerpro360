/**
 * app-init.js - TallerPRO360 ULTRA
 * 🔥 Versión de Desbloqueo Inmediato + Auditoría
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
  empresaId: localStorage.getItem("empresaId"),
  rolGlobal: localStorage.getItem("rolGlobal"),
  nombre: localStorage.getItem("nombre") || "Usuario"
};

const container = document.getElementById("appContainer");
const menuArea = document.getElementById("sidebar");

export async function initApp() {
  console.log("🎬 Motor: Iniciando secuencia de arranque...");
  
  return new Promise((resolve, reject) => {
    
    // 1. WATCHDOG: Si Firebase no responde en 3.5s, forzamos entrada con datos locales
    const safetyTimer = setTimeout(() => {
      if (state.uid) {
        console.warn("⏳ Firebase lento/bloqueado por App Check. Usando persistencia local.");
        ejecutarArranqueVisual();
        resolve(true);
      } else {
        console.error("❌ Sin sesión local. Abortando.");
        window.location.href = "login.html";
      }
    }, 3500);

    onAuthStateChanged(auth, (user) => {
      clearTimeout(safetyTimer);
      console.log("🔑 AuthState: Respuesta de Google recibida.");
      
      if (!user) {
        console.warn("🚫 Sin usuario activo. Redirigiendo a login.");
        window.location.href = "login.html";
        return;
      }

      // Actualizamos estado con datos frescos de Firebase
      state.uid = user.uid;
      state.empresaId = state.empresaId || localStorage.getItem("empresaId");

      if (state.empresaId || state.rolGlobal === 'superadmin') {
        ejecutarArranqueVisual();
        orquestador.activarOrquestadorSupremo(state);
        resolve(true);
      } else {
        console.error("❌ Fallo: Usuario validado pero sin Empresa vinculada.");
        reject(new Error("No se encontró empresaId vinculado al usuario."));
      }
    }, (error) => {
      clearTimeout(safetyTimer);
      console.error("🔥 Error en onAuthStateChanged:", error);
      reject(error);
    });
  });
}

// Función interna para limpiar interfaz y cargar el primer módulo
function ejecutarArranqueVisual() {
    console.log("🚀 Ejecutando arranque visual...");
    renderMenu();
    
    // Forzamos limpieza del loader antes de llamar al dashboard
    const bootLoader = document.getElementById("boot-loader");
    if (bootLoader) bootLoader.remove();
    
    loadModule("dashboard");
}

export async function loadModule(name) {
  if (!container) return;

  // Limpieza redundante del loader
  document.getElementById("boot-loader")?.remove();

  console.log(`📦 Cargando módulo: ${name}`);
  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:60vh; color:#00ffff; font-family:monospace;">
        <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-bottom:1rem;"></i>
        <p style="letter-spacing:2px; font-size:12px; text-transform:uppercase;">Cargando ${name}...</p>
    </div>`;

  const modules = { dashboard, ordenes, clientes, inventario, gerenteAI };

  try {
    const mod = modules[name];
    if (!mod) throw new Error(`El módulo [${name}] no está registrado en el sistema.`);
    
    await mod(container, state);
    actualizarEstadoMenu(name);
    console.log(`✅ Módulo ${name} desplegado.`);
  } catch (e) {
    console.error(`❌ Error Crítico en módulo ${name}:`, e);
    container.innerHTML = `
        <div style="background:rgba(255,0,0,0.1); border:1px solid #ff4444; padding:20px; border-radius:15px; color:#ff4444; margin-top:20px;">
            <p style="font-weight:bold;"><i class="fas fa-exclamation-triangle mr-2"></i> ERROR DE CARGA</p>
            <p style="font-size:13px; opacity:0.8; margin-top:5px;">${e.message}</p>
        </div>`;
  }
}

function renderMenu() {
  const menuDiv = document.getElementById("menuItems") || menuArea;
  if (!menuDiv) return;

  const items = [
    { id: "dashboard", n: "📊 Dashboard", icon: "fa-chart-line" },
    { id: "ordenes",   n: "🧾 Órdenes",   icon: "fa-file-invoice" },
    { id: "clientes",  n: "👥 Clientes",  icon: "fa-users" },
    { id: "inventario",n: "📦 Inventario",icon: "fa-boxes-stacked" },
    { id: "gerenteAI", n: "👑 Gerente AI",icon: "fa-brain" }
  ];

  menuDiv.innerHTML = `<p class="text-[10px] font-bold text-slate-500 mb-4 px-4 uppercase tracking-[3px]">Menú Principal</p>` + 
    items.map(i => `
    <button data-module="${i.id}" class="w-full text-left p-3 rounded-xl mb-1 text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all flex items-center gap-3 group">
      <i class="fas ${i.icon} w-5 group-hover:scale-110 transition-transform"></i>
      <span class="font-semibold text-sm">${i.n}</span>
    </button>
  `).join("");

  menuDiv.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => loadModule(btn.dataset.module);
  });
}

function actualizarEstadoMenu(name) {
  const btns = document.querySelectorAll("#menuItems button");
  btns.forEach(btn => {
    if (btn.dataset.module === name) {
      btn.classList.add('active');
      btn.style.color = "#00ffff";
      btn.style.background = "rgba(0, 255, 255, 0.1)";
    } else {
      btn.classList.remove('active');
      btn.style.color = "";
      btn.style.background = "";
    }
  });
}
