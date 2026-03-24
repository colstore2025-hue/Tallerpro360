/**
 * ordenes.js - TallerPRO360 NEXUS-CORE V6.1 🛰️
 * Reingeniería: Scope Global, IA de Voz y Gestión de Items
 */
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { mostrarSelectorRepuesto } from "../services/selectorRepuestos.js";

export default async function ordenes(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    let itemsOrden = []; 

    // FIX: Exponer funciones al window para que el HTML inyectado las reconozca
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
                <button id="btnNuevaOrden" class="bg-cyan-500 text-black px-6 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-cyan-500/20 active:scale-95 transition-all">
                    + ABRIR ORDEN DE SERVICIO
                </button>
            </div>
            <div id="workspace" class="hidden mb-8 animate-in slide-in-from-top duration-500"></div>
            <div id="listaOrdenes" class="grid gap-4"></div>
        </div>
        `;
        document.getElementById("btnNuevaOrden").addEventListener("click", abrirFormularioOrden);
        cargarOrdenes();
    };

    const abrirFormularioOrden = () => {
        const workspace = document.getElementById("workspace");
        workspace.classList.remove("hidden");
        workspace.scrollIntoView({ behavior: 'smooth' });
        itemsOrden = [];

        workspace.innerHTML = `
        <div class="bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 rounded-[2.5rem] border border-cyan-500/20 shadow-2xl">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <label class="text-[7px] text-cyan-400 font-black uppercase mb-1 block tracking-widest">Placa</label>
                    <input id="newPlaca" class="bg-transparent border-none outline-none text-xl font-black text-white w-full uppercase" placeholder="--- ---">
                </div>
                <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <label class="text-[7px] text-slate-500 font-black uppercase mb-1 block tracking-widest">Cliente</label>
                    <input id="newCliente" class="bg-transparent border-none outline-none text-sm font-black text-white w-full uppercase" placeholder="NOMBRE COMPLETO">
                </div>
                <div class="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center gap-2">
                    <div class="flex-1">
                        <label class="text-[7px] text-slate-500 font-black uppercase mb-1 block tracking-widest">Dictado IA</label>
                        <input id="newDiagnostico" class="bg-transparent border-none outline-none text-[10px] font-medium text-slate-300 w-full" placeholder="DICTAR FALLA...">
                    </div>
                    <button id="btnDictar" class="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
                        <i class="fas fa-microphone"></i>
                    </button>
                </div>
            </div>

            <div class="mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Repuestos & Mano de Obra</h3>
                    <button id="btnAddItem" class="text-[9px] bg-cyan-500 text-black px-4 py-2 rounded-xl font-black uppercase">
                        + BUSCAR EN ALMACÉN
                    </button>
                </div>
                <div id="itemsLista" class="space-y-2 min-h-[50px] bg-black/20 rounded-3xl p-4"></div>
            </div>

            <div class="flex gap-3">
                <button id="btnGuardarOrden" class="flex-1 bg-emerald-500 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                    VINCULAR Y ACTIVAR ORDEN
                </button>
                <button id="btnCancelar" class="px-6 bg-white/5 text-slate-400 rounded-2xl font-black text-[10px] uppercase">
                    CANCELAR
                </button>
            </div>
        </div>
        `;

        // Lógica de Botones Inyectados
        document.getElementById("btnDictar").onclick = iniciarDictado;
        document.getElementById("btnAddItem").onclick = async () => {
            const item = await mostrarSelectorRepuesto(empresaId);
            if (item) {
                itemsOrden.push(item);
                actualizarTablaItems();
            }
        };
        document.getElementById("btnGuardarOrden").onclick = guardarOrdenFirestore;
        document.getElementById("btnCancelar").onclick = () => workspace.classList.add("hidden");
    };

    const iniciarDictado = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const rec = new SpeechRecognition();
        rec.lang = 'es-CO';
        rec.onstart = () => {
            hablar("Nexus escuchando.");
            document.getElementById("btnDictar").classList.add("bg-red-500", "text-white", "animate-pulse");
        };
        rec.onresult = (e) => document.getElementById("newDiagnostico").value = e.results[0][0].transcript;
        rec.onend = () => document.getElementById("btnDictar").classList.remove("bg-red-500", "text-white", "animate-pulse");
        rec.start();
    };

    const actualizarTablaItems = () => {
        const listArea = document.getElementById("itemsLista");
        if (itemsOrden.length === 0) {
            listArea.innerHTML = `<p class="text-[9px] text-slate-700 italic text-center py-4 uppercase font-black">Esperando selección de almacén...</p>`;
            return;
        }
        listArea.innerHTML = itemsOrden.map((it, idx) => `
            <div class="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                <div>
                    <p class="text-[10px] font-black text-white uppercase">${it.nombre}</p>
                    <p class="text-[7px] text-cyan-500 font-black uppercase">${it.origen || 'TALLER'}</p>
                </div>
                <div class="flex items-center gap-4">
                    <p class="text-[10px] font-black text-emerald-400">$${new Intl.NumberFormat("es-CO").format(it.precio)}</p>
                    <button onclick="window.removeItem(${idx})" class="text-red-500 px-2"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join("");
    };

    const guardarOrdenFirestore = async () => {
        const placa = document.getElementById("newPlaca").value.trim().toUpperCase();
        const cliente = document.getElementById("newCliente").value.trim().toUpperCase();
        if (!placa || !cliente) return alert("Datos incompletos");

        await addDoc(collection(db, `empresas/${empresaId}/ordenes`), {
            placa, cliente, 
            diagnostico: document.getElementById("newDiagnostico").value,
            items: itemsOrden,
            total: itemsOrden.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0),
            estado: 'EN_TALLER',
            fechaIngreso: serverTimestamp()
        });
        hablar("Orden confirmada.");
        renderBase();
    };

    async function cargarOrdenes() {
        const listArea = document.getElementById("listaOrdenes");
        const q = query(collection(db, `empresas/${empresaId}/ordenes`), where("estado", "==", "EN_TALLER"), orderBy("fechaIngreso", "desc"));
        const snap = await getDocs(q);
        listArea.innerHTML = snap.docs.map(doc => {
            const o = doc.data();
            return `
            <div class="bg-[#0f172a] p-5 rounded-[2rem] border border-white/5 flex justify-between items-center">
                <div class="flex gap-4">
                    <div class="w-12 h-12 bg-black rounded-2xl flex flex-col items-center justify-center border border-cyan-500/20">
                        <span class="text-[6px] text-slate-500 font-black uppercase">Placa</span>
                        <span class="text-[10px] text-white font-black">${o.placa}</span>
                    </div>
                    <div>
                        <h4 class="text-xs font-black text-white uppercase">${o.cliente}</h4>
                        <p class="text-[8px] text-cyan-500 font-black uppercase tracking-widest">En Proceso</p>
                    </div>
                </div>
                <p class="text-xs font-black text-white">$${new Intl.NumberFormat("es-CO").format(o.total)}</p>
            </div>`;
        }).join("");
    }

    renderBase();
}
