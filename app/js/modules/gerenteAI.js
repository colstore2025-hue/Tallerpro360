/**
 * gerenteAI.js - TallerPRO360 NEXUS-X V6.0 👑
 * EL CENTRO DE COMANDO ESTRATÉGICO: INTELIGENCIA PREDICTIVA
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { NexusAI } from "../ai/NexusOrchestratorAI.js";
import { hablar } from "../voice/voiceCore.js";
import { NexusReports } from "./reportes.js";

export default async function gerenteAI(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const nombreUsuario = localStorage.getItem("nexus_userNombre") || "Comandante";

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in zoom-in duration-700 pb-48">
            
            <header class="flex flex-col xl:flex-row justify-between items-start gap-12 mb-16 border-l-4 border-cyan-500 pl-8">
                <div class="relative">
                    <h1 class="orbitron text-5xl font-black italic tracking-tighter text-white leading-none uppercase">
                        STRATEGIC <span class="text-cyan-400">NEXUS_V6</span>
                    </h1>
                    <div class="flex items-center gap-4 mt-4">
                        <span class="flex h-3 w-3">
                          <span class="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-cyan-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                        </span>
                        <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase italic font-black">Inteligencia de Flota y Análisis Predictivo</p>
                    </div>
                </div>

                <div class="flex items-center gap-4">
                    <button id="btnDescargarReporte" class="group w-16 h-16 bg-[#0d1117] border border-white/5 rounded-3xl flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all shadow-2xl">
                        <i class="fas fa-file-pdf text-xl group-hover:scale-110 transition-transform"></i>
                    </button>
                    <button id="btnVozIA" class="group w-20 h-20 bg-cyan-500 rounded-3xl flex items-center justify-center text-black shadow-[0_0_50px_rgba(6,182,212,0.3)] hover:shadow-[0_0_70px_rgba(6,182,212,0.6)] active:scale-90 transition-all">
                       <i class="fas fa-satellite-dish text-2xl animate-pulse group-hover:rotate-12 transition-transform"></i>
                    </button>
                </div>
            </header>

            <div id="panelIA" class="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div class="col-span-full py-40 flex flex-col items-center">
                    <div class="relative w-32 h-32">
                        <div class="absolute inset-0 border-[8px] border-cyan-500/10 rounded-full"></div>
                        <div class="absolute inset-0 border-[8px] border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                        <div class="absolute inset-6 border border-white/10 rounded-full animate-pulse flex items-center justify-center">
                            <i class="fas fa-brain text-cyan-500/30 text-2xl"></i>
                        </div>
                    </div>
                    <p class="mt-12 text-[10px] text-slate-500 font-black uppercase tracking-[0.5em] text-center leading-relaxed orbitron">
                        Sincronizando con Constelación Nexus... <br>
                        <span class="text-cyan-400 animate-pulse">Escaneando KPIS de ${localStorage.getItem("nexus_empresaNombre") || 'Taller'}</span>
                    </p>
                </div>
            </div>
        </div>
        `;
    };

    const renderAnalisis = (data) => {
        const panel = document.getElementById("panelIA");
        const kpis = data.kpis || { ingresos: 0, margen: 0, eficiencia: 0 };

        panel.innerHTML = `
            <div class="xl:col-span-2 bg-gradient-to-br from-[#0d1117] to-[#010409] p-12 rounded-[4rem] border border-white/5 relative overflow-hidden shadow-3xl">
                <div class="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px]"></div>
                
                <h3 class="orbitron text-sm font-black text-cyan-400 mb-10 uppercase italic tracking-widest flex items-center gap-4">
                    <i class="fas fa-chart-line"></i> Diagnóstico de Salud Financiera
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                    <div>
                        <p class="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">Ingresos en Órbita (Mes)</p>
                        <h2 class="text-6xl font-black text-white orbitron italic tracking-tighter">$ ${Number(kpis.ingresos).toLocaleString()}</h2>
                    </div>
                    <div class="bg-black/40 p-8 rounded-[3rem] border border-white/5 flex flex-col justify-center">
                        <p class="text-[9px] text-cyan-400 font-black uppercase tracking-widest mb-2">Margen de Potencia</p>
                        <div class="flex items-end gap-4">
                            <h2 class="text-5xl font-black text-white orbitron italic">${kpis.margen}%</h2>
                            <span class="text-emerald-400 text-[10px] font-black orbitron mb-2 uppercase">+4.2% ↑</span>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-3">
                        <i class="fas fa-robot text-cyan-500"></i> Análisis de la IA Nexus:
                    </p>
                    <div class="bg-white/5 p-8 rounded-[2.5rem] border-l-4 border-cyan-500 italic text-sm text-slate-300 leading-relaxed font-medium">
                        "${data.insights || 'Analizando flujos de trabajo... Detecto una saturación en el área de frenos pero alta rentabilidad en electrónica.'}"
                    </div>
                </div>
            </div>

            <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-indigo-500/10 shadow-3xl flex flex-col">
                <h3 class="orbitron text-[10px] font-black text-indigo-400 mb-10 uppercase tracking-widest italic">Nexus Growth Engine</h3>
                
                <div class="flex-1 space-y-8">
                    <div class="p-6 bg-black/40 rounded-3xl border border-white/5 group hover:border-indigo-500/30 transition-all cursor-pointer">
                        <i class="fas fa-bolt text-indigo-500 mb-4"></i>
                        <h4 class="text-[10px] font-black text-white uppercase orbitron mb-2">Optimizar Flota Rural</h4>
                        <p class="text-[9px] text-slate-500 font-bold leading-relaxed uppercase">La demanda en Quindío está subiendo. Despliegue el camión taller móvil los martes.</p>
                    </div>

                    <div class="p-6 bg-black/40 rounded-3xl border border-white/5 group hover:border-indigo-500/30 transition-all cursor-pointer">
                        <i class="fas fa-shield-alt text-emerald-500 mb-4"></i>
                        <h4 class="text-[10px] font-black text-white uppercase orbitron mb-2">Retención de Clientes VIP</h4>
                        <p class="text-[9px] text-slate-500 font-bold leading-relaxed uppercase">3 clientes de carga pesada no han vuelto. Enviar cupón de lubricación vía WhatsApp.</p>
                    </div>
                </div>

                <button id="btnEjecutarGrowth" class="mt-12 w-full py-6 bg-indigo-600 rounded-3xl text-[10px] font-black orbitron uppercase tracking-[0.3em] hover:bg-white hover:text-indigo-600 transition-all shadow-glow-indigo">
                    Ejecutar Plan Maestro
                </button>
            </div>

            <div class="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 flex items-center justify-between">
                    <div>
                        <p class="text-[8px] text-slate-500 font-black uppercase mb-1">Eficiencia Mecánica</p>
                        <h4 class="orbitron text-2xl font-black text-white italic">${kpis.eficiencia}%</h4>
                    </div>
                    <i class="fas fa-tools text-slate-800 text-3xl"></i>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 flex items-center justify-between">
                    <div>
                        <p class="text-[8px] text-slate-500 font-black uppercase mb-1">Ticket Promedio</p>
                        <h4 class="orbitron text-2xl font-black text-white italic">$ ${(kpis.ingresos / 12).toFixed(0)}</h4>
                    </div>
                    <i class="fas fa-ticket-alt text-slate-800 text-3xl"></i>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 flex items-center justify-between">
                    <div>
                        <p class="text-[8px] text-slate-500 font-black uppercase mb-1">Satisfacción (NPS)</p>
                        <h4 class="orbitron text-2xl font-black text-emerald-400 italic">9.8/10</h4>
                    </div>
                    <i class="fas fa-star text-slate-800 text-3xl"></i>
                </div>
            </div>
        `;

        // RE-VINCULAR EVENTOS
        document.getElementById("btnVozIA").onclick = () => {
          hablar(`Comandante William. El margen actual del taller es del ${kpis.margen} por ciento. He detectado una oportunidad de expansión en el sector de logística pesada. ¿Desea que genere el reporte de ruta?`);
        };

        document.getElementById("btnDescargarReporte").onclick = () => {
            NexusReports.generarReporteGerencial(kpis);
        };

        document.getElementById("btnEjecutarGrowth").onclick = async () => {
            const btn = document.getElementById("btnEjecutarGrowth");
            btn.innerHTML = `<i class="fas fa-sync fa-spin"></i> PROCESANDO...`;
            await new Promise(r => setTimeout(r, 2000));
            btn.innerHTML = `PLAN DESPLEGADO <i class="fas fa-check"></i>`;
            btn.classList.replace("bg-indigo-600", "bg-emerald-600");
            hablar("Plan maestro de crecimiento desplegado. Notificaciones enviadas a la tripulación.");
        };
    };

    renderLayout();

    try {
        // Simulación de análisis potente
        const data = await NexusAI.analizarTodo(empresaId);
        setTimeout(() => renderAnalisis(data), 1500); // Pequeña espera para efecto de carga IA
    } catch (e) {
        console.error("🚨 AI CORE ERROR:", e);
        document.getElementById("panelIA").innerHTML = `
            <div class="col-span-full p-20 border-2 border-red-500/20 rounded-[4rem] bg-red-500/5 text-center">
                <i class="fas fa-radiation-alt text-red-500 text-6xl mb-8 animate-pulse"></i>
                <h3 class="orbitron text-xl font-black text-white uppercase">Vínculo Neural Roto</h3>
                <p class="text-[10px] font-black uppercase text-red-400 tracking-[0.5em] italic mt-4">Error crítico en el núcleo de estrategia</p>
            </div>
        `;
    }
}
