/**
 * publish_mision.js - NEXUS-X AEGIS V50.4 🛰️
 * LANZADOR MULTI-PLATAFORMA CON COMPRESIÓN DE ACTIVOS
 */
import { db } from "../core/firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function publish_mision(container) {
    const empresaNombre = localStorage.getItem("nexus_empresaNombre") || "OPERADOR NEXUS";
    const empresaId = localStorage.getItem("empresaId") || "NEXUS_GENERIC_ID";
    let selectedImages = [];

    container.innerHTML = `
    <div class="p-4 lg:p-12 max-w-7xl mx-auto animate-in fade-in duration-700">
        <header class="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-white/5 pb-8 gap-4">
            <div>
                <h1 class="orbitron text-3xl font-black text-white uppercase tracking-tighter">MISSION<span class="text-cyan-500">CONTROL</span></h1>
                <p class="text-[8px] text-slate-500 orbitron tracking-[0.4em]">SISTEMA DE DESPLIEGUE DE ACTIVOS V50.4</p>
            </div>
            <div class="flex gap-2">
                <button type="button" onclick="window.open('https://www.amazon.com/s?k=' + document.getElementById('m_nombre').value)" class="px-4 py-2 bg-[#131921] border border-white/10 rounded-xl text-[8px] orbitron text-amber-500 hover:scale-105 transition-all">
                    <i class="fab fa-amazon mr-1"></i> CHECK AMAZON
                </button>
                <button type="button" onclick="window.open('https://listado.mercadolibre.com.co/' + document.getElementById('m_nombre').value)" class="px-4 py-2 bg-[#fff159] border border-black/5 rounded-xl text-[8px] orbitron text-black font-bold hover:scale-105 transition-all">
                    <i class="fas fa-handshake mr-1"></i> MERCADO LIBRE
                </button>
            </div>
        </header>

        <form id="form-publish" class="grid lg:grid-cols-12 gap-8">
            <div class="lg:col-span-7 space-y-6">
                <div class="bg-[#0d1117] p-6 rounded-[2rem] border border-dashed border-cyan-500/30">
                    <p class="orbitron text-[7px] text-cyan-500 mb-4 tracking-widest text-center">EVIDENCIA VISUAL DEL ACTIVO (MÁX 4 FOTOS)</p>
                    <div class="grid grid-cols-4 gap-3">
                        ${[0,1,2,3].map(i => `
                            <div class="aspect-square bg-black/40 border border-white/5 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                                <i class="fas fa-plus text-slate-700 group-hover:text-cyan-500"></i>
                                <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer img-input" data-idx="${i}">
                                <img id="prev-${i}" class="hidden w-full h-full object-cover absolute inset-0">
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="bg-[#0d1117] p-8 rounded-[2rem] border border-white/5 space-y-4">
                    <div class="space-y-2">
                        <label class="orbitron text-[7px] text-slate-500 ml-2">IDENTIFICACIÓN DEL REPUESTO</label>
                        <input type="text" id="m_nombre" required placeholder="EJ: TRANSMISIÓN EATON FULLER 16918" 
                               class="w-full p-4 bg-black border border-white/10 rounded-2xl text-white orbitron text-xs focus:border-cyan-500 outline-none uppercase">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <label class="orbitron text-[7px] text-slate-500 ml-2">VALUACIÓN USD/COP</label>
                            <input type="number" id="m_precio" required placeholder="0.00" 
                                   class="w-full p-4 bg-black border border-white/10 rounded-2xl text-emerald-400 orbitron text-xs outline-none">
                        </div>
                        <div class="space-y-2">
                            <label class="orbitron text-[7px] text-slate-500 ml-2">NODO DE DESTINO</label>
                            <select id="m_target" class="w-full p-4 bg-black border border-white/10 rounded-2xl text-white orbitron text-[9px] outline-none">
                                <option value="nexus">RED INTERNA NEXUS-X</option>
                                <option value="charlotte">CHARLOTTE HUB (NC REQUEST)</option>
                                <option value="facebook">MARKETPLACE FACEBOOK</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button type="submit" id="btn-publish" class="w-full py-6 bg-cyan-500 text-white orbitron font-black text-[11px] rounded-[2rem] hover:bg-white hover:text-black transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                    EJECUTAR PUBLICACIÓN MULTI-NODO <i class="fas fa-rocket ml-2"></i>
                </button>
            </div>

            <div class="lg:col-span-5 flex flex-col gap-6">
                <div class="bg-gradient-to-b from-[#0d1117] to-black border border-white/5 p-10 rounded-[3rem] text-center relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-full h-1 bg-cyan-500/20"></div>
                    <i class="fas fa-brain text-4xl text-cyan-500 mb-6 animate-pulse"></i>
                    <h3 class="orbitron text-[11px] text-white mb-4 tracking-[0.3em]">NEXUS INTELLIGENCE</h3>
                    <p id="radar-status" class="text-[10px] text-slate-400 leading-relaxed italic font-light">
                        "Esperando datos del activo para iniciar escaneo de compatibilidad en la red global..."
                    </p>
                </div>
            </div>
        </form>
    </div>`;

    // --- LÓGICA DE PROCESAMIENTO ---

    const inputs = container.querySelectorAll('.img-input');
    inputs.forEach(input => {
        input.onchange = async (e) => {
            const file = e.target.files[0];
            const idx = input.dataset.idx;
            if (file) {
                // Compresión básica usando Canvas para no saturar Firestore
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 600;
                        const scale = MAX_WIDTH / img.width;
                        canvas.width = MAX_WIDTH;
                        canvas.height = img.height * scale;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                        document.getElementById(`prev-${idx}`).src = compressedBase64;
                        document.getElementById(`prev-${idx}`).classList.remove('hidden');
                        selectedImages[idx] = compressedBase64;
                        
                        document.getElementById('radar-status').innerText = `"Imagen ${parseInt(idx)+1} verificada. Resolución óptima para Marketplace Global detectada."`;
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
    });

    document.getElementById('form-publish').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-publish');
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> TRANSMITIENDO...`;
        btn.disabled = true;

        try {
            const dataActivo = {
                nombre: document.getElementById('m_nombre').value.toUpperCase(),
                precio: document.getElementById('m_precio').value,
                target: document.getElementById('m_target').value,
                images: selectedImages.filter(img => img !== null), // Limpiar vacíos
                imgUrl: selectedImages[0] || '', // Foto principal para el bridge
                creadoEn: serverTimestamp(),
                operador: empresaNombre,
                empresaId: empresaId, // Crucial para la edición en el bridge
                ciudad: localStorage.getItem("taller_ciudad") || "IBAGUE"
            };

            await addDoc(collection(db, "marketplace"), dataActivo);

            if(dataActivo.target === 'facebook') {
                window.open('https://www.facebook.com/marketplace/create/item');
            }
            
            // Éxito: Volver al puente de mercado
            location.hash = "#marketplace_bridge";
        } catch(err) { 
            console.error("Error Nexus-X:", err);
            btn.innerHTML = `ERROR - REINTENTAR`;
            btn.disabled = false;
        }
    };
}
