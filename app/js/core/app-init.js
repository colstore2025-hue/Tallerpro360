import dashboard from "../modules/dashboard.js";
import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export async function initApp() {
  const container = document.getElementById("appContainer");
  
  // Si en 2 segundos no hay respuesta de Firebase, forzamos el dashboard
  setTimeout(() => {
    if (document.getElementById("boot-loader")) {
        console.warn("Forzando Dashboard por Timeout");
        ejecutarArranqueVisual();
    }
  }, 2000);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      ejecutarArranqueVisual();
    } else {
      window.location.href = "login.html";
    }
  });
  return true;
}

function ejecutarArranqueVisual() {
    const loader = document.getElementById("boot-loader");
    if (loader) loader.remove();
    
    // Carga directa sin pasar por el orquestador complejo
    const container = document.getElementById("appContainer");
    dashboard(container, { empresaId: "taller_001", nombre: "William" });
}
