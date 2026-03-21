/**
 * gerenteAI.js - Edición Rey de TallerPRO360
 */
import { NexusAI } from "../ai/NexusOrchestratorAI.js";
import { hablar } from "../voice/voiceCore.js";

export default async function gerenteAI(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");

    container.innerHTML = `
        <div class="p-6 text-white min-h-screen bg-[#050a14]">
            <div class="flex justify-between items-center mb-8">
                <h2 class="text-2xl font-black text-cyan-400 italic underline decoration-white/20">👑 GERENTE ESTRATEGA</h2>
                <button id="btnVozIA" class="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center text-black shadow-lg shadow-cyan-500/20">
                   <i class="fas fa-volume-up"></i>
                </button>
            </div>

            <div id="panelIA" class="space-y-6">
                <div class="animate-pulse flex flex-col items-center py-20">
                    <div class="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <p class="mt-4 text-slate-500 font-bold uppercase tracking-tighter">Nexus-X analizando flujo de caja...</p>
                </div>
            </div>
        </div>
    `;

    try {
        const data = await NexusAI.analizarTodo(empresaId);
        renderAnalisis(data);
        
        document.getElementById("btnVozIA").onclick = () => {
          hablar(`Gerente, la utilidad actual es de ${data.kpis.utilidad} pesos. Tenemos ${data.kpis.stockCritico} productos en falta.`);
        };
    } catch (e) {
        console.error(e);
        document.getElementById("panelIA").innerHTML = "❌ Fallo en la matriz de inteligencia.";
    }
}

function renderAnalisis(data) {
    const { kpis, sugerencias } = data;
    const panel = document.getElementById("panelIA");

    panel.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <div class="bg-[#0f172a] p-4 rounded-3xl border border-slate-800">
                <p class="text-[9px] text-slate-500 font-bold uppercase">Utilidad Real</p>
                <h3 class="text-xl font-black text-emerald-400">$${new Intl.NumberFormat().format(kpis.utilidad)}</h3>
            </div>
            <div class="bg-[#0f172a] p-4 rounded-3xl border border-slate-800">
                <p class="text-[9px] text-slate-500 font-bold uppercase">Margen de Operación</p>
                <h3 class="text-xl font-black text-cyan-400">${kpis.margen}%</h3>
            </div>
        </div>

        <div class="bg-[#0f172a] p-6 rounded-3xl border border-cyan-500/20 shadow-xl">
            <h4 class="text-xs font-black text-cyan-500 mb-4 uppercase tracking-widest">🧠 Recomendaciones de Nexus-X</h4>
            <div class="space-y-4">
                ${sugerencias.map(s => `
                    <div class="flex items-start gap-3 border-l-2 border-cyan-500 pl-3">
                        <div>
                            <p class="text-sm font-bold text-white">${s.msg}</p>
                            <span class="text-[8px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full font-black">IMPACTO ${s.impact}</span>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
        
        <button id="btnActivarGrowth" class="w-full bg-white text-black p-4 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition">
            🚀 Ejecutar Motor de Crecimiento (Leads)
        </button>
    `;

    document.getElementById("btnActivarGrowth").onclick = async () => {
        const num = await NexusAI.ejecutarGrowth(localStorage.getItem("empresaId"));
        alert(`Nexus-X ha contactado a ${num} nuevos clientes potenciales.`);
    };
}
