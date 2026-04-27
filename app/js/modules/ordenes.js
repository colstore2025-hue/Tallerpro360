/**
 * ordenes.js - NEXUS-X "THE TITAN" V21.0 🛰️
 * STATUS: ULTRA-PROFESSIONAL / COPY-PASTE READY
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, updateDoc, serverTimestamp, writeBatch, increment, limit 
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
        container.innerHTML = `<div class="p-10 orbitron text-red-500">ERROR: NO_EMPRESA_ID_DETECTED</div>`;
        return;
    }

    // --- MOTOR FINANCIERO QUANTUM-SAP ---
    const recalcularFinanzas = () => {
        if (!ordenActiva) return;
        let m = { v_rep: 0, c_rep: 0, v_mo: 0, c_mo: 0 };

        ordenActiva.items.forEach(i => {
            const v = Number(i.venta || 0);
            const c = Number(i.costo || 0);
            if (i.tipo === 'REPUESTO') {
                if(i.origen !== 'CLIENTE') { m.v_rep += v; m.c_rep += c; }
            } else {
                m.v_mo += v; m.c_mo += c; 
            }
        });

        const insumosIVA = Number(document.getElementById("f-insumos-iva")?.value || 0); 
        const insumosNoIVA = Number(document.getElementById("f-insumos-no-iva")?.value || 0); 
        const anticipo = Number(document.getElementById("f-anticipo")?.value || 0); 
        
        const subtotalGravado = m.v_rep + m.v_mo + insumosIVA;
        const baseGravable = subtotalGravado / 1.19;
        const iva = subtotalGravado - baseGravable;
        const totalFactura = subtotalGravado + insumosNoIVA;
        const ebitda = (baseGravable + insumosNoIVA) - (m.c_rep + m.c_mo + (insumosIVA / 1.19));

        ordenActiva.costos_totales = { 
            total: totalFactura, base: baseGravable, iva: iva,
            saldo: totalFactura - anticipo, ebitda: ebitda
        };

        actualizarUIFinanciera();
        renderItems();
    };

    const actualizarUIFinanciera = () => {
        const { total, base, iva, ebitda, saldo } = ordenActiva.costos_totales;
        const totalEl = document.getElementById("total-factura");
        const summaryEl = document.getElementById("finance-summary");
        if(totalEl) totalEl.innerText = `$ ${Math.round(total).toLocaleString()}`;
        if(summaryEl) {
            summaryEl.innerHTML = `
                <div class="grid grid-cols-2 gap-4 border-t border-cyan-500/30 pt-6 mt-6 animate-pulse">
                    <div class="text-[10px] orbitron text-slate-500">BASE: <span class="text-white">$${Math.round(base).toLocaleString()}</span></div>
                    <div class="text-[10px] orbitron text-slate-500 text-right">IVA 19%: <span class="text-white">$${Math.round(iva).toLocaleString()}</span></div>
                    <div class="text-green-400 font-black text-2xl orbitron italic">EBITDA: $${Math.round(ebitda).toLocaleString()}</div>
                    <div class="text-red-500 font-black text-2xl orbitron text-right">SALDO: $${Math.round(saldo).toLocaleString()}</div>
                </div>`;
        }
    };

    window.recalcular = recalcularFinanzas;

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1700px] mx-auto pb-40 animate-in fade-in duration-500">
            <header class="flex justify-between items-center bg-[#0d1117] p-10 border-l-8 border-red-600 rounded-r-[3rem] mb-12 shadow-2xl">
                <div class="flex items-center gap-8">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-8xl font-black orbitron text-white w-[35rem] uppercase border-none outline-none focus:ring-2 ring-red-600 rounded-xl" placeholder="PLACA">
                    <button onclick="window.nexusVozPlaca()" class="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)]"><i class="fas fa-microphone text-3xl"></i></button>
                </div>
                <div class="text-center">
                    <span class="orbitron text-[10px] text-slate-500 block mb-2 tracking-[0.5em]">STATUS_ENGINE</span>
                    <select id="f-estado" onchange="window.recalcular()" class="bg-black text-cyan-400 orbitron font-black text-2xl p-4 rounded-2xl border border-white/5 outline-none cursor-pointer">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO_LIQUIDADO'].map(e => 
                            `<option value="${e}" ${ordenActiva.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
                    </select>
                </div>
                <button onclick="document.getElementById('nexus-terminal').classList.add('hidden')" class="w-24 h-24 bg-white/5 text-white text-4xl rounded-full hover:bg-red-600 transition-all">✕</button>
            </header>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div class="lg:col-span-4 space-y-8">
                    <div class="bg-[#0d1117] p-8 border border-white/5 rounded-[3rem] shadow-xl">
                        <h4 class="orbitron text-cyan-500 text-[11px] font-black mb-6 uppercase tracking-widest italic">Data Maestra SAP</h4>
                        <div class="space-y-4">
                            <input id="f-cliente" value="${ordenActiva.cliente || ''}" placeholder="CLIENTE / EMPRESA" class="w-full bg-black p-5 text-white font-bold uppercase text-xs border border-white/10 rounded-xl outline-none focus:border-cyan-500">
                            <input id="f-id" value="${ordenActiva.identificacion || ''}" placeholder="NIT / C.C." class="w-full bg-black p-5 text-white font-bold text-xs border border-white/10 rounded-xl">
                            <div class="grid grid-cols-2 gap-4">
                                <input id="f-telefono" value="${ordenActiva.telefono || ''}" placeholder="WHATSAPP" class="bg-black p-5 text-green-400 font-bold border border-white/10 rounded-xl">
                                <input id="f-km" value="${ordenActiva.km || ''}" placeholder="KILOMETRAJE" class="bg-black p-5 text-yellow-500 font-bold border border-white/10 rounded-xl">
                            </div>
                        </div>
                    </div>

                    <div id="pricing-slot" class="rounded-[3rem] overflow-hidden border border-cyan-500/20 bg-black/50 shadow-2xl min-h-[200px]"></div>

                    <div class="bg-black p-8 border border-red-600/20 rounded-[3rem] relative shadow-2xl">
                        <span class="orbitron text-[10px] text-red-500 font-black block mb-4 italic uppercase tracking-tighter">Historial de Hallazgos (Voice Log)</span>
                        <textarea id="f-bitacora" class="w-full bg-transparent text-slate-300 text-xs h-60 outline-none font-mono leading-relaxed" placeholder="Reporte para el cliente...">${ordenActiva.bitacora || ''}</textarea>
                        <button onclick="window.nexusVozBitacora()" class="absolute bottom-8 right-8 w-16 h-16 bg-white text-black rounded-full shadow-2xl hover:scale-110 transition-all"><i class="fas fa-microphone text-xl"></i></button>
                    </div>
                </div>

    window.nexusAddRepuesto = async () => {
        const { value: busqueda } = await Swal.fire({ 
            title: 'NEXUS STOCK SYSTEM', 
            input: 'text', inputPlaceholder: 'Nombre del repuesto...',
            background: '#0a0f18', color: '#fff', customClass: { input: 'orbitron uppercase' }
        });
        
        if(busqueda) {
            const q = query(collection(db, "productos"), 
                where("empresaId", "==", empresaId), 
                where("nombre", ">=", busqueda.toUpperCase()), 
                where("nombre", "<=", busqueda.toUpperCase() + '\uf8ff'),
                limit(10));
            const snap = await getDocs(q);
            const prods = snap.docs.map(d => ({id: d.id, ...d.data()}));
            
            if(prods.length > 0) {
                const options = Object.fromEntries(prods.map(p => [p.id, `${p.nombre} (STOCK: ${p.stock || 0} | $${(p.venta || 0).toLocaleString()})`]));
                const { value: selId } = await Swal.fire({ title: 'VINCULAR ITEM REAL', input: 'select', inputOptions: options, background: '#0a0f18', color: '#fff' });
                if(selId) {
                    const p = prods.find(x => x.id === selId);
                    ordenActiva.items.push({ 
                        tipo: 'REPUESTO', desc: p.nombre, costo: Number(p.costo || 0), 
                        venta: Number(p.venta || 0), idRef: p.id, origen: 'TALLER', cantidad: 1 
                    });
                    recalcularFinanzas();
                    hablar(`Item ${p.nombre} vinculado.`);
                }
            } else {
                const { value: ext } = await Swal.fire({ title: 'STOCK NO DISPONIBLE', input: 'text', text: 'Nombre del repuesto externo:', background: '#0a0f18', color: '#fff' });
                if(ext) {
                    ordenActiva.items.push({ tipo: 'REPUESTO', desc: ext.toUpperCase(), costo: 0, venta: 0, origen: 'EXTERNO', cantidad: 1 });
                    recalcularFinanzas();
                }
            }
        }
    };

    // Al final del renderTerminal, justo después de recalcularFinanzas();
    renderModuloPricing(document.getElementById('pricing-slot'));
    }; // Cierre de renderTerminal

    // --- PUENTE DE FUNCIONES GLOBALES (CRÍTICO) ---
    window.recalcular = recalcularFinanzas;
    window.updateItem = (idx, campo, valor) => {
        ordenActiva.items[idx][campo] = (campo === 'desc') ? valor.toUpperCase() : Number(valor);
        recalcularFinanzas();
    };
    window.nexusAddMO = () => {
        ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: 'SERVICIO TÉCNICO ESPECIALIZADO', costo: 0, venta: 0 });
        recalcularFinanzas();
    };
    
    // Inicia la UI Base
    renderBase(); 
}
