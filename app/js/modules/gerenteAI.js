/**
 * gerenteAI.js - TallerPRO360 NEXUS-X V6 👑
 * El Centro de Comando Estratégico
 */
import { NexusAI } from "../ai/NexusOrchestratorAI.js";
import { hablar } from "../voice/voiceCore.js";

export default async function gerenteAI(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");

    container.innerHTML = `
        <div class="p-4 bg-[#050a14] min-h-screen pb-32 text-white animate-fade-in font-sans">
            
            <div class="flex justify-between items-center mb-10">
                <div>
                    <h1 class="text-2xl font-black italic tracking-tighter leading-none text-white uppercase">
                        ESTRATEGIA <span class="text-cyan-400">NEXUS-X</span>
                    </h1>
                    <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Inteligencia de Negocio Nivel Tesla</p>
                </div>
                <button id="btnVozIA" class="w-14 h-14 bg-cyan-500 rounded-[2rem] flex items-center justify-center text-black shadow-[0_10px_20px_rgba(6,182,212,0.3)] active:scale-90 transition-all">
                   <i class="fas fa-satellite-dish text-xl"></i>
                </button>
            </div>

            <div id="panelIA" class="space-y-6">
                <div class="flex flex-col items-center py-20">
                    <div class="relative w-20 h-20">
                        <div class="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
                        <div class="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p class="mt-6 text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] animate-pulse text-center">
                        Calculando Rentabilidad y <br>Oportunidades de Mercado...
                    </p>
                </div>
            </div>
        </div>
    `;

    try {
        // Simulamos o llamamos a la orquestación real
        const data = await NexusAI.analizarTodo(empresaId);
        renderAnalisis(data);
        
        document.getElementById("btnVozIA").onclick = () => {
          hablar(`Atención Gerente. Su margen es del ${data.kpis.margen} por ciento. Nexus recomienda activar el motor de crecimiento para captar nuevos clientes.`);
        };
    } catch (e) {
        console.error(e);
        document.getElementById("panelIA").innerHTML = `
            <div class="p-10 border border-red-500/20 rounded-[2.5rem] bg-red-500/5 text-center">
                <i class="fas fa-shield-virus text-red-500 text-3xl mb-4"></i>
                <p class="text-xs font-black uppercase text-red-400">Error en el núcleo de Inteligencia</p>
            </div>
        `;
    }
}

function renderAnalisis(data) {
    const { kpis, sugerencias } = data;
    const panel = document.getElementById("panelIA");

    panel.innerHTML = `
        <div class="grid grid-cols-2 gap-4 mb-2">
            <div class="bg-gradient-to-br from-[#0f172a] to-[#0a101f] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                <div class="absolute -right-2 -top-2 opacity-5 text-4xl text-emerald-400"><i class="fas fa-dollar-sign"></i></div>
                <p class="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Utilidad Neta</p>
                <h3 class="text-2xl font-black text-emerald-400 tracking-tighter">$${new Intl.NumberFormat("es-CO").format(kpis.utilidad)}</h3>
            </div>
            <div class="bg-gradient-to-br from-[#0f172a] to-[#0a101f] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                <div class="absolute -right-2 -top-2 opacity-5 text-4xl text-cyan-400"><i class="fas fa-chart-pie"></i></div>
                <p class="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Margen Real</p>
                <h3 class="text-2xl font-black text-cyan-400 tracking-tighter">${kpis.margen}%</h3>
            </div>
        </div>

        <div class="bg-[#0f172a] p-8 rounded-[3rem] border border-cyan-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
            <div class="flex items-center gap-3 mb-6">
                <div class="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
                <h4 class="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em]">Nexus-X Advisor Core</h4>
            </div>
            
            <div class="space-y-6">
                ${sugerencias.map(s => `
                    <div class="flex items-start gap-4 group">
                        <div class="mt-1 w-1 h-10 bg-gradient-to-b from-cyan-500 to-transparent rounded-full opacity-50"></div>
                        <div>
                            <p class="text-xs font-bold text-slate-200 leading-relaxed">${s.msg}</p>
                            <div class="flex gap-2 mt-2">
                                <span class="text-[7px] bg-cyan-500 text-black px-2 py-0.5 rounded-full font-black uppercase">Impacto ${s.impact}</span>
                                <span class="text-[7px] bg-white/5 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest italic">Prioridad Alta</span>
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
        
        <div class="pt-4">
            <button id="btnActivarGrowth" class="w-full bg-white text-black py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 transition-all flex items-center justify-center gap-3">
                <i class="fas fa-rocket text-cyan-600"></i>
                Ejecutar Motor de Crecimiento
            </button>
            <p class="text-[8px] text-slate-600 text-center mt-4 font-bold uppercase tracking-widest">Nexus-X identificará clientes inactivos y lanzará campañas de retención.</p>
        </div>
    `;

    document.getElementById("btnActivarGrowth").onclick = async () => {
        const btn = document.getElementById("btnActivarGrowth");
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-spinner animate-spin"></i> PROCESANDO LEADS...`;
        btn.disabled = true;

        try {
            const num = await NexusAI.ejecutarGrowth(localStorage.getItem("empresaId"));
            alert(`🚀 ÉXITO: Nexus-X ha procesado ${num} oportunidades de venta basadas en el historial.`);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    };
}
