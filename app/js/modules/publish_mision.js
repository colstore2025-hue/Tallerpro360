/**
 * publish_mision.js - NEXUS-X 🛰️
 * Lanzamiento de Activos Directo a Firebase
 */
import { db } from "../core/firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function publishMision(container) {
    const plan = (localStorage.getItem("nexus_plan") || "GRATI-CORE").toUpperCase();
    const empresaId = localStorage.getItem("nexus_empresaId");

    if (plan !== "PRO" && plan !== "ELITE") {
        container.innerHTML = `<div class="text-center p-20 orbitron">ACCESO RESTRINGIDO</div>`;
        return;
    }

    container.innerHTML = `
    <div class="p-6 md:p-12 max-w-7xl mx-auto animate-in slide-in-from-bottom duration-700">
        <header class="flex justify-between items-end mb-12 border-b border-white/5 pb-10">
            <div class="relative pl-8">
                <div class="absolute left-0 top-0 h-full w-1.5 bg-cyan-500 shadow-[0_0_20px_#06b6d4]"></div>
                <h1 class="orbitron text-5xl font-black italic text-white uppercase">PUBLISH<span class="text-white/20">CENTER</span></h1>
            </div>
            <button onclick="location.hash='#dashboard'" class="px-8 py-4 bg-[#0d1117] border border-white/5 rounded-2xl orbitron text-[10px] text-slate-400">ABORTAR</button>
        </header>

        <form id="nexusForm" class="grid lg:grid-cols-12 gap-10">
            <div class="lg:col-span-8 space-y-8">
                <div class="bg-[#0d1117] p-10 rounded-[2.5rem] border border-white/5">
                    <div class="grid md:grid-cols-2 gap-8">
                        <div class="md:col-span-2">
                            <label class="text-[8px] orbitron font-black text-slate-500 tracking-widest block mb-4 uppercase">Identificación del Activo</label>
                            <input type="text" id="p_nombre" required class="w-full p-6 bg-black/40 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-cyan-500" placeholder="TURBO, TRANSMISIÓN, ECU...">
                        </div>
                        <div>
                            <label class="text-[8px] orbitron font-black text-slate-500 tracking-widest block mb-4 uppercase">Inversión Sugerida (COP)</label>
                            <input type="text" id="p_precio" required class="w-full p-6 bg-black/40 border border-white/10 rounded-2xl text-cyan-400 font-black outline-none focus:border-cyan-500" placeholder="$ 0">
                        </div>
                        <div>
                            <label class="text-[8px] orbitron font-black text-slate-500 tracking-widest block mb-4 uppercase">Origen Logístico</label>
                            <select id="p_log" class="w-full p-6 bg-black/40 border border-white/10 rounded-2xl text-white font-black outline-none focus:border-cyan-500">
                                <option value="heavy">COLOMBIAN TRUCKS</option>
                                <option value="usa">CHARLOTTE HUB (USA)</option>
                            </select>
                        </div>
                    </div>
                </div>
                <button type="submit" id="btnLaunch" class="w-full py-8 bg-white text-black orbitron font-black text-[12px] rounded-[2.5rem] hover:bg-cyan-500 hover:text-white transition-all">
                    EJECUTAR PUBLICACIÓN GLOBAL <i class="fas fa-bolt ml-2"></i>
                </button>
            </div>
            
            <div class="lg:col-span-4 bg-gradient-to-b from-[#0d1117] to-black p-10 rounded-[3rem] border border-cyan-500/10">
                <div class="flex items-center gap-4 mb-8">
                    <i class="fas fa-brain text-cyan-500"></i>
                    <p class="orbitron text-[10px] font-black text-white uppercase tracking-widest">Strategist AI</p>
                </div>
                <p id="aiHint" class="text-[11px] text-slate-400 italic leading-relaxed">Analizando activo para red global...</p>
            </div>
        </form>
    </div>`;

    // Lógica de Formulario
    const form = document.getElementById('nexusForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnLaunch');
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-satellite animate-spin"></i> TRANSMITIENDO...`;

        try {
            await addDoc(collection(db, "marketplace"), {
                nombre: document.getElementById('p_nombre').value.toUpperCase(),
                precio: document.getElementById('p_precio').value,
                logisticaType: document.getElementById('p_log').value,
                empresaId: empresaId,
                creadoEn: serverTimestamp()
            });
            location.hash = "#marketplace";
        } catch (error) {
            console.error(error);
            btn.disabled = false;
            btn.innerHTML = "ERROR - REINTENTAR";
        }
    };
}
