/**
 * ordenes.js - NEXUS-X COMMAND CENTER V6.5 "PENTAGON" 🛰️
 * SISTEMA DE GESTIÓN OPERATIVA CON ENLACE FINANCIERO, ALMACÉN Y MULTIMEDIA
 * Integración Quirúrgica con Vault Stock V20.0
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, deleteDoc, updateDoc, serverTimestamp, increment 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

export default async function ordenes(container) {
    // Sincronización de ID de empresa con inventario.js
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    let ordenActiva = null;
    let faseActual = 'INGRESO';
    let isRecording = false;

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 border-b border-white/5 pb-12">
                <div class="space-y-3">
                    <div class="flex items-center gap-5">
                        <div class="h-4 w-4 bg-cyan-500 rounded-full animate-ping shadow-[0_0_20px_#00f2ff]"></div>
                        <h1 class="orbitron text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase">Nexus_<span class="text-cyan-400">OT</span></h1>
                    </div>
                    <p class="text-[11px] orbitron text-slate-500 tracking-[0.5em] uppercase italic">Aerospace Vehicle Logistics System</p>
                </div>
                <div class="flex gap-4 w-full md:w-auto">
                    <button id="btnNewMission" class="flex-1 md:flex-none px-10 py-6 bg-white text-black rounded-[2rem] orbitron text-[12px] font-black hover:bg-cyan-400 transition-all">NUEVA MISIÓN +</button>
                </div>
            </header>

            <nav class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16">
                ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="fase-tab p-6 rounded-[2.5rem] bg-[#0d1117] border border-white/5 transition-all group ${faseActual === fase ? 'border-cyan-500/50 shadow-glow-cyan' : ''}" data-fase="${fase}">
                        <span class="orbitron text-[9px] text-slate-500 group-hover:text-cyan-400 mb-2 block">${fase}</span>
                        <h3 id="count-${fase}" class="text-3xl font-black text-white group-hover:scale-110 transition-all">0</h3>
                    </button>
                `).join('')}
            </nav>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-[#010409]/98 backdrop-blur-3xl p-4 lg:p-12 overflow-y-auto"></div>
        </div>`;
        
        vincularNavegacion();
        cargarEscuchaGlobal();
    };

    const cargarEscuchaGlobal = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const counts = { COTIZACION: 0, INGRESO: 0, DIAGNOSTICO: 0, REPARACION: 0, LISTO: 0 };
            const grilla = [];
            snap.docs.forEach(d => {
                const dt = d.data();
                if(counts.hasOwnProperty(dt.estado)) counts[dt.estado]++;
                if(dt.estado === faseActual) grilla.push({ id: d.id, ...dt });
            });
            
            Object.keys(counts).forEach(f => { 
                const el = document.getElementById(`count-${f}`);
                if(el) el.innerText = counts[f]; 
            });

            const gridContainer = document.getElementById("grid-ordenes");
            if(gridContainer) {
                gridContainer.innerHTML = grilla.map(o => `
                <div onclick="window.abrirTerminalNexus('${o.id}')" class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 hover:border-cyan-500/50 transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-4 shadow-xl">
                    <div class="flex justify-between items-start mb-4">
                         <span class="orbitron text-3xl font-black text-white group-hover:text-cyan-400">${o.placa}</span>
                         <span class="text-[8px] bg-white/5 px-3 py-1 rounded-full orbitron text-slate-400 border border-white/5">${o.estado}</span>
                    </div>
                    <p class="text-[9px] text-slate-500 orbitron italic tracking-widest uppercase">${o.cliente || 'ANÓNIMO'}</p>
                    <div class="mt-6 flex justify-between items-center border-t border-white/5 pt-4">
                        <span class="text-xl font-black text-white orbitron">$ ${Number(o.costos_totales?.gran_total || 0).toLocaleString()}</span>
                        <div class="h-10 w-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400"><i class="fas fa-arrow-right"></i></div>
                    </div>
                </div>`).join('');
            }
        });
    };

        // --- 💰 NÚCLEO FINANCIERO PENTAGON V6.5 ---
    const recalcularFinanzas = () => {
        let sumaVentaBruta = 0;
        let sumaCostoTaller = 0;

        ordenActiva.items.forEach(i => {
            sumaVentaBruta += Number(i.venta || 0);
            if (i.origen === "TALLER") { sumaCostoTaller += Number(i.costo || 0); }
        });

        const g_insumos = Number(document.getElementById("f-gastos-varios")?.value || 0); 
        const a_tecnico = Number(document.getElementById("f-adelanto-tecnico")?.value || 0); 
        const a_cliente = Number(document.getElementById("f-anticipo-cliente")?.value || 0); 
        
        let valorIVA = (ordenActiva.finanzas?.impuesto_tipo === 'IVA_19') ? (sumaVentaBruta + g_insumos) * 0.19 : 0;
        const granTotal = sumaVentaBruta + g_insumos + valorIVA;
        const utilidadNeta = (sumaVentaBruta + g_insumos) - (sumaCostoTaller + g_insumos + a_tecnico);
        const saldoPendiente = granTotal - a_cliente;

        ordenActiva.costos_totales = {
            total_venta: sumaVentaBruta + g_insumos,
            total_costo: sumaCostoTaller + g_insumos + a_tecnico,
            iva: valorIVA,
            gran_total: granTotal,
            utilidad: utilidadNeta,
            saldo_pendiente: saldoPendiente
        };

        ordenActiva.finanzas = {
            ...ordenActiva.finanzas,
            gastos_varios: g_insumos,
            adelanto_tecnico: a_tecnico,
            anticipo_cliente: a_cliente
        };

        // Renderizado de Totales con Alta Visibilidad
        const totalEl = document.getElementById("total-factura");
        if(totalEl) {
            totalEl.innerText = `$ ${granTotal.toLocaleString()}`;
            document.getElementById("saldo-display").innerHTML = `
                <div class="flex flex-col items-end">
                    <span class="text-white/40 text-[9px] uppercase tracking-[0.3em] font-black">Saldo de Misión</span>
                    <span class="text-3xl md:text-4xl text-white font-black drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        $ ${saldoPendiente.toLocaleString()}
                    </span>
                </div>
            `;
        }
        renderItems();
    };

    // --- 🎮 TERMINAL DE COMANDO PENTAGON V6.5 ---
    const abrirTerminal = async (id = null) => {
        const modal = document.getElementById("nexus-terminal");
        modal.classList.remove("hidden");
        
        if (id) {
            const snap = await getDoc(doc(db, "ordenes", id));
            ordenActiva = { id, ...snap.data() };
        } else {
            ordenActiva = {
                placa: '', cliente: '', telefono: '', estado: 'INGRESO', items: [], 
                bitacora_ia: '', 
                finanzas: { gastos_varios: 0, adelanto_tecnico: 0, anticipo_cliente: 0, impuesto_tipo: 'IVA_19' },
                costos_totales: { total_venta: 0, total_costo: 0, utilidad: 0, iva: 0, gran_total: 0, saldo_pendiente: 0 }
            };
        }
        renderTerminal();
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1400px] mx-auto pb-20 animate-in zoom-in duration-300">
            <div class="flex flex-wrap justify-between items-center gap-6 mb-10 bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl sticky top-0 z-50">
                <div class="flex items-center gap-6">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-transparent text-5xl font-black orbitron text-cyan-400 outline-none w-52 uppercase focus:border-b-2 border-cyan-500" placeholder="PLACA">
                    <div class="h-10 w-[1px] bg-white/10 mx-4"></div>
                    <select id="f-estado" class="bg-black text-cyan-400 orbitron text-[10px] p-4 rounded-2xl border border-cyan-500/20 outline-none">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                </div>
                <div class="flex gap-3">
                    <input type="file" id="inputCapture" accept="image/*,video/*" capture="environment" class="hidden">
                    <button onclick="document.getElementById('inputCapture').click()" class="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 hover:bg-cyan-500 hover:text-white transition-all">
                        <i class="fas fa-camera text-xl"></i>
                    </button>
                    <button id="btnWppDirect" class="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all">
                        <i class="fab fa-whatsapp text-2xl"></i>
                    </button>
                    <button id="btnCloseTerminal" class="w-16 h-16 rounded-2xl bg-white/10 text-white font-black text-2xl hover:bg-white hover:text-black transition-all">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div class="lg:col-span-4 space-y-8">
                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 shadow-xl">
                        <label class="text-[9px] text-slate-500 font-black uppercase mb-6 block tracking-[0.2em]">Expediente de Misión</label>
                        <div class="space-y-4">
                            <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-white/5 p-6 rounded-3xl border border-white/5 outline-none font-bold uppercase focus:border-cyan-500/30" placeholder="NOMBRE PROPIETARIO">
                            <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-white/5 p-6 rounded-3xl border border-white/5 outline-none focus:border-cyan-500/30" placeholder="WHATSAPP (+57)">
                        </div>
                    </div>

                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 space-y-8">
                        <div>
                            <label class="text-[9px] orbitron text-cyan-400 font-black mb-3 block uppercase italic tracking-widest">Insumos / Gastos Varios</label>
                            <input type="number" id="f-gastos-varios" value="${ordenActiva.finanzas?.gastos_varios || 0}" class="w-full bg-black/50 p-6 rounded-2xl text-white border border-white/10 text-2xl font-bold orbitron text-center focus:border-cyan-500" onchange="window.actualizarFinanzasDirecto()">
                        </div>
                        <div>
                            <label class="text-[9px] orbitron text-red-400 font-black mb-3 block uppercase italic tracking-widest">Pago / Adelanto Técnico</label>
                            <input type="number" id="f-adelanto-tecnico" value="${ordenActiva.finanzas?.adelanto_tecnico || 0}" class="w-full bg-black/50 p-6 rounded-2xl text-white border border-white/10 text-2xl font-bold orbitron text-center focus:border-red-500" onchange="window.actualizarFinanzasDirecto()">
                        </div>
                    </div>

                    <div class="bg-black p-10 rounded-[3.5rem] border border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.1)]">
                        <div class="flex justify-between items-center mb-6">
                            <span class="orbitron text-[10px] text-cyan-400 font-black italic tracking-widest uppercase">Nexus AI Voice Log</span>
                            <div id="rec-indicator" class="flex gap-1 items-center hidden"><div class="h-2 w-2 bg-red-600 rounded-full animate-pulse"></div></div>
                        </div>
                        <textarea id="ai-log-display" class="w-full bg-white/5 p-6 rounded-3xl text-xs h-40 outline-none border border-white/5 italic text-slate-300 resize-none font-mono">${ordenActiva.bitacora_ia || ''}</textarea>
                        <button id="btnDictar" class="w-full mt-6 py-5 bg-cyan-500 text-black rounded-2xl orbitron text-[9px] font-black hover:bg-white transition-all">🎤 INICIAR ESCUCHA NEURAL</button>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
                        <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-8 relative z-10">
                            <div>
                                <p class="orbitron text-[12px] text-cyan-400 uppercase italic font-black tracking-[0.3em]">Total Bruto</p>
                                <h2 id="total-factura" class="orbitron text-7xl md:text-[9rem] font-black text-white italic tracking-tighter leading-none">$ 0</h2>
                            </div>
                            
                            <div class="bg-emerald-600/20 p-8 rounded-[2.5rem] border-2 border-emerald-400/50 shadow-[0_10px_40px_rgba(16,185,129,0.1)] text-right min-w-[300px]">
                                <label class="text-[10px] text-emerald-400 font-black uppercase mb-2 block tracking-widest">Anticipo / Abono:</label>
                                <input type="number" id="f-anticipo-cliente" value="${ordenActiva.finanzas?.anticipo_cliente || 0}" class="bg-transparent text-right text-white font-black outline-none w-full text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] mb-4" onchange="window.actualizarFinanzasDirecto()">
                                <div id="saldo-display" class="border-t border-emerald-500/30 pt-4"></div>
                            </div>
                        </div>

                        <div id="items-container" class="space-y-4 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar"></div>
                        
                        <div class="grid grid-cols-2 gap-6 mt-12">
                            <button id="btnAddRepuesto" class="py-8 bg-white/5 rounded-3xl border border-white/10 orbitron text-[11px] font-black hover:bg-white/10 transition-all uppercase tracking-widest">+ Repuesto</button>
                            <button id="btnAddMano" class="py-8 bg-cyan-500/5 rounded-3xl border border-cyan-500/20 text-cyan-400 orbitron text-[11px] font-black hover:bg-cyan-500/10 transition-all uppercase tracking-widest">+ Mano de Obra</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button id="btnCierreFinanciero" class="py-12 bg-gradient-to-br from-red-600 to-red-900 text-white rounded-[3rem] orbitron font-black text-[14px] uppercase hover:scale-[1.02] transition-transform shadow-2xl">EJECUTAR CIERRE DE CAJA</button>
                        <button id="btnSincronizar" class="py-12 bg-white text-black rounded-[3rem] orbitron font-black text-[18px] uppercase tracking-[0.3em] hover:scale-[1.02] transition-transform shadow-2xl">🛰️ NEXUS SYNC</button>
                    </div>
                </div>
            </div>
        </div>`;
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

        // --- 🛰️ CIERRE OPERATIVO & SINCRONIZACIÓN ---
    const ejecutarSincronizacionNexus = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.innerHTML = `<i class="fas fa-sync fa-spin"></i> ENLAZANDO...`;
        
        try {
            const placaLimpia = document.getElementById("f-placa").value.trim().toUpperCase();
            const estadoOrden = document.getElementById("f-estado").value;
            const docId = ordenActiva.id || `OT_${placaLimpia}_${Date.now().toString().slice(-4)}`;

            const dataOrden = {
                ...ordenActiva,
                id: docId, empresaId,
                placa: placaLimpia,
                cliente: document.getElementById("f-cliente").value.trim().toUpperCase(),
                telefono: document.getElementById("f-telefono").value.trim(),
                estado: estadoOrden,
                bitacora_ia: document.getElementById("ai-log-display").value,
                updatedAt: serverTimestamp()
            };

            await setDoc(doc(db, "ordenes", docId), dataOrden);

            if (estadoOrden === "LISTO" || estadoOrden === "ENTREGADO") {
                for (const item of dataOrden.items) {
                    if (item.tipo === 'REPUESTO' && item.sku && item.origen === 'TALLER') {
                        const invRef = doc(db, "inventario", item.sku);
                        await updateDoc(invRef, { cantidad: increment(-1) });
                    }
                }
            }

            hablar(`Misión ${placaLimpia} sincronizada.`);
            Swal.fire({ icon: 'success', title: 'NEXUS SYNC OK', background: '#0d1117', color: '#fff', timer: 1500 });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (err) {
            console.error(err);
            Swal.fire('ERROR DE NODO', err.message, 'error');
        } finally {
            btn.innerHTML = `🛰️ SINCRONIZAR NEXUS`;
        }
    };

    // --- 📦 INTEGRACIÓN CON BÓVEDA DE INVENTARIO ---
    window.buscarEnInventario = async (idx) => {
        const { value: selectedItem } = await Swal.fire({
            title: 'BÓVEDA DE SUMINISTROS',
            background: '#010409', color: '#fff',
            html: `<select id="swal-sku" class="w-full bg-[#0d1117] p-4 rounded-2xl text-white border border-white/10 orbitron text-xs uppercase"><option>Cargando Bóveda...</option></select>`,
            didOpen: async () => {
                const q = query(collection(db, "inventario"), where("empresaId", "==", empresaId));
                const snap = await getDocs(q);
                const select = document.getElementById("swal-sku");
                select.innerHTML = '<option value="">-- SELECCIONE PIEZA --</option>' + 
                    snap.docs.map(d => {
                        const data = d.data();
                        return `<option value='${JSON.stringify({id: d.id, n: data.nombre, c: data.costo, v: data.precioVenta})}'>${data.nombre} (${data.cantidad} DISP)</option>`;
                    }).join('');
            },
            preConfirm: () => {
                const val = document.getElementById("swal-sku").value;
                return val ? JSON.parse(val) : null;
            }
        });

        if (selectedItem) {
            ordenActiva.items[idx] = { 
                ...ordenActiva.items[idx], 
                desc: selectedItem.n, costo: selectedItem.c, venta: selectedItem.v, 
                sku: selectedItem.id, tipo: 'REPUESTO', origen: 'TALLER' 
            };
            recalcularFinanzas(); // Reconecta el renderizado tras seleccionar
        }
    };

    // --- 🔗 VINCULACIÓN DE EVENTOS DE TERMINAL ---
    const vincularAccionesTerminal = () => {
        document.getElementById("btnSincronizar").onclick = ejecutarSincronizacionNexus;
        document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
        
        // Dictado por voz
        document.getElementById("btnDictar").onclick = () => {
            if(!isRecording) { recognition?.start(); isRecording = true; document.getElementById("rec-indicator").classList.remove("hidden"); }
            else { recognition?.stop(); isRecording = false; document.getElementById("rec-indicator").classList.add("hidden"); }
        };
        if(recognition) recognition.onresult = (e) => { document.getElementById("ai-log-display").value += " " + e.results[0][0].transcript; };

        // WhatsApp Directo con número configurado
        document.getElementById("btnWppDirect").onclick = () => {
            const telefono = document.getElementById("f-telefono").value.trim() || "17049419163";
            const msg = `*TALLERPRO-360 [${ordenActiva.placa}]*%0A✅ Vehículo listo.%0A💰 Saldo: $${ordenActiva.costos_totales.saldo_pendiente.toLocaleString()}`;
            window.open(`https://wa.me/${telefono}?text=${msg}`, '_blank');
        };

        // RECONEXIÓN TOTAL DE BOTONES (+)
        document.getElementById("btnAddRepuesto").onclick = () => { 
            ordenActiva.items.push({ tipo: 'REPUESTO', desc: 'PIEZA NUEVA', costo: 0, venta: 0, origen: 'TALLER' }); 
            recalcularFinanzas(); // Dispara renderItems()
        };
        
        document.getElementById("btnAddMano").onclick = () => { 
            ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: 'SERVICIO TÉCNICO', costo: 0, venta: 0, origen: 'TALLER' }); 
            recalcularFinanzas(); // Dispara renderItems()
        };
    };

    // --- ⚙️ HELPERS GLOBALES ---
    window.toggleOrigenItem = (idx) => { const it = ordenActiva.items[idx]; it.origen = it.origen === 'TALLER' ? 'CLIENTE' : 'TALLER'; if(it.origen === 'CLIENTE') it.costo = 0; recalcularFinanzas(); };
    window.editItemNexus = (idx, campo, val) => { ordenActiva.items[idx][campo] = (campo === 'costo' || campo === 'venta') ? Number(val) : val; recalcularFinanzas(); };
    window.removeItemNexus = (idx) => { ordenActiva.items.splice(idx, 1); recalcularFinanzas(); };
    window.abrirTerminalNexus = (id) => abrirTerminal(id);
    window.actualizarFinanzasDirecto = () => recalcularFinanzas();

    const vincularNavegacion = () => {
        document.getElementById("btnNewMission").onclick = () => abrirTerminal();
        document.querySelectorAll(".fase-tab").forEach(tab => { tab.onclick = () => { faseActual = tab.dataset.fase; renderBase(); }; });
    };

    renderBase();
}
