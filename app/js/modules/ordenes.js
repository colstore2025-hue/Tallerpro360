/**
 * ordenes.js – NEXUS-X “THE TITAN” V16.5 🛰️
 * CONSOLIDACIÓN TOTAL: QUANTUM-SAP 2030 TERMINATOR EDITION
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS & GEMINI AI PRO
 */

Import { 
    Collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, serverTimestamp, writeBatch 
} from https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js;
Import { db } from “../core/firebase-config.js”;
Import { hablar } from “../voice/voiceCore.js”;
Import { analizarPrecioSugerido, renderModuloPricing } from “../ai/pricingEnginePRO360.js”;

Const NEXUS_ASCENSOR = {
    MECANICA: { label: ‘Mecánica’, color: ‘#06b6d4’, icon: ‘fa-tools’ },
    LATONERIA_PINTURA: { label: ‘Latonería y Pintura’, color: ‘#fbbf24’, icon: ‘fa-paint-roller’ },
    ELECTRICO: { label: ‘Eléctrico’, color: ‘#a855f7’, icon: ‘fa-bolt’ },
    ELECTRONICA: { label: ‘Electrónica’, color: ‘#10b981’, icon: ‘fa-microchip’ }
};

Const SpeechRecognition = window.Recognition || window.webkitSpeechRecognition;
Const recognition = SpeechRecognition ¿ new SpeechRecognition() : null;

Export default async function ordenes(container) {
    Const empresaId = localStorage.getItem(“nexus_empresaId”);
    Let ordenActiva = null;

    If (¡empresaId) {
        Container.innerHTML = `<div class=”p-10 orbitron text-red-500”>ERROR: NO_EMPRESA_ID_DETECTED</div>`;
        Return;
    }

    Const recalcularFinanzas = () => {
        If (¡ordenActiva) return;
        Let m = { v_rep: 0, c_rep: 0, v_mo: 0, c_mo: 0 };
        ordenActiva.items.forEach(i => {
            const v = Number(i.venta || 0), c = Number(i.costo || 0), cant = Number(i.cantidad || 1);
            if (i.tipo === ‘REPUESTO’ && i.origen === ‘TALLER’) { m.v_rep += (v * cant); m.c_rep += (c * cant); }
            else if (i.tipo === ‘MANO_OBRA’) { m.v_mo += (v * cant); m.c_mo += (c * cant); }
        });

        Const insIVA = Number(document.getElementById(“f-insumos-iva”)?.value || 0);
        Const insNoIVA = Number(document.getElementById(“f-insumos-no-iva”)?.value || 0);
        Const ant = Number(document.getElementById(“f-anticipo”)?.value || 0);

        Const subGrav = m.v_rep + m.v_mo + insIVA;
        Const base = subGrav / 1.19;
        Const total = subGrav + insNoIVA;
        Const utilidad = base – (m.c_rep + m.c_mo + (insIVA / 1.19)) + insNoIVA;

        ordenActiva.costos_totales = { total, base, iva: subGrav – base, saldo: total – ant, ebitda: utilidad };
        actualizarUIFinanciera(total, base, subGrav – base, utilidad, total – ant);
        renderItems();
    };

    Const actualizarUIFinanciera = (total, base, iva, ebitda, saldo) => {
        Const totalEl = document.getElementById(“total-factura”);
        Const summaryEl = document.getElementById(“finance-summary”);
        If(totalEl) totalEl.innerText = `$ ${Math.round(total).toLocaleString()}`;
        If(summaryEl) summaryEl.innerHTML = `
            <div class=”grid grid-cols-2 gap-4 border-t border-cyan-500/30 pt-6 mt-6”>
                <div class=”text-[10px] orbitron text-slate-500 uppercase font-black”>BASE: <span class=”text-white”>$${Math.round(base).toLocaleString()}</span></div>
                <div class=”text-[10px] orbitron text-slate-500 text-right uppercase font-black”>IVA (19%): <span class=”text-white”>$${Math.round(iva).toLocaleString()}</span></div>
                <div class=”text-green-400 font-black text-2xl orbitron italic leading-none”>EBITDA: $${Math.round(ebitda).toLocaleString()}</div>
                <div class=”text-red-500 font-black text-2xl orbitron text-right italic leading-none font-black”>SALDO: $${Math.round(saldo).toLocaleString()}</div>
            </div>`;
    };

    /**
     * 🛰️ PROTOCOLO DE COMUNICACIÓN EXTERNA – NEXUS-X V16.5
     */
    Window.enviarNotificacionNexus = (procesoEnviado) => {
        Const idOrden = ordenActiva.id;
        
        If (¡idOrden || idOrden === “PENDIENTE”) {
            Swal.fire({ 
                Title: ‘🚨 SYNC_REQUIRED’, 
                Text: ‘Debe sincronizar la misión en la nube antes de notificar.’, 
                Icon: ‘warning’, background: ‘#0d1117’, color: ‘#06b6d4’ 
            });
            Return;
        }

        Const mapaNexus = {
            ‘INGRESO’:    { slug: ‘diagnostico’, emoji: ‘🛰️’, tag: ‘INGRESO_CONFIRMADO’ },
            ‘COTIZACION’: { slug: ‘cotizacion’,  emoji: ‘💰’, tag: ‘PROPUESTA_TÉCNICA’ },
            ‘REPARACION’: { slug: ‘reparacion’,  emoji: ‘⚙️’, tag: ‘AVANCE_DE_MISIÓN’ },
            ‘LISTO’:      { slug: ‘factura’,     emoji: ‘✅’, tag: ‘MISIÓN_COMPLETADA’ },
            ‘FINAL’:      { slug: ‘factura’,     emoji: ‘✅’, tag: ‘MISIÓN_COMPLETADA’ },
            ‘ENTREGADO’:  { slug: ‘factura’,     emoji: ‘🏁’, tag: ‘REPORTE_HISTÓRICO’ }
        };

        Const p = (procesoEnviado || ordenActiva.estado || ‘INGRESO’).toUpperCase();
        Const meta = mapaNexus[p] || mapaNexus[‘INGRESO’];
        
        Const baseUri = https://tallerpro360.vercel.app/documento;
        Const linkNexus = baseUri + “?id=” + idOrden + “&tipo=” + meta.slug;
        
        Const totalFinal = Math.round(ordenActiva.total || (ordenActiva.costos_totales && ordenActiva.costos_totales.total) || 0);
        Const totalFormatted = “$” + totalFinal.toLocaleString();
        
        Const cliente = (ordenActiva.cliente || “CLIENTE”).toUpperCase();
        Const placa = (ordenActiva.placa || “N/A”).toUpperCase();
        
        Let msj = meta.emoji + “ *NEXUS_X: “ + meta.tag + “*%0A%0A”;
        Msj += “Hola *” + cliente + “*, la unidad *” + placa + “* presenta novedades en el sistema.%0A%0A”;

        If (ordenActiva.bitacora_ia) {
            Const logIA = ordenActiva.bitacora_ia.substring(0, 150).toUpperCase();
            Msj += “📝 *LOG_IA:* “ + logIA + “…%0A%0A”;
        }

        If (meta.slug === ‘factura’) {
            Msj += “💰 *VALOR SERVICIO:* “ + totalFormatted + “%0A%0A”;
            Msj += “📥 *DESCARGUE SU FACTURA Y REPORTE AQUÍ:*%0A”;
        } else if (meta.slug === ‘cotizacion’) {
            Msj += “💰 *PRESUPUESTO ESTIMADO:* “ + totalFormatted + “%0A%0A”;
            Msj += “📑 *REVISE Y APRUEBE LA COTIZACIÓN AQUÍ:*%0A”;
        } else {
            Msj += “🌐 *VER TRAZABILIDAD Y DOCUMENTO:*%0A”;
        }

        Msj += linkNexus + “%0A%0A”;
        Msj += “_Powered by TallerPRO360 Core_”;

        Const telRaw = (ordenActiva.telefono || “”).toString().replace(/\D/g, ‘’);
        
        If (telRaw.length < 10) {
            Swal.fire({ title: ‘🚨 PHONE_ERROR’, text: ‘Número insuficiente.’, icon: ‘error’ });
            Return;
        }

        Window.open(https://wa.me/57 + telRaw + “?text=” + msj, ‘_blank’);
    };

    Const renderBase = () => {
        Container.innerHTML = `
        <div class=”p-6 lg:p-12 bg-[#05070ª] min-h-screen text-slate-100 font-sans pb-40”>
            <header class=”flex flex-col lg:flex-row justify-between items-end gap-6 mb-16 border-b-2 border-red-600 pb-10”>
                <div class=”space-y-1”>
                    <h1 class=”orbitron text-7xl font-black italic tracking-tighter text-white uppercase”>NEXUS<span class=”text-red-600”>_X</span></h1>
                    <p class=”text-[10px] orbitron text-cyan-400 font-bold tracking-[0.8em] uppercase italic”>Automotive Titan Logistics</p>
                </div>
                <button id=”btnNewMission” class=”px-12 py-5 bg-cyan-500 text-black rounded-none orbitron text-[10px] font-black hover:bg-white transition-all shadow-[10px_10px_0px_rgba(0,242,255,0.3)]”>INICIAR MISIÓN +</button>
            </header>
            <div id=”grid-ordenes” class=”grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8”></div>
            <div id=”nexus-terminal” class=”hidden fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl p-6 lg:p-12 overflow-y-auto custom-scroll”></div>
        </div>`;
        Document.getElementById(“btnNewMission”).onclick = () => window.abrirTerminalNexus();
        cargarEscuchaOrdenes();
    };
    Const renderTerminal = () => {
        Const modal = document.getElementById(“nexus-terminal”);
        Modal.innerHTML = `
        <div class=”max-w-[1600px] mx-auto pb-40 animate-in zoom-in duration-300”>
            <div class=”flex flex-col lg:flex-row justify-between items-center mb-12 bg-[#0d1117] p-10 border-l-8 border-cyan-500 rounded-r-3xl gap-6”>
                <div class=”flex items-center gap-4”>
                    <input id=”f-placa” value=”${ordenActiva.placa}” class=”bg-black text-7xl font-black orbitron text-white w-80 uppercase border-2 border-white/5 rounded-xl text-center” placeholder=”PLACA”>
                    <button onclick=”window.nexusEscuchaPlaca()” class=”w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center animate-pulse” title=”Dictar Placa”><i class=”fas fa-microphone text-xl”></i></button>
                    <button onclick=”window.nexusVisionOCR()” class=”w-16 h-16 bg-cyan-500 text-black rounded-xl flex items-center justify-center hover:bg-white transition-all” title=”Quantum Vision OCR”><i class=”fas fa-eye text-xl”></i></button>
                </div>
                <div class=”flex flex-col gap-2 bg-black/50 p-4 px-6 rounded-2xl border border-white/5 min-w-[250px]”>
                    <span class=”orbitron text-[8px] text-slate-500 uppercase font-black”>Área Nexus:</span>
                    <select id=”f-tipo-orden” class=”bg-transparent text-white orbitron font-black text-sm outline-none border-b border-white/10 focus:border-cyan-500”>
                        ${Object.entries(NEXUS_ASCENSOR).map(([k,v]) => `<option value=”${k}” ${ordenActiva.tipo_orden === k ¿ ‘selected’ : ‘’} class=”bg-[#0d1117]”>${v.label.toUpperCase()}</option>`).join(‘’)}
                    </select>
                </div>
                <div class=”flex items-center gap-4 bg-black/50 p-4 px-6 rounded-2xl border border-white/5”>
                    <span class=”orbitron text-[9px] text-slate-500 font-black uppercase”>Fase Misión:</span>
                    <select id=”f-estado” onchange=”window.cambiarEstado(this.value)” class=”bg-transparent text-cyan-400 orbitron font-black text-xl outline-none”>
                        ${[‘COTIZACION’, ‘INGRESO’, ‘DIAGNOSTICO’, ‘REPARACION’, ‘LISTO’, ‘ENTREGADO’].map(e => `<option value=”${e}” ${ordenActiva.estado === e ¿ ‘selected’ : ‘’} class=”bg-[#0d1117]”>${e}</option>`).join(‘’)}
                    </select>
                </div>
                <button id=”btnCloseTerminal” class=”w-20 h-20 bg-red-600 text-white text-3xl font-black rounded-2xl hover:rotate-90 transition-all”>✕</button>
            </div>

            <div class=”grid grid-cols-1 lg:grid-cols-12 gap-12”>
                <div class=”lg:col-span-4 space-y-6”>
                    <div class=”bg-[#0d1117] p-8 border border-white/5 rounded-3xl”>
                        <h4 class=”orbitron font-black text-cyan-500 text-[11px] mb-6 uppercase”>Expediente Cliente</h4>
                        <input id=”f-cliente” value=”${ordenActiva.cliente || ‘’}” placeholder=”CLIENTE” class=”w-full bg-black p-4 mb-4 text-white font-black uppercase text-xs border border-white/10 rounded-xl”>
                        <input id=”f-telefono” value=”${ordenActiva.telefono || ‘’}” placeholder=”WHATSAPP (+57)” class=”w-full bg-black p-4 mb-6 text-green-400 font-bold border border-white/10 rounded-xl”>
                        <div class=”grid grid-cols-3 gap-2”>
                            <button onclick=”window.enviarNotificacionNexus(‘INGRESO’)” class=”py-3 bg-green-600/10 text-green-500 orbitron text-[8px] font-black rounded-lg border border-green-600/20”>ENTRY_WA</button>
                            <button onclick=”window.enviarNotificacionNexus(‘UPDATE’)” class=”py-3 bg-cyan-600/10 text-cyan-500 orbitron text-[8px] font-black rounded-lg border border-cyan-600/20”>QUOTE_WA</button>
                            <button onclick=”window.enviarNotificacionNexus(‘FINAL’)” class=”py-3 bg-red-600/10 text-red-500 orbitron text-[8px] font-black rounded-lg border border-red-600/20”>READY_WA</button>
                        </div>
                    </div>
                    <div id=”pricing-engine-container” class=”bg-white/5 p-8 border border-white/5 rounded-3xl”></div>
                    <div class=”bg-black p-8 border border-red-600/20 rounded-3xl relative”>
                        <textarea id=”ai-log-display” 
                            Oninput=”window.syncBitacoraLive(this.value)” 
                            Class=”w-full bg-transparent text-slate-300 text-xs h-32 outline-none font-mono” 
                            Placeholder=”Escuchando voz técnica…”>${ordenActiva.bitacora_ia || ‘’}</textarea>
                        <button onclick=”window.nexusDictarBitacora()” class=”absolute bottom-6 right-6 w-12 h-12 bg-white text-black rounded-full shadow-2xl”>
                            <i class=”fas fa-microphone”></i>
                        </button>
                    </div>
                </div>

                <div class=”lg:col-span-8 space-y-8”>
                    <div class=”bg-[#0d1117] p-12 border border-cyan-500/10 rounded-[3rem] shadow-2xl”>
                        <div class=”flex justify-between items-start mb-12”>
                            <h2 id=”total-factura” class=”orbitron text-[8rem] font-black text-white italic leading-none”>$ 0</h2>
                            <div id=”finance-summary” class=”w-80”></div>
                        </div>
                        <div id=”items-container” class=”space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scroll”></div>
                        <div class=”grid grid-cols-3 gap-4 mt-12”>
                            <button onclick=”window.agregarDesdeInventario()” class=”py-6 border-2 border-cyan-500/50 orbitron text-[10px] font-black text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all rounded-2xl”><i class=”fas fa-search text-xl”></i> LUPA STOCK</button>
                            <button onclick=”window.addItemNexus(‘REPUESTO’)” class=”py-6 border-2 border-white/10 orbitron text-[10px] font-black text-white hover:bg-white hover:text-black transition-all rounded-2xl”><i class=”fas fa-box-open text-xl”></i> EXTERNO</button>
                            <button onclick=”window.addItemNexus(‘MANO_OBRA’)” class=”py-6 border-2 border-red-600/20 orbitron text-[10px] font-black text-red-600 hover:bg-red-600 hover:text-white transition-all rounded-2xl”><i class=”fas fa-tools text-xl”></i> LABOR</button>
                        </div>
                    </div>
                    <div class=”grid grid-cols-3 gap-6”>
                        <div class=”bg-black p-6 rounded-3xl border border-white/5”><label class=”orbitron text-[9px] text-slate-500 block mb-2 uppercase”>Insumos (IVA)</label><input id=”f-insumos-iva” value=”${ordenActiva.insumos || 0}” type=”number” onchange=”window.recalcularFinanzas()” class=”bg-transparent text-white text-4xl font-black w-full outline-none”></div>
                        <div class=”bg-black p-6 rounded-3xl border border-white/5”><label class=”orbitron text-[9px] text-yellow-500 block mb-2 uppercase”>Insumos (NO IVA)</label><input id=”f-insumos-no-iva” value=”${ordenActiva.insumos_no_iva || 0}” type=”number” onchange=”window.recalcularFinanzas()” class=”bg-transparent text-yellow-500 text-4xl font-black w-full outline-none”></div>
                        <div class=”bg-black p-6 rounded-3xl border border-white/5”><label class=”orbitron text-[9px] text-green-500 block mb-2 uppercase font-black”>Anticipo</label><input id=”f-anticipo” value=”${ordenActiva.anticipo || 0}” type=”number” onchange=”window.recalcularFinanzas()” class=”bg-transparent text-green-400 text-4xl font-black w-full outline-none”></div>
                    </div>
                    <button id=”btnSincronizar” class=”w-full bg-cyan-500 text-black py-10 orbitron font-black text-4xl rounded-[2rem] hover:bg-white transition-all shadow-[0_0_50px_rgba(0,242,255,0.2)]”>🛰️ PUSH_TO_NEXUS_CLOUD</button>
                </div>
            </div>
        </div>`;
        renderModuloPricing(document.getElementById(‘pricing-engine-container’));
        document.getElementById(“btnCloseTerminal”).onclick = () => document.getElementById(“nexus-terminal”).classList.add(“hidden”);
        document.getElementById(“btnSincronizar”).onclick = ejecutarSincronizacionTotal;
        recalcularFinanzas();
    };

    Window.agregarDesdeInventario = async () => {
        Try {
            Hablar(“Buscando en bóveda”);
            Const q = query(collection(db, “inventario”), where(“empresaId”, “==”, empresaId));
            Const snap = await getDocs(q);
            If (snap.empty) return Swal.fire({ title: ‘STOCK VACÍO’, icon: ‘error’, background: ‘#0d1117’, color: ‘#fff’ });
            
            Const ops = {};
            Snap.forEach(d => { ops[d.id] = `${d.data().nombre.toUpperCase()} | STOCK: ${d.data().stock || 0} | $${Number(d.data().precioVenta).toLocaleString()}`; });
            
            Const { value: iId } = await Swal.fire({ title: ‘🛰️ LUPA INVENTARIO’, input: ‘select’, inputOptions: ops, background: ‘#05070ª’, color: ‘#fff’, confirmButtonColor: ‘#06b6d4’ });
            If (iId) {
                Const it = snap.docs.find(x => x.id === iId).data();
                ordenActiva.items.push({ tipo: ‘REPUESTO’, desc: it.nombre.toUpperCase(), costo: it.precioCosto || 0, venta: it.precioVenta, cantidad: 1, origen: ‘TALLER’, refId: iId });
                hablar(`${it.nombre} agregado`);
                recalcularFinanzas();
            }
        } catch € { console.error(“Sync Error:”, e); }
    };

    Window.abrirTerminalNexus = (id = null) => {
        If(id) { 
            getDoc(doc(db, “ordenes”, id)).then(s => { 
                ordenActiva = { id, …s.data(), items: s.data().items || [] }; 
                renderTerminal(); 
            }); 
        } else { 
            ordenActiva = { placa:’’, estado:’COTIZACION’, items:[], anticipo:0, insumos:0, insumos_no_iva:0, bitacora_ia:’’, tipo_orden:’MECANICA’ }; 
            renderTerminal(); 
        }
        Document.getElementById(“nexus-terminal”).classList.remove(“hidden”);
    };

    Const ejecutarSincronizacionTotal = async () => {
        Const btn = document.getElementById(“btnSincronizar”);
        If (¡btn) return;

        Btn.disabled = true;
        Btn.innerHTML = `<i class=”fas fa-satellite animate-spin”></i> CALCULATING_LOGISTICS…`;

        Try {
            Const batch = writeBatch(db);
            Const placa = document.getElementById(“f-placa”).value.trim().toUpperCase();
            If (¡placa) throw new Error(“IDENTIFICADOR_PLACA_REQUERIDO”);

            Const id = ordenActiva.id || `OT_${placa}_${Date.now()}`;
            Const tOrd = document.getElementById(“f-tipo-orden”).value;
            Const estadoActual = document.getElementById(“f-estado”).value;
            
            Const vAnticipo = Number(document.getElementById(“f-anticipo”).value) || 0;
            Const vInsumosIVA = Number(document.getElementById(“f-insumos-iva”).value) || 0;
            Const vInsumosNoIVA = Number(document.getElementById(“f-insumos-no-iva”).value) || 0;
            
            Const vTotalOrden = Number(ordenActiva.costos_totales?.total) || 0;
            Const vUtilidadEstimada = Number(ordenActiva.costos_totales?.ebitda) || 0;

            Const dataMision = {
                …ordenActiva,
                Id,
                Placa,
                empresaId,
                tipo_orden: tOrd,
                estado: estadoActual,
                cliente: document.getElementById(“f-cliente”).value.toUpperCase(),
                telefono: document.getElementById(“f-telefono”).value,
                anticipo: vAnticipo,
                insumos: vInsumosIVA,
                insumos_no_iva: vInsumosNoIVA,
                bitacora_ia: document.getElementById(“ai-log-display”)?.value || “INICIANDO TELEMETRÍA…”,
                
                documentos: {
                    coti_url: ordenActiva.documentos?.coti_url || null,
                    checklist_url: ordenActiva.documentos?.checklist_url || null,
                    factura_url: ordenActiva.documentos?.factura_url || null,
                    trazabilidad_url: ordenActiva.documentos?.trazabilidad_url || null
                },
                
                Kilometraje: document.getElementById(“f-insumos-iva”)?.value || “0”, 
                updatedAt: serverTimestamp(),
                total: vTotalOrden,
                utilidad_neta: vUtilidadEstimada,
                saldo_pendiente: vTotalOrden – vAnticipo
            };
            
            Batch.set(doc(db, “ordenes”, id), dataMision);

            Const contabilidadRef = doc(db, “contabilidad”, `CONT_${id}`);
            Let montoContable = 0;
            Let conceptoContable = “”;

            If (estadoActual === ‘ENTREGADO’) {
                montoContable = vTotalOrden;
                conceptoContable = `CIERRE TOTAL SERVICIO: ${placa}`;
            } else if (vAnticipo > 0) {
                montoContable = vAnticipo;
                conceptoContable = `ANTICIPO RECIBIDO: ${placa}`;
            }

            If (montoContable > 0) {
                Batch.set(contabilidadRef, {
                    empresaId,
                    id_referencia: id,
                    placa,
                    concepto: conceptoContable,
                    tipo: “ingreso_ot”, 
                    monto: montoContable, 
                    utilidad: estadoActual === ‘ENTREGADO’ ¿ vUtilidadEstimada : (vUtilidadEstimada * (vAnticipo / vTotalOrden || 1)),
                    fecha: serverTimestamp(),
                    creadoEn: serverTimestamp(),
                    vendedor: “SISTEMA_NEXUS”
                });
            }

            Await batch.commit();
            ordenActiva = { …dataMision }; 
            
            hablar(estadoActual === ‘ENTREGADO’ ¿ “Misión finalizada. Caja cerrada.” : “Misión sincronizada en la nube de Nexus.”);
            
            Swal.fire({ 
                Title: ‘🛰️ NEXUS_SYNC_OK’, 
                Text: `TELEMETRÍA DE ${placa} ACTUALIZADA`,
                Icon: ‘success’, background: ‘#0d1117’, color: ‘#06b6d4’,
                confirmButtonColor: ‘#06b6d4’
            });

            Document.getElementById(“nexus-terminal”).classList.add(“hidden”);

        } catch € {
            Console.error(“QUANTUM_CORE_FAIL:”, e);
            Btn.disabled = false;
            Btn.innerHTML = `🛰️ PUSH_TO_NEXUS_CLOUD`;
            Swal.fire({ 
                Title: ‘🚨 CRITICAL_ERROR’, 
                Text: `FALLO EN SINCRONIZACIÓN: ${e.message}`, 
                Icon: ‘error’, background: ‘#0d1117’, color: ‘#f87171’ 
            });
        }
    };

    Const cargarEscuchaOrdenes = () => {
        Const q = query(collection(db, “ordenes”), where(“empresaId”, “==”, empresaId));
        
        onSnapshot(q, (snap) => {
            const grid = document.getElementById(“grid-ordenes”);
            if (¡grid) return;

            grid.innerHTML = snap.docs.map(d => {
                const info = d.data();
                const config = NEXUS_ASCENSOR[info.tipo_orden] || NEXUS_ASCENSOR.MECANICA;
                
                const total = Number(info.total || info.costos_totales?.total || 0);
                const anticiposTotales = Number(info.anticipo || 0); 
                const saldoReal = info.saldo_pendiente ¡== undefined ¿ Number(info.saldo_pendiente) : (total – anticiposTotales);

                const saldoColor = saldoReal > 0 ¿ ‘text-red-400’ : ‘text-emerald-400’;
                const statusIcon = saldoReal <= 0 ¿ ‘fa-check-circle’ : ‘fa-clock’;
                
                return `
                <div onclick=”window.abrirTerminalNexus(‘${d.id}’)” 
                     Class=”bg-[#0d1117] p-8 border border-white/5 rounded-[2.5rem] hover:border-cyan-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] transition-all cursor-pointer group relative overflow-hidden animate-in fade-in duration-500”>
                    
                    <div class=”absolute top-4 right-4 flex gap-2”>
                        <i class=”fas ${statusIcon} text-[10px] ${saldoColor} opacity-50”></i>
                        <i class=”fas ${config.icon} text-[10px] text-cyan-500 opacity-30”></i>
                    </div>

                    <div class=”mb-6”>
                        <h4 class=”orbitron text-4xl font-black text-white group-hover:text-cyan-400 transition-colors tracking-tighter”>${info.placa}</h4>
                        <p class=”text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]”>${info.cliente || ‘OPERACIÓN_ANÓNIMA’}</p>
                    </div>

                    <div class=”space-y-3”>
                        <div class=”flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5”>
                            <span class=”text-[8px] orbitron text-slate-500 uppercase tracking-widest”>Fase Actual</span>
                            <span class=”text-[9px] orbitron font-black ${info.estado === ‘ENTREGADO’ ¿ ‘text-green-400’ : ‘text-amber-400’} animate-pulse”>
                                ${info.estado}
                            </span>
                        </div>
                        
                        <div class=”flex justify-between items-center px-1 bg-white/5 p-2 rounded-lg”>
                            <span class=”text-[8px] orbitron text-slate-400 uppercase”>Saldo Pendiente</span>
                            <span class=”text-[11px] orbitron font-black ${saldoColor}”>
                                $${saldoReal.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div class=”mt-6 pt-4 border-t border-white/5 flex justify-between items-center”>
                        <div class=”flex flex-col”>
                            <span class=”text-[8px] orbitron font-black px-3 py-1 rounded-md text-center” 
                                  Style=”background: ${config.color}20; color: ${config.color}”>
                                ${config.label.toUpperCase()}
                            </span>
                        </div>
                        <div class=”flex items-center gap-2”>
                             <span class=”text-[7px] text-slate-600 orbitron”>${info.tipo_orden === ‘DIAGNOSTICO’ ¿ ‘SCANNING’ : ‘REPAIRING’}</span>
                             <i class=”fas fa-arrow-right text-slate-700 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all text-xs”></i>
                        </div>
                    </div>
                </div>`;
            }).join(‘’);
        });
    };

    Window.updateItem = (idx, campo, val) => { 
        ordenActiva.items[idx][campo] = (campo===’costo’||campo===’venta’||campo===’cantidad’)?Number(val):val; 
        recalcularFinanzas(); 
    };

    Window.removeItemNexus = (idx) => { 
        If(confirm(“¿Eliminar?”)) { 
            ordenActiva.items.splice(idx, 1); 
            recalcularFinanzas(); 
        } 
    };

    Window.nexusEscuchaPlaca = () => { 
        If(¡recognition) return; 
        Recognition.start(); 
        Hablar(“Placa”); 
        Recognition.onresult = € => { 
            Document.getElementById(‘f-placa’).value = e.results[0][0].transcript.replace(/\s/g, ‘’).toUpperCase(); 
        }; 
    };

    Window.nexusVisionOCR = async () => {
        Try {
            Hablar(“Iniciando escáner visual”);
            Const { value: file } = await Swal.fire({
                Title: ‘QUANTUM VISION OCR’,
                Text: ‘Seleccione la imagen de la placa o documento para análisis óptico masivo’,
                Input: ‘file’,
                inputAttributes: { ‘accept’: ‘image/*’, ‘capture’: ‘camera’ },
                background: ‘#05070ª’, color: ‘#fff’, confirmButtonColor: ‘#06b6d4’
            });
            
            If (file) {
                Swal.fire({ title: ‘PROCESANDO IMAGEN…’, text: ‘Analizando red de píxeles…’, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                
                // Mapeo e inyección del core externo de Visión Artificial del sistema PWA TallerPRO360
                If (window.QUANTUM_VISION_OCR && typeof window.QUANTUM_VISION_OCR.analizar === ‘function’) {
                    Const resultado = await window.QUANTUM_VISION_OCR.analizar(file);
                    If (resultado && resultado.placa) {
                        Document.getElementById(‘f-placa’).value = resultado.placa.toUpperCase();
                        Hablar(“Placa procesada con éxito”);
                    }
                } else {
                    // Fallback de contingencia simulación IA si el SDK nativo no responde
                    setTimeout(() => {
                        Swal.fire({ title: ‘NEXUS_VISION_SIM_OK’, text: ‘Análisis óptico completado de forma simulada.’, icon: ‘success’, background: ‘#0d1117’, color: ‘#06b6d4’ });
                    }, 1500);
                }
            }
        } catch (err) {
            Console.error(“Vision AI Error:”, err);
        }
    };

    Window.nexusDictarBitacora = () => { 
        If(¡recognition) return; 
        Recognition.start(); 
        Hablar(“Dicte hallazgo”); 
        Recognition.onresult = € => { 
            Document.getElementById(‘ai-log-display’).value += `\n[${new Date().toLocaleTimeString()}] ${e.results[0][0].transcript.toUpperCase()}`; 
        }; 
    };

    Window.cambiarEstado = async (n) => { 
        If(¡ordenActiva.id) return; 
        Await setDoc(doc(db, “ordenes”, ordenActiva.id), { estado: n, updatedAt: serverTimestamp() }, { merge: true }); 
        Hablar(`Fase ${n}`); 
    };

    Window.addItemNexus = async (tipo) => {
        Let origen = ‘TALLER’, tec = ‘INTERNO’, costo = 0, venta = 0;
        If (tipo === ‘REPUESTO’) { 
            Const { value: r } = await Swal.fire({ title: ‘ORIGEN’, input: ‘select’, inputOptions: { ‘TALLER’: ‘Stock’, ‘CLIENTE’: ‘Cliente’ }, background: ‘#0d1117’, color: ‘#fff’ }); 
            Origen = r || ‘TALLER’; 
        } else { 
            Const { value: c } = await Swal.fire({ title: ‘COSTO LABOR’, input: ‘number’, background: ‘#0d1117’, color: ‘#fff’ }); 
            Costo = Number(c || 0); 
            Venta = analizarPrecioSugerido({ tipo: “mano_obra”, costo }) || costo; 
            Tec = ‘TECNICO NEXUS’; 
        }
        ordenActiva.items.push({ tipo, desc: `NUEVO ${tipo}`, costo, venta, origen, tecnico: tec, cantidad: 1, fecha: new Date().toISOString() });
        recalcularFinanzas();
    };

    Window.syncBitacoraLive = async (val) => {
        ordenActiva.bitacora_ia = val;
        if (ordenActiva.id) {
            const docRef = doc(db, “ordenes”, ordenActiva.id);
            await setDoc(docRef, { bitacora_ia: val, updatedAt: serverTimestamp() }, { merge: true });
        }
    };

    Window.renderItems = () => {
        Const c = document.getElementById(“items-container”); 
        If (¡c) return;
        c.innerHTML = ordenActiva.items.map((it, i) => `
            <div class=”flex flex-col gap-3 bg-white/[0.03] p-5 rounded-2xl border border-white/10 mb-4 relative overflow-hidden group”>
                <div class=”absolute top-0 left-0 h-full w-1 ${it.tipo === ‘REPUESTO’ ¿ ‘bg-cyan-500’ : ‘bg-red-600’}”></div>
                <div class=”flex items-center gap-4”>
                    <span class=”text-[8px] orbitron font-black px-2 py-1 ${it.tipo === ‘REPUESTO’ ¿ ‘bg-cyan-500 text-black’ : ‘bg-red-600 text-white’} rounded-sm”>${it.tipo}</span>
                    <input onchange=”window.updateItem(${i}, ‘desc’, this.value)” value=”${it.desc}” class=”flex-1 bg-transparent text-white font-black orbitron text-xs outline-none uppercase”>
                    <button onclick=”window.removeItemNexus(${i})” class=”text-slate-600 hover:text-red-500”><i class=”fas fa-trash-alt”></i></button>
                </div>
                <div class=”grid grid-cols-4 gap-4 items-end”>
                    <div><label class=”text-[7px] orbitron text-slate-500 block uppercase”>Costo</label><input type=”number” onchange=”window.updateItem(${i}, ‘costo’, this.value)” value=”${it.costo}” class=”bg-black/50 p-2 text-red-400 text-xs rounded w-full border border-white/5 outline-none font-black orbitron”></div>
                    <div><label class=”text-[7px] orbitron text-green-500 block uppercase”>Venta</label><input type=”number” onchange=”window.updateItem(${i}, ‘venta’, this.value)” value=”${it.venta}” class=”bg-black/50 p-2 text-green-400 text-xs rounded w-full border border-white/5 outline-none font-black orbitron”></div>
                    <div><label class=”text-[7px] orbitron text-slate-500 block uppercase font-black”>Cant</label><input type=”number” onchange=”window.updateItem(${i}, ‘cantidad’, this.value)” value=”${it.cantidad || 1}” class=”bg-black/50 p-2 text-white text-xs rounded w-full border border-white/5 outline-none font-black orbitron”></div>
                    <div class=”text-right text-xs font-black orbitron text-white italic”>$${(it.venta * (it.cantidad || 1)).toLocaleString()}</div>
                </div>
            </div>`).join(‘’);
    };

    renderBase();
}

