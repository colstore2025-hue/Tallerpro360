/**
 * publish_mision.js - NEXUS-X 🛰️
 * Módulo de Lanzamiento de Activos
 */
import { db } from "/core/firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function publishMision(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");

    container.innerHTML = `
    <div class="p-6 lg:p-12 max-w-5xl mx-auto animate-in slide-in-from-bottom duration-500">
        <header class="flex justify-between items-center mb-10 border-b border-white/5 pb-8">
            <h1 class="orbitron text-3xl font-black italic text-white uppercase tracking-tighter">PUBLISH<span class="text-white/20">CENTER</span></h1>
            <button onclick="location.hash='#dashboard'" class="text-[10px] orbitron text-slate-500 hover:text-white transition-all">ABORTAR</button>
        </header>

        <form id="form-publish" class="grid lg:grid-cols-2 gap-8">
            <div class="space-y-6">
                <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5">
                    <label class="text-[8px] orbitron font-black text-slate-500 tracking-widest block mb-4 uppercase">Nombre del Activo</label>
                    <input type="text" id="m_nombre" required class="w-full p-5 bg-black/40 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-cyan-500" placeholder="EJ: TRANSMISIÓN EATON">
                    
                    <label class="text-[8px] orbitron font-black text-slate-500 tracking-widest block my-4 uppercase">Inversión (COP/USD)</label>
                    <input type="text" id="m_precio" required class="w-full p-5 bg-black/40 border border-white/10 rounded-xl text-cyan-400 font-black outline-none focus:border-cyan-500" placeholder="$ 0">

                    <label class="text-[8px] orbitron font-black text-slate-500 tracking-widest block my-4 uppercase">Canal Logístico</label>
                    <select id="m_log" class="w-full p-5 bg-black/40 border border-white/10 rounded-xl text-white font-black outline-none focus:border-cyan-500">
                        <option value="heavy">COLOMBIAN TRUCKS</option>
                        <option value="usa">CHARLOTTE HUB (USA)</option>
                    </select>
                </div>
                <button type="submit" id="btn-envio" class="w-full py-6 bg-white text-black orbitron font-black text-[10px] rounded-[2rem] hover:bg-cyan-500 hover:text-white transition-all uppercase">
                    Lanzar a la Red <i class="fas fa-bolt ml-2"></i>
                </button>
            </div>

            <div class="bg-gradient-to-br from-[#0d1117] to-black p-10 rounded-[3rem] border border-cyan-500/10 flex flex-col justify-center text-center">
                <i class="fas fa-satellite-dish text-4xl text-cyan-500 mb-6 animate-pulse"></i>
                <p class="orbitron text-[10px] text-white uppercase tracking-widest mb-4">Strategist AI</p>
                <p class="text-xs text-slate-400 italic">Listo para transmitir datos a la red global de Nexus-X.</p>
            </div>
        </form>
    </div>`;

    const form = document.getElementById('form-publish');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-envio');
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-sync animate-spin"></i> TRANSMITIENDO...`;

        try {
            await addDoc(collection(db, "marketplace"), {
                nombre: document.getElementById('m_nombre').value.toUpperCase(),
                precio: document.getElementById('m_precio').value,
                logisticaType: document.getElementById('m_log').value,
                empresaId: empresaId,
                creadoEn: serverTimestamp()
            });
            location.hash = "#marketplace_bridge"; // Redirección al market
        } catch (err) {
            console.error(err);
            btn.disabled = false;
            btn.innerHTML = "ERROR - REINTENTAR";
        }
    };
}
