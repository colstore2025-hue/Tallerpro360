/**
 * TallerPRO360 - V20.0 QUANTUM-SAP 🛰️
 * RELOJ SUIZO DE PRECISIÓN INTEGRAL
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS & GEMINI AI PRO
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

    // --- 1. MOTOR DE BÚSQUEDA REACTIVO (CONEXIÓN INVENTARIO.JS) ---
    const buscarEnInventario = async (termino) => {
        if (!termino || termino.length < 3) return [];
        const q = query(
            collection(db, "productos"), 
            where("empresaId", "==", empresaId),
            where("nombre", ">=", termino.toUpperCase()),
            where("nombre", "<=", termino.toUpperCase() + "\uf8ff"),
            limit(5)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    // --- 2. MOTOR FINANCIERO SAP (EBITDA & TAXES) ---
    const recalcularFinanzasQuantum = () => {
        if (!ordenActiva) return;
        let m = { v_rep: 0, c_rep: 0, v_mo: 0, c_mo: 0 };

        ordenActiva.items.forEach(i => {
            const v = Number(i.venta || 0);
            const c = Number(i.costo || 0);
            if (i.tipo === 'REPUESTO') {
                m.v_rep += v; 
                m.c_rep += c;
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
        
        // EBITDA REAL: Base + No IVA - Costos Directos
        const utilidadNeta = (baseGravable + insumosNoIVA) - (m.c_rep + m.c_mo + (insumosIVA / 1.19));

        ordenActiva.costos_totales = { 
            total: totalFactura, base: baseGravable, iva: iva,
            saldo: totalFactura - anticipo, ebitda: utilidadNeta
        };

        actualizarUIFinanciera(totalFactura, baseGravable, iva, utilidadNeta, ordenActiva.costos_totales.saldo);
        renderItems();
    };

    const actualizarUIFinanciera = (t, b, i, e, s) => {
        const totalEl = document.getElementById("total-factura");
        const summaryEl = document.getElementById("finance-summary");
        if(totalEl) totalEl.innerText = `$ ${Math.round(t).toLocaleString()}`;
        if(summaryEl) {
            summaryEl.innerHTML = `
                <div class="grid grid-cols-2 gap-4 border-t border-red-600/30 pt-4 mt-4">
                    <div class="text-[9px] orbitron text-slate-500">BASE: <span class="text-white">$${Math.round(b).toLocaleString()}</span></div>
                    <div class="text-[9px] orbitron text-slate-500 text-right">IVA 19%: <span class="text-white">$${Math.round(i).toLocaleString()}</span></div>
                    <div class="text-cyan-400 font-black text-xl orbitron italic">EBITDA: $${Math.round(e).toLocaleString()}</div>
                    <div class="text-red-500 font-black text-xl orbitron text-right">SALDO: $${Math.round(s).toLocaleString()}</div>
                </div>`;
        }
    };
    // --- 3. RENDER TERMINAL QUANTUM ---
    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1700px] mx-auto pb-40 animate-in slide-in-from-bottom duration-500">
            <header class="flex justify-between items-center bg-[#0a0f18] p-10 rounded-[3rem] border-l-[10px] border-red-600 mb-10 shadow-2xl">
                <div class="flex items-center gap-8">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-transparent text-8xl font-black orbitron text-white w-[30rem] uppercase outline-none" placeholder="PLACA">
                    <button onclick="window.quantumVozPlaca()" class="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)]"><i class="fas fa-microphone text-3xl"></i></button>
                </div>

                <div class="flex flex-col items-center">
                    <span class="text-[10px] orbitron text-slate-500 mb-2 tracking-widest">STATUS_CONTROL</span>
                    <select id="f-estado" onchange="window.cambiarEstado(this.value)" class="bg-black text-white orbitron font-black text-2xl p-4 rounded-2xl border border-white/10">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO_LIQUIDADO'].map(e => 
                            `<option value="${e}" ${ordenActiva.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
                    </select>
                </div>

                <button id="btnCloseTerminal" class="w-24 h-24 bg-white/5 text-white text-4xl rounded-full hover:bg-red-600 transition-all">✕</button>
            </header>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <aside class="lg:col-span-4 space-y-6">
                    <div class="bg-[#0a0f18] p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                        <h4 class="orbitron text-cyan-500 text-[10px] font-black mb-6 uppercase italic">Data Maestra SAP (Cliente & Vehículo)</h4>
                        <div class="space-y-4">
                            <input id="f-cliente" value="${ordenActiva.cliente || ''}" placeholder="RAZÓN SOCIAL / NOMBRE" class="w-full bg-black p-5 rounded-xl text-white font-bold uppercase border border-white/5 text-xs">
                            <input id="f-identificacion" value="${ordenActiva.identificacion || ''}" placeholder="NIT / CÉDULA (FACTURACIÓN)" class="w-full bg-black p-5 rounded-xl text-white font-bold border border-white/5 text-xs">
                            <div class="grid grid-cols-2 gap-4">
                                <input id="f-telefono" value="${ordenActiva.telefono || ''}" placeholder="WHATSAPP" class="bg-black p-5 rounded-xl text-green-400 font-bold border border-white/5 text-xs">
                                <input id="f-km" value="${ordenActiva.km || ''}" placeholder="KILOMETRAJE" class="bg-black p-5 rounded-xl text-yellow-500 font-bold border border-white/5 text-xs">
                            </div>
                        </div>
                    </div>

                    <div class="bg-black p-8 rounded-[2.5rem] border border-red-600/20 relative">
                        <span class="orbitron text-[9px] text-red-500 block mb-4 italic uppercase">Neural Bitácora (Hallazgos Técnicos)</span>
                        <textarea id="f-bitacora" class="w-full bg-transparent h-40 text-slate-300 text-xs font-mono outline-none" placeholder="Dictar reporte...">${ordenActiva.bitacora || ''}</textarea>
                        <button onclick="window.quantumVozBitacora()" class="absolute bottom-6 right-6 w-14 h-14 bg-white text-black rounded-full shadow-2xl"><i class="fas fa-microphone"></i></button>
                    </div>
                </aside>

                <main class="lg:col-span-8">
                    <div class="bg-[#0a0f18] p-10 rounded-[4rem] border border-white/5 shadow-2xl">
                        <div class="flex justify-between items-start mb-10">
                            <h2 id="total-factura" class="orbitron text-[9rem] font-black text-white italic leading-none tracking-tighter">$ 0</h2>
                            <div id="finance-summary" class="w-96"></div>
                        </div>

                        <div id="items-container" class="space-y-3 max-h-[500px] overflow-y-auto pr-4 custom-scroll"></div>

                        <div class="grid grid-cols-2 gap-6 mt-10">
                            <button onclick="window.quantumAddRepuesto()" class="py-8 border-2 border-dashed border-cyan-500/30 text-cyan-500 orbitron text-[10px] font-black rounded-3xl hover:bg-cyan-500/10 transition-all uppercase">Vincular Inventario.js</button>
                            <button onclick="window.quantumAddMO()" class="py-8 border-2 border-dashed border-red-600/30 text-red-600 orbitron text-[10px] font-black rounded-3xl hover:bg-red-600/10 transition-all uppercase">Añadir Mano de Obra</button>
                        </div>
                    </div>
                </main>
            </div>
        </div>`;
        vincularEventosTerminal();
        recalcularFinanzasQuantum();
    };
    window.quantumVozPlaca = () => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.interimResults = false;
        recognition.lang = 'es-CO';
        hablar("Dictar placa ahora");
        
        // Blindaje: El micro solo abre tras terminar de hablar
        setTimeout(() => {
            recognition.start();
        }, 1200);

        recognition.onresult = (e) => {
            let txt = e.results[0][0].transcript.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if(txt.length >= 3) {
                document.getElementById('f-placa').value = txt;
                hablar(`Placa ${txt} procesada`);
            }
        };
    };

    window.quantumAddRepuesto = async () => {
        const { value: query } = await Swal.fire({
            title: 'BUSCAR EN STOCK',
            input: 'text',
            background: '#0a0f18', color: '#fff',
            inputPlaceholder: 'Nombre del repuesto...'
        });

        if(query) {
            const productos = await buscarEnInventario(query);
            if(productos.length > 0) {
                const options = Object.fromEntries(productos.map(p => [p.id, `${p.nombre} ($${p.venta}) - Stock: ${p.stock}`]));
                const { value: selId } = await Swal.fire({ title: 'SELECCIONE PRODUCTO', input: 'select', inputOptions: options, background: '#0a0f18', color: '#fff' });
                
                if(selId) {
                    const p = productos.find(x => x.id === selId);
                    ordenActiva.items.push({ tipo: 'REPUESTO', desc: p.nombre, costo: p.costo, venta: p.venta, idRef: p.id });
                    recalcularFinanzasQuantum();
                }
            } else {
                Swal.fire('SIN RESULTADOS', 'No existe en inventario.js', 'warning');
            }
        }
    };

    window.enviarWhatsAppQuantum = async (proceso) => {
        const id = ordenActiva.id;
        if(!id) return Swal.fire('Error', 'Sincronice primero para generar ID', 'error');

        const link = `https://tallerpro360.web.app/trace/${id}`;
        let msg = "";
        const cliente = document.getElementById("f-cliente").value;
        const placa = document.getElementById("f-placa").value;

        if(proceso === 'INGRESO') msg = `🛠️ *NEXUS_X: INGRESO*%0AHola *${cliente}*, vehículo *${placa}* recibido. Seguimiento: ${link}`;
        if(proceso === 'READY') msg = `✅ *NEXUS_X: LISTO*%0A*${cliente}*, su vehículo *${placa}* está listo para entrega. Detalle: ${link}`;

        window.open(`https://wa.me/57${document.getElementById("f-telefono").value}?text=${msg}`, '_blank');
    };

    const sincronizarQuantum = async () => {
        const batch = writeBatch(db);
        const placa = document.getElementById("f-placa").value.toUpperCase();
        const id = ordenActiva.id || `OT_${placa}_${Date.now()}`;

        const finalData = {
            ...ordenActiva,
            id, placa, empresaId,
            cliente: document.getElementById("f-cliente").value.toUpperCase(),
            identificacion: document.getElementById("f-identificacion").value,
            telefono: document.getElementById("f-telefono").value,
            km: document.getElementById("f-km").value,
            bitacora: document.getElementById("f-bitacora").value,
            insumos: Number(document.getElementById("f-insumos-iva").value),
            insumos_no_iva: Number(document.getElementById("f-insumos-no-iva").value),
            anticipo: Number(document.getElementById("f-anticipo").value),
            updatedAt: serverTimestamp()
        };

        batch.set(doc(db, "ordenes", id), finalData);
        
        // Limpieza de parrilla: Solo se muestra si no está liquidado
        if(finalData.estado === 'CANCELADO_LIQUIDADO') {
            hablar("Orden liquidada y retirada de la parrilla");
        }

        await batch.commit();
        ordenActiva.id = id; // Actualizar ID local para el link de WhatsApp
        Swal.fire({ title: 'QUANTUM SYNC OK', icon: 'success', background: '#0a0f18', color: '#fff' });
    };

    // --- RENDER BASE Y ESCUCHA (PARRILLA LIMPIA) ---
    const cargarParrillaQuantum = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const grid = document.getElementById("grid-ordenes");
            if (!grid) return;
            grid.innerHTML = snap.docs
                .filter(d => d.data().estado !== 'CANCELADO_LIQUIDADO') // FILTRO SAP DE LIMPIEZA
                .map(d => {
                    const o = d.data();
                    return `
                    <div onclick="window.abrirTerminal('${d.id}')" class="bg-[#0d1117] p-8 border border-white/5 rounded-[2.5rem] hover:border-red-600 transition-all cursor-pointer group shadow-xl">
                        <div class="flex justify-between items-start mb-4">
                            <h4 class="orbitron text-5xl font-black text-white group-hover:text-red-500">${o.placa}</h4>
                            <span class="text-[8px] orbitron bg-white/5 px-3 py-1 rounded-full text-cyan-400">${o.estado}</span>
                        </div>
                        <p class="text-[10px] text-slate-500 mb-6 font-bold uppercase">${o.cliente || 'S/N'}</p>
                        <div class="flex justify-between items-center pt-4 border-t border-white/5">
                            <span class="orbitron text-white font-black">$ ${Math.round(o.costos_totales?.total || 0).toLocaleString()}</span>
                            <i class="fas fa-chevron-right text-red-600"></i>
                        </div>
                    </div>`;
                }).join('');
        });
    };

    // Vincular funciones globales necesarias
    window.abrirTerminal = (id) => {
        if(id) getDoc(doc(db, "ordenes", id)).then(s => { ordenActiva = { id, ...s.data() }; renderTerminal(); });
        else { ordenActiva = { placa:'', estado:'INGRESO', items:[], anticipo:0 }; renderTerminal(); }
        document.getElementById("nexus-terminal").classList.remove("hidden");
    };
    
    // Iniciar Sistema
    // (Asegúrate de llamar a renderBase() y cargarParrillaQuantum() al final)
}
