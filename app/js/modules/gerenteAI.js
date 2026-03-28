/**
 * gerenteAI.js - TallerPRO360 NEXUS-X V6 👑
 * El Centro de Comando Estratégico
 */
import { NexusAI } from "../ai/NexusOrchestratorAI.js";
import { hablar } from "../voice/voiceCore.js";
import { NexusReports } from "./reportes.js"; // IMPORTAMOS EL GENERADOR

export default async function gerenteAI(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("nexus_empresaId");

    container.innerHTML = `
        <div class="p-6 bg-[#050a14] min-h-screen pb-32 text-white animate-in fade-in duration-700 font-sans">
            
            <div class="flex justify-between items-center mb-12">
                <div>
                    <h1 class="text-3xl font-black italic tracking-tighter leading-none text-white uppercase">
                        ESTRATEGIA <span class="text-cyan-400">NEXUS-X</span>
                    </h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2">Inteligencia Operacional V6</p>
                </div>
                <div class="flex gap-3">
                    <button id="btnDescargarReporte" class="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
                        <i class="fas fa-file-pdf text-lg"></i>
                    </button>
                    <button id="btnVozIA" class="w-14 h-14 bg-cyan-500 rounded-2xl flex items-center justify-center text-black shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-90 transition-all">
                       <i class="fas fa-satellite-dish text-xl animate-pulse"></i>
                    </button>
                </div>
            </div>

            <div id="panelIA" class="space-y-6">
                <div class="flex flex-col items-center py-32">
                    <div class="relative w-24 h-24">
                        <div class="absolute inset-0 border-[6px] border-cyan-500/10 rounded-full"></div>
                        <div class="absolute inset-0 border-[6px] border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                        <div class="absolute inset-4 border-[1px] border-white/10 rounded-full animate-pulse"></div>
                    </div>
                    <p class="mt-8 text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] text-center leading-relaxed">
                        Sincronizando con Satélite... <br>
                        <span class="text-cyan-500/50">Analizando KPIs Financieros</span>
                    </p>
                </div>
            </div>
        </div>
    `;

    try {
        const data = await NexusAI.analizarTodo(empresaId);
        renderAnalisis(data);
        
        // EVENTOS DE CONTROL
        document.getElementById("btnVozIA").onclick = () => {
          hablar(`Comandante William. El margen actual es del ${data.kpis.margen} por ciento. He detectado 5 oportunidades de crecimiento en la flota rural.`);
        };

        document.getElementById("btnDescargarReporte").onclick = () => {
            NexusReports.generarReporteGerencial(data.kpis);
        };

    } catch (e) {
        console.error("🚨 AI CORE ERROR:", e);
        document.getElementById("panelIA").innerHTML = `
            <div class="p-12 border-2 border-red-500/20 rounded-[3rem] bg-red-500/5 text-center">
                <i class="fas fa-radiation-alt text-red-500 text-4xl mb-6 animate-pulse"></i>
                <p class="text-[10px] font-black uppercase text-red-400 tracking-widest italic">Error de Vínculo Neural: Reinicie el Módulo</p>
            </div>
        `;
    }
}

// ... (renderAnalisis sigue igual, asegurando llamar a NexusAI.ejecutarGrowth)
