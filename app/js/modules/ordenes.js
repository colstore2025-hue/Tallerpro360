/**
 * ordenes.js - TallerPRO360 NEXUS-X V27.1 🛰️
 * UNIFICACIÓN TOTAL CON MOTORES IA
 */
import { 
    collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc, 
    serverTimestamp, addDoc, deleteDoc, arrayUnion, increment 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

// --- IMPORTACIONES BASADAS EN TUS SCRIPTS REALES ---
import { diagnosticarProblema } from "../ai/iaMecanica.js";
import InventoryAI from "../ai/inventoryAI.js";
import { predecirFallas } from "../ai/predictiveDiagnostics.js";
import predictiveMaintenanceAI from "../ai/predictiveMaintenanceAI.js";
import { VoiceMechanicAI } from "../ai/voiceMechanicAI.js";
import VehicleScanner from "../ai/vehicleScanner.js";

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let unsubscribe = null;
    
    // Inicialización de Clases de tus scripts
    const invAI = new InventoryAI();
    const voiceAI = new VoiceMechanicAI();
    const scanner = new VehicleScanner();

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-8 bg-[#010409] min-h-screen text-slate-100 font-sans">
            <header class="flex justify-between items-start mb-10 border-b border-white/5 pb-8">
                <div>
                    <h1 class="orbitron text-5xl font-black italic text-white tracking-tighter">TERMINAL_<span class="text-orange-500">NEXUS</span></h1>
                    <p class="text-[9px] orbitron tracking-[0.5em] text-slate-500 mt-2 uppercase">Ingeniería Automotriz • V27.1</p>
                </div>
                <button id="btnNewMission" class="px-8 py-4 bg-orange-600 rounded-2xl orbitron text-[10px] font-black text-black">NUEVA ORDEN</button>
            </header>

            <nav class="flex gap-4 mb-10 overflow-x-auto no-scrollbar pb-2">
                ${['COTIZACION', 'EN_TALLER', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(f => `
                    <button class="nav-fase-btn flex-1 min-w-[150px] p-6 rounded-3xl border border-white/5 bg-[#0d1117]" data-fase="${f}">
                        <p class="orbitron text-[8px] text-slate-500">${f}</p>
                        <h3 class="text-2xl font-black mt-1">--</h3>
                    </button>
                `).join('')}
            </nav>

            <div id="nexus-console" class="hidden fixed inset-0 z-50 bg-[#010409]/95 backdrop-blur-xl p-6 lg:p-20 overflow-y-auto"></div>
            <div id="grid-misiones" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"></div>
        </div>`;

        document.getElementById("btnNewMission").onclick = () => abrirConsola('EN_TALLER');
        vincularFases();
    };

    const abrirConsola = async (fase, data = null) => {
        const orden = data || { placa: '', cliente: '', items: [], estado: fase, costosTotales: 0 };
        const consoleEl = document.getElementById("nexus-console");
        consoleEl.classList.remove("hidden");
        
        consoleEl.innerHTML = `
        <div class="max-w-7xl mx-auto space-y-8 animate-in zoom-in-95">
            <div class="flex justify-between">
                <h2 class="orbitron text-2xl font-black text-orange-500 italic">UNIT: ${orden.placa || 'NEW_MISSION'}</h2>
                <button onclick="document.getElementById('nexus-console').classList.add('hidden')" class="text-slate-500 orbitron text-xs">CERRAR</button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="space-y-4">
                    <div class="bg-white/5 p-6 rounded-[2rem] border border-white/10">
                        <input id="f-placa" value="${orden.placa}" class="w-full bg-transparent text-4xl font-black orbitron uppercase outline-none" placeholder="PLACA">
                        <input id="f-cliente" value="${orden.cliente || ''}" class="w-full bg-white/5 p-4 mt-4 rounded-xl text-sm" placeholder="CLIENTE">
                    </div>
                    
                    <div class="bg-orange-600/5 p-6 rounded-[2rem] border border-orange-500/20">
                        <p id="ai-report" class="text-[10px] text-slate-400 italic mb-4">Telemetría pasiva lista...</p>
                        <button id="btnScanIA" class="w-full py-4 bg-orange-600 text-black orbitron font-black text-[9px] rounded-xl">EJECUTAR SCANNER PRO360</button>
                    </div>
                </div>

                <div class="lg:col-span-2 bg-[#0d1117] p-8 rounded-[2rem] border border-white/10">
                    <div class="flex justify-between items-center mb-6">
                        <h3 id="total-mision" class="orbitron text-5xl font-black">$ ${orden.costosTotales.toLocaleString()}</h3>
                        <button id="btnVozIA" class="w-16 h-16 bg-orange-600 rounded-full text-black shadow-xl hover:scale-105 transition-all"><i class="fas fa-microphone"></i></button>
                    </div>
                    <div id="lista-items" class="space-y-2 h-[300px] overflow-y-auto"></div>
                    <button onclick="window.guardarMision()" class="w-full mt-6 py-6 bg-white text-black orbitron font-black rounded-2xl hover:bg-orange-600 hover:text-white transition-all">SINCRONIZAR ERP</button>
                </div>
            </div>
        </div>`;

        // 🔗 CONEXIÓN CON VEHICLESCANNER.JS
        document.getElementById("btnScanIA").onclick = async () => {
            const res = scanner.scanVehicle({}, ["ruido en frenos", "motor caliente"]); // Ejemplo
            document.getElementById("ai-report").innerText = res.length > 0 ? `DETECTADO: ${res[0].problema}` : "Sin fallas críticas detectadas.";
            hablar("Escaneo finalizado");
        };

        // 🎤 CONEXIÓN CON VOICEMECHANICAI.JS
        document.getElementById("btnVozIA").onclick = () => {
            voiceAI.start((comando, texto) => {
                if(comando.type !== "desconocido") {
                    hablar(`Comando ${comando.type} ejecutado`);
                    // Aquí procesas el comando según tu lógica
                } else {
                    procesarTextoMecanico(texto, orden);
                }
            });
        };

        renderItems(orden);
    };

    // 🧠 CONEXIÓN CON IAMECANICA.JS Y INVENTORYAI.JS
    const procesarTextoMecanico = async (texto, orden) => {
        // Usamos diagnosticarProblema de tu script 1
        const diagnostico = await diagnosticarProblema(texto);
        console.log("IA Mecánica:", diagnostico);
        
        // Lógica de carga simple para el ejemplo
        const matchPrecio = texto.match(/\d+/g);
        const valor = matchPrecio ? parseInt(matchPrecio[0]) * 1000 : 50000;
        
        orden.items.push({ 
            desc: texto.toUpperCase(), 
            valor: valor, 
            tipo: texto.includes("oro") ? "ORO" : "REPUESTO" 
        });
        
        renderItems(orden);
    };

    const renderItems = (orden) => {
        const container = document.getElementById("lista-items");
        container.innerHTML = (orden.items || []).map(it => `
            <div class="flex justify-between p-4 bg-white/5 rounded-xl border-l-4 ${it.tipo === 'ORO' ? 'border-amber-500' : 'border-emerald-500'}">
                <span class="text-[10px] orbitron">${it.desc}</span>
                <span class="font-bold">$ ${it.valor.toLocaleString()}</span>
            </div>
        `).join("");
        
        const total = (orden.items || []).reduce((a, b) => a + b.valor, 0);
        document.getElementById("total-mision").innerText = `$ ${total.toLocaleString()}`;
        orden.costosTotales = total;
    };

    const vincularFases = () => {
        document.querySelectorAll('.nav-fase-btn').forEach(btn => {
            btn.onclick = () => escucharMisiones(btn.dataset.fase);
        });
        document.querySelector('[data-fase="EN_TALLER"]').click();
    };

    function escucharMisiones(fase) {
        if (unsubscribe) unsubscribe();
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", fase));
        unsubscribe = onSnapshot(q, (snap) => {
            const grid = document.getElementById("grid-misiones");
            grid.innerHTML = snap.docs.map(ds => {
                const o = ds.data();
                return `<div onclick="window.loadMission('${ds.id}')" class="bg-[#0d1117] p-6 rounded-[2rem] border border-white/5 cursor-pointer hover:border-orange-500 transition-all">
                    <h4 class="orbitron text-2xl font-black">${o.placa}</h4>
                    <p class="text-[9px] text-slate-500 uppercase">${o.cliente || 'S/N'}</p>
                    <div class="mt-4 pt-4 border-t border-white/5 flex justify-between">
                        <span class="text-[8px] orbitron text-orange-500">TOTAL</span>
                        <span class="font-bold">$ ${(o.total || 0).toLocaleString()}</span>
                    </div>
                </div>`;
            }).join("");
        });
    }

    renderBase();
}
