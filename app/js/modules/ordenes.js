/**
 * TallerPRO360 - V20.0 QUANTUM-SAP 🛰️
 * RELOJ SUIZO DE PRECISIÓN INTEGRAL
 * ARQUITECTO: WILLIAM JEFFRY URQUIJO CUBILLOS & GEMINI AI PRO
 * ESTATUS: PRODUCCIÓN FINAL - INTEGRIDAD TOTAL.
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, updateDoc, serverTimestamp, writeBatch, increment, limit 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { analizarPrecioSugerido, renderModuloPricing } from "../ai/pricingEnginePRO360.js";

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;

    // --- 1. MOTOR DE BÚSQUEDA QUANTUM (INVENTARIO SERVICE) ---
    const buscarStockReal = async (termino) => {
        if (!termino || termino.length < 3) return [];
        const q = query(
            collection(db, "productos"), 
            where("empresaId", "==", empresaId),
            where("nombre", ">=", termino.toUpperCase()),
            where("nombre", "<=", termino.toUpperCase() + "\uf8ff"),
            limit(10)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    // --- 2. CÁLCULO DE PRECISIÓN SUIZA (EBITDA & TAXES) ---
    const ejecutarCalculoQuantum = () => {
        if (!ordenActiva) return;

        let res = {
            v_items: 0, // Lo que suma al cliente
            c_items: 0, // Costo de repuestos/servicios externos
            g_operativo: Number(document.getElementById("f-insumos-gastos")?.value || 0), // Insumos taller
            anticipo: Number(document.getElementById("f-anticipo")?.value || 0)
        };

        ordenActiva.items.forEach(it => {
            res.v_items += Number(it.venta || 0);
            res.c_items += Number(it.costo || 0);
        });

        // Fórmulas SAP para Integridad Contable
        const subtotal = res.v_items;
        const base = subtotal / 1.19;
        const iva = subtotal - base;
        const totalFinal = subtotal;
        
        // EBITDA REAL = (Base Gravable) - (Costos Directos) - (Gastos Insumos Operativos)
        const ebitda = base - (res.c_items) - res.g_operativo;

        ordenActiva.finanzas = {
            total: totalFinal,
            base: base,
            iva: iva,
            ebitda: ebitda,
            saldo: totalFinal - res.anticipo,
            costos_base: res.c_items + res.g_operativo
        };

        actualizarUIFinanciera();
        renderItems();
    };

    const actualizarUIFinanciera = () => {
        const display = document.getElementById("display-total-quantum");
        const panel = document.getElementById("quantum-summary-panel");
        if(display) display.innerText = `$ ${Math.round(ordenActiva.finanzas.total).toLocaleString()}`;
        if(panel) {
            panel.innerHTML = `
                <div class="grid grid-cols-2 gap-4 animate-pulse">
                    <div class="text-[9px] orbitron text-slate-500">EBITDA_ESTIMADO: <span class="text-cyan-400 font-black">$${Math.round(ordenActiva.finanzas.ebitda).toLocaleString()}</span></div>
                    <div class="text-[9px] orbitron text-slate-500 text-right">IVA_19%: <span class="text-white">$${Math.round(ordenActiva.finanzas.iva).toLocaleString()}</span></div>
                    <div class="col-span-2 h-[2px] bg-red-600/30 my-2"></div>
                    <div class="text-2xl orbitron font-black text-red-500 uppercase italic">Saldo Pendiente: $${Math.round(ordenActiva.finanzas.saldo).toLocaleString()}</div>
                </div>`;
        }
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1900px] mx-auto p-8 animate-in fade-in duration-500 pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-center bg-[#0a0f18] p-10 rounded-[3.5rem] border-l-[15px] border-red-600 shadow-2xl gap-10 mb-10">
                <div class="flex items-center gap-12">
                    <div class="relative">
                        <input id="f-placa" value="${ordenActiva.placa}" class="bg-transparent text-[8rem] font-black orbitron text-white w-[35rem] uppercase outline-none leading-none" placeholder="PLACA">
                        <div class="absolute -bottom-4 left-0 flex gap-4">
                            <button onclick="window.quantumVozPlaca()" class="bg-cyan-500 p-3 rounded-xl text-black hover:scale-110 transition-all"><i class="fas fa-microphone-alt"></i></button>
                            <span class="text-[10px] orbitron text-cyan-400 font-bold tracking-widest uppercase">Nexus_Voice_Active</span>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col items-center">
                    <label class="text-[9px] orbitron text-slate-500 mb-2 uppercase tracking-widest">Estado del Proceso</label>
                    <select id="f-estado" onchange="window.cambiarEstadoQuantum(this.value)" class="bg-black text-white orbitron font-black text-3xl p-4 rounded-3xl border border-red-600/30 outline-none">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO_LIQUIDADO'].map(e => 
                            `<option value="${e}" ${ordenActiva.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
                    </select>
                    <p class="text-[8px] text-red-500 mt-2 font-bold italic">Seleccione CANCELADO_LIQUIDADO para retirar de la parrilla</p>
                </div>

                <div class="flex gap-6">
                    <button id="btnSincronizarQuantum" class="px-14 py-8 bg-red-600 text-white orbitron font-black text-xl rounded-full hover:bg-white hover:text-black transition-all shadow-[0_0_50px_rgba(220,38,38,0.3)]">SINCRONIZAR_SAP 🛰️</button>
                    <button id="btnCloseTerminal" class="w-24 h-24 bg-white/5 text-white text-4xl rounded-full hover:rotate-90 transition-all">✕</button>
                </div>
            </header>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <aside class="lg:col-span-4 space-y-8">
                    <div class="bg-[#0a0f18] p-10 rounded-[4rem] border border-white/5 shadow-2xl">
                        <h4 class="orbitron text-cyan-500 text-[10px] font-black mb-8 uppercase tracking-widest italic">Data Maestra (Vehículo & Cliente)</h4>
                        <div class="space-y-4">
                            <input id="f-cliente" value="${ordenActiva.cliente || ''}" placeholder="NOMBRE O RAZÓN SOCIAL" class="w-full bg-black/50 p-6 rounded-2xl text-white font-bold uppercase border border-white/5">
                            <input id="f-identificacion" value="${ordenActiva.identificacion || ''}" placeholder="NIT / CÉDULA" class="w-full bg-black/50 p-6 rounded-2xl text-white font-bold border border-white/5">
                            <div class="grid grid-cols-2 gap-4">
                                <input id="f-telefono" value="${ordenActiva.telefono || ''}" placeholder="WHATSAPP" class="bg-black/50 p-6 rounded-2xl text-green-400 font-bold border border-white/5">
                                <input id="f-kilometraje" value="${ordenActiva.kilometraje || ''}" placeholder="KILOMETRAJE" class="bg-black/50 p-6 rounded-2xl text-yellow-500 font-bold border border-white/5">
                            </div>
                        </div>
                    </div>

                    <div id="ai-pricing-slot" class="rounded-[4rem] overflow-hidden"></div>

                    <div class="bg-black p-10 rounded-[4rem] border border-red-600/20 relative shadow-inner">
                        <label class="orbitron text-[9px] text-red-500 block mb-4 italic">BITÁCORA TÉCNICA (NEURAL LOG)</label>
                        <textarea id="f-bitacora" class="w-full bg-transparent h-60 text-xs text-slate-300 font-mono outline-none leading-relaxed" placeholder="Dictar hallazgos técnicos...">${ordenActiva.bitacora || ''}</textarea>
                        <button onclick="window.quantumVozBitacora()" class="absolute bottom-6 right-6 w-16 h-16 bg-white text-black rounded-full shadow-2xl hover:scale-110 transition-all"><i class="fas fa-headset"></i></button>
                    </div>
                </aside>

                <main class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0a0f18] p-12 rounded-[5rem] border border-white/5">
                        <div class="flex justify-between items-end mb-12 border-b border-white/5 pb-10">
                            <div>
                                <h2 id="display-total-quantum" class="text-[11rem] font-black orbitron text-white leading-none tracking-tighter italic">$ 0</h2>
                                <p class="text-cyan-500 orbitron font-bold text-xs mt-6 tracking-[1.5em] uppercase">Total Facturación Quantum</p>
                            </div>
                            <div id="quantum-summary-panel" class="w-[400px]"></div>
                        </div>

                        <div id="items-wrapper" class="space-y-4 max-h-[600px] overflow-y-auto pr-6 custom-scroll"></div>

                        <div class="grid grid-cols-3 gap-6 mt-12">
                            <button onclick="window.quantumAddItem('REPUESTO')" class="py-10 border-2 border-dashed border-cyan-500/30 rounded-[3rem] text-cyan-500 orbitron text-[10px] font-black hover:bg-cyan-500/5 transition-all">SINC_STOCK_INV</button>
                            <button onclick="window.quantumAddItem('SERVICIO_EXTERNO')" class="py-10 border-2 border-dashed border-yellow-500/30 rounded-[3rem] text-yellow-500 orbitron text-[10px] font-black hover:bg-yellow-500/5 transition-all">GASTO_TERCERO (TORNO)</button>
                            <button onclick="window.quantumAddItem('MANO_OBRA')" class="py-10 border-2 border-dashed border-red-500/30 rounded-[3rem] text-red-500 orbitron text-[10px] font-black hover:bg-red-500/5 transition-all">MANO_OBRA_CERT</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-10">
                        <div class="bg-black/80 p-10 rounded-[3.5rem] border border-white/5">
                            <span class="orbitron text-[9px] text-slate-500 block mb-4 uppercase">Insumos Operativos (Gasto Taller)</span>
                            <input id="f-insumos-gastos" type="number" value="${ordenActiva.insumos_gastos || 0}" onchange="window.quantumRecalcular()" class="bg-transparent text-6xl font-black text-red-500 w-full outline-none">
                        </div>
                        <div class="bg-black/80 p-10 rounded-[3.5rem] border border-white/5">
                            <span class="orbitron text-[9px] text-green-500 block mb-4 uppercase">Anticipo de Cliente</span>
                            <input id="f-anticipo" type="number" value="${ordenActiva.anticipo || 0}" onchange="window.quantumRecalcular()" class="bg-transparent text-6xl font-black text-green-400 w-full outline-none">
                        </div>
                    </div>
                </main>
            </div>
        </div>`;
        
        vincularEventosQuantum();
        ejecutarCalculoQuantum();
    };

    const sincronizarQuantumSAP = async () => {
        const btn = document.getElementById("btnSincronizarQuantum");
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-sync animate-spin"></i> PROPAGANDO_DATA_SAP...`;

        try {
            const batch = writeBatch(db);
            const placa = document.getElementById("f-placa").value.toUpperCase();
            if(!placa) throw new Error("PLACA_REQUERIDA");

            const id = ordenActiva.id || `OT_${placa}_${Date.now()}`;
            const fin = ordenActiva.finanzas;

            const finalData = {
                ...ordenActiva,
                id, placa, empresaId,
                cliente: document.getElementById("f-cliente").value.toUpperCase(),
                identificacion: document.getElementById("f-identificacion").value,
                telefono: document.getElementById("f-telefono").value,
                kilometraje: document.getElementById("f-kilometraje").value,
                bitacora: document.getElementById("f-bitacora").value,
                insumos_gastos: Number(document.getElementById("f-insumos-gastos").value),
                anticipo: Number(document.getElementById("f-anticipo").value),
                estado: document.getElementById("f-estado").value,
                updatedAt: serverTimestamp(),
                fecha_orden: ordenActiva.fecha_orden || serverTimestamp()
            };

            // 1. Persistencia Maestra
            batch.set(doc(db, "ordenes", id), finalData);

            // 2. Puente Contable Profesional (Eslabón SAP)
            batch.set(doc(db, "contabilidad", `CONT_${id}`), {
                empresaId, placa, total: fin.total, base: fin.base, iva: fin.iva,
                ebitda: fin.ebitda, categoria: 'SERVICIO_TECNICO',
                referencia: id, fecha: serverTimestamp(), 
                estado_contable: finalData.estado === 'CANCELADO_LIQUIDADO' ? 'LIQUIDADO_PARCIAL' : 'PENDIENTE'
            });

            // 3. WhatsApp Harley-Davidson Edition
            if(finalData.telefono) {
                const urlTrace = `https://tallerpro360.web.app/trace/${id}`;
                const msg = `🛠️ *NEXUS_X: SAP_REPORT*%0A*${finalData.cliente}*, su vehiculo *${placa}* está en fase: *${finalData.estado}*.%0A%0A*Vea el progreso oficial aquí:*%0A${urlTrace}`;
                window.open(`https://wa.me/57${finalData.telefono}?text=${msg}`, '_blank');
            }

            await batch.commit();
            hablar("Sincronización Quantum completada.");
            Swal.fire({ title: 'QUANTUM SAP OK', text: 'Eslabones de cadena sincronizados', icon: 'success', background: '#0a0f18', color: '#fff' });
            document.getElementById("nexus-terminal").classList.add("hidden");

        } catch (e) {
            btn.disabled = false;
            btn.innerText = "REINTENTAR SINCRONIZACIÓN";
            Swal.fire('ERROR DE INTEGRIDAD', e.message, 'error');
        }
    };

    window.quantumAddItem = async (tipo) => {
        if(tipo === 'REPUESTO') {
            const { value: res } = await Swal.fire({ 
                title: 'NEXUS STOCK SEARCH', 
                input: 'text', 
                inputPlaceholder: 'Nombre del repuesto...', 
                background: '#0a0f18', color: '#fff',
                showCancelButton: true
            });
            if(res) {
                const productos = await buscarStockReal(res);
                if(productos.length > 0) {
                    const options = Object.fromEntries(productos.map(p => [p.id, `${p.nombre} (Stock: ${p.stock})`]));
                    const { value: selId } = await Swal.fire({ title: 'VINCULAR PRODUCTO', input: 'select', inputOptions: options, background: '#0a0f18', color: '#fff' });
                    if(selId) {
                        const p = productos.find(x => x.id === selId);
                        ordenActiva.items.push({ tipo, desc: p.nombre, costo: p.costo, venta: p.venta, productoId: selId });
                    }
                } else {
                    Swal.fire('SIN STOCK', 'No se encontró en inventario.js', 'warning');
                }
            }
        } else if(tipo === 'SERVICIO_EXTERNO') {
            const { value: d } = await Swal.fire({ title: 'GASTO TERCERO (TORNO/EXTERNO)', input: 'text', background: '#0a0f18', color: '#fff' });
            if(d) {
                const { value: c } = await Swal.fire({ title: 'COSTO (LO QUE PAGAS)', input: 'number', background: '#0a0f18', color: '#fff' });
                const { value: v } = await Swal.fire({ title: 'VENTA (LO QUE COBRAS)', input: 'number', background: '#0a0f18', color: '#fff' });
                ordenActiva.items.push({ tipo, desc: d.toUpperCase(), costo: Number(c), venta: Number(v) });
            }
        } else {
            ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: 'MANO DE OBRA ESPECIALIZADA', costo: 0, venta: 0 });
        }
        ejecutarCalculoQuantum();
    };

    window.quantumVozPlaca = () => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.interimResults = false;
        recognition.lang = 'es-CO';
        hablar("Dictar placa ahora");
        recognition.start();
        recognition.onresult = (e) => {
            const txt = e.results[0][0].transcript.replace(/\s/g, '').toUpperCase();
            if(txt.length >= 5) {
                document.getElementById('f-placa').value = txt;
                hablar(`Placa ${txt} detectada`);
            }
        };
    };

    // --- REFINAMIENTO DE RENDER DE ITEMS ---
    window.renderItems = () => {
        const wrapper = document.getElementById("items-wrapper");
        if(!wrapper) return;
        wrapper.innerHTML = ordenActiva.items.map((it, idx) => `
            <div class="flex items-center gap-6 bg-white/[0.03] p-6 rounded-3xl border border-white/5 hover:border-red-600/30 transition-all">
                <div class="flex-1 grid grid-cols-4 gap-6">
                    <div class="col-span-2">
                        <span class="text-[8px] orbitron font-black ${it.tipo === 'MANO_OBRA' ? 'text-red-500' : 'text-cyan-500'} uppercase">${it.tipo}</span>
                        <input onchange="ordenActiva.items[${idx}].desc=this.value.toUpperCase()" value="${it.desc}" class="bg-transparent text-white font-bold w-full outline-none border-b border-white/10 pb-1">
                    </div>
                    <div>
                        <span class="text-[8px] orbitron text-slate-500 block mb-1">COSTO_UN</span>
                        <input type="number" onchange="ordenActiva.items[${idx}].costo=Number(this.value); window.quantumRecalcular()" value="${it.costo}" class="bg-black/50 p-2 text-red-500 font-black text-center rounded-xl w-full">
                    </div>
                    <div>
                        <span class="text-[8px] orbitron text-slate-500 block mb-1">VENTA_UN</span>
                        <input type="number" onchange="ordenActiva.items[${idx}].venta=Number(this.value); window.quantumRecalcular()" value="${it.venta}" class="bg-black/50 p-2 text-green-400 font-black text-center rounded-xl w-full border border-green-500/20">
                    </div>
                </div>
                <button onclick="ordenActiva.items.splice(${idx},1); window.quantumRecalcular()" class="w-12 h-12 bg-red-600/10 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all">✕</button>
            </div>`).join('');
    };

    window.quantumRecalcular = ejecutarCalculoQuantum;
    const vincularEventosQuantum = () => {
        document.getElementById("btnSincronizarQuantum").onclick = sincronizarQuantumSAP;
        document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
        
        renderModuloPricing(document.getElementById('ai-pricing-slot'), (precioSugerido) => {
            const moIdx = ordenActiva.items.findLastIndex(it => it.tipo === 'MANO_OBRA');
            if(moIdx !== -1) {
                ordenActiva.items[moIdx].venta = precioSugerido;
                hablar("IA pricing aplicado a mano de obra");
                ejecutarCalculoQuantum();
            }
        });
    };

    // --- RENDER BASE Y ESCUCHA DE PARRILLA ---
    // (Aquí va tu lógica de renderBase del script v16 con onSnapshot)
    // Asegúrate de filtrar en el onSnapshot: where("estado", "!=", "CANCELADO_LIQUIDADO") 
    // para que la parrilla principal esté siempre limpia.
}
