/**
 * app-init.js - TallerPRO360 ULTRA
 * 🔥 Versión de Desbloqueo Inmediato
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
const menuArea = document.getElementById("sidebar"); // Cambiado para asegurar que encuentre el contenedor del menú

export async function initApp() {
  return new Promise((resolve, reject) => {
    
    // Timer de seguridad: Si en 5 segundos Firebase no responde, forzamos lectura local
    const safetyTimer = setTimeout(() => {
      if (state.uid && state.empresaId) {
        console.warn("⏳ Firebase lento, arrancando con cache local...");
        renderMenu();
        loadModule("dashboard");
        resolve(true);
      }
    }, 5000);

    onAuthStateChanged(auth, (user) => {
      clearTimeout(safetyTimer); // Cancelar el timer si Firebase responde
      
      if (!user) {
        window.location.href = "login.html";
        return;
      }

      state.uid = user.uid;
      state.empresaId = state.empresaId || localStorage.getItem("empresaId");

      if (state.empresaId || state.rolGlobal === 'superadmin') {
        renderMenu();
        loadModule("dashboard");
        orquestador.activarOrquestadorSupremo(state);
        resolve(true); // 🔥 ESTO ELIMINA EL "INICIALIZANDO..."
      } else {
        reject(new Error("No se encontró empresaId vinculado al usuario."));
      }
    }, (error) => {
      clearTimeout(safetyTimer);
      reject(error);
    });
  });
}

export async function loadModule(name) {
  if (!container) return;
  
  // Limpiar el loader de inicialización si existe
  const bootLoader = document.getElementById("boot-loader");
  if (bootLoader) bootLoader.remove();

  const modules = { dashboard, ordenes, clientes, inventario, gerenteAI };

  try {
    const mod = modules[name];
    if (!mod) throw new Error(`Módulo ${name} no registrado`);
    await mod(container, state);
    actualizarEstadoMenu(name);
  } catch (e) {
    console.error("❌ Error cargando módulo:", e);
    container.innerHTML = `<div class="p-10 text-red-500">Error: ${e.message}</div>`;
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

  menuDiv.innerHTML = `<p class="text-xs font-bold text-slate-500 mb-4 px-4 uppercase tracking-widest">Menú Principal</p>` + 
    items.map(i => `
    <button data-module="${i.id}" class="w-full text-left p-3 rounded-xl mb-1 text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all flex items-center gap-3">
      <i class="fas ${i.icon} w-5"></i>
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
      btn.style.color = "#00ffff";
      btn.style.background = "rgba(0, 255, 255, 0.1)";
    } else {
      btn.style.color = "";
      btn.style.background = "";
    }
  });
}
