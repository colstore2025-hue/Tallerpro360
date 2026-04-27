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

// --- CONFIGURACIÓN DE ESPECIALIDADES (EL ASCENSOR NEXUS) ---
// Este diccionario es el núcleo para las gráficas en reportes.js
const NEXUS_ASCENSOR = {
    MECANICA: { label: 'Mecánica', color: '#06b6d4', icon: 'fa-tools' },
    LATONERIA_PINTURA: { label: 'Latonería y Pintura', color: '#fbbf24', icon: 'fa-paint-roller' },
    ELECTRICO: { label: 'Eléctrico', color: '#a855f7', icon: 'fa-bolt' },
    ELECTRONICA: { label: 'Electrónica', color: '#10b981', icon: 'fa-microchip' }
};

const SpeechRecognition = window.Recognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;

    if (!empresaId) {
        container.innerHTML = `<div class="p-10 orbitron text-red-500">ERROR: NO_EMPRESA_ID_DETECTED</div>`;
        return;
    }

    // --- MOTOR FINANCIERO QUANTUM-SAP V17 ---
    const recalcularFinanzas = () => {
        if (!ordenActiva) return;
        
        let m = { v_rep: 0, c_rep: 0, v_mo: 0, c_mo: 0 };
        ordenActiva.items.forEach(i => {
            const v = Number(i.venta || 0);
            const c = Number(i.costo || 0);
            const cant = Number(i.cantidad || 1);

            if (i.tipo === 'REPUESTO' && i.origen === 'TALLER') {
                m.v_rep += (v * cant);
                m.c_rep += (c * cant);
            } else if (i.tipo === 'MANO_OBRA') {
                m.v_mo += (v * cant);
                m.c_mo += (c * cant);
            }
        });

        const insumosIVA = Number(document.getElementById("f-insumos-iva")?.value || 0);
        const insumosNoIVA = Number(document.getElementById("f-insumos-no-iva")?.value || 0);
        const anticipo = Number(document.getElementById("f-anticipo")?.value || 0);

        const subtotalGravado = m.v_rep + m.v_mo + insumosIVA;
        const baseGravable = subtotalGravado / 1.19;
        const ivaTotal = subtotalGravado - baseGravable;
        const totalFinal = subtotalGravado + insumosNoIVA;

        const costoTotalOperativo = m.c_rep + m.c_mo + (insumosIVA / 1.19);
        const utilidadNeta = baseGravable - costoTotalOperativo + insumosNoIVA;

        ordenActiva.costos_totales = {
            total: totalFinal,
            base: baseGravable,
            iva: ivaTotal,
            saldo: totalFinal - anticipo,
            ebitda: utilidadNeta,
            margen: (utilidadNeta / baseGravable) * 100
        };

        actualizarUIFinanciera(totalFinal, baseGravable, ivaTotal, utilidadNeta, (totalFinal - anticipo));
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

    window.enviarNotificacionNexus = (proceso) => {
        const linkTrazabilidad = `https://tallerpro360.web.app/trace.html?id=${ordenActiva.id}`;
        const taller = "TallerPRO360 - Titan Logistics";
        let msj = "";
        
        if (proceso === 'INGRESO') {
            msj = `*${taller}*%0A🛰️ *ORDEN:* ${ordenActiva.placa}%0AHola *${ordenActiva.cliente}*, su vehículo ha ingresado.%0A📝 *BITÁCORA:* ${ordenActiva.bitacora_ia || 'Inspección en curso'}%0A🌐 *LINK:* ${linkTrazabilidad}`;
        } else if (proceso === 'FINAL') {
            msj = `*${taller}*%0A✅ *OPERACIÓN COMPLETADA*%0A*${ordenActiva.placa}* listo para entrega.%0A💰 *TOTAL:* $${Math.round(ordenActiva.costos_totales.total).toLocaleString()}%0A📥 *REPORTE:* ${linkTrazabilidad}`;
        }

        const urlWA = `https://wa.me/57${ordenActiva.telefono}?text=${msj}`;
        window.open(urlWA, '_blank');
    };

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

                <div class="flex flex-col gap-2 bg-black/50 p-4 px-6 rounded-2xl border border-white/5 min-w-[250px]">
                    <span class="orbitron text-[8px] text-slate-500 uppercase tracking-[0.2em] font-black">Ascensor / Área:</span>
                    <div class="flex items-center gap-3">
                        <i class="fas fa-layer-group text-cyan-500 text-xs"></i>
                        <select id="f-tipo-orden" class="bg-transparent text-white orbitron font-black text-sm outline-none border-b border-white/10 focus:border-cyan-500 cursor-pointer w-full">
                            ${Object.entries(NEXUS_ASCENSOR).map(([key, val]) => `
                                <option value="${key}" ${ordenActiva.tipo_orden === key ? 'selected' : ''} class="bg-[#0d1117] text-white">
                                    ${val.label.toUpperCase()}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="flex items-center gap-4 bg-black/50 p-4 px-6 rounded-2xl border border-white/5">
                    <div class="flex flex-col gap-1">
                        <span class="orbitron text-[9px] text-slate-500 uppercase font-black">Fase Actual:</span>
                        <select id="f-estado" onchange="window.cambiarEstado(this.value)" class="bg-transparent text-cyan-400 orbitron font-black text-xl outline-none cursor-pointer">
                            ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(e => 
                                `<option value="${e}" ${ordenActiva.estado === e ? 'selected' : ''} class="bg-[#0d1117]">${e}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <button id="btnCloseTerminal" class="w-20 h-20 bg-red-600 text-white text-3xl font-black rounded-2xl hover:rotate-90 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]">✕</button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                ```
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-[#0d1117] p-8 border border-white/5 rounded-3xl">
                        <h4 class="orbitron font-black text-cyan-500 text-[11px] mb-6 uppercase tracking-widest">Client Experience</h4>
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
                        <textarea id="ai-log-display" class="w-full bg-transparent text-slate-300 text-xs h-32 outline-none font-mono" placeholder="Escuchando voz técnica...">${ordenActiva.bitacora_ia || ''}</textarea>
                        <button onclick="window.nexusDictarBitacora()" class="absolute bottom-6 right-6 w-12 h-12 bg-white text-black rounded-full shadow-2xl"><i class="fas fa-microphone"></i></button>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 border border-cyan-500/10 rounded-[3rem] shadow-2xl">
                        <div class="flex justify-between items-start mb-12">
                            <h2 id="total-factura" class="orbitron text-[8rem] font-black text-white italic leading-none">$ 0</h2>
                            <div id="finance-summary" class="w-80"></div>
                        </div>
                        <div id="items-container" class="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scroll"></div>
                        <div class="grid grid-cols-3 gap-4 mt-12">
                            <button onclick="window.agregarDesdeInventario()" class="py-6 border-2 border-cyan-500/50 orbitron text-[10px] font-black text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all rounded-2xl flex flex-col items-center justify-center gap-2"><i class="fas fa-search text-xl"></i> LUPA INVENTARIO</button>
                            <button onclick="window.addItemNexus('REPUESTO')" class="py-6 border-2 border-white/10 orbitron text-[10px] font-black text-white hover:bg-white hover:text-black transition-all rounded-2xl flex flex-col items-center justify-center gap-2"><i class="fas fa-box-open text-xl"></i> REPUESTO EXTERNO</button>
                            <button onclick="window.addItemNexus('MANO_OBRA')" class="py-6 border-2 border-red-600/20 orbitron text-[10px] font-black text-red-600 hover:bg-red-600 hover:text-white transition-all rounded-2xl flex flex-col items-center justify-center gap-2"><i class="fas fa-tools text-xl"></i> AGREGAR LABOR</button>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-6">
                        <div class="bg-black p-6 rounded-3xl border border-white/5"><label class="orbitron text-[9px] text-slate-500 block mb-2 uppercase italic">Insumos (IVA)</label><input id="f-insumos-iva" value="${ordenActiva.insumos || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-white text-4xl font-black w-full outline-none"></div>
                        <div class="bg-black p-6 rounded-3xl border border-white/5"><label class="orbitron text-[9px] text-yellow-500 block mb-2 uppercase italic">Insumos (NO IVA)</label><input id="f-insumos-no-iva" value="${ordenActiva.insumos_no_iva || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-yellow-500 text-4xl font-black w-full outline-none"></div>
                        <div class="bg-black p-6 rounded-3xl border border-white/5"><label class="orbitron text-[9px] text-green-500 block mb-2 uppercase italic">Anticipo</label><input id="f-anticipo" value="${ordenActiva.anticipo || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-green-400 text-4xl font-black w-full outline-none"></div>
                    </div>
                    <button id="btnSincronizar" class="w-full bg-cyan-500 text-black py-10 orbitron font-black text-4xl rounded-[2rem] hover:bg-white transition-all shadow-[0_0_50px_rgba(0,242,255,0.2)]">🛰️ PUSH_TO_NEXUS_CLOUD</button>
                </div>
            </div>
        </div>`;
        renderModuloPricing(document.getElementById('pricing-engine-container'));
        vincularAccionesTerminal();
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

    window.cambiarEstado = async (nuevoEstado) => {
        if(!ordenActiva.id) return;
        try {
            const batch = writeBatch(db);
            batch.update(doc(db, "ordenes", ordenActiva.id), { estado: nuevoEstado, updatedAt: serverTimestamp() });
            await batch.commit();
            hablar(`Fase ${nuevoEstado}`);
        } catch (e) { console.error(e); }
    };

    window.addItemNexus = async (tipo) => {
        let origen = 'TALLER'; let tec = 'INTERNO'; let costo = 0; let venta = 0; let desc = `NUEVO ${tipo}`;
        if (tipo === 'REPUESTO') {
            const { value: res } = await Swal.fire({ title: 'ORIGEN REPUESTO', input: 'select', inputOptions: { 'TALLER': 'Stock Taller', 'CLIENTE': 'Cliente' }, background: '#0d1117', color: '#fff' });
            origen = res || 'TALLER';
        } else {
            const { value: t } = await Swal.fire({ title: 'ESPECIALISTA', input: 'text', background: '#0d1117', color: '#fff' });
            tec = t || 'INTERNO';
            const { value: c } = await Swal.fire({ title: 'COSTO LABOR', input: 'number', background: '#0d1117', color: '#fff' });
            costo = Number(c || 0);
            venta = analizarPrecioSugerido({ tipo: "mano_obra", costo: costo });
            desc = `LABOR: ${tec.toUpperCase()}`;
        }
        ordenActiva.items.push({ tipo, desc, costo, venta, origen, tecnico: tec, cantidad: 1, fecha: new Date().toISOString() });
        hablar(`${tipo} agregado`);
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
            
            // CAPTURA DE DATOS DESDE LA UI
            const tipoOrdenSeleccionado = document.getElementById("f-tipo-orden").value;
            
            const data = {
                ...ordenActiva, 
                id, 
                placa, 
                empresaId,
                tipo_orden: tipoOrdenSeleccionado, // <--- ADN PARA REPORTES.JS
                cliente: document.getElementById("f-cliente").value,
                telefono: document.getElementById("f-telefono").value,
                anticipo: Number(document.getElementById("f-anticipo").value),
                insumos: Number(document.getElementById("f-insumos-iva").value),
                insumos_no_iva: Number(document.getElementById("f-insumos-no-iva").value),
                bitacora_ia: document.getElementById("ai-log-display").value,
                updatedAt: serverTimestamp()
            };

            // 1. Guardar en Colección de Órdenes
            batch.set(doc(db, "ordenes", id), data);

            // 2. Guardar en Contabilidad (Enlazado por Placa y Especialidad)
            batch.set(doc(db, "contabilidad", `CONT_${id}`), { 
                empresaId, 
                placa,
                tipo_orden: tipoOrdenSeleccionado, // <--- CLAVE PARA FILTRAR EBITDA POR ÁREA
                total: data.costos_totales.total || 0, 
                utilidad: data.costos_totales.ebitda || 0, 
                fecha: serverTimestamp() 
            });

            await batch.commit();
            
            ordenActiva.id = id;
            hablar("Nexus Cloud Sincronizado");
            
            Swal.fire({ 
                title: '✅ NEXUS SYNC OK', 
                text: `Orden ${placa} actualizada en la nube`,
                icon: 'success', 
                background: '#0d1117', 
                color: '#fff',
                confirmButtonColor: '#06b6d4'
            });

            document.getElementById("nexus-terminal").classList.add("hidden");

        } catch (e) {
            console.error("Critical Sync Error:", e);
            btn.disabled = false;
            btn.innerHTML = `🛰️ REINTENTAR PUSH_CLOUD`;
            Swal.fire({ title: 'ERROR EN SYNC', text: e.message, icon: 'error', background: '#0d1117', color: '#fff' });
        }
    };

    window.agregarDesdeInventario = async () => {
        try {
            const { getDocs, query, collection, where } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
            const q = query(collection(db, "inventario"), where("empresaId", "==", empresaId));
            const snap = await getDocs(q);
            if (snap.empty) return Swal.fire({ title: "STOCK VACÍO", icon: "warning", background: "#0d1117", color: "#fff" });
            
            const opciones = {};
            snap.forEach(d => { opciones[d.id] = `${d.data().nombre.toUpperCase()} | $${Number(d.data().precioVenta).toLocaleString()}`; });
            const { value: itemId } = await Swal.fire({ title: '🛰️ LUPA NEXUS-X', input: 'select', inputOptions: opciones, background: '#05070a', color: '#fff' });
            
            if (itemId) {
                const itemData = snap.docs.find(d => d.id === itemId).data();
                ordenActiva.items.push({ 
                    tipo: 'REPUESTO', desc: itemData.nombre.toUpperCase(), costo: itemData.precioCosto || 0, 
                    venta: itemData.precioVenta, cantidad: 1, origen: 'TALLER', refId: itemId 
                });
                recalcularFinanzas();
            }
        } catch (e) { console.error("Lupa Error:", e); }
    };

    window.updateItem = (idx, campo, valor) => {
        const val = (campo === 'costo' || campo === 'venta' || campo === 'cantidad') ? Number(valor) : valor;
        ordenActiva.items[idx][campo] = val;
        recalcularFinanzas();
    };

    window.renderItems = () => {
        const cont = document.getElementById("items-container");
        if (!cont) return;
        cont.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="flex flex-col gap-3 bg-white/[0.03] p-5 rounded-2xl border border-white/10 mb-4 relative overflow-hidden group">
                <div class="absolute top-0 left-0 h-full w-1 ${item.tipo === 'REPUESTO' ? 'bg-cyan-500' : 'bg-red-600'}"></div>
                <div class="flex items-center gap-4">
                    <span class="text-[8px] orbitron font-black px-2 py-1 ${item.tipo === 'REPUESTO' ? 'bg-cyan-500 text-black' : 'bg-red-600 text-white'} rounded-sm">${item.tipo}</span>
                    <input onchange="window.updateItem(${idx}, 'desc', this.value)" value="${item.desc}" class="flex-1 bg-transparent text-white font-black orbitron text-xs outline-none uppercase border-b border-transparent focus:border-cyan-500">
                    <button onclick="window.removeItemNexus(${idx})" class="text-slate-500 hover:text-red-500"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div class="grid grid-cols-4 gap-4 items-end">
                    <div><label class="text-[7px] orbitron text-slate-500 block">COSTO UNIT</label><input type="number" onchange="window.updateItem(${idx}, 'costo', this.value)" value="${item.costo}" class="bg-black/50 p-2 text-red-400 text-xs rounded w-full border border-white/5"></div>
                    <div><label class="text-[7px] orbitron text-green-500 block">VENTA</label><input type="number" onchange="window.updateItem(${idx}, 'venta', this.value)" value="${item.venta}" class="bg-black/50 p-2 text-green-400 text-xs rounded w-full border border-white/5"></div>
                    <div><label class="text-[7px] orbitron text-slate-500 block">CANT</label><input type="number" onchange="window.updateItem(${idx}, 'cantidad', this.value)" value="${item.cantidad || 1}" class="bg-black/50 p-2 text-white text-xs rounded w-full border border-white/5"></div>
                    <div class="text-right text-xs font-black orbitron">$${(item.venta * (item.cantidad || 1)).toLocaleString()}</div>
                </div>
            </div>
        `).join('');
    };

    window.removeItemNexus = (idx) => { if(confirm("¿Eliminar?")) { ordenActiva.items.splice(idx, 1); recalcularFinanzas(); } };
    
    const vincularEventosBase = () => { document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus(); };
    
    const vincularAccionesTerminal = () => {
        document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
        document.getElementById("btnSincronizar").onclick = ejecutarSincronizacionTotal;
    };

    window.abrirTerminalNexus = (id = null) => {
        if(id) { getDoc(doc(db, "ordenes", id)).then(s => { ordenActiva = { id, ...s.data() }; renderTerminal(); }); }
        else { ordenActiva = { placa:'', estado:'INGRESO', items:[], anticipo:0, insumos:0, insumos_no_iva:0, bitacora_ia:'' }; renderTerminal(); }
        document.getElementById("nexus-terminal").classList.remove("hidden");
    };

    const cargarEscuchaOrdenes = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const grid = document.getElementById("grid-ordenes");
            if (!grid) return;
            grid.innerHTML = snap.docs.map(d => `
                <div onclick="window.abrirTerminalNexus('${d.id}')" class="bg-[#0d1117] p-8 border border-white/5 rounded-[2.5rem] hover:border-cyan-500 transition-all cursor-pointer group">
                    <h4 class="orbitron text-4xl font-black text-white group-hover:text-cyan-400">${d.data().placa}</h4>
                    <p class="text-[10px] text-slate-500 font-bold uppercase">${d.data().cliente || 'S/N'}</p>
                    <div class="pt-4 border-t border-white/5 flex justify-between items-center">
                        <span class="orbitron text-green-400 font-black">$ ${Math.round(d.data().costos_totales?.total || 0).toLocaleString()}</span>
                        <span class="text-[8px] orbitron bg-red-600/20 text-red-500 px-3 py-1 rounded-full">${d.data().estado}</span>
                    </div>
                </div>`).join('');
        });
    };

    renderBase();
}

