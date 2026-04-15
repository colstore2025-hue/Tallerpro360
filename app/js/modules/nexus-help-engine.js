/**
 * NEXUS-HELP-ENGINE V1.0
 * Soporte Táctico In-App para TallerPRO360
 */

const helpData = {
    'config': {
        title: 'CONFIG ADN',
        porque: 'Establece tu firma digital y asegura que el sistema te reconozca como el dueño único de la data.',
        instrucciones: [
            'Vincula WhatsApp para automatizar reportes.',
            'Carga tu logo para validez legal en PDFs.'
        ]
    },
    'ordenes': {
        title: 'ÓRDENES PRO',
        porque: 'El botón de [FOTO] es tu seguro legal contra reclamos. Úsalo siempre al recibir el vehículo.',
        instrucciones: [
            'Usa la voz para dictar el daño sin tocar el teclado.',
            'Marca "Suministro Cliente" para no afectar tu utilidad.'
        ]
    },
    'inventario': {
        title: 'STOCK ELITE',
        porque: 'Evita fugas de dinero. Al registrar el costo de compra, Nexus calcula tu ganancia exacta.',
        instrucciones: [
            'Define stock mínimo para recibir alertas rojas.',
            'Registra entradas para valorizar tu bodega.'
        ]
    }
    // Agregar el resto de módulos aquí...
};

export function initNexusHelp(currentModuleId) {
    // 1. Crear el botón flotante (Cerebro AI)
    const helpBtn = document.createElement('div');
    helpBtn.innerHTML = `
        <div id="nexus-help-trigger" class="fixed bottom-6 right-6 w-14 h-14 bg-cyan-500 rounded-full flex items-center justify-center cursor-pointer z-[4000] shadow-[0_0_20px_rgba(0,242,255,0.4)] hover:scale-110 transition-all border-2 border-white/20">
            <i class="fas fa-brain text-black text-xl animate-pulse"></i>
        </div>
    `;
    document.body.appendChild(helpBtn);

    // 2. Evento Click para abrir el panel
    document.getElementById('nexus-help-trigger').onclick = () => {
        renderHelpPanel(currentModuleId);
    };
}

function renderHelpPanel(id) {
    const data = helpData[id] || { title: 'AYUDA NEXUS', porque: 'Selecciona una función para recibir asistencia.', instrucciones: [] };
    
    const panel = document.createElement('div');
    panel.id = 'nexus-help-panel';
    panel.className = 'fixed inset-0 bg-black/40 backdrop-blur-sm z-[5000] flex justify-end';
    
    panel.innerHTML = `
        <div class="w-full md:w-80 bg-[#0d1117] h-full border-l border-cyan-500/30 p-8 shadow-2xl animate-in slide-in-from-right duration-300">
            <div class="flex justify-between items-center mb-10">
                <span class="orbitron text-[9px] text-cyan-500 font-black italic tracking-widest">NEXUS ASSISTANT</span>
                <button onclick="document.getElementById('nexus-help-panel').remove()" class="text-slate-500 hover:text-white transition-all text-xl">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <h2 class="orbitron text-lg font-black text-white italic mb-2 uppercase tracking-tighter">
                MODULO: <span class="text-cyan-400">${data.title}</span>
            </h2>

            <div class="space-y-8 mt-10">
                <div>
                    <span class="orbitron text-[8px] text-amber-500 font-black uppercase italic tracking-widest block mb-2 underline">¿Por qué es vital?</span>
                    <p class="text-[11px] text-slate-300 italic leading-relaxed mono">${data.porque}</p>
                </div>

                <div>
                    <span class="orbitron text-[8px] text-cyan-400 font-black uppercase italic tracking-widest block mb-3 underline">Táctica de Operación</span>
                    <ul class="space-y-3">
                        ${data.instrucciones.map(ins => `
                            <li class="flex items-start gap-3">
                                <i class="fas fa-caret-right text-cyan-500 mt-1"></i>
                                <span class="text-[10px] text-slate-400 mono leading-snug">${ins}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>

            <div class="mt-20 p-6 rounded-3xl bg-cyan-500/5 border border-cyan-500/10 text-center">
                <p class="text-[9px] text-slate-500 italic mb-4 uppercase">¿Necesitas el manual completo?</p>
                <a href="manual-operacion.html" class="orbitron text-[10px] text-black bg-cyan-500 px-4 py-2 rounded-xl font-black block hover:shadow-[0_0_15px_#00f2ff] transition-all">
                    IR A UNIVERSIDAD NEXUS
                </a>
            </div>
        </div>
    `;

    document.body.appendChild(panel);
    
    // Cerrar al hacer clic fuera del panel
    panel.onclick = (e) => {
        if(e.target.id === 'nexus-help-panel') panel.remove();
    };
}
