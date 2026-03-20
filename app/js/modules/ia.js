/**
 * ia.js
 * IA Mecánica PRO360 · Producción estable (Modo SaaS limpio 🚀)
 */

import { diagnosticarProblema } from "../ai/iaMecanica.js";
import { hablar } from "../voice/voiceCore.js";

/* ================= EXPORT ================= */

export default async function iaModule(container, state) {

  /* ===== VALIDACIÓN ===== */
  if (!state?.empresaId) {
    container.innerHTML = `
      <h2 style="color:red;text-align:center;">
        ❌ Empresa no definida
      </h2>
    `;
    return;
  }

  container.innerHTML = `
    <h1 style="color:#00ffff;font-size:34px;font-weight:900;">
      🤖 IA Mecánica PRO360
    </h1>

    <input
      id="inputProblema"
      placeholder="Ej: ruido en motor Toyota Hilux"
      style="width:100%;padding:12px;margin:15px 0;border-radius:8px;"
    />

    <div style="display:flex;gap:10px;margin-bottom:15px;">
      <button id="btnDictar"
        style="flex:1;background:#9333ea;color:#fff;padding:10px;border-radius:8px;">
        🎙 Dictar
      </button>

      <button id="btnDiagnosticar"
        style="flex:1;background:#2563eb;color:#fff;padding:10px;border-radius:8px;">
        🔍 Diagnosticar
      </button>
    </div>

    <div id="resultadoIA"
      style="margin-top:20px;background:#111827;color:#fff;padding:15px;border-radius:12px;">
      Esperando diagnóstico...
    </div>
  `;

  const inputProblema = document.getElementById("inputProblema");
  const resultadoIA = document.getElementById("resultadoIA");

  /* ================= DIAGNOSTICAR ================= */

  document.getElementById("btnDiagnosticar").onclick = async () => {

    const texto = inputProblema.value.trim();

    if (!texto) {
      hablar("Por favor ingresa el problema mecánico");
      return;
    }

    resultadoIA.innerText = "⏳ Analizando...";
    hablar("Analizando el problema");

    try {

      const respuesta = await diagnosticarProblema(texto);

      resultadoIA.innerText = respuesta || "Sin diagnóstico disponible";
      hablar("Diagnóstico completado");

    } catch (e) {

      console.error("🔥 ERROR IA:", e);

      resultadoIA.innerText = "❌ Error al diagnosticar";
      hablar("Ocurrió un error en el diagnóstico");
    }
  };

  /* ================= VOZ ================= */

  document.getElementById("btnDictar").onclick = () => {

    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) {
      hablar("Tu dispositivo no soporta dictado por voz");
      return;
    }

    const rec = new Recognition();

    rec.lang = "es-ES";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => {
      hablar("Puedes hablar ahora");
    };

    rec.onresult = (e) => {

      const texto = e.results[0][0].transcript.trim();

      inputProblema.value += texto + " ";
      hablar("Texto capturado");
    };

    rec.onerror = () => {
      hablar("Error en el dictado");
    };

    rec.start();
  };
}