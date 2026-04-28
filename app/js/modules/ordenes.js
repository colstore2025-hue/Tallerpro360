/**
 * ordenes.js - NEXUS-X "THE TITAN" V16.0 🛰️
 * CONSOLIDACIÓN TOTAL: QUANTUM-SAP 2030 TERMINATOR EDITION
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS & GEMINI AI PRO
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, serverTimestamp, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { analizarPrecioSugerido, renderModuloPricing } from "../ai/pricingEnginePRO360.js";

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

    const recalcularFinanzas = () => {
        if (!ordenActiva) return;
        let m = { v_rep: 0, c_rep: 0, v_mo: 0, c_mo: 0 };
        ordenActiva.items.forEach(i => {
            const v = Number(i.venta || 0), c = Number(i.costo || 0), cant = Number(i.cantidad || 1);
            if (i.tipo === 'REPUESTO' && i.origen === 'TALLER') { m.v_rep += (v * cant); m.c_rep += (c * cant); }
            else if (i.tipo === 'MANO_OBRA') { m.v_mo += (v * cant); m.c_mo += (c * cant); }
        });

        const insIVA = Number(document.getElementById("f-insumos-iva")?.value || 0);
        const insNoIVA = Number(document.getElementById("f-insumos-no-iva")?.value || 0);
        const ant = Number(document.getElementById("f-anticipo")?.value || 0);

        const subGrav = m.v_rep + m.v_mo + insIVA;
        const base = subGrav / 1.19;
        const total = subGrav + insNoIVA;
        const utilidad = base - (m.c_rep + m.c_mo + (insIVA / 1.19)) + insNoIVA;

        ordenActiva.costos_totales = { total, base, iva: subGrav - base, saldo: total - ant, ebitda: utilidad };
        actualizarUIFinanciera(total, base, subGrav - base, utilidad, total - ant);
        renderItems();
    };

    const actualizarUIFinanciera = (total, base, iva, ebitda, saldo) => {
        const totalEl = document.getElementById("total-factura");
        const summaryEl = document.getElementById("finance-summary");
        if(totalEl) totalEl.innerText = `$ ${Math.round(total).toLocaleString()}`;
        if(summaryEl) summaryEl.innerHTML = `
            <div class="grid grid-cols-2 gap-4 border-t border-cyan-500/30 pt-6 mt-6">
                <div class="text-[10px] orbitron text-slate-500 uppercase font-black">BASE: <span class="text-white">$${Math.round(base).toLocaleString()}</span></div>
                <div class="text-[10px] orbitron text-slate-500 text-right uppercase font-black">IVA (19%): <span class="text-white">$${Math.round(iva).toLocaleString()}</span></div>
                <div class="text-green-400 font-black text-2xl orbitron italic leading-none">EBITDA: $${Math.round(ebitda).toLocaleString()}</div>
                <div class="text-red-500 font-black text-2xl orbitron text-right italic leading-none font-black">SALDO: $${Math.round(saldo).toLocaleString()}</div>
            </div>`;
    };

        window.enviarNotificacionNexus = (proceso) => {
        const idOrden = ordenActiva.id || "PENDIENTE";
        // CAMBIO ESTRATÉGICO: Apuntamos al motor de renderizado de Vercel que ya validaste
        const linkTrace = `https://tallerpro360.vercel.app/trace?id=${idOrden}`;
        
        // Formateo de Bitácora para impacto visual
        const bitacoraCorta = ordenActiva.bitacora_ia ? `%0A📝 *BITÁCORA:* ${ordenActiva.bitacora_ia.substring(0, 150).toUpperCase()}...` : "";
        const totalFormatted = `$${Math.round(ordenActiva.costos_totales?.total || 0).toLocaleString()}`;
        
        let msj = "";
        if (proceso === 'INGRESO') {
            msj = `🛰️ *NEXUS_X: INGRESO CONFIRMADO*%0A%0AHola *${ordenActiva.cliente}*, recibimos su vehículo *${ordenActiva.placa}*. Hemos iniciado la fase de diagnóstico digital.${bitacoraCorta}%0A%0A🌐 *Siga el progreso en tiempo real aquí:*%0A${linkTrace}`;
        } else if (proceso === 'FINAL') {
            msj = `✅ *NEXUS_X: MISIÓN COMPLETADA*%0A%0AVehículo *${ordenActiva.placa}* se encuentra en zona de entrega.%0A💰 *VALOR TOTAL:* ${totalFormatted}%0A%0A📥 *DESCARGUE SU REPORTE TÉCNICO AQUÍ:*%0A${linkTrace}`;
        } else {
            msj = `🛰️ *NEXUS_X: ACTUALIZACIÓN DE ESTADO*%0A%0AHola *${ordenActiva.cliente}*, la bitácora técnica de su vehículo *${ordenActiva.placa}* tiene nuevas actualizaciones.%0A%0A🌐 *VER DETALLE Y COSTOS:*%0A${linkTrace}`;
        }

        // Validación de número para evitar errores de envío
        const tel = ordenActiva.telefono ? ordenActiva.telefono.replace(/\D/g, '') : "";
        window.open(`https://wa.me/57${tel}?text=${msj}`, '_blank');
    };

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#05070a] min-h-screen text-slate-100 font-sans pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-end gap-6 mb-16 border-b-2 border-red-600 pb-10">
                <div class="space-y-1">
                    <h1 class="orbitron text-7xl font-black italic tracking-tighter text-white uppercase">NEXUS<span class="text-red-600">_X</span></h1>
                    <p class="text-[10px] orbitron text-cyan-400 font-bold tracking-[0.8em] uppercase italic">Automotive Titan Logistics</p>
                </div>
                <button id="btnNewMission" class="px-12 py-5 bg-cyan-500 text-black rounded-none orbitron text-[10px] font-black hover:bg-white transition-all shadow-[10px_10px_0px_rgba(0,242,255,0.3)]">INICIAR MISIÓN +</button>
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
            <div class="flex flex-col lg:flex-row justify-between items-center mb-12 bg-[#0d1117] p-10 border-l-8 border-cyan-500 rounded-r-3xl gap-6">
                <div class="flex items-center gap-6">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-7xl font-black orbitron text-white w-80 uppercase border-2 border-white/5 rounded-xl text-center" placeholder="PLACA">
                    <button onclick="window.nexusEscuchaPlaca()" class="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center animate-pulse"><i class="fas fa-microphone text-xl"></i></button>
                </div>
                <div class="flex flex-col gap-2 bg-black/50 p-4 px-6 rounded-2xl border border-white/5 min-w-[250px]">
                    <span class="orbitron text-[8px] text-slate-500 uppercase font-black">Área Nexus:</span>
                    <select id="f-tipo-orden" class="bg-transparent text-white orbitron font-black text-sm outline-none border-b border-white/10 focus:border-cyan-500">
                        ${Object.entries(NEXUS_ASCENSOR).map(([k,v]) => `<option value="${k}" ${ordenActiva.tipo_orden === k ? 'selected' : ''} class="bg-[#0d1117]">${v.label.toUpperCase()}</option>`).join('')}
                    </select>
                </div>
                <div class="flex items-center gap-4 bg-black/50 p-4 px-6 rounded-2xl border border-white/5">
                    <span class="orbitron text-[9px] text-slate-500 font-black uppercase">Fase Misión:</span>
                    <select id="f-estado" onchange="window.cambiarEstado(this.value)" class="bg-transparent text-cyan-400 orbitron font-black text-xl outline-none">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(e => `<option value="${e}" ${ordenActiva.estado === e ? 'selected' : ''} class="bg-[#0d1117]">${e}</option>`).join('')}
                    </select>
                </div>
                <button id="btnCloseTerminal" class="w-20 h-20 bg-red-600 text-white text-3xl font-black rounded-2xl hover:rotate-90 transition-all">✕</button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-[#0d1117] p-8 border border-white/5 rounded-3xl">
                        <h4 class="orbitron font-black text-cyan-500 text-[11px] mb-6 uppercase">Expediente Cliente</h4>
                        <input id="f-cliente" value="${ordenActiva.cliente || ''}" placeholder="CLIENTE" class="w-full bg-black p-4 mb-4 text-white font-black uppercase text-xs border border-white/10 rounded-xl">
                        <input id="f-telefono" value="${ordenActiva.telefono || ''}" placeholder="WHATSAPP (+57)" class="w-full bg-black p-4 mb-6 text-green-400 font-bold border border-white/10 rounded-xl">
                        <div class="grid grid-cols-3 gap-2">
                            <button onclick="window.enviarNotificacionNexus('INGRESO')" class="py-3 bg-green-600/10 text-green-500 orbitron text-[8px] font-black rounded-lg border border-green-600/20">ENTRY_WA</button>
                            <button onclick="window.enviarNotificacionNexus('UPDATE')" class="py-3 bg-cyan-600/10 text-cyan-500 orbitron text-[8px] font-black rounded-lg border border-cyan-600/20">QUOTE_WA</button>
                            <button onclick="window.enviarNotificacionNexus('FINAL')" class="py-3 bg-red-600/10 text-red-500 orbitron text-[8px] font-black rounded-lg border border-red-600/20">READY_WA</button>
                        </div>
                    </div>
                    <div id="pricing-engine-container" class="bg-white/5 p-8 border border-white/5 rounded-3xl"></div>
                    <div class="bg-black p-8 border border-red-600/20 rounded-3xl relative">
    <textarea id="ai-log-display" 
        oninput="window.syncBitacoraLive(this.value)" 
        class="w-full bg-transparent text-slate-300 text-xs h-32 outline-none font-mono" 
        placeholder="Escuchando voz técnica...">${ordenActiva.bitacora_ia || ''}</textarea>
    <button onclick="window.nexusDictarBitacora()" class="absolute bottom-6 right-6 w-12 h-12 bg-white text-black rounded-full shadow-2xl">
        <i class="fas fa-microphone"></i>
    </button>
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
                            <button onclick="window.agregarDesdeInventario()" class="py-6 border-2 border-cyan-500/50 orbitron text-[10px] font-black text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all rounded-2xl"><i class="fas fa-search text-xl"></i> LUPA STOCK</button>
                            <button onclick="window.addItemNexus('REPUESTO')" class="py-6 border-2 border-white/10 orbitron text-[10px] font-black text-white hover:bg-white hover:text-black transition-all rounded-2xl"><i class="fas fa-box-open text-xl"></i> EXTERNO</button>
                            <button onclick="window.addItemNexus('MANO_OBRA')" class="py-6 border-2 border-red-600/20 orbitron text-[10px] font-black text-red-600 hover:bg-red-600 hover:text-white transition-all rounded-2xl"><i class="fas fa-tools text-xl"></i> LABOR</button>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-6">
                        <div class="bg-black p-6 rounded-3xl border border-white/5"><label class="orbitron text-[9px] text-slate-500 block mb-2 uppercase">Insumos (IVA)</label><input id="f-insumos-iva" value="${ordenActiva.insumos || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-white text-4xl font-black w-full outline-none"></div>
                        <div class="bg-black p-6 rounded-3xl border border-white/5"><label class="orbitron text-[9px] text-yellow-500 block mb-2 uppercase">Insumos (NO IVA)</label><input id="f-insumos-no-iva" value="${ordenActiva.insumos_no_iva || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-yellow-500 text-4xl font-black w-full outline-none"></div>
                        <div class="bg-black p-6 rounded-3xl border border-white/5"><label class="orbitron text-[9px] text-green-500 block mb-2 uppercase font-black">Anticipo</label><input id="f-anticipo" value="${ordenActiva.anticipo || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-green-400 text-4xl font-black w-full outline-none"></div>
                    </div>
                    <button id="btnSincronizar" class="w-full bg-cyan-500 text-black py-10 orbitron font-black text-4xl rounded-[2rem] hover:bg-white transition-all shadow-[0_0_50px_rgba(0,242,255,0.2)]">🛰️ PUSH_TO_NEXUS_CLOUD</button>
                </div>
            </div>
        </div>`;
        renderModuloPricing(document.getElementById('pricing-engine-container'));
        document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
        document.getElementById("btnSincronizar").onclick = ejecutarSincronizacionTotal;
        recalcularFinanzas();
    };

    window.agregarDesdeInventario = async () => {
        try {
            hablar("Buscando en bóveda");
            const q = query(collection(db, "inventario"), where("empresaId", "==", empresaId));
            const snap = await getDocs(q);
            if (snap.empty) return Swal.fire({ title: 'STOCK VACÍO', icon: 'error', background: '#0d1117', color: '#fff' });
            
            const ops = {};
            snap.forEach(d => { ops[d.id] = `${d.data().nombre.toUpperCase()} | STOCK: ${d.data().stock || 0} | $${Number(d.data().precioVenta).toLocaleString()}`; });
            
            const { value: iId } = await Swal.fire({ title: '🛰️ LUPA INVENTARIO', input: 'select', inputOptions: ops, background: '#05070a', color: '#fff', confirmButtonColor: '#06b6d4' });
            if (iId) {
                const it = snap.docs.find(x => x.id === iId).data();
                ordenActiva.items.push({ tipo: 'REPUESTO', desc: it.nombre.toUpperCase(), costo: it.precioCosto || 0, venta: it.precioVenta, cantidad: 1, origen: 'TALLER', refId: iId });
                hablar(`${it.nombre} agregado`);
                recalcularFinanzas();
            }
        } catch (e) { console.error("Sync Error:", e); }
    };

    window.abrirTerminalNexus = (id = null) => {
        if(id) { 
            getDoc(doc(db, "ordenes", id)).then(s => { 
                ordenActiva = { id, ...s.data(), items: s.data().items || [] }; 
                renderTerminal(); 
            }); 
        } else { 
            ordenActiva = { placa:'', estado:'COTIZACION', items:[], anticipo:0, insumos:0, insumos_no_iva:0, bitacora_ia:'', tipo_orden:'MECANICA' }; 
            renderTerminal(); 
        }
        document.getElementById("nexus-terminal").classList.remove("hidden");
    };

    /**
 * 🛰️ EJECUTAR SINCRONIZACIÓN TOTAL - PROTOCOLO TERMINATOR 2030
 * MANIOBRA: Control de Flujo de Caja Real vs Saldo Contable
 */
const ejecutarSincronizacionTotal = async () => {
    const btn = document.getElementById("btnSincronizar");
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-satellite animate-spin"></i> CALCULATING_LOGISTICS...`;

    try {
        const batch = writeBatch(db);
        const placa = document.getElementById("f-placa").value.trim().toUpperCase();
        if (!placa) throw new Error("IDENTIFICADOR_PLACA_REQUERIDO");

        const id = ordenActiva.id || `OT_${placa}_${Date.now()}`;
        const tOrd = document.getElementById("f-tipo-orden").value;
        const estadoActual = document.getElementById("f-estado").value;
        
        // CAPTURA DE VALORES FINANCIEROS
        const vAnticipo = Number(document.getElementById("f-anticipo").value) || 0;
        const vTotalOrden = Number(ordenActiva.costos_totales?.total) || 0;
        const vUtilidadEstimada = Number(ordenActiva.costos_totales?.ebitda) || 0;

        // --- MANIOBRA 1: CONSOLIDACIÓN DE LA MISIÓN (FIREBASE ORDENES) ---
        const dataMision = {
            ...ordenActiva,
            id,
            placa,
            empresaId,
            tipo_orden: tOrd,
            estado: estadoActual,
            cliente: document.getElementById("f-cliente").value.toUpperCase(),
            telefono: document.getElementById("f-telefono").value,
            anticipo: vAnticipo,
            insumos: Number(document.getElementById("f-insumos-iva").value) || 0,
            insumos_no_iva: Number(document.getElementById("f-insumos-no-iva").value) || 0,
            bitacora_ia: document.getElementById("ai-log-display").value,
            updatedAt: serverTimestamp(),
            // Auditoría Forense Integrada
            total: vTotalOrden,
            utilidad_neta: vUtilidadEstimada,
            saldo_pendiente: vTotalOrden - vAnticipo
        };
        batch.set(doc(db, "ordenes", id), dataMision);

        // --- MANIOBRA 2: MOTOR DE CONTABILIDAD SELECTIVA (CASH FLOW REAL) ---
        // Solo inyectamos a contabilidad si hay un movimiento de dinero real.
        const contabilidadRef = doc(db, "contabilidad", `CONT_${id}`);
        
        let montoContable = 0;
        let conceptoContable = "";

        if (estadoActual === 'ENTREGADO') {
            // Si el vehículo se entrega, se registra el ingreso TOTAL (Cierre de Caja)
            montoContable = vTotalOrden;
            conceptoContable = `CIERRE TOTAL SERVICIO: ${placa}`;
        } else if (vAnticipo > 0) {
            // Si está en proceso pero hay dinero, solo registramos el ANTICIPO
            montoContable = vAnticipo;
            conceptoContable = `ANTICIPO RECIBIDO: ${placa}`;
        }

        // Solo escribimos en contabilidad si el monto es mayor a cero para no ensuciar el Libro Diario
        if (montoContable > 0) {
            batch.set(contabilidadRef, {
                empresaId,
                id_referencia: id,
                placa,
                concepto: conceptoContable,
                tipo: "ingreso_ot", // Trigger para esIngreso() en contabilidad.js
                monto: montoContable, 
                utilidad: estadoActual === 'ENTREGADO' ? vUtilidadEstimada : (vUtilidadEstimada * (vAnticipo / vTotalOrden || 0)),
                fecha: serverTimestamp(),
                creadoEn: serverTimestamp()
            });
        }

        await batch.commit();

        // --- MANIOBRA 3: ACTUALIZACIÓN DE UI Y SENSÓRICA ---
        ordenActiva.id = id;
        hablar(estadoActual === 'ENTREGADO' ? "Misión finalizada. Caja cerrada." : "Misión sincronizada.");
        
        Swal.fire({ 
            title: '🛰️ NEXUS_SYNC_OK', 
            text: `LOGÍSTICA ${placa} ACTUALIZADA`,
            icon: 'success', background: '#0d1117', color: '#06b6d4'
        });

        document.getElementById("nexus-terminal").classList.add("hidden");

    } catch (e) {
        console.error("QUANTUM_CORE_FAIL:", e);
        btn.disabled = false;
        btn.innerHTML = `🛰️ PUSH_TO_NEXUS_CLOUD`;
        Swal.fire({ title: '🚨 ERROR', text: e.message, icon: 'error', background: '#0d1117', color: '#f87171' });
    }
};

/**
 * 🏛️ CARGAR ESCUCHA DE ORDENES (GRID DINÁMICO)
 * Optimizada para no saturar memoria y reflejar estados Terminator
 */
const cargarEscuchaOrdenes = () => {
    const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
    
    onSnapshot(q, (snap) => {
        const grid = document.getElementById("grid-ordenes");
        if (!grid) return;

        // Renderizado por fragmentos para máxima velocidad
        grid.innerHTML = snap.docs.map(d => {
            const info = d.data();
            const config = NEXUS_ASCENSOR[info.tipo_orden] || NEXUS_ASCENSOR.MECANICA;
            const saldoColor = info.saldo_pendiente > 0 ? 'text-red-400' : 'text-emerald-400';
            
            return `
            <div onclick="window.abrirTerminalNexus('${d.id}')" 
                 class="bg-[#0d1117] p-8 border border-white/5 rounded-[2.5rem] hover:border-cyan-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] transition-all cursor-pointer group relative overflow-hidden">
                
                <div class="absolute top-4 right-4 flex gap-2">
                    <i class="fas ${config.icon} text-[10px] text-cyan-500 opacity-30"></i>
                </div>

                <div class="mb-6">
                    <h4 class="orbitron text-4xl font-black text-white group-hover:text-cyan-400 transition-colors">${info.placa}</h4>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-widest">${info.cliente || 'OPERACIÓN_ANÓNIMA'}</p>
                </div>

                <div class="space-y-3">
                    <div class="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                        <span class="text-[8px] orbitron text-slate-500 uppercase">Estado</span>
                        <span class="text-[9px] orbitron font-black ${info.estado === 'ENTREGADO' ? 'text-green-400' : 'text-amber-400'}">${info.estado}</span>
                    </div>
                    <div class="flex justify-between items-center px-1">
                        <span class="text-[8px] orbitron text-slate-600 uppercase">Saldo Pendiente</span>
                        <span class="text-[10px] orbitron font-black ${saldoColor}">$${(info.saldo_pendiente || 0).toLocaleString()}</span>
                    </div>
                </div>

                <div class="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                    <span class="text-[8px] orbitron font-black px-3 py-1 rounded-md" 
                          style="background: ${config.color}20; color: ${config.color}">
                        ${config.label.toUpperCase()}
                    </span>
                    <i class="fas fa-chevron-right text-slate-700 group-hover:text-cyan-500 group-hover:translate-x-2 transition-all"></i>
                </div>
            </div>`;
        }).join('');
    });
};

    window.updateItem = (idx, campo, val) => { ordenActiva.items[idx][campo] = (campo==='costo'||campo==='venta'||campo==='cantidad')?Number(val):val; recalcularFinanzas(); };
    window.removeItemNexus = (idx) => { if(confirm("¿Eliminar?")) { ordenActiva.items.splice(idx, 1); recalcularFinanzas(); } };
    window.nexusEscuchaPlaca = () => { if(!recognition) return; recognition.start(); hablar("Placa"); recognition.onresult = (e) => { document.getElementById('f-placa').value = e.results[0][0].transcript.replace(/\s/g, '').toUpperCase(); }; };
    window.nexusDictarBitacora = () => { if(!recognition) return; recognition.start(); hablar("Dicte hallazgo"); recognition.onresult = (e) => { document.getElementById('ai-log-display').value += `\n[${new Date().toLocaleTimeString()}] ${e.results[0][0].transcript.toUpperCase()}`; }; };
    window.cambiarEstado = async (n) => { if(!ordenActiva.id) return; await setDoc(doc(db, "ordenes", ordenActiva.id), { estado: n, updatedAt: serverTimestamp() }, { merge: true }); hablar(`Fase ${n}`); };

    window.addItemNexus = async (tipo) => {
        let origen = 'TALLER', tec = 'INTERNO', costo = 0, venta = 0;
        if (tipo === 'REPUESTO') { const { value: r } = await Swal.fire({ title: 'ORIGEN', input: 'select', inputOptions: { 'TALLER': 'Stock', 'CLIENTE': 'Cliente' }, background: '#0d1117', color: '#fff' }); origen = r || 'TALLER'; }
        else { const { value: c } = await Swal.fire({ title: 'COSTO LABOR', input: 'number', background: '#0d1117', color: '#fff' }); costo = Number(c || 0); venta = analizarPrecioSugerido({ tipo: "mano_obra", costo }); tec = 'TECNICO NEXUS'; }
        ordenActiva.items.push({ tipo, desc: `NUEVO ${tipo}`, costo, venta, origen, tecnico: tec, cantidad: 1, fecha: new Date().toISOString() });
        recalcularFinanzas();
    };

window.syncBitacoraLive = async (val) => {
    ordenActiva.bitacora_ia = val;
    if (ordenActiva.id) {
        const docRef = doc(db, "ordenes", ordenActiva.id);
        await setDoc(docRef, { bitacora_ia: val, updatedAt: serverTimestamp() }, { merge: true });
        // Esto envía el dato a Firestore cada vez que escribes o dictas, sin cerrar la terminal.
    }
};

    window.renderItems = () => {
        const c = document.getElementById("items-container"); if (!c) return;
        c.innerHTML = ordenActiva.items.map((it, i) => `
            <div class="flex flex-col gap-3 bg-white/[0.03] p-5 rounded-2xl border border-white/10 mb-4 relative overflow-hidden group">
                <div class="absolute top-0 left-0 h-full w-1 ${it.tipo === 'REPUESTO' ? 'bg-cyan-500' : 'bg-red-600'}"></div>
                <div class="flex items-center gap-4">
                    <span class="text-[8px] orbitron font-black px-2 py-1 ${it.tipo === 'REPUESTO' ? 'bg-cyan-500 text-black' : 'bg-red-600 text-white'} rounded-sm">${it.tipo}</span>
                    <input onchange="window.updateItem(${i}, 'desc', this.value)" value="${it.desc}" class="flex-1 bg-transparent text-white font-black orbitron text-xs outline-none uppercase">
                    <button onclick="window.removeItemNexus(${i})" class="text-slate-600 hover:text-red-500"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div class="grid grid-cols-4 gap-4 items-end">
                    <div><label class="text-[7px] orbitron text-slate-500 block uppercase">Costo</label><input type="number" onchange="window.updateItem(${i}, 'costo', this.value)" value="${it.costo}" class="bg-black/50 p-2 text-red-400 text-xs rounded w-full border border-white/5 outline-none font-black orbitron"></div>
                    <div><label class="text-[7px] orbitron text-green-500 block uppercase">Venta</label><input type="number" onchange="window.updateItem(${i}, 'venta', this.value)" value="${it.venta}" class="bg-black/50 p-2 text-green-400 text-xs rounded w-full border border-white/5 outline-none font-black orbitron"></div>
                    <div><label class="text-[7px] orbitron text-slate-500 block uppercase font-black">Cant</label><input type="number" onchange="window.updateItem(${i}, 'cantidad', this.value)" value="${it.cantidad || 1}" class="bg-black/50 p-2 text-white text-xs rounded w-full border border-white/5 outline-none font-black orbitron"></div>
                    <div class="text-right text-xs font-black orbitron text-white italic">$${(it.venta * (it.cantidad || 1)).toLocaleString()}</div>
                </div>
            </div>`).join('');
    };

    renderBase();
}
