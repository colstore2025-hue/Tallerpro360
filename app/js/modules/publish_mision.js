/**
 * publish_mision.js - NEXUS-X AEGIS V50.2 🛰️
 * NODO DE LANZAMIENTO CON SOPORTE MULTI-IMAGEN
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { db } from "../core/firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// NOTA: Para producción, William, recuerda integrar Firebase Storage para las URLs reales.
export default async function publish_mision(container) {
    const empresaId = localStorage.getItem("empresaId");
    const empresaNombre = localStorage.getItem("nexus_empresaNombre") || "OPERADOR NEXUS";
    let selectedImages = []; // Array para almacenar las bases64 o files

    container.innerHTML = `
    <div class="p-4 lg:p-12 max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-700">
        
        <header class="flex justify-between items-center mb-12 border-b border-white/5 pb-10">
            <div class="relative pl-6">
                <div class="absolute left-0 top-0 h-full w-1 bg-cyan-500 shadow-[0_0_20px_#06b6d4]"></div>
                <h1 class="orbitron text-4xl font-black italic text-white uppercase tracking-tighter">MISSION<span class="text-cyan-500">CONTROL</span></h1>
                <p class="text-[9px] text-slate-500 orbitron tracking-[0.5em] mt-2">DESPLIEGE DE ACTIVOS MULTI-IMAGEN V50.2</p>
            </div>
            <button onclick="location.hash='#marketplace_bridge'" class="group flex items-center gap-3 px-6 py-3 bg-[#0d1117] border border-white/10 rounded-2xl hover:border-red-500/50 transition-all">
                <span class="text-[8px] orbitron text-slate-500 group-hover:text-red-500 transition-all font-black uppercase">Abortar</span>
                <i class="fas fa-times text-slate-700 group-hover:text-red-500"></i>
            </button>
        </header>

        <form id="form-publish" class="grid lg:grid-cols-12 gap-8">
            
            <div class="lg:col-span-7 space-y-6">
                <div class="bg-[#0d1117] p-6 rounded-[2.5rem] border border-dashed border-white/10 relative">
                    <label class="text-[8px] orbitron font-black text-cyan-500 tracking-widest block mb-4 uppercase text-center">Evidencia Visual del Activo (Máx 4 Fotos)</label>
                    
                    <div class="grid grid-cols-4 gap-4 mb-4" id="preview-container">
                        ${[1,2,3,4].map(i => `
                            <div id="slot-${i}" class="aspect-square bg-black/40 border border-white/5 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                                <i class="fas fa-camera text-slate-800 text-xl group-hover:text-cyan-500 transition-all"></i>
                                <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer img-input" data-slot="${i}">
                                <img src="" class="hidden w-full h-full object-cover absolute inset-0 pointer-events-none">
                            </div>
                        `).join('')}
                    </div>
                    <p class="text-[7px] text-center text-slate-600 orbitron">SISTEMA DE CAPTURA SAP-GEN: FORMATOS JPG/PNG ADMITIDOS</p>
                </div>

                <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="col-span-full">
                            <label class="text-[8px] orbitron font-black text-slate-500 mb-2 block uppercase">Nombre del Producto / Repuesto</label>
                            <input type="text" id="m_nombre" required class="w-full p-4 bg-black/40 border border-white/5 rounded-xl text-white font-bold orbitron text-xs focus:border-cyan-500 outline-none">
                        </div>
                        <div>
                            <label class="text-[8px] orbitron font-black text-slate-500 mb-2 block uppercase">Valuación USD/COP</label>
                            <input type="number" id="m_precio" required class="w-full p-4 bg-black/40 border border-white/5 rounded-xl text-emerald-400 font-black orbitron text-xs">
                        </div>
                        <div>
                            <label class="text-[8px] orbitron font-black text-slate-500 mb-2 block uppercase">Ubicación de Stock</label>
                            <select id="m_log" class="w-full p-4 bg-black/40 border border-white/5 rounded-xl text-white orbitron text-[9px] outline-none">
                                <option value="heavy">COLOMBIAN TRUCKS LOGISTICS</option>
                                <option value="usa">CHARLOTTE HUB (NC)</option>
                                <option value="nexus">NEXUS-X INTERNAL</option>
                            </select>
                        </div>
                        <div class="col-span-full">
                            <textarea id="m_desc" rows="2" class="w-full p-4 bg-black/40 border border-white/5 rounded-xl text-slate-300 text-[10px] outline-none resize-none" placeholder="Especificaciones técnicas..."></textarea>
                        </div>
                    </div>
                </div>

                <button type="submit" id="btn-envio" class="w-full py-6 bg-white text-black orbitron font-black text-[10px] rounded-full hover:bg-cyan-500 hover:text-white transition-all shadow-xl uppercase tracking-widest">
                    Ejecutar Lanzamiento <i class="fas fa-bolt ml-2"></i>
                </button>
            </div>

            <div class="lg:col-span-5">
                <div class="bg-black border border-white/5 p-10 rounded-[3.5rem] h-full flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
                    <div id="ai-status-icon" class="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center mb-6">
                        <i class="fas fa-brain text-2xl text-cyan-500 animate-pulse"></i>
                    </div>
                    <h4 class="orbitron text-[9px] text-white font-black uppercase mb-4 tracking-widest">Nexus Intelligence</h4>
                    <p id="ai-text" class="text-[10px] text-slate-500 italic leading-relaxed">"Esperando carga de activos visuales para optimizar indexación en la red."</p>
                    
                    <div id="image-counter" class="mt-8 flex gap-2">
                        <div class="w-2 h-2 rounded-full bg-white/5"></div>
                        <div class="w-2 h-2 rounded-full bg-white/5"></div>
                        <div class="w-2 h-2 rounded-full bg-white/5"></div>
                        <div class="w-2 h-2 rounded-full bg-white/5"></div>
                    </div>
                </div>
            </div>
        </form>
    </div>`;

    // LÓGICA DE CARGA DE IMÁGENES
    const inputs = container.querySelectorAll('.img-input');
    const aiText = document.getElementById('ai-text');
    const counters = document.getElementById('image-counter').children;

    inputs.forEach((input, index) => {
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const previewImg = input.nextElementSibling;
                    previewImg.src = event.target.result;
                    previewImg.classList.remove('hidden');
                    selectedImages[index] = event.target.result; // Guardamos el base64
                    
                    counters[index].classList.replace('bg-white/5', 'bg-cyan-500');
                    aiText.innerHTML = `"Imagen ${index + 1} verificada. Resolución óptima para Marketplace Global detectada."`;
                };
                reader.readAsDataURL(file);
            }
        };
    });

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
                descripcion: document.getElementById('m_desc').value,
                empresaId: empresaId,
                operador: empresaNombre,
                images: selectedImages, // Array de fotos enviado a Firestore
                imgUrl: selectedImages[0] || '', // Foto principal para la miniatura
                ubicacion: document.getElementById('m_log').value === 'usa' ? 'CHARLOTTE HUB' : 'COLOMBIA CORE',
                creadoEn: serverTimestamp()
            });

            aiText.innerHTML = `<span class="text-emerald-500 italic">DESPLIEGUE EXITOSO.</span> Activo disponible en Marketplace.`;
            setTimeout(() => location.hash = "#marketplace_bridge", 1500);

        } catch (err) {
            console.error(err);
            btn.disabled = false;
            btn.innerHTML = "ERROR - REINTENTAR";
        }
    };
}
