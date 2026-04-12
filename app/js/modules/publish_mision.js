/**
 * publish_mision.js - NEXUS-X V6.0 🛰️
 * Módulo de Despliegue de Activos al Marketplace
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function publishMision(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in slide-in-from-bottom-10 duration-700 pb-40">
            
            <header class="max-w-4xl mx-auto mb-12 flex justify-between items-end border-b border-cyan-500/10 pb-8">
                <div>
                    <h1 class="orbitron text-4xl font-black italic uppercase tracking-tighter">
                        NUEVA <span class="text-cyan-400">MISIÓN</span> COMERCIAL
                    </h1>
                    <p class="text-[9px] orbitron tracking-[0.5em] text-slate-500 uppercase mt-2 font-black">Carga de Activos a la Red Global</p>
                </div>
                <i class="fas fa-upload text-2xl text-cyan-500/20"></i>
            </header>

            <div class="max-w-4xl mx-auto bg-[#0d1117] p-8 md:p-12 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30"></div>
                
                <form id="formPublish" class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    <div class="md:col-span-2 space-y-2">
                        <label class="orbitron text-[9px] font-black text-cyan-500 uppercase tracking-widest">Nombre del Activo / Repuesto</label>
                        <input type="text" id="pub_nombre" required placeholder="EJ: TURBO GARRETT GEN 2 - CUMMINS" 
                               class="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold uppercase focus:border-cyan-500 outline-none transition-all">
                    </div>

                    <div class="space-y-2">
                        <label class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-widest">Categoría del Sistema</label>
                        <select id="pub_categoria" class="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold uppercase focus:border-cyan-500 outline-none appearance-none">
                            <option value="MOTOR">Motor / Performance</option>
                            <option value="ECU">ECUs & Software</option>
                            <option value="TRANSMISION">Transmisión</option>
                            <option value="HIDRAULICO">Sistemas Hidráulicos</option>
                            <option value="HERRAMIENTA">Herramientas Especializadas</option>
                        </select>
                    </div>

                    <div class="space-y-2">
                        <label class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-widest">Valor de Intercambio</label>
                        <input type="text" id="pub_precio" required placeholder="$ 0.00" 
                               class="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold orbitron italic focus:border-cyan-500 outline-none">
                    </div>

                    <div class="space-y-2">
                        <label class="orbitron text-[9px] font-black text-orange-500 uppercase tracking-widest italic">Punto de Origen</label>
                        <select id="pub_logistica" class="w-full bg-black/40 border border-orange-500/20 rounded-2xl p-5 text-sm font-bold uppercase focus:border-orange-500 outline-none">
                            <option value="col">Ibagué / Local (COL)</option>
                            <option value="usa">Charlotte / Import (USA)</option>
                        </select>
                    </div>

                    <div class="space-y-2">
                        <label class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-widest">Enlace de Imagen (URL)</label>
                        <input type="url" id="pub_img" placeholder="https://..." 
                               class="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold focus:border-cyan-500 outline-none">
                    </div>

                    <div class="md:col-span-2 space-y-2">
                        <label class="orbitron text-[9px] font-black text-slate-500 uppercase tracking-widest">Especificaciones Técnicas</label>
                        <textarea id="pub_desc" rows="3" placeholder="Detalles de compatibilidad, SKU o estado..."
                                  class="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold focus:border-cyan-500 outline-none"></textarea>
                    </div>

                    <div class="md:col-span-2 pt-6">
                        <button type="submit" id="btnSubmitPublish" class="w-full py-6 bg-cyan-500 text-black orbitron text-[11px] font-black uppercase tracking-[0.4em] rounded-2xl hover:bg-white transition-all shadow-xl shadow-cyan-500/10">
                            Confirmar Despliegue
                        </button>
                    </div>
                </form>
            </div>
        </div>
        `;

        document.getElementById('formPublish').addEventListener('submit', ejecutarCarga);
    };

    const ejecutarCarga = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSubmitPublish');
        btn.innerText = "TRANSMITIENDO...";
        btn.disabled = true;

        const data = {
            nombre: document.getElementById('pub_nombre').value,
            categoria: document.getElementById('pub_categoria').value,
            precio: document.getElementById('pub_precio').value,
            logisticaType: document.getElementById('pub_logistica').value,
            imgUrl: document.getElementById('pub_img').value || 'https://via.placeholder.com/400?text=Nexus-X',
            descripcion: document.getElementById('pub_desc').value,
            empresaId: empresaId,
            creadoEn: serverTimestamp()
        };

        try {
            await addDoc(collection(db, "marketplace"), data);
            
            Swal.fire({
                title: 'MISIÓN EXITOSA',
                text: 'El activo ha sido desplegado en la red global.',
                icon: 'success',
                background: '#0d1117',
                color: '#fff',
                confirmButtonColor: '#06b6d4'
            });

            // Opcional: Redirigir al marketplace después de publicar
            // navegar('market'); 

        } catch (error) {
            console.error("Error Nexus-X:", error);
            btn.innerText = "REINTENTAR";
            btn.disabled = false;
        }
    };

    renderLayout();
}
