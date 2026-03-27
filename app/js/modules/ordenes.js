/**
 * ordenes.js - TallerPRO360 NEXUS-CORE V15.0 🛰️
 * PROTOCOLO TALLER INTELIGENTE: Recepción -> Diagnóstico IA -> Entrega
 * Generación 2030: Hiper-Conectividad & Automatización Total
 */
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { generarPDFOrden, enviarWhatsAppOrden } from "../services/printService.js";

export default async function ordenes(container, state) {
    // 🛡️ REPARACIÓN DE ÓRBITA (Igual que en config.js para Super Admin)
    let empresaId = state?.empresaId || localStorage.getItem("empresaId");
    const uid = state?.uid || localStorage.getItem("uid");
    let itemsOrden = [];

    // --- BINDING GLOBAL PARA BOTONES DINÁMICOS ---
    window.removeItem = (idx) => {
        itemsOrden.splice(idx, 1);
        actualizarTablaItems();
    };

    window.ejecutarImpresion = (data) => generarPDFOrden(data);
    window.compartirWhatsApp = (data) => enviarWhatsAppOrden(data);
    
    // Función para cambiar de fase (Recepción -> Diagnóstico -> Reparación -> Entrega)
    window.cambiarFase = async (ordenId, nuevaFase) => {
        const docRef = doc(db, "empresas", empresaId, "ordenes", ordenId);
        await updateDoc(docRef, { estado: nuevaFase, ultimaActualizacion: serverTimestamp() });
        hablar(`Orden actualizada a fase ${nuevaFase}`);
        renderBase();
    };

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-40">
            <header class="flex flex-col md:flex-row justify-between items-center gap-8 mb-16 px-4">
                <div class="relative">
                    <h1 class="orbitron text-3xl font-black text-white italic tracking-tighter uppercase">
                        NEXUS <span class="text-cyan-400">OPERATIONS</span>
                    </h1>
                    <p class="text-[8px] text-cyan-500 font-black uppercase tracking-[0.6em] mt-2 flex items-center gap-2">
                        <span class="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></span> Radar de Taller Activo v15.0
                    </p>
                </div>
                <div class="flex gap-4">
                    <button id="btnNuevaOrden" class="bg-gradient-to-r from-cyan-500 to-blue-600 text-black px-10 py-5 rounded-[2.5rem] font-black text-[11px] uppercase shadow-[0_20px_50px_rgba(6,182,212,0.3)] hover:scale-105 active:scale-95 transition-all orbitron">
                        <i class="fas fa-bolt mr-2"></i> Iniciar Recepción
                    </button>
                </div>
            </header>

            <div class="flex flex-wrap gap-3 mb-12 px-4 justify-center md:justify-start">
                <button class="phase-btn active" data-fase="EN_TALLER">📡 Recepción</button>
                <button class="phase-btn" data-fase="DIAGNOSTICO">🧠 Diagnóstico IA</button>
                <button class="phase-btn" data-fase="REPARACION">🔧 Reparación</button>
                <button class="phase-btn" data-fase="LISTO">✅ Listo / Entrega</button>
            </div>

            <div id="workspace" class="hidden mb-16 transform transition-all duration-700"></div>

            <div id="listaOrdenes" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                <div class="col-span-full flex flex-col items-center py-32 opacity-30">
                    <i class="fas fa-satellite-dish text-cyan-500 text-6xl animate-bounce mb-8"></i>
                    <p class="orbitron text-[10px] font-black uppercase tracking-[0.8em]">Sincronizando Misiones...</p>
                </div>
            </div>
        </div>
        `;
        
        document.getElementById("btnNuevaOrden").onclick = abrirFormularioOrden;
        
        // Manejo de Tabs de Fase
        document.querySelectorAll('.phase-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.phase-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                cargarOrdenes(btn.dataset.fase);
            };
        });

        cargarOrdenes("EN_TALLER");
    };

    const abrirFormularioOrden = () => {
        const workspace = document.getElementById("workspace");
        workspace.classList.remove("hidden");
        workspace.scrollIntoView({ behavior: 'smooth' });
        itemsOrden = [];

        workspace.innerHTML = `
        <div class="bg-black/60 backdrop-blur-3xl p-10 rounded-[4rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative overflow-hidden animate-in zoom-in-95 duration-500">
            <h2 class="orbitron text-xs font-black text-cyan-400 mb-10 tracking-[0.5em] uppercase italic italic">Registro de Ingreso Estelar</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 text-left">
                <div class="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 focus-within:border-cyan-500/50 transition-all">
                    <label class="text-[8px] text-cyan-500 font-black uppercase mb-3 block orbitron italic">Placa del Vehículo</label>
                    <input id="newPlaca" class="bg-transparent border-none outline-none text-4xl font-black text-white w-full uppercase placeholder:text-slate-800" placeholder="KLO-890">
                </div>

                <div class="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 focus-within:border-cyan-500/50 transition-all">
                    <label class="text-[8px] text-slate-500 font-black uppercase mb-3 block orbitron">Propietario</label>
                    <input id="newCliente" class="bg-transparent border-none outline-none text-xl font-black text-white w-full uppercase" placeholder="NOMBRE COMPLETO">
                </div>

                <div class="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 focus-within:border-emerald-500/50 transition-all">
                    <label class="text-[8px] text-emerald-400 font-black uppercase mb-3 block orbitron italic">WhatsApp Directo</label>
                    <div class="flex items-center gap-3">
                        <span class="text-slate-600 font-black orbitron">+57</span>
                        <input id="newTel" type="number" class="bg-transparent border-none outline-none text-xl font-black text-white w-full" placeholder="3200000000">
                    </div>
                </div>
            </div>

            <div class="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-8 rounded-[3rem] border border-white/5 mb-10 relative group">
                <label class="text-[8px] text-purple-400 font-black uppercase mb-4 block orbitron italic tracking-widest">Diagnóstico Humano & IA (Dictado por Voz)</label>
                <div class="flex items-center gap-6">
                    <textarea id="newDiagnostico" rows="2" class="bg-transparent border-none outline-none text-sm font-medium text-slate-300 w-full resize-none placeholder:text-slate-700" placeholder="Describa los síntomas detectados..."></textarea>
                    <button id="btnDictar" class="w-20 h-20 rounded-full bg-red-600/10 text-red-500 border border-red-500/20 flex flex-col items-center justify-center transition-all hover:bg-red-600 hover:text-white shadow-2xl active:scale-90">
                        <i class="fas fa-microphone text-2xl mb-1"></i>
                        <span class="text-[6px] font-black uppercase">Dictar</span>
                    </button>
                </div>
            </div>

            <div class="mb-12">
                <div class="flex justify-between items-center mb-6 px-4">
                    <h3 class="orbitron text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Bitácora de Suministros</h3>
                    <button id="btnAddItem" class="text-[9px] bg-white text-black px-8 py-3 rounded-full font-black uppercase transition-all orbitron hover:bg-cyan-400">
                        + Agregar Repuesto/Labor
                    </button>
                </div>
                <div id="itemsLista" class="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[100px] p-4 bg-black/20 rounded-[3rem] border border-white/5">
                    <p class="col-span-full text-[8px] text-slate-700 italic text-center py-10 uppercase font-black tracking-widest">--- Misión sin suministros vinculados ---</p>
                </div>
            </div>

            <div class="flex flex-col md:flex-row gap-6">
                <button id="btnGuardarOrden" class="flex-[2] bg-gradient-to-r from-emerald-500 to-teal-600 text-black py-7 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(16,185,129,0.2)] active:scale-95 transition-all orbitron">
                    Sincronizar y Notificar Cliente <i class="fas fa-paper-plane ml-2"></i>
                </button>
                <button onclick="document.getElementById('workspace').classList.add('hidden')" class="flex-1 bg-white/5 text-slate-500 rounded-[2.5rem] font-black text-[10px] uppercase border border-white/5 orbitron hover:bg-red-900/20 hover:text-red-500 transition-all">
                    Abortar Misión
                </button>
            </div>
        </div>
        `;

        // Lógica de Voz (Dictado IA)
        const btnDictar = document.getElementById("btnDictar");
        btnDictar.onclick = () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) return Swal.fire("Error", "Su navegador no soporta IA de voz", "error");
            
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-CO';
            recognition.onstart = () => {
                hablar("Nexus escuchando diagnóstico.");
                btnDictar.classList.replace('bg-red-600/10', 'bg-red-600');
                btnDictar.classList.add('animate-pulse', 'text-white');
            };
            recognition.onresult = (e) => {
                const text = e.results[0][0].transcript;
                document.getElementById("newDiagnostico").value += " " + text.toUpperCase();
            };
            recognition.onend = () => {
                btnDictar.classList.replace('bg-red-600', 'bg-red-600/10');
                btnDictar.classList.remove('animate-pulse', 'text-white');
                hablar("Diagnóstico procesado.");
            };
            recognition.start();
        };

        // Agregar Ítems con SweetAlert Dark
        document.getElementById("btnAddItem").onclick = async () => {
            const { value: v } = await Swal.fire({
                title: 'VINCULAR OPERACIÓN',
                background: '#0a0f1d',
                color: '#fff',
                html: `
                    <div class="p-6 space-y-6">
                        <input id="sw-n" class="w-full bg-black/40 p-5 rounded-2xl text-white border border-white/10 outline-none orbitron text-xs" placeholder="NOMBRE DEL REPUESTO / MANO DE OBRA">
                        <div class="flex gap-4">
                            <input id="sw-p" type="number" class="flex-1 bg-black/40 p-5 rounded-2xl text-emerald-400 border border-white/10 outline-none font-black" placeholder="PRECIO $">
                            <input id="sw-c" type="number" value="1" class="w-24 bg-black/40 p-5 rounded-2xl text-white border border-white/10 outline-none text-center" placeholder="CANT">
                        </div>
                    </div>`,
                showCancelButton: true,
                confirmButtonText: 'VINCULAR',
                preConfirm: () => ({
                    nombre: document.getElementById('sw-n').value.toUpperCase(),
                    precio: Number(document.getElementById('sw-p').value),
                    cantidad: Number(document.getElementById('sw-c').value),
                    total: Number(document.getElementById('sw-p').value) * Number(document.getElementById('sw-c').value)
                })
            });
            if (v && v.nombre && v.precio) { itemsOrden.push(v); actualizarTablaItems(); }
        };

        document.getElementById("btnGuardarOrden").onclick = guardarOrdenFirestore;
    };

    const actualizarTablaItems = () => {
        const listArea = document.getElementById("itemsLista");
        if (itemsOrden.length === 0) {
            listArea.innerHTML = `<p class="col-span-full text-[8px] text-slate-700 italic text-center py-10 uppercase font-black tracking-widest">--- Misión sin suministros vinculados ---</p>`;
            return;
        }
        listArea.innerHTML = itemsOrden.map((it, idx) => `
            <div class="flex justify-between items-center bg-white/[0.03] p-5 rounded-3xl border border-white/5 hover:border-cyan-500/20 transition-all group">
                <div>
                    <p class="text-[10px] font-black text-white uppercase tracking-tight">${it.nombre}</p>
                    <p class="text-[8px] text-slate-500 font-bold uppercase mt-1">${it.cantidad} UNIDAD(ES) x $${it.precio.toLocaleString()}</p>
                </div>
                <div class="flex items-center gap-6">
                    <p class="text-xs font-black text-emerald-400 orbitron">$${it.total.toLocaleString()}</p>
                    <button class="text-red-500/50 hover:text-red-500 transition-colors" onclick="window.removeItem(${idx})"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `).join("");
    };

    const guardarOrdenFirestore = async () => {
        const btn = document.getElementById("btnGuardarOrden");
        const data = {
            placa: document.getElementById("newPlaca").value.trim().toUpperCase(),
            cliente: document.getElementById("newCliente").value.trim().toUpperCase(),
            telefono: document.getElementById("newTel").value.trim(),
            diagnostico: document.getElementById("newDiagnostico").value.trim(),
            items: itemsOrden,
            total: itemsOrden.reduce((acc, i) => acc + i.total, 0),
            estado: 'EN_TALLER', // Fase Inicial
            fechaIngreso: serverTimestamp(),
            empresaId: empresaId,
            creadoPor: uid
        };

        if (!data.placa || !data.cliente) return Swal.fire('Error', 'Placa y Cliente son obligatorios para el radar', 'error');

        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-sync fa-spin mr-2"></i> SINCRONIZANDO CON STARLINK...`;

        try {
            const docRef = await addDoc(collection(db, "empresas", empresaId, "ordenes"), data);
            
            // 🚀 AUTOMATIZACIÓN: Notificar por WhatsApp de inmediato
            if (data.telefono) {
                await enviarWhatsAppOrden({ ...data, id: docRef.id });
            }

            hablar("Misión confirmada. Reporte enviado al cliente.");
            Swal.fire({
                title: 'ÉXITO',
                text: 'Orden en órbita y cliente notificado',
                icon: 'success',
                background: '#0a0f1d',
                color: '#fff',
                confirmButtonColor: '#06b6d4'
            });
            renderBase();
        } catch (e) { 
            console.error(e); 
            btn.disabled = false;
            btn.innerHTML = "REINTENTAR SINCRONIZACIÓN";
        }
    };

    async function cargarOrdenes(fase = "EN_TALLER") {
        const listArea = document.getElementById("listaOrdenes");
        try {
            const q = query(
                collection(db, "empresas", empresaId, "ordenes"), 
                where("estado", "==", fase), 
                orderBy("fechaIngreso", "desc")
            );
            const snap = await getDocs(q);

            if (snap.empty) {
                listArea.innerHTML = `
                <div class="col-span-full py-32 text-center opacity-20">
                    <i class="fas fa-radar text-4xl mb-6 block"></i>
                    <p class="orbitron text-[10px] tracking-[0.5em] uppercase italic">Sin misiones en fase ${fase}</p>
                </div>`;
                return;
            }

            listArea.innerHTML = snap.docs.map(docSnap => {
                const o = docSnap.data();
                const id = docSnap.id;
                const oJson = JSON.stringify({ ...o, id }).replace(/'/g, "&apos;");
                
                return `
                <div class="bg-white/[0.02] backdrop-blur-2xl p-8 rounded-[3.5rem] border border-white/5 hover:border-cyan-500/40 transition-all duration-500 group relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-6">
                        <span class="text-[6px] bg-cyan-500/10 text-cyan-500 px-3 py-1 rounded-full border border-cyan-500/20 font-black orbitron uppercase tracking-widest">${fase}</span>
                    </div>
                    
                    <div class="flex gap-6 mb-8">
                        <div class="w-16 h-16 bg-black rounded-3xl flex flex-col items-center justify-center border border-white/10 shadow-inner group-hover:border-cyan-500/50 transition-all">
                            <span class="text-[6px] text-slate-500 font-black uppercase mb-1">PLACA</span>
                            <span class="text-sm text-white font-black orbitron">${o.placa}</span>
                        </div>
                        <div class="flex-1">
                            <h3 class="text-white text-sm font-black uppercase tracking-tight mb-1">${o.cliente}</h3>
                            <p class="text-[8px] text-slate-500 font-bold italic line-clamp-2 leading-relaxed uppercase">${o.diagnostico || 'Pendiente de diagnóstico'}</p>
                        </div>
                    </div>

                    <div class="flex justify-between items-center mb-8 bg-black/40 p-4 rounded-2xl border border-white/5">
                        <span class="text-[8px] text-slate-500 font-black uppercase orbitron">Inversión Total</span>
                        <span class="text-lg font-black text-cyan-400 orbitron">$${o.total.toLocaleString()}</span>
                    </div>

                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <button onclick='window.ejecutarImpresion(${oJson})' class="bg-white/5 py-4 rounded-2xl text-[8px] font-black uppercase border border-white/5 hover:bg-white hover:text-black transition-all orbitron">
                            <i class="fas fa-file-pdf mr-2"></i> PDF
                        </button>
                        <button onclick='window.compartirWhatsApp(${oJson})' class="bg-emerald-500/10 py-4 rounded-2xl text-[8px] text-emerald-500 font-black uppercase border border-emerald-500/10 hover:bg-emerald-500 hover:text-black transition-all orbitron">
                            <i class="fab fa-whatsapp mr-2 text-xs"></i> Enviar
                        </button>
                    </div>

                    <div class="pt-4 border-t border-white/5">
                        <select onchange="window.cambiarFase('${id}', this.value)" class="w-full bg-transparent text-[8px] font-black text-slate-500 uppercase orbitron outline-none cursor-pointer text-center hover:text-cyan-400">
                            <option value="" disabled selected>Cambiar Etapa de Misión</option>
                            <option value="EN_TALLER">📡 Recepción</option>
                            <option value="DIAGNOSTICO">🧠 Diagnóstico</option>
                            <option value="REPARACION">🔧 Reparación</option>
                            <option value="LISTO">✅ Finalizar</option>
                        </select>
                    </div>
                </div>`;
            }).join("");
        } catch (e) { console.error(e); }
    }

    renderBase();
}
