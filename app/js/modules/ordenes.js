/**
 * ordenes.js - NEXUS-X "THE TITAN" V19.0 ULTRA-SURGICAL 🛰️
 * SISTEMA INTEGRADO: CONTABILIDAD + INVENTARIO + NÓMINA + CRM + IA
 * ARQUITECTO: WILLIAM JEFFRY URQUIJO CUBILLOS & GEMINI AI PRO
 * ESTATUS: PRODUCCIÓN FINAL - NO PARCHES.
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, serverTimestamp, writeBatch, increment, limit 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { analizarPrecioSugerido, renderModuloPricing } from "../ai/pricingEnginePRO360.js";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;
    let catalogoProductos = [];

    if (!empresaId) {
        container.innerHTML = `<div class="p-10 orbitron text-red-500 font-black">CRITICAL_AUTH_FAILURE: RE-LOGIN REQUIRED</div>`;
        return;
    }

    // --- 1. CARGA DE CATÁLOGO (EL ASCENSOR DE INVENTARIO) ---
    const refrescarCatalogo = async () => {
        const q = query(collection(db, "productos"), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        catalogoProductos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log("NEXUS_LOG: Catálogo sincronizado", catalogoProductos.length);
    };

    // --- 2. MOTOR DE CÁLCULO ACTUARIAL (BLINDAJE TOTAL) ---
    const recalcularFinanzas = () => {
        if (!ordenActiva) return;
        
        // Inicializamos contadores limpios para evitar el error de la placa FAB345
        let totales = {
            v_rep: 0, c_rep: 0, 
            v_mo: 0, c_mo: 0,
            v_insumos_iva: Number(document.getElementById("f-insumos-iva")?.value || 0),
            v_insumos_no_iva: Number(document.getElementById("f-insumos-no-iva")?.value || 0),
            anticipo: Number(document.getElementById("f-anticipo")?.value || 0)
        };

        ordenActiva.items.forEach(item => {
            const v = Number(item.venta || 0);
            const c = Number(item.costo || 0);
            
            if (item.tipo === 'REPUESTO' && item.origen === 'TALLER') {
                totales.v_rep += v;
                totales.c_rep += c;
            } else if (item.tipo === 'MANO_OBRA') {
                totales.v_mo += v;
                totales.c_mo += c; // Costo técnico (Nómina)
            }
        });

        // Fórmulas de Integridad Contable
        const subtotalGravado = totales.v_rep + totales.v_mo + totales.v_insumos_iva;
        const baseGravable = subtotalGravado / 1.19;
        const valorIva = subtotalGravado - baseGravable;
        const totalFinal = subtotalGravado + totales.v_insumos_no_iva;
        
        // EBITDA REAL: (Base + No IVA) - (Costos Totales)
        const ebitda = (baseGravable + totales.v_insumos_no_iva) - (totales.c_rep + totales.c_mo + (totales.v_insumos_iva / 1.19));

        ordenActiva.costos_totales = { 
            total: totalFinal, 
            base: baseGravable, 
            iva: valorIva, 
            ebitda: ebitda,
            saldo: totalFinal - totales.anticipo,
            costo_directo: totales.c_rep + totales.c_mo
        };

        actualizarTableroFinanciero(ordenActiva.costos_totales);
        renderItems();
    };

    const actualizarTableroFinanciero = (c) => {
        const tEl = document.getElementById("total-factura");
        const sEl = document.getElementById("finance-summary");
        if(tEl) tEl.innerText = `$ ${Math.round(c.total).toLocaleString()}`;
        if(sEl) {
            sEl.innerHTML = `
                <div class="grid grid-cols-2 gap-4 border-t border-cyan-500/30 pt-6 mt-6 animate-pulse">
                    <div class="text-[10px] orbitron text-slate-500">BASE_CONTABLE: <span class="text-white">$${Math.round(c.base).toLocaleString()}</span></div>
                    <div class="text-[10px] orbitron text-slate-500 text-right">IVA_GENERADO: <span class="text-white">$${Math.round(c.iva).toLocaleString()}</span></div>
                    <div class="text-cyan-400 font-black text-3xl orbitron italic">EBITDA: $${Math.round(c.ebitda).toLocaleString()}</div>
                    <div class="text-red-500 font-black text-3xl orbitron text-right">SALDO: $${Math.round(c.saldo).toLocaleString()}</div>
                </div>`;
        }
    };

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#05070a] min-h-screen text-slate-100 font-sans pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-end gap-6 mb-16 border-b-4 border-red-600 pb-10 shadow-[0_20px_50px_rgba(255,0,0,0.1)]">
                <div>
                    <h1 class="orbitron text-8xl font-black italic tracking-tighter text-white">NEXUS<span class="text-red-600">_X</span></h1>
                    <p class="text-[11px] orbitron text-cyan-400 font-bold tracking-[1em] uppercase">TallerPRO360 Integrated Ecosistem</p>
                </div>
                <button id="btnNewMission" class="px-16 py-6 bg-cyan-500 text-black orbitron text-xs font-black hover:bg-white transition-all shadow-[15px_15px_0px_rgba(0,242,255,0.2)]">INICIAR ORDEN +</button>
            </header>
            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl p-6 lg:p-12 overflow-y-auto custom-scroll"></div>
        </div>`;
        vincularEventosBase();
        cargarEscuchaOrdenes();
        refrescarCatalogo();
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1800px] mx-auto pb-40 animate-in zoom-in duration-300">
            <div class="flex flex-col lg:flex-row justify-between items-center mb-12 bg-[#0d1117] p-12 border-l-[12px] border-red-600 rounded-r-[4rem] gap-10">
                <div class="flex items-center gap-10">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-[7rem] font-black orbitron text-white w-[30rem] border-none outline-none text-center uppercase" placeholder="PLACA">
                    <div class="flex flex-col gap-3">
                        <button onclick="window.nexusEscuchaPlaca()" class="w-20 h-20 bg-cyan-500 text-black rounded-3xl hover:scale-110 transition-all shadow-xl"><i class="fas fa-microphone-alt text-3xl"></i></button>
                        <button onclick="window.nexusCamara()" class="w-20 h-20 bg-white text-black rounded-3xl hover:bg-red-600 hover:text-white transition-all shadow-xl"><i class="fas fa-camera text-3xl"></i></button>
                    </div>
                </div>
                <div class="bg-black/50 p-8 rounded-[2rem] border border-white/10 text-center">
                    <label class="orbitron text-slate-500 text-[10px] mb-4 block tracking-widest uppercase italic">Fase Actual del Motor</label>
                    <select id="f-estado" onchange="window.cambiarEstado(this.value)" class="bg-transparent text-cyan-400 orbitron font-black text-4xl outline-none cursor-pointer">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(e => 
                            `<option value="${e}" ${ordenActiva.estado === e ? 'selected' : ''} class="bg-black">${e}</option>`).join('')}
                    </select>
                </div>
                <button id="btnCloseTerminal" class="w-28 h-28 bg-red-600 text-white text-5xl font-black rounded-[2rem] hover:rotate-90 transition-all">✕</button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-16">
                <div class="lg:col-span-4 space-y-10">
                    <div class="bg-[#0d1117] p-12 border border-white/5 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                        <div class="absolute -right-10 -top-10 opacity-5"><i class="fas fa-id-card text-[15rem]"></i></div>
                        <h4 class="orbitron font-black text-cyan-500 text-[12px] mb-10 uppercase tracking-widest flex items-center gap-3">Expediente de Propietario</h4>
                        <input id="f-cliente" value="${ordenActiva.cliente || ''}" placeholder="NOMBRE COMPLETO" class="w-full bg-black p-6 mb-4 text-white font-black uppercase text-sm border border-white/10 rounded-2xl">
                        <input id="f-telefono" value="${ordenActiva.telefono || ''}" placeholder="WHATSAPP (+57)" class="w-full bg-black p-6 mb-10 text-green-400 font-bold border border-white/10 rounded-2xl">
                        
                        <div class="grid grid-cols-1 gap-3">
                            <button onclick="window.enviarNotificacionNexus('INGRESO')" class="py-5 bg-green-600 text-white orbitron text-xs font-black rounded-2xl hover:bg-white hover:text-black transition-all">WHATSAPP_ENTRY_LINK</button>
                        </div>
                    </div>

                    <div id="pricing-engine-container" class="rounded-[3rem] bg-white/5 p-10 border border-white/5">
                        </div>

                    <div class="bg-black p-12 border border-red-600/30 rounded-[4rem] relative shadow-2xl">
                        <span class="orbitron text-[10px] text-red-500 font-black block mb-6 italic">NEURAL_TERMINAL (Bitácora Técnica)</span>
                        <textarea id="ai-log-display" class="w-full bg-transparent text-slate-300 text-xs h-48 outline-none font-mono leading-relaxed" placeholder="Aguardando comandos de voz...">${ordenActiva.bitacora_ia || ''}</textarea>
                        <button onclick="window.nexusDictarBitacora()" class="absolute -bottom-5 -right-5 w-20 h-20 bg-white text-black rounded-full shadow-2xl hover:scale-110 transition-all"><i class="fas fa-headset text-2xl"></i></button>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-10">
                    <div class="bg-[#0d1117] p-16 border border-cyan-500/10 rounded-[5rem] shadow-2xl">
                        <div class="flex justify-between items-center mb-16">
                            <div>
                                <h2 id="total-factura" class="orbitron text-[10rem] font-black text-white italic leading-none tracking-tighter">$ 0</h2>
                                <p class="text-cyan-500 orbitron font-bold text-xs mt-8 tracking-[1.5em] uppercase">TOTAL FACTURACIÓN INTEGRAL</p>
                            </div>
                            <div id="finance-summary" class="w-[450px]"></div>
                        </div>
                        
                        <div id="items-container" class="space-y-6 max-h-[600px] overflow-y-auto pr-8 custom-scroll"></div>
                        
                        <div class="grid grid-cols-2 gap-10 mt-16">
                            <button onclick="window.addItemNexus('REPUESTO')" class="py-10 border-2 border-dashed border-white/10 orbitron text-xs font-black text-white hover:border-cyan-500 transition-all rounded-[2.5rem]">+ VINCULAR PRODUCTO STOCK</button>
                            <button onclick="window.addItemNexus('MANO_OBRA')" class="py-10 border-2 border-dashed border-red-600/20 orbitron text-xs font-black text-red-600 hover:bg-red-600/5 transition-all rounded-[2.5rem]">+ VINCULAR MANO DE OBRA</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-10">
                        <div class="bg-black p-10 rounded-[3rem] border border-white/5 shadow-xl group">
                            <label class="orbitron text-[10px] text-slate-500 block mb-4 uppercase">Insumos (Con IVA)</label>
                            <input id="f-insumos-iva" value="${ordenActiva.insumos || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-white text-6xl font-black w-full outline-none">
                        </div>
                        <div class="bg-black p-10 rounded-[3rem] border border-white/5 shadow-xl group">
                            <label class="orbitron text-[10px] text-yellow-500 block mb-4 uppercase">Externos (Sin IVA)</label>
                            <input id="f-insumos-no-iva" value="${ordenActiva.insumos_no_iva || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-yellow-500 text-6xl font-black w-full outline-none">
                        </div>
                        <div class="bg-black p-10 rounded-[3rem] border border-white/5 shadow-xl group">
                            <label class="orbitron text-[10px] text-green-500 block mb-4 uppercase">Anticipo / Abono</label>
                            <input id="f-anticipo" value="${ordenActiva.anticipo || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-green-400 text-6xl font-black w-full outline-none">
                        </div>
                    </div>

                    <button id="btnSincronizar" class="w-full bg-red-600 text-white py-14 orbitron font-black text-6xl rounded-[4rem] hover:bg-white hover:text-black transition-all shadow-[0_30px_100px_rgba(220,38,38,0.4)] uppercase italic tracking-tighter">SINCRONIZAR TallerPRO360 🛰️</button>
                </div>
            </div>
        </div>`;
        
        // --- INYECCIÓN DE IA A MANO DE OBRA (PILAR 4) ---
        renderModuloPricing(document.getElementById('pricing-engine-container'), (precioSugerido) => {
            const moIdx = ordenActiva.items.findLastIndex(it => it.tipo === 'MANO_OBRA');
            if(moIdx !== -1) {
                ordenActiva.items[moIdx].venta = precioSugerido;
                hablar("Mano de obra actualizada con sugerencia de IA");
                recalcularFinanzas();
            } else {
                Swal.fire('ERROR', 'Primero agrega una línea de Mano de Obra', 'warning');
            }
        });

        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    const ejecutarSincronizacionTotal = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-circle-notch animate-spin"></i> INTEGRADOR_V19_ACTIVE...`;

        try {
            const batch = writeBatch(db);
            const f_placa = document.getElementById("f-placa").value.toUpperCase();
            if(!f_placa) throw new Error("IDENTIFICACIÓN_REQUERIDA");
            
            const id = ordenActiva.id || `OT_${f_placa}_${Date.now()}`;
            const fin = ordenActiva.costos_totales;

            const finalData = {
                ...ordenActiva,
                id, placa: f_placa, empresaId,
                cliente: document.getElementById("f-cliente").value.toUpperCase(),
                telefono: document.getElementById("f-telefono").value,
                updatedAt: serverTimestamp(),
                fecha_orden: ordenActiva.fecha_orden || serverTimestamp()
            };

            // Eslabón 1: Órdenes Maestro
            batch.set(doc(db, "ordenes", id), finalData);

            // Eslabón 2: Contabilidad Integral (Sync con contabilidad.js)
            batch.set(doc(db, "contabilidad", `CONT_${id}`), {
                empresaId, placa: f_placa, total: fin.total, base: fin.base, iva: fin.iva,
                ebitda_estimado: fin.ebitda, categoria: 'SERVICIO_TECNICO',
                estado_pago: fin.saldo <= 0 ? 'PAGADO' : 'PENDIENTE',
                referencia: id, fecha: serverTimestamp(), creadoPor: 'NEXUS_V19'
            });

            // Eslabón 3: Nómina y Staff (Sync con nomina.js)
            ordenActiva.items.filter(it => it.tipo === 'MANO_OBRA').forEach((l, idx) => {
                batch.set(doc(db, "staff_liquidaciones", `LIQ_${id}_${idx}`), {
                    empresaId, tecnico: l.tecnico, valor: l.costo, placa: f_placa,
                    ordenId: id, estado: 'POR_PAGAR', fecha: serverTimestamp()
                });
            });

            // Eslabón 4: Inventario (Salida de Stock Real)
            ordenActiva.items.filter(it => it.tipo === 'REPUESTO' && it.origen === 'TALLER').forEach((r, idx) => {
                batch.set(doc(db, "movimientos_inventario", `MOV_${id}_${idx}`), {
                    empresaId, productoId: r.productoId || 'GENERICO', 
                    cantidad: -1, tipo: 'SALIDA_ORDEN', referencia: id, fecha: serverTimestamp()
                });
            });

            await batch.commit();
            hablar("Sistema sincronizado. Cadena de datos completa.");
            Swal.fire({ title: 'NEXUS INTEGRAL OK', icon: 'success', background: '#0d1117', color: '#fff' });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (e) {
            btn.disabled = false;
            btn.innerHTML = `ERROR EN CADENA - REINTENTAR`;
            Swal.fire('ERROR DE INTEGRIDAD', e.message, 'error');
        }
    };

    window.addItemNexus = async (tipo) => {
        if(tipo === 'REPUESTO') {
            const { value: res } = await Swal.fire({
                title: 'BUSCADOR DE INVENTARIO',
                input: 'select',
                inputOptions: Object.fromEntries(catalogoProductos.map(p => [p.id, `${p.nombre} ($${p.venta.toLocaleString()})`])),
                inputPlaceholder: 'Selecciona producto...',
                showCancelButton: true,
                background: '#0d1117', color: '#fff'
            });

            if(res) {
                const p = catalogoProductos.find(x => x.id === res);
                ordenActiva.items.push({ 
                    tipo, desc: p.nombre.toUpperCase(), costo: p.costo, venta: p.venta, 
                    origen: 'TALLER', productoId: res 
                });
            } else {
                // Opción manual si no está en inventario
                const { value: manual } = await Swal.fire({ title: 'REPUESTO MANUAL', input: 'text', background: '#0d1117', color: '#fff' });
                if(manual) ordenActiva.items.push({ tipo, desc: manual.toUpperCase(), costo: 0, venta: 0, origen: 'CLIENTE' });
            }
        } else {
            const { value: d } = await Swal.fire({ title: 'MANIOBRA / TRABAJO', input: 'text', background: '#0d1117', color: '#fff' });
            if(d) {
                const { value: t } = await Swal.fire({ title: 'TÉCNICO', input: 'text', background: '#0d1117', color: '#fff' });
                ordenActiva.items.push({ tipo, desc: d.toUpperCase(), costo: 0, venta: 0, tecnico: (t || 'PLANTA').toUpperCase() });
            }
        }
        recalcularFinanzas();
    };

    window.renderItems = () => {
        const container = document.getElementById("items-container");
        if(!container) return;
        container.innerHTML = ordenActiva.items.map((it, idx) => `
            <div class="flex items-center gap-8 bg-white/[0.03] p-10 rounded-[2.5rem] border ${it.tipo === 'MANO_OBRA' ? 'border-red-600/30' : 'border-cyan-500/20'} animate-in fade-in slide-in-from-right-4">
                <div class="flex-1 grid grid-cols-4 gap-10">
                    <div class="col-span-2">
                        <input onchange="ordenActiva.items[${idx}].desc=this.value.toUpperCase()" value="${it.desc}" class="bg-transparent text-white font-black orbitron text-lg outline-none w-full border-b border-white/10 pb-2">
                        <span class="text-[9px] orbitron font-black uppercase tracking-widest ${it.tipo === 'MANO_OBRA' ? 'text-red-500' : 'text-cyan-500'}">${it.tipo} | ${it.tecnico || it.origen}</span>
                    </div>
                    <div>
                        <span class="text-[8px] orbitron text-slate-500 block mb-2 uppercase">Costo_Base</span>
                        <input type="number" onchange="ordenActiva.items[${idx}].costo=Number(this.value); recalcularFinanzas()" value="${it.costo}" class="bg-black/50 p-4 text-red-500 font-black text-center orbitron text-sm rounded-2xl w-full">
                    </div>
                    <div>
                        <span class="text-[8px] orbitron text-slate-500 block mb-2 uppercase">Precio_Venta</span>
                        <input type="number" onchange="ordenActiva.items[${idx}].venta=Number(this.value); recalcularFinanzas()" value="${it.venta}" class="bg-black/50 p-4 text-green-400 font-black text-center orbitron text-sm rounded-2xl w-full border border-green-500/20">
                    </div>
                </div>
                <button onclick="ordenActiva.items.splice(${idx},1); recalcularFinanzas()" class="w-16 h-16 bg-white/5 text-slate-600 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-lg"><i class="fas fa-trash-alt text-xl"></i></button>
            </div>`).join('');
    };

    window.nexusEscuchaPlaca = () => {
        if(!recognition) return;
        recognition.start();
        hablar("Escuchando identificación de motor");
        recognition.onresult = (e) => {
            const txt = e.results[0][0].transcript.replace(/\s/g, '').toUpperCase();
            document.getElementById('f-placa').value = txt;
            hablar(`Placa ${txt} fijada.`);
        };
    };

    window.nexusDictarBitacora = () => {
        if(!recognition) return;
        recognition.start();
        hablar("Grabando hallazgos");
        recognition.onresult = (e) => {
            const txt = e.results[0][0].transcript;
            document.getElementById('ai-log-display').value += `\n>> [AUDIT]: ${txt.toUpperCase()}`;
            hablar("Anotado en bitácora.");
        };
    };

    window.abrirTerminalNexus = async (id = null) => {
        if(id) {
            const s = await getDoc(doc(db, "ordenes", id));
            ordenActiva = { id, ...s.data() };
        } else {
            ordenActiva = { placa:'', items:[], cliente:'', telefono:'', estado:'INGRESO', bitacora_ia:'' };
        }
        renderTerminal();
        document.getElementById("nexus-terminal").classList.remove("hidden");
    };

    const cargarEscuchaOrdenes = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), limit(50));
        onSnapshot(q, (snap) => {
            const grid = document.getElementById("grid-ordenes");
            if (!grid) return;
            grid.innerHTML = snap.docs.map(d => {
                const o = d.data();
                return `
                <div onclick="window.abrirTerminalNexus('${d.id}')" class="bg-[#0d1117] p-12 border border-white/5 rounded-[4rem] hover:border-cyan-500 transition-all cursor-pointer group shadow-2xl relative animate-in zoom-in duration-500">
                    <div class="absolute -right-6 -top-6 opacity-5 group-hover:opacity-20 transition-all rotate-12">
                        <i class="fas fa-tools text-[12rem] text-white"></i>
                    </div>
                    <h4 class="orbitron text-6xl font-black text-white group-hover:text-cyan-400 mb-4">${o.placa}</h4>
                    <p class="text-[11px] text-slate-500 mb-8 font-bold uppercase tracking-widest">${o.cliente || 'PROPIETARIO_NEXUS'}</p>
                    <div class="pt-8 border-t border-white/10 flex justify-between items-center">
                        <span class="orbitron text-3xl text-green-400 font-black">$ ${Math.round(o.costos_totales?.total || 0).toLocaleString()}</span>
                        <div class="flex items-center gap-3">
                            <span class="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
                            <span class="text-[10px] orbitron text-white uppercase italic">${o.estado}</span>
                        </div>
                    </div>
                </div>`;
            }).join('');
        });
    };

    const vincularAccionesTerminal = () => {
        document.getElementById("btnSincronizar").onclick = ejecutarSincronizacionTotal;
        document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
        window.recalcularFinanzas = recalcularFinanzas;
        window.enviarNotificacionNexus = (f) => {
            const url = `https://tallerpro360.web.app/trace/${ordenActiva.id}`;
            const msg = `🛰️ *NEXUS-X* %0A*${ordenActiva.cliente}*, su vehiculo *${ordenActiva.placa}* esta en fase: *${f}*. Trace: ${url}`;
            window.open(`https://wa.me/57${ordenActiva.telefono}?text=${msg}`, '_blank');
        };
    };

    const vincularEventosBase = () => {
        document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus();
    };

    renderBase();
}

