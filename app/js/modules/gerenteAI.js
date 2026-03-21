/**
 * gerenteAI.js
 * 👑 El cerebro estratega de TallerPRO360
 */
import { AI_Engine } from "../ai/aiAutonomousFlow.js";

export default async function gerenteAI(container, state) {
    container.innerHTML = `
        <div style="padding:20px; color:#fff;">
            <h2 style="color:#0ff; text-shadow: 0 0 10px #0ff;">👑 Gerente Inteligente</h2>
            <div id="aiAnalysisResults" style="margin-top:20px; background:#1e293b; padding:20px; border-radius:15px; border:1px solid #00ffff44;">
                <p>🤖 Analizando datos del taller en tiempo real...</p>
            </div>
        </div>
    `;

    try {
        const analisis = await AI_Engine.analizarNegocio(state.empresaId);
        renderAnalisis(analisis);
    } catch (e) {
        document.getElementById("aiAnalysisResults").innerHTML = "<p>⚠️ Error al procesar datos de inteligencia.</p>";
    }
}

function renderAnalisis(data) {
    const res = document.getElementById("aiAnalysisResults");
    if (!data) return;
    
    res.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
            <div style="border-left:4px solid #22c55e; padding-left:15px;">
                <h4 style="color:#22c55e;">ESTADO FINANCIERO</h4>
                <p>Utilidad: ${data.resumen.utilidad}</p>
                <p>Margen: ${data.resumen.margen}%</p>
            </div>
            <div style="border-left:4px solid #facc15; padding-left:15px;">
                <h4 style="color:#facc15;">ALERTAS</h4>
                ${data.alertas.map(a => `<p style="font-size:12px;">• ${a}</p>`).join("")}
            </div>
        </div>
        <div style="margin-top:20px; padding:15px; background:#0f172a; border-radius:10px;">
            <h4 style="color:#00ffff;">ACCIONES RECOMENDADAS</h4>
            ${data.sugerencias.map(s => `<p style="color:#fff;">✅ ${s.msg} (Impacto: ${s.impact})</p>`).join("")}
        </div>
    `;
}
