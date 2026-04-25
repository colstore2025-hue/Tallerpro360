/**
 * ordenes.js - NEXUS-X COMMAND CENTER V9.0 "THE TITAN" 🛰️
 * CONSOLIDACIÓN TOTAL: SAP BI + TERMINATOR AI + VOICE COMMANDS + EVIDENCIA
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, updateDoc, serverTimestamp, increment, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { analizarPrecioSugerido, renderModuloPricing } from "../ai/pricingEnginePRO360.js";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    let ordenActiva = null;
    let faseActual = 'INGRESO';

    if (!empresaId) {
        container.innerHTML = `<div class="p-10 orbitron text-red-500">ERROR: NO_EMPRESA_ID</div>`;
        return;
    }

    // --- MOTOR FINANCIERO QUANTUM-SAP V2.0 ---
    const recalcularFinanzas = () => {
        if (!ordenActiva) return;
        
        let m = { v_rep: 0, c_rep: 0, v_mo: 0, c_mo: 0, tiempo: 0 };

        if (ordenActiva.items) {
            ordenActiva.items.forEach(i => {
                const v = Number(i.venta || 0);
                const c = Number(i.costo || 0);
                m.tiempo += Number(i.tiempo_estimado || 0);
                if (i.tipo === 'REPUESTO') { m.v_rep += v; if(i.origen === 'TALLER') m.c_rep += c; }
                else { m.v_mo += v; m.c_mo += c; }
            });
        }

        const insumos = Number(document.getElementById("f-gastos-varios")?.value || ordenActiva.insumos || 0); 
        const anticipo = Number(document.getElementById("f-anticipo-cliente")?.value || ordenActiva.anticipo || 0); 
        
        const granTotal = m.v_rep + m.v_mo; 
        const baseGravable = granTotal / 1.19;
        const impuestoIVA = granTotal - baseGravable;
        const utilidadNeta = baseGravable - (m.c_rep + m.c_mo + insumos);

        // SINCRONIZACIÓN DE OBJETO (Corrige el error de undefined en Sync)
        ordenActiva.costos_totales = {
            gran_total: granTotal,
            base_iva: baseGravable,
            iva_19: impuestoIVA,
            utilidad_neta: utilidadNeta, 
            saldo_pendiente: granTotal - anticipo,
            eficiencia_h: m.tiempo,
            staff_liability: m.c_mo
        };

        const totalEl = document.getElementById("total-factura");
        if(totalEl) {
            totalEl.innerText = `$ ${Math.round(granTotal).toLocaleString()}`;
            document.getElementById("saldo-display").innerHTML = `
                <div class="text-right space-y-1">
                    <span class="text-cyan-500/50 text-[9px] orbitron block font-black tracking-[0.4em]">SAP BI ANALYTICS</span>
                    <div class="flex flex-col border-r-4 border-red-600 pr-4">
                        <span class="text-slate-500 text-[10px] orbitron uppercase">IVA (19%): $${Math.round(impuestoIVA).toLocaleString()}</span>
                        <span class="text-emerald-500 font-black text-xs orbitron">EBITDA: $${Math.round(utilidadNeta).toLocaleString()}</span>
                    </div>
                    <span class="${ordenActiva.costos_totales.saldo_pendiente > 0 ? 'text-red-500' : 'text-emerald-400'} font-black text-6xl orbitron tracking-tighter">
                        $ ${Math.round(ordenActiva.costos_totales.saldo_pendiente).toLocaleString()}
                    </span>
                </div>`;
        }
        renderItems();
    };

    // --- UI BASE & CANVAS HANDLER ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-slate-100 font-sans pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-end gap-6 mb-16 border-b border-white/5 pb-10">
                <div class="space-y-2">
                    <h1 class="orbitron text-7xl font-black italic tracking-tighter text-white">NEXUS<span class="text-red-600">_X</span></h1>
                    <p class="text-[10px] orbitron text-red-600/60 tracking-[0.6em] font-bold uppercase">TITAN QUANTUM-SAP 2030</p>
                </div>
                <button id="btnNewMission" class="px-12 py-6 bg-white text-black rounded-full orbitron text-[10px] font-black hover:bg-red-600 hover:text-white transition-all uppercase shadow-2xl">NUEVA ORDEN +</button>
            </header>
            <nav class="grid grid-cols-2 md:grid-cols-6 gap-4 mb-20">
                ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(f => `
                    <button class="fase-tab p-8 rounded-[2.5rem] bg-[#0d1117] border-2 ${faseActual === f ? 'border-red-600 shadow-red-600/20' : 'border-white/5'} transition-all group" data-fase="${f}">
                        <span class="orbitron text-[9px] ${faseActual === f ? 'text-red-500' : 'text-slate-600'} group-hover:text-red-500 mb-3 block font-black uppercase tracking-widest">${f}</span>
                        <h3 id="count-${f}" class="text-5xl font-black text-white italic">0</h3>
                    </button>`).join('')}
            </nav>
            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl p-6 lg:p-12 overflow-y-auto custom-scroll"></div>
        </div>`;
        vincularEventosBase();
        actualizarContadores();
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        const fase = ordenActiva.estado || 'INGRESO';
        
        modal.innerHTML = `
        <div class="max-w-[1600px] mx-auto pb-40 animate-in zoom-in duration-500">
            <div class="flex justify-between items-center mb-12 bg-[#0d1117] p-10 rounded-[3.5rem] border-b-8 border-red-600">
                <div class="flex items-center gap-8">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-7xl font-black orbitron text-white w-80 uppercase text-center rounded-[2rem] border border-white/10" placeholder="PLACA">
                    <select id="f-estado" class="bg-transparent text-red-600 orbitron font-black text-xl uppercase">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(f => `<option value="${f}" ${fase === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                </div>
                <div class="flex gap-4">
                    <button onclick="window.enviarReporteQuantum('${fase}')" class="px-6 py-4 bg-emerald-500/10 text-emerald-500 rounded-2xl orbitron text-[9px] font-black hover:bg-emerald-500 hover:text-black transition-all">ENVIAR WHATSAPP</button>
                    <button id="btnCloseTerminal" class="w-20 h-20 bg-red-600 rounded-[2rem] text-white text-3xl font-black">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-[#0d1117] rounded-[3.5rem] border border-white/5 p-10 space-y-6">
                        <h4 class="orbitron font-black text-red-500 text-[10px] tracking-widest uppercase">Módulo de Ingreso 2030</h4>
                        <input id="f-cliente" value="${ordenActiva.cliente || ''}" placeholder="CLIENTE" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-white font-black">
                        <input id="f-telefono" value="${ordenActiva.telefono || ''}" placeholder="WHATSAPP" class="w-full bg-black p-5 rounded-2xl border border-white/5 text-emerald-400 font-black">
                        
                        <div class="relative bg-black rounded-3xl border border-white/10 overflow-hidden aspect-square flex items-center justify-center group">
                            <span class="absolute top-4 left-4 orbitron text-[8px] text-slate-500">INSPECCIÓN_VISUAL_SENSORY</span>
                            <img src="https://cdn-icons-png.flaticon.com/512/3774/3774270.png" class="w-2/3 opacity-20 invert grayscale">
                            <canvas id="damageCanvas" width="400" height="400" class="absolute inset-0 cursor-crosshair"></canvas>
                            <button onclick="window.clearDamage()" class="absolute bottom-4 right-4 text-[8px] orbitron bg-red-600/20 text-red-500 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all">RESETEAR MAPA</button>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 rounded-[4.5rem] border border-white/5 relative">
                        <div class="flex justify-between items-end mb-16">
                            <h2 id="total-factura" class="orbitron text-[9rem] font-black text-white italic tracking-tighter leading-none">$ 0</h2>
                            <div id="saldo-display"></div>
                        </div>
                        <div id="items-container" class="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scroll border-t border-white/5 pt-8"></div>
                        <div class="grid grid-cols-3 gap-6 mt-12">
                            <button onclick="window.addItemNexus('REPUESTO')" class="py-8 bg-white/5 rounded-3xl border border-white/10 orbitron text-[10px] text-white hover:bg-white hover:text-black transition-all">+ REPUESTO</button>
                            <button onclick="window.addItemNexus('MANO_OBRA')" class="py-8 bg-red-600/10 rounded-3xl border border-red-600/20 orbitron text-[10px] text-red-500 hover:bg-red-600 hover:text-white transition-all">+ MANO DE OBRA</button>
                            <button id="btnSincronizar" class="py-8 bg-white text-black rounded-3xl orbitron font-black text-sm shadow-2xl">🛰️ SYNC CLOUD</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        
        initDamageCanvas();
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    // --- LÓGICA DEL CANVAS ---
    const initDamageCanvas = () => {
        const canvas = document.getElementById('damageCanvas');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        let drawing = false;

        canvas.addEventListener('mousedown', () => drawing = true);
        canvas.addEventListener('mouseup', () => drawing = false);
        canvas.addEventListener('mousemove', (e) => {
            if(!drawing) return;
            const rect = canvas.getBoundingClientRect();
            ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        });
        window.clearDamage = () => ctx.clearRect(0,0,400,400);
    };

    window.enviarReporteQuantum = (fase) => {
        const tel = document.getElementById("f-telefono").value.replace(/\+/g, '');
        const placa = document.getElementById("f-placa").value.toUpperCase();
        const cliente = document.getElementById("f-cliente").value;
        const total = document.getElementById("total-factura").innerText;

        let mensaje = `*🛰️ NEXUS-X COMMAND CENTER - ${fase}*%0A%0A`;
        mensaje += `Hola *${cliente}*, el estatus de tu unidad *[${placa}]* es ahora: *${fase}*.%0A%0A`;
        
        if(fase === 'COTIZACION') {
            mensaje += `✅ *PRE-COTIZACIÓN LISTA*%0A`;
            mensaje += `💰 *VALOR ESTIMADO:* ${total}%0A`;
            mensaje += `🔗 *ENLACE DE SEGUIMIENTO:* https://nexus-x.io/view/${ordenActiva.id || 'new'}%0A%0A`;
        } else {
            mensaje += `🔧 *DETALLES OPERATIVOS:*%0A_Sincronizado con SAP BI Quantum_%0A%0A`;
        }

        mensaje += `*TallerPRO360* - _Eficiencia Automotriz 2030_`;
        window.open(`https://api.whatsapp.com/send?phone=${tel}&text=${mensaje}`, '_blank');
    };

    const ejecutarSincronizacionTotal = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true; btn.innerHTML = `SYNCING SAP...`;

        try {
            const batch = writeBatch(db);
            const placaVal = document.getElementById('f-placa').value.toUpperCase();
            if(!placaVal) throw new Error("PLACA_REQUERIDA");
            
            const id = ordenActiva.id || `OT_${placaVal}_${Date.now()}`;
            
            const data = {
                ...ordenActiva,
                id, empresaId,
                placa: placaVal,
                cliente: document.getElementById('f-cliente').value,
                telefono: document.getElementById('f-telefono').value,
                estado: document.getElementById('f-estado').value,
                updatedAt: serverTimestamp()
            };

            batch.set(doc(db, "ordenes", id), data);
            
            // ASIENTO CONTABLE SAP
            batch.set(doc(db, "contabilidad", `ACC_${id}`), {
                empresaId, 
                monto: data.costos_totales.gran_total, 
                utilidad: data.costos_totales.utilidad_neta, // CORREGIDO: utilidad_neta
                fecha: serverTimestamp(),
                placa: placaVal
            });

            await batch.commit();
            Swal.fire({ title:'TITAN SYNC OK', icon:'success', background:'#0d1117', color:'#fff' });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (e) { 
            console.error(e); 
            Swal.fire({ title:'ERROR SYNC', text: e.message, icon:'error' });
        } finally { 
            btn.disabled = false; btn.innerHTML = `🛰️ SYNC CLOUD`; 
        }
    };

    const vincularEventosBase = () => {
        document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus();
        document.querySelectorAll(".fase-tab").forEach(tab => {
            tab.onclick = () => { faseActual = tab.dataset.fase; renderBase(); };
        });
    };

    const vincularAccionesTerminal = () => {
        document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
        document.getElementById("btnSincronizar").onclick = ejecutarSincronizacionTotal;
    };

    const actualizarContadores = () => {
        ['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].forEach(f => {
            const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", f));
            onSnapshot(q, s => {
                const el = document.getElementById(`count-${f}`);
                if(el) el.innerText = s.size;
            });
        });
        const qG = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", faseActual));
        onSnapshot(qG, s => {
            const grid = document.getElementById("grid-ordenes");
            if(grid) grid.innerHTML = s.docs.map(d => `
                <div onclick="window.abrirTerminalNexus('${d.id}')" class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 hover:border-red-600 transition-all cursor-pointer">
                    <h4 class="orbitron text-3xl font-black text-white">${d.data().placa}</h4>
                    <p class="text-[9px] text-slate-500 orbitron uppercase font-bold">${d.data().cliente || 'S/N'}</p>
                    <div class="flex justify-between border-t border-white/5 mt-4 pt-4">
                        <span class="text-emerald-400 font-black">$ ${Math.round(d.data().costos_totales?.gran_total || 0).toLocaleString()}</span>
                    </div>
                </div>`).join('');
        });
    };

    window.abrirTerminalNexus = (id = null) => {
        if(id) {
            getDoc(doc(db, "ordenes", id)).then(s => { 
                ordenActiva = { id, ...s.data() }; 
                if(!ordenActiva.items) ordenActiva.items = [];
                renderTerminal(); 
            });
        } else {
            ordenActiva = { placa:'', estado:'INGRESO', items:[], anticipo:0, insumos:0, costos_totales:{} };
            renderTerminal();
        }
        document.getElementById("nexus-terminal").classList.remove("hidden");
    };

    window.renderItems = () => {
        const container = document.getElementById("items-container");
        if(!container || !ordenActiva.items) return;
        container.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="flex items-center gap-6 bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5">
                <div class="flex-1 grid grid-cols-4 gap-6">
                    <div class="col-span-2">
                        <input onchange="window.editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" class="bg-transparent text-white font-black orbitron text-sm outline-none w-full uppercase">
                    </div>
                    <input type="number" onchange="window.editItemNexus(${idx}, 'costo', this.value)" value="${item.costo}" class="bg-black/40 p-4 rounded-xl text-red-500 font-black text-center text-xs">
                    <input type="number" onchange="window.editItemNexus(${idx}, 'venta', this.value)" value="${item.venta}" class="bg-black/40 p-4 rounded-xl text-emerald-400 font-black text-center text-xs">
                </div>
            </div>`).join('');
    };

    window.addItemNexus = (tipo) => {
        if(!ordenActiva.items) ordenActiva.items = [];
        ordenActiva.items.push({ tipo, desc:`NUEVO ${tipo}`, costo:0, venta:0, origen:'TALLER' });
        recalcularFinanzas();
    };

    window.editItemNexus = (idx, c, v) => { 
        ordenActiva.items[idx][c] = (c === 'costo' || c === 'venta') ? Number(v) : v; 
        recalcularFinanzas(); 
    };

    renderBase();
}

