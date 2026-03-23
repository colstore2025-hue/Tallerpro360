/**
 * ordenes.js - TallerPRO360 NEXUS-CORE V6 🛰️
 * Gestión Operativa con Inteligencia de Voz y Stock Híbrido
 */
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { mostrarSelectorRepuesto } from "../services/selectorRepuestos.js";

export default async function ordenes(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    let itemsOrden = []; // Buffer temporal para la nueva orden

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

            <div id="workspace" class="hidden mb-8 animate-in slide-in-from-top duration-500">
                </div>

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
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <label class="text-[7px] text-cyan-500 font-black uppercase mb-1 block">Placa / Identificador</label>
                    <input id="newPlaca" class="bg-transparent border-none outline-none text-lg font-black text-white w-full uppercase" placeholder="ABC-123">
                </div>
                <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <label class="text-[7px] text-slate-500 font-black uppercase mb-1 block">Cliente</label>
                    <input id="newCliente" class="bg-transparent border-none outline-none text-sm font-black text-white w-full uppercase" placeholder="Nombre completo">
                </div>
                <div class="bg-black/40 p-4 rounded-2xl border border-white/5 relative">
                    <label class="text-[7px] text-slate-500 font-black uppercase mb-1 block">Diagnóstico por Voz</label>
                    <div class="flex items-center gap-2">
                        <input id="newDiagnostico" class="bg-transparent border-none outline-none text-[10px] font-medium text-slate-300 w-full" placeholder="Presiona el micro...">
                        <button id="btnDictar" class="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center animate-pulse">
                            <i class="fas fa-microphone text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div class="mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-[9px] font-black text-slate-500 uppercase tracking-widest">Repuestos & Servicios</h3>
                    <button id="btnAddItem" class="text-[9px] bg-white/5 px-4 py-2 rounded-xl border border-white/10 font-black text-cyan-400 uppercase">
                        + Agregar Ítem
                    </button>
                </div>
                <div id="itemsLista" class="space-y-2">
                    <p class="text-[9px] text-slate-700 italic text-center py-4 uppercase font-black">Sin repuestos vinculados</p>
                </div>
            </div>

            <div class="flex gap-3">
                <button id="btnGuardarOrden" class="flex-1 bg-emerald-500 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                    Finalizar y Registrar Orden
                </button>
                <button onclick="location.reload()" class="px-6 bg-white/5 text-slate-400 rounded-2xl font-black text-[10px] uppercase border border-white/5">
                    Cancelar
                </button>
            </div>
        </div>
        `;

        // LÓGICA DE VOZ (Dictado última generación)
        const btnDictar = document.getElementById("btnDictar");
        btnDictar.onclick = () => {
            const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.lang = 'es-CO';
            hablar("Diagnóstico iniciado. Te escucho.");
            
            recognition.onstart = () => btnDictar.classList.replace('bg-red-500/20', 'bg-red-500');
            recognition.onresult = (event) => {
                document.getElementById("newDiagnostico").value = event.results[0][0].transcript;
                hablar("Entendido, diagnóstico procesado.");
            };
            recognition.onend = () => btnDictar.classList.replace('bg-red-500', 'bg-red-500/20');
            recognition.start();
        };

        // INTEGRACIÓN SELECTOR HÍBRIDO
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
        const container = document.getElementById("itemsLista");
        container.innerHTML = itemsOrden.map((it, idx) => `
            <div class="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                <div>
                    <p class="text-[10px] font-black text-white uppercase">${it.nombre}</p>
                    <p class="text-[7px] ${it.origen === 'TALLER' ? 'text-cyan-500' : 'text-yellow-500'} font-black uppercase">
                        ${it.origen === 'TALLER' ? '📦 Stock Propio' : '👤 Traído por Cliente'}
                    </p>
                </div>
                <div class="text-right">
                    <p class="text-[10px] font-black text-white">$${new Intl.NumberFormat().format(it.precio * it.cantidad)}</p>
                    <button class="text-[8px] text-red-500 font-black uppercase opacity-50 hover:opacity-100" onclick="window.removeItem(${idx})">Eliminar</button>
                </div>
            </div>
        `).join("");
    };

    const guardarOrdenFirestore = async () => {
        const placa = document.getElementById("newPlaca").value.trim().toUpperCase();
        const cliente = document.getElementById("newCliente").value.trim().toUpperCase();
        const diagnostico = document.getElementById("newDiagnostico").value.trim();

        if (!placa || !cliente) return alert("❌ Datos incompletos");

        try {
            const total = itemsOrden.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
            
            await addDoc(collection(db, `empresas/${empresaId}/ordenes`), {
                placa,
                cliente,
                diagnostico,
                items: itemsOrden,
                total,
                estado: 'EN_TALLER',
                fechaIngreso: serverTimestamp()
            });

            hablar(`Orden para la placa ${placa} creada con éxito.`);
            Swal.fire({ icon: 'success', title: 'NEXUS SYNC OK', background: '#0a0f1d', color: '#fff' });
            renderBase();
        } catch (e) { console.error(e); }
    };

    async function cargarOrdenes() {
        const listArea = document.getElementById("listaOrdenes");
        try {
            const q = query(collection(db, `empresas/${empresaId}/ordenes`), orderBy("fechaIngreso", "desc"));
            const snap = await getDocs(q);

            if (snap.empty) {
                listArea.innerHTML = `<p class="text-center py-10 text-slate-700 text-[10px] font-black uppercase italic">No hay órdenes en curso</p>`;
                return;
            }

            listArea.innerHTML = snap.docs.map(doc => {
                const o = doc.data();
                return `
                <div class="bg-[#0f172a] p-5 rounded-3xl border border-white/5 hover:border-cyan-500/20 transition-all group relative overflow-hidden">
                    <div class="flex justify-between items-center relative z-10">
                        <div class="flex gap-4 items-center">
                            <div class="w-14 h-14 bg-black rounded-2xl flex flex-col items-center justify-center border border-cyan-500/20 shadow-inner">
                                <span class="text-[8px] text-slate-500 font-black uppercase">Placa</span>
                                <span class="text-xs text-white font-black uppercase">${o.placa}</span>
                            </div>
                            <div>
                                <h3 class="text-white text-[11px] font-black uppercase tracking-tight">${o.cliente}</h3>
                                <p class="text-[8px] text-slate-500 font-bold uppercase italic mt-1">Status: <span class="text-emerald-400">${o.estado}</span></p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-xs font-black text-cyan-400">$${new Intl.NumberFormat().format(o.total || 0)}</p>
                            <button class="mt-2 text-[7px] font-black text-slate-600 border border-white/5 px-3 py-1 rounded-lg uppercase hover:text-white transition-colors">Detalles</button>
                        </div>
                    </div>
                </div>
                `;
            }).join("");
        } catch (e) { console.error(e); }
    }

    renderBase();
}

