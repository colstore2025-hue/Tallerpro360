/**
 * publish_mision.js - NEXUS-X AEGIS V50.3 🛰️
 * LANZADOR MULTI-PLATAFORMA & CONSULTA DE MERCADO
 */
import { db } from "../core/firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function publish_mision(container) {
    const empresaNombre = localStorage.getItem("nexus_empresaNombre") || "OPERADOR NEXUS";
    let selectedImages = [];

    container.innerHTML = `
    <div class="p-4 lg:p-12 max-w-7xl mx-auto animate-in fade-in duration-700">
        <header class="flex justify-between items-center mb-10 border-b border-white/5 pb-8">
            <div>
                <h1 class="orbitron text-3xl font-black text-white uppercase tracking-tighter">MISSION<span class="text-cyan-500">CONTROL</span></h1>
                <p class="text-[8px] text-slate-500 orbitron tracking-[0.4em]">LANZAMIENTO Y CONSULTA GLOBAL</p>
            </div>
            <div class="flex gap-2">
                <button onclick="window.open('https://www.amazon.com/s?k=' + document.getElementById('m_nombre').value)" class="px-4 py-2 bg-black border border-white/10 rounded-xl text-[8px] orbitron text-amber-500 hover:bg-amber-500 hover:text-black transition-all">
                    <i class="fab fa-amazon mr-1"></i> CHECK AMAZON
                </button>
                <button onclick="window.open('https://listado.mercadolibre.com.co/' + document.getElementById('m_nombre').value)" class="px-4 py-2 bg-black border border-white/10 rounded-xl text-[8px] orbitron text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all">
                    <i class="fas fa-handshake mr-1"></i> CHECK M.LIBRE
                </button>
            </div>
        </header>

        <form id="form-publish" class="grid lg:grid-cols-12 gap-8">
            <div class="lg:col-span-7 space-y-6">
                <div class="bg-[#0d1117] p-6 rounded-[2rem] border border-dashed border-white/10">
                    <div class="grid grid-cols-4 gap-3 mb-4">
                        ${[1,2,3,4].map(i => `
                            <div class="aspect-square bg-black/40 border border-white/5 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                                <i class="fas fa-camera text-slate-800 text-lg group-hover:text-cyan-500 transition-all"></i>
                                <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer img-input" data-slot="${i}">
                                <img src="" class="hidden w-full h-full object-cover absolute inset-0">
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="bg-[#0d1117] p-8 rounded-[2rem] border border-white/5 space-y-4">
                    <input type="text" id="m_nombre" required placeholder="NOMBRE DEL REPUESTO / NÚMERO DE PARTE" 
                           class="w-full p-4 bg-black border border-white/10 rounded-xl text-white orbitron text-xs focus:border-cyan-500 outline-none">
                    
                    <div class="grid grid-cols-2 gap-4">
                        <input type="number" id="m_precio" placeholder="PRECIO ESTIMADO" class="p-4 bg-black border border-white/10 rounded-xl text-emerald-400 orbitron text-xs">
                        <select id="m_target" class="p-4 bg-black border border-white/10 rounded-xl text-white orbitron text-[9px]">
                            <option value="nexus">RED INTERNA NEXUS-X</option>
                            <option value="facebook">MARKETPLACE FACEBOOK</option>
                            <option value="charlotte">CHARLOTTE HUB (NC REQUEST)</option>
                        </select>
                    </div>
                </div>

                <button type="submit" class="w-full py-6 bg-cyan-500 text-white orbitron font-black text-[10px] rounded-full hover:bg-white hover:text-black transition-all shadow-xl uppercase">
                    EJECUTAR PUBLICACIÓN MULTI-NODO <i class="fas fa-rocket ml-2"></i>
                </button>
            </div>

            <div class="lg:col-span-5 bg-black border border-white/5 p-8 rounded-[3rem] text-center">
                <i class="fas fa-brain text-3xl text-cyan-500 mb-6 animate-pulse"></i>
                <h3 class="orbitron text-[10px] text-white mb-4 tracking-widest">NEXUS RADAR</h3>
                <p class="text-[10px] text-slate-500 leading-relaxed italic">
                    "Detectando proveedores en **Quindío y cercanías**. Al publicar, notificaremos a los talleres aliados para cruzado de inventarios."
                </p>
                <div class="mt-8 pt-8 border-t border-white/5 space-y-2">
                    <div class="flex justify-between text-[7px] orbitron text-slate-600 uppercase">
                        <span>Status:</span> <span class="text-emerald-500">READY TO SCAN</span>
                    </div>
                </div>
            </div>
        </form>
    </div>`;

    // Manejo de imágenes (Base64 para Firestore)
    const inputs = container.querySelectorAll('.img-input');
    inputs.forEach((input, index) => {
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    input.nextElementSibling.src = event.target.result;
                    input.nextElementSibling.classList.remove('hidden');
                    selectedImages[index] = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
    });

    document.getElementById('form-publish').onsubmit = async (e) => {
        e.preventDefault();
        // Lógica de guardado en Firestore para que la Red Nexus lo vea
        try {
            await addDoc(collection(db, "marketplace"), {
                nombre: document.getElementById('m_nombre').value.toUpperCase(),
                precio: document.getElementById('m_precio').value,
                target: document.getElementById('m_target').value,
                images: selectedImages,
                imgUrl: selectedImages[0] || '',
                creadoEn: serverTimestamp(),
                operador: empresaNombre
            });

            // Si el target es Facebook, redirigimos
            if(document.getElementById('m_target').value === 'facebook') {
                window.open('https://www.facebook.com/marketplace/create/item');
            }
            
            location.hash = "#marketplace_bridge";
        } catch(err) { console.error(err); }
    };
}
