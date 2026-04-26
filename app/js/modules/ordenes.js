/**
 * ordenes.js - NEXUS-X "THE TITAN" V12.0 🛰️
 * CONSOLIDACIÓN TOTAL: SAP BI + NEON UI + VOICE AI + EVIDENCIA
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, 
    setDoc, serverTimestamp, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { analizarPrecioSugerido, renderModuloPricing } from "../ai/pricingEnginePRO360.js";

// --- RECONOCIMIENTO DE VOZ (NEURAL LINK) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;
    let faseActual = 'INGRESO';

    if (!empresaId) {
        container.innerHTML = `<div class="p-10 orbitron text-red-500">ERROR: NO_EMPRESA_ID_DETECTED</div>`;
        return;
    }

    // --- 1. MOTOR FINANCIERO (SAP-ELIMINATOR LOGIC) ---
    const recalcularFinanzas = () => {
        if (!ordenActiva) return;
        let m = { v_rep: 0, c_rep: 0, v_mo: 0, c_mo: 0, tiempo: 0 };

        ordenActiva.items.forEach(i => {
            const v = Number(i.venta || 0);
            const c = Number(i.costo || 0);
            m.tiempo += Number(i.tiempo_estimado || 0);
            if (i.tipo === 'REPUESTO') {
                m.v_rep += v;
                if(i.origen === 'TALLER') m.c_rep += c;
            } else {
                m.v_mo += v;
                m.c_mo += c; // Este es el pasivo para nomina.js
            }
        });

        const insumos = Number(document.getElementById("f-gastos-varios")?.value || 0); 
        const anticipo = Number(document.getElementById("f-anticipo-cliente")?.value || 0); 
        
        const totalFactura = m.v_rep + m.v_mo; 
        const baseGravable = totalFactura / 1.19;
        const iva = totalFactura - baseGravable;
        const utilidadNeta = baseGravable - (m.c_rep + m.c_mo + insumos);

        ordenActiva.costos_totales = { 
            total: totalFactura, 
            base: baseGravable,
            iva: iva,
            saldo: totalFactura - anticipo, 
            ebitda: utilidadNeta,
            staff_cost: m.c_mo // Data para nomina.js
        };

        const totalEl = document.getElementById("total-factura");
        if(totalEl) {
            totalEl.innerText = `$ ${Math.round(totalFactura).toLocaleString()}`;
            document.getElementById("finance-summary").innerHTML = `
                <div class="grid grid-cols-2 gap-4 border-t border-cyan-500/30 pt-6 mt-6">
                    <div class="text-[10px] orbitron text-slate-500">BASE: <span class="text-white">$${Math.round(baseGravable).toLocaleString()}</span></div>
                    <div class="text-[10px] orbitron text-slate-500 text-right">IVA (19%): <span class="text-white">$${Math.round(iva).toLocaleString()}</span></div>
                    <div class="text-green-400 font-black text-2xl orbitron italic">EBITDA: $${Math.round(utilidadNeta).toLocaleString()}</div>
                    <div class="text-red-500 font-black text-2xl orbitron text-right">SALDO: $${Math.round(ordenActiva.costos_totales.saldo).toLocaleString()}</div>
                </div>`;
        }
        renderItems();
    };

    // --- 2. UI BASE (NEON MATRIX) ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#05070a] min-h-screen text-slate-100 font-sans pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-end gap-6 mb-16 border-b-2 border-red-600 pb-10">
                <div class="space-y-1">
                    <h1 class="orbitron text-7xl font-black italic tracking-tighter text-white">NEXUS<span class="text-red-600">_X</span></h1>
                    <p class="text-[10px] orbitron text-cyan-400 font-bold tracking-[0.8em] uppercase italic">Automotive Titan Logistics</p>
                </div>
                <button id="btnNewMission" class="px-12 py-5 bg-cyan-500 text-black rounded-none orbitron text-[10px] font-black hover:bg-white transition-all shadow-[10px_10px_0px_rgba(0,242,255,0.3)] uppercase">INICIAR ORDEN +</button>
            </header>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"></div>
            
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl p-6 lg:p-12 overflow-y-auto custom-scroll"></div>
        </div>`;
        vincularEventosBase();
        cargarEscuchaOrdenes();
    };

    // --- 3. TERMINAL DE OPERACIONES ---
    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1600px] mx-auto pb-40">
            <div class="flex justify-between items-center mb-12 bg-[#0d1117] p-10 border-l-8 border-cyan-500 rounded-r-3xl">
                <div class="flex items-center gap-6">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-7xl font-black orbitron text-white w-80 uppercase border-2 border-white/5 rounded-xl text-center" placeholder="PLACA">
                    <button onclick="window.nexusEscuchaPlaca()" class="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center animate-pulse"><i class="fas fa-microphone"></i></button>
                </div>
                <div class="flex gap-4">
                    <button id="btnCloseTerminal" class="w-20 h-20 bg-red-600 text-white text-3xl font-black rounded-2xl hover:rotate-90 transition-all">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-[#0d1117] p-8 border border-white/5 rounded-3xl">
                        <h4 class="orbitron font-black text-cyan-500 text-[11px] mb-6 uppercase tracking-widest">Client & Vehicle Shield</h4>
                        <input id="f-cliente" value="${ordenActiva.cliente || ''}" placeholder="NOMBRE CLIENTE" class="w-full bg-black p-4 mb-4 text-white font-black uppercase text-xs border border-white/10 rounded-xl">
                        <input id="f-telefono" value="${ordenActiva.telefono || ''}" placeholder="WHATSAPP (+57)" class="w-full bg-black p-4 text-green-400 font-bold border border-white/10 rounded-xl">
                        <div class="grid grid-cols-2 gap-4 mt-4">
                            <input id="f-km" value="${ordenActiva.recepcion?.km || ''}" placeholder="KILOMETRAJE" class="bg-black p-4 text-white text-xs border border-white/10 rounded-xl">
                            <select id="f-gas" class="bg-black p-4 text-white text-xs border border-white/10 rounded-xl">
                                <option value="1/4">1/4 GAS</option><option value="FULL">FULL</option>
                            </select>
                        </div>
                    </div>

                    <div id="pricing-engine-container" class="bg-white/5 p-8 border border-white/5 rounded-3xl"></div>

                    <div class="bg-black p-8 border border-red-600/20 rounded-3xl relative">
                        <span class="orbitron text-[9px] text-red-500 font-black block mb-4">NEURAL_BITACORA</span>
                        <textarea id="ai-log-display" class="w-full bg-transparent text-slate-300 text-xs h-32 outline-none font-mono" placeholder="Escuchando hallazgos...">${ordenActiva.bitacora_ia || ''}</textarea>
                        <button onclick="window.nexusDictarBitacora()" class="absolute bottom-6 right-6 w-12 h-12 bg-white text-black rounded-full shadow-2xl"><i class="fas fa-microphone"></i></button>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 border border-cyan-500/10 rounded-[3rem] relative shadow-2xl">
                        <div class="flex justify-between items-start mb-12">
                            <div>
                                <h2 id="total-factura" class="orbitron text-[8rem] font-black text-white italic leading-none">$ 0</h2>
                                <p class="text-cyan-400 orbitron font-bold text-xs mt-4 tracking-widest uppercase">TOTAL FACTURADO (IVA 19% INC.)</p>
                            </div>
                            <div id="finance-summary" class="w-80"></div>
                        </div>
                        
                        <div id="items-container" class="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scroll"></div>
                        
                        <div class="grid grid-cols-2 gap-6 mt-12">
                            <button onclick="window.addItemNexus('REPUESTO')" class="py-6 border-2 border-white/10 orbitron text-[10px] font-black text-white hover:bg-white hover:text-black transition-all rounded-2xl">+ AÑADIR REPUESTO</button>
                            <button onclick="window.addItemNexus('MANO_OBRA')" class="py-6 border-2 border-red-600/20 orbitron text-[10px] font-black text-red-600 hover:bg-red-600 hover:text-white transition-all rounded-2xl">+ MANO DE OBRA</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                        <div class="bg-black p-6 rounded-3xl border border-white/5">
                            <label class="orbitron text-[9px] text-slate-500 block mb-2">ANTICIPO CLIENTE</label>
                            <input id="f-anticipo-cliente" value="${ordenActiva.anticipo || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-green-400 text-4xl font-black w-full outline-none">
                        </div>
                        <div class="bg-black p-6 rounded-3xl border border-white/5">
                            <label class="orbitron text-[9px] text-red-600 block mb-2">INSUMOS TALLER</label>
                            <input id="f-gastos-varios" value="${ordenActiva.insumos || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-red-500 text-4xl font-black w-full outline-none">
                        </div>
                    </div>

                    <button id="btnSincronizar" class="w-full bg-cyan-500 text-black py-10 orbitron font-black text-4xl rounded-[2rem] hover:bg-white transition-all">🛰️ PUSH TO NEXUS CLOUD</button>
                </div>
            </div>
        </div>`;
        
        renderModuloPricing(document.getElementById('pricing-engine-container'));
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    // --- 4. FUNCIONES DE ACCIÓN (VOZ, DATA, SYNC) ---
    window.nexusEscuchaPlaca = () => {
        if(!recognition) return;
        recognition.start();
        recognition.onresult = (e) => {
            const txt = e.results[0][0].transcript.replace(/\s/g, '').toUpperCase();
            document.getElementById('f-placa').value = txt;
            hablar(`Placa ${txt} capturada`);
        };
    };

    window.nexusDictarBitacora = () => {
        if(!recognition) return;
        recognition.start();
        recognition.onresult = (e) => {
            const txt = e.results[0][0].transcript;
            document.getElementById('ai-log-display').value += `\n[HALLAZGO]: ${txt.toUpperCase()}`;
            hablar("Bitácora actualizada");
        };
    };

    window.addItemNexus = async (tipo) => {
        let tec = 'INTERNO';
        let costo = 0;
        if(tipo === 'MANO_OBRA') {
            const { value:t } = await Swal.fire({ title:'TÉCNICO', input:'text', background:'#0d1117', color:'#fff' });
            tec = t || 'PENDIENTE';
            const { value:c } = await Swal.fire({ title:'COSTO TÉCNICO', input:'number', background:'#0d1117', color:'#fff' });
            costo = Number(c || 0);
        }
        ordenActiva.items.push({ tipo, desc: `NUEVO ${tipo}`, costo, venta: 0, origen: 'TALLER', tecnico: tec, tiempo_estimado: 1 });
        recalcularFinanzas();
    };

    window.editItemNexus = (idx, campo, valor) => {
        ordenActiva.items[idx][campo] = (campo === 'desc') ? valor : Number(valor);
        recalcularFinanzas();
    };

    const ejecutarSincronizacionTotal = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true;
        btn.innerHTML = `SYNCHRONIZING ATOMIC DATA...`;

        try {
            const batch = writeBatch(db);
            const placa = document.getElementById("f-placa").value.toUpperCase();
            const id = ordenActiva.id || `OT_${placa}_${Date.now()}`;

            const data = {
                ...ordenActiva,
                id, placa, empresaId,
                cliente: document.getElementById("f-cliente").value,
                telefono: document.getElementById("f-telefono").value,
                anticipo: Number(document.getElementById("f-anticipo-cliente").value),
                insumos: Number(document.getElementById("f-gastos-varios").value),
                bitacora_ia: document.getElementById("ai-log-display").value,
                updatedAt: serverTimestamp()
            };

            // 1. MASTER ORDEN
            batch.set(doc(db, "ordenes", id), data);

            // 2. ENLACE CONTABILIDAD.JS (Asiento Contable)
            batch.set(doc(db, "contabilidad", `CONT_${id}`), {
                empresaId, ordenId: id, total: data.costos_totales.total, 
                utilidad: data.costos_totales.ebitda, fecha: serverTimestamp(), placa 
            });

            // 3. ENLACE NOMINA.JS / STAFF.JS (Pasivo Técnico)
            if(data.costos_totales.staff_cost > 0) {
                batch.set(doc(db, "nomina_pendiente", `NOM_${id}`), {
                    empresaId, tecnico: "MULTIPLE", monto: data.costos_totales.staff_cost, ordenId: id, fecha: serverTimestamp()
                });
            }

            await batch.commit();
            hablar("Orden en la nube. Sincronización completa.");
            Swal.fire({ title: 'NEXUS SYNC OK', icon: 'success', background: '#0d1117', color: '#fff' });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (e) {
            console.error(e);
            btn.disabled = false;
        }
    };

    window.renderItems = () => {
        const container = document.getElementById("items-container");
        if(!container) return;
        container.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="flex items-center gap-6 bg-white/[0.03] p-6 rounded-2xl border border-white/5">
                <div class="flex-1 grid grid-cols-4 gap-6">
                    <div class="col-span-2">
                        <input onchange="window.editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" class="bg-transparent text-white font-black orbitron text-xs outline-none w-full uppercase">
                        <span class="text-[8px] orbitron text-cyan-500 font-bold uppercase">${item.tipo} | STAFF: ${item.tecnico || 'CASA'}</span>
                    </div>
                    <input type="number" onchange="window.editItemNexus(${idx}, 'costo', this.value)" value="${item.costo}" class="bg-black/50 p-3 text-red-500 font-black text-center orbitron text-xs rounded-lg" placeholder="COST">
                    <input type="number" onchange="window.editItemNexus(${idx}, 'venta', this.value)" value="${item.venta}" class="bg-black/50 p-3 text-green-400 font-black text-center orbitron text-xs rounded-lg" placeholder="PRICE">
                </div>
                <button onclick="ordenActiva.items.splice(${idx}, 1); window.recalcularFinanzas();" class="text-slate-600 hover:text-white">✕</button>
            </div>`).join('');
    };

    const vincularEventosBase = () => {
        document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus();
    };

    const vincularAccionesTerminal = () => {
        document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
        document.getElementById("btnSincronizar").onclick = ejecutarSincronizacionTotal;
        window.recalcularFinanzas = recalcularFinanzas; // Exponer a los inputs
    };

    window.abrirTerminalNexus = (id = null) => {
        if(id) {
            getDoc(doc(db, "ordenes", id)).then(s => { ordenActiva = { id, ...s.data() }; renderTerminal(); });
        } else {
            ordenActiva = { placa:'', estado:'INGRESO', items:[], cliente_data:{}, anticipo:0, insumos:0 };
            renderTerminal();
        }
        document.getElementById("nexus-terminal").classList.remove("hidden");
    };

    const cargarEscuchaOrdenes = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const grid = document.getElementById("grid-ordenes");
            if (!grid) return;
            grid.innerHTML = snap.docs.map(d => {
                const o = d.data();
                return `
                <div onclick="window.abrirTerminalNexus('${d.id}')" class="bg-[#0d1117] p-8 border border-white/5 rounded-[2.5rem] hover:border-cyan-500 transition-all cursor-pointer group shadow-xl">
                    <h4 class="orbitron text-4xl font-black text-white group-hover:text-cyan-400 mb-2">${o.placa}</h4>
                    <p class="text-[10px] text-slate-500 mb-4 font-bold uppercase">${o.cliente || 'CLIENTE S/N'}</p>
                    <div class="pt-4 border-t border-white/5 flex justify-between items-center">
                        <span class="orbitron text-green-400 font-black">$ ${Math.round(o.costos_totales?.total || 0).toLocaleString()}</span>
                        <span class="text-[8px] orbitron bg-red-600/20 text-red-500 px-3 py-1 rounded-full">${o.estado}</span>
                    </div>
                </div>`;
            }).join('');
        });
    };

    renderBase();
}
