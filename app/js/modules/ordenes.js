/**
 * ordenes.js - NEXUS-X "QUANTUM-SAP" V8.8 GOLD EDITION 🛰️
 * SISTEMA INTEGRADO DE GESTIÓN LOGÍSTICA Y TALLER ELITE
 * AUTOR: WILLIAM JEFFRY URQUIJO CUBILLOS
 * STATUS: PRODUCTION READY / ZERO FRICTION
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, 
    setDoc, serverTimestamp, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;
    let faseActual = 'INGRESO';

    // --- 1. MOTOR DE INTELIGENCIA DE PRECIOS (INTEGRADO) ---
    const pricingEngine = {
        analizar: (item) => {
            const margen = ((item.venta - item.costo) / item.venta) * 100;
            if (margen < 25) return { status: 'CRÍTICO', color: '#ff0000', icon: 'fa-exclamation-triangle' };
            if (margen < 40) return { status: 'OPTIMAL', color: '#00f2ff', icon: 'fa-check-circle' };
            return { status: 'HIGH-PROFIT', color: '#10b981', icon: 'fa-gem' };
        }
    };

    // --- 2. NÚCLEO FINANCIERO (SAP BI LOGIC) ---
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
        const total = m.v_rep + m.v_mo; 
        const ebitda = (total / 1.19) - (m.c_rep + m.c_mo + insumos);

        ordenActiva.costos_totales = { total, saldo: total - anticipo, ebitda, tiempo: m.tiempo };

        const totalEl = document.getElementById("total-factura");
        if(totalEl) {
            totalEl.innerText = `$ ${Math.round(total).toLocaleString()}`;
            document.getElementById("saldo-display").innerHTML = `
                <div class="space-y-1">
                    <span class="text-cyan-500/50 text-[9px] orbitron block font-black">EFFICIENCY: ${m.tiempo}H</span>
                    <span class="${ordenActiva.costos_totales.saldo > 0 ? 'text-red-500' : 'text-emerald-400'} font-black text-4xl orbitron italic">
                        $ ${Math.round(ordenActiva.costos_totales.saldo).toLocaleString()}
                    </span>
                </div>`;
        }
        renderItems();
    };

    // --- 3. UI ARCHITECTURE (THE MASTER VIEW) ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-slate-100 font-sans pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-end gap-6 mb-16 border-b border-white/5 pb-10">
                <div class="space-y-2">
                    <h1 class="orbitron text-7xl font-black italic tracking-tighter text-white">NEXUS<span class="text-red-600">_X</span></h1>
                    <p class="text-[10px] orbitron text-red-600/60 tracking-[0.6em] font-bold uppercase">Quantum-SAP Logistics Center</p>
                </div>
                <div class="flex gap-4">
                    <button id="btnNewMission" class="px-12 py-6 bg-white text-black rounded-full orbitron text-[10px] font-black hover:bg-red-600 hover:text-white transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)] uppercase">NUEVA ORDEN +</button>
                </div>
            </header>

            <nav class="grid grid-cols-2 md:grid-cols-6 gap-6 mb-20">
                ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(f => `
                    <button class="fase-tab p-8 rounded-[2.5rem] bg-[#0d1117] border-2 ${faseActual === f ? 'border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.15)]' : 'border-white/5'} transition-all group" data-fase="${f}">
                        <span class="orbitron text-[9px] ${faseActual === f ? 'text-red-500' : 'text-slate-600'} group-hover:text-red-500 mb-3 block font-black uppercase tracking-widest">${f}</span>
                        <h3 id="count-${f}" class="text-5xl font-black text-white italic">0</h3>
                    </button>`).join('')}
            </nav>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"></div>
            
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl p-6 lg:p-12 overflow-y-auto custom-scroll"></div>
        </div>`;
        vincularEventosBase();
        cargarEscuchaOrdenes();
    };

    // --- 4. TERMINAL QUIRÚRGICA (THE HARLEY EXPERIENCE) ---
    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1500px] mx-auto pb-40 animate-in fade-in zoom-in duration-500">
            <div class="flex justify-between items-center mb-16 bg-[#0d1117] p-12 rounded-[3.5rem] border-b-8 border-red-600 shadow-2xl">
                <div class="flex items-center gap-8">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-7xl font-black orbitron text-white w-80 uppercase text-center rounded-[2rem] border border-white/10" placeholder="PLACA">
                    <div>
                        <p class="text-red-600 orbitron font-black text-xs tracking-widest">COMMAND CENTER // STATUS: ${ordenActiva.estado}</p>
                        <p class="text-slate-500 text-[10px] orbitron font-bold">LOGISTIC_ID: ${ordenActiva.id || 'NEW_ENTRY'}</p>
                    </div>
                </div>
                <div class="flex gap-6">
                    <button onclick="window.generarPDFElite()" class="w-20 h-20 bg-white text-black rounded-[2rem] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center text-2xl shadow-xl"><i class="fas fa-file-pdf"></i></button>
                    <button id="btnCloseTerminal" class="w-20 h-20 bg-red-600 rounded-[2rem] text-white text-3xl font-black hover:rotate-90 transition-all flex items-center justify-center shadow-xl">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-[#0d1117] rounded-[3rem] border border-white/5 p-10 space-y-6">
                        <h4 class="orbitron font-black text-red-500 text-[10px] tracking-widest uppercase mb-4">Escudo Legal & CRM</h4>
                        <div class="grid grid-cols-3 gap-2">
                            <select id="f-tipo-doc" class="bg-black p-5 rounded-2xl border border-white/5 text-white text-[10px] orbitron">
                                <option value="CC" ${ordenActiva.cliente_data?.tipo_doc === 'CC' ? 'selected':''}>CC</option>
                                <option value="NIT" ${ordenActiva.cliente_data?.tipo_doc === 'NIT' ? 'selected':''}>NIT</option>
                            </select>
                            <input id="f-doc" value="${ordenActiva.cliente_data?.doc || ''}" placeholder="DOCUMENTO" class="col-span-2 bg-black p-5 rounded-2xl border border-white/5 text-white font-bold">
                        </div>
                        <input id="f-cliente" value="${ordenActiva.cliente_data?.nombre || ''}" placeholder="NOMBRE DEL CLIENTE" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-white font-black uppercase text-sm">
                        <input id="f-telefono" value="${ordenActiva.cliente_data?.telefono || ''}" placeholder="WHATSAPP (+57)" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-emerald-400 font-black">
                        
                        <div class="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-[8px] orbitron text-slate-500 mb-2 block font-black uppercase">KILOMETRAJE</label>
                                <input id="f-km" value="${ordenActiva.recepcion?.km || ''}" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-white font-black">
                            </div>
                            <div>
                                <label class="text-[8px] orbitron text-slate-500 mb-2 block font-black uppercase">GAS</label>
                                <select id="f-gas" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-white orbitron text-[10px]">
                                    <option>1/4</option><option>1/2</option><option>3/4</option><option>FULL</option>
                                </select>
                            </div>
                        </div>
                        <button onclick="window.tomarFotoEvidencia()" class="w-full py-6 bg-white/5 border border-dashed border-white/20 rounded-2xl text-white orbitron text-[10px] hover:bg-white/10 transition-all font-black"><i class="fas fa-camera mr-2"></i> REGISTRAR EVIDENCIA FOTO</button>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 relative shadow-inner">
                        <div class="flex justify-between items-end mb-16">
                            <h2 id="total-factura" class="orbitron text-[10rem] font-black text-white italic tracking-tighter leading-none">$ 0</h2>
                            <div id="saldo-display" class="text-right"></div>
                        </div>
                        
                        <div id="items-container" class="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scroll"></div>
                        
                        <div class="grid grid-cols-3 gap-6 mt-12">
                            <button onclick="window.addItem('REPUESTO')" class="py-8 bg-white/5 rounded-3xl border border-white/10 orbitron text-[10px] font-black text-white hover:bg-white hover:text-black transition-all uppercase tracking-widest">+ AÑADIR REPUESTO</button>
                            <button onclick="window.addItem('MANO_OBRA')" class="py-8 bg-red-600/10 rounded-3xl border border-red-600/20 orbitron text-[10px] font-black text-red-500 hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest">+ AÑADIR MANO OBRA</button>
                            <button onclick="window.abrirRadar()" class="py-8 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 orbitron text-[10px] font-black text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all uppercase tracking-widest">🛰️ RADAR PROV</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="bg-black p-10 rounded-[3rem] border border-white/5 flex gap-8">
                            <div class="flex-1">
                                <label class="text-[9px] orbitron text-slate-500 block mb-3 font-black uppercase">ANTICIPO</label>
                                <input type="number" id="f-anticipo-cliente" value="${ordenActiva.anticipo || 0}" class="w-full bg-emerald-500/10 p-6 rounded-2xl text-emerald-400 font-black text-3xl border border-emerald-500/20" onchange="window.actualizar()">
                            </div>
                            <div class="flex-1">
                                <label class="text-[9px] orbitron text-red-600 block mb-3 font-black uppercase">INSUMOS TALLER</label>
                                <input type="number" id="f-gastos-varios" value="${ordenActiva.insumos || 0}" class="w-full bg-red-600/10 p-6 rounded-2xl text-red-500 font-black text-3xl border border-red-600/20" onchange="window.actualizar()">
                            </div>
                        </div>
                        <button id="btnSincronizar" class="bg-white text-black rounded-[3rem] orbitron font-black text-3xl hover:bg-red-600 hover:text-white transition-all shadow-[0_20px_80px_rgba(255,255,255,0.1)]">🛰️ PUSH TO NEXUS</button>
                    </div>
                </div>
            </div>
        </div>`;
        
        vincularEventosTerminal();
        recalcularFinanzas();
    };

    const renderItems = () => {
        const container = document.getElementById("items-container");
        if(!container) return;
        container.innerHTML = ordenActiva.items.map((item, idx) => {
            const ai = pricingEngine.analizar(item);
            return `
            <div class="flex items-center gap-6 bg-white/[0.02] p-8 rounded-[2.5rem] border-l-8 transition-all hover:bg-white/[0.04]" style="border-color: ${ai.color}">
                <div class="w-16 h-16 rounded-2xl flex items-center justify-center bg-black border border-white/10 text-white">
                    <i class="fas ${item.tipo === 'REPUESTO' ? 'fa-cog' : 'fa-wrench'}"></i>
                </div>
                <div class="flex-1 grid grid-cols-4 gap-6">
                    <div class="col-span-2">
                        <input onchange="window.editItem(${idx}, 'desc', this.value)" value="${item.desc}" class="bg-transparent text-white font-black orbitron text-sm outline-none w-full uppercase">
                        <span class="text-[8px] orbitron font-bold" style="color:${ai.color}"><i class="fas ${ai.icon} mr-1"></i> ${ai.status}</span>
                    </div>
                    <input type="number" onchange="window.editItem(${idx}, 'costo', this.value)" value="${item.costo}" class="bg-black/40 p-4 rounded-xl text-red-500 font-black text-center orbitron text-xs" placeholder="COST">
                    <input type="number" onchange="window.editItem(${idx}, 'venta', this.value)" value="${item.venta}" class="bg-black/40 p-4 rounded-xl text-emerald-400 font-black text-center orbitron text-xs" placeholder="PRICE">
                </div>
                <button onclick="window.removeItem(${idx})" class="text-slate-700 hover:text-red-500 transition-colors"><i class="fas fa-trash-alt"></i></button>
            </div>`;
        }).join('');
    };

    // --- 5. LOGICA DE ACCIONES (WINDOW SCOPE PARA ESTABILIDAD) ---
    window.addItem = async (tipo) => {
        ordenActiva.items.push({ tipo, desc: `NUEVO ${tipo}`, costo: 0, venta: 0, origen: 'TALLER', tiempo_estimado: 1 });
        recalcularFinanzas();
    };

    window.editItem = (idx, campo, valor) => {
        ordenActiva.items[idx][campo] = (campo === 'desc') ? valor : Number(valor);
        recalcularFinanzas();
    };

    window.removeItem = (idx) => {
        ordenActiva.items.splice(idx, 1);
        recalcularFinanzas();
    };

    window.actualizar = () => recalcularFinanzas();

    window.abrirTerminalNexus = (id = null) => {
        if(id) {
            getDoc(doc(db, "ordenes", id)).then(s => {
                ordenActiva = { id, ...s.data() };
                renderTerminal();
            });
        } else {
            ordenActiva = { placa: '', estado: 'INGRESO', items: [], cliente_data: {}, recepcion: {}, anticipo: 0, insumos: 0 };
            renderTerminal();
        }
        document.getElementById("nexus-terminal").classList.remove("hidden");
    };

    const ejecutarSincronizacionNexus = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-satellite-dish animate-spin"></i> SYNCING...`;

        const batch = writeBatch(db);
        const placa = document.getElementById("f-placa").value.toUpperCase();
        const id = ordenActiva.id || `OT_${placa}_${Date.now()}`;

        const data = {
            ...ordenActiva,
            id, placa, empresaId,
            cliente_data: {
                nombre: document.getElementById("f-cliente").value,
                doc: document.getElementById("f-doc").value,
                tipo_doc: document.getElementById("f-tipo-doc").value,
                telefono: document.getElementById("f-telefono").value
            },
            recepcion: {
                km: document.getElementById("f-km").value,
                gas: document.getElementById("f-gas").value
            },
            updatedAt: serverTimestamp()
        };

        batch.set(doc(db, "ordenes", id), data);
        await batch.commit();
        
        hablar("Sincronización exitosa. Datos en la nube Nexus.");
        Swal.fire({ title: 'SYNC OK', icon: 'success', background: '#0d1117', color: '#fff' });
        btn.disabled = false;
        btn.innerHTML = `🛰️ PUSH TO NEXUS`;
    };

    // --- 6. EVENT BINDING ---
    const vincularEventosBase = () => {
        document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus();
        document.querySelectorAll(".fase-tab").forEach(tab => {
            tab.onclick = () => { faseActual = tab.dataset.fase; renderBase(); };
        });
    };

    const vincularEventosTerminal = () => {
        document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
        document.getElementById("btnSincronizar").onclick = ejecutarSincronizacionNexus;
    };

    const cargarEscuchaOrdenes = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", faseActual));
        onSnapshot(q, (snap) => {
            const grid = document.getElementById("grid-ordenes");
            if (!grid) return;
            grid.innerHTML = snap.docs.map(d => {
                const o = d.data();
                return `
                <div onclick="window.abrirTerminalNexus('${d.id}')" class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 hover:border-red-600 transition-all cursor-pointer group">
                    <div class="flex justify-between items-start mb-6">
                        <h4 class="orbitron text-3xl font-black text-white group-hover:text-red-500">${o.placa}</h4>
                        <span class="text-[8px] px-3 py-1 bg-white/5 rounded-full orbitron text-slate-500">${o.estado}</span>
                    </div>
                    <p class="text-xs text-slate-400 mb-4 font-bold uppercase">${o.cliente_data?.nombre || 'S/N'}</p>
                    <div class="pt-4 border-t border-white/5 flex justify-between items-center">
                        <span class="orbitron text-emerald-400 font-black">$ ${Math.round(o.costos_totales?.total || 0).toLocaleString()}</span>
                        <i class="fas fa-arrow-right text-slate-800 group-hover:translate-x-2 transition-transform"></i>
                    </div>
                </div>`;
            }).join('');
        });
        
        // Contadores globales
        ['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].forEach(f => {
            const qC = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", f));
            onSnapshot(qC, s => {
                const el = document.getElementById(`count-${f}`);
                if(el) el.innerText = s.size;
            });
        });
    };

    // --- INICIALIZACIÓN FINAL ---
    renderBase();
}
