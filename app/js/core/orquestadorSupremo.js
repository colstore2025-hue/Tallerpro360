 /**
 * orquestadorSupremo.js
 * 🧠 Auto-reparación PRO360
 */
import { ejecutarGuardianIA } from "../ai/firestoreGuardianAI.js";
import { activarModoDiosGuardian } from "../ai/firestoreGuardianGod.js";

export function activarOrquestadorSupremo(state) {
  if (!state.empresaId) return;

  console.log("😈 MODO DIOS: Orquestador activo para " + state.empresaId);

  // Ejecución inmediata
  ejecutarGuardianIA({ empresaId: state.empresaId });
  activarModoDiosGuardian(state.empresaId);

  // Vigilancia continua cada 30 segundos (no saturemos el sistema)
  setInterval(() => {
    autoRepararEstructura();
  }, 30000);
}

function autoRepararEstructura() {
  const container = document.getElementById("appContainer");
  const menu = document.getElementById("menu");

  if (!container || !menu) {
    console.warn("⚠️ UI dañada. Intentando refrescar...");
    // En lugar de innerHTML, lanzamos un reload suave si la UI colapsa
    if (!document.body.innerText.includes("DASHBOARD")) {
        // location.reload(); 
    }
  }
}

export default { activarOrquestadorSupremo };
