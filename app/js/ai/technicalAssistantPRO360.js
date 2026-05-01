/**
 * 🛰️ NEXUS_X | QUANTUM-SAP TECHNICAL ASSISTANT
 * Priority Zero Injection - Multi-Protocol (AllData, CarCare, Workshop)
 * @version 4.0.0 (Quantum-SAP)
 */

(function() {
    'use strict';

    const SAP_IDENTITY = 'nexus-quantum-sap-v4';
    if (document.getElementById(SAP_IDENTITY)) return;

    const UI_CONFIG = {
        primary: '#0ea5e9',
        bg: 'rgba(15, 23, 42, 0.95)',
        border: 'rgba(14, 165, 233, 0.3)',
        font: "'Orbitron', sans-serif",
        options: [
            { name: 'ALLDATA PREMIUM', url: 'https://www.alldata.com/es-mx/repair', color: '#ef4444', icon: '🛠️' },
            { name: 'VIDEO GUIDES (FREE)', url: 'https://www.carcarekiosk.com/', color: '#22c55e', icon: '📺' },
            { name: 'PDF MANUALS (FREE)', url: 'https://workshop-manuals.com/', color: '#fbbf24', icon: '📄' }
        ]
    };

    // 1. PROTOCOLO DE ESTILOS DE ALTA PRIORIDAD
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
        
        #${SAP_IDENTITY} {
            position: fixed !important;
            bottom: 30px !important;
            left: 25px !important;
            z-index: 2147483647 !important; /* Capa máxima posible en navegadores */
            display: flex !important;
            flex-direction: column-reverse !important;
            gap: 15px !important;
            pointer-events: none !important;
        }

        .sap-main-trigger {
            width: 65px; height: 65px;
            background: ${UI_CONFIG.primary};
            border-radius: 50%;
            border: 3px solid rgba(255,255,255,0.2);
            box-shadow: 0 0 25px ${UI_CONFIG.primary};
            cursor: pointer;
            pointer-events: auto !important;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            animation: sap-pulse 2s infinite;
        }

        .sap-main-trigger:active { transform: scale(0.9); }

        .sap-menu-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
            opacity: 0;
            transform: translateX(-50px);
            transition: all 0.5s ease;
            pointer-events: none !important;
        }

        .sap-active .sap-menu-container {
            opacity: 1;
            transform: translateX(0);
            pointer-events: auto !important;
        }

        .sap-item {
            background: ${UI_CONFIG.bg};
            border-left: 5px solid var(--item-color);
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-family: ${UI_CONFIG.font};
            font-size: 11px;
            font-weight: 700;
            display: flex; align-items: center; gap: 12px;
            cursor: pointer;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            border-top: 1px solid ${UI_CONFIG.border};
            white-space: nowrap;
            transition: 0.3s;
        }

        .sap-item:hover { background: #1e293b; transform: translateX(10px); }

        @keyframes sap-pulse {
            0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.7); }
            70% { box-shadow: 0 0 0 20px rgba(14, 165, 233, 0); }
            100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
        }
    `;
    document.head.appendChild(styleSheet);

    // 2. CONSTRUCCIÓN DEL NÚCLEO
    const sapHub = document.createElement('div');
    sapHub.id = SAP_IDENTITY;

    const trigger = document.createElement('div');
    trigger.className = 'sap-main-trigger';
    trigger.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.83 2.83l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.83 2.83l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.83 2.83l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0"></path>
            <path d="m10 14-5-5L1.3 12.7a2 2 0 0 0 0 2.8l3.2 3.2a2 2 0 0 0 2.8 0L10 14Z"></path>
        </svg>
    `;

    const menuContainer = document.createElement('div');
    menuContainer.className = 'sap-menu-container';

    UI_CONFIG.options.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'sap-item';
        item.style.setProperty('--item-color', opt.color);
        item.innerHTML = `<span>${opt.icon}</span> ${opt.name}`;
        item.onclick = async () => {
            // Quantum Clip: Captura automática de placa antes de saltar
            const placa = document.body.innerText.match(/[A-Z]{3}\d{3}/);
            if (placa) {
                try { await navigator.clipboard.writeText(placa[0]); } catch(e) {}
            }
            window.open(opt.url, '_blank');
        };
        menuContainer.appendChild(item);
    });

    trigger.onclick = (e) => {
        e.stopPropagation();
        sapHub.classList.toggle('sap-active');
    };

    sapHub.appendChild(menuContainer);
    sapHub.appendChild(trigger);

    // 3. INYECCIÓN DE PRIORIDAD ZERO
    // Esperamos a que el DOM esté listo o inyectamos de inmediato
    if (document.body) {
        document.body.appendChild(sapHub);
    } else {
        window.addEventListener('DOMContentLoaded', () => document.body.appendChild(sapHub));
    }

})();
