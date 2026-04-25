/**
 * ordenes.js - NEXUS-X COMMAND CENTER V11.0 "QUANTUM-SAP" 🛰️
 * SISTEMA LOGÍSTICO INTEGRADO - ESTABILIDAD FIRESTORE GARANTIZADA
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, updateDoc, serverTimestamp, increment, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { analizarPrecioSugerido, renderModuloPricing } from "../ai/pricingEnginePRO360.js";

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    let ordenActiva = null;
    let faseActual = 'INGRESO';

    if (!empresaId) {
        container.innerHTML = `<div class="p-10 orbitron text-red-500 font-black">CRITICAL_ERROR: NO_EMPRESA_ID</div>`;
        return;
    }

    // --- 1. MOTOR FINANCIERO INTEGRADO (SAP BI) ---
    const recalcularFinanzas = () => {
        if (!ordenActiva) return;
        
        let m = { v_rep: 0, c_rep: 0, v_mo: 0, c_mo: 0 };
        ordenActiva.items.forEach(i => {
            const v = Number(i.venta || 0);
            const c = Number(i.costo || 0);
            if (i.tipo === 'REPUESTO') { m.v_rep += v; m.c_rep += c; }
            else { m.v_mo += v; m.c_mo += c; }
        });

        const insumos = Number(document.getElementById("f-insumos-valor")?.value || ordenActiva.insumos || 0); 
        const anticipo = Number(document.getElementById("f-anticipo")?.value || ordenActiva.anticipo || 0); 
        
        const granTotal = m.v_rep + m.v_mo + insumos; 
        const utilidadNeta = (granTotal / 1.19) - (m.c_rep + m.c_mo + insumos);

        ordenActiva.costos_totales = {
            gran_total: granTotal,
            utilidad: utilidadNeta,
            anticipo: anticipo,
            saldo_pendiente: granTotal - anticipo,
            insumos: insumos
        };

        const totalEl = document.getElementById("total-factura");
        if(totalEl) {
            totalEl.innerText = `$ ${Math.round(granTotal).toLocaleString()}`;
            renderSaldoQuantum();
        }
    };

    const renderSaldoQuantum = () => {
        const saldoDiv = document.getElementById("saldo-display");
        if(!saldoDiv) return;
        const c = ordenActiva.costos_totales;
        saldoDiv.innerHTML = `
            <div class="text-right border-r-4 border-red-600 pr-6">
                <span class="text-cyan-500/50 text-[9px] orbitron block font-black mb-1">LOGISTICS ANALYTICS</span>
                <div class="flex flex-col text-[10px] orbitron text-slate-400">
                    <span>ANTICIPO: $${Math.round(c.anticipo).toLocaleString()}</span>
                    <span>INSUMOS: $${Math.round(c.insumos).toLocaleString()}</span>
                    <span class="text-emerald-500">EBITDA: $${Math.round(c.utilidad).toLocaleString()}</span>
                </div>
                <span class="${c.saldo_pendiente > 0 ? 'text-red-500' : 'text-emerald-400'} font-black text-5xl orbitron tracking-tighter block mt-2">
                    $ ${Math.round(c.saldo_pendiente).toLocaleString()}
                </span>
            </div>`;
    };

    // --- 2. EL ASCENSOR DE DOCUMENTOS (WHATSAPP & PDF) ---
    window.dispatchQuantumDoc = (proceso) => {
        const tel = document.getElementById("f-telefono")?.value;
        if(!tel) return Swal.fire('Error', 'Teléfono requerido', 'error');

        let msg = `*NEXUS-X LOGISTICS* | Orden: ${ordenActiva.placa}\n`;
        const linkBase = `https://nexus-x-starlink.web.app/viewer?id=${ordenActiva.id}`;

        switch(proceso) {
            case 'COTIZACION': msg += `📊 Propuesta Estilo Harley: ${linkBase}&mode=quote`; break;
            case 'INGRESO': msg += `✅ Checklist de Recepción: ${linkBase}&mode=check`; break;
            case 'DIAGNOSTICO': msg += `🔍 Bitácora del Mecánico: ${ordenActiva.bitacora || 'Sin notas'}`; break;
            case 'LISTO': 
                const linkPago = `https://bold.co/p/nexus-${ordenActiva.id}`;
                msg += `🏁 Vehículo Listo. Link de pago Bold: ${linkPago}`; 
                break;
            case 'ENTREGADO': msg += `💎 Factura de Alta Gama y Trazabilidad: ${linkBase}&mode=final`; break;
        }

        window.open(`https://api.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(msg)}`, '_blank');
    };

    // --- 3. TERMINAL QUANTUM (UI) ---
    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1700px] mx-auto pb-40 animate-in fade-in zoom-in duration-500">
            <div class="flex justify-between items-center mb-10 bg-[#0d1117] p-8 rounded-[3.5rem] border-b-8 border-red-600">
                <div class="flex items-center gap-6">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-6xl font-black orbitron text-white w-72 uppercase text-center rounded-[2rem] border border-white/10">
                    <div class="flex flex-col">
                        <span class="orbitron text-red-500 text-[10px] font-black">Fase Actual:</span>
                        <select id="f-estado" class="bg-transparent text-white orbitron font-black text-xl outline-none">
                            ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <button id="btnCloseTerminal" class="w-16 h-16 bg-red-600 rounded-full text-white text-2xl font-black hover:rotate-90 transition-all flex items-center justify-center">✕</button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div class="lg:col-span-3 space-y-4">
                    <div class="bg-[#0d1117] rounded-[3rem] p-6 border border-white/5">
                        <h4 class="orbitron text-[9px] text-red-600 font-black mb-4 tracking-widest text-center">DOCUMENT DISPATCHER</h4>
                        <div class="grid grid-cols-1 gap-2">
                            ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'LISTO', 'ENTREGADO'].map(doc => `
                                <button onclick="dispatchQuantumDoc('${doc}')" class="p-4 bg-white/5 rounded-2xl orbitron text-[10px] font-black text-slate-400 hover:bg-red-600 hover:text-white transition-all text-left flex justify-between items-center">
                                    ${doc} <i class="fas fa-paper-plane text-[8px]"></i>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="bg-[#0d1117] rounded-[3rem] p-8 border border-white/5">
                        <textarea id="f-bitacora" placeholder="BITÁCORA TÉCNICA (VOZ O TEXTO)" class="w-full bg-black/40 p-4 rounded-2xl text-xs orbitron text-white h-32 border border-white/10 outline-none">${ordenActiva.bitacora || ''}</textarea>
                    </div>
                </div>

                <div class="lg:col-span-9 space-y-6">
                    <div class="bg-[#0d1117] p-10 rounded-[4rem] border border-white/5">
                        <div class="flex justify-between items-end mb-10">
                            <h2 id="total-factura" class="orbitron text-[8rem] font-black text-white italic tracking-tighter leading-none">$ 0</h2>
                            <div id="saldo-display"></div>
                        </div>

                        <div class="grid grid-cols-12 gap-4 mb-6 bg-white/[0.02] p-6 rounded-3xl border border-white/10">
                            <div class="col-span-8">
                                <input id="f-cliente" value="${ordenActiva.cliente || ''}" placeholder="CLIENTE" class="w-full bg-transparent text-white orbitron font-black text-lg outline-none">
                                <input id="f-telefono" value="${ordenActiva.telefono || ''}" placeholder="WHATSAPP" class="w-full bg-transparent text-emerald-500 orbitron text-xs outline-none">
                            </div>
                            <div class="col-span-2">
                                <span class="text-[8px] orbitron text-red-500 block text-center">INSUMOS</span>
                                <input id="f-insumos-valor" type="number" onchange="window.nexusRecalcular()" value="${ordenActiva.insumos || 0}" class="w-full bg-black p-3 rounded-xl text-red-500 font-black text-center text-sm">
                            </div>
                            <div class="col-span-2">
                                <span class="text-[8px] orbitron text-emerald-500 block text-center">ANTICIPO</span>
                                <input id="f-anticipo" type="number" onchange="window.nexusRecalcular()" value="${ordenActiva.anticipo || 0}" class="w-full bg-emerald-900/20 p-3 rounded-xl text-emerald-500 font-black text-center text-sm">
                            </div>
                        </div>

                        <div id="items-container" class="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scroll"></div>
                        
                        <div class="grid grid-cols-3 gap-4 mt-10">
                            <button onclick="window.addItemNexus('REPUESTO')" class="py-6 bg-white/5 rounded-2xl border border-white/10 orbitron text-[9px] font-black text-white hover:bg-white hover:text-black transition-all">ADD REPUESTO</button>
                            <button onclick="window.addItemNexus('MANO_OBRA')" class="py-6 bg-red-600/10 rounded-2xl border border-red-600/20 orbitron text-[9px] font-black text-red-500 hover:bg-red-600 hover:text-white transition-all">ADD MANO OBRA</button>
                            <button id="btnSincronizar" class="py-6 bg-white text-black rounded-2xl orbitron font-black text-sm hover:bg-red-600 hover:text-white transition-all">🛰️ SYNC CONTABILIDAD</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        
        vincularAccionesTerminal();
        renderItems();
        recalcularFinanzas();
    };

    // --- 4. PERSISTENCIA INTEGRADA CON CONTABILIDAD.JS ---
    const ejecutarSincronizacionTotal = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true;
        
        try {
            const batch = writeBatch(db);
            const id = ordenActiva.id || `OT_${document.getElementById('f-placa').value}_${Date.now()}`;
            
            const dataFinal = {
                ...ordenActiva,
                id, empresaId,
                placa: document.getElementById('f-placa').value.toUpperCase(),
                cliente: document.getElementById('f-cliente').value,
                telefono: document.getElementById('f-telefono').value,
                estado: document.getElementById('f-estado').value,
                bitacora: document.getElementById('f-bitacora').value,
                insumos: Number(document.getElementById('f-insumos-valor').value),
                anticipo: Number(document.getElementById('f-anticipo').value),
                updatedAt: serverTimestamp()
            };

            // 1. Guardar Orden Master
            batch.set(doc(db, "ordenes", id), dataFinal);
            
            // 2. Inyección Directa a Contabilidad (Para contabilidad.js)
            batch.set(doc(db, "contabilidad", `MOV_${id}`), {
                empresaId,
                monto: dataFinal.costos_totales.gran_total,
                utilidad: dataFinal.costos_totales.utilidad,
                referencia: dataFinal.placa,
                tipo: 'SERVICIO_TALLER',
                fecha: serverTimestamp()
            });

            await batch.commit();
            Swal.fire({ title:'NEXUS SYNC OK', text:'Sincronizado con Contabilidad Core', icon:'success', background:'#0d1117', color:'#fff' });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (e) { 
            Swal.fire('Error de Sincronización', e.message, 'error');
        } finally { btn.disabled = false; }
    };

    // --- 5. FUNCIONES DE APOYO (ESTABILIDAD) ---
    window.nexusRecalcular = () => recalcularFinanzas();
    
    window.addItemNexus = (tipo) => {
        ordenActiva.items.push({ tipo, desc:`NUEVO ${tipo}`, costo: 0, venta: 0 });
        renderItems();
        recalcularFinanzas();
    };

    window.editItemNexus = (idx, campo, valor) => {
        ordenActiva.items[idx][campo] = (campo === 'costo' || campo === 'venta') ? Number(valor) : valor;
        recalcularFinanzas();
    };

    const renderItems = () => {
        const containerItems = document.getElementById("items-container");
        if(!containerItems) return;
        containerItems.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                <input onchange="window.editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" class="flex-1 bg-transparent text-white orbitron text-[10px] outline-none uppercase">
                <input type="number" onchange="window.editItemNexus(${idx}, 'costo', this.value)" value="${item.costo}" class="w-20 bg-black p-2 rounded text-red-500 font-black text-center text-[10px]" placeholder="COSTO">
                <input type="number" onchange="window.editItemNexus(${idx}, 'venta', this.value)" value="${item.venta}" class="w-20 bg-black p-2 rounded text-emerald-400 font-black text-center text-[10px]" placeholder="VENTA">
                <button onclick="ordenActiva.items.splice(${idx}, 1); window.nexusRecalcular(); document.getElementById('items-container').children[${idx}].remove();" class="text-red-500 font-black px-2">✕</button>
            </div>`).join('');
    };

    // --- 6. NAVEGACIÓN Y CARGA ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-12 bg-[#010409] min-h-screen text-slate-100 pb-40">
            <header class="flex justify-between items-center mb-16">
                <h1 class="orbitron text-6xl font-black italic">NEXUS<span class="text-red-600">_X</span></h1>
                <button id="btnNewMission" class="px-10 py-5 bg-white text-black rounded-full orbitron text-[10px] font-black hover:bg-red-600 hover:text-white transition-all uppercase">NUEVA ORDEN +</button>
            </header>
            <nav class="grid grid-cols-6 gap-4 mb-20">
                ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(f => `
                    <button class="fase-tab p-6 rounded-[2.5rem] bg-[#0d1117] border-2 ${faseActual === f ? 'border-red-600' : 'border-white/5'}" data-fase="${f}">
                        <span class="orbitron text-[8px] font-black block mb-2">${f}</span>
                        <h3 id="count-${f}" class="text-4xl font-black italic">0</h3>
                    </button>`).join('')}
            </nav>
            <div id="grid-ordenes" class="grid grid-cols-4 gap-6"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl p-12 overflow-y-auto"></div>
        </div>`;
        vincularEventosBase();
        actualizarContadores();
    };

    window.abrirTerminalNexus = (id = null) => {
        if(id) {
            getDoc(doc(db, "ordenes", id)).then(s => { ordenActiva = { id, ...s.data() }; renderTerminal(); });
        } else {
            ordenActiva = { placa:'', estado:'INGRESO', items:[], bitacora:'', insumos:0, anticipo:0, costos_totales:{} };
            renderTerminal();
        }
        document.getElementById("nexus-terminal").classList.remove("hidden");
    };

    const vincularEventosBase = () => {
        document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus();
        document.querySelectorAll(".fase-tab").forEach(tab => {
            tab.onclick = () => { faseActual = tab.dataset.fase; renderBase(); };
        });
    };

    const vincularAccionesTerminal = () => {
        document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
        document.getElementById("btnSincronizar").onclick = ejecutarSincronizacionTotal;
    };

    const actualizarContadores = () => {
        ['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].forEach(f => {
            const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", f));
            onSnapshot(q, s => { document.getElementById(`count-${f}`).innerText = s.size; });
        });
        const qG = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", faseActual));
        onSnapshot(qG, s => {
            const grid = document.getElementById("grid-ordenes");
            if(grid) grid.innerHTML = s.docs.map(d => `
                <div onclick="window.abrirTerminalNexus('${d.id}')" class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 hover:border-red-600 transition-all cursor-pointer">
                    <h4 class="orbitron text-2xl font-black text-white mb-2">${d.data().placa}</h4>
                    <p class="text-[9px] text-slate-500 orbitron uppercase font-bold">$ ${Math.round(d.data().costos_totales?.gran_total || 0).toLocaleString()}</p>
                </div>`).join('');
        });
    };

    renderBase();
}
