/**
 * ordenes.js - NEXUS-X "THE TITAN" V16.0 🛰️
 * CONSOLIDACIÓN TOTAL: SAP BI + NEON UI + VOICE AI + HARLEY EXPERIENCE + PRICING PRO
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS & GEMINI AI PRO
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

    if (!empresaId) {
        container.innerHTML = `<div class="p-10 orbitron text-red-500">ERROR: NO_EMPRESA_ID_DETECTED</div>`;
        return;
    }

    // --- 1. MOTOR FINANCIERO (SAP-ELIMINATOR V16) ---
    const recalcularFinanzas = () => {
        if (!ordenActiva) return;
        let m = { v_rep: 0, c_rep: 0, v_mo: 0, c_mo: 0 };

        ordenActiva.items.forEach(i => {
            const v = Number(i.venta || 0);
            const c = Number(i.costo || 0);
            if (i.tipo === 'REPUESTO') {
                if(i.origen === 'TALLER') { 
                    m.v_rep += v; 
                    m.c_rep += c; 
                } else {
                    m.v_rep += 0; // Repuesto de cliente no suma a la facturación del taller
                }
            } else {
                m.v_mo += v;
                m.c_mo += c; 
            }
        });

        const insumosIVA = Number(document.getElementById("f-insumos-iva")?.value || 0); 
        const insumosNoIVA = Number(document.getElementById("f-insumos-no-iva")?.value || 0); 
        const anticipo = Number(document.getElementById("f-anticipo")?.value || 0); 
        
        // El subtotal con IVA incluye Repuestos Taller + Mano de Obra + Insumos Gravados (Siliconas/Torno)
        const subtotalGravado = m.v_rep + m.v_mo + insumosIVA;
        const baseGravable = subtotalGravado / 1.19;
        const iva = subtotalGravado - baseGravable;
        
        // El total final suma los insumos sin IVA (Gasolina/Otros)
        const totalFactura = subtotalGravado + insumosNoIVA;
        
        // EBITDA: Base Gravable + Insumos No IVA - (Costos Repuestos + Costos MO + Costos Insumos)
        const utilidadNeta = (baseGravable + insumosNoIVA) - (m.c_rep + m.c_mo + (insumosIVA / 1.19) + insumosNoIVA);

        ordenActiva.costos_totales = { 
            total: totalFactura, 
            base: baseGravable,
            iva: iva,
            saldo: totalFactura - anticipo, 
            ebitda: utilidadNeta
        };

        actualizarUIFinanciera(totalFactura, baseGravable, iva, utilidadNeta, ordenActiva.costos_totales.saldo);
        renderItems();
    };

    const actualizarUIFinanciera = (total, base, iva, ebitda, saldo) => {
        const totalEl = document.getElementById("total-factura");
        const summaryEl = document.getElementById("finance-summary");
        if(totalEl) totalEl.innerText = `$ ${Math.round(total).toLocaleString()}`;
        if(summaryEl) {
            summaryEl.innerHTML = `
                <div class="grid grid-cols-2 gap-4 border-t border-cyan-500/30 pt-6 mt-6">
                    <div class="text-[10px] orbitron text-slate-500 uppercase">BASE: <span class="text-white">$${Math.round(base).toLocaleString()}</span></div>
                    <div class="text-[10px] orbitron text-slate-500 text-right uppercase">IVA (19%): <span class="text-white">$${Math.round(iva).toLocaleString()}</span></div>
                    <div class="text-green-400 font-black text-2xl orbitron italic">EBITDA: $${Math.round(ebitda).toLocaleString()}</div>
                    <div class="text-red-500 font-black text-2xl orbitron text-right">SALDO: $${Math.round(saldo).toLocaleString()}</div>
                </div>`;
        }
    };

    // --- 2. TRAZABILIDAD HARLEY-DAVIDSON (LINK GENERATOR) ---
    const enviarNotificacionNexus = (proceso) => {
        const linkServidor = `https://tallerpro360.web.app/trace/${ordenActiva.id}`;
        let mensaje = "";
        
        switch(proceso) {
            case 'INGRESO':
                mensaje = `🛰️ *NEXUS_X: INGRESO CONFIRMADO*%0AHola *${ordenActiva.cliente}*, su vehículo *${ordenActiva.placa}* ha iniciado fase de diagnóstico. Trazabilidad en vivo: ${linkServidor}`;
                break;
            case 'REPARACION':
                mensaje = `🛠️ *NEXUS_X: EN PROCESO*%0A*${ordenActiva.cliente}*, estamos ejecutando las reparaciones en *${ordenActiva.placa}*. Vea el progreso aquí: ${linkServidor}`;
                break;
            case 'FINAL':
                mensaje = `✅ *NEXUS_X: VEHÍCULO LISTO*%0ASu vehículo *${ordenActiva.placa}* está listo para entrega. Resumen técnico y factura: ${linkServidor}`;
                break;
        }
        window.open(`https://wa.me/57${ordenActiva.telefono}?text=${mensaje}`, '_blank');
    };

    // --- 3. UI BASE (NEON MATRIX V16) ---
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

    // --- 4. TERMINAL DE OPERACIONES (EXPERIENCIA PRO) ---
    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1600px] mx-auto pb-40 animate-in zoom-in duration-300">
            <div class="flex flex-col lg:flex-row justify-between items-center mb-12 bg-[#0d1117] p-10 border-l-8 border-cyan-500 rounded-r-3xl gap-6">
                <div class="flex items-center gap-6">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-7xl font-black orbitron text-white w-80 uppercase border-2 border-white/5 rounded-xl text-center" placeholder="PLACA">
                    <div class="flex gap-2">
                        <button onclick="window.nexusEscuchaPlaca()" class="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center animate-pulse"><i class="fas fa-microphone"></i></button>
                        <button onclick="window.nexusCamara()" class="w-16 h-16 bg-white text-black rounded-xl hover:bg-cyan-500 transition-all flex items-center justify-center"><i class="fas fa-camera text-2xl"></i></button>
                    </div>
                </div>
                
                <div class="flex items-center gap-4 bg-black/50 p-4 rounded-2xl border border-white/5">
                    <span class="orbitron text-[9px] text-slate-500">FASE:</span>
                    <select id="f-estado" onchange="window.cambiarEstado(this.value)" class="bg-transparent text-cyan-400 orbitron font-black text-xl outline-none">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(e => 
                            `<option value="${e}" ${ordenActiva.estado === e ? 'selected' : ''} class="bg-black">${e}</option>`).join('')}
                    </select>
                </div>

                <button id="btnCloseTerminal" class="w-20 h-20 bg-red-600 text-white text-3xl font-black rounded-2xl hover:rotate-90 transition-all">✕</button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-[#0d1117] p-8 border border-white/5 rounded-3xl">
                        <h4 class="orbitron font-black text-cyan-500 text-[11px] mb-6 uppercase tracking-widest">Client & Harley Experience</h4>
                        <input id="f-cliente" value="${ordenActiva.cliente || ''}" placeholder="NOMBRE CLIENTE" class="w-full bg-black p-4 mb-4 text-white font-black uppercase text-xs border border-white/10 rounded-xl">
                        <input id="f-telefono" value="${ordenActiva.telefono || ''}" placeholder="WHATSAPP (+57)" class="w-full bg-black p-4 mb-6 text-green-400 font-bold border border-white/10 rounded-xl">
                        
                        <div class="grid grid-cols-3 gap-2">
                            <button onclick="window.enviarNotificacionNexus('INGRESO')" class="py-3 bg-green-600/10 text-green-500 orbitron text-[8px] font-black rounded-lg border border-green-600/20">SEND_ENTRY</button>
                            <button onclick="window.enviarNotificacionNexus('REPARACION')" class="py-3 bg-cyan-600/10 text-cyan-500 orbitron text-[8px] font-black rounded-lg border border-cyan-600/20">SEND_PROG</button>
                            <button onclick="window.enviarNotificacionNexus('FINAL')" class="py-3 bg-red-600/10 text-red-500 orbitron text-[8px] font-black rounded-lg border border-red-600/20">SEND_READY</button>
                        </div>
                    </div>

                    <div id="pricing-engine-container" class="bg-white/5 p-8 border border-white/5 rounded-3xl"></div>

                    <div class="bg-black p-8 border border-red-600/20 rounded-3xl relative">
                        <span class="orbitron text-[9px] text-red-500 font-black block mb-4 italic">NEURAL_BITACORA (Hallazgos IA)</span>
                        <textarea id="ai-log-display" class="w-full bg-transparent text-slate-300 text-xs h-32 outline-none font-mono" placeholder="Escuchando voz técnica...">${ordenActiva.bitacora_ia || ''}</textarea>
                        <button onclick="window.nexusDictarBitacora()" class="absolute bottom-6 right-6 w-12 h-12 bg-white text-black rounded-full shadow-2xl"><i class="fas fa-microphone"></i></button>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 border border-cyan-500/10 rounded-[3rem] relative shadow-2xl">
                        <div class="flex justify-between items-start mb-12">
                            <div>
                                <h2 id="total-factura" class="orbitron text-[8rem] font-black text-white italic leading-none">$ 0</h2>
                                <p class="text-cyan-400 orbitron font-bold text-xs mt-4 tracking-widest uppercase">TOTAL FACTURADO CONSOLIDADO</p>
                            </div>
                            <div id="finance-summary" class="w-80"></div>
                        </div>
                        
                        <div id="items-container" class="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scroll"></div>
                        
                        <div class="grid grid-cols-2 gap-6 mt-12">
                            <button onclick="window.addItemNexus('REPUESTO')" class="py-6 border-2 border-white/10 orbitron text-[10px] font-black text-white hover:bg-white hover:text-black transition-all rounded-2xl">+ ADD_PART</button>
                            <button onclick="window.addItemNexus('MANO_OBRA')" class="py-6 border-2 border-red-600/20 orbitron text-[10px] font-black text-red-600 hover:bg-red-600 hover:text-white transition-all rounded-2xl">+ ADD_LABOR</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-6">
                        <div class="bg-black p-6 rounded-3xl border border-white/5">
                            <label class="orbitron text-[9px] text-slate-500 block mb-2 italic uppercase">Insumos (Con IVA)</label>
                            <input id="f-insumos-iva" value="${ordenActiva.insumos || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-white text-4xl font-black w-full outline-none">
                        </div>
                        <div class="bg-black p-6 rounded-3xl border border-white/5">
                            <label class="orbitron text-[9px] text-yellow-500 block mb-2 italic uppercase">Insumos (Sin IVA)</label>
                            <input id="f-insumos-no-iva" value="${ordenActiva.insumos_no_iva || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-yellow-500 text-4xl font-black w-full outline-none">
                        </div>
                        <div class="bg-black p-6 rounded-3xl border border-white/5">
                            <label class="orbitron text-[9px] text-green-500 block mb-2 uppercase">Anticipo</label>
                            <input id="f-anticipo" value="${ordenActiva.anticipo || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-green-400 text-4xl font-black w-full outline-none">
                        </div>
                    </div>

                    <button id="btnSincronizar" class="w-full bg-cyan-500 text-black py-10 orbitron font-black text-4xl rounded-[2rem] hover:bg-white transition-all shadow-[0_0_50px_rgba(0,242,255,0.2)]">🛰️ PUSH_TO_NEXUS_CLOUD</button>
                </div>
            </div>
        </div>`;
        
        renderModuloPricing(document.getElementById('pricing-engine-container'));
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    // --- 5. FUNCIONES DE ACCIÓN Y ANEXOS (VOZ, MULTIMEDIA, SYNC) ---
    window.nexusEscuchaPlaca = () => {
        if(!recognition) return;
        recognition.start();
        hablar("Escuchando placa");
        recognition.onresult = (e) => {
            const txt = e.results[0][0].transcript.replace(/\s/g, '').toUpperCase();
            document.getElementById('f-placa').value = txt;
            hablar(`Placa ${txt} capturada`);
        };
    };

    window.nexusDictarBitacora = () => {
        if(!recognition) return;
        recognition.start();
        hablar("Dicte hallazgo");
        recognition.onresult = (e) => {
            const txt = e.results[0][0].transcript;
            document.getElementById('ai-log-display').value += `\n[${new Date().toLocaleTimeString()}] ${txt.toUpperCase()}`;
            hablar("Bitácora actualizada");
        };
    };

    window.nexusCamara = async () => {
        const { value: file } = await Swal.fire({
            title: 'CAPTURA DE EVIDENCIA',
            input: 'file',
            inputAttributes: { 'accept': 'image/*', 'capture': 'environment' },
            background: '#0d1117', color: '#fff',
            confirmButtonText: 'UPLOAD_TO_CLOUD'
        });
        if (file) hablar("Subiendo evidencia visual");
    };

    window.cambiarEstado = async (nuevoEstado) => {
        if(!ordenActiva.id) return;
        try {
            const batch = writeBatch(db);
            batch.update(doc(db, "ordenes", ordenActiva.id), { estado: nuevoEstado, updatedAt: serverTimestamp() });
            await batch.commit();
            hablar(`Fase ${nuevoEstado}`);
            Swal.fire({ toast: true, position: 'top-end', title: `ESTADO: ${nuevoEstado}`, icon: 'info', timer: 2000, background: '#0d1117', color: '#fff', showConfirmButton: false });
        } catch (e) { console.error(e); }
    };

    window.addItemNexus = async (tipo) => {
        let origen = 'TALLER';
        let tec = 'INTERNO';
        let costo = 0;
        
        if(tipo === 'REPUESTO') {
            const { value: res } = await Swal.fire({
                title: 'ORIGEN REPUESTO',
                input: 'select',
                inputOptions: { 'TALLER': 'Stock Taller', 'CLIENTE': 'Cliente (Costo $0)' },
                background: '#0d1117', color: '#fff'
            });
            origen = res || 'TALLER';
        } else {
            const { value:t } = await Swal.fire({ title:'ASIGNAR TÉCNICO', input:'text', background:'#0d1117', color:'#fff' });
            tec = t || 'POR ASIGNAR';
            const { value:c } = await Swal.fire({ title:'COSTO TÉCNICO (NÓMINA)', input:'number', background:'#0d1117', color:'#fff' });
            costo = Number(c || 0);
        }

        ordenActiva.items.push({ tipo, desc: `NUEVO ${tipo}`, costo, venta: 0, origen, tecnico: tec, tiempo_estimado: 1 });
        recalcularFinanzas();
    };

    window.updateItem = (idx, campo, valor) => {
        ordenActiva.items[idx][campo] = (campo === 'desc') ? valor.toUpperCase() : Number(valor);
        recalcularFinanzas();
    };

    const ejecutarSincronizacionTotal = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-satellite animate-spin"></i> SYNCING...`;

        try {
            const batch = writeBatch(db);
            const placa = document.getElementById("f-placa").value.toUpperCase();
            const id = ordenActiva.id || `OT_${placa}_${Date.now()}`;

            const data = {
                ...ordenActiva,
                id, placa, empresaId,
                cliente: document.getElementById("f-cliente").value,
                telefono: document.getElementById("f-telefono").value,
                anticipo: Number(document.getElementById("f-anticipo").value),
                insumos: Number(document.getElementById("f-insumos-iva").value),
                insumos_no_iva: Number(document.getElementById("f-insumos-no-iva").value),
                bitacora_ia: document.getElementById("ai-log-display").value,
                updatedAt: serverTimestamp()
            };

            batch.set(doc(db, "ordenes", id), data);
            
            // Asiento Contable Protegido
            batch.set(doc(db, "contabilidad", `CONT_${id}`), {
                empresaId, total: data.costos_totales.total, 
                utilidad: data.costos_totales.ebitda, fecha: serverTimestamp(), placa 
            });

            await batch.commit();
            hablar("Sync completo. Orden en la nube.");
            Swal.fire({ title: 'NEXUS SYNC OK', icon: 'success', background: '#0d1117', color: '#fff' });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (e) {
            console.error(e);
            btn.disabled = false;
            btn.innerHTML = `🛰️ PUSH_TO_NEXUS_CLOUD`;
        }
    };

    window.renderItems = () => {
        const container = document.getElementById("items-container");
        if(!container) return;
        container.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="flex items-center gap-6 bg-white/[0.03] p-6 rounded-2xl border ${item.origen === 'CLIENTE' ? 'border-yellow-600/30' : 'border-white/5'} group">
                <div class="flex-1 grid grid-cols-4 gap-6">
                    <div class="col-span-2">
                        <input onchange="window.updateItem(${idx}, 'desc', this.value)" value="${item.desc}" class="bg-transparent text-white font-black orbitron text-xs outline-none w-full uppercase">
                        <span class="text-[8px] orbitron text-cyan-500 font-bold uppercase">${item.tipo} | TECH: ${item.tecnico} | ORIGEN: ${item.origen}</span>
                    </div>
                    <input type="number" onchange="window.updateItem(${idx}, 'costo', this.value)" value="${item.costo}" class="bg-black/50 p-3 text-red-500 font-black text-center orbitron text-xs rounded-lg" placeholder="COST">
                    <input type="number" onchange="window.updateItem(${idx}, 'venta', this.value)" value="${item.venta}" class="bg-black/50 p-3 text-green-400 font-black text-center orbitron text-xs rounded-lg" placeholder="PRICE">
                </div>
                <button onclick="window.removeItemNexus(${idx})" class="text-slate-600 hover:text-red-500 transition-colors"><i class="fas fa-trash-alt text-xl"></i></button>
            </div>`).join('');
    };

    window.removeItemNexus = (idx) => {
        ordenActiva.items.splice(idx, 1);
        recalcularFinanzas();
    };

    const vincularEventosBase = () => {
        document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus();
    };

    const vincularAccionesTerminal = () => {
        document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
        document.getElementById("btnSincronizar").onclick = ejecutarSincronizacionTotal;
        window.enviarNotificacionNexus = enviarNotificacionNexus;
        window.recalcularFinanzas = recalcularFinanzas;
    };

    window.abrirTerminalNexus = (id = null) => {
        if(id) {
            getDoc(doc(db, "ordenes", id)).then(s => { ordenActiva = { id, ...s.data() }; renderTerminal(); });
        } else {
            ordenActiva = { placa:'', estado:'INGRESO', items:[], cliente_data:{}, anticipo:0, insumos:0, insumos_no_iva:0, bitacora_ia:'' };
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
                        <span class="text-[8px] orbitron bg-red-600/20 text-red-500 px-3 py-1 rounded-full uppercase">${o.estado}</span>
                    </div>
                </div>`;
            }).join('');
        });
    };

    renderBase();
}
