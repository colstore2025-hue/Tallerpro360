/**
 * NEXUS-HELP-ENGINE V1.1 - UNIVERSAL
 */
window.NexusHelp = {
    helpData: {
        'config': {
            title: 'CONFIG ADN',
            porque: 'Establece tu firma digital y asegura la propiedad de tu data.',
            instrucciones: ['Vincula WhatsApp Business.', 'Carga tu logo para PDFs legales.']
        },
        'ordenes': {
            title: 'ÓRDENES PRO',
            porque: 'El botón de [FOTO] es tu seguro legal contra reclamos injustos.',
            instrucciones: ['Usa la voz para el diagnóstico.', 'Marca "Suministro Cliente" si el repuesto es externo.']
        },
        'inventario': {
            title: 'STOCK ELITE',
            porque: 'Controla el costo de compra para garantizar tu margen de ganancia real.',
            instrucciones: ['Configura alertas rojas de stock.', 'Registra entradas de proveedores.']
        }
        // Agrega aquí los demás módulos (contabilidad, finanzas, gerente)
    },

    init: function(moduleId) {
        // Eliminar si ya existe uno previo para evitar duplicados
        if(document.getElementById('nexus-help-trigger')) return;

        const helpBtn = document.createElement('div');
        helpBtn.innerHTML = `
            <div id="nexus-help-trigger" class="fixed bottom-6 right-6 w-14 h-14 bg-cyan-500 rounded-full flex items-center justify-center cursor-pointer z-[4000] shadow-[0_0_20px_#00f2ff66] hover:scale-110 transition-all border-2 border-white/20">
                <i class="fas fa-brain text-black text-xl animate-pulse"></i>
            </div>
        `;
        document.body.appendChild(helpBtn);

        document.getElementById('nexus-help-trigger').onclick = () => this.render(moduleId);
    },

    render: function(id) {
        const data = this.helpData[id] || { title: 'AYUDA NEXUS', porque: 'Asistente de operación activo.', instrucciones: [] };
        const panel = document.createElement('div');
        panel.id = 'nexus-help-panel';
        panel.className = 'fixed inset-0 bg-black/60 backdrop-blur-md z-[5000] flex justify-end';
        panel.innerHTML = `
            <div class="w-full md:w-80 bg-[#0d1117] h-full border-l border-cyan-500/30 p-8 animate-in slide-in-from-right">
                <div class="flex justify-between items-center mb-10">
                    <span class="orbitron text-[9px] text-cyan-500 font-black italic underline">NEXUS ASSISTANT</span>
                    <button onclick="this.closest('#nexus-help-panel').remove()" class="text-slate-500 hover:text-white text-xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <h2 class="orbitron text-lg font-black text-white italic mb-2 uppercase italic">MODULO: <span class="text-cyan-400">${data.title}</span></h2>
                <div class="space-y-6 mt-10">
                    <div>
                        <span class="orbitron text-[8px] text-amber-500 font-black uppercase italic block mb-2 underline">¿Por qué es vital?</span>
                        <p class="text-[11px] text-slate-300 italic leading-relaxed mono">${data.porque}</p>
                    </div>
                    <div>
                        <span class="orbitron text-[8px] text-cyan-400 font-black uppercase italic block mb-3 underline">Táctica Operativa</span>
                        <ul class="space-y-3">
                            ${data.instrucciones.map(ins => `<li class="flex items-start gap-2"><i class="fas fa-caret-right text-cyan-500 mt-1"></i><span class="text-[10px] text-slate-400 mono">${ins}</span></li>`).join('')}
                        </ul>
                    </div>
                </div>
                <div class="absolute bottom-10 left-8 right-8 text-center">
                    <a href="manual-operacion.html" class="orbitron text-[9px] text-black bg-cyan-500 px-4 py-3 rounded-xl font-black block hover:shadow-[0_0_15px_#00f2ff]">UNIVERSIDAD NEXUS</a>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        panel.onclick = (e) => { if(e.target.id === 'nexus-help-panel') panel.remove(); };
    }
};
