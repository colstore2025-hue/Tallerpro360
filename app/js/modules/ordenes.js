/**
 * ordenes.js - NEXUS-X "THE TITAN" V17.0 🛰️
 * CONSOLIDACIÓN TOTAL: INVENTORY SYNC + SAP BI + NEON UI + VOICE AI
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS & GEMINI AI PRO
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, serverTimestamp, writeBatch, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { analizarPrecioSugerido, renderModuloPricing } from "../ai/pricingEnginePRO360.js";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;
    let cacheInventario = []; // Para búsqueda rápida

    if (!empresaId) {
        container.innerHTML = `<div class="p-10 orbitron text-red-500">ERROR: NO_EMPRESA_ID_DETECTED</div>`;
        return;
    }

    // --- 1. MOTOR FINANCIERO INTEGRADO (SAP-ELIMINATOR V17) ---
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
                }
            } else {
                m.v_mo += v;
                m.c_mo += c; 
            }
        });

        const insumosIVA = Number(document.getElementById("f-insumos-iva")?.value || 0); 
        const insumosNoIVA = Number(document.getElementById("f-insumos-no-iva")?.value || 0); 
        const anticipo = Number(document.getElementById("f-anticipo")?.value || 0); 
        
        const subtotalGravado = m.v_rep + m.v_mo + insumosIVA;
        const baseGravable = subtotalGravado / 1.19;
        const iva = subtotalGravado - baseGravable;
        const totalFactura = subtotalGravado + insumosNoIVA;
        
        // EBITDA REAL: Considera el costo real traído del inventario
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

    // --- 2. TRAZABILIDAD HARLEY-DAVIDSON (LINK & DOC GENERATOR) ---
    const enviarNotificacionNexus = (proceso) => {
        const placaDoc = document.getElementById("f-placa")?.value || "SIN_PLACA";
        const clienteDoc = document.getElementById("f-cliente")?.value || "CLIENTE";
        // Link directo al visor de documentos del servidor
        const linkServidor = `https://tallerpro360.web.app/trace/${ordenActiva.id}`;
        let mensaje = "";
        
        switch(proceso) {
            case 'INGRESO':
                mensaje = `🛰️ *NEXUS_X: INGRESO CONFIRMADO*%0AHola *${clienteDoc}*, su vehículo *${placaDoc}* ha iniciado fase de diagnóstico. Trazabilidad en vivo y documento: ${linkServidor}`;
                break;
            case 'REPARACION':
                mensaje = `🛠️ *NEXUS_X: EN PROCESO*%0A*${clienteDoc}*, estamos ejecutando las reparaciones en *${placaDoc}*. Vea el progreso aquí: ${linkServidor}`;
                break;
            case 'FINAL':
                mensaje = `✅ *NEXUS_X: VEHÍCULO LISTO*%0ASu vehículo *${placaDoc}* está listo para entrega. Resumen técnico y factura PDF: ${linkServidor}`;
                break;
        }
        window.open(`https://wa.me/57${ordenActiva.telefono}?text=${mensaje}`, '_blank');
    };

    // --- 3. INTEGRACIÓN DE INVENTARIO (EL PUENTE) ---
    window.buscarEnInventario = async (queryTerm, idx) => {
        if (queryTerm.length < 2) {
            document.getElementById(`results-${idx}`).classList.add('hidden');
            return;
        }

        const q = query(collection(db, "inventario"), where("empresaId", "==", empresaId), where("origen", "==", "PROPIO"));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                         .filter(it => it.nombre.toLowerCase().includes(queryTerm.toLowerCase()) || it.referencia.toLowerCase().includes(queryTerm.toLowerCase()));

        const resDiv = document.getElementById(`results-${idx}`);
        resDiv.innerHTML = list.map(item => `
            <div onclick="window.seleccionarRepuesto(${idx}, '${item.id}', '${item.nombre}', ${item.precioCosto}, ${item.precioVenta})" 
                 class="p-4 hover:bg-cyan-500 hover:text-black cursor-pointer border-b border-white/5 flex justify-between items-center">
                <span class="text-[10px] font-black">${item.nombre} [${item.referencia}]</span>
                <span class="text-[9px] orbitron bg-black/20 px-2 py-1 rounded">STOCK: ${item.cantidad}</span>
            </div>
        `).join('');
        resDiv.classList.remove('hidden');
    };

    window.seleccionarRepuesto = (idx, id, nombre, costo, venta) => {
        ordenActiva.items[idx].desc = nombre;
        ordenActiva.items[idx].costo = costo;
        ordenActiva.items[idx].venta = venta;
        ordenActiva.items[idx].inventarioId = id; // Guardamos el ID para descontar stock luego
        document.getElementById(`results-${idx}`).classList.add('hidden');
        recalcularFinanzas();
    };

    // --- 4. UI & TERMINAL ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#05070a] min-h-screen text-slate-100 font-sans pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-end gap-6 mb-16 border-b-2 border-red-600 pb-10">
                <div class="space-y-1">
                    <h1 class="orbitron text-7xl font-black italic tracking-tighter text-white uppercase">NEXUS<span class="text-red-600">_X</span></h1>
                    <p class="text-[10px] orbitron text-cyan-400 font-bold tracking-[0.8em] uppercase italic">Integrated Supply Chain Management</p>
                </div>
                <button id="btnNewMission" class="px-12 py-5 bg-cyan-500 text-black rounded-none orbitron text-[10px] font-black hover:bg-white transition-all shadow-[10px_10px_0px_rgba(0,242,255,0.3)] uppercase">NEW_ORDER +</button>
            </header>
            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl p-6 lg:p-12 overflow-y-auto custom-scroll"></div>
        </div>`;
        document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus();
        cargarEscuchaOrdenes();
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1600px] mx-auto pb-40 animate-in zoom-in duration-300">
            <div class="flex flex-col lg:flex-row justify-between items-center mb-12 bg-[#0d1117] p-10 border-l-8 border-cyan-500 rounded-r-3xl gap-6 shadow-2xl">
                <div class="flex items-center gap-6">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-7xl font-black orbitron text-white w-96 uppercase border-2 border-white/5 rounded-xl text-center" placeholder="PLACA">
                    <div class="flex gap-2">
                        <button onclick="window.nexusEscuchaPlaca()" class="w-20 h-20 bg-red-600 rounded-xl flex items-center justify-center animate-pulse"><i class="fas fa-microphone text-2xl"></i></button>
                    </div>
                </div>
                
                <div class="flex items-center gap-4 bg-black/50 p-6 rounded-2xl border border-white/5">
                    <span class="orbitron text-[9px] text-slate-500 uppercase">Mission_Status:</span>
                    <select id="f-estado" onchange="window.cambiarEstado(this.value)" class="bg-transparent text-cyan-400 orbitron font-black text-2xl outline-none">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(e => 
                            `<option value="${e}" ${ordenActiva.estado === e ? 'selected' : ''} class="bg-black">${e}</option>`).join('')}
                    </select>
                </div>

                <button id="btnCloseTerminal" class="w-24 h-24 bg-red-600 text-white text-4xl font-black rounded-3xl hover:rotate-90 transition-all">✕</button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-[#0d1117] p-10 border border-white/5 rounded-[3rem] shadow-2xl">
                        <h4 class="orbitron font-black text-cyan-500 text-[11px] mb-8 uppercase tracking-widest italic">Client Master Data</h4>
                        <input id="f-cliente" value="${ordenActiva.cliente || ''}" placeholder="NOMBRE DEL PILOTO" class="w-full bg-black p-6 mb-4 text-white font-black uppercase text-sm border border-white/10 rounded-2xl">
                        <input id="f-telefono" value="${ordenActiva.telefono || ''}" placeholder="WHATSAPP LINK" class="w-full bg-black p-6 mb-8 text-green-400 font-black border border-white/10 rounded-2xl">
                        
                        <div class="grid grid-cols-1 gap-4">
                            <button onclick="window.enviarNotificacionNexus('INGRESO')" class="py-5 bg-green-600/10 text-green-500 orbitron text-[10px] font-black rounded-xl border border-green-600/20 hover:bg-green-600 hover:text-white transition-all uppercase">Notificar Ingreso</button>
                            <button onclick="window.enviarNotificacionNexus('REPARACION')" class="py-5 bg-cyan-600/10 text-cyan-500 orbitron text-[10px] font-black rounded-xl border border-cyan-600/20 hover:bg-cyan-600 hover:text-white transition-all uppercase">Notificar Avance</button>
                            <button onclick="window.enviarNotificacionNexus('FINAL')" class="py-5 bg-red-600/10 text-red-500 orbitron text-[10px] font-black rounded-xl border border-red-600/20 hover:bg-red-600 hover:text-white transition-all uppercase">Notificar Finalización</button>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 border border-cyan-500/10 rounded-[4rem] relative shadow-2xl overflow-hidden">
                        <div class="flex justify-between items-start mb-12">
                            <div>
                                <h2 id="total-factura" class="orbitron text-[9rem] font-black text-white italic leading-none tracking-tighter">$ 0</h2>
                                <p class="text-cyan-400 orbitron font-black text-xs mt-4 tracking-widest uppercase italic">SAP Financial Balance</p>
                            </div>
                            <div id="finance-summary" class="w-96"></div>
                        </div>
                        
                        <div id="items-container" class="space-y-6 max-h-[500px] overflow-y-auto pr-6 custom-scroll"></div>
                        
                        <div class="grid grid-cols-2 gap-8 mt-12">
                            <button onclick="window.addItemNexus('REPUESTO')" class="py-8 bg-white/5 border-2 border-dashed border-white/10 orbitron text-[11px] font-black text-white hover:bg-white hover:text-black transition-all rounded-[2rem] uppercase tracking-widest">+ Add_Part_Stock</button>
                            <button onclick="window.addItemNexus('MANO_OBRA')" class="py-8 bg-red-600/5 border-2 border-dashed border-red-600/20 orbitron text-[11px] font-black text-red-600 hover:bg-red-600 hover:text-white transition-all rounded-[2rem] uppercase tracking-widest">+ Add_Labor_Skill</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-6">
                        <div class="bg-black p-8 rounded-[2.5rem] border border-white/5">
                            <label class="orbitron text-[9px] text-slate-500 block mb-4 uppercase font-black">Insumos (IVA)</label>
                            <input id="f-insumos-iva" value="${ordenActiva.insumos || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-white text-5xl font-black w-full outline-none orbitron">
                        </div>
                        <div class="bg-black p-8 rounded-[2.5rem] border border-white/5">
                            <label class="orbitron text-[9px] text-yellow-500 block mb-4 uppercase font-black">Insumos (NO_IVA)</label>
                            <input id="f-insumos-no-iva" value="${ordenActiva.insumos_no_iva || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-yellow-500 text-5xl font-black w-full outline-none orbitron">
                        </div>
                        <div class="bg-black p-8 rounded-[2.5rem] border border-white/5">
                            <label class="orbitron text-[9px] text-green-500 block mb-4 uppercase font-black">Deposit / Anticipo</label>
                            <input id="f-anticipo" value="${ordenActiva.anticipo || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-green-400 text-5xl font-black w-full outline-none orbitron">
                        </div>
                    </div>

                    <button id="btnSincronizar" class="w-full bg-white text-black py-12 orbitron font-black text-5xl rounded-[3rem] hover:bg-cyan-500 transition-all shadow-[0_0_80px_rgba(255,255,255,0.1)] uppercase italic">🛰️ Sync_To_Cloud</button>
                </div>
            </div>
        </div>`;
        
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    window.renderItems = () => {
        const containerItems = document.getElementById("items-container");
        if(!containerItems) return;
        containerItems.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="relative bg-white/[0.02] p-8 rounded-[2rem] border ${item.origen === 'CLIENTE' ? 'border-yellow-600/30 bg-yellow-600/[0.02]' : 'border-white/5'} group transition-all hover:bg-white/[0.04]">
                <div class="grid grid-cols-12 gap-8 items-center">
                    <div class="col-span-6 relative">
                        <input oninput="window.buscarEnInventario(this.value, ${idx})" 
                               value="${item.desc}" 
                               class="bg-transparent text-white font-black orbitron text-sm outline-none w-full uppercase placeholder:text-slate-700" 
                               placeholder="BUSCAR REPUESTO O SERVICIO...">
                        <div id="results-${idx}" class="hidden absolute top-full left-0 w-full bg-[#161b22] z-50 rounded-xl border border-cyan-500/30 shadow-2xl mt-2 max-h-60 overflow-y-auto"></div>
                        <span class="text-[8px] orbitron text-cyan-500 font-black uppercase mt-2 block tracking-widest">
                            ${item.tipo} | TECH: ${item.tecnico} | ORIGEN: ${item.origen}
                        </span>
                    </div>
                    <div class="col-span-3">
                        <label class="text-[7px] orbitron text-slate-600 block mb-1 uppercase font-black">Unit_Cost</label>
                        <input type="number" onchange="window.updateItem(${idx}, 'costo', this.value)" value="${item.costo}" class="bg-black/50 p-4 text-red-500 font-black text-center orbitron text-sm rounded-xl w-full border border-white/5">
                    </div>
                    <div class="col-span-2">
                        <label class="text-[7px] orbitron text-slate-600 block mb-1 uppercase font-black">Sales_Price</label>
                        <input type="number" onchange="window.updateItem(${idx}, 'venta', this.value)" value="${item.venta}" class="bg-black/50 p-4 text-emerald-400 font-black text-center orbitron text-sm rounded-xl w-full border border-white/5">
                    </div>
                    <div class="col-span-1 text-right">
                        <button onclick="window.removeItemNexus(${idx})" class="text-slate-700 hover:text-red-500 transition-all"><i class="fas fa-trash-alt text-xl"></i></button>
                    </div>
                </div>
            </div>`).join('');
    };

    // --- 5. LOGICA DE SINCRONIZACIÓN Y DESCUENTO DE STOCK ---
    const ejecutarSincronizacionTotal = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-satellite animate-spin"></i> UPLOADING_TO_ORBIT...`;

        try {
            const batch = writeBatch(db);
            const placa = document.getElementById("f-placa").value.toUpperCase();
            if(!placa) throw new Error("PLACA_REQUERIDA");

            const id = ordenActiva.id || `OT_${placa}_${Date.now()}`;

            const data = {
                ...ordenActiva,
                id, placa, empresaId,
                cliente: document.getElementById("f-cliente").value.toUpperCase(),
                telefono: document.getElementById("f-telefono").value,
                anticipo: Number(document.getElementById("f-anticipo").value),
                insumos: Number(document.getElementById("f-insumos-iva").value),
                insumos_no_iva: Number(document.getElementById("f-insumos-no-iva").value),
                updatedAt: serverTimestamp()
            };

            // 1. Guardar Orden
            batch.set(doc(db, "ordenes", id), data);
            
            // 2. Asiento Contable
            batch.set(doc(db, "contabilidad", `CONT_${id}`), {
                empresaId, total: data.costos_totales.total, 
                utilidad: data.costos_totales.ebitda, fecha: serverTimestamp(), placa 
            });

            // 3. DESCUENTO DE STOCK (Si la orden se cierra o es nueva venta)
            for (const item of data.items) {
                if (item.tipo === 'REPUESTO' && item.inventarioId && item.origen === 'TALLER') {
                    const stockRef = doc(db, "inventario", item.inventarioId);
                    const stockSnap = await getDoc(stockRef);
                    if (stockSnap.exists()) {
                        const nuevoStock = Math.max(0, stockSnap.data().cantidad - 1);
                        batch.update(stockRef, { cantidad: nuevoStock });
                    }
                }
            }

            await batch.commit();
            hablar("Transmisión completa. Bóveda actualizada.");
            Swal.fire({ title: 'NEXUS_SYNC_SUCCESS', icon: 'success', background: '#0d1117', color: '#fff', customClass: {popup:'rounded-[3rem]'} });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (e) {
            console.error(e);
            btn.disabled = false;
            btn.innerHTML = `🛰️ RETRY_PUSH`;
            Swal.fire('ERROR', e.message, 'error');
        }
    };

    // --- ACCIONES AUXILIARES ---
    window.addItemNexus = async (tipo) => {
        let origen = 'TALLER';
        let tec = 'INTERNO';
        let costo = 0;
        
        if(tipo === 'REPUESTO') {
            const { value: res } = await Swal.fire({
                title: 'ORIGEN REPUESTO',
                input: 'select',
                inputOptions: { 'TALLER': 'Stock Taller', 'CLIENTE': 'Traído por Cliente' },
                background: '#010409', color: '#fff', customClass: {popup:'rounded-[2rem]'}
            });
            origen = res || 'TALLER';
        } else {
            const { value:t } = await Swal.fire({ title:'TÉCNICO ASIGNADO', input:'text', background:'#010409', color:'#fff', customClass: {popup:'rounded-[2rem]'} });
            tec = t || 'STAFF';
            const { value:c } = await Swal.fire({ title:'COSTO OPERATIVO', input:'number', background:'#010409', color:'#fff', customClass: {popup:'rounded-[2rem]'} });
            costo = Number(c || 0);
        }

        ordenActiva.items.push({ tipo, desc: '', costo, venta: 0, origen, tecnico: tec, inventarioId: null });
        recalcularFinanzas();
    };

    window.updateItem = (idx, campo, valor) => {
        ordenActiva.items[idx][campo] = (campo === 'desc') ? valor.toUpperCase() : Number(valor);
        recalcularFinanzas();
    };

    window.removeItemNexus = (idx) => {
        ordenActiva.items.splice(idx, 1);
        recalcularFinanzas();
    };

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

    window.cambiarEstado = async (nuevoEstado) => {
        if(!ordenActiva.id) return;
        await updateDoc(doc(db, "ordenes", ordenActiva.id), { estado: nuevoEstado });
        hablar(`Orden en fase ${nuevoEstado}`);
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
            ordenActiva = { placa:'', estado:'INGRESO', items:[], cliente:'', telefono:'', anticipo:0, insumos:0, insumos_no_iva:0 };
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
                <div onclick="window.abrirTerminalNexus('${d.id}')" class="bg-[#0d1117] p-10 border border-white/5 rounded-[3rem] hover:border-cyan-500 transition-all cursor-pointer group shadow-2xl relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4"><span class="text-[7px] orbitron bg-cyan-500 text-black px-3 py-1 rounded-full font-black">${o.estado}</span></div>
                    <h4 class="orbitron text-5xl font-black text-white group-hover:text-cyan-400 mb-2 italic tracking-tighter">${o.placa}</h4>
                    <p class="text-[9px] text-slate-500 mb-6 font-black uppercase tracking-widest">${o.cliente || 'PILOT_UNKNOWN'}</p>
                    <div class="pt-6 border-t border-white/5 flex justify-between items-center">
                        <span class="orbitron text-emerald-400 font-black text-xl">$ ${Math.round(o.costos_totales?.total || 0).toLocaleString()}</span>
                        <i class="fas fa-chevron-right text-slate-800 group-hover:text-cyan-500 transition-all"></i>
                    </div>
                </div>`;
            }).join('');
        });
    };

    renderBase();
}
