/**
 * ordenes.js - NEXUS-X COMMAND CENTER V6.1 "PENTAGON" 🛰️
 * SISTEMA DE GESTIÓN OPERATIVA CON ENLACE FINANCIERO, ALMACÉN Y MULTIMEDIA
 * Diseñado por: William Jeffry Urquijo & Gemini Nexus AI
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, 
    setDoc, deleteDoc, serverTimestamp, increment 
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

    // --- 🛰️ RADAR DE DATOS (Real-Time Feedback) ---
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

    // --- 💰 MOTOR FINANCIERO NEXUS-X V6.1 ---
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

        const totalEl = document.getElementById("total-factura");
        if(totalEl) {
            totalEl.innerText = `$ ${granTotal.toLocaleString()}`;
            document.getElementById("saldo-display").innerHTML = `
                <span class="text-slate-500 text-[10px] uppercase block tracking-widest font-black">Saldo de Misión</span>
                $ ${saldoPendiente.toLocaleString()}
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
                        <i class="fas ${item.origen === 'TALLER' ? 'fa-warehouse' : 'fa-user-tag'} text-xs"></i>
                        <span class="text-[6px] orbitron font-black mt-1">${item.origen || 'TALLER'}</span>
                    </button>
                </div>
                <div class="md:col-span-4">
                    <span class="text-[8px] orbitron ${item.tipo === 'REPUESTO' ? 'text-orange-400' : 'text-cyan-400'} uppercase font-black">${item.tipo}</span>
                    <input onchange="window.editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" class="w-full bg-transparent outline-none text-white text-sm uppercase font-bold mt-1" placeholder="Concepto...">
                </div>
                <div class="md:col-span-1">
                    <button onclick="window.buscarEnInventario(${idx})" class="text-cyan-500 hover:text-white transition-all"><i class="fas fa-barcode"></i></button>
                </div>
                <div class="md:col-span-2">
                    <label class="text-[7px] text-slate-500 block mb-1 uppercase font-black italic">Costo</label>
                    <input type="number" onchange="window.editItemNexus(${idx}, 'costo', this.value)" value="${item.costo || 0}" class="w-full bg-black/40 p-3 rounded-xl text-red-400 text-center text-xs font-bold border border-red-900/20 ${item.origen === 'CLIENTE' ? 'opacity-20 grayscale' : ''}" ${item.origen === 'CLIENTE' ? 'disabled' : ''}>
                </div>
                <div class="md:col-span-3">
                    <label class="text-[7px] text-slate-500 block mb-1 uppercase font-black italic">PVP Venta</label>
                    <input type="number" onchange="window.editItemNexus(${idx}, 'venta', this.value)" value="${item.venta || 0}" class="w-full bg-black/40 p-3 rounded-xl text-emerald-400 text-center text-sm font-black border border-emerald-900/20">
                </div>
                <div class="md:col-span-1 text-right">
                    <button onclick="window.removeItemNexus(${idx})" class="text-white/20 hover:text-red-500 transition-all p-2">✕</button>
                </div>
            </div>`).join('');
    };

    // --- 🎮 TERMINAL DE COMANDO PENTAGON ---
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
            <div class="flex flex-wrap justify-between items-center gap-6 mb-10 bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                <div class="flex items-center gap-6">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-transparent text-5xl font-black orbitron text-cyan-400 outline-none w-52 uppercase focus:border-b-2 border-cyan-500" placeholder="PLACA">
                    <div class="h-10 w-[1px] bg-white/10 mx-4"></div>
                    <select id="f-estado" class="bg-black text-cyan-400 orbitron text-[10px] p-4 rounded-2xl border border-cyan-500/20 outline-none">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'GARANTIA'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                </div>
                <div class="flex gap-3">
                    <button id="btnCapturePhoto" class="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 hover:bg-cyan-500 hover:text-white transition-all"><i class="fas fa-camera text-xl"></i></button>
                    <button id="btnCaptureVideo" class="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-all"><i class="fas fa-video text-xl"></i></button>
                    <button id="btnWppDirect" class="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"><i class="fab fa-whatsapp text-xl"></i></button>
                    <button id="btnCloseTerminal" class="w-14 h-14 rounded-[1.5rem] bg-white/10 text-white font-black text-2xl hover:bg-white hover:text-black transition-all">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div class="lg:col-span-4 space-y-8">
                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 shadow-xl">
                        <label class="text-[9px] text-slate-500 font-black uppercase mb-4 block tracking-[0.2em]">Expediente del Propietario</label>
                        <div class="space-y-4">
                            <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-white/5 p-6 rounded-3xl border border-white/5 outline-none font-bold uppercase focus:border-cyan-500/30" placeholder="NOMBRE CLIENTE">
                            <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-white/5 p-6 rounded-3xl border border-white/5 outline-none focus:border-cyan-500/30" placeholder="TELÉFONO">
                        </div>
                    </div>

                    <div class="bg-black p-10 rounded-[3.5rem] border border-cyan-500/20 shadow-glow-cyan">
                        <div class="flex justify-between items-center mb-6">
                            <span class="orbitron text-[10px] text-cyan-400 font-black italic tracking-widest uppercase">Nexus AI Voice Log</span>
                            <div id="rec-indicator" class="flex gap-1 items-center hidden"><div class="h-2 w-2 bg-red-600 rounded-full animate-pulse"></div></div>
                        </div>
                        <textarea id="ai-log-display" class="w-full bg-white/5 p-6 rounded-3xl text-xs h-44 outline-none border border-white/5 italic text-slate-300 resize-none">${ordenActiva.bitacora_ia || ''}</textarea>
                        <button id="btnDictar" class="w-full mt-6 py-5 bg-cyan-500 text-black rounded-2xl orbitron text-[9px] font-black hover:bg-white transition-all">🎤 INICIAR ESCUCHA NEURAL</button>
                    </div>

                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 space-y-6">
                        <div>
                            <label class="text-[8px] text-red-400 font-black uppercase mb-2 block tracking-widest">Insumos / Terceros</label>
                            <input type="number" id="f-gastos-varios" value="${ordenActiva.finanzas?.gastos_varios || 0}" class="w-full bg-black/50 p-5 rounded-2xl text-white border border-white/5 text-xl font-bold" onchange="window.actualizarFinanzasDirecto()">
                        </div>
                        <div>
                            <label class="text-[8px] text-red-400 font-black uppercase mb-2 block tracking-widest">Adelanto Técnico</label>
                            <input type="number" id="f-adelanto-tecnico" value="${ordenActiva.finanzas?.adelanto_tecnico || 0}" class="w-full bg-black/50 p-5 rounded-2xl text-white border border-white/5 text-xl font-bold" onchange="window.actualizarFinanzasDirecto()">
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
                        <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-8 relative z-10">
                            <div>
                                <p class="orbitron text-[12px] text-cyan-400 uppercase italic font-black tracking-[0.3em]">Total Misión</p>
                                <h2 id="total-factura" class="orbitron text-7xl md:text-9xl font-black text-white italic tracking-tighter">$ 0</h2>
                            </div>
                            <div class="bg-emerald-500/5 p-8 rounded-[2.5rem] border border-emerald-500/20 text-right min-w-[250px]">
                                <div id="saldo-display" class="text-3xl font-black text-emerald-400 orbitron italic"></div>
                                <label class="text-[8px] text-slate-500 font-black uppercase mt-2 block">Anticipo:</label>
                                <input type="number" id="f-anticipo-cliente" value="${ordenActiva.finanzas?.anticipo_cliente || 0}" class="bg-transparent text-right text-white font-bold outline-none w-full" onchange="window.actualizarFinanzasDirecto()">
                            </div>
                        </div>

                        <div id="items-container" class="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar"></div>
                        
                        <div class="grid grid-cols-2 gap-6 mt-12">
                            <button id="btnAddRepuesto" class="py-7 bg-white/5 rounded-3xl border border-white/10 orbitron text-[11px] font-black hover:bg-white/10">+ PIEZA</button>
                            <button id="btnAddMano" class="py-7 bg-cyan-500/5 rounded-3xl border border-cyan-500/20 text-cyan-400 orbitron text-[11px] font-black hover:bg-cyan-500/10">+ MANO DE OBRA</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button id="btnCierreFinanciero" class="py-10 bg-gradient-to-br from-red-600 to-red-900 text-white rounded-[2.5rem] orbitron font-black text-[12px] uppercase hover:scale-[1.02] transition-transform">EJECUTAR CIERRE</button>
                        <button id="btnSincronizar" class="py-10 bg-white text-black rounded-[2.5rem] orbitron font-black text-[15px] uppercase tracking-[0.3em] hover:scale-[1.02] transition-transform">🛰️ SINCRONIZAR NEXUS</button>
                    </div>
                </div>
            </div>
        </div>`;
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

        // --- 📡 SINCRONIZACIÓN STARLINK (Protocolo ERP Circular) ---
    // REEMPLAZAR DESDE LÍNEA 218
    const ejecutarSincronizacionNexus = async () => {
        const btn = document.getElementById("btnSincronizar");
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-sync fa-spin"></i> ENLAZANDO...`;
        
        try {
            const placaLimpia = document.getElementById("f-placa").value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
            const estadoOrden = document.getElementById("f-estado").value;
            const docId = ordenActiva.id || `OT_${placaLimpia}_${Date.now().toString().slice(-4)}`;

            // 1. Data Consolidada de la Orden
            const dataOrden = {
                ...ordenActiva,
                id: docId,
                empresaId,
                placa: placaLimpia,
                cliente: document.getElementById("f-cliente").value.trim().toUpperCase(),
                telefono: document.getElementById("f-telefono").value.trim().replace(/\s+/g, ''),
                estado: estadoOrden,
                bitacora_ia: document.getElementById("ai-log-display").value,
                updatedAt: serverTimestamp()
            };

            // 2. Operaciones en Lote (Batch/Parallel)
            await setDoc(doc(db, "ordenes", docId), dataOrden);
            await setDoc(doc(db, "vehiculos", placaLimpia), {
                placa: placaLimpia, empresaId, clienteNombre: dataOrden.cliente,
                ultimaActualizacion: serverTimestamp(),
                status: estadoOrden === 'LISTO' ? 'OPERATIVO' : 'EN TALLER',
                ultimoServicio: { desc: dataOrden.items[0]?.desc || "Revisión", idOrden: docId }
            }, { merge: true });

            // 3. 🏁 DISPARADORES CONTABLES & INVENTARIO
            
            // A. Si hay anticipo, crear asiento automático en GLOBAL LEDGER
            if (dataOrden.finanzas.anticipo_cliente > 0) {
                await setDoc(doc(db, "contabilidad", `ANT_${docId}`), {
                    empresaId, monto: dataOrden.finanzas.anticipo_cliente,
                    tipo: "ingreso_ot", concepto: `ANTICIPO OT: ${placaLimpia}`,
                    referencia: docId, creadoEn: serverTimestamp()
                }, { merge: true });
            }

            // B. Si la orden está LISTA, registrar el ingreso total y descontar Stock
            if (estadoOrden === "LISTO") {
                // Registro de Venta Final
                await setDoc(doc(db, "contabilidad", `VENTA_${docId}`), {
                    empresaId, monto: dataOrden.costos_totales.gran_total,
                    tipo: "ingreso_ot", concepto: `CIERRE OT: ${placaLimpia}`,
                    referencia: docId, creadoEn: serverTimestamp()
                });

                // Descuento de Inventario y Registro de Costo
                for (const item of dataOrden.items) {
                    if (item.tipo === 'REPUESTO' && item.sku && item.origen === 'TALLER') {
                        // Descontar del almacén
                        await updateDoc(doc(db, "inventario", item.sku), { stock: increment(-1) });
                        // Registrar el gasto (Costo de venta) para utilidad real
                        await addDoc(collection(db, "contabilidad"), {
                            empresaId, monto: item.costo, tipo: "repuestos",
                            concepto: `COSTO: ${item.desc} (OT ${placaLimpia})`,
                            referencia: docId, creadoEn: serverTimestamp()
                        });
                    }
                }
                generarCertificadoTecnico(dataOrden);
            }

            hablar(`Sincronía total. Activo ${placaLimpia} actualizado.`);
            Swal.fire({ icon: 'success', title: 'NEXUS_FULL_SYNC', background: '#0d1117', color: '#fff', timer: 2000 });
            btn.innerHTML = originalText;
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (err) {
            console.error(err);
            btn.innerHTML = originalText;
            Swal.fire('ERROR DE NODO', 'Fallo en enlace financiero.', 'error');
        }
    };

    // --- 📦 INTEGRACIÓN DE INVENTARIO ALFABÉTICO ---
    window.buscarEnInventario = async (idx) => {
        const { value: selectedItem } = await Swal.fire({
            title: 'BÓVEDA DE SUMINISTROS',
            background: '#010409', color: '#fff',
            html: `<select id="swal-sku" class="w-full bg-[#0d1117] p-4 rounded-2xl text-white border border-white/10 orbitron text-[10px] uppercase"><option>Cargando...</option></select>`,
            didOpen: async () => {
                const snap = await getDocs(query(collection(db, "inventario"), where("empresaId", "==", empresaId)));
                const select = document.getElementById("swal-sku");
                select.innerHTML = '<option value="">-- SELECCIONE --</option>' + 
                    snap.docs.map(d => ({id: d.id, ...d.data()}))
                    .sort((a,b) => a.nombre.localeCompare(b.nombre))
                    .map(d => `<option value='${JSON.stringify({id: d.id, n: d.nombre, c: d.costo, v: d.venta})}'>${d.nombre} (${d.stock} DISP)</option>`).join('');
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
            recalcularFinanzas();
            hablar(`${selectedItem.n} vinculado.`);
        }
    };
    // FIN DEL BLOQUE A REEMPLAZAR (Línea 285 aprox)

    // --- 📱 COMUNICACIÓN WHATSAPP ---
    const ejecutarProtocoloSalida = (o) => {
        const msg = `*NEXUS-X AEGIS: INFORME DE MISIÓN*%0A%0AVehículo *[${o.placa}]* listo.%0A💰 Saldo Pendiente: *$${o.costos_totales.saldo_pendiente.toLocaleString()}*%0A✅ Paga aquí: https://bold.co/pay/tallerpro360`;
        window.open(`https://wa.me/57${o.telefono}?text=${msg}`, '_blank');
    };

    // --- 📸 MULTIMEDIA & EVIDENCIA ---
    const capturarEvidencia = (tipo) => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = tipo === 'FOTO' ? 'image/*' : 'video/*'; input.capture = 'environment';
        input.onchange = (e) => { 
            if (e.target.files[0]) {
                hablar(`Reporte de ${tipo} listo.`);
                const msg = `*EVIDENCIA [${ordenActiva.placa}]*: Se adjunta reporte de ${tipo.toLowerCase()}.`;
                window.open(`https://wa.me/57${ordenActiva.telefono}?text=${encodeURIComponent(msg)}`, '_blank');
            }
        };
        input.click();
    };

    // --- 📄 GENERADOR CDA (Certificado) ---
    const generarCertificadoTecnico = (o) => {
        const win = window.open('', '_blank');
        win.document.write(`
            <html><body style="font-family:Arial;padding:40px;line-height:1.6;">
            <h1 style="color:#00f2ff;">NEXUS-X CDA</h1><hr>
            <p><strong>PLACA:</strong> ${o.placa} | <strong>CLIENTE:</strong> ${o.cliente}</p>
            <h3>DIAGNÓSTICO TÉCNICO:</h3><p style="font-style:italic;">${o.bitacora_ia}</p>
            <h3>TRABAJOS REALIZADOS:</h3><ul>${o.items.map(i => `<li>${i.desc} - ${i.tipo}</li>`).join('')}</ul>
            </body></html>`);
        win.print();
    };

    // --- 🔗 VINCULACIÓN DE EVENTOS ---
    const vincularAccionesTerminal = () => {
        document.getElementById("btnSincronizar").onclick = ejecutarSincronizacionNexus;
        document.getElementById("btnCloseTerminal").onclick = () => { document.getElementById("nexus-terminal").classList.add("hidden"); if(isRecording) recognition?.stop(); };
        document.getElementById("btnDictar").onclick = () => {
            if(!isRecording) { recognition?.start(); isRecording = true; document.getElementById("rec-indicator").classList.remove("hidden"); document.getElementById("btnDictar").innerText = "🛑 DETENER"; }
            else { recognition?.stop(); isRecording = false; document.getElementById("rec-indicator").classList.add("hidden"); document.getElementById("btnDictar").innerText = "🎤 DICTAR"; }
        };
        if(recognition) recognition.onresult = (e) => { document.getElementById("ai-log-display").value = Array.from(e.results).map(r => r[0].transcript).join(''); };
        document.getElementById("btnCapturePhoto").onclick = () => capturarEvidencia('FOTO');
        document.getElementById("btnCaptureVideo").onclick = () => capturarEvidencia('VIDEO');
        document.getElementById("btnWppDirect").onclick = () => ejecutarProtocoloSalida(ordenActiva);
        document.getElementById("btnAddRepuesto").onclick = () => { ordenActiva.items.push({ tipo: 'REPUESTO', desc: 'NUEVA PIEZA', costo: 0, venta: 0, origen: 'TALLER' }); recalcularFinanzas(); };
        document.getElementById("btnAddMano").onclick = () => { ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: 'SERVICIO TÉCNICO', costo: 0, venta: 0, origen: 'TALLER' }); recalcularFinanzas(); };
    };

    window.toggleOrigenItem = (idx) => { const it = ordenActiva.items[idx]; it.origen = it.origen === 'TALLER' ? 'CLIENTE' : 'TALLER'; if(it.origen === 'CLIENTE') it.costo = 0; recalcularFinanzas(); };
    window.editItemNexus = (idx, campo, val) => { ordenActiva.items[idx][campo] = val; recalcularFinanzas(); };
    window.removeItemNexus = (idx) => { ordenActiva.items.splice(idx, 1); recalcularFinanzas(); };
    window.abrirTerminalNexus = (id) => abrirTerminal(id);
    window.actualizarFinanzasDirecto = () => recalcularFinanzas();

    const vincularNavegacion = () => {
        document.getElementById("btnNewMission").onclick = () => abrirTerminal();
        document.querySelectorAll(".fase-tab").forEach(tab => { tab.onclick = () => { faseActual = tab.dataset.fase; renderBase(); }; });
    };

    renderBase();
}
