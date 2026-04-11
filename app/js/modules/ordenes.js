/**
 * ordenes.js - NEXUS-X COMMAND CENTER V6.1 "PENTAGON" 🛰️
 * SISTEMA DE GESTIÓN OPERATIVA CON ENLACE FINANCIERO, ALMACÉN Y MULTIMEDIA
 * Diseñado por: William Jeffry Urquijo & Gemini Nexus AI
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, increment 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { registrarMovimientoContable, descontarStock } from "../services/dataService.js";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("empresaId");
    let ordenActiva = null;
    let faseActual = 'INGRESO';
    let isRecording = false;

    // --- 🏗️ RENDER BASE (Estructura de Control Principal) ---
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
                        <span class="orbitron text-[9px] text-slate-500 group-hover:text-cyan-400 mb-4 block">${fase}</span>
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

    const vincularNavegacion = () => {
        document.querySelectorAll('.fase-tab').forEach(btn => {
            btn.onclick = () => { faseActual = btn.dataset.fase; renderBase(); };
        });
        const btnNew = document.getElementById("btnNewMission");
        if(btnNew) btnNew.onclick = () => abrirTerminal();
    };

    window.abrirTerminalNexus = (id) => abrirTerminal(id);

    // --- 💰 MOTOR FINANCIERO NEXUS-X V6.5 PRO ---
    const recalcularFinanzas = () => {
        let sumaVentaBruta = 0, sumaCostoTaller = 0;
        ordenActiva.items.forEach(i => {
            sumaVentaBruta += Number(i.venta || 0);
            if (i.origen === "TALLER") sumaCostoTaller += Number(i.costo || 0);
        });

        const g_insumos = Number(document.getElementById("f-gastos-varios")?.value || 0); 
        const a_tecnico = Number(document.getElementById("f-adelanto-tecnico")?.value || 0); 
        const a_cliente = Number(document.getElementById("f-anticipo-cliente")?.value || 0); 
        
        const tipoImpuesto = ordenActiva.finanzas?.impuesto_tipo || 'SIN_IVA';
        let porcentaje = (tipoImpuesto === 'IVA_19') ? 0.19 : 0;
        let valorIVA = Math.round((sumaVentaBruta + g_insumos) * porcentaje);
        
        const granTotal = sumaVentaBruta + g_insumos + valorIVA;
        const utilidadNeta = (sumaVentaBruta + g_insumos) - (sumaCostoTaller + g_insumos + a_tecnico);
        const saldoPendiente = granTotal - a_cliente;

        ordenActiva.costos_totales = {
            total_venta: sumaVentaBruta + g_insumos, total_costo: sumaCostoTaller + g_insumos + a_tecnico,
            iva: valorIVA, gran_total: granTotal, utilidad: utilidadNeta, saldo_pendiente: saldoPendiente
        };

        ordenActiva.finanzas = {
            ...ordenActiva.finanzas, gastos_varios: g_insumos, adelanto_tecnico: a_tecnico,
            anticipo_cliente: a_cliente, impuesto_tipo: tipoImpuesto
        };

        const totalEl = document.getElementById("total-factura");
        if(totalEl) {
            totalEl.innerText = `$ ${granTotal.toLocaleString()}`;
            document.getElementById("saldo-display").innerHTML = `
                <span class="text-slate-500 text-[10px] uppercase block tracking-widest font-black">Saldo de Misión</span>
                <span class="${saldoPendiente > 0 ? 'text-emerald-400' : 'text-white'}">$ ${saldoPendiente.toLocaleString()}</span>
            `;
        }
        renderItems();
    };

    const renderItems = () => {
        const container = document.getElementById("items-container");
        if(!container) return;
        container.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="grid grid-cols-1 md:grid-cols-12 items-center gap-4 bg-white/5 p-6 rounded-[2rem] border border-white/5 group hover:bg-white/[0.07] transition-all">
                <div class="md:col-span-1">
                    <button onclick="window.toggleOrigenItem(${idx})" class="w-full h-12 rounded-xl flex flex-col items-center justify-center border ${item.origen === 'TALLER' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}">
                        <i class="fas ${item.origen === 'TALLER' ? 'fa-warehouse' : 'fa-user-tag'} text-[10px]"></i>
                        <span class="text-[6px] orbitron font-black mt-1 uppercase">${item.origen || 'TALLER'}</span>
                    </button>
                </div>
                <div class="md:col-span-4">
                    <div class="flex items-center gap-2">
                        <span class="text-[7px] orbitron ${item.tipo === 'REPUESTO' ? 'text-orange-400' : 'text-cyan-400'} uppercase font-black">${item.tipo}</span>
                        ${item.sku ? `<span class="text-[6px] text-slate-500 font-mono">#${item.sku.slice(-4)}</span>` : ''}
                    </div>
                    <input onchange="window.editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" class="w-full bg-transparent outline-none text-white text-sm uppercase font-bold mt-1" placeholder="Concepto...">
                </div>
                <div class="md:col-span-1 text-center">
                    ${item.tipo === 'REPUESTO' ? `<button onclick="window.buscarEnInventario(${idx})" class="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500 hover:text-white transition-all"><i class="fas fa-barcode"></i></button>` : ''}
                </div>
                <div class="md:col-span-2">
                    <input type="number" onchange="window.editItemNexus(${idx}, 'costo', this.value)" value="${item.costo || 0}" class="w-full bg-black/40 p-3 rounded-xl text-red-400 text-center text-xs font-bold border border-red-900/20 ${item.origen === 'CLIENTE' ? 'opacity-20' : ''}" ${item.origen === 'CLIENTE' ? 'disabled' : ''}>
                </div>
                <div class="md:col-span-3">
                    <input type="number" onchange="window.editItemNexus(${idx}, 'venta', this.value)" value="${item.venta || 0}" class="w-full bg-black/40 p-3 rounded-xl text-emerald-400 text-center text-sm font-black border border-emerald-900/20">
                </div>
                <div class="md:col-span-1 text-right">
                    <button onclick="window.removeItemNexus(${idx})" class="text-white/10 hover:text-red-500 transition-all p-2">✕</button>
                </div>
            </div>`).join('');
    };

    const abrirTerminal = async (id = null) => {
        const modal = document.getElementById("nexus-terminal");
        if(!modal) return;
        modal.classList.remove("hidden");
        if (id) {
            const snap = await getDoc(doc(db, "ordenes", id));
            ordenActiva = { id, ...snap.data() };
        } else {
            ordenActiva = {
                placa: '', cliente: '', telefono: '', estado: 'INGRESO', items: [], bitacora_ia: '', 
                finanzas: { gastos_varios: 0, adelanto_tecnico: 0, anticipo_cliente: 0, impuesto_tipo: 'SIN_IVA' },
                costos_totales: { total_venta: 0, total_costo: 0, utilidad: 0, iva: 0, gran_total: 0, saldo_pendiente: 0 }
            };
        }
        renderTerminal();
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1400px] mx-auto pb-24 animate-in zoom-in duration-300">
            <div class="flex flex-wrap justify-between items-center gap-6 mb-10 bg-[#0d1117]/80 backdrop-blur-xl p-8 rounded-[3rem] border border-white/5 sticky top-0 z-50">
                <div class="flex items-center gap-6">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-transparent text-5xl font-black orbitron text-cyan-400 outline-none w-52 uppercase" placeholder="PLACA">
                    <select id="f-estado" class="bg-black text-cyan-400 orbitron text-[10px] p-4 rounded-2xl border border-cyan-500/20 outline-none">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                </div>
                <div class="flex gap-4">
                    <button id="btnCloseTerminal" class="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 font-black hover:bg-red-500 hover:text-white transition-all">✕</button>
                </div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div class="lg:col-span-4 space-y-8">
                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 shadow-xl">
                        <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-white/5 p-6 rounded-3xl border border-white/5 outline-none font-bold uppercase mb-4" placeholder="CLIENTE">
                        <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-white/5 p-6 rounded-3xl border border-white/5 outline-none" placeholder="TELÉFONO">
                    </div>
                    <div class="bg-black p-10 rounded-[3.5rem] border border-cyan-500/20">
                        <textarea id="ai-log-display" class="w-full bg-white/5 p-6 rounded-3xl text-xs h-44 outline-none border border-white/5 italic text-slate-300 resize-none">${ordenActiva.bitacora_ia || ''}</textarea>
                        <button id="btnDictar" class="w-full mt-6 py-5 bg-cyan-500 text-black rounded-2xl orbitron text-[9px] font-black italic">🎤 INICIAR ESCUCHA NEURAL</button>
                    </div>
                </div>
                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
                        <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
                            <div><p class="orbitron text-[12px] text-cyan-400 uppercase italic font-black">Total Inversión</p><h2 id="total-factura" class="orbitron text-7xl font-black text-white italic tracking-tighter">$ 0</h2></div>
                            <div class="bg-emerald-500/5 p-8 rounded-[3rem] border border-emerald-500/10 text-right min-w-[280px]">
                                <div id="saldo-display" class="text-3xl font-black text-white orbitron italic mb-4"></div>
                                <input type="number" id="f-anticipo-cliente" value="${ordenActiva.finanzas?.anticipo_cliente || 0}" class="bg-black/40 p-4 rounded-xl text-right text-emerald-400 font-black orbitron w-full border border-emerald-500/10" onchange="window.actualizarFinanzasDirecto()">
                            </div>
                        </div>
                        <div id="items-container" class="space-y-4 max-h-[550px] overflow-y-auto pr-4 mb-10"></div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button id="btnAddRepuesto" class="py-8 bg-white/5 rounded-[2rem] border border-white/10 orbitron text-[11px] font-black tracking-widest">+ Buscar Pieza</button>
                            <button id="btnAddMano" class="py-8 bg-cyan-500/5 rounded-[2rem] border border-cyan-500/20 text-cyan-400 orbitron text-[11px] font-black tracking-widest">+ Mano de Obra</button>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <button id="btnCierreFinanciero" class="py-12 bg-gradient-to-r from-red-600 to-red-900 text-white rounded-[3rem] orbitron font-black text-[14px] uppercase shadow-xl">Ejecutar Cierre Maestro</button>
                        <button id="btnSincronizar" class="py-12 bg-white text-black rounded-[3rem] orbitron font-black text-[16px] uppercase tracking-[0.4em]">🛰️ Full Sync Nexus</button>
                    </div>
                </div>
            </div>
        </div>`;
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    // --- 📡 PROTOCOLO DE SINCRONIZACIÓN MAESTRA ---
    const ejecutarSincronizacionNexus = async () => {
        const btn = document.getElementById("btnSincronizar");
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> SINCRONIZANDO...`;
        
        try {
            const placaLimpia = document.getElementById("f-placa").value.trim().toUpperCase();
            const estadoOrden = document.getElementById("f-estado").value;
            const docId = ordenActiva.id || `OT_${placaLimpia}_${Date.now().toString().slice(-4)}`;

            const dataOrden = {
                ...ordenActiva, id: docId, empresaId, placa: placaLimpia,
                cliente: document.getElementById("f-cliente").value.toUpperCase(),
                telefono: document.getElementById("f-telefono").value,
                estado: estadoOrden,
                bitacora_ia: document.getElementById("ai-log-display").value,
                updatedAt: serverTimestamp()
            };

            // 1. Guardado de Orden
            await setDoc(doc(db, "ordenes", docId), dataOrden);

            // 2. Historial de Vehículo (Actualización Atómica)
            await setDoc(doc(db, "vehiculos", placaLimpia), {
                placa: placaLimpia, empresaId, clienteNombre: dataOrden.cliente,
                ultimaActualizacion: serverTimestamp(),
                status: (estadoOrden === 'LISTO' || estadoOrden === 'ENTREGADO') ? 'OPERATIVO' : 'EN TALLER'
            }, { merge: true });

            // 3. Lógica de Cierre (Contabilidad e Inventario)
            if (estadoOrden === "ENTREGADO") {
                const batchPromises = [];
                // Registro Contable
                batchPromises.push(addDoc(collection(db, "contabilidad"), {
                    empresaId, monto: dataOrden.costos_totales.gran_total, tipo: "ingreso_ot",
                    concepto: `PAGO OT: ${placaLimpia}`, referencia: docId, creadoEn: serverTimestamp()
                }));

                // Gestión de Inventario Real
                for (const item of dataOrden.items) {
                    if (item.tipo === 'REPUESTO' && item.sku && item.origen === 'TALLER') {
                        const invRef = doc(db, "inventario", item.sku);
                        batchPromises.push(updateDoc(invRef, { cantidad: increment(-1) }));
                    }
                }
                await Promise.all(batchPromises);
                generarCertificadoTecnico(dataOrden);
            }

            if (typeof hablar === 'function') hablar(`Sincronización exitosa.`);
            Swal.fire({ icon: 'success', title: 'SINCRO COMPLETA', background: '#0d1117', color: '#fff', timer: 1500 });
            document.getElementById("nexus-terminal").classList.add("hidden");
            renderBase();

        } catch (err) {
            console.error("Critical Sync Error:", err);
            Swal.fire('FALLO DE NODO', 'Error de conexión Firestore.', 'error');
        } finally {
            btn.innerHTML = originalText;
        }
    };

    // --- ⚙️ HELPER FUNCTIONS (Puente Global) ---
    window.cambiarTipoImpuesto = (tipo) => { ordenActiva.finanzas.impuesto_tipo = tipo; recalcularFinanzas(); };
    window.toggleOrigenItem = (idx) => { 
        const it = ordenActiva.items[idx]; 
        it.origen = it.origen === 'TALLER' ? 'CLIENTE' : 'TALLER'; 
        if(it.origen === 'CLIENTE') it.costo = 0; 
        recalcularFinanzas(); 
    };
    window.editItemNexus = (idx, campo, val) => { ordenActiva.items[idx][campo] = val; recalcularFinanzas(); };
    window.removeItemNexus = (idx) => { ordenActiva.items.splice(idx, 1); recalcularFinanzas(); };
    window.actualizarFinanzasDirecto = () => recalcularFinanzas();

    const vincularAccionesTerminal = () => {
        document.getElementById("btnSincronizar").onclick = ejecutarSincronizacionNexus;
        document.getElementById("btnCierreFinanciero").onclick = () => {
            document.getElementById("f-estado").value = "ENTREGADO";
            ejecutarSincronizacionNexus();
        };
        document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
        document.getElementById("btnDictar").onclick = () => {
            if(!isRecording) { recognition?.start(); isRecording = true; } else { recognition?.stop(); isRecording = false; }
        };
        if(recognition) recognition.onresult = (e) => { document.getElementById("ai-log-display").value = Array.from(e.results).map(r => r[0].transcript).join(''); };
        document.getElementById("btnAddRepuesto").onclick = () => { ordenActiva.items.push({ tipo: 'REPUESTO', desc: 'NUEVA PIEZA', costo: 0, venta: 0, origen: 'TALLER' }); recalcularFinanzas(); };
        document.getElementById("btnAddMano").onclick = () => { ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: 'SERVICIO TÉCNICO', costo: 0, venta: 0, origen: 'TALLER' }); recalcularFinanzas(); };
    };

    const generarCertificadoTecnico = (o) => {
        const win = window.open('', '_blank');
        win.document.write(`<html><body style="font-family:Arial;padding:40px;"><h1>CERTIFICADO TÉCNICO NEXUS</h1><p>PLACA: ${o.placa}</p><ul>${o.items.map(i => `<li>${i.desc}</li>`).join('')}</ul><p>TOTAL: $${o.costos_totales.gran_total.toLocaleString()}</p></body></html>`);
        win.print();
    };

    renderBase();
} // Cierre del Export Default
