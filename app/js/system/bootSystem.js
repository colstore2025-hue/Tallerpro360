/**
 * bootSystem.js
 * Sistema de arranque principal
 */

import { bootStatus } from "./bootDiagnostic.js";

// 🚀 Importar dashboard PRO360
import dashboard from "../modules/dashboard.js";

export async function bootSystem() {
  bootStatus("Inicializando PRO360...");

  const container = document.getElementById("app") || document.body;
  const empresaId = localStorage.getItem("empresaId");
  const uid = localStorage.getItem("uid");

  if (!uid) {
    bootStatus("Usuario no autenticado. Redirigiendo...");
    setTimeout(() => { window.location.href = "/login.html"; }, 1000);
    return;
  }

  bootStatus("Cargando datos del sistema...");

  const state = {
    uid,
    empresaId,
    rolGlobal: localStorage.getItem("rolGlobal") || "user",
    plan: localStorage.getItem("plan") || "Freemium",
    planFechaInicio: new Date(localStorage.getItem("planFechaInicio") || Date.now()),
  };

  // Cargar dashboard
  bootStatus("Cargando módulo Dashboard...");
  try {
    await dashboard(container, state);
    bootStatus("✅ Dashboard cargado correctamente");
  } catch (e) {
    console.error("❌ Error cargando Dashboard:", e);
    bootStatus("❌ Error cargando Dashboard");
  }
}