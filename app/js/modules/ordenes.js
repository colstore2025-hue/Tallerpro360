/**
 * ordenes.js - NEXUS-X "THE TITAN" V20.0 🛰️
 * CONSOLIDACIÓN TOTAL: QUANTUM-SAP + NEON UI + VOICE AI + HARLEY EXPERIENCE
 * ARQUITECTO: WILLIAM JEFFRY URQUIJO CUBILLOS & GEMINI AI PRO
 * STATUS: PRODUCCIÓN FINAL - INTEGRIDAD TOTAL
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, updateDoc, serverTimestamp, writeBatch, limit 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { analizarPrecioSugerido, renderModuloPricing } from "../ai/pricingEnginePRO360.js";

// --- MOTOR DE VOZ NEURAL (REGLA DE ORO: SIN ECO) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;

    if (!empresaId) {
        container.innerHTML = `<div class="p-10 orbitron text-red-500">ERROR: NO_EMPRESA_ID_DETECTED</div>`;
        return;
    }

    // --- 1. MOTOR FINANCIERO QUANTUM-SAP (PRECISIÓN ABSOLUTA) ---
    const recalcularFinanzas = () => {
        if (!ordenActiva) return;
        let m = { v_rep: 0, c_rep: 0, v_mo: 0, c_mo: 0 };

        ordenActiva.items.forEach(i => {
            const v = Number(i.venta || 0);
            const c = Number(i.costo || 0);
            if (i.tipo === 'REPUESTO') {
                if(i.origen !== 'CLIENTE') { m.v_rep += v; m.c_rep += c; }
            } else {
                m.v_mo += v; m.c_mo += c; 
            }
        });

        const insumosIVA = Number(document.getElementById("f-insumos-iva")?.value || 0); 
        const insumosNoIVA = Number(document.getElementById("f-insumos-no-iva")?.value || 0); 
        const anticipo = Number(document.getElementById("f-anticipo")?.value || 0); 
        
        const subtotalGravado = m.v_rep + m.v_mo + insumosIVA;
        const baseGravable = subtotalGravado / 1.19;
        const iva = subtotalGravado - baseGravable;
        const totalFactura = subtotalGravado + insumosNoIVA;
        
        // EBITDA REAL = Base Gravable + Insumos No IVA - (Costos Reales)
        const ebitda = (baseGravable + insumosNoIVA) - (m.c_rep + m.c_mo + (insumosIVA / 1.19));

        ordenActiva.costos_totales = { 
            total: totalFactura, base: baseGravable, iva: iva,
            saldo: totalFactura - anticipo, ebitda: ebitda
        };

        actualizarUIFinanciera();
        renderItems();
    };

    const actualizarUIFinanciera = () => {
        const { total, base, iva, ebitda, saldo } = ordenActiva.costos_totales;
        const totalEl = document.getElementById("total-factura");
        const summaryEl = document.getElementById("finance-summary");
        if(totalEl) totalEl.innerText = `$ ${Math.round(total).toLocaleString()}`;
        if(summaryEl) {
            summaryEl.innerHTML = `
                <div class="grid grid-cols-2 gap-4 border-t border-cyan-500/30 pt-6 mt-6">
                    <div class="text-[10px] orbitron text-slate-500">BASE: <span class="text-white">$${Math.round(base).toLocaleString()}</span></div>
                    <div class="text-[10px] orbitron text-slate-500 text-right">IVA: <span class="text-white">$${Math.round(iva).toLocaleString()}</span></div>
                    <div class="text-green-400 font-black text-2xl orbitron italic">EBITDA: $${Math.round(ebitda).toLocaleString()}</div>
                    <div class="text-red-500 font-black text-2xl orbitron text-right">SALDO: $${Math.round(saldo).toLocaleString()}</div>
                </div>`;
        }
    };

    // --- 2. TRAZABILIDAD HARLEY-DAVIDSON (WHATSAPP BRIDGE) ---
    const enviarNotificacionNexus = (proceso) => {
        const id = ordenActiva.id;
        if(!id) return Swal.fire('SYNC_REQUIRED', 'Guarda la orden primero para generar el link de trazabilidad.', 'warning');
        
        const link = `https://tallerpro360.web.app/trace/${id}`;
        const cliente = document.getElementById("f-cliente").value;
        const placa = document.getElementById("f-placa").value;
        let mensaje = "";
        
        if(proceso === 'INGRESO') mensaje = `🛰️ *NEXUS_X: INGRESO*%0AHola *${cliente}*, vehículo *${placa}* recibido. Trazabilidad: ${link}`;
        if(proceso === 'FINAL') mensaje = `✅ *NEXUS_X: LISTO*%0A*${cliente}*, su vehículo *${placa}* está listo para entrega. Detalle: ${link}`;
        
        window.open(`https://wa.me/57${document.getElementById("f-telefono").value}?text=${mensaje}`, '_blank');
    };

    // --- 3. UI NEON MATRIX (BLOQUE COMPLETO) ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#05070a] min-h-screen text-slate-100 pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-end gap-6 mb-16 border-b-2 border-red-600 pb-10">
                <div class="space-y-1">
                    <h1 class="orbitron text-7xl font-black italic tracking-tighter text-white">NEXUS<span class="text-red-600">_X</span></h1>
                    <p class="text-[10px] orbitron text-cyan-400 font-bold tracking-[0.8em] uppercase italic">Automotive Titan Logistics</p>
                </div>
                <button onclick="window.abrirTerminal()" class="px-12 py-5 bg-cyan-500 text-black orbitron text-[10px] font-black hover:bg-white transition-all shadow-[10px_10px_0px_rgba(0,242,255,0.3)] uppercase italic">INICIAR ORDEN +</button>
            </header>
            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl p-6 lg:p-12 overflow-y-auto custom-scroll"></div>
        </div>`;
        cargarParrilla();
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1700px] mx-auto pb-40 animate-in zoom-in duration-300">
            <div class="flex flex-col lg:flex-row justify-between items-center mb-12 bg-[#0d1117] p-10 border-l-8 border-red-600 rounded-r-3xl gap-6">
                <div class="flex items-center gap-6">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-8xl font-black orbitron text-white w-[30rem] uppercase border-2 border-white/5 rounded-2xl text-center outline-none" placeholder="PLACA">
                    <button onclick="window.nexusVozPlaca()" class="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.4)] animate-pulse"><i class="fas fa-microphone text-2xl"></i></button>
                </div>
                
                <div class="flex flex-col items-center bg-black/50 p-4 rounded-2xl border border-white/5">
                    <span class="orbitron text-[9px] text-slate-500 mb-1">FASE_PROCESO:</span>
                    <select id="f-estado" onchange="window.cambiarEstado(this.value)" class="bg-transparent text-cyan-400 orbitron font-black text-2xl outline-none">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO_LIQUIDADO'].map(e => 
                            `<option value="${e}" ${ordenActiva.estado === e ? 'selected' : ''} class="bg-black">${e}</option>`).join('')}
                    </select>
                </div>

                <button onclick="document.getElementById('nexus-terminal').classList.add('hidden')" class="w-20 h-20 bg-white/5 text-white text-3xl font-black rounded-2xl hover:bg-red-600 transition-all">✕</button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div class="lg:col-span-4 space-y-8">
                    <div class="bg-[#0d1117] p-8 border border-white/5 rounded-[3rem]">
                        <h4 class="orbitron font-black text-cyan-500 text-[11px] mb-6 uppercase tracking-widest italic">Data Maestra (SAP Client)</h4>
                        <div class="space-y-4">
                            <input id="f-cliente" value="${ordenActiva.cliente || ''}" placeholder="NOMBRE / RAZÓN SOCIAL" class="w-full bg-black p-5 text-white font-bold uppercase text-xs border border-white/10 rounded-xl">
                            <input id="f-id" value="${ordenActiva.identificacion || ''}" placeholder="NIT / CÉDULA" class="w-full bg-black p-5 text-white font-bold text-xs border border-white/10 rounded-xl">
                            <div class="grid grid-cols-2 gap-4">
                                <input id="f-telefono" value="${ordenActiva.telefono || ''}" placeholder="WHATSAPP (+57)" class="bg-black p-5 text-green-400 font-bold border border-white/10 rounded-xl">
                                <input id="f-km" value="${ordenActiva.km || ''}" placeholder="KM_ACTUAL" class="bg-black p-5 text-yellow-500 font-bold border border-white/10 rounded-xl">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4 mt-8">
                            <button onclick="window.enviarNotificacionNexus('INGRESO')" class="py-4 bg-green-600/10 text-green-500 orbitron text-[9px] font-black rounded-xl border border-green-600/20 uppercase hover:bg-green-600 hover:text-white transition-all">Reportar_Ingreso</button>
                            <button onclick="window.enviarNotificacionNexus('FINAL')" class="py-4 bg-red-600/10 text-red-500 orbitron text-[9px] font-black rounded-xl border border-red-600/20 uppercase hover:bg-red-600 hover:text-white transition-all">Reportar_Ready</button>
                        </div>
                    </div>

                    <div id="pricing-slot" class="rounded-[3rem] overflow-hidden shadow-2xl"></div>

                    <div class="bg-black p-8 border border-red-600/20 rounded-[3rem] relative">
                        <span class="orbitron text-[9px] text-red-500 font-black block mb-4 italic uppercase tracking-tighter">Neural_Bitácora (Dictado Técnico)</span>
                        <textarea id="f-bitacora" class="w-full bg-transparent text-slate-300 text-xs h-40 outline-none font-mono leading-relaxed" placeholder="Escuchando voz técnica...">${ordenActiva.bitacora || ''}</textarea>
                        <button onclick="window.nexusVozBitacora()" class="absolute bottom-8 right-8 w-14 h-14 bg-white text-black rounded-full shadow-2xl hover:scale-110 transition-all"><i class="fas fa-microphone"></i></button>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 border border-cyan-500/10 rounded-[4rem] relative shadow-2xl">
                        <div class="flex justify-between items-start mb-12">
                            <div>
                                <h2 id="total-factura" class="orbitron text-[9rem] font-black text-white italic leading-none">$ 0</h2>
                                <p class="text-cyan-400 orbitron font-bold text-[10px] mt-6 tracking-[1em] uppercase italic">Consolidado Quantum SAP</p>
                            </div>
                            <div id="finance-summary" class="w-96"></div>
                        </div>
                        
                        <div id="items-container" class="space-y-4 max-h-[500px] overflow-y-auto pr-6 custom-scroll"></div>
                        
                        <div class="grid grid-cols-2 gap-6 mt-12">
                            <button onclick="window.nexusAddRepuesto()" class="py-8 border-2 border-dashed border-cyan-500/30 orbitron text-[11px] font-black text-cyan-500 hover:bg-cyan-500/5 transition-all rounded-[2rem] uppercase italic">Vincular_Stock_Real</button>
                            <button onclick="window.nexusAddMO()" class="py-8 border-2 border-dashed border-red-600/30 orbitron text-[11px] font-black text-red-600 hover:bg-red-600/5 transition-all rounded-[2rem] uppercase italic">Añadir_Mano_Obra</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-6">
                        <div class="bg-black/80 p-8 rounded-[2.5rem] border border-white/5">
                            <label class="orbitron text-[9px] text-slate-500 block mb-2 uppercase">Insumos (+IVA)</label>
                            <input id="f-insumos-iva" value="${ordenActiva.insumos_iva || 0}" type="number" onchange="window.recalcular()" class="bg-transparent text-white text-4xl font-black w-full outline-none">
                        </div>
                        <div class="bg-black/80 p-8 rounded-[2.5rem] border border-white/5">
                            <label class="orbitron text-[9px] text-yellow-600 block mb-2 uppercase">Insumos (S/IVA)</label>
                            <input id="f-insumos-no-iva" value="${ordenActiva.insumos_no_iva || 0}" type="number" onchange="window.recalcular()" class="bg-transparent text-yellow-600 text-4xl font-black w-full outline-none">
                        </div>
                        <div class="bg-black/80 p-8 rounded-[2.5rem] border border-white/5">
                            <label class="orbitron text-[9px] text-green-500 block mb-2 uppercase">Anticipo</label>
                            <input id="f-anticipo" value="${ordenActiva.anticipo || 0}" type="number" onchange="window.recalcular()" class="bg-transparent text-green-400 text-4xl font-black w-full outline-none">
                        </div>
                    </div>

                    <button id="btnSincronizar" onclick="window.nexusSincronizar()" class="w-full bg-cyan-500 text-black py-10 orbitron font-black text-4xl rounded-[3rem] hover:bg-white hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all uppercase italic">🛰️ Sincronizar_Cloud_SAP</button>
                </div>
            </div>
        </div>`;
        
        renderModuloPricing(document.getElementById('pricing-slot'));
        recalcularFinanzas();
    };

    // --- 4. FUNCIONES DE ACCIÓN (LÓGICA BLINDADA) ---
    window.nexusVozPlaca = () => {
        if(!recognition) return;
        hablar("Dictar placa ahora");
        setTimeout(() => {
            recognition.start();
            recognition.onresult = (e) => {
                const txt = e.results[0][0].transcript.replace(/[^A-Z0-9]/g, '').toUpperCase();
                document.getElementById('f-placa').value = txt;
                hablar(`Placa ${txt} detectada`);
            };
        }, 1200);
    };

    window.nexusAddRepuesto = async () => {
        const { value: busqueda } = await Swal.fire({ 
            title: 'NEXUS STOCK SEARCH', 
            input: 'text', 
            background: '#0d1117', color: '#fff',
            inputPlaceholder: 'Nombre o código...'
        });
        
        if(busqueda) {
            const q = query(collection(db, "productos"), where("empresaId", "==", empresaId), where("nombre", ">=", busqueda.toUpperCase()), limit(5));
            const snap = await getDocs(q);
            const prods = snap.docs.map(d => ({id: d.id, ...d.data()}));
            
            if(prods.length > 0) {
                const options = Object.fromEntries(prods.map(p => [p.id, `${p.nombre} ($${p.venta})`]));
                const { value: selId } = await Swal.fire({ title: 'VINCULAR ITEM', input: 'select', inputOptions: options, background: '#0d1117', color: '#fff' });
                if(selId) {
                    const p = prods.find(x => x.id === selId);
                    ordenActiva.items.push({ tipo: 'REPUESTO', desc: p.nombre, costo: p.costo, venta: p.venta, idRef: p.id, origen: 'TALLER' });
                    recalcularFinanzas();
                }
            } else {
                // Si no existe, permitir añadir como manual (repuesto externo)
                const { value: ext } = await Swal.fire({ title: 'REPUESTO EXTERNO', input: 'text', text: 'No está en inventario. ¿Deseas crearlo manual?', background: '#0d1117', color: '#fff' });
                if(ext) {
                    ordenActiva.items.push({ tipo: 'REPUESTO', desc: ext.toUpperCase(), costo: 0, venta: 0, origen: 'EXTERNO' });
                    recalcularFinanzas();
                }
            }
        }
    };

    window.nexusAddMO = () => {
        ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: 'LABOR TÉCNICA ESPECIALIZADA', costo: 0, venta: 0 });
        recalcularFinanzas();
    };

    window.updateItem = (idx, campo, valor) => {
        ordenActiva.items[idx][campo] = (campo === 'desc') ? valor.toUpperCase() : Number(valor);
        recalcularFinanzas();
    };

    window.nexusSincronizar = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-satellite animate-spin"></i> PROPAGANDO_DATA...`;

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

            batch.set(doc(db, "ordenes", id), data);
            
            // Asiento Contable Automático SAP
            batch.set(doc(db, "contabilidad", `SAP_${id}`), {
                empresaId, total: data.costos_totales.total, 
                ebitda: data.costos_totales.ebitda, fecha: serverTimestamp(), placa,
                tipo: 'SERVICIO_TECNICO'
            });

            await batch.commit();
            ordenActiva.id = id;
            hablar("Sistema sincronizado. Integridad Quantum verificada.");
            Swal.fire({ title: 'QUANTUM SYNC OK', icon: 'success', background: '#0d1117', color: '#fff' });
        } catch (e) {
            console.error(e);
            btn.disabled = false;
            btn.innerHTML = `🛰️ REINTENTAR_SYNC`;
        }
    };

    window.renderItems = () => {
        const wrap = document.getElementById("items-container");
        if(!wrap) return;
        wrap.innerHTML = ordenActiva.items.map((it, idx) => `
            <div class="flex items-center gap-6 bg-white/[0.02] p-6 rounded-3xl border border-white/5 group hover:border-cyan-500/30 transition-all">
                <div class="flex-1 grid grid-cols-4 gap-6">
                    <div class="col-span-2">
                        <input onchange="window.updateItem(${idx}, 'desc', this.value)" value="${it.desc}" class="bg-transparent text-white font-black orbitron text-xs outline-none w-full uppercase">
                        <span class="text-[8px] orbitron ${it.tipo === 'REPUESTO' ? 'text-cyan-500' : 'text-red-500'} font-bold uppercase">${it.tipo} ${it.origen ? '| '+it.origen : ''}</span>
                    </div>
                    <div>
                        <span class="text-[8px] orbitron text-slate-500 block mb-1">COSTO_UN</span>
                        <input type="number" onchange="window.updateItem(${idx}, 'costo', this.value)" value="${it.costo}" class="bg-black/40 p-2 text-red-500 font-black text-center orbitron text-xs rounded-xl w-full">
                    </div>
                    <div>
                        <span class="text-[8px] orbitron text-slate-500 block mb-1">VENTA_UN</span>
                        <input type="number" onchange="window.updateItem(${idx}, 'venta', this.value)" value="${it.venta}" class="bg-black/40 p-2 text-green-400 font-black text-center orbitron text-xs rounded-xl w-full border border-green-500/20">
                    </div>
                </div>
                <button onclick="ordenActiva.items.splice(${idx},1); window.recalcular()" class="text-slate-600 hover:text-red-500 transition-all"><i class="fas fa-trash-alt"></i></button>
            </div>`).join('');
    };

    const cargarParrilla = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const grid = document.getElementById("grid-ordenes");
            if (!grid) return;
            grid.innerHTML = snap.docs
                .filter(d => d.data().estado !== 'CANCELADO_LIQUIDADO') // LIMPIEZA DE PARRILLA QUANTUM
                .map(d => {
                    const o = d.data();
                    return `
                    <div onclick="window.abrirTerminal('${d.id}')" class="bg-[#0d1117] p-8 border border-white/5 rounded-[2.5rem] hover:border-red-600 transition-all cursor-pointer group shadow-xl">
                        <h4 class="orbitron text-5xl font-black text-white group-hover:text-red-500 mb-2">${o.placa}</h4>
                        <p class="text-[10px] text-slate-500 mb-6 font-bold uppercase">${o.cliente || 'CLIENTE_S_N'}</p>
                        <div class="pt-6 border-t border-white/5 flex justify-between items-center">
                            <span class="orbitron text-green-400 font-black text-xl">$ ${Math.round(o.costos_totales?.total || 0).toLocaleString()}</span>
                            <span class="text-[8px] orbitron bg-red-600 text-white px-3 py-1 rounded-full uppercase">${o.estado}</span>
                        </div>
                    </div>`;
                }).join('');
        });
    };

    // --- 5. INICIALIZADORES GLOBALES ---
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
    window.enviarNotificacionNexus = enviarNotificacionNexus;
    window.nexusVozBitacora = () => {
        if(!recognition) return;
        hablar("Dicte hallazgo técnico");
        recognition.start();
        recognition.onresult = (e) => {
            const txt = e.results[0][0].transcript;
            document.getElementById('f-bitacora').value += `\n[IA_LOG]: ${txt.toUpperCase()}`;
            hablar("Bitácora actualizada");
        };
    };

    renderBase();
}
