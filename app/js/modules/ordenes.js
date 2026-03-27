/**
 * ordenes.js - TallerPRO360 NEXUS-CORE V7.0 🛰️
 * Generación 2030: Hiper-Conectividad & Documentación PDF
 */
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { generarPDFOrden, enviarWhatsAppOrden } from "../services/printService.js";

export default async function ordenes(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    let itemsOrden = []; 

    // --- BINDING GLOBAL PARA BOTONES DINÁMICOS ---
    window.removeItem = (idx) => {
        itemsOrden.splice(idx, 1);
        actualizarTablaItems();
    };

    window.ejecutarImpresion = (data) => generarPDFOrden(data);
    window.compartirWhatsApp = (data) => enviarWhatsAppOrden(data);

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-40">
            <header class="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                <div>
                    <h1 class="orbitron text-2xl font-black text-white italic tracking-tighter uppercase">
                        OPERACIONES / <span class="text-cyan-400">ÓRDENES</span>
                    </h1>
                    <p class="text-[7px] text-slate-500 font-black uppercase tracking-[0.5em] mt-1 italic">Protocolo Nexus-X Starlink v7.0</p>
                </div>
                <button id="btnNuevaOrden" class="bg-cyan-500 text-black px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase shadow-[0_15px_40px_rgba(0,242,255,0.25)] active:scale-95 transition-all orbitron">
                    <i class="fas fa-plus-circle mr-2"></i> Abrir Nueva Misión
                </button>
            </header>

            <div id="workspace" class="hidden mb-12 transform transition-all duration-700"></div>

            <div id="listaOrdenes" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="col-span-full flex flex-col items-center py-24 opacity-20">
                    <div class="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p class="orbitron text-[9px] font-black uppercase tracking-[0.6em]">Sincronizando con Nexus-X...</p>
                </div>
            </div>
        </div>
        `;
        
        document.getElementById("btnNuevaOrden").onclick = abrirFormularioOrden;
        cargarOrdenes();
    };

    const abrirFormularioOrden = () => {
        const workspace = document.getElementById("workspace");
        workspace.classList.remove("hidden");
        itemsOrden = [];

        workspace.innerHTML = `
        <div class="bg-white/[0.03] backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 text-left relative z-10">
                <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <label class="text-[7px] text-cyan-400 font-black uppercase mb-2 block orbitron">Placa</label>
                    <input id="newPlaca" class="bg-transparent border-none outline-none text-xl font-black text-white w-full uppercase" placeholder="ABC-123">
                </div>
                <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <label class="text-[7px] text-slate-500 font-black uppercase mb-2 block orbitron">Cliente</label>
                    <input id="newCliente" class="bg-transparent border-none outline-none text-sm font-black text-white w-full uppercase" placeholder="NOMBRE">
                </div>
                <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <label class="text-[7px] text-emerald-400 font-black uppercase mb-2 block orbitron italic">WhatsApp (Sin +57)</label>
                    <input id="newTel" type="tel" class="bg-transparent border-none outline-none text-sm font-black text-white w-full" placeholder="3001234567">
                </div>
                <div class="bg-black/40 p-4 rounded-2xl border border-white/5 relative">
                    <label class="text-[7px] text-slate-500 font-black uppercase mb-2 block orbitron italic">Dictado IA</label>
                    <div class="flex items-center gap-2">
                        <input id="newDiagnostico" class="bg-transparent border-none outline-none text-[10px] font-medium text-slate-400 w-full" placeholder="Dictar...">
                        <button id="btnDictar" class="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center transition-all shadow-inner">
                            <i class="fas fa-microphone text-[10px]"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div class="mb-8 relative z-10">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="orbitron text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Suministros & Operaciones</h3>
                    <button id="btnAddItem" class="text-[8px] bg-cyan-500/10 hover:bg-cyan-400 hover:text-black px-6 py-2.5 rounded-xl border border-cyan-500/20 font-black text-cyan-400 uppercase transition-all orbitron">
                        + Vincular Ítem
                    </button>
                </div>
                <div id="itemsLista" class="space-y-3 min-h-[60px] p-2">
                    <p class="text-[8px] text-slate-700 italic text-center py-6 uppercase font-black tracking-widest">--- Esperando Carga ---</p>
                </div>
            </div>

            <div class="flex flex-col md:flex-row gap-4 relative z-10">
                <button id="btnGuardarOrden" class="flex-1 bg-emerald-500 text-black py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-[0_15px_40px_rgba(16,185,129,0.2)] active:scale-95 transition-all orbitron">
                    Sincronizar Misión
                </button>
                <button onclick="document.getElementById('workspace').classList.add('hidden')" class="px-10 bg-white/5 text-slate-500 rounded-[2rem] font-black text-[10px] uppercase border border-white/5 orbitron">
                    Abortar
                </button>
            </div>
        </div>
        `;

        // VOZ 
        document.getElementById("btnDictar").onclick = () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) return;
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-CO';
            recognition.onstart = () => {
                hablar("Nexus escuchando.");
                btnDictar.classList.add('bg-red-500', 'text-white', 'animate-pulse');
            };
            recognition.onresult = (e) => document.getElementById("newDiagnostico").value = e.results[0][0].transcript.toUpperCase();
            recognition.onend = () => {
                btnDictar.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
                hablar("Recibido.");
            };
            recognition.start();
        };

        document.getElementById("btnAddItem").onclick = async () => {
            const { value: v } = await Swal.fire({
                title: 'NUEVO ÍTEM', background: '#020617', color: '#fff',
                html: `<div class="p-4 space-y-4">
                    <input id="sw-n" class="w-full bg-black/60 p-4 rounded-xl text-white border border-white/5" placeholder="DESCRIPCIÓN">
                    <input id="sw-p" type="number" class="w-full bg-black/60 p-4 rounded-xl text-emerald-400 border border-white/5" placeholder="PRECIO $">
                </div>`,
                preConfirm: () => ({ nombre: document.getElementById('sw-n').value.toUpperCase(), precio: Number(document.getElementById('sw-p').value), cantidad: 1, origen: 'TALLER' })
            });
            if (v && v.nombre) { itemsOrden.push(v); actualizarTablaItems(); }
        };

        document.getElementById("btnGuardarOrden").onclick = guardarOrdenFirestore;
    };

    const actualizarTablaItems = () => {
        const listArea = document.getElementById("itemsLista");
        if (itemsOrden.length === 0) {
            listArea.innerHTML = `<p class="text-[8px] text-slate-700 italic text-center py-6 uppercase font-black tracking-widest">--- Esperando Carga ---</p>`;
            return;
        }
        listArea.innerHTML = itemsOrden.map((it, idx) => `
            <div class="flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                <p class="text-[10px] font-black text-white uppercase">${it.nombre}</p>
                <div class="flex items-center gap-4">
                    <p class="text-[10px] font-black text-emerald-400">$${new Intl.NumberFormat("es-CO").format(it.precio)}</p>
                    <button class="text-red-500" onclick="window.removeItem(${idx})"><i class="fas fa-times"></i></button>
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
            total: itemsOrden.reduce((acc, i) => acc + i.precio, 0),
            estado: 'EN_TALLER',
            fechaIngreso: serverTimestamp()
        };

        if (!data.placa || !data.cliente) return Swal.fire('Error', 'Placa y Cliente obligatorios', 'error');

        btn.disabled = true;
        btn.innerText = "🚀 TRANSMITIENDO...";

        try {
            await addDoc(collection(db, "empresas", empresaId, "ordenes"), data);
            hablar("Orden en órbita.");
            renderBase();
        } catch (e) { console.error(e); btn.disabled = false; }
    };

    async function cargarOrdenes() {
        const listArea = document.getElementById("listaOrdenes");
        try {
            const q = query(collection(db, "empresas", empresaId, "ordenes"), where("estado", "==", "EN_TALLER"), orderBy("fechaIngreso", "desc"));
            const snap = await getDocs(q);

            if (snap.empty) {
                listArea.innerHTML = `<div class="col-span-full py-20 text-center opacity-20 orbitron text-[10px] tracking-[0.5em]">--- Radar Despejado ---</div>`;
                return;
            }

            listArea.innerHTML = snap.docs.map(doc => {
                const o = doc.data();
                const oJson = JSON.stringify(o).replace(/'/g, "&apos;"); // Escape para el HTML
                return `
                <div class="bg-white/[0.02] backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/5 hover:border-cyan-500/30 transition-all duration-500 group">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex gap-4">
                            <div class="w-14 h-14 bg-black rounded-2xl flex flex-col items-center justify-center border border-white/10">
                                <span class="text-[6px] text-slate-500 font-black uppercase">Placa</span>
                                <span class="text-xs text-cyan-400 font-black orbitron">${o.placa}</span>
                            </div>
                            <div>
                                <h3 class="text-white text-xs font-black uppercase">${o.cliente}</h3>
                                <p class="text-[8px] text-slate-500 font-bold italic line-clamp-1">${o.diagnostico || 'Sin diagnóstico'}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-black text-white orbitron">$${new Intl.NumberFormat("es-CO").format(o.total || 0)}</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick='window.ejecutarImpresion(${oJson})' class="flex-1 bg-white/5 py-3 rounded-xl text-[8px] font-black uppercase border border-white/5 hover:bg-cyan-500 hover:text-black transition-all orbitron">
                            <i class="fas fa-print mr-1 text-cyan-400 group-hover:text-black"></i> Reporte PDF
                        </button>
                        <button onclick='window.compartirWhatsApp(${oJson})' class="flex-1 bg-emerald-500/10 py-3 rounded-xl text-[8px] text-emerald-500 font-black uppercase border border-emerald-500/10 hover:bg-emerald-500 hover:text-black transition-all orbitron">
                            <i class="fab fa-whatsapp mr-1"></i> Notificar WA
                        </button>
                    </div>
                </div>`;
            }).join("");
        } catch (e) { console.error(e); }
    }

    renderBase();
}
