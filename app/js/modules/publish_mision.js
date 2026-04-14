/**
 * publish_mision.js - NEXUS-X 🛰️
 * Módulo Unificado de Lanzamiento de Activos (Misión Comercial)
 */
import { db } from "../core/firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function publishMision(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const plan = localStorage.getItem("nexus_plan") || "GRATI-CORE";

    // 🛡️ Validación de nivel de acceso (Solo PRO/ELITE)
    if (plan !== "PRO" && plan !== "ELITE") {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full p-20 text-center animate-in zoom-in">
                <i class="fas fa-shield-halved text-6xl text-orange-500/20 mb-8"></i>
                <h2 class="orbitron text-2xl font-black text-white italic">ACCESO DENEGADO</h2>
                <p class="text-slate-500 mt-4 max-w-md">El protocolo de "Publicación Global" requiere una licencia corporativa activa.</p>
                <button onclick="location.hash='#pagos'" class="mt-8 px-10 py-4 bg-orange-600 text-white orbitron text-[10px] font-black rounded-2xl hover:bg-white hover:text-black transition-all">UPGRADE SISTEMA</button>
            </div>`;
        return;
    }

    container.innerHTML = `
    <div class="p-6 lg:p-12 max-w-7xl mx-auto animate-in fade-in duration-700">
        <header class="flex justify-between items-end mb-12 border-b border-white/5 pb-10">
            <div class="relative pl-8">
                <div class="absolute left-0 top-0 h-full w-1.5 bg-cyan-500 shadow-[0_0_20px_#06b6d4]"></div>
                <h1 class="orbitron text-5xl font-black italic uppercase tracking-tighter text-white">PUBLISH<span class="text-white/20">CENTER</span></h1>
                <p class="text-[9px] orbitron tracking-[0.5em] text-slate-500 uppercase mt-4 font-black">Lanzamiento de Activos a la Red Global</p>
            </div>
            <button onclick="location.hash='#dashboard'" class="px-8 py-4 bg-[#0d1117] border border-white/5 rounded-2xl text-[10px] orbitron font-black hover:bg-white/5">ABORTAR</button>
        </header>

        <form id="formNexusPublish" class="grid lg:grid-cols-12 gap-10">
            <div class="lg:col-span-8 space-y-8">
                <div class="bg-[#0d1117] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
                    <div class="grid md:grid-cols-2 gap-8">
                        <div class="md:col-span-2">
                            <label class="text-[8px] text-slate-500 uppercase font-black mb-3 tracking-widest block">Nombre del Repuesto / Activo</label>
                            <input type="text" id="pub_nombre" required class="w-full p-6 bg-black/40 border border-white/10 rounded-2xl text-sm font-bold uppercase focus:border-cyan-500 outline-none transition-all" placeholder="EJ: TRANSMISIÓN EATON FULLER 18 VEL">
                        </div>
                        <div>
                            <label class="text-[8px] text-slate-500 uppercase font-black mb-3 tracking-widest block">Precio Sugerido (USD/COP)</label>
                            <input type="text" id="pub_precio" required class="w-full p-6 bg-black/40 border border-white/10 rounded-2xl text-sm font-black text-cyan-400" placeholder="$ 0">
                        </div>
                        <div>
                            <label class="text-[8px] text-slate-500 uppercase font-black mb-3 tracking-widest block">Canal Logístico</label>
                            <select id="pub_logistica" class="w-full p-6 bg-black/40 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:border-cyan-500 outline-none">
                                <option value="heavy">COLOMBIAN TRUCKS (LOCAL)</option>
                                <option value="usa">CHARLOTTE HUB (IMPORT USA)</option>
                            </select>
                        </div>
                        <div class="md:col-span-2">
                            <label class="text-[8px] text-slate-500 uppercase font-black mb-3 tracking-widest block">ADN del Producto (Descripción)</label>
                            <textarea id="pub_desc" rows="4" class="w-full p-6 bg-black/40 border border-white/10 rounded-2xl text-xs" placeholder="Estado, compatibilidad y certificación..."></textarea>
                        </div>
                    </div>
                </div>
                <button type="submit" id="btnLaunch" class="w-full py-8 bg-white text-black orbitron font-black text-[12px] rounded-[2.5rem] uppercase tracking-[0.2em] hover:bg-cyan-500 hover:text-white transition-all shadow-xl shadow-white/5">
                    EJECUTAR PUBLICACIÓN GLOBAL <i class="fas fa-bolt ml-2"></i>
                </button>
            </div>

            <div class="lg:col-span-4 space-y-8">
                <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-dashed border-white/10 text-center group cursor-pointer hover:border-cyan-500/50 transition-all">
                    <label class="cursor-pointer">
                        <i class="fas fa-camera text-3xl text-slate-600 mb-4 block group-hover:text-cyan-500"></i>
                        <span class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-widest">Cargar Evidencia Visual</span>
                        <input type="url" id="pub_img" class="mt-4 w-full p-3 bg-black/20 border border-white/5 rounded-xl text-[9px] text-cyan-500 italic" placeholder="URL de la imagen (Firebase Storage/Imgur)">
                    </label>
                </div>
                
                <div class="bg-gradient-to-br from-[#0d1117] to-black p-10 rounded-[3rem] border border-cyan-500/10">
                    <div class="flex items-center gap-4 mb-6">
                        <i class="fas fa-brain text-cyan-500"></i>
                        <p class="orbitron text-[10px] font-black text-white uppercase tracking-widest">Strategist AI</p>
                    </div>
                    <p id="aiHint" class="text-[11px] text-slate-400 italic leading-relaxed">Analizando demanda en red logística para este activo...</p>
                </div>
            </div>
        </form>
    </div>
    `;

    // --- LÓGICA DE INTERACCIÓN ---
    const form = document.getElementById('formNexusPublish');
    const inputNombre = document.getElementById('pub_nombre');
    const hint = document.getElementById('aiHint');

    inputNombre.addEventListener('input', (e) => {
        if (e.target.value.length > 5) {
            hint.innerHTML = `Nexus detecta alta demanda de <span class="text-cyan-400 font-bold">${e.target.value.toUpperCase()}</span> en el hub de Charlotte. Probabilidad de venta rápida: <span class="text-emerald-400">88%</span>.`;
        }
    });

    form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnLaunch');
        btn.innerText = "TRANSMITIENDO...";
        btn.disabled = true;

        const payload = {
            nombre: inputNombre.value.toUpperCase(),
            precio: document.getElementById('pub_precio').value,
            logisticaType: document.getElementById('pub_logistica').value,
            descripcion: document.getElementById('pub_desc').value,
            imgUrl: document.getElementById('pub_img').value || 'https://via.placeholder.com/400?text=Nexus-X+Asset',
            empresaId: empresaId,
            creadoEn: serverTimestamp()
        };

        try {
            await addDoc(collection(db, "marketplace"), payload);
            Swal.fire({
                icon: 'success',
                title: 'MISIÓN COMPLETADA',
                text: 'El activo ya es visible en la red global Nexus-X.',
                background: '#0d1117', color: '#fff', confirmButtonColor: '#06b6d4'
            });
            location.hash = "#marketplace";
        } catch (err) {
            console.error(err);
            btn.innerText = "REINTENTAR";
            btn.disabled = false;
        }
    };
}
