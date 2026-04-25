/**
 * ordenes.js - NEXUS-X COMMAND CENTER V9.0 "THE TITAN" 🛰️
 * CONSOLIDACIÓN TOTAL: SAP BI + TERMINATOR AI + VOICE COMMANDS + EVIDENCIA
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, updateDoc, serverTimestamp, increment, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { analizarPrecioSugerido, renderModuloPricing } from "../ai/pricingEnginePRO360.js";

// --- RECONOCIMIENTO DE VOZ ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    let ordenActiva = null;
    let faseActual = 'INGRESO';
    let datosTaller = { nombre: "NEXUS LOGISTICS", nit: "S/N" };

    if (!empresaId) {
        container.innerHTML = `<div class="p-10 orbitron text-red-500">ERROR: NO_EMPRESA_ID</div>`;
        return;
    }

    // --- MOTOR FINANCIERO SAP BI (EBITDA REAL) ---
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
                m.c_mo += c; 
            }
        });

        const insumos = Number(document.getElementById("f-gastos-varios")?.value || 0); 
        const anticipo = Number(document.getElementById("f-anticipo-cliente")?.value || 0); 
        const granTotal = m.v_rep + m.v_mo; 
        const utilidad = (granTotal / 1.19) - (m.c_rep + m.c_mo + insumos);

        ordenActiva.costos_totales = {
            gran_total: granTotal,
            utilidad: utilidad,
            saldo: granTotal - anticipo,
            tiempo_h: m.tiempo,
            staff_cost: m.c_mo
        };

        const totalEl = document.getElementById("total-factura");
        if(totalEl) {
            totalEl.innerText = `$ ${Math.round(granTotal).toLocaleString()}`;
            document.getElementById("saldo-display").innerHTML = `
                <div class="text-right">
                    <span class="text-cyan-500/50 text-[10px] orbitron block font-black">EFFICIENCY: ${m.tiempo}H</span>
                    <span class="${ordenActiva.costos_totales.saldo > 0 ? 'text-red-500' : 'text-emerald-400'} font-black text-4xl orbitron">
                        $ ${Math.round(ordenActiva.costos_totales.saldo).toLocaleString()}
                    </span>
                </div>`;
        }
        renderItems();
    };

    // --- UI BASE ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-slate-100 font-sans pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-end gap-6 mb-16 border-b border-white/5 pb-10">
                <div class="space-y-2">
                    <h1 class="orbitron text-7xl font-black italic tracking-tighter text-white">NEXUS<span class="text-red-600">_X</span> <span class="text-2xl text-red-600/50">V9.0</span></h1>
                    <p class="text-[10px] orbitron text-red-600/60 tracking-[0.6em] font-bold uppercase">TITAN QUANTUM-SAP LOGISTICS</p>
                </div>
                <button id="btnNewMission" class="px-12 py-6 bg-white text-black rounded-full orbitron text-[10px] font-black hover:bg-red-600 hover:text-white transition-all uppercase shadow-2xl">NUEVA ORDEN +</button>
            </header>

            <nav class="grid grid-cols-2 md:grid-cols-6 gap-4 mb-20">
                ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(f => `
                    <button class="fase-tab p-8 rounded-[2.5rem] bg-[#0d1117] border-2 ${faseActual === f ? 'border-red-600 shadow-red-600/20' : 'border-white/5'} transition-all group" data-fase="${f}">
                        <span class="orbitron text-[9px] ${faseActual === f ? 'text-red-500' : 'text-slate-600'} group-hover:text-red-500 mb-3 block font-black uppercase tracking-widest">${f}</span>
                        <h3 id="count-${f}" class="text-5xl font-black text-white italic">0</h3>
                    </button>`).join('')}
            </nav>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl p-6 lg:p-12 overflow-y-auto custom-scroll"></div>
            <input type="file" id="nexus-camera-input" accept="image/*" capture="environment" class="hidden">
        </div>`;
        vincularEventosBase();
        actualizarContadores();
    };

    // --- TERMINAL TITAN (SISTEMA COMPLETO) ---
    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1600px] mx-auto pb-40 animate-in fade-in zoom-in duration-500">
            <div class="flex justify-between items-center mb-12 bg-[#0d1117] p-10 rounded-[3.5rem] border-b-8 border-red-600 shadow-2xl">
                <div class="flex items-center gap-8">
                    <div class="relative group">
                        <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-7xl font-black orbitron text-white w-80 uppercase text-center rounded-[2rem] border border-white/10" placeholder="PLACA">
                        <button onclick="window.nexusEscuchaPlaca()" class="absolute -right-4 -top-4 w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white animate-pulse group-hover:scale-125 transition-all"><i class="fas fa-microphone"></i></button>
                    </div>
                    <div>
                        <select id="f-estado" class="bg-transparent text-red-600 orbitron font-black text-xl uppercase outline-none cursor-pointer">
                            ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                        </select>
                        <p class="text-slate-500 text-[10px] orbitron font-bold uppercase">LOGISTIC_ID: ${ordenActiva.id || 'NEW_ENTRY'}</p>
                    </div>
                </div>
                <div class="flex gap-6">
                    <button onclick="window.generarPDFElite()" class="w-20 h-20 bg-white text-black rounded-[2rem] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center text-2xl"><i class="fas fa-file-pdf"></i></button>
                    <button id="btnCloseTerminal" class="w-20 h-20 bg-red-600 rounded-[2rem] text-white text-3xl font-black hover:rotate-90 transition-all flex items-center justify-center shadow-xl">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-[#0d1117] rounded-[3.5rem] border border-white/5 p-10 space-y-6">
                        <h4 class="orbitron font-black text-red-500 text-[10px] tracking-[0.3em] uppercase">Escudo Legal & CRM</h4>
                        <input id="f-cliente" value="${ordenActiva.cliente || ''}" placeholder="NOMBRE DEL CLIENTE" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-white font-black uppercase text-sm">
                        <input id="f-telefono" value="${ordenActiva.telefono || ''}" placeholder="WHATSAPP (+57)" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-emerald-400 font-black">
                        
                        <div class="grid grid-cols-2 gap-4">
                            <input id="f-km" value="${ordenActiva.recepcion?.km || ''}" type="number" placeholder="KM" class="bg-black p-5 rounded-2xl border border-white/5 text-white font-black">
                            <select id="f-gas" class="bg-black p-5 rounded-2xl border border-white/5 text-white orbitron text-[10px]">
                                <option value="1/4">1/4</option><option value="1/2">1/2</option><option value="FULL">FULL</option>
                            </select>
                        </div>
                        <button onclick="window.nexusDispararCamara()" class="w-full py-6 bg-red-600/10 border border-dashed border-red-600/50 rounded-2xl text-red-500 orbitron text-[10px] hover:bg-red-600 hover:text-white transition-all font-black"><i class="fas fa-camera mr-2"></i> REGISTRAR EVIDENCIA FOTO</button>
                    </div>

                    <div id="pricing-engine-container"></div>
                    
                    <div class="bg-black p-10 rounded-[3.5rem] border border-white/5 relative">
                         <span class="orbitron text-[9px] text-red-500 font-black mb-4 block italic uppercase">Neural Bitácora</span>
                         <textarea id="ai-log-display" class="w-full bg-[#0d1117] p-5 rounded-2xl text-[10px] h-44 outline-none border border-white/5 text-slate-400 font-mono">${ordenActiva.bitacora_ia || ''}</textarea>
                         <button onclick="window.nexusDictarBitacora()" class="absolute bottom-14 right-14 w-12 h-12 bg-white text-black rounded-full shadow-2xl hover:scale-110 transition-all"><i class="fas fa-microphone"></i></button>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 rounded-[4.5rem] border border-white/5 relative shadow-inner">
                        <div class="flex justify-between items-end mb-16">
                            <h2 id="total-factura" class="orbitron text-[9rem] font-black text-white italic tracking-tighter leading-none">$ 0</h2>
                            <div id="saldo-display"></div>
                        </div>
                        
                        <div id="items-container" class="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scroll"></div>
                        
                        <div class="grid grid-cols-3 gap-6 mt-12">
                            <button onclick="window.addItemNexus('REPUESTO')" class="py-8 bg-white/5 rounded-3xl border border-white/10 orbitron text-[10px] font-black text-white hover:bg-white hover:text-black transition-all uppercase tracking-widest">+ REPUESTO</button>
                            <button onclick="window.addItemNexus('MANO_OBRA')" class="py-8 bg-red-600/10 rounded-3xl border border-red-600/20 orbitron text-[10px] font-black text-red-500 hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest">+ MANO DE OBRA</button>
                            <button onclick="window.nexusAbrirRadar()" class="py-8 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 orbitron text-[10px] font-black text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all uppercase tracking-widest">🛰️ RADAR PROV</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="bg-black p-10 rounded-[3.5rem] border border-white/5 grid grid-cols-2 gap-8">
                            <div>
                                <label class="text-[9px] orbitron text-slate-500 block mb-3 font-black uppercase">ANTICIPO</label>
                                <input type="number" id="f-anticipo-cliente" value="${ordenActiva.anticipo || 0}" class="w-full bg-emerald-500/5 p-6 rounded-2xl text-emerald-400 font-black text-3xl border border-emerald-500/10" onchange="window.actualizarFinanzas()">
                            </div>
                            <div>
                                <label class="text-[9px] orbitron text-red-600 block mb-3 font-black uppercase">INSUMOS</label>
                                <input type="number" id="f-gastos-varios" value="${ordenActiva.insumos || 0}" class="w-full bg-red-600/5 p-6 rounded-2xl text-red-500 font-black text-3xl border border-red-600/10" onchange="window.actualizarFinanzas()">
                            </div>
                        </div>
                        <button id="btnSincronizar" class="bg-white text-black rounded-[3.5rem] orbitron font-black text-3xl hover:bg-red-600 hover:text-white transition-all shadow-2xl">🛰️ PUSH TO NEXUS CLOUD</button>
                    </div>
                </div>
            </div>
        </div>`;
        
        renderModuloPricing(document.getElementById('pricing-engine-container'));
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    // --- MANIOBRAS QUIRÚRGICAS (FUNCIONES GLOBALES) ---
    window.addItemNexus = async (tipo) => {
        let tec = 'INTERNO';
        let costo = 0;
        if(tipo === 'MANO_OBRA') {
            const { value:t } = await Swal.fire({ title:'ASIGNAR STAFF', input:'text', background:'#0d1117', color:'#fff', inputPlaceholder:'Nombre del técnico' });
            tec = t || 'PENDIENTE';
            const { value:c } = await Swal.fire({ title:'COSTO STAFF', input:'number', background:'#0d1117', color:'#fff', inputPlaceholder:'$ Pago a técnico' });
            costo = Number(c || 0);
        }
        ordenActiva.items.push({ tipo, desc:`NUEVO ${tipo}`, costo: costo, venta:0, origen:'TALLER', tecnico: tec, tiempo_estimado: 1 });
        recalcularFinanzas();
    };

    window.editItemNexus = (idx, c, v) => { 
        ordenActiva.items[idx][c] = (c === 'costo' || c === 'venta' || c === 'tiempo_estimado') ? Number(v) : v; 
        recalcularFinanzas(); 
    };

    window.nexusDispararCamara = () => document.getElementById('nexus-camera-input').click();

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
            document.getElementById('ai-log-display').value += `\n[VOICE]: ${txt}`;
            hablar("Bitácora actualizada");
        };
    };

    window.nexusAbrirRadar = async () => {
        const snap = await getDocs(collection(db, "proveedores"));
        const lista = snap.docs.map(d => `<div class="p-4 bg-white/5 mb-2 rounded-xl border border-white/10 flex justify-between"><span>${d.data().nombre}</span><span class="text-emerald-400 font-bold">${d.data().telefono}</span></div>`).join('');
        Swal.fire({ title:'RADAR PROVEEDORES', html: `<div class="text-left">${lista}</div>`, background:'#010409', color:'#fff' });
    };

    window.ejecutarCalculoTerminator = () => {
        const h = parseFloat(document.getElementById('m_horas').value);
        const res = analizarPrecioSugerido({
            horasEstimadas: h,
            tipoVehiculo: document.getElementById('m_gama').value,
            urgencia: document.getElementById('m_urgencia').value,
            tipoTrabajo: document.getElementById('m_procedimiento').value.toUpperCase()
        });
        ordenActiva.items.push({ 
            tipo: 'MANO_OBRA', desc: document.getElementById('m_procedimiento').value.toUpperCase(), 
            costo: 0, venta: res.precioSugerido, tiempo_estimado: h, origen: 'TALLER', tecnico: 'AI-PREDICT' 
        });
        recalcularFinanzas();
        hablar("Mano de obra predictiva añadida");
    };

    // --- SINCRONIZACIÓN MAESTRA (SAP BATCH) ---
    const ejecutarSincronizacionTotal = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true; btn.innerHTML = `<i class="fas fa-satellite-dish animate-spin"></i> SYNCING SAP...`;

        try {
            const batch = writeBatch(db);
            const id = ordenActiva.id || `OT_${document.getElementById('f-placa').value}_${Date.now()}`;
            
            const data = {
                ...ordenActiva,
                id, empresaId,
                placa: document.getElementById('f-placa').value.toUpperCase(),
                cliente: document.getElementById('f-cliente').value,
                telefono: document.getElementById('f-telefono').value,
                estado: document.getElementById('f-estado').value,
                recepcion: { km: document.getElementById('f-km').value, gas: document.getElementById('f-gas').value },
                anticipo: Number(document.getElementById('f-anticipo-cliente').value),
                insumos: Number(document.getElementById('f-gastos-varios').value),
                updatedAt: serverTimestamp()
            };

            // 1. Master Orden
            batch.set(doc(db, "ordenes", id), data);
            // 2. Contabilidad (Asiento Contable)
            batch.set(doc(db, "contabilidad", `ACC_${id}`), {
                empresaId, monto: data.costos_totales.gran_total, utilidad: data.costos_totales.utilidad, fecha: serverTimestamp()
            });

            await batch.commit();
            Swal.fire({ title:'TITAN SYNC OK', icon:'success', background:'#0d1117', color:'#fff' });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (e) { console.error(e); }
        finally { btn.disabled = false; btn.innerHTML = `🛰️ PUSH TO NEXUS CLOUD`; }
    };

    // --- BINDING ---
    const vincularEventosBase = () => {
        document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus();
        document.querySelectorAll(".fase-tab").forEach(tab => {
            tab.onclick = () => { faseActual = tab.dataset.fase; renderBase(); };
        });
    };

    const vincularAccionesTerminal = () => {
        document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
        document.getElementById("btnSincronizar").onclick = ejecutarSincronizacionTotal;
        document.getElementById('nexus-camera-input').onchange = (e) => {
            hablar("Foto de evidencia vinculada correctamente");
            Swal.fire({ title:'FOTO CAPTURADA', icon:'success', timer:1500, showConfirmButton:false });
        };
    };

    const actualizarContadores = () => {
        ['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].forEach(f => {
            const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", f));
            onSnapshot(q, s => {
                const el = document.getElementById(`count-${f}`);
                if(el) el.innerText = s.size;
            });
        });
        
        // Escucha de Grilla
        const qG = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", faseActual));
        onSnapshot(qG, s => {
            const grid = document.getElementById("grid-ordenes");
            if(grid) grid.innerHTML = s.docs.map(d => `
                <div onclick="window.abrirTerminalNexus('${d.id}')" class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 hover:border-red-600 transition-all cursor-pointer group">
                    <h4 class="orbitron text-3xl font-black text-white group-hover:text-red-500 mb-4">${d.data().placa}</h4>
                    <p class="text-[9px] text-slate-500 orbitron uppercase font-bold mb-4">${d.data().cliente || 'S/N'}</p>
                    <div class="flex justify-between border-t border-white/5 pt-4">
                        <span class="text-emerald-400 font-black">$ ${Math.round(d.data().costos_totales?.gran_total || 0).toLocaleString()}</span>
                        <i class="fas fa-chevron-right text-slate-800"></i>
                    </div>
                </div>`).join('');
        });
    };

    window.abrirTerminalNexus = (id = null) => {
        if(id) {
            getDoc(doc(db, "ordenes", id)).then(s => { ordenActiva = { id, ...s.data() }; renderTerminal(); });
        } else {
            ordenActiva = { placa:'', estado:'INGRESO', items:[], recepcion:{}, anticipo:0, insumos:0 };
            renderTerminal();
        }
        document.getElementById("nexus-terminal").classList.remove("hidden");
    };

    window.renderItems = () => {
        const container = document.getElementById("items-container");
        if(!container) return;
        container.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="flex items-center gap-6 bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5">
                <div class="w-16 h-16 rounded-2xl flex items-center justify-center bg-black border border-white/10 ${item.tipo === 'REPUESTO' ? 'text-white' : 'text-red-500'}">
                    <i class="fas ${item.tipo === 'REPUESTO' ? 'fa-box' : 'fa-user-cog'}"></i>
                </div>
                <div class="flex-1 grid grid-cols-4 gap-6">
                    <div class="col-span-2">
                        <input onchange="window.editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" class="bg-transparent text-white font-black orbitron text-sm outline-none w-full uppercase">
                        <span class="text-[7px] text-slate-500 orbitron font-bold">STAFF: ${item.tecnico || 'N/A'} | ${item.tiempo_estimado || 1}H</span>
                    </div>
                    <input type="number" onchange="window.editItemNexus(${idx}, 'costo', this.value)" value="${item.costo}" class="bg-black/40 p-4 rounded-xl text-red-500 font-black text-center text-xs" placeholder="COST">
                    <input type="number" onchange="window.editItemNexus(${idx}, 'venta', this.value)" value="${item.venta}" class="bg-black/40 p-4 rounded-xl text-emerald-400 font-black text-center text-xs" placeholder="PRICE">
                </div>
                <button onclick="ordenActiva.items.splice(${idx}, 1); recalcularFinanzas();" class="text-white/10 hover:text-red-500 transition-colors">✕</button>
            </div>`).join('');
    };

    renderBase();
}
