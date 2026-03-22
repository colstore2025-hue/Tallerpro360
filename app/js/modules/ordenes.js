/**
 * ordenes_v4_pro.js - EL ELIMINADOR DE TUULAAP 🏁
 * Enfoque: Velocidad de dedo, Evidencia Visual e IA
 */

export default async function ordenesPro(container, state) {
    container.innerHTML = `
    <div class="p-4 space-y-6 animate-fade-in pb-32">
        <div class="flex justify-between items-center bg-slate-900/80 p-4 rounded-3xl border border-white/5">
            <div>
                <p class="text-[8px] font-black text-cyan-500 uppercase">Vehículo en Rampa</p>
                <h2 class="text-xl font-black italic tracking-tighter text-white">NUEVO <span class="text-cyan-400">SERVICIO</span></h2>
            </div>
            <div class="text-right">
                <p class="text-[10px] font-bold text-slate-500">22 MAR 2026</p>
                <span class="bg-emerald-500/20 text-emerald-400 text-[8px] px-2 py-0.5 rounded-full font-black uppercase">Sincronizado</span>
            </div>
        </div>

        <div class="grid grid-cols-1 gap-4">
            <div class="bg-gradient-to-br from-slate-900 to-black p-6 rounded-[2.5rem] border border-cyan-500/20 relative overflow-hidden">
                <h3 class="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4">Evidencia de Ingreso (360°)</h3>
                
                <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    ${['Frontal', 'Trasera', 'Lateral D', 'Lateral I', 'Tablero'].map(pos => `
                        <div class="min-w-[100px] h-24 bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center group active:border-cyan-500">
                            <i class="fas fa-camera text-slate-600 group-active:text-cyan-400"></i>
                            <span class="text-[7px] font-black text-slate-500 mt-2 uppercase">${pos}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="bg-[#0f172a] p-6 rounded-[2.5rem] border border-slate-800 relative">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Diagnóstico Técnico</h3>
                    <div class="flex gap-2">
                        <span class="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                        <span class="text-[8px] font-bold text-red-500 uppercase">Rec Escucha</span>
                    </div>
                </div>
                
                <div id="voiceWave" class="h-12 flex items-center justify-center gap-1 mb-4">
                    ${Array(15).fill('<div class="w-1 bg-cyan-500/30 rounded-full h-2"></div>').join('')}
                </div>

                <textarea id="inputDiagnostico" 
                    class="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm text-slate-300 outline-none focus:border-cyan-500/50 transition-all h-32"
                    placeholder="Dictando hallazgos..."></textarea>
            </div>
        </div>

        <div class="fixed bottom-6 left-6 right-6 z-50">
            <button id="btnSincronizar" class="w-full bg-gradient-to-r from-cyan-600 to-blue-700 p-5 rounded-3xl text-white font-black uppercase text-xs tracking-[0.2em] shadow-[0_20px_40px_rgba(6,182,212,0.4)] flex items-center justify-center gap-3 active:scale-95 transition-all">
                <i class="fas fa-satellite-dish animate-pulse"></i>
                Sincronizar con Nexus-X
            </button>
        </div>
    </div>
    `;

    // Lógica de "Ondas de Voz" reactivas
    const bars = container.querySelectorAll('#voiceWave div');
    setInterval(() => {
        bars.forEach(b => {
            const h = Math.floor(Math.random() * 24) + 4;
            b.style.height = `${h}px`;
            b.style.backgroundColor = h > 15 ? '#22d3ee' : '#1e293b';
        });
    }, 150);
}
