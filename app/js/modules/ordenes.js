/**
 * ordenes.js - TallerPRO360 NEXUS-CORE V6 🛰️
 * Revisión Final: Gestión Operativa, IA de Voz y Stock Híbrido
 */
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { mostrarSelectorRepuesto } from "../services/selectorRepuestos.js";

export default async function ordenes(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    let itemsOrden = []; 

    // --- FIX: Exponer removeItem al scope de la ventana para que el HTML dinámico lo vea ---
    window.removeItem = (idx) => {
        itemsOrden.splice(idx, 1);
        actualizarTablaItems();
    };

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-8 animate-fade-in font-sans pb-32">
            <div class="flex justify-between items-center mb-8">
                <div>
                    <h1 class="text-2xl font-black text-white italic tracking-tighter uppercase">
                        OPERACIONES / <span class="text-cyan-400">ÓRDENES</span>
                    </h1>
                    <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 italic">Protocolo Nexus-X Activo</p>
                </div>
                <button id="btnNuevaOrden" class="bg-cyan-500 text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-cyan-500/20 active:scale-95 transition-all">
                    + Abrir Orden
                </button>
            </div>

            <div id="workspace" class="hidden mb-8 animate-in slide-in-from-top duration-500"></div>

            <div id="listaOrdenes" class="grid gap-4">
                <div class="flex flex-col items-center justify-center p-20 opacity-20">
                    <div class="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p class="text-[10px] font-black uppercase tracking-[0.4em]">Sincronizando con Nexus...</p>
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
        <div class="bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 rounded-[2.5rem] border border-cyan-500/20 shadow-2xl">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-left">
                <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <label class="text-[7px] text-cyan-400 font-black uppercase mb-1 block tracking-widest">Placa del Vehículo</label>
                    <input id="newPlaca" class="bg-transparent border-none outline-none text-lg font-black text-white w-full uppercase" placeholder="ABC-123">
                </div>
                <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <label class="text-[7px] text-slate-500 font-black uppercase mb-1 block tracking-widest">Nombre Cliente</label>
                    <input id="newCliente" class="bg-transparent border-none outline-none text-sm font-black text-white w-full uppercase" placeholder="William Urquijo">
                </div>
                <div class="bg-black/40 p-4 rounded-2xl border border-white/5 relative">
                    <label class="text-[7px] text-slate-500 font-black uppercase mb-1 block tracking-widest">Dictado Técnico (IA)</label>
                    <div class="flex items-center gap-2">
                        <input id="newDiagnostico" class="bg-transparent border-none outline-none text-[10px] font-medium text-slate-300 w-full" placeholder="Click en micro para dictar...">
                        <button id="btnDictar" class="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center transition-all">
                            <i class="fas fa-microphone text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div class="mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Repuestos & Servicios</h3>
                    <button id="btnAddItem" class="text-[9px] bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-2 rounded-xl border border-cyan-500/20 font-black text-cyan-400 uppercase transition-all">
                        + Agregar Ítem
                    </button>
                </div>
                <div id="itemsLista" class="space-y-2 min-h-[50px] transition-all">
                    <p class="text-[9px] text-slate-700 italic text-center py-4 uppercase font-black">Esperando selección...</p>
                </div>
            </div>

            <div class="flex gap-3">
                <button id="btnGuardarOrden" class="flex-1 bg-emerald-500 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                    Vincular y Abrir Orden en Sistema
                </button>
                <button onclick="document.getElementById('workspace').classList.add('hidden')" class="px-6 bg-white/5 text-slate-400 rounded-2xl font-black text-[10px] uppercase border border-white/5">
                    Cancelar
                </button>
            </div>
        </div>
        `;

        // VOZ - Manejo de errores añadido
        document.getElementById("btnDictar").onclick = () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) return alert("Navegador no soporta voz");
            
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-CO';
            hablar("Diagnóstico iniciado.");
            
            recognition.onstart = () => btnDictar.classList.add('bg-red-500', 'text-white', 'animate-pulse');
            recognition.onresult = (event) => {
                document.getElementById("newDiagnostico").value = event.results[0][0].transcript;
            };
            recognition.onend = () => {
                btnDictar.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
                hablar("Recibido.");
            };
            recognition.start();
        };

        document.getElementById("btnAddItem").onclick = async () => {
            const item = await mostrarSelectorRepuesto(empresaId);
            if (item) {
                itemsOrden.push(item);
                actualizarTablaItems();
            }
        };

        document.getElementById("btnGuardarOrden").onclick = guardarOrdenFirestore;
    };

    const actualizarTablaItems = () => {
        const listArea = document.getElementById("itemsLista");
        if (itemsOrden.length === 0) {
            listArea.innerHTML = `<p class="text-[9px] text-slate-700 italic text-center py-4 uppercase font-black">Esperando selección...</p>`;
            return;
        }

        listArea.innerHTML = itemsOrden.map((it, idx) => `
            <div class="flex justify-between items-center bg-black/30 p-4 rounded-2xl border border-white/5 animate-in slide-in-from-right duration-300">
                <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full ${it.origen === 'TALLER' ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'}"></div>
                    <div>
                        <p class="text-[10px] font-black text-white uppercase">${it.nombre}</p>
                        <p class="text-[7px] text-slate-500 font-black uppercase">${it.origen === 'TALLER' ? 'Propiedad del Taller' : 'Suministrado por Cliente'}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <p class="text-[10px] font-black text-white">$${new Intl.NumberFormat("es-CO").format(it.precio * it.cantidad)}</p>
                    <button class="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all" onclick="window.removeItem(${idx})">
                        <i class="fas fa-times text-[10px]"></i>
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

        if (!placa || !cliente) return Swal.fire('Error', 'Placa y Cliente son requeridos', 'error');

        btn.innerText = "⚡ SINCRONIZANDO...";
        btn.disabled = true;

        try {
            const total = itemsOrden.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
            await addDoc(collection(db, `empresas/${empresaId}/ordenes`), {
                placa, cliente, diagnostico,
                items: itemsOrden,
                total,
                estado: 'EN_TALLER',
                fechaIngreso: serverTimestamp()
            });

            hablar(`Excelente. Orden ${placa} registrada.`);
            renderBase();
        } catch (e) { 
            console.error(e);
            btn.disabled = false;
            btn.innerText = "Error - Reintentar";
        }
    };

    async function cargarOrdenes() {
        const listArea = document.getElementById("listaOrdenes");
        try {
            const q = query(collection(db, `empresas/${empresaId}/ordenes`), where("estado", "==", "EN_TALLER"), orderBy("fechaIngreso", "desc"));
            const snap = await getDocs(q);

            if (snap.empty) {
                listArea.innerHTML = `<div class="p-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30"><p class="text-[10px] font-black uppercase tracking-widest">Sin vehículos en taller</p></div>`;
                return;
            }

            listArea.innerHTML = snap.docs.map(doc => {
                const o = doc.data();
                return `
                <div class="bg-gradient-to-r from-[#0f172a] to-[#1e293b] p-5 rounded-[2.5rem] border border-white/5 hover:border-cyan-500/30 transition-all group">
                    <div class="flex justify-between items-center">
                        <div class="flex gap-4 items-center">
                            <div class="w-14 h-14 bg-black rounded-3xl flex flex-col items-center justify-center border border-white/10 group-hover:border-cyan-500/50 transition-colors">
                                <span class="text-[7px] text-slate-500 font-black uppercase">Placa</span>
                                <span class="text-xs text-cyan-400 font-black uppercase">${o.placa}</span>
                            </div>
                            <div>
                                <h3 class="text-white text-[11px] font-black uppercase">${o.cliente}</h3>
                                <p class="text-[8px] text-slate-500 font-bold uppercase mt-1 italic line-clamp-1">${o.diagnostico || 'Sin diagnóstico'}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-black text-white">$${new Intl.NumberFormat("es-CO").format(o.total || 0)}</p>
                            <span class="text-[7px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-md font-black uppercase border border-emerald-500/20">En Proceso</span>
                        </div>
                    </div>
                </div>`;
            }).join("");
        } catch (e) { console.error(e); }
    }

    renderBase();
}
