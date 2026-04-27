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

// --- RECONOCIMIENTO DE VOZ (NEURAL LINK) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
    
    // Acumuladores con tipado estricto
    let m = { v_rep: 0, c_rep: 0, v_mo: 0, c_mo: 0, v_ins_iva: 0, v_ins_no_iva: 0 };

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

    // LÓGICA SAP: Desglose de Impuestos
    const subtotalGravado = m.v_rep + m.v_mo + insumosIVA;
    const baseGravable = subtotalGravado / 1.19;
    const ivaTotal = subtotalGravado - baseGravable;
    const totalFinal = subtotalGravado + insumosNoIVA;

    // EBITDA REAL: (Ingresos Netos - Costos Totales Operativos)
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

    actualizarUIFinanciera();
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

    // --- 2. TRAZABILIDAD HARLEY-DAVIDSON (LINK GENERATOR) ---
    const enviarNotificacionNexus = (proceso) => {
    // La URL de trazabilidad es un documento HTML dinámico que lee de Firebase
    const linkServidor = `https://tallerpro360.web.app/trace/${ordenActiva.id}`;
    const tallerNombre = "NEXUS-X TITAN WORKSHOP"; // Podrías traerlo de empresaId
    
    let template = "";
    switch(proceso) {
        case 'INGRESO':
            template = `*${tallerNombre}*%0A%0A🛰️ *STATUS: INGRESO CONFIRMADO*%0A------------------------------%0AHola *${ordenActiva.cliente}*, su vehículo *[${ordenActiva.placa}]* ha entrado a boxes. %0A%0A📊 *INFORME INICIAL:*%0A${ordenActiva.bitacora_ia.substring(0, 100)}...%0A%0A🌐 *SIGA EL PROGRESO EN VIVO (NEON UI):*%0A${linkServidor}`;
            break;
        case 'FINAL':
            template = `*${tallerNombre}*%0A%0A✅ *STATUS: VEHÍCULO LISTO*%0A------------------------------%0AEstimado *${ordenActiva.cliente}*, la misión en su vehículo *[${ordenActiva.placa}]* ha finalizado con éxito.%0A%0A💰 *TOTAL A PAGAR:* $${Math.round(ordenActiva.costos_totales.total).toLocaleString()}%0A💳 *SALDO:* $${Math.round(ordenActiva.costos_totales.saldo).toLocaleString()}%0A%0A📥 *VER FACTURA Y DETALLES TÉCNICOS:*%0A${linkServidor}`;
            break;
    }
    window.open(`https://wa.me/57${ordenActiva.telefono}?text=${template}`, '_blank');
};

    // --- 3. UI BASE (NEON MATRIX V16) ---
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

    // --- 4. TERMINAL DE OPERACIONES (EXPERIENCIA PRO) ---
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
                
                <div class="flex items-center gap-4 bg-black/50 p-4 rounded-2xl border border-white/5">
                    <span class="orbitron text-[9px] text-slate-500">FASE:</span>
                    <select id="f-estado" onchange="window.cambiarEstado(this.value)" class="bg-transparent text-cyan-400 orbitron font-black text-xl outline-none">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(e => 
                            `<option value="${e}" ${ordenActiva.estado === e ? 'selected' : ''} class="bg-black">${e}</option>`).join('')}
                    </select>
                </div>

                <button id="btnCloseTerminal" class="w-20 h-20 bg-red-600 text-white text-3xl font-black rounded-2xl hover:rotate-90 transition-all">✕</button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-[#0d1117] p-8 border border-white/5 rounded-3xl">
                        <h4 class="orbitron font-black text-cyan-500 text-[11px] mb-6 uppercase tracking-widest">Client & Harley Experience</h4>
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
                        <span class="orbitron text-[9px] text-red-500 font-black block mb-4 italic">NEURAL_BITACORA (Hallazgos IA)</span>
                        <textarea id="ai-log-display" class="w-full bg-transparent text-slate-300 text-xs h-32 outline-none font-mono" placeholder="Escuchando voz técnica...">${ordenActiva.bitacora_ia || ''}</textarea>
                        <button onclick="window.nexusDictarBitacora()" class="absolute bottom-6 right-6 w-12 h-12 bg-white text-black rounded-full shadow-2xl"><i class="fas fa-microphone"></i></button>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 border border-cyan-500/10 rounded-[3rem] relative shadow-2xl">
                        <div class="flex justify-between items-start mb-12">
                            <div>
                                <h2 id="total-factura" class="orbitron text-[8rem] font-black text-white italic leading-none">$ 0</h2>
                                <p class="text-cyan-400 orbitron font-bold text-xs mt-4 tracking-widest uppercase">TOTAL FACTURADO CONSOLIDADO</p>
                            </div>
                            <div id="finance-summary" class="w-80"></div>
                        </div>
                        
                        <div id="items-container" class="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scroll"></div>
                        
                        <div class="grid grid-cols-2 gap-6 mt-12">
                            <button onclick="window.addItemNexus('REPUESTO')" class="py-6 border-2 border-white/10 orbitron text-[10px] font-black text-white hover:bg-white hover:text-black transition-all rounded-2xl">+ ADD_PART</button>

                            <button onclick="window.addItemNexus('MANO_OBRA')" class="py-6 border-2 border-red-600/20 orbitron text-[10px] font-black text-red-600 hover:bg-red-600 hover:text-white transition-all rounded-2xl">+ ADD_LABOR</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-6">
                        <div class="bg-black p-6 rounded-3xl border border-white/5">
                            <label class="orbitron text-[9px] text-slate-500 block mb-2 italic uppercase">Insumos (Con IVA)</label>
                            <input id="f-insumos-iva" value="${ordenActiva.insumos || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-white text-4xl font-black w-full outline-none">
                        </div>
                        <div class="bg-black p-6 rounded-3xl border border-white/5">
                            <label class="orbitron text-[9px] text-yellow-500 block mb-2 italic uppercase">Insumos (Sin IVA)</label>
                            <input id="f-insumos-no-iva" value="${ordenActiva.insumos_no_iva || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-yellow-500 text-4xl font-black w-full outline-none">
                        </div>
                        <div class="bg-black p-6 rounded-3xl border border-white/5">
                            <label class="orbitron text-[9px] text-green-500 block mb-2 uppercase">Anticipo</label>
                            <input id="f-anticipo" value="${ordenActiva.anticipo || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-green-400 text-4xl font-black w-full outline-none">
                        </div>
                    </div>

                    <button id="btnSincronizar" class="w-full bg-cyan-500 text-black py-10 orbitron font-black text-4xl rounded-[2rem] hover:bg-white transition-all shadow-[0_0_50px_rgba(0,242,255,0.2)]">🛰️ PUSH_TO_NEXUS_CLOUD</button>
                </div>
            </div>
        </div>`;
        
        renderModuloPricing(document.getElementById('pricing-engine-container'));
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    // --- 5. FUNCIONES DE ACCIÓN Y ANEXOS (VOZ, MULTIMEDIA, SYNC) ---
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

    window.nexusCamara = async () => {
        const { value: file } = await Swal.fire({
            title: 'CAPTURA DE EVIDENCIA',
            input: 'file',
            inputAttributes: { 'accept': 'image/*', 'capture': 'environment' },
            background: '#0d1117', color: '#fff',
            confirmButtonText: 'UPLOAD_TO_CLOUD'
        });
        if (file) hablar("Subiendo evidencia visual");
    };

    window.cambiarEstado = async (nuevoEstado) => {
        if(!ordenActiva.id) return;
        try {
            const batch = writeBatch(db);
            batch.update(doc(db, "ordenes", ordenActiva.id), { estado: nuevoEstado, updatedAt: serverTimestamp() });
            await batch.commit();
            hablar(`Fase ${nuevoEstado}`);
            Swal.fire({ toast: true, position: 'top-end', title: `ESTADO: ${nuevoEstado}`, icon: 'info', timer: 2000, background: '#0d1117', color: '#fff', showConfirmButton: false });
        } catch (e) { console.error(e); }
    };

    window.addItemNexus = async (tipo) => {

    let origen = 'TALLER';
    let tec = 'INTERNO';
    let costo = 0;
    let venta = 0;

    if(tipo === 'REPUESTO'){

        const { value: res } = await Swal.fire({
            title: 'ORIGEN REPUESTO',
            input: 'select',
            inputOptions: {
                'TALLER': 'Stock Taller',
                'CLIENTE': 'Cliente (Costo $0)'
            },
            background: '#0d1117',
            color: '#fff'
        });

        origen = res || 'TALLER';

        if(origen === 'CLIENTE'){
            costo = 0;
            venta = 0;
        } else {
            const sugerido = analizarPrecioSugerido({
                tipo: "repuesto",
                costo: 0
            });
            venta = sugerido || 0;
        }

    } else {

        const { value:t } = await Swal.fire({
            title:'ASIGNAR TÉCNICO',
            input:'text',
            background:'#0d1117',
            color:'#fff'
        });

        tec = t || 'POR ASIGNAR';

        const { value:c } = await Swal.fire({
            title:'COSTO TÉCNICO',
            input:'number',
            background:'#0d1117',
            color:'#fff'
        });

        costo = Number(c || 0);

        // 🔥 PRICING AUTOMÁTICO MANO DE OBRA
        const sugerido = analizarPrecioSugerido({
            tipo: "mano_obra",
            costo: costo
        });

        venta = sugerido || (costo * 2);
    }

    ordenActiva.items.push({
        tipo,
        desc: `NUEVO ${tipo}`,
        costo,
        venta,
        origen,
        tecnico: tec,
        cantidad: 1
    });

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

            const data = {
                ...ordenActiva,
                id, placa, empresaId,
                cliente: document.getElementById("f-cliente").value,
                telefono: document.getElementById("f-telefono").value,
                anticipo: Number(document.getElementById("f-anticipo").value),
                insumos: Number(document.getElementById("f-insumos-iva").value),
                insumos_no_iva: Number(document.getElementById("f-insumos-no-iva").value),
                bitacora_ia: document.getElementById("ai-log-display").value,
                updatedAt: serverTimestamp()
            };

            batch.set(doc(db, "ordenes", id), data);
            
            // Asiento Contable Protegido
            batch.set(doc(db, "contabilidad", `CONT_${id}`), {
                empresaId, total: data.costos_totales.total, 
                utilidad: data.costos_totales.ebitda, fecha: serverTimestamp(), placa 
            });

            await batch.commit();

ordenActiva.id = id; // 🔥 CLAVE

hablar("Orden guardada correctamente");

Swal.fire({
    title: '✅ ORDEN GUARDADA',
    html: `
        <b>Placa:</b> ${placa}<br>
        <b>Total:</b> $${Math.round(data.costos_totales.total).toLocaleString()}<br>
        <b>ID:</b> ${id}
    `,
    icon: 'success',
    background: '#0d1117',
    color: '#fff'
});
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (e) {
            console.error(e);
            btn.disabled = false;
            btn.innerHTML = `🛰️ PUSH_TO_NEXUS_CLOUD`;
        }
    };

// --- SISTEMA DE LUPA (INVENTARIO PRO) ---
window.agregarDesdeInventario = async () => {
    try {
        const { getDocs, query, collection, where } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
        const q = query(collection(db, "inventario"), where("empresaId", "==", localStorage.getItem("nexus_empresaId")));
        const snap = await getDocs(q);

        if (snap.empty) return Swal.fire("INFO", "Inventario vacío en la nube", "warning");

        const opciones = {};
        snap.forEach(d => {
            const data = d.data();
            opciones[d.id] = `${data.nombre.toUpperCase()} - [STOCK: ${data.stock || 0}] - $${Number(data.precioVenta).toLocaleString()}`;
        });

        const { value: itemId } = await Swal.fire({
            title: 'LUPA DE INVENTARIO NEXUS',
            input: 'select',
            inputOptions: opciones,
            placeholder: 'Seleccione repuesto...',
            showCancelButton: true,
            background: '#05070a', color: '#fff', confirmButtonColor: '#00f2ff'
        });

        if (itemId) {
            const itemDoc = snap.docs.find(d => d.id === itemId).data();
            const sugerido = analizarPrecioSugerido({ tipo: "repuesto", costo: itemDoc.precioCosto });

            ordenActiva.items.push({
                tipo: 'REPUESTO',
                desc: itemDoc.nombre,
                costo: itemDoc.precioCosto || 0,
                venta: sugerido || itemDoc.precioVenta,
                cantidad: 1,
                origen: 'TALLER',
                idRef: itemId
            });
            recalcularFinanzas();
            hablar("Item de inventario vinculado");
        }
    } catch (e) { console.error("Error Lupa:", e); }
};

// --- EDICIÓN EN TIEMPO REAL (ELIMINA EL "NADA SIRVE") ---
window.updateItem = (idx, campo, valor) => {
    const val = (campo === 'costo' || campo === 'venta' || campo === 'cantidad') ? Number(valor) : valor;
    ordenActiva.items[idx][campo] = val;
    
    // Auto-recalcular sin cerrar el flujo
    const subtotalGravado = (ordenActiva.items[idx].venta * ordenActiva.items[idx].cantidad);
    console.log(`Update: Item ${idx} -> ${campo}: ${val}`);
    recalcularFinanzas();
};

    window.renderItems = () => {
    const container = document.getElementById("items-container");
    if(!container) return;
    
    container.innerHTML = ordenActiva.items.map((item, idx) => `
        <div class="flex flex-col gap-2 bg-white/[0.02] p-4 rounded-xl border border-white/5 mb-4 group hover:border-cyan-500/50 transition-all">
            <div class="flex items-center gap-4">
                <span class="text-[9px] orbitron p-1 ${item.tipo === 'REPUESTO' ? 'bg-cyan-500 text-black' : 'bg-red-600 text-white'}">${item.tipo}</span>
                <input onchange="window.updateItem(${idx}, 'desc', this.value)" value="${item.desc}" class="flex-1 bg-transparent text-white font-black orbitron text-xs outline-none uppercase">
                <button onclick="window.removeItemNexus(${idx})" class="text-slate-600 hover:text-red-500"><i class="fas fa-trash-alt"></i></button>
            </div>
            
            <div class="grid grid-cols-4 gap-2">
                <div class="flex flex-col">
                    <label class="text-[8px] text-slate-500 orbitron">COSTO UNIT</label>
                    <input type="number" onchange="window.updateItem(${idx}, 'costo', this.value)" value="${item.costo}" class="bg-black/40 p-2 text-red-500 text-[10px] orbitron rounded border border-white/5">
                </div>
                <div class="flex flex-col">
                    <label class="text-[8px] text-green-500 orbitron">VENTA UNIT</label>
                    <input type="number" onchange="window.updateItem(${idx}, 'venta', this.value)" value="${item.venta}" class="bg-black/40 p-2 text-green-400 text-[10px] orbitron rounded border border-white/5">
                </div>
                <div class="flex flex-col">
                    <label class="text-[8px] text-slate-500 orbitron">CANT</label>
                    <input type="number" onchange="window.updateItem(${idx}, 'cantidad', this.value)" value="${item.cantidad || 1}" class="bg-black/40 p-2 text-white text-[10px] orbitron rounded border border-white/5">
                </div>
                <div class="flex flex-col justify-end">
                    <span class="text-[10px] text-right font-bold text-cyan-400">$${(item.venta * (item.cantidad || 1)).toLocaleString()}</span>
                </div>
            </div>
            ${item.tipo === 'MANO_OBRA' ? `<div class="text-[8px] text-slate-500 italic">Asignado a: ${item.tecnico}</div>` : ''}
        </div>
    `).join('');
};

    window.removeItemNexus = (idx) => {
    if(!confirm("¿Eliminar item?")) return;

    ordenActiva.items.splice(idx, 1);

    hablar("Item eliminado");

    recalcularFinanzas();
};

    const vincularEventosBase = () => {
        document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus();
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
            ordenActiva = { placa:'', estado:'INGRESO', items:[], cliente_data:{}, anticipo:0, insumos:0, insumos_no_iva:0, bitacora_ia:'' };
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
                <div onclick="window.abrirTerminalNexus('${d.id}')" class="bg-[#0d1117] p-8 border border-white/5 rounded-[2.5rem] hover:border-cyan-500 transition-all cursor-pointer group shadow-xl">
                    <h4 class="orbitron text-4xl font-black text-white group-hover:text-cyan-400 mb-2">${o.placa}</h4>
                    <p class="text-[10px] text-slate-500 mb-4 font-bold uppercase">${o.cliente || 'CLIENTE S/N'}</p>
                    <div class="pt-4 border-t border-white/5 flex justify-between items-center">
                        <span class="orbitron text-green-400 font-black">$ ${Math.round(o.costos_totales?.total || 0).toLocaleString()}</span>
                        <span class="text-[8px] orbitron bg-red-600/20 text-red-500 px-3 py-1 rounded-full uppercase">${o.estado}</span>
                    </div>
                </div>`;
            }).join('');
        });
    };

    renderBase();
}
