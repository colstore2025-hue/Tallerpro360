/**
 * 🚀 TallerPRO360 - NÚCLEO ÚNICO (SaaS Optimized)
 * Eficacia, Economía de Datos y Calidad Estructural.
 */
import { db } from "./firebase-config.js"; 

const VERSION = "v10.2";

const routes = {
  dashboard:     () => import(`../modules/dashboard.js?v=${VERSION}`),
  ordenes:       () => import(`../modules/ordenes.js?v=${VERSION}`),
  contabilidad:  () => import(`../modules/contabilidad.js?v=${VERSION}`),
  configuracion: () => import(`../modules/config.js?v=${VERSION}`)
};

export async function navigate(moduleName) {
  const container = document.getElementById("appContainer");
  if (!container) return;

  // 1. Limpieza visual inmediata (Percepción de velocidad)
  container.innerHTML = `<div class="loader-neon">Sincronizando...</div>`;

  // 2. Validación de Sesión (Seguridad Básica)
  const state = {
    uid: localStorage.getItem("uid"),
    empresaId: localStorage.getItem("empresaId"),
    rol: localStorage.getItem("rol")
  };

  if (!state.uid || !state.empresaId) {
    window.location.href = "/login.html";
    return;
  }

  try {
    // 3. Carga bajo demanda (Economía de Firebase)
    if (!routes[moduleName]) throw new Error("Módulo no definido");
    
    const module = await routes[moduleName]();
    
    // Limpiamos rastro del loader y ejecutamos
    container.innerHTML = "";
    await module.default(container, state);

    // 4. Gestión de UI: Quitar cohete inicial solo la primera vez
    document.getElementById("boot-loader")?.remove();
    
  } catch (error) {
    console.error(`Error en ${moduleName}:`, error);
    container.innerHTML = `<div class="error-msg">⚠️ Error al cargar ${moduleName}. <button onclick="location.reload()">Reintentar</button></div>`;
  }
}

// Inicialización global
window.onhashchange = () => navigate(window.location.hash.replace("#", "") || "dashboard");
window.onload = () => navigate(window.location.hash.replace("#", "") || "dashboard");
