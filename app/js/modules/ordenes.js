/**
 * 🏛️ TALLERPRO360 - ORDENES & TITAN LOGISTICS ENGINE v17.2.0
 * 📜 SCRIPT ID: #NEXUS-X-SAP-ORDERS-2026-V17
 * CONSOLIDACIÓN TOTAL: QUANTUM-SAP CONTABLE & CORTE TEMPORAL EN NUBE
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS & GEMINI AI PRO
 * CERTIFICACIÓN OPERATIVA: REFORMA INTEGRAL JUNIO 2026
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, deleteDoc, serverTimestamp, writeBatch 
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

// ==========================================
// 🛡️ CONTROLADOR MAESTRO DE SANITIZACIÓN NEXUS-X
// ==========================================
const aislarPlacaPura = (textoRaw) => {
    if (!textoRaw) return "ADMIN";
    const base = String(textoRaw).split('-')[0];
    const limpia = base.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
    return (limpia.length >= 5 && limpia.length <= 6) ? limpia : "ADMIN";
};

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;

    if (!empresaId) {
        container.innerHTML = `<div class="p-10 orbitron text-red-500 font-black text-center">ERROR CRÍTICO: NO_EMPRESA_ID_DETECTED</div>`;
        return;
    }

    // --- REINGENIERÍA MAESTRA DEL CÁLCULO DE COSTOS DIRECTOS E INDIRECTOS ---
    const recalcularFinanzas = () => {
        if (!ordenActiva) return;
        
        // Estructura de acumulación robusta SAP
        let m = { 
            v_rep_taller: 0, c_rep_taller: 0, 
            v_rep_externo: 0, c_rep_externo: 0, 
            v_mo: 0, c_mo: 0 
        };

        ordenActiva.items.forEach(i => {
            const v = Number(i.venta || 0);
            const c = Number(i.costo || 0);
            const cant = Number(i.cantidad || 1);
            
            if (i.tipo === 'REPUESTO') {
                if (i.origen === 'TALLER') {
                    m.v_rep_taller += (v * cant);
                    m.c_rep_taller += (c * cant);
                } else {
                    // 🔥 SE ADICIONA EL COSTO DEL REPUESTO EXTERNO PARA COMPATIBILIDAD CON REPORTES.JS
                    m.v_rep_externo += (v * cant);
                    m.c_rep_externo += (c * cant);
                }
            } else if (i.tipo === 'MANO_OBRA') {
                m.v_mo += (v * cant);
                m.c_mo += (c * cant);
            }
        });

        const insIVA = Number(document.getElementById("f-insumos-iva")?.value || 0);
        const insNoIVA = Number(document.getElementById("f-insumos-no-iva")?.value || 0);
        const ant = Number(document.getElementById("f-anticipo")?.value || 0);

        // Sumatoria global de ventas gravadas (Insumos con IVA + Repuestos de todo origen + Labores)
        const subGrav = m.v_rep_taller + m.v_rep_externo + m.v_mo + insIVA;
        const base = subGrav / 1.19;
        const total = subGrav + insNoIVA;

        // Costo Directo total acumulado (Interno + Externo + Mano de Obra)
        const costoDirectoTotal = m.c_rep_taller + m.c_rep_externo + m.c_mo;
        
        // Utilidad Operativa EBITDA Estandarizada
        const utilidad = base - (costoDirectoTotal + (insIVA / 1.19)) + insNoIVA;

        // Persistencia elástica en el modelo de datos de la orden activa
        ordenActiva.costos_totales = { 
            total, 
            base, 
            iva: subGrav - base, 
            saldo: total - ant, 
            ebitda: utilidad,
            costo_directo: costoDirectoTotal // Inyección mágica del costo directo unificado
        };
        
        ordenActiva.total = total; // Sincronización del property raíz de consulta

        actualizarUIFinanciera(total, base, subGrav - base, utilidad, total - ant);
        renderItems();
    };

    const actualizarUIFinanciera = (total, base, iva, ebitda, saldo) => {
        const totalEl = document.getElementById("total-factura");
        const summaryEl = document.getElementById("finance-summary");
        if(totalEl) totalEl.innerText = `$ ${Math.round(total).toLocaleString('es-CO')}`;
        if(summaryEl) summaryEl.innerHTML = `
            <div class="grid grid-cols-2 gap-4 border-t border-cyan-500/30 pt-6 mt-6">
                <div class="text-[10px] orbitron text-slate-500 uppercase font-black">BASE: <span class="text-white">$${Math.round(base).toLocaleString('es-CO')}</span></div>
                <div class="text-[10px] orbitron text-slate-500 text-right uppercase font-black">IVA (19%): <span class="text-white">$${Math.round(iva).toLocaleString('es-CO')}</span></div>
                <div class="text-green-400 font-black text-2xl orbitron italic leading-none col-span-2">EBITDA: $${Math.round(ebitda).toLocaleString('es-CO')}</div>
                <div class="text-red-500 font-black text-2xl orbitron text-right italic leading-none font-black col-span-2 mt-2 border-t border-white/5 pt-2">SALDO: $${Math.round(saldo).toLocaleString('es-CO')}</div>
            </div>`;
    };

    // =========================================================================
// 🛰️ CONTROLADOR DE NOTIFICACIONES SANITIZADO PARA PLATAFORMA NEXUS-X
// =========================================================================
window.enviarNotificacionNexus = (procesoEnviado) => {
    const idOrden = ordenActiva.id;
    if (!idOrden || idOrden === "PENDIENTE") {
        Swal.fire({ 
            title: '🚨 SYNC_REQUIRED', 
            text: 'Debe sincronizar la misión en la nube antes de notificar por WhatsApp.', 
            icon: 'warning', background: '#0d1117', color: '#06b6d4' 
        });
        return;
    }

    const mapaNexus = {
        'INGRESO':    { slug: 'diagnostico', emoji: '🛰️', tag: 'INGRESO_CONFIRMADO' },
        'COTIZACION': { slug: 'cotizacion',  emoji: '💰', tag: 'PROPUESTA_TÉCNICA' },
        'REPARACION': { slug: 'reparacion',  emoji: '⚙️', tag: 'AVANCE_DE_MISIÓN' },
        'LISTO':      { slug: 'factura',     emoji: '✅', tag: 'MISIÓN_COMPLETADA' },
        'FINAL':      { slug: 'factura',     emoji: '✅', tag: 'MISIÓN_COMPLETADA' },
        'ENTREGADO':  { slug: 'factura',     emoji: '🏁', tag: 'REPORTE_HISTÓRICO' }
    };

    const p = (procesoEnviado || ordenActiva.estado || 'INGRESO').toUpperCase();
    const meta = mapaNexus[p] || mapaNexus['INGRESO'];
    const baseUri = "https://tallerpro360.vercel.app/documento";
    const linkNexus = `${baseUri}?id=${idOrden}&tipo=${meta.slug}`;
    const totalFinal = Math.round(ordenActiva.total || (ordenActiva.costos_totales && ordenActiva.costos_totales.total) || 0);
    const totalFormatted = "$" + totalFinal.toLocaleString('es-CO');
    const cliente = (ordenActiva.cliente || "CLIENTE").toUpperCase();
    const placa = (ordenActiva.placa || "N/A").toUpperCase();
    
    // Construimos el mensaje usando saltos de línea estándar (\n) para evitar conflictos previos
    let msj = `${meta.emoji} *NEXUS_X: ${meta.tag}*\n\n`;
    msj += `Hola *${cliente}*, la unidad *${placa}* presenta novedades en el sistema.\n\n`;

    if (ordenActiva.bitacora_ia) {
        // Sanitizamos cortes de texto plano
        const logIA = ordenActiva.bitacora_ia.substring(0, 150).toUpperCase().trim();
        msj += `📝 *LOG_IA:* ${logIA}...\n\n`;
    }

    if (meta.slug === 'factura') {
        msj += `💰 *VALOR SERVICIO:* ${totalFormatted}\n\n`;
        msj += `📥 *DESCARGUE SU FACTURA Y REPORTE AQUÍ:*\n`;
    } else if (meta.slug === 'cotizacion') {
        msj += `💰 *PRESUPUESTO ESTIMADO:* ${totalFormatted}\n\n`;
        msj += `📑 *REVISE Y APRUEBE LA COTIZACIÓN AQUÍ:*\n`;
    } else {
        msj += `🌐 *VER TRAZABILIDAD Y DOCUMENTO:*\n`;
    }

    msj += `${linkNexus}\n\n`;
    msj += `_Powered by TallerPRO360 Core_`;

    const telRaw = (ordenActiva.telefono || "").toString().replace(/\D/g, '');
    if (telRaw.length < 10) {
        Swal.fire({ title: '🚨 PHONE_ERROR', text: 'Número de WhatsApp insuficiente o inválido.', icon: 'error', background: '#0d1117', color: '#f87171' });
        return;
    }

    // 🔥 LA CLAVE: El encodeURIComponent empaqueta todo de forma segura para la API de WhatsApp sin romper la URL
    window.open("https://wa.me/57" + telRaw + "?text=" + encodeURIComponent(msj), '_blank');
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
        
        let fechaFormateada = new Date().toISOString().split('T')[0];
        if (ordenActiva.fecha_creacion_manual) {
            fechaFormateada = ordenActiva.fecha_creacion_manual.split('T')[0];
        }

        const inv = ordenActiva.inventario_ingreso || { kit_herramientas: false, documentos: false, repuesto_llanta: false, observaciones: '', fotos: [] };

        modal.innerHTML = `
        <div class="max-w-[1600px] mx-auto pb-40 animate-in zoom-in duration-300">
            <div class="flex flex-col lg:flex-row justify-between items-center mb-12 bg-[#0d1117] p-10 border-l-8 border-cyan-500 rounded-r-3xl gap-6">
                <div class="flex items-center gap-6">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-7xl font-black orbitron text-white w-80 uppercase border-2 border-white/5 rounded-xl text-center focus:border-cyan-500 outline-none" placeholder="PLACA">
                    <button onclick="window.nexusEscuchaPlaca()" class="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center animate-pulse text-white"><i class="fas fa-microphone text-xl"></i></button>
                </div>
                
                <div class="flex flex-col gap-2 bg-black/50 p-4 px-6 rounded-2xl border border-white/5 min-w-[220px]">
                    <span class="orbitron text-[8px] text-amber-500 uppercase font-black"><i class="fas fa-calendar-alt"></i> Fecha de Registro:</span>
                    <input type="date" id="f-fecha-manual" value="${fechaFormateada}" class="bg-transparent text-white orbitron font-black text-sm outline-none border-b border-white/10 focus:border-cyan-500">
                </div>

                <div class="flex flex-col gap-2 bg-black/50 p-4 px-6 rounded-2xl border border-white/5 min-w-[220px]">
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
                <button id="btnCloseTerminal" class="w-20 h-20 bg-red-600 text-white text-3xl font-black rounded-2xl hover:rotate-90 transition-all flex items-center justify-center">✕</button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-[#0d1117] p-8 border border-white/5 rounded-3xl">
                        <h4 class="orbitron font-black text-cyan-500 text-[11px] mb-6 uppercase">Expediente Cliente</h4>
                        <input id="f-cliente" value="${ordenActiva.cliente || ''}" placeholder="CLIENTE / COMPAÑÍA" class="w-full bg-black p-4 mb-4 text-white font-black uppercase text-xs border border-white/10 rounded-xl outline-none focus:border-cyan-500">
                        <input id="f-telefono" value="${ordenActiva.telefono || ''}" placeholder="WHATSAPP (+57)" class="w-full bg-black p-4 mb-6 text-green-400 font-bold border border-white/10 rounded-xl outline-none focus:border-green-500">
                        <div class="grid grid-cols-3 gap-2">
                            <button onclick="window.enviarNotificacionNexus('INGRESO')" class="py-3 bg-green-600/10 text-green-500 orbitron text-[8px] font-black rounded-lg border border-green-600/20 hover:bg-green-600 hover:text-black transition-all">ENTRY_WA</button>
                            <button onclick="window.enviarNotificacionNexus('UPDATE')" class="py-3 bg-cyan-600/10 text-cyan-500 orbitron text-[8px] font-black rounded-lg border border-cyan-600/20 hover:bg-cyan-500 hover:text-black transition-all">QUOTE_WA</button>
                            <button onclick="window.enviarNotificacionNexus('FINAL')" class="py-3 bg-red-600/10 text-red-500 orbitron text-[8px] font-black rounded-lg border border-red-600/20 hover:bg-red-600 hover:text-white transition-all">READY_WA</button>
                        </div>
                    </div>

                    <div class="bg-[#0d1117] p-8 border border-yellow-600/20 rounded-3xl space-y-4">
                        <h4 class="orbitron font-black text-yellow-500 text-[11px] uppercase flex justify-between">
                            <span>📋 INVENTARIO DE INGRESO</span>
                            <span class="text-[9px] text-slate-500">MODO ELÁSTICO</span>
                        </h4>
                        <div class="grid grid-cols-1 gap-2 text-xs font-mono">
                            <label class="flex items-center gap-3 p-2 bg-black/40 rounded-xl cursor-pointer">
                                <input type="checkbox" id="inv-herramientas" ${inv.kit_herramientas ? 'checked' : ''} class="accent-yellow-500">
                                <span>KIT DE HERRAMIENTAS / GATO</span>
                            </label>
                            <label class="flex items-center gap-3 p-2 bg-black/40 rounded-xl cursor-pointer">
                                <input type="checkbox" id="inv-documentos" ${inv.documentos ? 'checked' : ''} class="accent-yellow-500">
                                <span>DOCUMENTOS DEL VEHÍCULO</span>
                            </label>
                            <label class="flex items-center gap-3 p-2 bg-black/40 rounded-xl cursor-pointer">
                                <input type="checkbox" id="inv-llanta" ${inv.repuesto_llanta ? 'checked' : ''} class="accent-yellow-500">
                                <span>LLANTA DE REPUESTO</span>
                            </label>
                        </div>
                        <div>
                            <label class="text-[8px] text-slate-400 orbitron uppercase block mb-1">Observaciones de Ingreso</label>
                            <textarea id="inv-observaciones" class="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white outline-none h-16 uppercase focus:border-yellow-500 animate-none" placeholder="RAYONES, GOLPES O NOVEDADES VISUALES...">${inv.observaciones || ''}</textarea>
                        </div>
                        <div>
                            <label class="text-[8px] text-slate-400 orbitron uppercase block mb-2"><i class="fas fa-camera"></i> Evidencia Fotográfica Movil (Compacto)</label>
                            <input type="file" id="inv-file-capture" accept="image/*" capture="environment" class="hidden" onchange="window.procesarFotoIngreso(this)">
                            <button onclick="document.getElementById('inv-file-capture').click()" class="w-full py-3 bg-yellow-500 text-black font-black orbitron text-[10px] rounded-xl hover:bg-white transition-all"><i class="fas fa-camera"></i> DISPARAR CÁMARA</button>
                            <div id="inv-preview-fotos" class="grid grid-cols-4 gap-2 mt-3">
                                ${(inv.fotos || []).map((img, index) => `
                                    <div class="relative group aspect-square rounded-lg overflow-hidden border border-white/10 bg-black">
                                        <img src="${img}" class="object-cover w-full h-full">
                                        <button onclick="window.eliminarFotoLocal(${index})" class="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-black">X</button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div id="pricing-engine-container" class="bg-white/5 p-8 border border-white/5 rounded-3xl"></div>
                    <div class="bg-black p-8 border border-red-600/20 rounded-3xl relative">
                        <textarea id="ai-log-display" 
                            oninput="window.syncBitacoraLive(this.value)" 
                            class="w-full bg-transparent text-slate-300 text-xs h-32 outline-none font-mono focus:border-red-500" 
                            placeholder="Escuchando voz técnica...">${ordenActiva.bitacora_ia || ''}</textarea>
                        <button onclick="window.nexusDictarBitacora()" class="absolute bottom-6 right-6 w-12 h-12 bg-white text-black rounded-full shadow-2xl flex items-center justify-center">
                            <i class="fas fa-microphone"></i>
                        </button>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 border border-cyan-500/10 rounded-[3rem] shadow-2xl">
                        <div class="flex flex-col xl:flex-row justify-between items-start gap-6 mb-12">
                            <h2 id="total-factura" class="orbitron text-[5.5rem] font-black text-white italic leading-none tracking-tighter">$ 0</h2>
                            <div id="finance-summary" class="w-full xl:w-80"></div>
                        </div>
                        <div id="items-container" class="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scroll"></div>
                        <div class="grid grid-cols-3 gap-4 mt-12">
                            <button onclick="window.agregarDesdeInventario()" class="py-6 border-2 border-cyan-500/50 orbitron text-[10px] font-black text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all rounded-2xl"><i class="fas fa-search text-xl block mb-1"></i> LUPA STOCK</button>
                            <button onclick="window.addItemNexus('REPUESTO')" class="py-6 border-2 border-white/10 orbitron text-[10px] font-black text-white hover:bg-white hover:text-black transition-all rounded-2xl"><i class="fas fa-box-open text-xl block mb-1"></i> EXTERNO</button>
                            <button onclick="window.addItemNexus('MANO_OBRA')" class="py-6 border-2 border-red-600/20 orbitron text-[10px] font-black text-red-600 hover:bg-red-600 hover:text-white transition-all rounded-2xl"><i class="fas fa-tools text-xl block mb-1"></i> LABOR</button>
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

    window.procesarFotoIngreso = (input) => {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if(!ordenActiva.inventario_ingreso) ordenActiva.inventario_ingreso = { kit_herramientas: false, documentos: false, repuesto_llanta: false, observaciones: '', fotos: [] };
                if(!ordenActiva.inventario_ingreso.fotos) ordenActiva.inventario_ingreso.fotos = [];
                
                ordenActiva.inventario_ingreso.fotos.push(e.target.result);
                hablar("Foto acoplada localmente");
                
                const containerFotos = document.getElementById("inv-preview-fotos");
                if(containerFotos) {
                    containerFotos.innerHTML = ordenActiva.inventario_ingreso.fotos.map((img, index) => `
                        <div class="relative group aspect-square rounded-lg overflow-hidden border border-white/10 bg-black">
                            <img src="${img}" class="object-cover w-full h-full">
                            <button onclick="window.eliminarFotoLocal(${index})" class="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-black">X</button>
                        </div>
                    `).join('');
                }
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    window.eliminarFotoLocal = (index) => {
        if(ordenActiva.inventario_ingreso && ordenActiva.inventario_ingreso.fotos) {
            ordenActiva.inventario_ingreso.fotos.splice(index, 1);
            const containerFotos = document.getElementById("inv-preview-fotos");
            if(containerFotos) {
                containerFotos.innerHTML = ordenActiva.inventario_ingreso.fotos.map((img, index) => `
                    <div class="relative group aspect-square rounded-lg overflow-hidden border border-white/10 bg-black">
                        <img src="${img}" class="object-cover w-full h-full">
                        <button onclick="window.eliminarFotoLocal(${index})" class="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-black">X</button>
                    </div>
                `).join('');
            }
        }
    };

    window.agregarDesdeInventario = async () => {
        try {
            hablar("Buscando en bóveda");
            const q = query(collection(db, "inventario"), where("empresaId", "==", empresaId));
            const snap = await getDocs(q);
            if (snap.empty) return Swal.fire({ title: 'STOCK VACÍO', text: 'No hay repuestos registrados en stock.', icon: 'error', background: '#0d1117', color: '#fff' });
            
            const ops = {};
            snap.forEach(d => { ops[d.id] = `${d.data().nombre.toUpperCase()} | STOCK: ${d.data().stock || 0} | $${Number(d.data().precioVenta).toLocaleString('es-CO')}`; });
            
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
            ordenActiva = { 
                placa:'', 
                estado:'COTIZACION', 
                items:[], 
                anticipo:0, 
                insumos:0, 
                insumos_no_iva:0, 
                bitacora_ia:'DIAGNOSTICO PENDIENTE\nSUBIR EVIDENCIAS', 
                tipo_orden:'MECANICA',
                fecha_creacion_manual: new Date().toISOString(),
                inventario_ingreso: { kit_herramientas: false, documentos: false, repuesto_llanta: false, observaciones: '', fotos: [] }
            }; 
            renderTerminal(); 
        }
        document.getElementById("nexus-terminal").classList.remove("hidden");
    };

    window.eliminarOrdenNexus = async (id, event) => {
        if (event && event.stopPropagation) event.stopPropagation();
        
        const confirmar = await Swal.fire({
            title: '¿ELIMINAR MISIÓN?',
            text: "Esta maniobra purgará de forma definitiva la orden en la nube.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#334155',
            confirmButtonText: 'SÍ, BORRAR',
            background: '#05070a',
            color: '#fff'
        });

        if (confirmar.isConfirmed) {
            try {
                await deleteDoc(doc(db, "ordenes", id));
                hablar("Misión purgada");
                Swal.fire({ title: 'ELIMINADO', icon: 'success', background: '#0d1117', color: '#06b6d4' });
            } catch (e) {
                Swal.fire({ title: 'FALLO CRÍTICO', text: e.message, icon: 'error' });
            }
        }
    };

                    // =========================================================================
    // 📡 TRANSMISIÓN DE TELEMETRÍA Y AMARRE QUANTUM-SAP / SAP-HANA ENTERPRISE
    // =========================================================================
    const ejecutarSincronizacionTotal = async () => {
        const btn = document.getElementById("btnSincronizar");
        if (!btn) return;

        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-satellite animate-spin"></i> CALCULATING_LOGISTICS...`;

        try {
            const batch = writeBatch(db);
            const placaRaw = document.getElementById("f-placa").value.trim();
            if (!placaRaw) throw new Error("IDENTIFICADOR_PLACA_REQUERIDO");

            // 🔥 REINGENIERÍA COGNITIVA: Aislamiento estricto de Placa Pura
            const placaPuraSola = placaRaw.split('-')[0].trim().toUpperCase();
            
            // 🔄 DETERMINACIÓN MULTI-ORDEN DINÁMICA:
            // Si el cliente en pantalla es diferente al dueño original de la orden activa,
            // se rompe el amarre del ID viejo y se fuerza un nuevo expediente temporal (Date.now())
            // protegiendo el historial financiero del propietario o concesionario anterior.
            const clienteEnPantalla = document.getElementById("f-cliente").value.trim().toUpperCase();
            const clienteOriginal = (ordenActiva.cliente || "").trim().toUpperCase();
            
            let id = ordenActiva.id;
            
            if (!id || (clienteEnPantalla !== clienteOriginal && clienteOriginal !== "")) {
                id = `OT_${placaPuraSola}_${Date.now()}`;
                // Inicialización limpia de arrays y mapas financieros para la nueva orden
                ordenActiva.items = [];
                ordenActiva.costos_totales = { total: 0, ebitda: 0, base: 0, iva: 0 };
            }
            
            const tOrd = document.getElementById("f-tipo-orden").value;
            const estadoActual = document.getElementById("f-estado").value;
            
            const vAnticipo = Number(document.getElementById("f-anticipo").value) || 0;
            const vInsumosIVA = Number(document.getElementById("f-insumos-iva").value) || 0;
            const vInsumosNoIVA = Number(document.getElementById("f-insumos-no-iva").value) || 0;
            
            const vTotalOrden = Number(ordenActiva.costos_totales?.total) || 0;
            const vUtilidadEstimada = Number(ordenActiva.costos_totales?.ebitda) || 0;
            
            // Captura quirúrgica del kilometraje de ingreso
            const vKilometraje = document.getElementById("f-kilometraje")?.value || document.getElementById("f-km")?.value || "0";

            // 📝 VALIDACIÓN COGNITIVA DE BITÁCORA DE INGRESO
            // Preserva tus palabras exactas por defecto y deja el campo abierto para que el extractor regex de documento.html
            // lea el millaje ("KMS 235.000") sin pérdidas si el operario lo escribe directamente en la interfaz.
            let inputBitacora = document.getElementById("ai-log-display")?.value || "";
            if (!inputBitacora.trim()) {
                inputBitacora = "DIAGNOSTICO PENDIENTE // SUBIR EVIDENCIAS ✅ Carpeta Drive Vinculada";
            }

            const metaInventario = {
                kit_herramientas: document.getElementById("inv-herramientas")?.checked || false,
                documentos: document.getElementById("inv-documentos")?.checked || false,
                repuesto_llanta: document.getElementById("inv-llanta")?.checked || false,
                observaciones: (document.getElementById("inv-observaciones")?.value || "").toUpperCase(),
                fotos: ordenActiva.inventario_ingreso?.fotos || []
            };

            const inputFechaManual = document.getElementById("f-fecha-manual").value;
            const timestampFinal = inputFechaManual ? new Date(inputFechaManual + "T12:00:00").toISOString() : new Date().toISOString();

            // Construcción del documento unificado de la misión (Soporta multi-taller elástico sin amarres fijos)
            const dataMision = {
                ...ordenActiva,
                id,
                placa: placaRaw.toUpperCase(), 
                placa_limpia: placaPuraSola,   
                empresaId: empresaId || ordenActiva.empresaId || "taller_003", 
                id_empresa: empresaId || ordenActiva.empresaId || "taller_003",
                tipo_orden: tOrd,
                estado: estadoActual,
                kilometraje: vKilometraje,     
                km: vKilometraje,              
                cliente: clienteEnPantalla,
                telefono: document.getElementById("f-telefono").value,
                anticipo: vAnticipo,
                insumos: vInsumosIVA,
                insumos_no_iva: vInsumosNoIVA,
                bitacora_ia: inputBitacora, 
                inventario_ingreso: metaInventario,
                fecha_creacion_manual: timestampFinal,
                items: ordenActiva.items || [], 
                
                documentos: {
                    coti_url: ordenActiva.documentos?.coti_url || null,
                    checklist_url: ordenActiva.documentos?.checklist_url || null,
                    factura_url: ordenActiva.documentos?.factura_url || null,
                    trazabilidad_url: ordenActiva.link_evidencia || ordenActiva.documentos?.trazabilidad_url || null
                },
                
                updatedAt: serverTimestamp(),
                total: vTotalOrden,
                utilidad_neta: vUtilidadEstimada,
                saldo_pendiente: vTotalOrden - vAnticipo
            };
            
            batch.set(doc(db, "ordenes", id), dataMision);
            await batch.commit();

            // ⚡ ACTUALIZACIÓN VISUAL DE IMPACTO (Inyección dinámica de estilos QUANTUM en caliente)
            // Esto escala el tamaño de la Marca/Modelo y del Kilometraje en la interfaz de usuario de forma inmediata
            setTimeout(() => {
                const elMarca = document.getElementById("v-marca") || document.getElementById("f-marca-display");
                const elKm = document.getElementById("v-km") || document.getElementById("f-km-display");
                
                if (elMarca) {
                    elMarca.style.fontSize = "2.25rem"; // Equivale a text-4xl (Mismo tamaño que la placa)
                    elMarca.style.fontWeight = "900";
                    elMarca.style.lineHeight = "1";
                }
                if (elKm) {
                    elKm.style.fontSize = "1.875rem"; // Equivale a text-3xl (Maximizado para lectura espacial)
                    elKm.style.fontWeight = "900";
                }
            }, 100);

            btn.innerHTML = `<i class="fas fa-check-circle"></i> SINCRO_OK_🛰️`;
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = `<i class="fas fa-satellite"></i> SINCRONIZAR`;
            }, 2000);

        } catch (error) {
            console.error("CRITICAL_SYNC_ERROR: ", error);
            btn.className = "bg-red-600 text-white font-bold p-3 rounded-xl w-full";
            btn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ERROR_DE_SINCRO`;
            setTimeout(() => {
                btn.disabled = false;
                btn.className = "bg-cyan-500 text-black font-bold p-3 rounded-xl w-full"; 
                btn.innerHTML = `<i class="fas fa-satellite"></i> SINCRONIZAR`;
            }, 3000);
        }
    };

            // =========================================================================
            // 🏛️ INYECCIÓN DE CRUCE EN EL LIBRO DIARIO DETALLADO (CONTABILIDAD)
            // =========================================================================
            
            // 1️⃣ SUB-CAPA A: REGISTRO MASTER DE INGRESO / ANTICIPO
            const contabilidadRef = doc(db, "contabilidad", `CONT_IN_${id}`);
            let montoContable = 0;
            let conceptoContable = "";

            if (estadoActual === 'ENTREGADO') {
                montoContable = vTotalOrden;
                conceptoContable = `CIERRE TOTAL SERVICIO: ${placaRaw.toUpperCase()}`;
            } else if (vAnticipo > 0) {
                montoContable = vAnticipo;
                conceptoContable = `ANTICIPO RECIBIDO: ${placaRaw.toUpperCase()}`;
            }

            if (montoContable > 0) {
                batch.set(contabilidadRef, {
                    empresaId,
                    id_referencia: id,
                    puc: estadoActual === 'ENTREGADO' ? "413505" : "110505",
                    cuenta: estadoActual === 'ENTREGADO' ? "413505" : "110505",
                    cuentaContable: estadoActual === 'ENTREGADO' ? "413505" : "110505",
                    concepto: conceptoContable.toUpperCase(),
                    tipo: "ingreso_ot", 
                    debito: estadoActual === 'ENTREGADO' ? 0 : montoContable, 
                    credito: estadoActual === 'ENTREGADO' ? montoContable : 0,
                    monto: montoContable, 
                    utilidad: estadoActual === 'ENTREGADO' ? vUtilidadEstimada : (vUtilidadEstimada * (vAnticipo / vTotalOrden || 1)),
                    placa: placaPuraSola, 
                    vehiculo_detalle: placaRaw.toUpperCase(), 
                    fecha_registro: timestampFinal.split('T')[0],
                    fecha: timestampFinal.split('T')[0],
                    creadoEn: timestampFinal,
                    creadoPor: "SISTEMA_NEXUS"
                }, { merge: true });
            }

            // 2️⃣ SUB-CAPA B: DESGLOSE DE COSTOS Y GASTOS DIRECTOS ÍTEM POR ÍTEM (PROCESAMIENTO HIERARCHICAL PUC)
            const itemsParaContabilidad = ordenActiva.items || [];
            
            itemsParaContabilidad.forEach((item, index) => {
                // ID Determinista por Índice para anular duplicaciones en resincronizaciones
                const costoItemRef = doc(db, "contabilidad", `CONT_COSTO_${id}_${index}`);
                
                let cuentaPUC = "613505"; // Por defecto: Costo de venta - Repuestos
                let tipoRegistro = "costo_directo_ot";
                let conceptoItem = "";

                const costoTotalItem = Number(item.costo || 0) * (Number(item.cantidad) || 1);

                // Clasificación matricial según el tipo de componente e insumo
                if (item.tipo === 'REPUESTO') {
                    cuentaPUC = "613505"; // Comercio al por mayor y menor: Repuestos y Accesorios
                    conceptoItem = `COSTO REPUESTO (${item.origen || 'TALLER'}): ${item.desc.toUpperCase()}`;
                } else if (item.tipo === 'MANO_OBRA' || item.tipo === 'LABOR') {
                    cuentaPUC = "613520"; // Costos de Servicios / Operarios Externos e Internos
                    conceptoItem = `COSTO MANO DE OBRA (${item.tecnico || 'TECNICO NEXUS'}): ${item.desc.toUpperCase()}`;
                }

                // Inyección atómica al batch si el ítem genera un costo real cargado en el libro diario
                if (costoTotalItem > 0) {
                    batch.set(costoItemRef, {
                        empresaId,
                        id_referencia: id,
                        item_index: index,
                        puc: cuentaPUC,
                        cuenta: cuentaPUC,
                        cuentaContable: cuentaPUC,
                        concepto: `${conceptoItem} - PLACA: ${placaPuraSola}`,
                        tipo: tipoRegistro,
                        monto: costoTotalItem,
                        debito: costoTotalItem, // Costos incrementan por el Débito
                        credito: 0,
                        placa: placaPuraSola,
                        vehiculo_detalle: placaRaw.toUpperCase(),
                        fecha_registro: timestampFinal.split('T')[0],
                        fecha: timestampFinal.split('T')[0],
                        creadoEn: timestampFinal,
                        creadoPor: "SISTEMA_NEXUS"
                    }, { merge: true });
                }
            });

            // 3️⃣ SUB-CAPA C: ENTRADAS AUXILIARES DE INSUMOS MANUALES (Gasto Operativo Directo)
            if (vInsumosIVA > 0) {
                const insumoIvaRef = doc(db, "contabilidad", `CONT_GASTO_INS_IVA_${id}`);
                batch.set(insumoIvaRef, {
                    empresaId, id_referencia: id, puc: "519535", cuenta: "519535", cuentaContable: "519535",
                    concepto: `GASTO INSUMOS CON IVA - OT: ${placaRaw.toUpperCase()}`,
                    tipo: "gasto_insumo_ot", monto: vInsumosIVA, debito: vInsumosIVA, credito: 0,
                    placa: placaPuraSola, vehiculo_detalle: placaRaw.toUpperCase(),
                    fecha_registro: timestampFinal.split('T')[0], fecha: timestampFinal.split('T')[0],
                    creadoEn: timestampFinal, creadoPor: "SISTEMA_NEXUS"
                }, { merge: true });
            }

            if (vInsumosNoIVA > 0) {
                const insumoNoIvaRef = doc(db, "contabilidad", `CONT_GASTO_INS_NOIVA_${id}`);
                batch.set(insumoNoIvaRef, {
                    empresaId, id_referencia: id, puc: "519535", cuenta: "519535", cuentaContable: "519535",
                    concepto: `GASTO INSUMOS SIN IVA - OT: ${placaRaw.toUpperCase()}`,
                    tipo: "gasto_insumo_ot", monto: vInsumosNoIVA, debito: vInsumosNoIVA, credito: 0,
                    placa: placaPuraSola, vehiculo_detalle: placaRaw.toUpperCase(),
                    fecha_registro: timestampFinal.split('T')[0], fecha: timestampFinal.split('T')[0],
                    creadoEn: timestampFinal, creadoPor: "SISTEMA_NEXUS"
                }, { merge: true });
            }

            // =========================================================================
            // 🛰️ COMMIT ATÓMICO Y DEPLOYMENT DE DATOS
            // =========================================================================
            await batch.commit();
            ordenActiva = { ...dataMision }; 
            
            hablar(estadoActual === 'ENTREGADO' ? "Misión finalizada. Caja contable desglosada y cerrada." : "Misión sincronizada en la nube de Nexus con desglose SAP/HANA.");
            
            Swal.fire({ 
                title: '🛰️ NEXUS_SYNC_OK', 
                text: `TELEMETRÍA DE ${placaPuraSola} ACTUALIZADA EN LIBRO DIARIO`,
                icon: 'success', background: '#0d1117', color: '#06b6d4',
                confirmButtonColor: '#06b6d4'
            });

            document.getElementById("nexus-terminal").classList.add("hidden");

        } catch (e) {
            console.error("QUANTUM_CORE_FAIL:", e);
            btn.disabled = false;
            btn.innerHTML = `🛰️ PUSH_TO_NEXUS_CLOUD`;
            Swal.fire({ title: '🚨 CRITICAL_ERROR', text: `FALLO EN SINCRONIZACIÓN AUTOMÁTICA: ${e.message}`, icon: 'error', background: '#0d1117', color: '#f87171' });
        }
    };

    const cargarEscuchaOrdenes = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        
        onSnapshot(q, (snap) => {
            const grid = document.getElementById("grid-ordenes");
            if (!grid) return;

            grid.innerHTML = snap.docs.map(d => {
                const info = d.data();
                const config = NEXUS_ASCENSOR[info.tipo_orden] || NEXUS_ASCENSOR.MECANICA;
                
                const total = Number(info.total || info.costos_totales?.total || 0);
                const anticiposTotales = Number(info.anticipo || 0); 
                const saldoReal = info.saldo_pendiente !== undefined ? Number(info.saldo_pendiente) : (total - anticiposTotales);

                const saldoColor = saldoReal > 0 ? 'text-red-400' : 'text-emerald-400';
                const statusIcon = saldoReal <= 0 ? 'fa-check-circle' : 'fa-clock';
                
                const fechaVisual = info.fecha_creacion_manual ? info.fecha_creacion_manual.split('T')[0] : 'SIN FECHA';
                
                return `
                <div onclick="window.abrirTerminalNexus('${d.id}')" 
                     class="bg-[#0d1117] p-8 border border-white/5 rounded-[2.5rem] hover:border-cyan-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] transition-all cursor-pointer group relative overflow-hidden animate-in fade-in duration-500">
                    
                    <div class="absolute top-4 right-4 flex gap-3">
                        <button onclick="window.eliminarOrdenNexus('${d.id}', event)" class="text-slate-600 hover:text-red-500 transition-colors z-50">
                            <i class="fas fa-trash-alt text-xs"></i>
                        </button>
                        <i class="fas ${statusIcon} text-[10px] ${saldoColor} opacity-50"></i>
                    </div>

                    <div class="mb-6">
                        <h4 class="orbitron text-4xl font-black text-white group-hover:text-cyan-400 transition-colors tracking-tighter">${info.placa}</h4>
                        <div class="flex justify-between items-center mt-1">
                            <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">${info.cliente || 'OPERACIÓN_ANÓNIMA'}</p>
                            <span class="text-[9px] font-mono text-cyan-500/70 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/10">${fechaVisual}</span>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <div class="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                            <span class="text-[8px] orbitron text-slate-500 uppercase tracking-widest">Fase Actual</span>
                            <span class="text-[9px] orbitron font-black ${info.estado === 'ENTREGADO' ? 'text-green-400' : 'text-amber-400'} animate-pulse">
                                ${info.estado}
                            </span>
                        </div>
                        
                        <div class="flex justify-between items-center px-1 bg-white/5 p-2 rounded-lg">
                            <span class="text-[8px] orbitron text-slate-400 uppercase">Saldo Pendiente</span>
                            <span class="text-[11px] orbitron font-black ${saldoColor}">
                                $${saldoReal.toLocaleString('es-CO')}
                            </span>
                        </div>
                    </div>

                    <div class="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                        <div class="flex flex-col">
                            <span class="text-[8px] orbitron font-black px-3 py-1 rounded-md text-center" 
                                  style="background: ${config.color}20; color: ${config.color}">
                                ${config.label.toUpperCase()}
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                             <i class="fas fa-arrow-right text-slate-700 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all text-xs"></i>
                        </div>
                    </div>
                </div>`;
            }).join('');
        });
    };

    window.updateItem = (idx, campo, val) => { ordenActiva.items[idx][campo] = (campo==='costo'||campo==='venta'||campo==='cantidad')?Number(val):val; recalcularFinanzas(); };
    window.removeItemNexus = (idx) => { if(confirm("¿Desea remover este item del presupuesto?")) { ordenActiva.items.splice(idx, 1); recalcularFinanzas(); } };
    window.nexusEscuchaPlaca = () => { if(!recognition) return; recognition.start(); hablar("Placa"); recognition.onresult = (e) => { document.getElementById('f-placa').value = e.results[0][0].transcript.replace(/\s/g, '').toUpperCase(); }; };
    window.nexusDictarBitacora = () => { if(!recognition) return; recognition.start(); hablar("Dicte hallazgo"); recognition.onresult = (e) => { document.getElementById('ai-log-display').value += `\n[${new Date().toLocaleTimeString()}] ${e.results[0][0].transcript.toUpperCase()}`; }; };
    window.cambiarEstado = async (n) => { if(!ordenActiva.id) return; await setDoc(doc(db, "ordenes", ordenActiva.id), { estado: n, updatedAt: serverTimestamp() }, { merge: true }); hablar(`Fase ${n}`); };

    window.addItemNexus = async (tipo) => {
        let origen = 'TALLER', tec = 'INTERNO', costo = 0, venta = 0;
        if (tipo === 'REPUESTO') { 
            const { value: r } = await Swal.fire({ 
                title: 'ORIGEN DEL COMPONENTE', 
                input: 'select', 
                inputOptions: { 'TALLER': 'Stock Interno Bodega', 'EXTERNO': 'Adquisición Proveedor Externo' }, 
                background: '#0d1117', color: '#fff', confirmButtonColor: '#06b6d4' 
            }); 
            origen = r || 'TALLER'; 
        } else { 
            const { value: c } = await Swal.fire({ title: 'COSTO ASIGNADO DE LABOR', input: 'number', background: '#0d1117', color: '#fff', confirmButtonColor: '#06b6d4' }); 
            costo = Number(c || 0); 
            venta = analizarPrecioSugerido({ tipo: "mano_obra", costo }); 
            tec = 'TECNICO NEXUS'; 
        }
        ordenActiva.items.push({ tipo, desc: `NUEVO ${tipo}`, costo, venta, origen, tecnico: tec, cantidad: 1, fecha: new Date().toISOString() });
        recalcularFinanzas();
    };

    window.syncBitacoraLive = async (val) => {
        ordenActiva.bitacora_ia = val;
        if (ordenActiva.id) {
            const docRef = doc(db, "ordenes", ordenActiva.id);
            await setDoc(docRef, { bitacora_ia: val, updatedAt: serverTimestamp() }, { merge: true });
        }
    };

    window.renderItems = () => {
        const c = document.getElementById("items-container"); if (!c) return;
        c.innerHTML = ordenActiva.items.map((it, i) => `
            <div class="flex flex-col gap-3 bg-white/[0.03] p-5 rounded-2xl border border-white/10 mb-4 relative overflow-hidden group">
                <div class="absolute top-0 left-0 h-full w-1 ${it.tipo === 'REPUESTO' ? 'bg-cyan-500' : 'bg-red-600'}"></div>
                <div class="flex items-center gap-4">
                    <span class="text-[8px] orbitron font-black px-2 py-1 ${it.tipo === 'REPUESTO' ? (it.origen === 'TALLER' ? 'bg-cyan-500 text-black' : 'bg-amber-500 text-black') : 'bg-red-600 text-white'} rounded-sm">
                        ${it.tipo} ${it.tipo === 'REPUESTO' ? `(${it.origen})` : ''}
                    </span>
                    <input onchange="window.updateItem(${i}, 'desc', this.value)" value="${it.desc}" class="flex-1 bg-transparent text-white font-black orbitron text-xs outline-none uppercase focus:border-b border-white/10">
                    <button onclick="window.removeItemNexus(${i})" class="text-slate-600 hover:text-red-500 transition-colors"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div class="grid grid-cols-4 gap-4 items-end">
                    <div><label class="text-[7px] orbitron text-slate-500 block uppercase">Costo Unitario</label><input type="number" onchange="window.updateItem(${i}, 'costo', this.value)" value="${it.costo}" class="bg-black/50 p-2 text-red-400 text-xs rounded w-full border border-white/5 outline-none font-black orbitron"></div>
                    <div><label class="text-[7px] orbitron text-green-500 block uppercase">Venta Público</label><input type="number" onchange="window.updateItem(${i}, 'venta', this.value)" value="${it.venta}" class="bg-black/50 p-2 text-green-400 text-xs rounded w-full border border-white/5 outline-none font-black orbitron"></div>
                    <div><label class="text-[7px] orbitron text-slate-500 block uppercase font-black">Cantidad</label><input type="number" onchange="window.updateItem(${i}, 'cantidad', this.value)" value="${it.cantidad || 1}" class="bg-black/50 p-2 text-white text-xs rounded w-full border border-white/5 outline-none font-black orbitron"></div>
                    <div class="text-right text-xs font-black orbitron text-white italic">$${(it.venta * (it.cantidad || 1)).toLocaleString('es-CO')}</div>
                </div>
            </div>`).join('');
    };

    renderBase();
}
