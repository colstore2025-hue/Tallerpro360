/**
 * NEXUS-HELP-ENGINE V2.0 - CENTRALIZADO
 */
window.NexusHelp = {
    // Diccionario de ayuda
    data: {
        'ordenes': {
            title: 'ÓRDENES PRO',
            porque: 'El botón de [FOTO] es tu seguro legal contra reclamos. Registra el estado real del vehículo al recibirlo.',
            tips: ['Usa la voz para el diagnóstico.', 'Marca "Suministro Cliente" si el repuesto es externo.']
        },
        'inventario': {
            title: 'STOCK ELITE',
            porque: 'Controla el costo de compra para garantizar tu margen de ganancia real y evitar fugas.',
            tips: ['Configura alertas de stock mínimo.', 'Registra entradas de facturas.']
        },
        'config': {
            title: 'CONFIG ADN',
            porque: 'Establece tu identidad. Sin esto, los reportes de WhatsApp no tendrán tu marca.',
            tips: ['Sincroniza el QR de Business.', 'Carga tu logo en alta resolución.']
        }
    },

    // Esta función crea el botón y el panel
    instalar: function() {
        if(document.getElementById('nexus-help-trigger')) return;

        // Crear botón flotante
        const btn = document.createElement('div');
        btn.innerHTML = `
            <div id="nexus-help-trigger" style="position:fixed; bottom:20px; right:20px; width:50px; height:50px; background:#00f2ff; border-radius:50%; display:flex; align-items:center; justify-center; cursor:pointer; z-index:9999; box-shadow:0 0 15px rgba(0,242,255,0.5); border:2px solid white;">
                <i class="fas fa-brain" style="color:black; margin:auto"></i>
            </div>`;
        document.body.appendChild(btn);

        btn.onclick = () => {
            // DETECCIÓN AUTOMÁTICA: Mira la URL o el contenedor para saber qué ayuda mostrar
            let moduloActivo = 'config'; // por defecto
            if(window.location.hash.includes('ordenes')) moduloActivo = 'ordenes';
            if(window.location.hash.includes('inventario')) moduloActivo = 'inventario';
            
            this.mostrarPanel(moduloActivo);
        };
    },

    mostrarPanel: function(id) {
        const d = this.data[id] || this.data['config'];
        const panel = document.createElement('div');
        panel.id = "nexus-panel-ayuda";
        panel.style = "position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:10000; display:flex; justify-content:flex-end;";
        panel.innerHTML = `
            <div style="width:300px; background:#0d1117; height:100%; border-left:1px solid #00f2ff; padding:30px; color:white; font-family:sans-serif;">
                <button onclick="document.getElementById('nexus-panel-ayuda').remove()" style="color:#00f2ff; background:none; border:none; cursor:pointer;">CERRAR [X]</button>
                <h2 style="margin-top:20px; color:#00f2ff;">${d.title}</h2>
                <p style="font-size:12px; color:#aaa; margin-top:20px;"><b>¿POR QUÉ?</b><br>${d.porque}</p>
                <ul style="font-size:11px; margin-top:20px; padding-left:15px;">
                    ${d.tips.map(t => `<li style="margin-bottom:10px;">${t}</li>`).join('')}
                </ul>
            </div>`;
        document.body.appendChild(panel);
    }
};
