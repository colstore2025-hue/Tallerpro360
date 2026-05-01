/**
 * 🛰️ NEXUS_X | QUANTUM-SAP TECHNICAL TERMINAL
 * Integración Quirúrgica: AllData, AutoZone DIY, CarCare & Workshop
 * Zero-Patch Architecture | Level: QUANTUM-SAP
 */

(function() {
    'use strict';

    // 1. CONTROL DE IDENTIDAD ÚNICA
    const SAP_ID = 'nexus-quantum-terminal-vfinal';
    if (document.getElementById(SAP_ID)) return;

    // 2. CONFIGURACIÓN DE PROTOCOLOS (Incluyendo AutoZone DIY)
    const CORE_CONFIG = {
        primary: '#0ea5e9',
        font: "'Orbitron', sans-serif",
        options: [
            { name: 'ALLDATA PREMIUM', url: 'https://www.alldata.com/es-mx/repair', color: '#ef4444', icon: '🛠️' },
            { name: 'AUTOZONE REPAIR DIY', url: 'https://www.autozone.com/diy/repair-guides', color: '#f97316', icon: '🔍' },
            { name: 'VIDEO GUIDES (FREE)', url: 'https://www.carcarekiosk.com/', color: '#22c55e', icon: '📺' },
            { name: 'PDF MANUALS (FREE)', url: 'https://workshop-manuals.com/', color: '#fbbf24', icon: '📄' }
        ]
    };

    // 3. INYECCIÓN DE ADN ESTÉTICO (Encapsulado)
    const injectStyles = () => {
        if (document.getElementById(`${SAP_ID}-style`)) return;
        const style = document.createElement('style');
        style.id = `${SAP_ID}-style`;
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
            
            #${SAP_ID} {
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

            .sap-main-trigger {
                width: 62px; height: 62px;
                background: ${CORE_CONFIG.primary};
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.4);
                box-shadow: 0 0 25px ${CORE_CONFIG.primary};
                cursor: pointer;
                pointer-events: auto !important;
                display: flex; align-items: center; justify-content: center;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                animation: sap-pulse 2.5s infinite;
            }

            .sap-menu {
                display: flex; flex-direction: column; gap: 10px;
                opacity: 0; transform: translateY(20px) scale(0.95);
                transition: all 0.4s ease; pointer-events: none !important;
            }

            .sap-active .sap-menu {
                opacity: 1; transform: translateY(0) scale(1);
                pointer-events: auto !important;
            }

            .sap-item {
                background: rgba(11, 18, 32, 0.98);
                border-left: 5px solid var(--c);
                padding: 12px 20px;
                border-radius: 8px;
                color: white;
                font-family: ${CORE_CONFIG.font};
                font-size: 11px; font-weight: 700;
                display: flex; align-items: center; gap: 12px;
                cursor: pointer;
                box-shadow: 0 10px 30px rgba(0,0,0,0.8);
                border-top: 1px solid rgba(255,255,255,0.1);
                white-space: nowrap; transition: 0.3s;
            }

            .sap-item:hover { background: #1e293b; transform: translateX(10px); }

            @keyframes sap-pulse {
                0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.7); }
                70% { box-shadow: 0 0 0 20px rgba(14, 165, 233, 0); }
                100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
            }
        `;
        document.head.appendChild(style);
    };

    // 4. CONSTRUCCIÓN MECÁNICA DE LA TERMINAL
    const terminal = document.createElement('div');
    terminal.id = SAP_ID;

    const trigger = document.createElement('div');
    trigger.className = 'sap-main-trigger';
    trigger.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.83 2.83l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.83 2.83l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.83 2.83l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0"></path><path d="m10 14-5-5L1.3 12.7a2 2 0 0 0 0 2.8l3.2 3.2a2 2 0 0 0 2.8 0L10 14Z"></path></svg>`;

    const menu = document.createElement('div');
    menu.className = 'sap-menu';

    CORE_CONFIG.options.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'sap-item';
        item.style.setProperty('--c', opt.color);
        item.innerHTML = `<span>${opt.icon}</span> ${opt.name}`;
        
        item.onclick = async (e) => {
            e.stopPropagation();
            // Quantum Clip: Escaneo dinámico
            const text = document.body.innerText;
            const match = text.match(/[A-Z]{3}\d{3}/);
            if (match) {
                try { await navigator.clipboard.writeText(match[0]); } catch(err) {}
            }
            
            // Apertura limpia (Protocolo Anti-Ads)
            const win = window.open();
            win.opener = null;
            win.location = opt.url;
        };
        menu.appendChild(item);
    });

    trigger.onclick = (e) => {
        e.stopPropagation();
        terminal.classList.toggle('sap-active');
    };

    terminal.appendChild(menu);
    terminal.appendChild(trigger);

    // 5. PROTOCOLO DE INYECCIÓN FORZADA (Zero-Patch)
    const deploy = () => {
        injectStyles();
        if (!document.getElementById(SAP_ID)) {
            document.body.appendChild(terminal);
        }
    };

    if (document.readyState === 'complete') deploy();
    else window.addEventListener('load', deploy);
    
    // Fail-safe por si el dashboard bloquea el evento load
    setTimeout(deploy, 2000);

})();
