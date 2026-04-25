/**
 * ordenes.js - NEXUS-X "THE TITAN" V9.0 🛰️
 * EDICIÓN: HARLEY-DAVIDSON PREMIUM / SAP LEGAL COMPLIANCE
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, 
    setDoc, serverTimestamp, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { analizarPrecioSugerido, renderModuloPricing } from "../ai/pricingEnginePRO360.js";

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;
    let faseActual = 'INGRESO';

    // --- 1. NÚCLEO DE CÁLCULO FINANCIERO (FACTURACIÓN ESTILO COLOMBIA) ---
    const recalcularFinanzas = () => {
        if (!ordenActiva) return;
        let m = { v_rep: 0, c_rep: 0, v_mo: 0, c_mo: 0, tiempo: 0 };

        ordenActiva.items.forEach(i => {
            const v = Number(i.venta || 0);
            const c = Number(i.costo || 0);
            m.tiempo += Number(i.tiempo_estimado || 0);
            
            if (i.tipo === 'REPUESTO') {
                m.v_rep += v;
                if(i.origen === 'TALLER') m.c_rep += c;
            } else {
                m.v_mo += v;
                m.c_mo += c; // Pago a técnico
            }
        });

        const insumos = Number(document.getElementById("f-gastos-varios")?.value || 0); 
        const anticipo = Number(document.getElementById("f-anticipo-cliente")?.value || 0); 
        
        const totalFactura = m.v_rep + m.v_mo; 
        const baseGravable = totalFactura / 1.19;
        const iva = totalFactura - baseGravable;
        const utilidadNeta = baseGravable - (m.c_rep + m.c_mo + insumos);

        ordenActiva.costos_totales = { 
            total: totalFactura, 
            base: baseGravable,
            iva: iva,
            saldo: totalFactura - anticipo, 
            ebitda: utilidadNeta 
        };

        // Renderizado de Totales Estilo Factura
        const totalEl = document.getElementById("total-factura");
        if(totalEl) {
            totalEl.innerText = `$ ${Math.round(totalFactura).toLocaleString()}`;
            document.getElementById("finance-summary").innerHTML = `
                <div class="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                    <div class="text-[9px] orbitron text-slate-500">BASE: $${Math.round(baseGravable).toLocaleString()}</div>
                    <div class="text-[9px] orbitron text-slate-500 text-right">IVA (19%): $${Math.round(iva).toLocaleString()}</div>
                    <div class="text-emerald-400 font-black text-xl orbitron">EBITDA: $${Math.round(utilidadNeta).toLocaleString()}</div>
                    <div class="text-red-500 font-black text-xl orbitron text-right">SALDO: $${Math.round(ordenActiva.costos_totales.saldo).toLocaleString()}</div>
                </div>`;
        }
        renderItems();
    };

    // --- 2. INTERFAZ DE USUARIO (THE HARLEY DARK MODE) ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-black min-h-screen text-slate-100 font-sans pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-end gap-6 mb-16 border-b-2 border-red-600 pb-10">
                <div class="space-y-1">
                    <h1 class="orbitron text-7xl font-black italic tracking-tighter text-white">NEXUS<span class="text-red-600">_X</span></h1>
                    <p class="text-[10px] orbitron text-red-600 font-bold tracking-[0.8em] uppercase italic">Harley Custom Logistics & Workshop</p>
                </div>
                <button id="btnNewMission" class="px-12 py-5 bg-white text-black rounded-none orbitron text-[10px] font-black hover:bg-red-600 hover:text-white transition-all shadow-[10px_10px_0px_rgba(220,38,38,1)] uppercase">INICIAR ORDEN +</button>
            </header>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"></div>
            
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-black p-6 lg:p-12 overflow-y-auto custom-scroll"></div>
        </div>`;
        vincularEventosBase();
        cargarEscuchaOrdenes();
    };

    // --- 3. TERMINAL DE COTIZACIÓN Y FACTURACIÓN ---
    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1600px] mx-auto pb-40">
            <div class="flex justify-between items-center mb-12 bg-[#0d1117] p-10 border-l-8 border-red-600">
                <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-7xl font-black orbitron text-white w-80 uppercase border-none focus:ring-0" placeholder="PLACA">
                <div class="flex gap-4">
                    <button onclick="window.printFactura()" class="px-8 bg-white text-black orbitron font-black text-xs">PDF FACTURA</button>
                    <button id="btnCloseTerminal" class="w-20 h-20 bg-red-600 text-white text-3xl font-black">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-[#0d1117] p-8 border border-white/5">
                        <h4 class="orbitron font-black text-red-600 text-[11px] mb-6 uppercase">Datos Fiscales del Cliente</h4>
                        <div class="flex gap-2 mb-4">
                            <select id="f-tipo-doc" class="bg-black p-4 text-white orbitron text-xs border border-white/10">
                                <option value="NIT">NIT</option><option value="CC">CC</option>
                            </select>
                            <input id="f-doc" value="${ordenActiva.cliente_data?.doc || ''}" placeholder="NÚMERO" class="flex-1 bg-black p-4 text-white font-bold border border-white/10">
                        </div>
                        <input id="f-cliente" value="${ordenActiva.cliente_data?.nombre || ''}" placeholder="NOMBRE / RAZÓN SOCIAL" class="w-full bg-black p-4 mb-4 text-white font-black uppercase text-xs border border-white/10">
                        <input id="f-telefono" value="${ordenActiva.cliente_data?.telefono || ''}" placeholder="WHATSAPP (+57)" class="w-full bg-black p-4 text-emerald-400 font-bold border border-white/10">
                    </div>

                    <div id="pricing-engine-container" class="bg-red-600/5 p-8 border border-red-600/20"></div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 border border-white/5 relative">
                        <div class="flex justify-between items-start mb-12">
                            <div>
                                <h2 id="total-factura" class="orbitron text-[8rem] font-black text-white italic leading-none">$ 0</h2>
                                <p class="text-red-600 orbitron font-bold text-xs mt-4">TOTAL FACTURADO (IVA INCLUIDO)</p>
                            </div>
                            <div id="finance-summary" class="w-64 space-y-2"></div>
                        </div>
                        
                        <div id="items-container" class="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scroll"></div>
                        
                        <div class="grid grid-cols-2 gap-6 mt-12">
                            <button onclick="window.addItemNexus('REPUESTO')" class="py-6 border-2 border-white/10 orbitron text-[10px] font-black text-white hover:bg-white hover:text-black transition-all">+ AÑADIR REPUESTO</button>
                            <button onclick="window.addItemNexus('MANO_OBRA')" class="py-6 border-2 border-red-600/20 orbitron text-[10px] font-black text-red-600 hover:bg-red-600 hover:text-white transition-all">+ MANO DE OBRA</button>
                        </div>
                    </div>

                    <button id="btnSincronizar" class="w-full bg-white text-black py-10 orbitron font-black text-4xl hover:bg-red-600 hover:text-white transition-all">🛰️ PUSH TO NEXUS CLOUD</button>
                </div>
            </div>
        </div>`;
        
        renderModuloPricing(document.getElementById('pricing-engine-container'));
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    // --- 4. FUNCIONES DE ACCIÓN ---
    window.addItemNexus = async (tipo) => {
        let costo = 0;
        let tecnico = 'CASA';
        if(tipo === 'MANO_OBRA') {
            const { value: t } = await Swal.fire({ title: 'TÉCNICO', input: 'text', background: '#000', color: '#fff' });
            tecnico = t || 'PENDIENTE';
            const { value: c } = await Swal.fire({ title: 'COSTO TÉCNICO', input: 'number', background: '#000', color: '#fff' });
            costo = Number(c || 0);
        }
        ordenActiva.items.push({ tipo, desc: `NUEVO ${tipo}`, costo, venta: 0, origen: 'TALLER', tecnico, tiempo_estimado: 1 });
        recalcularFinanzas();
    };

    window.editItemNexus = (idx, campo, valor) => {
        ordenActiva.items[idx][campo] = (campo === 'desc') ? valor : Number(valor);
        recalcularFinanzas();
    };

    const ejecutarSincronizacionNexus = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true;
        btn.innerHTML = `SYNCING WITH SAP...`;

        const batch = writeBatch(db);
        const placa = document.getElementById("f-placa").value.toUpperCase();
        const id = ordenActiva.id || `OT_${placa}_${Date.now()}`;

        const data = {
            ...ordenActiva,
            id, placa, empresaId,
            cliente_data: {
                nombre: document.getElementById("f-cliente").value,
                doc: document.getElementById("f-doc").value,
                tipo_doc: document.getElementById("f-tipo-doc").value,
                telefono: document.getElementById("f-telefono").value
            },
            updatedAt: serverTimestamp()
        };

        batch.set(doc(db, "ordenes", id), data);
        await batch.commit();
        
        hablar("Orden sincronizada. Facturación lista.");
        Swal.fire({ title: 'NEXUS SYNC OK', icon: 'success', background: '#0d1117', color: '#fff' });
        btn.disabled = false;
        btn.innerHTML = `🛰️ PUSH TO NEXUS CLOUD`;
    };

    // --- RENDER DE ITEMS ---
    window.renderItems = () => {
        const container = document.getElementById("items-container");
        if(!container) return;
        container.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="flex items-center gap-6 bg-white/5 p-6 border-l-4 ${item.tipo === 'REPUESTO' ? 'border-white' : 'border-red-600'}">
                <div class="flex-1 grid grid-cols-4 gap-6">
                    <div class="col-span-2">
                        <input onchange="window.editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" class="bg-transparent text-white font-black orbitron text-sm outline-none w-full uppercase">
                        <span class="text-[8px] orbitron text-slate-500 font-bold uppercase">${item.tipo} | STAFF: ${item.tecnico || 'N/A'}</span>
                    </div>
                    <input type="number" onchange="window.editItemNexus(${idx}, 'costo', this.value)" value="${item.costo}" class="bg-black/50 p-3 text-red-500 font-black text-center orbitron text-xs" placeholder="COST">
                    <input type="number" onchange="window.editItemNexus(${idx}, 'venta', this.value)" value="${item.venta}" class="bg-black/50 p-3 text-emerald-400 font-black text-center orbitron text-xs" placeholder="PRICE">
                </div>
                <button onclick="ordenActiva.items.splice(${idx}, 1); recalcularFinanzas();" class="text-slate-600 hover:text-white">✕</button>
            </div>`).join('');
    };

    // --- EVENTOS BASE ---
    const vincularEventosBase = () => {
        document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus();
    };

    const vincularAccionesTerminal = () => {
        document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
        document.getElementById("btnSincronizar").onclick = ejecutarSincronizacionNexus;
    };

    window.abrirTerminalNexus = (id = null) => {
        if(id) {
            getDoc(doc(db, "ordenes", id)).then(s => { ordenActiva = { id, ...s.data() }; renderTerminal(); });
        } else {
            ordenActiva = { placa:'', estado:'INGRESO', items:[], cliente_data:{}, anticipo:0, insumos:0 };
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
                <div onclick="window.abrirTerminalNexus('${d.id}')" class="bg-[#0d1117] p-8 border border-white/5 hover:border-red-600 transition-all cursor-pointer group">
                    <h4 class="orbitron text-3xl font-black text-white group-hover:text-red-500 mb-2">${o.placa}</h4>
                    <p class="text-[10px] text-slate-500 mb-4 font-bold uppercase">${o.cliente_data?.nombre || 'SIN CLIENTE'}</p>
                    <div class="pt-4 border-t border-white/5 flex justify-between items-center">
                        <span class="orbitron text-emerald-400 font-black">$ ${Math.round(o.costos_totales?.total || 0).toLocaleString()}</span>
                        <span class="text-[8px] orbitron text-slate-700">${o.estado}</span>
                    </div>
                </div>`;
            }).join('');
        });
    };

    renderBase();
}
