/**
 * app-init.js
 * Inicializador del ERP TallerPRO360
 * Carga segura de Firebase, Plan Manager y Panel
 */

import { panel } from "../panel.js";
import { db } from "./firebase-config.js";
import { getModulosDisponibles } from "../planManager.js";

/**
 * Función principal para iniciar la app
 */
export async function iniciarApp() {
  console.log("⚡ Iniciando TallerPRO360 ERP...");

  const userId = localStorage.getItem("uid");
  const appContainer = document.getElementById("appContent");

  // ===========================
  // Validar sesión
  // ===========================
  if (!userId) {
    console.warn("Usuario no autenticado. Redirigiendo a login...");
    window.location.href = "./login.html";
    return;
  }

  // ===========================
  // Verificar plan del usuario
  // ===========================
  try {
    const modulos = await getModulosDisponibles(userId);

    if (!modulos || modulos.length === 0) {
      appContainer.innerHTML = `<div class="card" style="text-align:center;">
        <h2>Tu plan no tiene módulos habilitados</h2>
        <p>Contacta soporte para asistencia.</p>
        <button onclick="window.location.href='./login.html'" style="margin-top:10px;padding:10px;background:#dc2626;color:white;border:none;border-radius:6px;cursor:pointer;">Salir</button>
      </div>`;
      return;
    }

    // ===========================
    // Limpiar contenido y cargar panel
    // ===========================
    appContainer.innerHTML = ""; 
    await panel(appContainer, userId);

  } catch (e) {
    console.error("Error iniciando la app:", e);
    appContainer.innerHTML = `<div class="card" style="text-align:center;">
      <h2>⚠️ Error al cargar la aplicación</h2>
      <p>${e.message}</p>
      <button onclick="window.location.reload()" style="margin-top:10px;padding:10px;background:#dc2626;color:white;border:none;border-radius:6px;cursor:pointer;">Reintentar</button>
    </div>`;
  }
}