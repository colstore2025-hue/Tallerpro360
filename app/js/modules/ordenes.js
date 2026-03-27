/**
 * ordenes.js - TallerPRO360 NEXUS-CORE V6.5 🛰️
 * Generación 2030: Gestión Cuántica de Órdenes y Dictado IA
 */
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function ordenes(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    let itemsOrden = []; 

    // --- GLOBAL SCOPE BINDING ---
    window.removeItem = (idx) => {
        itemsOrden.splice(idx, 1);
        actualizarTablaItems();
    };

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-40">
            <header class="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                <div>
                    <h1 class="orbitron text-2xl font-black text-white italic tracking-tighter uppercase">
                        OPERACIONES / <span class="text-cyan-400">ÓRDENES</span>
                    </h1>
                    <p class="text-[7px] text-slate-500 font-black uppercase tracking-[0.5em] mt-1 italic">Protocolo Nexus-X Starlink v6.5</p>
                </div>
                <button id="btnNuevaOrden" class="bg-cyan-500 text-black px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase shadow-[0_15px_40px_rgba(0,242,255,0.25)] active:scale-95 hover:rotate-1 transition-all orbitron">
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
            <div class="absolute top-0 right-0 p-8 opacity-5">
                <i class="fas fa-rocket text-8xl text-cyan-400"></i>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left relative z-10">
                <div class="bg-black/40 p-5 rounded-[2rem] border border-white/5 group focus-within:border-cyan-500/50 transition-all">
                    <label class="text-[7px] text-cyan-400 font-black uppercase mb-2 block tracking-widest orbitron">Placa Vehicular</label>
                    <input id="newPlaca" class="bg-transparent border-none outline-none text-2xl font-black text-white w-full uppercase placeholder:text-slate-800" placeholder="000-000">
                </div>
                <div class="bg-black/40 p-5 rounded-[2rem] border border-white/5 group focus-within:border-white/20 transition-all">
                    <label class="text-[7px] text-slate-500 font-black uppercase mb-2 block tracking-widest orbitron">Nombre Cliente</label>
                    <input id="newCliente" class="bg-transparent border-none outline-none text-sm font-black text-white w-full uppercase placeholder:text-slate-800" placeholder="NOMBRE DEL OPERADOR">
                </div>
                <div class="bg-black/40 p-5 rounded-[2rem] border border-white/5 relative group focus-within:border-red-500/30 transition-all">
                    <label class="text-[7px] text-slate-500 font-black uppercase mb-2 block tracking-widest orbitron italic">Dictado Técnico IA</label>
                    <div class="flex items-center gap-3">
                        <input id="newDiagnostico" class="bg-transparent border-none outline-none text-[10px] font-medium text-slate-400 w-full italic" placeholder="Pulse el micro para hablar...">
                        <button id="btnDictar" class="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-inner">
                            <i class="fas fa-microphone text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div class="mb-8 relative z-10">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="orbitron text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Suministros & Mano de Obra</h3>
                    <button id="btnAddItem" class="text-[8px] bg-cyan-500/10 hover:bg-cyan-400 hover:text-black px-6 py-2.5 rounded-xl border border-cyan-500/20 font-black text-cyan-400 uppercase transition-all orbitron">
                        + Vincular Ítem
                    </button>
                </div>
                <div id="itemsLista" class="space-y-3 min-h-[60px] p-2">
                    <p class="text-[8px] text-slate-700 italic text-center py-6 uppercase font-black tracking-widest animate-pulse">--- Sin registros de carga ---</p>
                </div>
            </div>

            <div class="flex flex-col md:flex-row gap-4 relative z-10">
                <button id="btnGuardarOrden" class="flex-1 bg-emerald-500 text-black py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-[0_15px_40px_rgba(16,185,129,0.2)] active:scale-95 transition-all orbitron">
                    Vincular y Ejecutar Protocolo
                </button>
                <button onclick="document.getElementById('workspace').classList.add('hidden')" class="px-10 bg-white/5 text-slate-500 rounded-[2rem] font-black text-[10px] uppercase border border-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all orbitron">
                    Abortar
                </button>
            </div>
        </div>
        `;

        // VOZ REINGENIERÍA
        const btnDictar = document.getElementById("btnDictar");
        btnDictar.onclick = () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) return Swal.fire("Error", "Motor de voz no disponible", "error");
            
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-CO';
            
            recognition.onstart = () => {
                hablar("Nexus escuchando.");
                btnDictar.classList.add('bg-red-500', 'text-white', 'animate-pulse', 'shadow-[0_0_20px_rgba(239,68,68,0.5)]');
            };
            
            recognition.onresult = (event) => {
                document.getElementById("newDiagnostico").value = event.results[0][0].transcript.toUpperCase();
            };
            
            recognition.onend = () => {
                btnDictar.classList.remove('bg-red-500', 'text-white', 'animate-pulse', 'shadow-[0_0_20px_rgba(239,68,68,0.5)]');
                hablar("Diagnóstico procesado.");
            };
            recognition.start();
        };

        // Selector dinámico
        document.getElementById("btnAddItem").onclick = async () => {
            const { value: formValues } = await Swal.fire({
                title: 'SELECTOR DE CARGA',
                background: '#020617', color: '#fff',
                customClass: { popup: 'rounded-[2rem] border border-white/10' },
                html: `
                    <div class="p-4 space-y-4">
                        <input id="sw-name" class="w-full bg-black/60 p-5 rounded-2xl text-white outline-none focus:border-cyan-500 border border-white/5" placeholder="DESCRIPCIÓN">
                        <select id="sw-origin" class="w-full bg-black/60 p-5 rounded-2xl text-white outline-none border border-white/5">
                            <option value="TALLER">EXISTENCIA TALLER</option>
                            <option value="CLIENTE">TRAÍDO POR CLIENTE</option>
                        </select>
                        <div class="grid grid-cols-2 gap-4">
                            <input id="sw-qty" type="number" class="w-full bg-black/60 p-5 rounded-2xl text-white border border-white/5" placeholder="CANT">
                            <input id="sw-price" type="number" class="w-full bg-black/60 p-5 rounded-2xl text-emerald-400 border border-white/5" placeholder="PRECIO $">
                        </div>
                    </div>`,
                preConfirm: () => ({
                    nombre: document.getElementById('sw-name').value.toUpperCase(),
                    origen: document.getElementById('sw-origin').value,
                    cantidad: Number(document.getElementById('sw-qty').value) || 1,
                    precio: Number(document.getElementById('sw-price').value) || 0
                })
            });

            if (formValues) {
                itemsOrden.push(formValues);
                actualizarTablaItems();
            }
        };

        document.getElementById("btnGuardarOrden").onclick = guardarOrdenFirestore;
    };

    const actualizarTablaItems = () => {
        const listArea = document.getElementById("itemsLista");
        if (itemsOrden.length === 0) {
            listArea.innerHTML = `<p class="text-[8px] text-slate-700 italic text-center py-6 uppercase font-black tracking-widest animate-pulse">--- Sin registros de carga ---</p>`;
            return;
        }

        listArea.innerHTML = itemsOrden.map((it, idx) => `
            <div class="flex justify-between items-center bg-white/[0.02] p-5 rounded-[2rem] border border-white/5 animate-in slide-in-from-right duration-500 hover:bg-white/[0.05] transition-all">
                <div class="flex items-center gap-4">
                    <div class="w-2 h-10 rounded-full ${it.origen === 'TALLER' ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]'}"></div>
                    <div>
                        <p class="text-[10px] font-black text-white uppercase tracking-tighter">${it.nombre}</p>
                        <p class="text-[7px] text-slate-500 font-black uppercase tracking-widest mt-1">${it.origen === 'TALLER' ? 'Inventario Propio' : 'Insumo Externo'}</p>
                    </div>
                </div>
                <div class="flex items-center gap-6">
                    <div class="text-right">
                        <p class="text-[6px] text-slate-600 font-black uppercase">Subtotal</p>
                        <p class="text-[11px] font-black text-emerald-400 orbitron">$${new Intl.NumberFormat("es-CO").format(it.precio * it.cantidad)}</p>
                    </div>
                    <button class="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-inner" onclick="window.removeItem(${idx})">
                        <i class="fas fa-trash-alt text-[10px]"></i>
                    </button>
                </div>
            </div>
        `).join("");
    };

    const guardarOrdenFirestore = async () => {
        const btn = document.getElementById("btnGuardarOrden");
        const placa = document.getElementById("newPlaca").value.trim().toUpperCase();
        const cliente = document.getElementById("newCliente").value.trim().toUpperCase();
        const diagnostico = document.getElementById("newDiagnostico").value.trim();

        if (!placa || !cliente) return Swal.fire({ title: 'ERROR', text: 'PLACA Y CLIENTE REQUERIDOS', icon: 'error', background: '#020617', color: '#fff' });

        btn.innerText = "⚡ TRANSMITIENDO...";
        btn.disabled = true;

        try {
            const total = itemsOrden.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
            await addDoc(collection(db, "empresas", empresaId, "ordenes"), {
                placa, cliente, diagnostico,
                items: itemsOrden,
                total,
                estado: 'EN_TALLER',
                fechaIngreso: serverTimestamp()
            });

            hablar(`Orden para ${placa} sincronizada exitosamente.`);
            renderBase();
        } catch (e) { 
            console.error(e);
            btn.disabled = false;
            btn.innerText = "PROTOCOL ERROR - REINTENTAR";
        }
    };

    async function cargarOrdenes() {
        const listArea = document.getElementById("listaOrdenes");
        try {
            const q = query(collection(db, "empresas", empresaId, "ordenes"), where("estado", "==", "EN_TALLER"), orderBy("fechaIngreso", "desc"));
            const snap = await getDocs(q);

            if (snap.empty) {
                listArea.innerHTML = `
                <div class="col-span-full p-24 text-center border-2 border-dashed border-white/5 rounded-[4rem] opacity-20 group hover:opacity-40 transition-all">
                    <i class="fas fa-satellite-dish text-5xl mb-6"></i>
                    <p class="orbitron text-[10px] font-black uppercase tracking-[0.6em]">Radar Despejado: Sin Vehículos</p>
                </div>`;
                return;
            }

            listArea.innerHTML = snap.docs.map(doc => {
                const o = doc.data();
                return `
                <div class="bg-white/[0.02] backdrop-blur-xl p-6 rounded-[3rem] border border-white/5 hover:border-cyan-500/30 transition-all duration-500 group relative overflow-hidden">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/5 rounded-full blur-3xl"></div>
                    <div class="flex justify-between items-center relative z-10">
                        <div class="flex gap-5 items-center">
                            <div class="w-16 h-16 bg-black/60 rounded-[1.8rem] flex flex-col items-center justify-center border border-white/10 group-hover:border-cyan-500/50 transition-all shadow-inner">
                                <span class="text-[6px] text-slate-600 font-black uppercase tracking-widest">Placa</span>
                                <span class="text-sm text-cyan-400 font-black uppercase orbitron">${o.placa}</span>
                            </div>
                            <div class="space-y-1">
                                <h3 class="text-white text-xs font-black uppercase tracking-tighter">${o.cliente}</h3>
                                <p class="text-[8px] text-slate-500 font-bold uppercase tracking-wide italic line-clamp-1 opacity-70">${o.diagnostico || 'Protocolo de diagnóstico pendiente'}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-[6px] text-slate-600 font-black uppercase mb-1">Total Estimado</p>
                            <p class="text-sm font-black text-white orbitron">$${new Intl.NumberFormat("es-CO").format(o.total || 0)}</p>
                            <div class="mt-2 flex items-center justify-end gap-1.5">
                                <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                <span class="text-[7px] text-emerald-500 font-black uppercase tracking-widest">En Órbita</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join("");
        } catch (e) { 
            console.error(e);
            listArea.innerHTML = `<p class="col-span-full text-center text-red-500 orbitron text-[8px]">UPLINK FAILURE: Revise conexión de datos</p>`;
        }
    }

    renderBase();
}
