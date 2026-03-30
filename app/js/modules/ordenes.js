/**
 * ordenes.js - NEXUS-X COMMAND CENTER V5.2 "TITAN" 🛰️
 * Optimizaciones: Persistencia, Eliminación, Exportación y Audio IA.
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, 
    setDoc, deleteDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if(recognition) { recognition.lang = 'es-CO'; recognition.continuous = false; }

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;
    let faseActual = 'INGRESO';

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 border-b border-white/5 pb-12">
                <div class="space-y-3">
                    <div class="flex items-center gap-5">
                        <div class="h-4 w-4 bg-cyan-500 rounded-full animate-ping shadow-[0_0_20px_#00f2ff]"></div>
                        <h1 class="orbitron text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase">Nexus_<span class="text-cyan-400">OT</span></h1>
                    </div>
                    <p class="text-[11px] orbitron text-slate-500 tracking-[0.5em] uppercase">Control de Misiones Logísticas</p>
                </div>
                <button id="btnNewMission" class="w-full md:w-auto px-10 py-5 bg-white text-black rounded-3xl orbitron text-[12px] font-black shadow-2xl">NUEVA MISIÓN +</button>
            </header>

            <nav class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16 overflow-x-auto no-scrollbar">
                ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="fase-tab p-6 rounded-[2.5rem] bg-[#0d1117] border border-white/5" data-fase="${fase}">
                        <span class="orbitron text-[9px] text-slate-500 mb-4 block">${fase}</span>
                        <h3 id="count-${fase}" class="text-3xl font-black text-white">0</h3>
                    </button>
                `).join('')}
            </nav>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-[#010409]/98 backdrop-blur-3xl p-4 lg:p-12 overflow-y-auto"></div>
        </div>`;
        vincularNavegacion();
        cargarGrid(faseActual);
    };

    const abrirTerminal = async (id = null) => {
        const modal = document.getElementById("nexus-terminal");
        modal.classList.remove("hidden");
        if (id) {
            const snap = await getDoc(doc(db, "ordenes", id));
            ordenActiva = { id, ...snap.data() };
        } else {
            ordenActiva = {
                placa: '', cliente: '', telefono: '', estado: 'INGRESO', items: [], 
                bitacora_ia: 'Sin diagnóstico...', gastos_varios: { cafeteria: 0, adelanto_tecnico: 0 },
                abonos: 0, costos_totales: { total: 0, costo: 0, utilidad: 0, saldo_pendiente: 0 }
            };
        }
        renderTerminal();
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1400px] mx-auto pb-20">
            <div class="flex flex-wrap justify-between items-center gap-4 mb-8 bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5">
                <input id="f-placa" value="${ordenActiva.placa}" class="bg-transparent text-4xl font-black orbitron text-cyan-400 outline-none w-48 uppercase" placeholder="PLACA">
                <div class="flex gap-2">
                    <button id="btnDescargarOT" class="w-12 h-12 rounded-2xl bg-white/5 text-white border border-white/10" title="Guardar en Móvil"><i class="fas fa-download"></i></button>
                    <button id="btnEliminarOT" class="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20" title="Eliminar de la Nube"><i class="fas fa-trash"></i></button>
                    <button onclick="document.getElementById('nexus-terminal').classList.add('hidden')" class="w-12 h-12 rounded-2xl bg-white/10 text-white font-black text-xl">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5">
                        <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-white/5 p-5 rounded-2xl mb-4 border border-white/5 outline-none font-bold uppercase" placeholder="CLIENTE">
                        <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-white/5 p-5 rounded-2xl border border-white/5 outline-none" placeholder="WHATSAPP">
                    </div>

                    <div class="bg-black p-8 rounded-[3rem] border border-cyan-500/30">
                        <p class="orbitron text-[9px] text-cyan-400 mb-4">DIAGNÓSTICO IA / VOZ</p>
                        <div id="ai-log-display" class="bg-white/5 p-4 rounded-xl text-xs h-32 overflow-y-auto mb-4 italic text-slate-300">
                            ${ordenActiva.bitacora_ia}
                        </div>
                        <button id="btnDictar" class="w-full py-4 bg-cyan-500 text-black rounded-xl orbitron text-[10px] font-black">🎤 DICTAR FALLA</button>
                    </div>

                    <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-red-500/20">
                        <p class="orbitron text-[9px] text-red-500 mb-4 uppercase font-black italic">Gastos y Abonos</p>
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <input type="number" id="f-cafeteria" value="${ordenActiva.gastos_varios?.cafeteria || 0}" class="bg-black/50 p-4 rounded-xl text-white border border-white/5 outline-none" placeholder="Cafetería">
                            <input type="number" id="f-adelanto" value="${ordenActiva.gastos_varios?.adelanto_tecnico || 0}" class="bg-black/50 p-4 rounded-xl text-white border border-white/5 outline-none" placeholder="Adelanto">
                        </div>
                        <input type="number" id="f-abono" value="${ordenActiva.abonos || 0}" class="w-full bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl text-2xl font-black text-emerald-400 orbitron outline-none" placeholder="ABONO">
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-6">
                    <div class="bg-[#0d1117] p-8 md:p-12 rounded-[4rem] border border-white/5">
                        <div class="flex justify-between items-end mb-10">
                            <div>
                                <p class="orbitron text-[10px] text-cyan-400 uppercase italic">Presupuesto</p>
                                <h2 id="total-factura" class="orbitron text-6xl md:text-8xl font-black text-white italic tracking-tighter">$ 0</h2>
                            </div>
                            <div class="text-right">
                                <p class="text-[9px] text-orange-500 orbitron">PENDIENTE</p>
                                <p id="saldo-display" class="text-3xl font-black text-white orbitron italic">$ 0</p>
                            </div>
                        </div>

                        <div id="items-container" class="space-y-4 max-h-[400px] overflow-y-auto pr-2"></div>

                        <div class="grid grid-cols-2 gap-4 mt-8">
                            <button id="btnAddRepuesto" class="py-5 bg-white/5 rounded-2xl border border-white/10 orbitron text-[9px] font-black">+ REPUESTO</button>
                            <button id="btnAddMano" class="py-5 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400 orbitron text-[9px] font-black">+ MANO OBRA</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button id="btnPagarBold" class="py-7 bg-red-600 text-white rounded-[2rem] orbitron font-black text-[10px] shadow-lg uppercase">Link de Pago Bold</button>
                        <button id="btnSincronizar" class="py-7 bg-white text-black rounded-[2rem] orbitron font-black text-[10px] shadow-lg uppercase">Sincronizar Nexus-X</button>
                    </div>
                </div>
            </div>
        </div>`;

        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    const recalcularFinanzas = () => {
        let total = 0;
        ordenActiva.items.forEach(i => total += Number(i.venta || 0));
        
        // Capturar valores de inputs antes de renderizar para no perder cambios
        const caf = Number(document.getElementById("f-cafeteria")?.value || 0);
        const ade = Number(document.getElementById("f-adelanto")?.value || 0);
        const abo = Number(document.getElementById("f-abono")?.value || 0);

        ordenActiva.gastos_varios = { cafeteria: caf, adelanto_tecnico: ade };
        ordenActiva.abonos = abo;
        ordenActiva.costos_totales.total = total;
        ordenActiva.costos_totales.saldo_pendiente = total - abo;

        document.getElementById("total-factura").innerText = `$ ${total.toLocaleString()}`;
        document.getElementById("saldo-display").innerText = `$ ${ordenActiva.costos_totales.saldo_pendiente.toLocaleString()}`;
        renderItems();
    };

    const renderItems = () => {
        const container = document.getElementById("items-container");
        container.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
                <div class="flex-1 min-w-[150px]">
                    <span class="text-[8px] orbitron text-cyan-500 uppercase font-black italic mb-1 block">${item.tipo}</span>
                    <input onchange="editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" class="w-full bg-transparent border-none outline-none text-white font-bold text-xs uppercase">
                </div>
                <div class="flex gap-2">
                    <input type="number" onchange="editItemNexus(${idx}, 'costo', this.value)" value="${item.costo}" class="w-20 bg-black/40 p-3 rounded-xl text-[10px] text-red-400 text-center border border-white/5 outline-none" placeholder="Costo">
                    <input type="number" onchange="editItemNexus(${idx}, 'venta', this.value)" value="${item.venta}" class="w-24 bg-black/40 p-3 rounded-xl text-[10px] text-emerald-400 text-center border border-emerald-500/20 outline-none font-bold" placeholder="Venta">
                    <button onclick="removeItemNexus(${idx})" class="w-10 h-10 bg-red-500/20 text-red-500 rounded-xl">✕</button>
                </div>
            </div>`).join('');
    };

    const vincularAccionesTerminal = () => {
        // Botones de Repuesto y Mano de Obra (Solución al Punto 2)
        document.getElementById("btnAddRepuesto").onclick = () => {
            ordenActiva.items.push({ tipo: 'REPUESTO', desc: 'NUEVO REPUESTO', costo: 0, venta: 0 });
            recalcularFinanzas();
        };

        document.getElementById("btnAddMano").onclick = () => {
            ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: 'SERVICIO TÉCNICO', costo: 0, venta: 0 });
            recalcularFinanzas();
        };

        // Dictado IA (Punto 4 ampliado)
        document.getElementById("btnDictar").onclick = () => {
            if(!recognition) return hablar("Error de Hardware de Voz.");
            hablar("Describe la falla para el diagnóstico Nexus.");
            recognition.start();
            recognition.onresult = (e) => {
                const text = e.results[0][0].transcript;
                ordenActiva.bitacora_ia = text;
                document.getElementById("ai-log-display").innerText = text;
                hablar("Diagnóstico procesado.");
            };
        };

        // Descargar OT para Carpeta Local (Punto adicional)
        document.getElementById("btnDescargarOT").onclick = () => {
            const data = JSON.stringify(ordenActiva, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `OT_${ordenActiva.placa}_${Date.now()}.json`;
            a.click();
            hablar("Orden descargada en tu móvil.");
        };

        // ELIMINAR ORDEN PARA LIMPIAR (Punto adicional)
        document.getElementById("btnEliminarOT").onclick = async () => {
            if(!confirm("¿Deseas eliminar esta misión de la nube permanentemente?")) return;
            if(ordenActiva.id) {
                await deleteDoc(doc(db, "ordenes", ordenActiva.id));
                hablar("Misión eliminada.");
                document.getElementById("nexus-terminal").classList.add("hidden");
            }
        };

        // Sincronización Total
        document.getElementById("btnSincronizar").onclick = async () => {
            const btn = document.getElementById("btnSincronizar");
            btn.innerText = "🛰️ ENVIANDO...";
            try {
                recalcularFinanzas(); // Asegura capturar los últimos inputs de gastos/abonos
                const idOT = ordenActiva.id || `OT_${Date.now()}`;
                const dataFinal = {
                    ...ordenActiva,
                    empresaId,
                    placa: document.getElementById("f-placa").value.toUpperCase(),
                    cliente: document.getElementById("f-cliente").value,
                    telefono: document.getElementById("f-telefono").value,
                    updatedAt: serverTimestamp()
                };
                await setDoc(doc(db, "ordenes", idOT), dataFinal);
                hablar("Misión sincronizada exitosamente.");
                document.getElementById("nexus-terminal").classList.add("hidden");
            } catch (e) { 
                btn.innerText = "ERROR DE NODO"; 
                console.error(e);
            }
        };
    };

    // Funciones globales únicas para evitar conflictos con pagosTaller.js
    window.editItemNexus = (idx, campo, valor) => { ordenActiva.items[idx][campo] = valor; recalcularFinanzas(); };
    window.removeItemNexus = (idx) => { ordenActiva.items.splice(idx, 1); recalcularFinanzas(); };
    window.abrirTerminalNexus = (id) => abrirTerminal(id);

    const vincularNavegacion = () => {
        document.getElementById("btnNewMission").onclick = () => abrirTerminal();
        document.querySelectorAll(".fase-tab").forEach(tab => tab.onclick = () => { faseActual = tab.dataset.fase; cargarGrid(faseActual); });
    };

    const cargarGrid = (fase) => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const counts = { COTIZACION: 0, INGRESO: 0, DIAGNOSTICO: 0, REPARACION: 0, LISTO: 0 };
            const grilla = [];
            snap.docs.forEach(d => {
                const dt = d.data();
                if(counts.hasOwnProperty(dt.estado)) counts[dt.estado]++;
                if(dt.estado === fase) grilla.push({ id: d.id, ...dt });
            });
            Object.keys(counts).forEach(f => { if(document.getElementById(`count-${f}`)) document.getElementById(`count-${f}`).innerText = counts[f]; });
            document.getElementById("grid-ordenes").innerHTML = grilla.map(o => `
                <div onclick="abrirTerminalNexus('${o.id}')" class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 hover:border-cyan-500/50 transition-all cursor-pointer group">
                    <span class="orbitron text-3xl font-black text-white group-hover:text-cyan-400">${o.placa}</span>
                    <p class="text-[9px] text-slate-500 orbitron mt-2">${o.cliente || 'Misión Anónima'}</p>
                    <div class="mt-6 flex justify-between items-center">
                        <span class="text-xl font-black text-white">$ ${Number(o.costos_totales?.total || 0).toLocaleString()}</span>
                        <div class="h-10 w-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400"><i class="fas fa-chevron-right"></i></div>
                    </div>
                </div>`).join('');
        });
    };

    renderBase();
}
