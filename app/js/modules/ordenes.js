/**
 * ordenes.js - NEXUS-X "THE TITAN" V18.0 🛰️
 * CONSOLIDACIÓN MULTI-MÓDULO: CONTABILIDAD, NÓMINA, INVENTARIO Y CRM
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS & GEMINI AI PRO
 * CERTIFICACIÓN: NIVEL MUNDIAL TallerPRO360
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, 
    setDoc, serverTimestamp, writeBatch, increment 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { analizarPrecioSugerido, renderModuloPricing } from "../ai/pricingEnginePRO360.js";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;

    if (!empresaId) {
        container.innerHTML = `<div class="p-10 orbitron text-red-500 font-black">CRITICAL_ERROR: NULL_EMPRESA_AUTH</div>`;
        return;
    }

    // --- MOTOR DE CÁLCULO ACTUARIAL V18 ---
    const recalcularFinanzas = () => {
        if (!ordenActiva) return;
        let m = { v_rep: 0, c_rep: 0, v_mo: 0, c_mo: 0, c_tec: 0 };

        ordenActiva.items.forEach(i => {
            const v = Number(i.venta || 0);
            const c = Number(i.costo || 0);
            if (i.tipo === 'REPUESTO') {
                if(i.origen === 'TALLER') { m.v_rep += v; m.c_rep += c; }
            } else {
                m.v_mo += v;
                m.c_tec += c; // Costo directo de nómina para el técnico
            }
        });

        const insIVA = Number(document.getElementById("f-insumos-iva")?.value || 0); 
        const insNoIVA = Number(document.getElementById("f-insumos-no-iva")?.value || 0); 
        const ant = Number(document.getElementById("f-anticipo")?.value || 0); 
        
        const subtotalGravado = m.v_rep + m.v_mo + insIVA;
        const base = subtotalGravado / 1.19;
        const iva = subtotalGravado - base;
        const total = subtotalGravado + insNoIVA;
        
        // Utilidad Neta descontando: Costo Repuestos + Nómina Técnicos + Insumos + IVA
        const utilidad = (base + insNoIVA) - (m.c_rep + m.c_tec + (insIVA / 1.19) + insNoIVA);

        ordenActiva.costos_totales = { 
            total, base, iva, ebitda: utilidad,
            saldo: total - ant,
            costo_nomina: m.c_tec,
            costo_repuestos: m.c_rep
        };

        actualizarUIFinanciera(total, base, iva, utilidad, ordenActiva.costos_totales.saldo);
        renderItems();
    };

    const actualizarUIFinanciera = (total, base, iva, ebitda, saldo) => {
        const totalEl = document.getElementById("total-factura");
        const summaryEl = document.getElementById("finance-summary");
        if(totalEl) totalEl.innerText = `$ ${Math.round(total).toLocaleString()}`;
        if(summaryEl) {
            summaryEl.innerHTML = `
                <div class="grid grid-cols-2 gap-4 border-t border-cyan-500/30 pt-6 mt-6">
                    <div class="text-[10px] orbitron text-slate-500">BASE GRAVABLE: <span class="text-white">$${Math.round(base).toLocaleString()}</span></div>
                    <div class="text-[10px] orbitron text-slate-500 text-right">IVA (19%): <span class="text-white">$${Math.round(iva).toLocaleString()}</span></div>
                    <div class="text-cyan-400 font-black text-2xl orbitron italic">EBITDA: $${Math.round(ebitda).toLocaleString()}</div>
                    <div class="text-red-500 font-black text-2xl orbitron text-right">SALDO: $${Math.round(saldo).toLocaleString()}</div>
                </div>`;
        }
    };
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#05070a] min-h-screen text-slate-100 font-sans pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-end gap-6 mb-16 border-b-2 border-red-600 pb-10">
                <div class="animate-in slide-in-from-left duration-700">
                    <h1 class="orbitron text-7xl font-black italic tracking-tighter text-white uppercase">NEXUS<span class="text-red-600">_X</span></h1>
                    <p class="text-[10px] orbitron text-cyan-400 font-bold tracking-[0.8em] uppercase italic">Automotive Titan Logistics | V18.0 SUPREMACY</p>
                </div>
                <button id="btnNewMission" class="px-12 py-5 bg-cyan-500 text-black rounded-none orbitron text-[10px] font-black hover:bg-white transition-all shadow-[10px_10px_0px_rgba(0,242,255,0.2)] uppercase">INICIAR OPERACIÓN +</button>
            </header>
            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl p-6 lg:p-12 overflow-y-auto custom-scroll"></div>
        </div>`;
        vincularEventosBase();
        cargarEscuchaOrdenes();
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1700px] mx-auto pb-40 animate-in zoom-in duration-500">
            <div class="flex flex-col lg:flex-row justify-between items-center mb-12 bg-[#0d1117] p-10 border-l-8 border-red-600 rounded-r-[3rem] gap-8 shadow-2xl">
                <div class="flex items-center gap-8">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-8xl font-black orbitron text-white w-96 uppercase border-b-4 border-cyan-500 rounded-none text-center outline-none" placeholder="PLACA">
                    <div class="flex gap-4">
                        <button onclick="window.nexusEscuchaPlaca()" class="w-20 h-20 bg-cyan-500 text-black rounded-2xl flex items-center justify-center hover:scale-110 transition-all"><i class="fas fa-microphone-alt text-3xl"></i></button>
                        <button onclick="window.nexusCamara()" class="w-20 h-20 bg-white text-black rounded-2xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center"><i class="fas fa-video text-3xl"></i></button>
                    </div>
                </div>
                
                <div class="flex items-center gap-6 bg-black/80 p-6 rounded-3xl border border-white/10">
                    <div class="text-right">
                        <span class="orbitron text-[10px] text-slate-500 block">ESTADO_PROCESO</span>
                        <select id="f-estado" onchange="window.cambiarEstado(this.value)" class="bg-transparent text-cyan-400 orbitron font-black text-2xl outline-none cursor-pointer">
                            ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(e => 
                                `<option value="${e}" ${ordenActiva.estado === e ? 'selected' : ''} class="bg-[#0d1117]">${e}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <button id="btnCloseTerminal" class="w-24 h-24 bg-red-600 text-white text-4xl font-black rounded-3xl hover:bg-white hover:text-black transition-all">✕</button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div class="lg:col-span-4 space-y-8">
                    <div class="bg-[#0d1117] p-10 border border-white/5 rounded-[3rem] shadow-xl">
                        <h4 class="orbitron font-black text-cyan-500 text-[12px] mb-8 uppercase tracking-widest flex items-center gap-3">
                            <span class="w-3 h-3 bg-cyan-500 rounded-full animate-ping"></span> DATOS DE PROPIETARIO
                        </h4>
                        <input id="f-cliente" value="${ordenActiva.cliente || ''}" placeholder="NOMBRE COMPLETO" class="w-full bg-black p-5 mb-4 text-white font-black uppercase text-sm border border-white/10 rounded-2xl outline-none focus:border-cyan-500">
                        <input id="f-telefono" value="${ordenActiva.telefono || ''}" placeholder="WHATSAPP (+57)" class="w-full bg-black p-5 mb-8 text-green-400 font-bold border border-white/10 rounded-2xl outline-none focus:border-green-500">
                        
                        <div class="grid grid-cols-3 gap-3">
                            <button onclick="window.enviarNotificacionNexus('INGRESO')" class="py-4 bg-white/5 text-white orbitron text-[9px] font-black rounded-xl border border-white/10 hover:bg-green-600 transition-all uppercase">Check_In</button>
                            <button onclick="window.enviarNotificacionNexus('REPARACION')" class="py-4 bg-white/5 text-white orbitron text-[9px] font-black rounded-xl border border-white/10 hover:bg-cyan-600 transition-all uppercase">Progress</button>
                            <button onclick="window.enviarNotificacionNexus('FINAL')" class="py-4 bg-white/5 text-white orbitron text-[9px] font-black rounded-xl border border-white/10 hover:bg-red-600 transition-all uppercase">Ready</button>
                        </div>
                    </div>

                    <div id="pricing-engine-container" class="rounded-[3rem] overflow-hidden"></div>

                    <div class="bg-black p-10 border border-red-600/30 rounded-[3.5rem] relative group">
                        <div class="flex justify-between items-center mb-6">
                            <span class="orbitron text-[10px] text-red-500 font-black italic uppercase">Neural_Log (IA Technical Assistant)</span>
                            <i class="fas fa-brain text-red-600 animate-pulse"></i>
                        </div>
                        <textarea id="ai-log-display" class="w-full bg-transparent text-slate-300 text-xs h-40 outline-none font-mono custom-scroll leading-relaxed" placeholder="Aguardando dictado técnico...">${ordenActiva.bitacora_ia || ''}</textarea>
                        <button onclick="window.nexusDictarBitacora()" class="absolute -bottom-4 -right-4 w-16 h-16 bg-white text-black rounded-full shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-110 transition-all"><i class="fas fa-microphone-alt"></i></button>
                    </div>
                </div>
                <div class="lg:col-span-8 space-y-10">
                    <div class="bg-[#0d1117] p-12 border border-white/5 rounded-[4rem] relative shadow-2xl overflow-hidden">
                        <div class="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                            <i class="fas fa-file-invoice-dollar text-[15rem] text-white"></i>
                        </div>
                        <div class="flex justify-between items-start mb-16 relative z-10">
                            <div>
                                <h2 id="total-factura" class="orbitron text-[9rem] font-black text-white italic leading-none tracking-tighter">$ 0</h2>
                                <p class="text-cyan-500 orbitron font-bold text-[11px] mt-6 tracking-[1em] uppercase">Monto Total Liquidado</p>
                            </div>
                            <div id="finance-summary" class="w-96"></div>
                        </div>
                        
                        <div id="items-container" class="space-y-4 max-h-[500px] overflow-y-auto pr-6 custom-scroll relative z-10"></div>
                        
                        <div class="grid grid-cols-2 gap-8 mt-16">
                            <button onclick="window.addItemNexus('REPUESTO')" class="py-8 border-2 border-dashed border-white/20 orbitron text-[11px] font-black text-white hover:border-cyan-500 hover:text-cyan-500 transition-all rounded-3xl uppercase tracking-widest">+ Vincular Repuesto</button>
                            <button onclick="window.addItemNexus('MANO_OBRA')" class="py-8 border-2 border-dashed border-red-600/30 orbitron text-[11px] font-black text-red-500 hover:border-red-600 hover:bg-red-600/5 transition-all rounded-3xl uppercase tracking-widest">+ Vincular Mano Obra</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-8">
                        <div class="bg-black p-8 rounded-[2.5rem] border border-white/10 shadow-xl group hover:border-white transition-all">
                            <label class="orbitron text-[10px] text-slate-500 block mb-4 italic uppercase">Insumos Gravados</label>
                            <input id="f-insumos-iva" value="${ordenActiva.insumos || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-white text-5xl font-black w-full outline-none">
                        </div>
                        <div class="bg-black p-8 rounded-[2.5rem] border border-white/10 shadow-xl group hover:border-yellow-500 transition-all">
                            <label class="orbitron text-[10px] text-yellow-500 block mb-4 italic uppercase">Gastos Terceros (No IVA)</label>
                            <input id="f-insumos-no-iva" value="${ordenActiva.insumos_no_iva || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-yellow-500 text-5xl font-black w-full outline-none">
                        </div>
                        <div class="bg-black p-8 rounded-[2.5rem] border border-white/10 shadow-xl group hover:border-green-500 transition-all">
                            <label class="orbitron text-[10px] text-green-500 block mb-4 italic uppercase">Anticipo Recibido</label>
                            <input id="f-anticipo" value="${ordenActiva.anticipo || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-green-400 text-5xl font-black w-full outline-none">
                        </div>
                    </div>

                    <button id="btnSincronizar" class="w-full bg-red-600 text-white py-12 orbitron font-black text-5xl rounded-[3rem] hover:bg-white hover:text-black transition-all shadow-[0_20px_80px_rgba(220,38,38,0.3)] uppercase italic tracking-tighter">Sincronizar Nexus V18 🛰️</button>
                </div>
            </div>
        </div>`;
        
        renderModuloPricing(document.getElementById('pricing-engine-container'));
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    const ejecutarSincronizacionTotal = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-satellite-dish animate-spin"></i> UPLOADING_TO_CLOUD...`;

        try {
            const batch = writeBatch(db);
            const placa = document.getElementById("f-placa").value.toUpperCase();
            if(!placa) throw new Error("REQUERIDO: PLACA_VEHICULO");
            
            const id = ordenActiva.id || `OT_${placa}_${Date.now()}`;
            const f_total = ordenActiva.costos_totales;

            const payload = {
                ...ordenActiva,
                id, placa, empresaId,
                cliente: document.getElementById("f-cliente").value.toUpperCase(),
                telefono: document.getElementById("f-telefono").value,
                anticipo: Number(document.getElementById("f-anticipo").value),
                insumos: Number(document.getElementById("f-insumos-iva").value),
                insumos_no_iva: Number(document.getElementById("f-insumos-no-iva").value),
                bitacora_ia: document.getElementById("ai-log-display").value,
                updatedAt: serverTimestamp(),
                fecha_orden: ordenActiva.fecha_orden || serverTimestamp()
            };

            // 1. PERSISTENCIA ORDEN
            batch.set(doc(db, "ordenes", id), payload);

            // 2. MODULO CONTABILIDAD (SAP V18)
            batch.set(doc(db, "contabilidad", `TRANS_${id}`), {
                empresaId, placa, monto_total: f_total.total, base_iva: f_total.base,
                valor_iva: f_total.iva, utilidad_estimada: f_total.ebitda,
                tipo: 'INGRESO_TALLER', referencia: id, fecha: serverTimestamp()
            });

            // 3. MODULO NÓMINA / STAFF (Registro de Labor)
            ordenActiva.items.filter(it => it.tipo === 'MANO_OBRA').forEach((labor, lIdx) => {
                batch.set(doc(db, "nomina", `PAY_${id}_${lIdx}`), {
                    empresaId, tecnico: labor.tecnico, monto: labor.costo, 
                    placa, servicio: labor.desc, estado: 'PENDIENTE', fecha: serverTimestamp()
                });
            });

            // 4. MODULO INVENTARIO (Salida de Stock)
            ordenActiva.items.filter(it => it.tipo === 'REPUESTO' && it.origen === 'TALLER').forEach((rep, rIdx) => {
                batch.set(doc(db, "inventario_salidas", `OUT_${id}_${rIdx}`), {
                    empresaId, repuesto: rep.desc, costo: rep.costo, cantidad: 1, 
                    orden_ref: id, fecha: serverTimestamp()
                });
            });

            await batch.commit();
            hablar("Sincronización exitosa. Datos distribuidos en módulos.");
            Swal.fire({ title: 'NEXUS-V18 COMPLETE', text: 'Todos los módulos actualizados.', icon: 'success', background: '#0d1117', color: '#fff' });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (e) {
            console.error(e);
            btn.disabled = false;
            btn.innerHTML = `REINTENTAR SYNC 🛰️`;
            Swal.fire({ title: 'FALLO DE RED', text: e.message, icon: 'error' });
        }
    };

    window.nexusEscuchaPlaca = () => {
        if(!recognition) return;
        recognition.start();
        hablar("Escuchando identificación");
        recognition.onresult = (e) => {
            const txt = e.results[0][0].transcript.replace(/\s/g, '').toUpperCase();
            document.getElementById('f-placa').value = txt;
            hablar(`Placa ${txt} asignada`);
        };
    };

    window.nexusDictarBitacora = () => {
        if(!recognition) return;
        recognition.start();
        hablar("Reporte técnico iniciado");
        recognition.onresult = (e) => {
            const txt = e.results[0][0].transcript;
            const log = document.getElementById('ai-log-display');
            log.value += `\n>> [${new Date().toLocaleTimeString()}] : ${txt.toUpperCase()}`;
            hablar("Capturado.");
        };
    };

    window.nexusCamara = async () => {
        const { value: file } = await Swal.fire({
            title: 'SISTEMA DE EVIDENCIA VISUAL',
            input: 'file',
            inputAttributes: { 'accept': 'image/*', 'capture': 'environment' },
            background: '#0d1117', color: '#fff', confirmButtonText: 'UPLOAD_TO_NEXUS'
        });
        if (file) {
            hablar("Procesando imagen en la nube");
            // Aquí iría el Firebase Storage si se requiere en el futuro
        }
    };

    window.addItemNexus = async (tipo) => {
        let origen = 'TALLER';
        let tec = 'INTERNO';
        let costo = 0;
        
        const { value: desc } = await Swal.fire({ 
            title: `DESCRIPCIÓN ${tipo}`, 
            input: 'text', 
            background: '#0d1117', color: '#fff',
            inputPlaceholder: 'Ej: Kit Arrastre o Cambio Aceite'
        });

        if(!desc) return;

        if(tipo === 'REPUESTO') {
            const { value: res } = await Swal.fire({
                title: 'ORIGEN DEL COMPONENTE',
                input: 'select',
                inputOptions: { 'TALLER': 'Inventario Nexus', 'CLIENTE': 'Suministrado por Cliente' },
                background: '#0d1117', color: '#fff'
            });
            origen = res || 'TALLER';
        } else {
            const { value:t } = await Swal.fire({ title:'TÉCNICO ASIGNADO', input:'text', background:'#0d1117', color:'#fff' });
            tec = (t || 'GENERAL').toUpperCase();
            const { value:c } = await Swal.fire({ title:'VALOR A PAGAR TÉCNICO', input:'number', background:'#0d1117', color:'#fff' });
            costo = Number(c || 0);
        }

        ordenActiva.items.push({ 
            tipo, desc: desc.toUpperCase(), costo, venta: 0, 
            origen, tecnico: tec, fecha_add: Date.now() 
        });
        window.recalcularFinanzas();
    };

    window.renderItems = () => {
        const list = document.getElementById("items-container");
        if(!list) return;
        list.innerHTML = ordenActiva.items.map((it, idx) => `
            <div class="flex items-center gap-6 bg-white/[0.02] p-8 rounded-3xl border ${it.tipo === 'MANO_OBRA' ? 'border-red-600/20' : 'border-cyan-500/10'} hover:bg-white/[0.05] transition-all group">
                <div class="flex-1 grid grid-cols-4 gap-8">
                    <div class="col-span-2">
                        <input onchange="ordenActiva.items[${idx}].desc=this.value.toUpperCase()" value="${it.desc}" class="bg-transparent text-white font-black orbitron text-sm outline-none w-full uppercase">
                        <span class="text-[9px] orbitron ${it.tipo === 'MANO_OBRA' ? 'text-red-500' : 'text-cyan-500'} font-bold uppercase tracking-widest">${it.tipo} | ${it.tecnico} | ${it.origen}</span>
                    </div>
                    <div>
                        <span class="block text-[8px] orbitron text-slate-500 mb-1">COSTO_UNID</span>
                        <input type="number" onchange="ordenActiva.items[${idx}].costo=Number(this.value); recalcularFinanzas()" value="${it.costo}" class="bg-black/50 p-3 text-red-500 font-black text-center orbitron text-xs rounded-xl w-full border border-white/5">
                    </div>
                    <div>
                        <span class="block text-[8px] orbitron text-slate-500 mb-1">PVP_CLIENTE</span>
                        <input type="number" onchange="ordenActiva.items[${idx}].venta=Number(this.value); recalcularFinanzas()" value="${it.venta}" class="bg-black/50 p-3 text-green-400 font-black text-center orbitron text-xs rounded-xl w-full border border-white/5">
                    </div>
                </div>
                <button onclick="ordenActiva.items.splice(${idx},1); recalcularFinanzas()" class="w-12 h-12 bg-white/5 text-slate-500 hover:bg-red-600 hover:text-white rounded-xl transition-all"><i class="fas fa-trash-alt"></i></button>
            </div>`).join('');
    };

    window.enviarNotificacionNexus = (fase) => {
        const url = `https://tallerpro360.web.app/trace/${ordenActiva.id}`;
        let msg = "";
        if(fase==='INGRESO') msg = `🛰️ *NEXUS-X: INGRESO* %0A*${ordenActiva.cliente}*, vehículo *${ordenActiva.placa}* en base. Track: ${url}`;
        if(fase==='REPARACION') msg = `🛠️ *NEXUS-X: TRABAJANDO* %0AEstamos en fase técnica para *${ordenActiva.placa}*. Track: ${url}`;
        if(fase==='FINAL') msg = `✅ *NEXUS-X: LISTO* %0A*${ordenActiva.placa}* superó pruebas. Puede recogerlo. Resumen: ${url}`;
        window.open(`https://wa.me/57${ordenActiva.telefono}?text=${msg}`, '_blank');
    };

    const cargarEscuchaOrdenes = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const grid = document.getElementById("grid-ordenes");
            if (!grid) return;
            grid.innerHTML = snap.docs.map(d => {
                const o = d.data();
                return `
                <div onclick="window.abrirTerminalNexus('${d.id}')" class="bg-[#0d1117] p-10 border border-white/5 rounded-[3rem] hover:border-red-600 transition-all cursor-pointer group shadow-2xl relative overflow-hidden animate-in fade-in duration-500">
                    <div class="absolute -right-4 -top-4 opacity-5 group-hover:opacity-20 transition-all">
                        <i class="fas fa-motorcycle text-9xl text-white"></i>
                    </div>
                    <h4 class="orbitron text-5xl font-black text-white group-hover:text-cyan-400 mb-2">${o.placa}</h4>
                    <p class="text-[10px] text-slate-500 mb-6 font-bold uppercase tracking-[0.3em]">${o.cliente || 'OPERACIÓN_ANÓNIMA'}</p>
                    <div class="pt-6 border-t border-white/10 flex justify-between items-center">
                        <span class="orbitron text-2xl text-green-400 font-black">$ ${Math.round(o.costos_totales?.total || 0).toLocaleString()}</span>
                        <span class="text-[9px] orbitron bg-white/5 text-white border border-white/10 px-4 py-2 rounded-full uppercase italic">${o.estado}</span>
                    </div>
                </div>`;
            }).join('');
        });
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

    const vincularAccionesTerminal = () => {
        document.getElementById("btnSincronizar").onclick = ejecutarSincronizacionTotal;
        document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
    };

    const vincularEventosBase = () => {
        document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus();
    };

    renderBase();
}

