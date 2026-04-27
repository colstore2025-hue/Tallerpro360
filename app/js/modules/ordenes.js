/**
 * ordenes.js - NEXUS-X "THE TITAN" FINAL MISSION 🛰️
 * SISTEMA DE DESCUENTO DE STOCK + BITÁCORA PROFESIONAL + SAP INTEGRITY
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, updateDoc, serverTimestamp, writeBatch, increment, limit 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { analizarPrecioSugerido, renderModuloPricing } from "../ai/pricingEnginePRO360.js";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;

    // --- 1. MOTOR FINANCIERO & SAP ---
    const recalcularFinanzas = () => {
        if (!ordenActiva) return;
        let m = { v_rep: 0, c_rep: 0, v_mo: 0, c_mo: 0 };

        ordenActiva.items.forEach(i => {
            const v = Number(i.venta || 0);
            const c = Number(i.costo || 0);
            if (i.tipo === 'REPUESTO') {
                if(i.origen !== 'EXTERNO') { m.v_rep += v; m.c_rep += c; }
            } else {
                m.v_mo += v; m.c_mo += c; 
            }
        });

        const ins_iva = Number(document.getElementById("f-insumos-iva")?.value || 0); 
        const ins_no_iva = Number(document.getElementById("f-insumos-no-iva")?.value || 0); 
        const ant = Number(document.getElementById("f-anticipo")?.value || 0); 
        
        const sub_gravado = m.v_rep + m.v_mo + ins_iva;
        const base = sub_gravado / 1.19;
        const iva = sub_gravado - base;
        const total = sub_gravado + ins_no_iva;
        const ebitda = (base + ins_no_iva) - (m.c_rep + m.c_mo + (ins_iva / 1.19));

        ordenActiva.costos_totales = { total, base, iva, saldo: total - ant, ebitda };

        actualizarUIFinanciera();
        renderItems();
    };

    const actualizarUIFinanciera = () => {
        const { total, base, iva, ebitda, saldo } = ordenActiva.costos_totales;
        document.getElementById("total-factura").innerText = `$ ${Math.round(total).toLocaleString()}`;
        document.getElementById("finance-summary").innerHTML = `
            <div class="grid grid-cols-2 gap-4 border-t border-cyan-500/30 pt-4 mt-4">
                <div class="text-[10px] orbitron text-slate-500 uppercase">Base: <span class="text-white">$${Math.round(base).toLocaleString()}</span></div>
                <div class="text-[10px] orbitron text-slate-500 text-right uppercase">IVA 19%: <span class="text-white">$${Math.round(iva).toLocaleString()}</span></div>
                <div class="text-green-400 font-black text-2xl orbitron italic">EBITDA: $${Math.round(ebitda).toLocaleString()}</div>
                <div class="text-red-500 font-black text-2xl orbitron text-right">SALDO: $${Math.round(saldo).toLocaleString()}</div>
            </div>`;
    };

    // --- 2. GESTIÓN DE STOCK (CONEXIÓN INVENTARIO.JS) ---
    window.nexusAddRepuesto = async () => {
        const { value: busqueda } = await Swal.fire({ 
            title: 'NEXUS STOCK SYSTEM', 
            input: 'text', inputPlaceholder: 'Buscar en inventario.js...',
            background: '#0a0f18', color: '#fff', customClass: { input: 'orbitron' }
        });
        
        if(busqueda) {
            const q = query(collection(db, "productos"), where("empresaId", "==", empresaId), where("nombre", ">=", busqueda.toUpperCase()), limit(5));
            const snap = await getDocs(q);
            const prods = snap.docs.map(d => ({id: d.id, ...d.data()}));
            
            if(prods.length > 0) {
                const options = Object.fromEntries(prods.map(p => [p.id, `${p.nombre} (Stock: ${p.stock || 0})`]));
                const { value: selId } = await Swal.fire({ title: 'SELECCIONAR ITEM', input: 'select', inputOptions: options, background: '#0a0f18', color: '#fff' });
                if(selId) {
                    const p = prods.find(x => x.id === selId);
                    ordenActiva.items.push({ 
                        tipo: 'REPUESTO', desc: p.nombre, costo: p.costo || 0, 
                        venta: p.venta || 0, idRef: p.id, origen: 'TALLER', cantidad: 1 
                    });
                    recalcularFinanzas();
                }
            } else {
                const { value: ext } = await Swal.fire({ title: 'ITEM NO ENCONTRADO', input: 'text', text: 'Nombre del repuesto externo:', background: '#0a0f18', color: '#fff' });
                if(ext) {
                    ordenActiva.items.push({ tipo: 'REPUESTO', desc: ext.toUpperCase(), costo: 0, venta: 0, origen: 'EXTERNO', cantidad: 1 });
                    recalcularFinanzas();
                }
            }
        }
    };

    // --- 3. SINCRONIZACIÓN ATÓMICA & DESCUENTO STOCK ---
    window.nexusSincronizar = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-sync animate-spin"></i> PROCESANDO_DATA...`;

        try {
            const batch = writeBatch(db);
            const placa = document.getElementById("f-placa").value.toUpperCase();
            const id = ordenActiva.id || `OT_${placa}_${Date.now()}`;

            const data = {
                ...ordenActiva,
                id, placa, empresaId,
                cliente: document.getElementById("f-cliente").value.toUpperCase(),
                identificacion: document.getElementById("f-id").value,
                telefono: document.getElementById("f-telefono").value,
                km: document.getElementById("f-km").value,
                bitacora: document.getElementById("f-bitacora").value,
                insumos_iva: Number(document.getElementById("f-insumos-iva").value),
                insumos_no_iva: Number(document.getElementById("f-insumos-no-iva").value),
                anticipo: Number(document.getElementById("f-anticipo").value),
                updatedAt: serverTimestamp(),
                estado: document.getElementById("f-estado").value
            };

            // Guardar Orden
            batch.set(doc(db, "ordenes", id), data);

            // DESCUENTO DE STOCK EN INVENTARIO.JS
            ordenActiva.items.forEach(item => {
                if(item.tipo === 'REPUESTO' && item.origen === 'TALLER' && item.idRef) {
                    const prodRef = doc(db, "productos", item.idRef);
                    batch.update(prodRef, { stock: increment(-1) }); // Descuenta 1 unidad
                }
            });

            await batch.commit();
            ordenActiva.id = id;
            hablar("Orden sincronizada. Inventario actualizado.");
            Swal.fire({ title: 'SUCCESS', text: 'Data Cloud & Stock OK', icon: 'success', background: '#0a0f18', color: '#fff' });
            btn.disabled = false;
            btn.innerHTML = `🛰️ Sincronizar_Cloud_SAP`;
        } catch (e) {
            console.error(e);
            btn.disabled = false;
            btn.innerHTML = `⚠️ ERROR_REINTENTAR`;
        }
    };

    // --- 4. TERMINAL & BITÁCORA ---
    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1700px] mx-auto pb-40 animate-in fade-in duration-500">
            <header class="flex justify-between items-center bg-[#0d1117] p-10 border-l-8 border-red-600 rounded-r-[3rem] mb-12 shadow-2xl">
                <div class="flex items-center gap-8">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-8xl font-black orbitron text-white w-[35rem] uppercase border-none outline-none" placeholder="PLACA">
                    <button onclick="window.nexusVozPlaca()" class="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)]"><i class="fas fa-microphone text-3xl"></i></button>
                </div>
                <div class="text-center">
                    <span class="orbitron text-[10px] text-slate-500 block mb-2 tracking-[0.5em]">STATUS_ENGINE</span>
                    <select id="f-estado" class="bg-black text-cyan-400 orbitron font-black text-2xl p-4 rounded-2xl border border-white/5 outline-none">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO_LIQUIDADO'].map(e => 
                            `<option value="${e}" ${ordenActiva.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
                    </select>
                </div>
                <button onclick="document.getElementById('nexus-terminal').classList.add('hidden')" class="w-24 h-24 bg-white/5 text-white text-4xl rounded-full hover:bg-red-600 transition-all">✕</button>
            </header>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div class="lg:col-span-4 space-y-8">
                    <div class="bg-[#0d1117] p-8 border border-white/5 rounded-[3rem]">
                        <h4 class="orbitron text-cyan-500 text-[11px] font-black mb-6 uppercase tracking-widest italic italic">Data Maestra SAP</h4>
                        <div class="space-y-4">
                            <input id="f-cliente" value="${ordenActiva.cliente || ''}" placeholder="CLIENTE / EMPRESA" class="w-full bg-black p-5 text-white font-bold uppercase text-xs border border-white/10 rounded-xl">
                            <input id="f-id" value="${ordenActiva.identificacion || ''}" placeholder="NIT / C.C." class="w-full bg-black p-5 text-white font-bold text-xs border border-white/10 rounded-xl">
                            <div class="grid grid-cols-2 gap-4">
                                <input id="f-telefono" value="${ordenActiva.telefono || ''}" placeholder="WHATSAPP" class="bg-black p-5 text-green-400 font-bold border border-white/10 rounded-xl">
                                <input id="f-km" value="${ordenActiva.km || ''}" placeholder="KILOMETRAJE" class="bg-black p-5 text-yellow-500 font-bold border border-white/10 rounded-xl">
                            </div>
                        </div>
                    </div>

                    <div class="bg-black p-8 border border-red-600/20 rounded-[3rem] relative shadow-2xl">
                        <span class="orbitron text-[10px] text-red-500 font-black block mb-4 italic uppercase">Historial de Hallazgos Técnicos</span>
                        <textarea id="f-bitacora" class="w-full bg-transparent text-slate-300 text-xs h-60 outline-none font-mono leading-relaxed" placeholder="Reporte para el cliente...">${ordenActiva.bitacora || ''}</textarea>
                        <button onclick="window.nexusVozBitacora()" class="absolute bottom-8 right-8 w-16 h-16 bg-white text-black rounded-full shadow-2xl hover:scale-110 transition-all"><i class="fas fa-microphone text-xl"></i></button>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 border border-cyan-500/10 rounded-[4rem] shadow-2xl">
                        <div class="flex justify-between items-start mb-12">
                            <h2 id="total-factura" class="orbitron text-[9rem] font-black text-white italic leading-none tracking-tighter">$ 0</h2>
                            <div id="finance-summary" class="w-96"></div>
                        </div>
                        <div id="items-container" class="space-y-4 max-h-[450px] overflow-y-auto pr-6 custom-scroll"></div>
                        <div class="grid grid-cols-2 gap-6 mt-12">
                            <button onclick="window.nexusAddRepuesto()" class="py-8 border-2 border-dashed border-cyan-500/30 orbitron text-[11px] font-black text-cyan-500 hover:bg-cyan-500/5 rounded-[2rem] uppercase italic">Vincular_Stock_Real</button>
                            <button onclick="window.nexusAddMO()" class="py-8 border-2 border-dashed border-red-600/30 orbitron text-[11px] font-black text-red-600 hover:bg-red-600/5 rounded-[2rem] uppercase italic">Añadir_Mano_Obra</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-6">
                        <div class="bg-black p-8 rounded-[2.5rem] border border-white/5">
                            <label class="orbitron text-[9px] text-slate-500 block mb-2 uppercase tracking-widest">Insumos (+IVA)</label>
                            <input id="f-insumos-iva" value="${ordenActiva.insumos_iva || 0}" type="number" onchange="window.recalcular()" class="bg-transparent text-white text-4xl font-black w-full outline-none">
                        </div>
                        <div class="bg-black p-8 rounded-[2.5rem] border border-white/5">
                            <label class="orbitron text-[9px] text-yellow-600 block mb-2 uppercase tracking-widest">Insumos (S/IVA)</label>
                            <input id="f-insumos-no-iva" value="${ordenActiva.insumos_no_iva || 0}" type="number" onchange="window.recalcular()" class="bg-transparent text-yellow-600 text-4xl font-black w-full outline-none">
                        </div>
                        <div class="bg-black p-8 rounded-[2.5rem] border border-white/5">
                            <label class="orbitron text-[9px] text-green-500 block mb-2 uppercase tracking-widest">Anticipo</label>
                            <input id="f-anticipo" value="${ordenActiva.anticipo || 0}" type="number" onchange="window.recalcular()" class="bg-transparent text-green-400 text-4xl font-black w-full outline-none">
                        </div>
                    </div>

                    <button id="btnSincronizar" onclick="window.nexusSincronizar()" class="w-full bg-cyan-500 text-black py-10 orbitron font-black text-4xl rounded-[3rem] hover:bg-white hover:scale-[1.02] transition-all uppercase italic shadow-[0_20px_50px_rgba(0,242,255,0.2)]">🛰️ Sincronizar_Cloud_SAP</button>
                </div>
            </div>
        </div>`;
        recalcularFinanzas();
    };

    // --- 5. LOGICA DE VOZ (LIMPIA) ---
    window.nexusVozBitacora = () => {
        if(!recognition) return;
        hablar("Reporte hallazgos");
        recognition.start();
        recognition.onresult = (e) => {
            const txt = e.results[0][0].transcript;
            // Limpieza de IA_LOG: Ahora es un registro profesional directo
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            document.getElementById('f-bitacora').value += `\n[${timestamp}] - ${txt.toUpperCase()}`;
            hablar("Actualizado");
        };
    };

    window.nexusVozPlaca = () => {
        if(!recognition) return;
        hablar("Dictar placa");
        setTimeout(() => {
            recognition.start();
            recognition.onresult = (e) => {
                const txt = e.results[0][0].transcript.replace(/[^A-Z0-9]/g, '').toUpperCase();
                document.getElementById('f-placa').value = txt;
                hablar(`Placa ${txt}`);
            };
        }, 1200);
    };

    window.nexusAddMO = () => {
        ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: 'SERVICIO TÉCNICO', costo: 0, venta: 0 });
        recalcularFinanzas();
    };

    window.updateItem = (idx, campo, valor) => {
        ordenActiva.items[idx][campo] = (campo === 'desc') ? valor.toUpperCase() : Number(valor);
        recalcularFinanzas();
    };

    window.renderItems = () => {
        const wrap = document.getElementById("items-container");
        if(!wrap) return;
        wrap.innerHTML = ordenActiva.items.map((it, idx) => `
            <div class="flex items-center gap-6 bg-white/[0.02] p-6 rounded-3xl border border-white/5 group hover:border-cyan-500/30 transition-all">
                <div class="flex-1 grid grid-cols-4 gap-6">
                    <div class="col-span-2">
                        <input onchange="window.updateItem(${idx}, 'desc', this.value)" value="${it.desc}" class="bg-transparent text-white font-black orbitron text-xs outline-none w-full uppercase">
                        <span class="text-[8px] orbitron ${it.tipo === 'REPUESTO' ? 'text-cyan-500' : 'text-red-500'} font-bold uppercase tracking-widest">${it.tipo} ${it.origen ? '| '+it.origen : ''}</span>
                    </div>
                    <div>
                        <span class="text-[8px] orbitron text-slate-500 block mb-1">COSTO</span>
                        <input type="number" onchange="window.updateItem(${idx}, 'costo', this.value)" value="${it.costo}" class="bg-black/40 p-2 text-red-500 font-black text-center orbitron text-xs rounded-xl w-full">
                    </div>
                    <div>
                        <span class="text-[8px] orbitron text-slate-500 block mb-1">VENTA</span>
                        <input type="number" onchange="window.updateItem(${idx}, 'venta', this.value)" value="${it.venta}" class="bg-black/40 p-2 text-green-400 font-black text-center orbitron text-xs rounded-xl w-full border border-green-500/20">
                    </div>
                </div>
                <button onclick="ordenActiva.items.splice(${idx},1); recalcularFinanzas()" class="text-slate-600 hover:text-red-500 transition-all"><i class="fas fa-trash-alt"></i></button>
            </div>`).join('');
    };

    const cargarParrilla = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const grid = document.getElementById("grid-ordenes");
            if (!grid) return;
            grid.innerHTML = snap.docs
                .filter(d => d.data().estado !== 'CANCELADO_LIQUIDADO')
                .map(d => {
                    const o = d.data();
                    return `
                    <div onclick="window.abrirTerminal('${d.id}')" class="bg-[#0d1117] p-8 border border-white/5 rounded-[2.5rem] hover:border-red-600 transition-all cursor-pointer group shadow-xl">
                        <h4 class="orbitron text-5xl font-black text-white group-hover:text-red-500 mb-2 tracking-tighter">${o.placa}</h4>
                        <p class="text-[10px] text-slate-500 mb-6 font-bold uppercase">${o.cliente || 'CLIENTE_S_N'}</p>
                        <div class="pt-6 border-t border-white/5 flex justify-between items-center">
                            <span class="orbitron text-green-400 font-black text-xl">$ ${Math.round(o.costos_totales?.total || 0).toLocaleString()}</span>
                            <span class="text-[8px] orbitron bg-red-600 text-white px-3 py-1 rounded-full uppercase">${o.estado}</span>
                        </div>
                    </div>`;
                }).join('');
        });
    };

    window.abrirTerminal = (id = null) => {
        if(id) {
            getDoc(doc(db, "ordenes", id)).then(s => { ordenActiva = { id, ...s.data() }; renderTerminal(); });
        } else {
            ordenActiva = { placa:'', estado:'INGRESO', items:[], cliente:'', identificacion:'', telefono:'', km:'', anticipo:0, insumos_iva:0, insumos_no_iva:0, bitacora:'' };
            renderTerminal();
        }
        document.getElementById("nexus-terminal").classList.remove("hidden");
    };

    window.recalcular = recalcularFinanzas;
    
    // --- UI BASE ---
    container.innerHTML = `
    <div class="p-6 lg:p-12 bg-[#05070a] min-h-screen text-slate-100 pb-40">
        <header class="flex justify-between items-end mb-16 border-b-2 border-red-600 pb-10">
            <div>
                <h1 class="orbitron text-7xl font-black italic tracking-tighter text-white uppercase">Nexus<span class="text-red-600">_X</span></h1>
                <p class="text-[10px] orbitron text-cyan-400 font-bold tracking-[0.8em] uppercase italic">Automotive Logistics System</p>
            </div>
            <button onclick="window.abrirTerminal()" class="px-12 py-5 bg-cyan-500 text-black orbitron text-[10px] font-black hover:bg-white transition-all shadow-[8px_8px_0px_rgba(0,242,255,0.3)] uppercase italic">NUEVA ORDEN +</button>
        </header>
        <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"></div>
        <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-black/98 backdrop-blur-2xl p-6 lg:p-12 overflow-y-auto custom-scroll"></div>
    </div>`;
    
    cargarParrilla();
}
