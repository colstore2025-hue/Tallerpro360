/**
 * ordenes.js - TallerPRO360 NEXUS-FLOW V4 🛠️
 * Gestión por Etapas: Recepción -> Cotización -> Ejecución
 */
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function ordenesModule(container, state) {
  const empresaId = state.empresaId;
  
  // Estado local del componente para manejar las etapas
  let etapaActual = 1; 

  const renderEtapa = (etapa) => {
    container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen pb-24 text-white animate-fade-in">
      
      <div class="flex justify-between items-center mb-8 px-4 relative">
        <div class="absolute top-4 left-10 right-10 h-[1px] bg-slate-800 -z-0"></div>
        ${[1, 2, 3, 4].map(num => `
          <div class="flex flex-col items-center gap-2 z-10">
            <div class="w-8 h-8 rounded-full ${etapa >= num ? 'bg-cyan-500 shadow-[0_0_15px_#06b6d4]' : 'bg-slate-900 border border-slate-700'} 
              flex items-center justify-center text-[10px] font-black transition-all">
              ${etapa > num ? '<i class="fas fa-check"></i>' : num}
            </div>
            <span class="text-[7px] font-black uppercase tracking-widest ${etapa >= num ? 'text-cyan-400' : 'text-slate-600'}">
              ${['Recepción', 'Diagnóstico', 'Cotización', 'Reparación'][num-1]}
            </span>
          </div>
        `).join('')}
      </div>

      <div id="stepContent" class="space-y-6">
        ${getEtapaHTML(etapa)}
      </div>

      <div class="fixed bottom-20 left-0 right-0 p-4 bg-black/40 backdrop-blur-xl border-t border-white/5 flex justify-between items-center">
        <button id="btnBack" class="text-slate-500 text-[10px] font-bold uppercase tracking-widest ${etapa === 1 ? 'opacity-0' : ''}">
          <i class="fas fa-arrow-left mr-2"></i> Volver
        </button>
        <button id="btnNext" class="bg-cyan-500 text-black px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-[0_5px_20px_rgba(6,182,212,0.3)]">
          ${etapa === 3 ? 'Enviar a WhatsApp' : (etapa === 4 ? 'Finalizar' : 'Siguiente Paso')}
        </button>
      </div>
    </div>
    `;
    setupEventListeners(etapa);
  };

  const getEtapaHTML = (etapa) => {
    switch(etapa) {
      case 1: // RECEPCIÓN E INVENTARIO
        return `
          <div class="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 animate-slide-up">
            <h3 class="text-sm font-black mb-4 italic text-cyan-400">1. INSPECCIÓN DE INGRESO</h3>
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="aspect-square bg-slate-800 rounded-3xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-2 group hover:border-cyan-500 transition-all">
                <i class="fas fa-camera text-2xl text-slate-600 group-hover:text-cyan-400"></i>
                <span class="text-[8px] font-black text-slate-500 uppercase">Foto Frontal</span>
              </div>
              <div class="aspect-square bg-slate-800 rounded-3xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-2 group hover:border-cyan-500 transition-all">
                <i class="fas fa-camera text-2xl text-slate-600 group-hover:text-cyan-400"></i>
                <span class="text-[8px] font-black text-slate-500 uppercase">Foto Trasera</span>
              </div>
            </div>
            <div class="space-y-3">
              <p class="text-[9px] font-black text-slate-500 uppercase tracking-widest">Checklist Rápido</p>
              <label class="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-white/5">
                <input type="checkbox" class="accent-cyan-500"> <span class="text-xs">Kit de Carretera</span>
              </label>
              <label class="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-white/5">
                <input type="checkbox" class="accent-cyan-500"> <span class="text-xs">Rueda de Repuesto</span>
              </label>
            </div>
          </div>
        `;
      case 2: // DIAGNÓSTICO
        return `
          <div class="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 animate-slide-up">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-sm font-black italic text-cyan-400 uppercase">2. Diagnóstico Técnico</h3>
              <button id="btnVoiceDiag" class="w-10 h-10 bg-red-500/20 text-red-500 rounded-full animate-pulse border border-red-500/30">
                <i class="fas fa-microphone"></i>
              </button>
            </div>
            <textarea id="txtDiagnostico" class="w-full bg-black/30 border border-white/5 p-4 rounded-2xl text-sm h-40 outline-none focus:border-cyan-500 transition-all" 
              placeholder="Dicta los hallazgos mecánicos..."></textarea>
          </div>
        `;
      case 3: // COTIZACIÓN
        return `
          <div class="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 animate-slide-up">
            <h3 class="text-sm font-black italic text-cyan-400 uppercase mb-4">3. Cotización de Servicios</h3>
            <div id="itemsCotizacion" class="space-y-3 mb-6">
              <div class="flex justify-between items-center p-3 bg-black/40 rounded-xl">
                <span class="text-xs font-bold">Cambio de Aceite 10W30</span>
                <span class="text-xs text-emerald-400 font-black">$185.000</span>
              </div>
            </div>
            <div class="border-t border-slate-800 pt-4 flex justify-between items-center">
              <span class="text-[10px] font-black uppercase text-slate-500">Total Estimado</span>
              <span class="text-xl font-black text-white">$185.000</span>
            </div>
          </div>
        `;
      default: return ``;
    }
  };

  const setupEventListeners = (etapa) => {
    document.getElementById("btnNext").onclick = () => {
      if(etapa < 4) {
        etapaActual++;
        renderEtapa(etapaActual);
      }
    };
    if(document.getElementById("btnBack")) {
        document.getElementById("btnBack").onclick = () => {
            if(etapaActual > 1) {
                etapaActual--;
                renderEtapa(etapaActual);
            }
        };
    }
    
    // Integración de voz en etapa 2
    if(etapa === 2) {
      document.getElementById("btnVoiceDiag").onclick = () => {
        hablar("Describa el daño técnico para generar la cotización.");
        // Lógica de reconocimiento aquí...
      };
    }
  };

  renderEtapa(etapaActual);
}
