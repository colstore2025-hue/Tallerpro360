/**
 * NEXUS_X | Technical Assistant PRO 360 (Quantum Multi-Hub)
 * Multi-Vendor Integration: AllData, CarCareKiosk & WorkshopManuals
 */

(function() {
    const CONFIG = {
        primaryColor: '#0ea5e9',
        options: [
            { id: 'alldata', name: 'ALLDATA REPAIR', url: 'https://www.alldata.com/es-mx/repair', color: '#ef4444', icon: '🛠️' },
            { id: 'carcare', name: 'VIDEO GUÍAS (FREE)', url: 'https://www.carcarekiosk.com/', color: '#22c55e', icon: '📺' },
            { id: 'manuals', name: 'PDF MANUALS (FREE)', url: 'https://workshop-manuals.com/', color: '#fbbf24', icon: '📄' }
        ]
    };

    // Estilos avanzados para el menú HUD
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes nexus-pulse {
            0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.7); }
            70% { box-shadow: 0 0 0 15px rgba(14, 165, 233, 0); }
            100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
        }
        .nexus-menu-item {
            transform: translateY(20px);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            pointer-events: none;
        }
        .nexus-active .nexus-menu-item {
            transform: translateY(0);
            opacity: 1;
            pointer-events: auto;
        }
        .nexus-btn-main:hover { transform: rotate(90deg) scale(1.1); }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.id = 'quantum-tech-assistant';
    container.style.cssText = `position:fixed; bottom:25px; left: 20px; z-index:9999999 !important; display:flex; flex-direction:column-reverse; gap:12px; align-items:flex-end;`;

    // Botón Principal (Trigger)
    const mainBtn = document.createElement('button');
    mainBtn.className = 'nexus-btn-main';
    mainBtn.innerHTML = `
        <div style="background:${CONFIG.primaryColor}; padding:15px; border-radius:50%; animation: nexus-pulse 2s infinite; border: 2px solid rgba(255,255,255,0.2); transition:0.3s;">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.83 2.83l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.83 2.83l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.83 2.83l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0"></path>
                <path d="m10 14-5-5L1.3 12.7a2 2 0 0 0 0 2.8l3.2 3.2a2 2 0 0 0 2.8 0L10 14Z"></path>
            </svg>
        </div>
    `;
    mainBtn.style.cssText = "background:none; border:none; cursor:pointer; outline:none;";

    // Contenedor de Opciones
    const optionsWrapper = document.createElement('div');
    optionsWrapper.style.cssText = `display:flex; flex-direction:column; gap:10px; align-items:flex-end;`;

    CONFIG.options.forEach((opt, index) => {
        const optBtn = document.createElement('button');
        optBtn.className = 'nexus-menu-item';
        optBtn.style.transitionDelay = `${index * 0.05}s`;
        optBtn.innerHTML = `
            <div style="background:#1e293b; border-right:4px solid ${opt.color}; padding:8px 15px; border-radius:5px; color:white; font-family:'Orbitron'; font-size:10px; font-weight:bold; display:flex; align-items:center; gap:10px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                <span style="font-size:14px;">${opt.icon}</span> ${opt.name}
            </div>
        `;
        optBtn.style.cssText = "background:none; border:none; cursor:pointer; outline:none;";
        
        optBtn.onclick = async function() {
            // Detección de placa para portapapeles
            const placaElement = Array.from(document.querySelectorAll('div, span, p'))
                                .find(el => /^[A-Z]{3}\d{3}$/.test(el.innerText.trim()));
            if(placaElement) {
                try { await navigator.clipboard.writeText(placaElement.innerText.trim()); } catch(e) {}
            }
            window.open(opt.url, "_blank");
        };
        optionsWrapper.appendChild(optBtn);
    });

    mainBtn.onclick = () => {
        container.classList.toggle('nexus-active');
    };

    container.appendChild(optionsWrapper);
    container.appendChild(mainBtn);
    document.body.appendChild(container);
})();
