/**
 * 🛰️ NEXUS_X | QUANTUM-SAP TECHNICAL ASSISTANT
 * Priority Zero Injection - Multi-Protocol V6 (Full Clean Edition)
 * Protocols: AllData, AutoZone DIY, CarCare, Workshop
 */

(function() {
    'use strict';

    // Evitar duplicados en el DOM
    const SAP_IDENTITY = 'nexus-quantum-sap-v6';
    if (document.getElementById(SAP_IDENTITY)) return;

    const UI_CONFIG = {
        primary: '#0ea5e9',
        bg: 'rgba(11, 18, 32, 0.98)',
        border: 'rgba(14, 165, 233, 0.5)',
        font: "'Orbitron', sans-serif",
        options: [
            { name: 'ALLDATA PREMIUM', url: 'https://www.alldata.com/es-mx/repair', color: '#ef4444', icon: '🛠️' },
            { name: 'AUTOZONE REPAIR GUIDES', url: 'https://www.autozone.com/diy/repair-guides', color: '#f97316', icon: '🔍' },
            { name: 'VIDEO GUIDES (FREE)', url: 'https://www.carcarekiosk.com/', color: '#22c55e', icon: '📺' },
            { name: 'PDF MANUALS (FREE)', url: 'https://workshop-manuals.com/', color: '#fbbf24', icon: '📄' }
        ]
    };

    // 1. PROTOCOLO DE ESTILOS "ULTRA-PRIORITY"
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
        
        #${SAP_IDENTITY} {
            position: fixed !important;
            bottom: 35px !important;
            left: 25px !important;
            z-index: 2147483647 !important;
            display: flex !important;
            flex-direction: column-reverse !important;
            gap: 12px !important;
            pointer-events: none !important;
            user-select: none;
        }

        .sap-trigger-v6 {
            width: 62px; height: 62px;
            background: ${UI_CONFIG.primary};
            border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.4);
            box-shadow: 0 0 30px rgba(14, 165, 233, 0.6);
            cursor: pointer;
            pointer-events: auto !important;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            animation: sap-pulse-v6 2.5s infinite;
        }

        .sap-trigger-v6 svg { filter: drop-shadow(0 0 5px rgba(255,255,255,0.8)); }

        .sap-menu-v6 {
            display: flex;
            flex-direction: column;
            gap: 10px;
            opacity: 0;
            transform: translateY(30px) scale(0.8);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none !important;
        }

        .sap-active .sap-menu-v6 {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto !important;
        }

        .sap-item-v6 {
            background: ${UI_CONFIG.bg};
            border-left: 5px solid var(--item-color);
            padding: 12px 18px;
            border-radius: 8px;
            color: white;
            font-family: ${UI_CONFIG.font};
            font-size: 11px;
            font-weight: 700;
            display: flex; align-items: center; gap: 12px;
            cursor: pointer;
            box-shadow: 0 10px 25px rgba(0,0,0,0.7);
            border-top: 1px solid ${UI_CONFIG.border};
            white-space: nowrap;
            transition: 0.3s;
        }

        .sap-item-v6:hover { 
            background: #1e293b; 
            transform: translateX(10px); 
            box-shadow: 0 0 15px var(--item-color);
        }

        @keyframes sap-pulse-v6 {
            0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.7); }
            70% { box-shadow: 0 0 0 20px rgba(14, 165, 233, 0); }
            100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
        }
    `;
    document.head.appendChild(styleSheet);

    // 2. CONSTRUCCIÓN MECÁNICA
    const sapHub = document.createElement('div');
    sapHub.id = SAP_IDENTITY;

    const trigger = document.createElement('div');
    trigger.className = 'sap-trigger-v6';
    trigger.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.83 2.83l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.83 2.83l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.83 2.83l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0"></path>
            <path d="m10 14-5-5L1.3 12.7a2 2 0 0 0 0 2.8l3.2 3.2a2 2 0 0 0 2.8 0L10 14Z"></path>
        </svg>
    `;

    const menuContainer = document.createElement('div');
    menuContainer.className = 'sap-menu-v6';

    UI_CONFIG.options.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'sap-item-v6';
        item.style.setProperty('--item-color', opt.color);
        item.innerHTML = `<span>${opt.icon}</span> ${opt.name}`;
        
        item.onclick = async (e) => {
            e.stopPropagation();
            // Quantum Clip: Escaneo dinámico de placa
            const content = document.body.innerText;
            const placaMatch = content.match(/[A-Z]{3}\d{3}/);
            
            if (placaMatch) {
                try {
                    await navigator.clipboard.writeText(placaMatch[0]);
                    console.log(`🛰️ Placa ${placaMatch[0]} lista para ${opt.name}`);
                } catch(err) {
                    console.error("No se pudo copiar la placa");
                }
            }
            
            // Apertura con "No-Referrer" para reducir rastreo publicitario
            const newWindow = window.open();
            newWindow.opener = null;
            newWindow.location = opt.url;
            newWindow.target = "_blank";
        };
        menuContainer.appendChild(item);
    });

    trigger.onclick = (e) => {
        e.stopPropagation();
        sapHub.classList.toggle('sap-active');
    };

    // 3. INYECCIÓN FINAL
    if (document.readyState === 'complete') {
        document.body.appendChild(sapHub);
    } else {
        window.addEventListener('load', () => document.body.appendChild(sapHub));
    }

})();
