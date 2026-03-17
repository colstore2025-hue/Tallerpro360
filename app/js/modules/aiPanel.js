import { analizarNegocio, hablarResumen } from "../ai/aiManager.js";

export default async function (container, state) {

  container.innerHTML = `
    <h1>🧠 IA Gerente</h1>

    <button id="analizar">Analizar negocio</button>

    <div id="resultado"></div>
  `;

  const resultado = document.getElementById("resultado");

  document.getElementById("analizar").onclick = async () => {

    resultado.innerHTML = "Analizando...";

    const data = await analizarNegocio(state);

    if (!data) {
      resultado.innerHTML = "Error IA";
      return;
    }

    hablarResumen(data);

    resultado.innerHTML = `
      <h3>📊 Resumen</h3>
      <p>Ingresos: $${data.resumen.ingresos}</p>
      <p>Utilidad: $${data.resumen.utilidad}</p>
      <p>Margen: ${data.resumen.margen}%</p>

      <h3>🚨 Alertas</h3>
      ${data.alertas.map(a => `<div>${a}</div>`).join("")}

      <h3>🚀 Recomendaciones</h3>
      ${data.recomendaciones.map(r => `<div>${r}</div>`).join("")}
    `;
  };
}