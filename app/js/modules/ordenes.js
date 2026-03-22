/**
 * ordenes.js - TallerPRO360 NEXUS-X V5 🏁
 * Lógica: Recepción 360° -> Diagnóstico IA -> Cotización WhatsApp -> Ejecución
 */
import { saveOrder, updateOrderStatus } from "../services/ordenesService.js";
import { hablar } from "../voice/voiceCore.js";
import { store } from "../core/store.js";

export default async function ordenesModule(container, state) {
    let orderData = {
        fotos: [],
        items: [],
        etapa: 1,
        cliente: null,
        vehiculo: null
    };

    const render = () => {
        container.innerHTML = `
        <div class="p-4 bg-[#050a14] min-h-screen pb-32 text-white animate-fade-in">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-black italic tracking-tighter">ORDER <span class="text-cyan-400">CONTROL</span></h1>
                <div class="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[8px] font-black text-emerald-400 uppercase">
                    Licencia Activa 2026
                </div>
            </div>

            <div class="flex justify-between px-4 mb-8 relative">
                <div class="absolute top-4 left-10 right-10 h-[2px] bg-slate-800 -z-0"></div>
                ${[1, 2, 3, 4].map(n => `
                    <div class="z-10 flex flex-col items-center gap-1">
                        <div class="w-8 h-8 rounded-full ${orderData.etapa >= n ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-slate-900 border border-slate-700'} flex items-center justify-center text-[10px] font-black transition-all duration-500">
                            ${orderData.etapa > n ? '<i class="fas fa-check"></i>' : n}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div id="stepContainer" class="space-y-6">
                ${renderCurrentStep()}
            </div>

            <div class="fixed bottom-24 left-4 right-4 flex justify-between gap-3">
                <button id="btnPrev" class="w-14 h-14 bg-slate-900 rounded-3xl border border-slate-800 flex items-center justify-center ${orderData.etapa === 1 ? 'hidden' : ''}">
                    <i class="fas fa-arrow-left text-slate-500"></i>
                </button>
                <button id="btnMainAction" class="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2">
                    <span>${getActionLabel()}</span>
                    <i class="fas fa-chevron-right text-[8px]"></i>
                </button>
            </div>
        </div>
        `;
        attachEvents();
    };

    const renderCurrentStep = () => {
        switch(orderData.etapa) {
            case 1: // RECEPCIÓN 360° (Superior a Tuulaap)
                return `
                <div class="bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/5 animate-slide-up">
                    <h3 class="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-4">Inspección de Entrada</h3>
                    <div class="grid grid-cols-3 gap-3 mb-6">
                        ${['Frontal', 'Trasera', 'Izquierda', 'Derecha', 'Interior', 'Motor'].map(p => `
                            <div class="aspect-square bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-2 group hover:border-cyan-500 transition-all cursor-pointer">
                                <i class="fas fa-camera text-slate-600 group-hover:text-cyan-400"></i>
                                <span class="text-[7px] font-bold text-slate-500 uppercase">${p}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="space-y-2">
                        <p class="text-[9px] font-black text-slate-600 uppercase">Inventario Crítico</p>
                        <div class="grid grid-cols-2 gap-2">
                            ${['Radio', 'Gato', 'Herramienta', 'Repuesto'].map(i => `
                                <button class="p-3 bg-black/20 rounded-xl text-[10px] font-bold border border-white/5 text-left flex justify-between">
                                    ${i} <i class="fas fa-plus text-cyan-500"></i>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>`;
            
            case 2: // DIAGNÓSTICO IA (Dictado)
                return `
                <div class="bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/5 animate-slide-up">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Diagnóstico Técnico</h3>
                        <button id="btnVoice" class="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center animate-pulse">
                            <i class="fas fa-microphone text-xs"></i>
                        </button>
                    </div>
                    <textarea id="diagText" class="w-full bg-black/40 rounded-2xl p-4 text-sm h-40 border border-white/5 focus:border-cyan-500 outline-none" placeholder="Describe la falla..."></textarea>
                </div>`;

            case 3: // COTIZACIÓN (Venta Inteligente)
                return `
                <div class="bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/5 animate-slide-up">
                    <h3 class="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-4">Presupuesto Sugerido</h3>
                    <div class="space-y-3" id="quoteList">
                        <div class="flex justify-between items-center p-4 bg-black/40 rounded-2xl border-l-4 border-cyan-500">
                            <div>
                                <p class="text-[10px] font-black">MANO DE OBRA - DIAGNÓSTICO</p>
                                <p class="text-[8px] text-slate-500 italic">Análisis preventivo Nexus-X</p>
                            </div>
                            <span class="font-black text-xs text-cyan-400">$65.000</span>
                        </div>
                    </div>
                </div>`;
        }
    };

    const getActionLabel = () => {
        const labels = { 1: "Continuar a Diagnóstico", 2: "Generar Cotización", 3: "Enviar a WhatsApp", 4: "Finalizar Orden" };
        return labels[orderData.etapa];
    };

    const attachEvents = () => {
        document.getElementById("btnMainAction").onclick = async () => {
            if (orderData.etapa < 3) {
                orderData.etapa++;
                render();
            } else {
                await sincronizarOrden();
            }
        };

        if (document.getElementById("btnVoice")) {
            document.getElementById("btnVoice").onclick = () => {
                hablar("William, describe los hallazgos técnicos para procesar la cotización.");
                // Lógica de reconocimiento de voz integrada
            };
        }
    };

    const sincronizarOrden = async () => {
        // Lógica de guardado final y envío a WhatsApp
        hablar("Sincronizando orden con el servidor Nexus. Cotización enviada al cliente.");
    };

    render();
}
