/**
 * publish_mision.js - NEXUS-X AEGIS V50.1 🛰️
 * NODO DE LANZAMIENTO DE ACTIVOS (MISIÓN CRÍTICA)
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { db } from "../core/firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function publish_mision(container) {
    const empresaId = localStorage.getItem("empresaId");
    const empresaNombre = localStorage.getItem("nexus_empresaNombre") || "OPERADOR NEXUS";

    container.innerHTML = `
    <div class="p-4 lg:p-12 max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-700">
        
        <header class="flex justify-between items-center mb-12 border-b border-white/5 pb-10">
            <div class="relative pl-6">
                <div class="absolute left-0 top-0 h-full w-1 bg-cyan-500 shadow-[0_0_20px_#06b6d4]"></div>
                <h1 class="orbitron text-4xl font-black italic text-white uppercase tracking-tighter">MISSION<span class="text-cyan-500">CONTROL</span></h1>
                <p class="text-[9px] text-slate-500 orbitron tracking-[0.5em] mt-2">LANZAMIENTO DE ACTIVOS SAP-GEN</p>
            </div>
            <button onclick="location.hash='#marketplace_bridge'" class="group flex items-center gap-3 px-6 py-3 bg-[#0d1117] border border-white/10 rounded-2xl hover:border-red-500/50 transition-all">
                <span class="text-[8px] orbitron text-slate-500 group-hover:text-red-500 transition-all font-black uppercase">Abortar Misión</span>
                <i class="fas fa-times text-slate-700 group-hover:text-red-500"></i>
            </button>
        </header>

        <form id="form-publish" class="grid lg:grid-cols-12 gap-8">
            
            <div class="lg:col-span-7 space-y-6">
                <div class="bg-[#0d1117] p-8 lg:p-10 rounded-[3rem] border border-white/5 relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-6 opacity-10">
                        <i class="fas fa-satellite text-6xl text-cyan-500"></i>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="col-span-full">
                            <label class="text-[8px] orbitron font-black text-cyan-500/50 tracking-widest block mb-3 uppercase">Identificador del Activo (Part Name/Model)</label>
                            <input type="text" id="m_nombre" required 
                                class="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-bold orbitron text-sm focus:border-cyan-500 outline-none transition-all" 
                                placeholder="EJ: TRANSMISIÓN EATON FULLER 18-SPEED">
                        </div>

                        <div>
                            <label class="text-[8px] orbitron font-black text-slate-500 tracking-widest block mb-3 uppercase">Valuación Comercial</label>
                            <div class="relative">
                                <span class="absolute left-5 top-1/2 -translate-y-1/2 text-cyan-500 font-black orbitron text-xs">$</span>
                                <input type="text" id="m_precio" required 
                                    class="w-full p-5 pl-10 bg-black/40 border border-white/5 rounded-2xl text-cyan-400 font-black orbitron text-sm focus:border-cyan-500 outline-none" 
                                    placeholder="0.00">
                            </div>
                        </div>

                        <div>
                            <label class="text-[8px] orbitron font-black text-slate-500 tracking-widest block mb-3 uppercase">Canal de Despliegue</label>
                            <select id="m_log" class="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-black orbitron text-[10px] focus:border-cyan-500 outline-none appearance-none">
                                <option value="heavy">COLOMBIAN TRUCKS LOGISTICS</option>
                                <option value="usa">CHARLOTTE HUB (NORTH CAROLINA)</option>
                                <option value="nexus">NEXUS-X INTERNAL NETWORK</option>
                            </select>
                        </div>

                        <div class="col-span-full">
                            <label class="text-[8px] orbitron font-black text-slate-500 tracking-widest block mb-3 uppercase">Especificaciones del Hardware (Opcional)</label>
                            <textarea id="m_desc" rows="3" class="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-slate-300 text-xs focus:border-cyan-500 outline-none resize-none" placeholder="Detalles técnicos, estado, ubicación física..."></textarea>
                        </div>
                    </div>
                </div>

                <button type="submit" id="btn-envio" class="group w-full py-8 bg-white text-black orbitron font-black text-[11px] rounded-[2.5rem] hover:bg-cyan-500 hover:text-white transition-all duration-500 uppercase tracking-[0.2em] shadow-2xl relative overflow-hidden">
                    <span class="relative z-10">Ejecutar Lanzamiento Global <i class="fas fa-bolt ml-2"></i></span>
                    <div class="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
            </div>

            <div class="lg:col-span-5">
                <div class="bg-black border border-white/5 p-10 rounded-[3.5rem] h-full flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent"></div>
                    
                    <div id="ai-status-icon" class="w-20 h-20 bg-[#0d1117] border border-cyan-500/20 rounded-full flex items-center justify-center mb-8 relative z-10">
                        <i class="fas fa-satellite-dish text-3xl text-cyan-500 animate-pulse"></i>
                    </div>

                    <h4 class="orbitron text-[10px] text-white font-black uppercase tracking-[0.4em] mb-6 relative z-10">NEXUS Strategist AI</h4>
                    
                    <div class="space-y-4 relative z-10">
                        <p id="ai-text" class="text-xs text-slate-500 italic leading-relaxed px-6">
                            "Esperando telemetría del activo. El despliegue en la red <span class="text-white">Nexus-X</span> garantiza visibilidad en todos los nodos de <span class="text-cyan-500 italic">${empresaNombre}</span>."
                        </p>
                        
                        <div class="flex flex-col gap-2 pt-6">
                            <div class="flex justify-between text-[7px] orbitron text-slate-700 font-black uppercase">
                                <span>Verificación de Datos</span>
                                <span id="v-data" class="text-slate-800">WAITING...</span>
                            </div>
                            <div class="h-[2px] bg-white/5 w-full rounded-full overflow-hidden">
                                <div id="v-bar" class="h-full bg-cyan-500 w-0 transition-all duration-1000"></div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-10 pt-10 border-t border-white/5 w-full">
                        <p class="text-[6px] orbitron text-slate-800 tracking-widest uppercase">Encryption: AES-256 NEXUS-CORE</p>
                    </div>
                </div>
            </div>
        </form>
    </div>`;

    // LÓGICA DE INTERACCIÓN AI
    const nombreInput = document.getElementById('m_nombre');
    const vBar = document.getElementById('v-bar');
    const vData = document.getElementById('v-data');
    const aiText = document.getElementById('ai-text');

    nombreInput.oninput = (e) => {
        if(e.target.value.length > 3) {
            vBar.style.width = '100%';
            vData.innerText = 'VALIDATED';
            vData.classList.replace('text-slate-800', 'text-emerald-500');
            aiText.innerHTML = `"Activo identificado. Optimizando canal de distribución para <span class="text-white">${e.target.value.toUpperCase()}</span>..."`;
        }
    };

    const form = document.getElementById('form-publish');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-envio');
        const icon = document.getElementById('ai-status-icon');
        
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-sync animate-spin"></i> TRANSMITIENDO A LA RED...`;
        icon.classList.add('animate-spin');

        try {
            await addDoc(collection(db, "marketplace"), {
                nombre: document.getElementById('m_nombre').value.toUpperCase(),
                precio: document.getElementById('m_precio').value,
                logisticaType: document.getElementById('m_log').value,
                descripcion: document.getElementById('m_desc').value,
                empresaId: empresaId,
                operador: empresaNombre,
                ubicacion: document.getElementById('m_log').value === 'usa' ? 'CHARLOTTE HUB' : 'COLOMBIA CORE',
                creadoEn: serverTimestamp()
            });

            // Simulación de éxito SAP
            aiText.innerHTML = `<span class="text-emerald-500">MISIÓN LANZADA CON ÉXITO.</span> Propagando señal en nodos regionales...`;
            
            setTimeout(() => {
                location.hash = "#marketplace_bridge";
            }, 1500);

        } catch (err) {
            console.error(err);
            btn.disabled = false;
            btn.innerHTML = "ERROR EN TRANSMISIÓN - REINTENTAR";
            icon.classList.remove('animate-spin');
        }
    };
}
