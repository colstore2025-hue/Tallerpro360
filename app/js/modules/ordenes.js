/**
 * ordenes.js - NEXUS-X COMMAND CENTER V10.0 "QUANTUM-SAP" 🛰️
 * SISTEMA LOGÍSTICO INTEGRADO - NEXUS-X STARLINK
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, updateDoc, serverTimestamp, increment, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { analizarPrecioSugerido, renderModuloPricing } from "../ai/pricingEnginePRO360.js";

// Importación lógica de módulos hermanos para trazabilidad
// Nota: Estos se invocan dinámicamente según la acción
export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    let ordenActiva = null;
    let faseActual = 'INGRESO';

    if (!empresaId) {
        container.innerHTML = `<div class="p-10 orbitron text-red-500">ERROR: NO_EMPRESA_ID</div>`;
        return;
    }

    // --- MOTOR FINANCIERO INTEGRADO ---
    const recalcularFinanzas = () => {
        if (!ordenActiva) return;
        
        let m = { v_rep: 0, c_rep: 0, v_mo: 0, c_mo: 0, tiempo: 0 };
        ordenActiva.items.forEach(i => {
            const v = Number(i.venta || 0);
            const c = Number(i.costo || 0);
            if (i.tipo === 'REPUESTO') { m.v_rep += v; m.c_rep += c; }
            else { m.v_mo += v; m.c_mo += c; }
        });

        const insumos = Number(document.getElementById("f-insumos-valor")?.value || 0); 
        const anticipo = Number(document.getElementById("f-anticipo")?.value || 0); 
        
        const granTotal = m.v_rep + m.v_mo + insumos; 
        const utilidadNeta = (granTotal / 1.19) - (m.c_rep + m.c_mo + insumos);

        ordenActiva.costos_totales = {
            gran_total: granTotal,
            utilidad: utilidadNeta,
            anticipo: anticipo,
            saldo_pendiente: granTotal - anticipo,
            insumos: insumos,
            detalle_insumos: document.getElementById("f-insumos-detalle")?.value || ''
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
                <span class="text-cyan-500/50 text-[9px] orbitron block font-black mb-1">LOGISTICS TRACEABILITY</span>
                <div class="flex flex-col text-[10px] orbitron text-slate-400">
                    <span>ANTICIPO: $${Math.round(c.anticipo).toLocaleString()}</span>
                    <span>INSUMOS: $${Math.round(c.insumos).toLocaleString()}</span>
                    <span class="text-emerald-500">EBITDA EST: $${Math.round(c.utilidad).toLocaleString()}</span>
                </div>
                <span class="${c.saldo_pendiente > 0 ? 'text-red-500' : 'text-emerald-400'} font-black text-5xl orbitron tracking-tighter block mt-2">
                    $ ${Math.round(c.saldo_pendiente).toLocaleString()}
                </span>
            </div>`;
    };

    // --- GESTIÓN DE EVIDENCIA Y MULTIMEDIA (ZERO-MEMORY FIRESTORE) ---
    window.capturarEvidencia = (tipo) => {
        const input = document.getElementById("nexus-camera-input");
        input.onchange = (e) => {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            // Aquí se simula la "pegada" sin gastar storage, se puede enviar a un canal de WA o temporal
            Swal.fire({ title: 'EVIDENCIA LISTA', text: `${tipo} capturado correctamente`, icon: 'success', background: '#0d1117' });
        };
        input.click();
    };

    // --- CHECKLIST DE VEHÍCULO (INGRESO) ---
    const renderChecklist = () => {
        const items = ['Llaves', 'Herramientas', 'Rueda Repuesto', 'Documentos', 'Radio/Pantalla', 'Antena'];
        return `
        <div class="bg-black/40 p-8 rounded-[2.5rem] border border-white/5 mt-6">
            <h4 class="orbitron text-[10px] text-red-500 font-black mb-4">CHECKLIST DE RECEPCIÓN</h4>
            <div class="grid grid-cols-2 gap-4">
                ${items.map(item => `
                    <label class="flex items-center gap-3 text-[10px] orbitron cursor-pointer">
                        <input type="checkbox" class="w-4 h-4 accent-red-600" ${ordenActiva.checklist?.[item] ? 'checked' : ''} 
                        onchange="window.updateChecklist('${item}', this.checked)">
                        ${item.toUpperCase()}
                    </label>`).join('')}
            </div>
            <textarea id="f-danos" placeholder="OBSERVACIONES DE ESTADO (RAYONES, GOLPES...)" 
            class="w-full bg-black/60 p-4 rounded-xl mt-6 border border-white/5 text-[10px] orbitron h-20 text-white">${ordenActiva.observaciones_estado || ''}</textarea>
        </div>`;
    };

    window.updateChecklist = (key, val) => {
        if(!ordenActiva.checklist) ordenActiva.checklist = {};
        ordenActiva.checklist[key] = val;
    };

    // --- COMUNICACIÓN Y TRAZABILIDAD (WHATSAPP & PDF) ---
    window.enviarNotificacionWhatsApp = (tipo) => {
        const tel = document.getElementById("f-telefono").value;
        if(!tel) return Swal.fire('Error', 'No hay teléfono', 'error');
        
        let msg = `NEXUS-X LOGISTICS | Orden: ${ordenActiva.placa}\n`;
        if(tipo === 'INGRESO') msg += `✅ Vehículo recibido correctamente. Link de inspección: [PDF_LINK]`;
        if(tipo === 'COTIZACION') msg += `📊 Su cotización está lista por valor de: $${ordenActiva.costos_totales.gran_total.toLocaleString()}`;

        // Registro de Trazabilidad
        if(!ordenActiva.trazabilidad) ordenActiva.trazabilidad = [];
        ordenActiva.trazabilidad.push({ fecha: new Date().toISOString(), tipo, mensaje: msg });

        const waUrl = `https://api.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
        recalcularFinanzas(); // Sincroniza estado local
    };

    // --- RENDERIZADO TERMINAL QUANTUM ---
    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1700px] mx-auto pb-40 animate-in fade-in zoom-in duration-500">
            <div class="flex justify-between items-center mb-10 bg-[#0d1117] p-8 rounded-[3.5rem] border-b-8 border-red-600 shadow-2xl">
                <div class="flex items-center gap-6">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-6xl font-black orbitron text-white w-72 uppercase text-center rounded-[2rem] border border-white/10">
                    <div class="flex gap-2">
                        <button onclick="capturarEvidencia('FOTO')" class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white hover:text-black transition-all">📷</button>
                        <button onclick="enviarNotificacionWhatsApp('PDF')" class="w-14 h-14 bg-red-600/20 rounded-2xl flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-all italic font-black">PDF</button>
                        <button onclick="enviarNotificacionWhatsApp('${ordenActiva.estado}')" class="w-14 h-14 bg-emerald-600/20 rounded-2xl flex items-center justify-center text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all">WA</button>
                    </div>
                </div>
                <button id="btnCloseTerminal" class="w-16 h-16 bg-red-600 rounded-full text-white text-2xl font-black hover:rotate-90 transition-all flex items-center justify-center">✕</button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-[#0d1117] rounded-[3.5rem] p-8 border border-white/5 space-y-4">
                        <input id="f-cliente" value="${ordenActiva.cliente || ''}" placeholder="CLIENTE" class="w-full bg-black p-4 rounded-xl border border-white/5 text-white font-black text-xs uppercase">
                        <div class="grid grid-cols-2 gap-4">
                            <input id="f-cc" value="${ordenActiva.cc || ''}" placeholder="CC / NIT" class="bg-black p-4 rounded-xl border border-white/5 text-white text-xs">
                            <input id="f-email" value="${ordenActiva.email || ''}" placeholder="EMAIL" class="bg-black p-4 rounded-xl border border-white/5 text-white text-xs">
                        </div>
                        <input id="f-telefono" value="${ordenActiva.telefono || ''}" placeholder="WHATSAPP" class="w-full bg-black p-4 rounded-xl border border-white/5 text-emerald-400 font-black text-xs">
                        ${renderChecklist()}
                    </div>
                    <div id="pricing-engine-container"></div>
                </div>

                <div class="lg:col-span-8 space-y-6">
                    <div class="bg-[#0d1117] p-10 rounded-[4.5rem] border border-white/5 relative">
                        <div class="flex justify-between items-end mb-10">
                            <h2 id="total-factura" class="orbitron text-[8rem] font-black text-white italic tracking-tighter leading-none">$ 0</h2>
                            <div id="saldo-display"></div>
                        </div>

                        <div class="grid grid-cols-12 gap-4 mb-6 bg-white/[0.02] p-6 rounded-3xl border border-dashed border-white/10">
                            <div class="col-span-8">
                                <input id="f-insumos-detalle" value="${ordenActiva.costos_totales?.detalle_insumos || ''}" placeholder="DETALLE INSUMOS / TORNO / GASTOS EXTRA" class="w-full bg-transparent text-slate-400 orbitron text-[10px] outline-none">
                            </div>
                            <div class="col-span-2">
                                <input id="f-insumos-valor" type="number" onchange="recalcularFinanzas()" value="${ordenActiva.costos_totales?.insumos || 0}" class="w-full bg-black p-2 rounded-lg text-red-500 font-black text-center text-xs">
                            </div>
                            <div class="col-span-2">
                                <input id="f-anticipo" type="number" onchange="recalcularFinanzas()" value="${ordenActiva.costos_totales?.anticipo || 0}" placeholder="ANTICIPO" class="w-full bg-emerald-900/20 p-2 rounded-lg text-emerald-500 font-black text-center text-xs border border-emerald-500/30">
                            </div>
                        </div>

                        <div id="items-container" class="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scroll"></div>
                        
                        <div class="grid grid-cols-3 gap-4 mt-10">
                            <button onclick="window.addItemNexus('REPUESTO')" class="py-6 bg-white/5 rounded-2xl border border-white/10 orbitron text-[9px] font-black text-white hover:bg-white hover:text-black transition-all">ADD REPUESTO</button>
                            <button onclick="window.addItemNexus('MANO_OBRA')" class="py-6 bg-red-600/10 rounded-2xl border border-red-600/20 orbitron text-[9px] font-black text-red-500 hover:bg-red-600 hover:text-white transition-all">ADD MANO OBRA</button>
                            <button id="btnSincronizar" class="py-6 bg-white text-black rounded-2xl orbitron font-black text-sm hover:bg-red-600 hover:text-white transition-all shadow-2xl">🛰️ SYNC CLOUD</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        
        renderModuloPricing(document.getElementById('pricing-engine-container'));
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    // --- LÓGICA DE PERSISTENCIA Y SYNC ---
    const ejecutarSincronizacionTotal = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true;
        
        try {
            const batch = writeBatch(db);
            const id = ordenActiva.id || `OT_${document.getElementById('f-placa').value}_${Date.now()}`;
            
            // Captura de datos finales antes de cerrar
            const data = {
                ...ordenActiva,
                id, empresaId,
                placa: document.getElementById('f-placa').value.toUpperCase(),
                cliente: document.getElementById('f-cliente').value,
                telefono: document.getElementById('f-telefono').value,
                cc: document.getElementById('f-cc').value,
                email: document.getElementById('f-email').value,
                observaciones_estado: document.getElementById('f-danos').value,
                updatedAt: serverTimestamp()
            };

            batch.set(doc(db, "ordenes", id), data);
            
            // Enlace con contabilidad.js y finanzas_elite.js
            batch.set(doc(db, "contabilidad", `ACC_${id}`), {
                empresaId, 
                monto: data.costos_totales.gran_total, 
                utilidad: data.costos_totales.utilidad,
                anticipo: data.costos_totales.anticipo,
                fecha: serverTimestamp(),
                tipo: 'ORDEN_TALLER'
            });

            await batch.commit();
            Swal.fire({ title:'QUANTUM SYNC OK', icon:'success', background:'#0d1117', color:'#fff' });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (e) { 
            Swal.fire('Error', e.message, 'error');
        } finally { btn.disabled = false; }
    };

    // (Aquí se mantienen las funciones de vincularEventosBase, actualizarContadores y abrirTerminalNexus del script original para no romper la navegación)
    // ... [Seccion estandar de navegacion] ...

    window.abrirTerminalNexus = (id = null) => {
        if(id) {
            getDoc(doc(db, "ordenes", id)).then(s => { ordenActiva = { id, ...s.data() }; renderTerminal(); });
        } else {
            ordenActiva = { placa:'', estado:'INGRESO', items:[], checklist:{}, trazabilidad:[], costos_totales:{insumos:0, anticipo:0} };
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
            onSnapshot(q, s => {
                const el = document.getElementById(`count-${f}`);
                if(el) el.innerText = s.size;
            });
        });
        const qG = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", faseActual));
        onSnapshot(qG, s => {
            const grid = document.getElementById("grid-ordenes");
            if(grid) grid.innerHTML = s.docs.map(d => `
                <div onclick="window.abrirTerminalNexus('${d.id}')" class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 hover:border-red-600 transition-all cursor-pointer">
                    <h4 class="orbitron text-3xl font-black text-white">${d.data().placa}</h4>
                    <p class="text-[9px] text-slate-500 orbitron uppercase font-bold mb-4">${d.data().cliente || 'S/N'}</p>
                    <div class="flex justify-between border-t border-white/5 pt-4">
                        <span class="text-emerald-400 font-black italic">$ ${Math.round(d.data().costos_totales?.gran_total || 0).toLocaleString()}</span>
                    </div>
                </div>`).join('');
        });
    };

    window.renderItems = () => {
        const container = document.getElementById("items-container");
        if(!container) return;
        container.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="flex items-center gap-6 bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
                <div class="flex-1 grid grid-cols-4 gap-4">
                    <div class="col-span-2">
                        <input onchange="window.editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" class="bg-transparent text-white font-black orbitron text-[10px] outline-none w-full uppercase">
                    </div>
                    <input type="number" onchange="window.editItemNexus(${idx}, 'costo', this.value)" value="${item.costo}" class="bg-black/40 p-3 rounded-xl text-red-500 font-black text-center text-[10px]">
                    <input type="number" onchange="window.editItemNexus(${idx}, 'venta', this.value)" value="${item.venta}" class="bg-black/40 p-3 rounded-xl text-emerald-400 font-black text-center text-[10px]">
                </div>
                <button onclick="ordenActiva.items.splice(${idx}, 1); recalcularFinanzas();" class="text-white/10 hover:text-red-500 font-black">✕</button>
            </div>`).join('');
    };

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-slate-100 font-sans pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-end gap-6 mb-16 border-b border-white/5 pb-10">
                <div class="space-y-2">
                    <h1 class="orbitron text-7xl font-black italic tracking-tighter text-white">NEXUS<span class="text-red-600">_X</span></h1>
                    <p class="text-[10px] orbitron text-red-600/60 tracking-[0.6em] font-bold uppercase italic">QUANTUM-SAP LOGISTICS SYSTEM</p>
                </div>
                <button id="btnNewMission" class="px-12 py-6 bg-white text-black rounded-full orbitron text-[10px] font-black hover:bg-red-600 hover:text-white transition-all uppercase shadow-2xl">NUEVA MISIÓN +</button>
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

    renderBase();
}
