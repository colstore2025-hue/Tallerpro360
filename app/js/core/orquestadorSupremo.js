/**
 * orquestadorSupremo.js
 * 🧠 Auto-reparación PRO360 + Desbloqueo Maestro
 */
import { ejecutarGuardianIA } from "../ai/firestoreGuardianAI.js";
import { activarModoDiosGuardian } from "../ai/firestoreGuardianGod.js";

export function activarOrquestadorSupremo(state) {
  // Aseguramos que siempre tengamos el ID correcto
  const empresaId = state?.empresaId || localStorage.getItem("empresaId") || "taller_001";

  console.log("😈 MODO DIOS: Orquestador activo para " + empresaId);

  // 1. DESBLOQUEO MAESTRO (La cereza del pastel)
  // Si el sistema se queda pegado en "Inicializando", este timer lo rescata
  setTimeout(() => {
    const loader = document.body.innerText.includes("Inicializando");
    if (loader) {
        console.warn("⚠️ Sistema bloqueado en Inicialización. Forzando entrada...");
        // Intentamos disparar el router manualmente si existe
        if (window.router && window.router.navegar) {
            window.router.navegar("dashboard");
        } else {
            // Si no hay router, forzamos un evento para que app-init despierte
            window.dispatchEvent(new CustomEvent("force-dashboard"));
        }
    }
  }, 4000); // 4 segundos de gracia para App Check

  // 2. Ejecución de Vigilancia IA
  ejecutarGuardianIA({ empresaId });
  activarModoDiosGuardian(empresaId);

  // 3. Vigilancia continua cada 30 segundos
  setInterval(() => {
    autoRepararEstructura();
  }, 30000);
}

function autoRepararEstructura() {
  const container = document.getElementById("appContainer") || document.getElementById("app-container");
  
  if (!container) {
    console.error("🔥 UI Críticamente dañada. Re-inyectando contenedor raíz...");
    const nuevoContainer = document.createElement("div");
    nuevoContainer.id = "app-container";
    document.body.appendChild(nuevoContainer);
  }
}

export default { activarOrquestadorSupremo };
