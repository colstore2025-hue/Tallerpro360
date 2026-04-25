/**
 * ordenes.js - NEXUS-X COMMAND CENTER V8.0 "PRO-EVO" 🛰️
 * MISIÓN: AUTOMATIZACIÓN TOTAL TALLERPRO360 + ESTRUCTURA SAP BI MULTI-TALLER
 * INTEGRACIÓN: PRICING ENGINE PRO360 (TERMINATOR 2030)
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, updateDoc, serverTimestamp, increment 
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

    const cargarPerfilTaller = async () => {
        const docRef = doc(db, "empresas", empresaId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            datosTaller = {
                nombre: docSnap.data().nombre || "TALLER PRO 360",
                nit: docSnap.data().nit || "900.000.000-1"
            };
        }
    };
    await cargarPerfilTaller();

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32 selection:bg-cyan-500 selection:text-black">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 border-b border-white/10 pb-12">
                <div class="space-y-3">
                    <div class="flex items-center gap-5">
                        <div class="h-5 w-5 bg-red-600 rounded-full animate-pulse shadow-[0_0_25px_#ff0000]"></div>
                        <h1 class="orbitron text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase leading-none">NEXUS_<span class="text-cyan-400">V8</span></h1>
                    </div>
                    <p class="text-[12px] orbitron text-cyan-500/70 tracking-[0.6em] uppercase italic font-bold">${datosTaller.nombre} // NEURAL INTERFACE</p>
                </div>
                <button id="btnNewMission" class="group relative px-12 py-7 bg-cyan-500 text-black rounded-full orbitron text-sm font-black hover:bg-white hover:scale-110 transition-all duration-500 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                    <span class="relative z-10 uppercase">Iniciar Misión +</span>
                </button>
            </header>

            <nav class="grid grid-cols-2 md:grid-cols-6 gap-5 mb-16">
                ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(fase => `
                    <button class="fase-tab relative overflow-hidden p-8 rounded-[2.5rem] bg-[#0d1117] border-2 ${faseActual === fase ? 'border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.2)]' : 'border-white/5'} transition-all group" data-fase="${fase}">
                        <span class="orbitron text-[9px] ${faseActual === fase ? 'text-cyan-400' : 'text-slate-500'} group-hover:text-cyan-400 mb-3 block font-black tracking-widest">${fase}</span>
                        <h3 id="count-${fase}" class="text-5xl font-black text-white group-hover:scale-110 transition-all">0</h3>
                    </button>
                `).join('')}
            </nav>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl p-4 lg:p-12 overflow-y-auto border-4 border-cyan-500/20 m-2 rounded-[3rem]"></div>
        </div>`;
        vincularNavegacion();
        cargarEscuchaGlobal();
    };

    const cargarEscuchaGlobal = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const counts = { COTIZACION:0, INGRESO:0, DIAGNOSTICO:0, REPARACION:0, LISTO:0, ENTREGADO:0 };
            const grilla = [];
            snap.docs.forEach(d => {
                const dt = d.data();
                if(counts.hasOwnProperty(dt.estado)) counts[dt.estado]++;
                if(dt.estado === faseActual) grilla.push({ id: d.id, ...dt });
            });
            Object.keys(counts).forEach(f => { if(document.getElementById(`count-${f}`)) document.getElementById(`count-${f}`).innerText = counts[f]; });
            const gridContainer = document.getElementById("grid-ordenes");
            if(gridContainer) {
                gridContainer.innerHTML = grilla.map(o => `
                <div onclick="window.abrirTerminalNexus('${o.id}')" class="bg-[#0d1117] p-10 rounded-[3.5rem] border-2 border-white/5 hover:border-cyan-400 transition-all cursor-pointer group animate-in zoom-in relative overflow-hidden">
                    <div class="flex justify-between items-center mb-6">
                         <span class="orbitron text-4xl font-black text-white group-hover:text-cyan-400 tracking-tighter">${o.placa}</span>
                         <div class="h-3 w-3 rounded-full ${o.estado === 'LISTO' ? 'bg-emerald-500' : 'bg-cyan-500'} shadow-[0_0_15px_currentColor]"></div>
                    </div>
                    <div class="flex justify-between items-center mb-4">
                        <p class="text-[11px] text-cyan-500/50 orbitron font-black uppercase tracking-widest">${o.cliente || 'NO_NAME'}</p>
                        <span class="text-[8px] orbitron border border-white/10 px-2 py-1 rounded text-slate-500 font-bold uppercase">${o.clase_vehiculo || 'LIVIANO'}</span>
                    </div>
                    <div class="flex justify-between items-end border-t border-white/10 pt-6">
                        <div>
                            <span class="text-[10px] text-slate-500 block uppercase mb-1 font-bold">Utility (BI)</span>
                            <span class="text-xl font-black ${Number(o.costos_totales?.utilidad || 0) > 0 ? 'text-emerald-400' : 'text-white'} orbitron">$ ${Math.round(o.costos_totales?.utilidad || 0).toLocaleString()}</span>
                        </div>
                        <div class="text-right">
                             <span class="text-[8px] text-slate-600 block orbitron uppercase font-black tracking-widest">${o.tipo_orden || 'MECANICA'}</span>
                        </div>
                    </div>
                </div>`).join('');
            }
        });
    };

    const recalcularFinanzas = () => {
        let subtotalVenta = 0;
        let costoRepuestosTaller = 0;
        ordenActiva.items.forEach(i => {
            subtotalVenta += Number(i.venta || 0);
            if (i.origen === "TALLER") costoRepuestosTaller += Number(i.costo || 0);
        });
        const g_insumos = Number(document.getElementById("f-gastos-varios")?.value || 0); 
        const pago_tecnico = Number(document.getElementById("f-adelanto-tecnico")?.value || 0); 
        const anticipo = Number(document.getElementById("f-anticipo-cliente")?.value || 0); 
        const granTotal = subtotalVenta; 
        const baseGravable = granTotal / 1.19;
        const totalIVA = granTotal - baseGravable;
        const utilidadNeta = baseGravable - (costoRepuestosTaller + pago_tecnico + g_insumos);
        const saldoPendiente = granTotal - anticipo;

        ordenActiva.costos_totales = {
            base_gravable: baseGravable, iva_19: totalIVA, gran_total: granTotal,
            utilidad: utilidadNeta, saldo_pendiente: saldoPendiente,
            adelanto_tecnico: pago_tecnico, gastos_operativos: g_insumos, costo_repuestos: costoRepuestosTaller
        };

        const totalEl = document.getElementById("total-factura");
        if(totalEl) {
            totalEl.innerText = `$ ${Math.round(granTotal).toLocaleString()}`;
            document.getElementById("saldo-display").innerHTML = `
                <span class="text-cyan-500/50 text-[10px] uppercase block tracking-widest font-black mb-1">Unpaid Balance</span>
                <span class="${saldoPendiente > 0 ? 'text-red-500' : 'text-emerald-400'} font-black text-2xl orbitron">$ ${Math.round(saldoPendiente).toLocaleString()}</span>
            `;
        }
        renderItems();
    };

    window.generarDocumentoNexus = (tipo) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const colorNexus = [6, 182, 212];
        doc.setFillColor(13, 17, 23);
        doc.rect(0, 0, 210, 45, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text(tipo === 'MANIFIESTO' ? "ORDEN DE TRABAJO" : "REPORTE SAP", 15, 25);
        doc.setFontSize(10);
        doc.text(`${datosTaller.nombre.toUpperCase()} | NIT: ${datosTaller.nit}`, 15, 35);
        doc.setTextColor(40);
        doc.text(`PLACA: ${ordenActiva.placa} | CLIENTE: ${ordenActiva.cliente.toUpperCase()}`, 15, 55);
        const rows = ordenActiva.items.map(i => [i.desc.toUpperCase(), i.tipo, `$ ${Number(i.venta).toLocaleString()}`]);
        doc.autoTable({ startY: 65, head: [['ITEM', 'TIPO', 'VALOR']], body: rows, headStyles: { fillColor: colorNexus } });
        doc.save(`${tipo}_${ordenActiva.placa}.pdf`);
        hablar(`Documento ${tipo} generado`);
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1500px] mx-auto pb-20 animate-in slide-in-from-bottom-10">
            <div class="flex flex-wrap justify-between items-center gap-6 mb-12 bg-[#0d1117] p-10 rounded-[4rem] border-2 border-cyan-500/20 sticky top-0 z-50">
                <div class="flex items-center gap-8">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-6xl font-black orbitron text-white w-64 uppercase text-center rounded-3xl border border-white/10 focus:border-cyan-500 outline-none" placeholder="PLACA">
                    <select id="f-estado" class="bg-cyan-500 text-black orbitron text-xs font-black p-6 rounded-2xl outline-none uppercase">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                </div>
                <div class="flex gap-4">
                    <button onclick="window.generarDocumentoNexus('MANIFIESTO')" class="w-20 h-20 rounded-3xl bg-white/5 text-cyan-400 border border-cyan-500/30 flex flex-col items-center justify-center hover:bg-cyan-500 hover:text-black transition-all">
                        <i class="fas fa-file-pdf text-2xl"></i>
                        <span class="text-[7px] orbitron font-black uppercase mt-1">Export OT</span>
                    </button>
                    <button id="btnWppDirect" class="w-20 h-20 rounded-3xl bg-emerald-500 text-black flex flex-col items-center justify-center hover:scale-110 transition-all">
                        <i class="fab fa-whatsapp text-2xl"></i>
                        <span class="text-[7px] orbitron font-black uppercase mt-1">Connect</span>
                    </button>
                    <button id="btnCloseTerminal" class="w-20 h-20 rounded-3xl bg-red-600 text-white font-black text-3xl hover:rotate-90 transition-all">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div class="lg:col-span-4 space-y-8">
                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5">
                        <label class="text-[10px] text-cyan-400 font-black uppercase block mb-4 tracking-[0.3em]">Master Entity Data</label>
                        <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-black p-6 rounded-3xl border border-white/5 mb-4 text-white uppercase font-bold orbitron text-xs" placeholder="CLIENT NAME">
                        <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-black p-6 rounded-3xl border border-white/5 text-white font-bold mb-4 orbitron text-xs" placeholder="CONTACT PHONE">
                        <div class="grid grid-cols-2 gap-4">
                             <select id="f-tipo-orden" class="bg-black p-4 rounded-2xl border border-white/5 text-[10px] text-slate-400 orbitron">
                                <option value="MECANICA" ${ordenActiva.tipo_orden === 'MECANICA' ? 'selected' : ''}>MECÁNICA</option>
                                <option value="ELECTRICO" ${ordenActiva.tipo_orden === 'ELECTRICO' ? 'selected' : ''}>ELÉCTRICO</option>
                                <option value="PINTURA" ${ordenActiva.tipo_orden === 'PINTURA' ? 'selected' : ''}>LAT/PINT</option>
                             </select>
                             <select id="f-clase-vehiculo" class="bg-black p-4 rounded-2xl border border-white/5 text-[10px] text-slate-400 orbitron">
                                <option value="LIVIANO" ${ordenActiva.clase_vehiculo === 'LIVIANO' ? 'selected' : ''}>LIVIANO</option>
                                <option value="PESADO" ${ordenActiva.clase_vehiculo === 'PESADO' ? 'selected' : ''}>PESADO</option>
                                <option value="MOTO" ${ordenActiva.clase_vehiculo === 'MOTO' ? 'selected' : ''}>MOTOCICLETA</option>
                             </select>
                        </div>
                    </div>
                    <div id="pricing-engine-container"></div>
                    <div class="bg-black p-10 rounded-[3.5rem] border border-red-500/30 relative overflow-hidden">
                        <div id="rec-indicator" class="hidden absolute top-6 right-10 flex items-center gap-2">
                            <div class="h-2 w-2 bg-red-600 rounded-full animate-ping"></div>
                            <span class="text-[8px] orbitron text-red-500 font-black">AI LISTENING</span>
                        </div>
                        <span class="orbitron text-[11px] text-red-500 font-black uppercase mb-6 block italic tracking-tighter">Neural Work Log (BlackBox)</span>
                        <textarea id="ai-log-display" class="w-full bg-[#0d1117] p-6 rounded-3xl text-xs h-64 outline-none border border-white/5 text-slate-300 font-mono italic leading-relaxed">${ordenActiva.bitacora_ia || ''}</textarea>
                        <button id="btnDictar" class="w-full mt-6 py-6 bg-red-600 text-white rounded-3xl orbitron text-xs font-black hover:bg-red-500 transition-all shadow-[0_10px_20px_rgba(220,38,38,0.2)] uppercase">🎤 Start Neural Input</button>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 rounded-[4.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
                        <div class="flex justify-between items-end mb-12 relative z-10">
                            <div>
                                <p class="orbitron text-[14px] text-cyan-400 uppercase font-black mb-2 tracking-[0.2em]">Gross Total Operation</p>
                                <h2 id="total-factura" class="orbitron text-7xl md:text-9xl font-black text-white italic tracking-tighter">$ 0</h2>
                            </div>
                            <div id="saldo-display" class="bg-white/5 p-10 rounded-[4rem] border border-white/10 text-right min-w-[300px]"></div>
                        </div>
                        <div id="items-container" class="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scroll"></div>
                        <div class="grid grid-cols-2 gap-6 mt-10">
                            <button id="btnAddRepuesto" class="py-8 bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10 font-black text-[11px] orbitron hover:bg-white/10 transition-all uppercase tracking-widest">+ Add Part</button>
                            <button id="btnAddMano" class="py-8 bg-cyan-500/5 rounded-[2rem] border-2 border-dashed border-cyan-500/30 text-cyan-400 font-black text-[11px] orbitron hover:bg-cyan-500/10 transition-all uppercase tracking-widest">+ Add Labor</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="bg-black p-8 rounded-[3.5rem] border border-white/5 grid grid-cols-3 gap-6 items-center">
                            <div>
                                <label class="text-[8px] orbitron text-slate-500 block mb-2 font-black uppercase">Anticipo</label>
                                <input type="number" id="f-anticipo-cliente" value="${ordenActiva.finanzas?.anticipo_cliente || 0}" class="w-full bg-emerald-500/10 p-5 rounded-2xl text-emerald-400 font-black border border-emerald-500/20 text-center" onchange="window.actualizarFinanzasDirecto()">
                            </div>
                            <div>
                                <label class="text-[8px] orbitron text-cyan-500 block mb-2 font-black uppercase">Consumables</label>
                                <input type="number" id="f-gastos-varios" value="${ordenActiva.finanzas?.gastos_varios || 0}" class="w-full bg-white/5 p-5 rounded-2xl text-white font-black border border-white/10 text-center" onchange="window.actualizarFinanzasDirecto()">
                            </div>
                            <div>
                                <label class="text-[8px] orbitron text-red-500 block mb-2 font-black uppercase">Technician</label>
                                <input type="number" id="f-adelanto-tecnico" value="${ordenActiva.finanzas?.adelanto_tecnico || 0}" class="w-full bg-red-500/10 p-5 rounded-2xl text-red-500 font-black border border-red-500/20 text-center" onchange="window.actualizarFinanzasDirecto()">
                            </div>
                        </div>
                        <button id="btnSincronizar" class="py-10 bg-white text-black rounded-[4rem] orbitron font-black text-2xl hover:bg-cyan-400 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95 uppercase tracking-tighter">🛰️ Push to Nexus Cloud</button>
                    </div>
                </div>
            </div>
        </div>`;
        
        renderModuloPricing(document.getElementById('pricing-engine-container'));
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    window.ejecutarCalculoTerminator = () => {
        const data = {
            horasEstimadas: parseFloat(document.getElementById('m_horas').value),
            tipoVehiculo: document.getElementById('m_gama').value,
            urgencia: document.getElementById('m_urgencia').value,
            tipoTrabajo: document.getElementById('m_procedimiento').value.toUpperCase().includes("DIAG") ? "DIAGNOSTICO" : "GENERAL"
        };
        const res = analizarPrecioSugerido(data);
        document.getElementById('res_precio').innerText = `$ ${res.precioSugerido.toLocaleString()}`;
        document.getElementById('res_explicacion').innerText = res.explicacion;
        const bitacora = document.getElementById('ai-log-display');
        if(bitacora) bitacora.value += `\n[NEXUS-IA]: Valuation $${res.precioSugerido.toLocaleString()} (${data.horasEstimadas}h). ${res.explicacion}`;
        ordenActiva.items.push({ 
            tipo: 'MANO_OBRA', 
            desc: `LABOR: ${document.getElementById('m_procedimiento').value.toUpperCase()} (${data.horasEstimadas}H)`, 
            costo: 0, venta: res.precioSugerido, origen: 'TALLER' 
        });
        recalcularFinanzas();
        Swal.fire({ icon:'success', title:'AI CALC SYNCED', background:'#0d1117', color:'#06b6d4', showConfirmButton:false, timer:1500 });
    };

    const renderItems = () => {
        const containerItems = document.getElementById("items-container");
        if(!containerItems) return;
        containerItems.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="grid grid-cols-1 md:grid-cols-12 items-center gap-6 bg-white/[0.03] p-7 rounded-[2.5rem] border border-white/5 group hover:border-cyan-500/20 transition-all animate-in fade-in slide-in-from-left-5">
                <div class="md:col-span-1 text-center">
                    <button onclick="window.toggleOrigenItem(${idx})" class="w-14 h-14 rounded-2xl border ${item.origen === 'TALLER' ? 'border-cyan-500/40 text-cyan-400' : 'border-amber-500/40 text-amber-400'} hover:scale-110 transition-all shadow-lg">
                        <i class="fas ${item.origen === 'TALLER' ? 'fa-warehouse' : 'fa-user-tag'}"></i>
                    </button>
                </div>
                <div class="md:col-span-5">
                    <div class="flex items-center gap-3 mb-2">
                        <span class="text-[9px] orbitron font-black uppercase tracking-widest ${item.tipo === 'REPUESTO' ? 'text-orange-500' : 'text-cyan-400'}">${item.tipo}</span>
                        <button onclick="window.buscarEnInventario(${idx})" class="text-white/10 hover:text-cyan-400 transition-all"><i class="fas fa-barcode"></i></button>
                    </div>
                    <input onchange="window.editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" class="w-full bg-transparent border-b border-white/10 outline-none text-white font-bold uppercase text-xs orbitron tracking-tight" placeholder="ITEM DESCRIPTION">
                </div>
                <div class="md:col-span-3">
                    <label class="text-[7px] text-slate-600 block uppercase font-black orbitron mb-2 tracking-widest">Internal Cost</label>
                    <input type="number" onchange="window.editItemNexus(${idx}, 'costo', this.value)" value="${item.costo || 0}" class="w-full bg-black/60 p-4 rounded-xl text-red-400 font-black border border-white/5 text-center text-sm">
                </div>
                <div class="md:col-span-2">
                    <label class="text-[7px] text-slate-600 block uppercase font-black orbitron mb-2 tracking-widest">Public Sale</label>
                    <input type="number" onchange="window.editItemNexus(${idx}, 'venta', this.value)" value="${item.venta || 0}" class="w-full bg-black/60 p-4 rounded-xl text-emerald-400 font-black border border-white/5 text-center text-sm">
                </div>
                <div class="md:col-span-1 text-right">
                    <button onclick="window.removeItemNexus(${idx})" class="text-white/5 hover:text-red-500 transition-all text-2xl p-2">✕</button>
                </div>
            </div>`).join('');
    };

    const ejecutarSincronizacionNexus = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true; btn.innerHTML = `<i class="fas fa-circle-notch animate-spin"></i> SYNCING...`;
        try {
            const placa = document.getElementById("f-placa").value.trim().toUpperCase();
            if(!placa) throw new Error("IDENTIFIER_REQUIRED");
            const docId = ordenActiva.id || `OT_${placa}_${Date.now()}`;
            ordenActiva.finanzas = {
                anticipo_cliente: Number(document.getElementById("f-anticipo-cliente").value),
                gastos_varios: Number(document.getElementById("f-gastos-varios").value),
                adelanto_tecnico: Number(document.getElementById("f-adelanto-tecnico").value)
            };
            const finalData = {
                ...ordenActiva, id: docId, empresaId, placa,
                cliente: document.getElementById("f-cliente").value.toUpperCase(),
                telefono: document.getElementById("f-telefono").value,
                estado: document.getElementById("f-estado").value,
                tipo_orden: document.getElementById("f-tipo-orden").value,
                clase_vehiculo: document.getElementById("f-clase-vehiculo").value,
                bitacora_ia: document.getElementById("ai-log-display").value,
                updatedAt: serverTimestamp()
            };
            await setDoc(doc(db, "ordenes", docId), finalData);
            const totalEgresos = finalData.finanzas.gastos_varios + finalData.finanzas.adelanto_tecnico;
            if(totalEgresos > 0) {
                await setDoc(doc(db, "contabilidad", `EGR_${docId}_${Date.now()}`), {
                    tipo: 'EGRESO_OT', categoria: finalData.finanzas.adelanto_tecnico > 0 ? 'TECH_PAY' : 'SUPPLIES',
                    monto: totalEgresos, ordenId: docId, empresaId, fecha: serverTimestamp()
                });
            }
            Swal.fire({ icon:'success', title:'CLOUD SYNC COMPLETE', background:'#010409', color:'#06b6d4', timer:1500 });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (err) { Swal.fire({ icon:'error', title:'SYNC_ERROR', text:err.message }); }
        finally { btn.disabled = false; btn.innerHTML = `🛰️ Push to Nexus Cloud`; }
    };

    const vincularAccionesTerminal = () => {
        const _id = (id) => document.getElementById(id);
        _id("btnSincronizar").onclick = ejecutarSincronizacionNexus;
        _id("btnCloseTerminal").onclick = () => _id("nexus-terminal").classList.add("hidden");
        _id("btnAddRepuesto").onclick = () => { ordenActiva.items.push({ tipo:'REPUESTO', desc:'NEW COMPONENT', costo:0, venta:0, origen:'TALLER' }); recalcularFinanzas(); };
        _id("btnAddMano").onclick = async () => {
            const { value:tec } = await Swal.fire({ title:'TECH ASSIGN', input:'text', background:'#0d1117', color:'#fff', inputPlaceholder:'TECH NAME' });
            ordenActiva.items.push({ tipo:'MANO_OBRA', desc:`LABOR: ${tec || 'GENERAL'}`, costo:0, venta:0, origen:'TALLER', tecnico:tec || 'UNASSIGNED' });
            recalcularFinanzas();
        };
        _id("btnWppDirect").onclick = () => {
            const tel = _id("f-telefono").value.replace(/\D/g, '');
            const msg = `*NEXUS-X REPORT: ${ordenActiva.placa}*\nSTATUS: ${ordenActiva.estado}\nPENDING: $${Math.round(ordenActiva.costos_totales.saldo_pendiente).toLocaleString()}`;
            if(tel) window.open(`https://wa.me/57${tel}?text=${encodeURIComponent(msg)}`, '_blank');
        };
        _id("btnDictar").onclick = () => {
            if(!isRecording) { recognition?.start(); isRecording = true; _id("rec-indicator").classList.remove("hidden"); hablar("Nexus online"); }
            else { recognition?.stop(); isRecording = false; _id("rec-indicator").classList.add("hidden"); }
        };
        if(recognition) { recognition.onresult = (e) => { _id("ai-log-display").value += " " + e.results[0][0].transcript; }; }
    };

    window.abrirTerminalNexus = (id) => {
        document.getElementById("nexus-terminal").classList.remove("hidden");
        if(id) { 
            getDoc(doc(db, "ordenes", id)).then(s => { 
                ordenActiva = { id, ...s.data() }; 
                if(!ordenActiva.finanzas) ordenActiva.finanzas = { gastos_varios:0, adelanto_tecnico:0, anticipo_cliente:0 };
                renderTerminal(); 
            }); 
        } else {
            ordenActiva = { 
                placa:'', cliente:'', telefono:'', estado:'INGRESO', tipo_orden:'MECANICA', clase_vehiculo:'LIVIANO', 
                items:[], bitacora_ia:'', finanzas: { gastos_varios:0, adelanto_tecnico:0, anticipo_cliente:0 }
            };
            renderTerminal();
        }
    };

    window.nexusRadar = (sitio) => {
        const q = document.getElementById('m_procedimiento').value;
        if(!q) return Swal.fire("Nexus Info", "Identify procedure first", "info");
        const url = sitio === 'autolab' ? `https://autolab.com.co/cotizar?s=${q}` : `https://c3carecenter.com/?s=${q}`;
        window.open(url, '_blank');
    };

    window.toggleOrigenItem = (idx) => { 
        ordenActiva.items[idx].origen = ordenActiva.items[idx].origen === 'TALLER' ? 'CLIENTE' : 'TALLER'; 
        if(ordenActiva.items[idx].origen === 'CLIENTE') ordenActiva.items[idx].costo = 0;
        recalcularFinanzas(); 
    };
    window.editItemNexus = (idx, c, v) => { ordenActiva.items[idx][c] = (c === 'costo' || c === 'venta') ? Number(v) : v; recalcularFinanzas(); };
    window.removeItemNexus = (idx) => { ordenActiva.items.splice(idx, 1); recalcularFinanzas(); };
    window.actualizarFinanzasDirecto = () => recalcularFinanzas();

    window.buscarEnInventario = async (idx) => {
        const snap = await getDocs(query(collection(db, "inventario"), where("empresaId", "==", empresaId)));
        const options = Object.fromEntries(snap.docs.map(d => [JSON.stringify({id:d.id, n:d.data().nombre, c:d.data().costo, v:d.data().precioVenta}), `${d.data().nombre} ($${d.data().precioVenta})`]));
        const { value: res } = await Swal.fire({ title:'NEXUS WAREHOUSE', background:'#0d1117', color:'#fff', input:'select', inputOptions:options, showCancelButton:true });
        if (res) {
            const data = JSON.parse(res);
            ordenActiva.items[idx] = { ...ordenActiva.items[idx], desc:data.n, costo:data.c, venta:data.v, sku:data.id };
            recalcularFinanzas();
        }
    };

    const vincularNavegacion = () => {
        document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus();
        document.querySelectorAll(".fase-tab").forEach(tab => { tab.onclick = () => { faseActual = tab.dataset.fase; renderBase(); }; });
    };

    renderBase();
}
