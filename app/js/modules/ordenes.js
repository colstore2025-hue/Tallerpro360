/**
 * ordenes.js - NEXUS-X COMMAND CENTER V5 ULTRA 🛰️
 * Integración Total: ERP, CRM, AI, VOZ y DASHBOARD.
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, 
    setDoc, serverTimestamp, runTransaction, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

// --- MOTORES DE INTELIGENCIA Y VOZ ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if(recognition) { recognition.lang = 'es-CO'; recognition.continuous = false; }

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;
    let faseActual = 'INGRESO';

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans animate-in fade-in duration-1000 pb-32">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 border-b border-white/5 pb-12">
                <div class="space-y-3">
                    <div class="flex items-center gap-5">
                        <div class="h-4 w-4 bg-cyan-500 rounded-full animate-ping shadow-[0_0_20px_#00f2ff]"></div>
                        <h1 class="orbitron text-6xl font-black italic tracking-tighter text-white uppercase">Nexus_<span class="text-cyan-400">OT</span></h1>
                    </div>
                    <p class="text-[11px] orbitron text-slate-500 tracking-[0.5em] uppercase">Logística Aeroespacial de Vehículos · V5.0</p>
                </div>
                <div class="flex gap-4">
                    <button id="btnNewMission" class="px-10 py-5 bg-white text-black rounded-3xl orbitron text-[12px] font-black hover:bg-cyan-400 hover:scale-105 transition-all shadow-2xl">NUEVA MISIÓN +</button>
                </div>
            </header>

            <nav class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16 overflow-x-auto no-scrollbar">
                ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="fase-tab p-8 rounded-[2.5rem] bg-[#0d1117] border border-white/5 transition-all group relative overflow-hidden" data-fase="${fase}">
                        <span class="orbitron text-[9px] text-slate-500 group-hover:text-cyan-400 mb-4 block">${fase}</span>
                        <h3 id="count-${fase}" class="text-4xl font-black text-white group-hover:scale-110 transition-all">0</h3>
                        <div class="h-1 w-0 bg-cyan-500 mt-4 group-hover:w-full transition-all duration-500"></div>
                    </button>
                `).join('')}
            </nav>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"></div>

            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-[#010409]/98 backdrop-blur-3xl p-4 lg:p-12 overflow-y-auto animate-in zoom-in duration-300"></div>
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
                placa: '', cliente: '', telefono: '', estado: 'INGRESO',
                items: [], bitacora_ia: 'Esperando dictado...',
                costos_totales: { total: 0, costo: 0, utilidad: 0 }
            };
        }
        renderTerminal();
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1600px] mx-auto">
            <div class="flex justify-between items-center mb-10 bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                <div class="flex items-center gap-10">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-transparent text-6xl font-black orbitron text-cyan-400 outline-none w-64 uppercase" placeholder="PLACA">
                    <select id="f-estado" class="bg-black/50 text-white orbitron text-xs p-4 rounded-2xl border border-white/10 outline-none">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                </div>
                <div class="flex gap-4">
                    <button id="btnVoiceGlobal" class="w-16 h-16 rounded-3xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-400 hover:text-black transition-all animate-pulse"><i class="fas fa-microphone"></i></button>
                    <button id="btnWppCRM" class="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black transition-all"><i class="fab fa-whatsapp"></i></button>
                    <button onclick="document.getElementById('nexus-terminal').classList.add('hidden')" class="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-black">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div class="lg:col-span-4 space-y-8">
                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 shadow-2xl">
                        <p class="orbitron text-[10px] text-slate-500 mb-8 uppercase tracking-widest italic">Información del Propietario</p>
                        <div class="space-y-6">
                            <div class="group">
                                <label class="text-[9px] text-cyan-400 orbitron ml-4 mb-2 block font-black">CLIENTE</label>
                                <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-white/5 p-6 rounded-3xl text-sm border border-white/5 outline-none focus:border-cyan-500/50 transition-all uppercase font-bold" placeholder="NOMBRE COMPLETO">
                            </div>
                            <div class="group">
                                <label class="text-[9px] text-cyan-400 orbitron ml-4 mb-2 block font-black">WHATSAPP</label>
                                <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-white/5 p-6 rounded-3xl text-sm border border-white/5 outline-none focus:border-cyan-500/50 transition-all" placeholder="+57 300...">
                            </div>
                        </div>
                    </div>

                    <div class="bg-gradient-to-br from-[#0d1117] to-black p-10 rounded-[3.5rem] border border-cyan-500/20 relative overflow-hidden group">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20"><i class="fas fa-brain text-cyan-400 animate-pulse"></i></div>
                            <span class="orbitron text-[11px] text-white font-black uppercase">Bitácora IA Voice</span>
                        </div>
                        <div id="ai-log-display" class="bg-black/40 p-6 rounded-3xl text-xs text-slate-300 italic leading-relaxed border border-white/5 h-48 overflow-y-auto mb-6">
                            ${ordenActiva.bitacora_ia}
                        </div>
                        <button id="btnDictar" class="w-full py-5 bg-cyan-500 text-black rounded-2xl orbitron text-[10px] font-black hover:scale-[1.02] transition-all shadow-xl">🎤 DICTAR SÍNTOMAS / TRABAJO</button>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative">
                        <div class="flex justify-between items-end mb-12">
                            <div>
                                <p class="orbitron text-[11px] text-cyan-400 mb-4 font-black tracking-widest italic">PRESUPUESTO DE MISIÓN</p>
                                <h2 id="total-factura" class="orbitron text-8xl font-black italic text-white tracking-tighter shadow-cyan-500/20 drop-shadow-2xl">$ 0</h2>
                            </div>
                            <div class="text-right">
                                <p class="text-[9px] text-slate-500 orbitron mb-2 uppercase">Utilidad Estimada</p>
                                <p id="utilidad-neta" class="text-3xl font-black text-emerald-400 orbitron italic">$ 0</p>
                            </div>
                        </div>

                        <div id="items-container" class="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar"></div>

                        <div class="mt-10 flex gap-4">
                            <button id="btnAddRepuesto" class="flex-1 py-6 bg-white/5 rounded-3xl orbitron text-[10px] font-black border border-white/10 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all">+ REPUESTO</button>
                            <button id="btnAddMano" class="flex-1 py-6 bg-cyan-500/5 rounded-3xl orbitron text-[10px] font-black border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all">+ MANO DE OBRA</button>
                        </div>
                    </div>

                    <button id="btnSincronizar" class="w-full py-10 bg-white text-black rounded-[3rem] orbitron font-black text-sm hover:scale-[1.02] transition-all shadow-[0_20px_60px_rgba(255,255,255,0.1)] uppercase tracking-[0.3em]">
                        Sincronizar Misión en Ecosistema Nexus-X
                    </button>
                </div>
            </div>
        </div>`;

        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    const recalcularFinanzas = () => {
        let total = 0, costo = 0;
        ordenActiva.items.forEach(i => {
            total += Number(i.venta || 0);
            costo += Number(i.costo || 0);
        });
        ordenActiva.costos_totales = { total, costo, utilidad: total - costo };

        document.getElementById("total-factura").innerText = `$ ${total.toLocaleString()}`;
        document.getElementById("utilidad-neta").innerText = `$ ${(total - costo).toLocaleString()}`;
        renderItems();
    };

    const renderItems = () => {
        const container = document.getElementById("items-container");
        container.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="flex items-center gap-6 bg-white/5 p-6 rounded-[2.5rem] border border-white/5 group hover:bg-white/[0.08] transition-all animate-in slide-in-from-right duration-300">
                <div class="flex-1 min-w-[250px]">
                    <span class="text-[8px] orbitron text-cyan-500 font-black mb-2 block tracking-widest italic">${item.tipo}</span>
                    <input onchange="editItem(${idx}, 'desc', this.value)" value="${item.desc}" class="w-full bg-transparent border-none outline-none text-white font-bold text-sm uppercase focus:text-cyan-400">
                </div>
                <div class="flex gap-4">
                    <div class="text-center">
                        <span class="text-[8px] text-slate-500 orbitron block mb-1 uppercase">Costo</span>
                        <input type="number" onchange="editItem(${idx}, 'costo', this.value)" value="${item.costo}" class="w-24 bg-black/40 p-3 rounded-2xl text-[11px] text-red-400 text-center border border-white/5 font-black outline-none">
                    </div>
                    <div class="text-center">
                        <span class="text-[8px] text-slate-500 orbitron block mb-1 uppercase">Venta</span>
                        <input type="number" onchange="editItem(${idx}, 'venta', this.value)" value="${item.venta}" class="w-32 bg-black/40 p-3 rounded-2xl text-sm text-emerald-400 text-center border border-emerald-500/20 font-black outline-none">
                    </div>
                </div>
                <button onclick="removeItem(${idx})" class="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black italic">✕</button>
            </div>
        `).join('');
    };

    const vincularAccionesTerminal = () => {
        // --- DICTADO POR VOZ (BITÁCORA) ---
        document.getElementById("btnDictar").onclick = () => {
            if(!recognition) return hablar("Sistema de voz no soportado en este navegador.");
            
            hablar("William, estoy escuchando. ¿Cuál es el diagnóstico?");
            document.getElementById("ai-log-display").innerText = "🛰️ ESCUCHANDO NODO NEXUS...";
            
            recognition.start();
            recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                ordenActiva.bitacora_ia = text;
                document.getElementById("ai-log-display").innerText = text;
                hablar("Entendido, bitácora actualizada.");
                
                // IA Analiza el texto y sugiere items (Algoritmo predictivo básico)
                if(text.toLowerCase().includes("aceite")) {
                    ordenActiva.items.push({ tipo: 'REPUESTO', desc: 'CAMBIO DE ACEITE Y FILTRO', costo: 80000, venta: 145000 });
                }
                if(text.toLowerCase().includes("frenos")) {
                    ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: 'MANTENIMIENTO DE FRENOS', costo: 0, venta: 60000 });
                }
                recalcularFinanzas();
            };
        };

        // --- WHATSAPP CRM INTEGRADO ---
        document.getElementById("btnWppCRM").onclick = () => {
            const { placa, cliente, telefono, items, costos_totales } = ordenActiva;
            if(!telefono) return hablar("Falta el contacto del cliente.");

            let msg = `*🛰️ TallerPRO360 NEXUS-X: REPORTE DE ESTADO* \n\n`;
            msg += `Hola *${cliente.toUpperCase()}* 👋\n`;
            msg += `Vehículo: *${placa.toUpperCase()}*\n`;
            msg += `Estatus: *${ordenActiva.estado}*\n\n`;
            msg += `*📋 DETALLE:* \n`;
            items.forEach(i => msg += `• ${i.desc.toUpperCase()} - _$${Number(i.venta).toLocaleString()}_\n`);
            msg += `\n*💰 TOTAL A PAGAR: $${costos_totales.total.toLocaleString()}*`;

            const phone = telefono.replace(/\D/g, '').startsWith('57') ? telefono.replace(/\D/g, '') : `57${telefono.replace(/\D/g, '')}`;
            window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`, '_blank');
        };

        // --- SINCRONIZACIÓN ERP / DASHBOARD ---
        document.getElementById("btnSincronizar").onclick = async () => {
            const btn = document.getElementById("btnSincronizar");
            btn.innerText = "🛰️ SINCRONIZANDO ECOSISTEMA...";
            
            try {
                const idOT = ordenActiva.id || `OT_${Date.now()}`;
                const dataFinal = {
                    ...ordenActiva,
                    empresaId,
                    placa: document.getElementById("f-placa").value.toUpperCase(),
                    cliente: document.getElementById("f-cliente").value,
                    telefono: document.getElementById("f-telefono").value,
                    estado: document.getElementById("f-estado").value,
                    updatedAt: serverTimestamp()
                };

                await setDoc(doc(db, "ordenes", idOT), dataFinal);
                
                // Registro contable automático (ERP)
                if(dataFinal.estado === 'LISTO') {
                    await setDoc(doc(db, "contabilidad", `VNT_${idOT}`), {
                        tipo: 'INGRESO',
                        monto: dataFinal.costos_totales.total,
                        referencia: dataFinal.placa,
                        empresaId,
                        fecha: serverTimestamp()
                    });
                }

                hablar("Misión sincronizada en el ecosistema.");
                document.getElementById("nexus-terminal").classList.add("hidden");
            } catch (e) {
                console.error(e);
                btn.innerText = "❌ ERROR DE SINCRONIZACIÓN";
            }
        };

        document.getElementById("btnAddRepuesto").onclick = () => {
            ordenActiva.items.push({ tipo: 'REPUESTO', desc: 'NUEVO REPUESTO', costo: 0, venta: 0 });
            recalcularFinanzas();
        };

        document.getElementById("btnAddMano").onclick = () => {
            ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: 'SERVICIO TÉCNICO', costo: 0, venta: 0 });
            recalcularFinanzas();
        };

        window.editItem = (idx, campo, valor) => { ordenActiva.items[idx][campo] = valor; recalcularFinanzas(); };
        window.removeItem = (idx) => { ordenActiva.items.splice(idx, 1); recalcularFinanzas(); };
    };

    const vincularNavegacion = () => {
        document.getElementById("btnNewMission").onclick = () => abrirTerminal();
        document.querySelectorAll(".fase-tab").forEach(tab => {
            tab.onclick = () => {
                faseActual = tab.dataset.fase;
                cargarGrid(faseActual);
            };
        });
    };

    const cargarGrid = (fase) => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        
        onSnapshot(q, (snap) => {
            const counts = { COTIZACION: 0, INGRESO: 0, DIAGNOSTICO: 0, REPARACION: 0, LISTO: 0 };
            const ordenesFase = [];

            snap.docs.forEach(d => {
                const data = d.data();
                if(counts.hasOwnProperty(data.estado)) counts[data.estado]++;
                if(data.estado === fase) ordenesFase.push({ id: d.id, ...data });
            });

            // Actualizar Contadores UI
            Object.keys(counts).forEach(f => {
                const el = document.getElementById(`count-${f}`);
                if(el) el.innerText = counts[f];
            });

            // Renderizar Grid
            document.getElementById("grid-ordenes").innerHTML = ordenesFase.map(o => `
                <div onclick="abrirTerminalNexus('${o.id}')" class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 hover:border-cyan-500/50 transition-all cursor-pointer group animate-in fade-in">
                    <div class="flex justify-between mb-4 items-start">
                        <span class="orbitron text-3xl font-black text-white group-hover:text-cyan-400 transition-all">${o.placa}</span>
                        <div class="h-2 w-2 bg-cyan-500 rounded-full shadow-[0_0_10px_#00f2ff]"></div>
                    </div>
                    <p class="text-[10px] text-slate-500 orbitron uppercase tracking-widest">${o.cliente || 'SÍN NOMBRE'}</p>
                    <div class="mt-8 flex justify-between items-end">
                        <span class="text-2xl font-black text-white orbitron italic">$ ${Number(o.costos_totales?.total || 0).toLocaleString()}</span>
                        <i class="fas fa-arrow-right text-slate-800 group-hover:text-cyan-400 transition-all"></i>
                    </div>
                </div>
            `).join('');
        });
    };

    window.abrirTerminalNexus = (id) => abrirTerminal(id);
    renderBase();
}
