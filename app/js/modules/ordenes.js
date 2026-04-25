/**
 * ordenes.js - NEXUS-X COMMAND CENTER V8.5 "QUANTUM-SAP" 🛰️
 * UPGRADE: PREDICTIVE PRICING + LABOR TIME + SAP BI AUDITOR
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
    let isRecording = false;
    let datosTaller = { nombre: "NEXUS LOGISTICS", nit: "S/N" };

    if (!empresaId) {
        container.innerHTML = `<div class="p-10 orbitron text-red-500">ERROR: NO EMPRESA_ID</div>`;
        return;
    }

    // --- RECALCULAR FINANZAS SAP-BI ---
    const recalcularFinanzas = () => {
        if (!ordenActiva) return;
        let subtotalVenta = 0;
        let costoRepuestosTaller = 0;
        let costoManoObraStaff = 0; // Pago a técnicos externos
        let tiempoEstimadoTotal = 0;

        ordenActiva.items.forEach(i => {
            const v = Number(i.venta || 0);
            const c = Number(i.costo || 0);
            const t = Number(i.tiempo_estimado || 0);
            subtotalVenta += v;
            tiempoEstimadoTotal += t;
            
            if (i.tipo === 'REPUESTO' && i.origen === "TALLER") {
                costoRepuestosTaller += c;
            } else if (i.tipo === 'MANO_OBRA') {
                costoManoObraStaff += c; 
            }
        });

        const insumos = Number(document.getElementById("f-gastos-varios")?.value || 0); 
        const anticipo = Number(document.getElementById("f-anticipo-cliente")?.value || 0); 
        
        const granTotal = subtotalVenta; 
        const baseGravable = granTotal / 1.19;
        const totalIVA = granTotal - baseGravable;
        
        // Utilidad Neta Real (EBITDA) - Descontando repuestos, pago a staff e insumos
        const utilidadNeta = baseGravable - (costoRepuestosTaller + costoManoObraStaff + insumos);
        const saldoPendiente = granTotal - anticipo;

        ordenActiva.costos_totales = {
            base_gravable: baseGravable,
            iva_19: totalIVA,
            gran_total: granTotal,
            utilidad: utilidadNeta,
            saldo_pendiente: saldoPendiente,
            costo_staff: costoManoObraStaff,
            insumos_operativos: insumos,
            tiempo_h: tiempoEstimadoTotal
        };

        const totalEl = document.getElementById("total-factura");
        if(totalEl) {
            totalEl.innerText = `$ ${Math.round(granTotal).toLocaleString()}`;
            document.getElementById("saldo-display").innerHTML = `
                <span class="text-cyan-500/50 text-[10px] uppercase block tracking-[0.2em] font-black mb-1">Unpaid Balance / ${tiempoEstimadoTotal}H</span>
                <span class="${saldoPendiente > 0 ? 'text-red-500' : 'text-emerald-400'} font-black text-3xl orbitron">$ ${Math.round(saldoPendiente).toLocaleString()}</span>
            `;
        }
        renderItems();
    };

    // --- SINCRONIZACIÓN MAESTRA BATCH (ORDENES + CONTABILIDAD + AUDITORÍA) ---
    const ejecutarSincronizacionNexus = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true; 
        btn.innerHTML = `<i class="fas fa-satellite-dish animate-spin"></i> SAP SYNC...`;
        
        try {
            const placa = document.getElementById("f-placa").value.trim().toUpperCase();
            if(!placa) throw new Error("IDENTIFIER_REQUIRED");
            
            const docId = ordenActiva.id || `OT_${placa}_${Date.now()}`;
            const fecha = new Date();
            const periodo = `${fecha.getFullYear()}-${(fecha.getMonth()+1).toString().padStart(2,'0')}`;

            ordenActiva.finanzas = {
                anticipo_cliente: Number(document.getElementById("f-anticipo-cliente").value),
                gastos_varios: Number(document.getElementById("f-gastos-varios").value),
                fecha_iso: fecha.toISOString(),
                periodo: periodo
            };

            const finalData = {
                ...ordenActiva,
                id: docId, empresaId, placa,
                cliente: document.getElementById("f-cliente").value.toUpperCase(),
                telefono: document.getElementById("f-telefono").value,
                estado: document.getElementById("f-estado").value,
                updatedAt: serverTimestamp()
            };

            const batch = writeBatch(db);
            
            // 1. Guardar Orden Master
            batch.set(doc(db, "ordenes", docId), finalData);

            // 2. Alimentar Contabilidad (Asiento Contable)
            const contRef = doc(db, "contabilidad", `ACC_${docId}`);
            batch.set(contRef, {
                empresaId, ordenId: docId, tipo: 'CIERRE_OT',
                monto: finalData.costos_totales.gran_total,
                utilidad: finalData.costos_totales.utilidad,
                costo_operativo: finalData.costos_totales.costo_staff + finalData.costos_totales.insumos_operativos,
                fecha: serverTimestamp(), periodo
            });

            // 3. Alimentar Finanzas Elite (Auditoría de Staff)
            const auditRef = doc(db, "finanzas_elite", `AUDIT_${docId}`);
            batch.set(auditRef, {
                empresaId, placa, periodo,
                eficiencia_h: finalData.costos_totales.tiempo_h,
                tecnicos: ordenActiva.items.filter(i => i.tipo === 'MANO_OBRA').map(i => ({n: i.tecnico, v: i.venta}))
            });

            await batch.commit();
            Swal.fire({ icon:'success', title:'NEXUS SAP SYNCED', background:'#010409', color:'#06b6d4' });
            document.getElementById("nexus-terminal").classList.add("hidden");

        } catch (err) { 
            Swal.fire({ icon:'error', title:'SYNC_ERROR', text:err.message }); 
        } finally { 
            btn.disabled = false; btn.innerHTML = `🛰️ Push to Nexus Cloud`; 
        }
    };

    // --- TERMINATOR PRICING INTEGRATION ---
    window.ejecutarCalculoTerminator = () => {
        const h = parseFloat(document.getElementById('m_horas').value);
        const proc = document.getElementById('m_procedimiento').value.toUpperCase();
        const res = analizarPrecioSugerido({
            horasEstimadas: h,
            tipoVehiculo: document.getElementById('m_gama').value,
            urgencia: document.getElementById('m_urgencia').value,
            tipoTrabajo: proc
        });

        ordenActiva.items.push({ 
            tipo: 'MANO_OBRA', desc: proc, costo: 0, venta: res.precioSugerido, 
            tiempo_estimado: h, origen: 'TALLER', tecnico: 'PENDIENTE' 
        });

        const bitacora = document.getElementById('ai-log-display');
        if(bitacora) bitacora.value += `\n[NEXUS-AI]: Predicted ${h}H for ${proc}. Suggested: $${res.precioSugerido}`;
        
        recalcularFinanzas();
        hablar("Cálculo predictivo inyectado");
    };

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 border-b border-white/5 pb-10">
                <div class="space-y-2">
                    <div class="flex items-center gap-4">
                        <div class="h-4 w-4 bg-cyan-500 rounded-full animate-pulse"></div>
                        <h1 class="orbitron text-6xl font-black italic tracking-tighter uppercase text-white">NEXUS_<span class="text-cyan-400">V8.5</span></h1>
                    </div>
                    <p class="text-[10px] orbitron text-cyan-500/50 tracking-[0.5em] font-bold uppercase">${datosTaller.nombre} // QUANTUM SAP INTERFACE</p>
                </div>
                <button id="btnNewMission" class="px-10 py-6 bg-white text-black rounded-full orbitron text-xs font-black hover:scale-110 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] uppercase">NUEVA MISIÓN +</button>
            </header>

            <nav class="grid grid-cols-2 md:grid-cols-6 gap-4 mb-16">
                ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(fase => `
                    <button class="fase-tab p-6 rounded-[2rem] bg-[#0d1117] border ${faseActual === fase ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-white/5'} transition-all group" data-fase="${fase}">
                        <span class="orbitron text-[8px] ${faseActual === fase ? 'text-cyan-400' : 'text-slate-600'} group-hover:text-cyan-400 mb-2 block font-black uppercase">${fase}</span>
                        <h3 id="count-${fase}" class="text-4xl font-black text-white">0</h3>
                    </button>
                `).join('')}
            </nav>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-in fade-in duration-700"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl p-4 lg:p-10 overflow-y-auto border-t-4 border-cyan-500"></div>
        </div>`;
        vincularNavegacion();
        cargarEscuchaGlobal();
    };

    const renderItems = () => {
        const containerItems = document.getElementById("items-container");
        if(!containerItems) return;
        containerItems.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="grid grid-cols-1 md:grid-cols-12 items-center gap-4 bg-white/[0.02] p-6 rounded-[2.5rem] border border-white/5 hover:border-cyan-500/20 transition-all animate-in slide-in-from-right-4">
                <div class="md:col-span-1 text-center">
                    <button onclick="window.toggleOrigenItem(${idx})" class="w-12 h-12 rounded-2xl border ${item.origen === 'TALLER' ? 'border-cyan-500 text-cyan-400' : 'border-amber-500 text-amber-400'}">
                        <i class="fas ${item.tipo === 'REPUESTO' ? 'fa-box' : 'fa-user-cog'}"></i>
                    </button>
                </div>
                <div class="md:col-span-4">
                    <span class="text-[7px] orbitron font-black uppercase text-cyan-500/50">${item.tipo} | ${item.tecnico || 'NO STAFF'}</span>
                    <input onchange="window.editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" class="w-full bg-transparent border-b border-white/5 outline-none text-white font-bold uppercase text-xs orbitron">
                </div>
                <div class="md:col-span-3">
                    <label class="text-[7px] text-slate-600 block uppercase font-black orbitron mb-1">Costo (Staff/Buy)</label>
                    <input type="number" onchange="window.editItemNexus(${idx}, 'costo', this.value)" value="${item.costo || 0}" class="w-full bg-black/50 p-3 rounded-xl text-red-400 font-black border border-white/5 text-center text-xs">
                </div>
                <div class="md:col-span-3">
                    <label class="text-[7px] text-slate-600 block uppercase font-black orbitron mb-1">Venta Público</label>
                    <input type="number" onchange="window.editItemNexus(${idx}, 'venta', this.value)" value="${item.venta || 0}" class="w-full bg-black/50 p-3 rounded-xl text-emerald-400 font-black border border-white/5 text-center text-xs">
                </div>
                <div class="md:col-span-1 text-right">
                    <button onclick="window.removeItemNexus(${idx})" class="text-white/10 hover:text-red-500 transition-all text-xl">✕</button>
                </div>
            </div>`).join('');
    };

    window.abrirTerminalNexus = (id) => {
        const modal = document.getElementById("nexus-terminal");
        modal.classList.remove("hidden");
        if(id) { 
            getDoc(doc(db, "ordenes", id)).then(s => { 
                ordenActiva = { id, ...s.data() }; 
                if(!ordenActiva.items) ordenActiva.items = [];
                renderTerminal(); 
            }); 
        } else {
            ordenActiva = { 
                placa:'', cliente:'', telefono:'', estado:'INGRESO', items:[], 
                bitacora_ia:'', costs_totales: {}
            };
            renderTerminal();
        }
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1400px] mx-auto pb-20">
            <div class="flex flex-wrap justify-between items-center mb-10 bg-[#0d1117] p-8 rounded-[3rem] border border-white/5">
                <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-5xl font-black orbitron text-white w-64 uppercase text-center rounded-2xl border border-white/10" placeholder="PLACA">
                <div class="flex gap-4">
                    <select id="f-estado" class="bg-cyan-500 text-black orbitron text-[10px] font-black px-6 rounded-xl uppercase">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                    <button id="btnCloseTerminal" class="w-16 h-16 bg-red-600 rounded-2xl text-white font-black hover:rotate-90 transition-all">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5">
                        <label class="text-[9px] text-cyan-400 orbitron block mb-4 font-black">MASTER DATA</label>
                        <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-black p-4 rounded-xl border border-white/5 mb-3 text-white font-bold orbitron text-[11px]" placeholder="CLIENTE">
                        <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-black p-4 rounded-xl border border-white/5 text-white font-bold orbitron text-[11px]" placeholder="WHATSAPP">
                    </div>
                    <div id="pricing-engine-container"></div>
                    <div class="bg-black p-8 rounded-[3rem] border border-red-500/20">
                         <span class="orbitron text-[9px] text-red-500 font-black mb-4 block italic uppercase">Neural Bitácora (Blackbox)</span>
                         <textarea id="ai-log-display" class="w-full bg-[#0d1117] p-5 rounded-2xl text-[10px] h-40 outline-none border border-white/5 text-slate-400 font-mono">${ordenActiva.bitacora_ia || ''}</textarea>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-6">
                    <div class="bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 relative overflow-hidden">
                        <div class="flex justify-between items-end mb-8">
                            <h2 id="total-factura" class="orbitron text-8xl font-black text-white italic tracking-tighter">$ 0</h2>
                            <div id="saldo-display" class="text-right"></div>
                        </div>
                        <div id="items-container" class="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scroll"></div>
                        <div class="grid grid-cols-2 gap-4 mt-8">
                            <button onclick="window.addGeneric('REPUESTO')" class="py-6 bg-white/5 rounded-2xl border border-dashed border-white/20 orbitron text-[9px] font-black uppercase">+ Repuesto</button>
                            <button onclick="window.addGeneric('MANO_OBRA')" class="py-6 bg-cyan-500/5 rounded-2xl border border-dashed border-cyan-500/20 text-cyan-400 orbitron text-[9px] font-black uppercase">+ Mano de Obra</button>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-black p-6 rounded-[3rem] border border-white/5 grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-[8px] orbitron text-slate-500 block mb-1 font-black uppercase">Anticipo</label>
                                <input type="number" id="f-anticipo-cliente" value="${ordenActiva.finanzas?.anticipo_cliente || 0}" class="w-full bg-emerald-500/10 p-4 rounded-xl text-emerald-400 font-black text-center" onchange="window.actualizarFinanzasDirecto()">
                            </div>
                            <div>
                                <label class="text-[8px] orbitron text-cyan-500 block mb-1 font-black uppercase">Insumos</label>
                                <input type="number" id="f-gastos-varios" value="${ordenActiva.finanzas?.gastos_varios || 0}" class="w-full bg-white/5 p-4 rounded-xl text-white font-black text-center" onchange="window.actualizarFinanzasDirecto()">
                            </div>
                        </div>
                        <button id="btnSincronizar" class="bg-white text-black rounded-[3rem] orbitron font-black text-xl hover:bg-cyan-400 transition-all uppercase tracking-tighter">🛰️ Push to Nexus Cloud</button>
                    </div>
                </div>
            </div>
        </div>`;
        
        renderModuloPricing(document.getElementById('pricing-engine-container'));
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    // --- ACCIONES VENTANA NEXUS ---
    const vincularAccionesTerminal = () => {
        document.getElementById("btnSincronizar").onclick = ejecutarSincronizacionNexus;
        document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
        window.addGeneric = async (tipo) => {
            let tec = 'TALLER';
            if(tipo === 'MANO_OBRA') {
                const { value:t } = await Swal.fire({ title:'ASIGNAR STAFF', input:'text', background:'#0d1117', color:'#fff', inputPlaceholder:'Nombre del técnico' });
                tec = t || 'UNASSIGNED';
            }
            ordenActiva.items.push({ tipo, desc:`NUEVO ${tipo}`, costo:0, venta:0, origen:'TALLER', tecnico: tec });
            recalcularFinanzas();
        };
    };

    // Funciones Globales
    window.toggleOrigenItem = (idx) => { 
        ordenActiva.items[idx].origen = ordenActiva.items[idx].origen === 'TALLER' ? 'CLIENTE' : 'TALLER'; 
        if(ordenActiva.items[idx].origen === 'CLIENTE') ordenActiva.items[idx].costo = 0;
        recalcularFinanzas(); 
    };
    window.editItemNexus = (idx, c, v) => { ordenActiva.items[idx][c] = (c === 'costo' || c === 'venta' || c === 'tiempo_estimado') ? Number(v) : v; recalcularFinanzas(); };
    window.removeItemNexus = (idx) => { ordenActiva.items.splice(idx, 1); recalcularFinanzas(); };
    window.actualizarFinanzasDirecto = () => recalcularFinanzas();

    const cargarEscuchaGlobal = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const grilla = [];
            snap.docs.forEach(d => { if(d.data().estado === faseActual) grilla.push({ id: d.id, ...d.data() }); });
            const gridContainer = document.getElementById("grid-ordenes");
            if(gridContainer) {
                gridContainer.innerHTML = grilla.map(o => `
                <div onclick="window.abrirTerminalNexus('${o.id}')" class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 hover:border-cyan-400 transition-all cursor-pointer group relative overflow-hidden animate-in zoom-in">
                    <div class="flex justify-between items-center mb-4">
                         <span class="orbitron text-3xl font-black text-white group-hover:text-cyan-400 tracking-tighter">${o.placa}</span>
                         <div class="h-2 w-2 rounded-full ${o.estado === 'LISTO' ? 'bg-emerald-500' : 'bg-cyan-500'}"></div>
                    </div>
                    <p class="text-[9px] text-cyan-500/50 orbitron font-black uppercase mb-4">${o.cliente || 'S/N'}</p>
                    <div class="border-t border-white/5 pt-4 flex justify-between">
                        <span class="text-lg font-black text-white orbitron">$ ${Math.round(o.costos_totales?.gran_total || 0).toLocaleString()}</span>
                        <span class="text-[8px] text-slate-600 orbitron uppercase self-center font-bold">UT: $${Math.round(o.costos_totales?.utilidad || 0).toLocaleString()}</span>
                    </div>
                </div>`).join('');
            }
        });
    };

    const vincularNavegacion = () => {
        document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus();
        document.querySelectorAll(".fase-tab").forEach(tab => { tab.onclick = () => { faseActual = tab.dataset.fase; renderBase(); }; });
    };

    renderBase();
}
