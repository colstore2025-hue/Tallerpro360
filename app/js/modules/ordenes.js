import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, serverTimestamp, writeBatch 
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
        container.innerHTML = `<div class="p-10 orbitron text-red-500 text-center">ACCESS_DENIED: MISSING_EMPRESA_ID</div>`;
        return;
    }

    const recalcularFinanzas = () => {
        if (!ordenActiva) return;
        let m = { v_rep: 0, c_rep: 0, v_mo: 0, c_mo: 0 };

        ordenActiva.items.forEach(i => {
            const v = Number(i.venta || 0);
            const c = Number(i.costo || 0);
            if (i.tipo === 'REPUESTO' && i.origen === 'TALLER') { m.v_rep += v; m.c_rep += c; }
            else if (i.tipo === 'MANO_OBRA') { m.v_mo += v; m.c_mo += c; }
        });

        const iIVA = Number(document.getElementById("f-insumos-iva")?.value || 0);
        const iNoIVA = Number(document.getElementById("f-insumos-no-iva")?.value || 0);
        const ant = Number(document.getElementById("f-anticipo")?.value || 0);

        const subGravado = m.v_rep + m.v_mo + iIVA;
        const base = subGravado / 1.19;
        const iva = subGravado - base;
        const total = subGravado + iNoIVA;
        const ebitda = (base + iNoIVA) - (m.c_rep + m.c_mo + (iIVA / 1.19) + iNoIVA);

        ordenActiva.costos_totales = { total, base, iva, ebitda, saldo: total - ant };
        
        const tEl = document.getElementById("total-factura");
        if(tEl) tEl.innerText = `$ ${Math.round(total).toLocaleString()}`;
        
        const sEl = document.getElementById("finance-summary");
        if(sEl) sEl.innerHTML = `
            <div class="grid grid-cols-2 gap-4 border-t border-cyan-500/30 pt-4 mt-4">
                <div class="text-[10px] orbitron text-slate-500">BASE: <span class="text-white">$${Math.round(base).toLocaleString()}</span></div>
                <div class="text-[10px] orbitron text-slate-500 text-right">IVA: <span class="text-white">$${Math.round(iva).toLocaleString()}</span></div>
                <div class="text-green-400 font-black text-xl orbitron italic">EBITDA: $${Math.round(ebitda).toLocaleString()}</div>
                <div class="text-red-500 font-black text-xl orbitron text-right">SALDO: $${Math.round(total - ant).toLocaleString()}</div>
            </div>`;
        window.renderItems();
    };

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#05070a] min-h-screen text-slate-100 font-sans pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-end gap-6 mb-16 border-b-2 border-red-600 pb-10">
                <div>
                    <h1 class="orbitron text-7xl font-black italic text-white">NEXUS<span class="text-red-600">_X</span></h1>
                    <p class="text-[10px] orbitron text-cyan-400 font-bold tracking-[0.8em] uppercase">TITAN LOGISTICS</p>
                </div>
                <button id="btnNewMission" class="px-12 py-5 bg-cyan-500 text-black orbitron text-[10px] font-black uppercase shadow-[8px_8px_0px_#06b6d444]">INICIAR ORDEN +</button>
            </header>
            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl p-6 overflow-y-auto"></div>
        </div>`;
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1500px] mx-auto animate-in zoom-in duration-200">
            <div class="flex justify-between items-center mb-8 bg-[#0d1117] p-8 border-l-8 border-cyan-500 rounded-r-2xl">
                <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-6xl font-black orbitron text-white w-72 text-center rounded-xl border border-white/10 uppercase">
                <select id="f-estado" class="bg-black text-cyan-400 orbitron font-black p-4 rounded-xl border border-white/10">
                    ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(e => 
                        `<option value="${e}" ${ordenActiva.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
                </select>
                <button id="btnCloseTerminal" class="w-16 h-16 bg-red-600 text-white rounded-xl">✕</button>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-[#0d1117] p-6 rounded-2xl border border-white/5">
                        <input id="f-cliente" value="${ordenActiva.cliente}" placeholder="CLIENTE" class="w-full bg-black p-4 mb-3 text-white uppercase text-xs border border-white/10 rounded-lg">
                        <input id="f-telefono" value="${ordenActiva.telefono}" placeholder="WHATSAPP" class="w-full bg-black p-4 text-green-400 border border-white/10 rounded-lg">
                    </div>
                    <div id="pricing-engine-container"></div>
                    <textarea id="ai-log-display" class="w-full bg-black p-4 h-32 text-slate-400 text-[10px] font-mono border border-white/5 rounded-2xl">${ordenActiva.bitacora_ia || ''}</textarea>
                </div>
                <div class="lg:col-span-8 space-y-6">
                    <div class="bg-[#0d1117] p-10 rounded-[2.5rem] border border-cyan-500/10">
                        <h2 id="total-factura" class="orbitron text-8xl font-black text-white italic">$ 0</h2>
                        <div id="finance-summary"></div>
                        <div id="items-container" class="mt-8 space-y-3 max-h-[350px] overflow-y-auto pr-2"></div>
                        <div class="grid grid-cols-2 gap-4 mt-8">
                            <button onclick="window.addItemNexus('REPUESTO')" class="py-4 border border-white/10 orbitron text-[10px] text-white rounded-xl hover:bg-white hover:text-black">ADD_REPUESTO</button>
                            <button onclick="window.addItemNexus('MANO_OBRA')" class="py-4 border border-red-600/20 orbitron text-[10px] text-red-500 rounded-xl hover:bg-red-600 hover:text-white">ADD_LABOR</button>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-4">
                        <div class="bg-black p-4 rounded-xl border border-white/5"><label class="text-[9px] block text-slate-500">INS_IVA</label><input id="f-insumos-iva" value="${ordenActiva.insumos || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-white text-2xl font-black w-full outline-none"></div>
                        <div class="bg-black p-4 rounded-xl border border-white/5"><label class="text-[9px] block text-yellow-500">INS_NO_IVA</label><input id="f-insumos-no-iva" value="${ordenActiva.insumos_no_iva || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-yellow-500 text-2xl font-black w-full outline-none"></div>
                        <div class="bg-black p-4 rounded-xl border border-white/5"><label class="text-[9px] block text-green-500">ANTICIPO</label><input id="f-anticipo" value="${ordenActiva.anticipo || 0}" type="number" onchange="window.recalcularFinanzas()" class="bg-transparent text-green-400 text-2xl font-black w-full outline-none"></div>
                    </div>
                    <button id="btnSincronizar" class="w-full bg-cyan-500 text-black py-8 orbitron font-black text-2xl rounded-3xl shadow-lg">🛰️ PUSH_TO_NEXUS_CLOUD</button>
                </div>
            </div>
        </div>`;
        renderModuloPricing(document.getElementById('pricing-engine-container'));
        document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
        document.getElementById("btnSincronizar").onclick = ejecutarSincronizacionTotal;
        window.recalcularFinanzas();
    };

    window.abrirTerminalNexus = async (id = null) => {
        if(id) {
            const snap = await getDoc(doc(db, "ordenes", id));
            ordenActiva = { id, ...snap.data() };
        } else {
            ordenActiva = { placa:'', items:[], cliente:'', telefono:'', estado:'INGRESO', anticipo:0, insumos:0, insumos_no_iva:0, costs_totales:{} };
        }
        renderTerminal();
        document.getElementById("nexus-terminal").classList.remove("hidden");
    };

    window.addItemNexus = async (tipo) => {
        const { value: desc } = await Swal.fire({ title: `DESC ${tipo}`, input: 'text', background: '#0d1117', color: '#fff' });
        if (desc) {
            ordenActiva.items.push({ tipo, desc: desc.toUpperCase(), costo: 0, venta: 0, origen: 'TALLER', tecnico: 'INTERNO' });
            window.recalcularFinanzas();
        }
    };

    window.renderItems = () => {
        const container = document.getElementById("items-container");
        if(container) container.innerHTML = ordenActiva.items.map((it, idx) => `
            <div class="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                <input onchange="ordenActiva.items[${idx}].desc=this.value.toUpperCase()" value="${it.desc}" class="flex-1 bg-transparent text-white orbitron text-[10px] uppercase outline-none">
                <input type="number" onchange="ordenActiva.items[${idx}].venta=Number(this.value); recalcularFinanzas()" value="${it.venta}" class="w-20 bg-black text-green-400 text-center rounded border border-white/10">
                <button onclick="ordenActiva.items.splice(${idx},1); recalcularFinanzas()" class="text-red-500">✕</button>
            </div>`).join('');
    };

    const ejecutarSincronizacionTotal = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true;
        try {
            const batch = writeBatch(db);
            const placa = document.getElementById("f-placa").value.toUpperCase();
            if(!placa) throw new Error("ID_PLACA_NULL");
            const id = ordenActiva.id || `OT_${placa}_${Date.now()}`;
            
            const data = {
                ...ordenActiva, id, placa, empresaId,
                cliente: document.getElementById("f-cliente").value.toUpperCase(),
                telefono: document.getElementById("f-telefono").value,
                estado: document.getElementById("f-estado").value,
                bitacora_ia: document.getElementById("ai-log-display").value,
                updatedAt: serverTimestamp(),
                fecha_orden: ordenActiva.fecha_orden || serverTimestamp()
            };

            batch.set(doc(db, "ordenes", id), data);
            batch.set(doc(db, "contabilidad", `ACC_${id}`), {
                empresaId, placa, monto: data.costos_totales.total, referencia: id, tipo: 'INGRESO_OT', fecha: serverTimestamp()
            });

            await batch.commit();
            Swal.fire({ title: 'NEXUS SYNC OK', icon: 'success', background: '#0d1117', color: '#fff' });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (e) { btn.disabled = false; Swal.fire('ERROR', e.message, 'error'); }
    };

    const cargarEscuchaOrdenes = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const grid = document.getElementById("grid-ordenes");
            if(grid) grid.innerHTML = snap.docs.map(d => `
                <div onclick="window.abrirTerminalNexus('${d.id}')" class="bg-[#0d1117] p-6 border border-white/5 rounded-3xl cursor-pointer hover:border-cyan-500">
                    <h4 class="orbitron text-2xl font-black text-white">${d.data().placa}</h4>
                    <p class="text-[10px] text-slate-500 uppercase">${d.data().cliente || 'S/N'}</p>
                </div>`).join('');
        });
    };

    renderBase();
    cargarEscuchaOrdenes();
    document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus();
}
