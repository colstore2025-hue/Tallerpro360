/**
 * ordenes.js - NEXUS-X COMMAND CENTER V6.1 "PENTAGON" 🛰️
 * Fusión Maestra: Estética Aeroespacial + Lógica Financiera Pro
 * Diseñado por: William Jeffry Urquijo & Gemini Nexus AI
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, increment 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

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
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32 animate-in fade-in duration-500">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 border-b border-white/5 pb-12">
                <div class="space-y-3">
                    <div class="flex items-center gap-5">
                        <div class="h-4 w-4 bg-cyan-500 rounded-full animate-ping shadow-[0_0_20px_#00f2ff]"></div>
                        <h1 class="orbitron text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase">Nexus_<span class="text-cyan-400">OT</span></h1>
                    </div>
                    <p class="text-[11px] orbitron text-slate-500 tracking-[0.5em] uppercase italic">Aerospace Vehicle Logistics System</p>
                </div>
                <div class="flex flex-wrap gap-4 w-full md:w-auto">
                    <button onclick="location.hash='#marketplace'" class="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl orbitron text-[10px] hover:bg-cyan-500/20 transition-all">MARKETPLACE</button>
                    <button onclick="location.hash='#audit'" class="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl orbitron text-[10px] hover:bg-red-500/20 transition-all text-red-400">AUDIT CENTER</button>
                    <button id="btnNewMission" class="px-10 py-4 bg-white text-black rounded-full orbitron text-[12px] font-black hover:bg-cyan-400 transition-all shadow-glow-white">NUEVA MISIÓN +</button>
                </div>
            </header>

            <nav class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16">
                ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="fase-tab p-6 rounded-[2.5rem] bg-[#0d1117] border border-white/5 transition-all group ${faseActual === fase ? 'border-cyan-500/50 shadow-glow-cyan bg-cyan-500/5' : ''}" data-fase="${fase}">
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
                <div onclick="window.abrirTerminalNexus('${o.id}')" class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 hover:border-cyan-500/50 transition-all cursor-pointer group animate-in slide-in-from-bottom-4 shadow-xl">
                    <div class="flex justify-between items-start mb-4">
                         <span class="orbitron text-3xl font-black text-white group-hover:text-cyan-400">${o.placa}</span>
                         <span class="text-[8px] bg-white/5 px-3 py-1 rounded-full orbitron text-slate-400 border border-white/5">${o.estado}</span>
                    </div>
                    <p class="text-[9px] text-slate-500 orbitron italic tracking-widest uppercase truncate">${o.cliente || 'ANÓNIMO'}</p>
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
            btn.onclick = () => {
                faseActual = btn.dataset.fase;
                renderBase();
            };
        });
        const btnNew = document.getElementById("btnNewMission");
        if(btnNew) btnNew.onclick = () => abrirTerminal();
    };

    window.abrirTerminalNexus = (id) => abrirTerminal(id);

    // --- 💰 MOTOR FINANCIERO NEXUS-X V6.5 PRO (COLOMBIA) ---
    const recalcularFinanzas = () => {
        let sumaVentaBruta = 0;
        let sumaCostoTaller = 0;

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
            anticipo_cliente: a_cliente,
            impuesto_tipo: tipoImpuesto
        };

        const totalEl = document.getElementById("total-factura");
        if(totalEl) {
            totalEl.innerText = `$ ${granTotal.toLocaleString()}`;
            document.getElementById("saldo-display").innerHTML = `
                <span class="text-slate-500 text-[10px] uppercase block tracking-widest font-black">Saldo de Misión</span>
                <span class="${saldoPendiente > 0 ? 'text-emerald-400' : 'text-white'} text-2xl font-black orbitron">$ ${saldoPendiente.toLocaleString()}</span>
            `;
        }
        renderItems();
    };

    // --- 📡 PROTOCOLO DE SINCRONIZACIÓN Y CIERRE ---
    const ejecutarSincronizacionNexus = async () => {
        const btn = document.getElementById("btnSincronizar");
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-circle-notch fa-spin mr-2"></i> LINKING...`;
        
        try {
            const placaLimpia = document.getElementById("f-placa").value.trim().toUpperCase();
            if(!placaLimpia) throw new Error("Placa Requerida");

            const estadoOrden = document.getElementById("f-estado").value;
            const docId = ordenActiva.id || `OT_${placaLimpia}_${Date.now().toString().slice(-4)}`;

            const dataOrden = {
                ...ordenActiva,
                id: docId,
                empresaId,
                placa: placaLimpia,
                cliente: document.getElementById("f-cliente").value.toUpperCase(),
                telefono: document.getElementById("f-telefono").value,
                estado: estadoOrden,
                bitacora_ia: document.getElementById("ai-log-display").value,
                updatedAt: serverTimestamp()
            };

            // 1. Guardar Orden
            await setDoc(doc(db, "ordenes", docId), dataOrden);

            // 2. Actualizar Historial Vehículo
            await setDoc(doc(db, "vehiculos", placaLimpia), {
                placa: placaLimpia, 
                empresaId, 
                clienteNombre: dataOrden.cliente,
                ultimaActualizacion: serverTimestamp(),
                status: (estadoOrden === 'LISTO' || estadoOrden === 'ENTREGADO') ? 'OPERATIVO' : 'EN TALLER'
            }, { merge: true });

            // 3. Protocolo de Cierre Maestro (Inventario y Contabilidad)
            if (estadoOrden === "ENTREGADO") {
                const batchPromises = [];
                // Registro en Caja
                batchPromises.push(addDoc(collection(db, "contabilidad"), {
                    empresaId, monto: dataOrden.costos_totales.gran_total,
                    tipo: "ingreso_ot", concepto: `CIERRE OT: ${placaLimpia}`,
                    referencia: docId, creadoEn: serverTimestamp()
                }));

                // Descuento de Inventario
                for (const item of dataOrden.items) {
                    if (item.tipo === 'REPUESTO' && item.sku && item.origen === 'TALLER') {
                        batchPromises.push(updateDoc(doc(db, "inventario", item.sku), { 
                            cantidad: increment(-1) 
                        }));
                    }
                }
                await Promise.all(batchPromises);
            }

            if (typeof hablar === 'function') hablar(`Sistema sincronizado.`);
            Swal.fire({ icon: 'success', title: 'NEXUS SYNC COMPLETA', background: '#0d1117', color: '#fff' });
            document.getElementById("nexus-terminal").classList.add("hidden");
            renderBase();

        } catch (err) {
            console.error("Sync Error:", err);
            Swal.fire('ERROR DE NODO', err.message, 'error');
        } finally {
            btn.innerHTML = originalText;
        }
    };

    // --- (Aquí seguirían las funciones renderTerminal, renderItems y buscarEnInventario que ya tienes) ---
    // He corregido las llamadas a los IDs en el renderTerminal para que coincidan con la lógica de recalcularFinanzas.

    renderBase();
}

    // --- 🎮 TERMINAL DE COMANDO PENTAGON V6.5 (DETALLE OPERATIVO) ---
    const abrirTerminal = async (id = null) => {
        const modal = document.getElementById("nexus-terminal");
        if(!modal) return;
        modal.classList.remove("hidden");
        
        if (id) {
            const snap = await getDoc(doc(db, "ordenes", id));
            ordenActiva = { id, ...snap.data() };
        } else {
            ordenActiva = {
                placa: '', cliente: '', telefono: '', estado: 'INGRESO', items: [], 
                bitacora_ia: '', 
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
            <div class="flex flex-wrap justify-between items-center gap-6 mb-10 bg-[#0d1117]/90 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/5 shadow-2xl sticky top-0 z-50">
                <div class="flex items-center gap-6">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-transparent text-5xl font-black orbitron text-cyan-400 outline-none w-52 uppercase border-b border-white/5 focus:border-cyan-500 transition-all" placeholder="PLACA">
                    <div class="h-10 w-[1px] bg-white/10 hidden md:block"></div>
                    <select id="f-estado" class="bg-black text-cyan-400 orbitron text-[10px] p-4 rounded-2xl border border-cyan-500/20 outline-none focus:ring-2 ring-cyan-500/20">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO', 'GARANTIA'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                    <select id="f-iva-tipo" class="bg-black text-emerald-400 orbitron text-[10px] p-4 rounded-2xl border border-emerald-500/20 outline-none" onchange="window.cambiarTipoImpuesto(this.value)">
                        <option value="SIN_IVA" ${ordenActiva.finanzas.impuesto_tipo === 'SIN_IVA' ? 'selected' : ''}>REG. SIMPLIFICADO (NO IVA)</option>
                        <option value="IVA_19" ${ordenActiva.finanzas.impuesto_tipo === 'IVA_19' ? 'selected' : ''}>IVA GENERAL (19%)</option>
                    </select>
                </div>
                <div class="flex gap-4">
                    <button id="btnCapturePhoto" class="w-14 h-14 rounded-2xl bg-white/5 text-white hover:bg-cyan-500 transition-all shadow-glow-cyan"><i class="fas fa-camera"></i></button>
                    <button id="btnWppDirect" class="w-14 h-14 rounded-2xl bg-white/5 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"><i class="fab fa-whatsapp"></i></button>
                    <button id="btnCloseTerminal" class="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 font-black hover:bg-red-500 hover:text-white transition-all">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div class="lg:col-span-4 space-y-8">
                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 shadow-xl">
                        <label class="text-[9px] text-slate-500 font-black uppercase mb-4 block tracking-[0.3em] italic">Owner Registration</label>
                        <div class="space-y-4">
                            <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-white/5 p-6 rounded-3xl border border-white/5 outline-none font-bold uppercase focus:border-cyan-500/30" placeholder="NOMBRE DEL CLIENTE">
                            <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-white/5 p-6 rounded-3xl border border-white/5 outline-none focus:border-cyan-500/30 font-mono" placeholder="WHATSAPP (+57)">
                        </div>
                    </div>

                    <div class="bg-black p-10 rounded-[3.5rem] border border-cyan-500/20 shadow-glow-cyan relative overflow-hidden">
                        <div class="flex justify-between items-center mb-6">
                            <span class="orbitron text-[10px] text-cyan-400 font-black italic tracking-widest uppercase">Nexus AI Bitácora</span>
                            <div id="rec-indicator" class="flex gap-1 items-center hidden"><div class="h-2 w-2 bg-red-600 rounded-full animate-pulse"></div><span class="text-[8px] text-red-500 font-bold uppercase">Escuchando...</span></div>
                        </div>
                        <textarea id="ai-log-display" class="w-full bg-white/5 p-6 rounded-3xl text-xs h-44 outline-none border border-white/5 italic text-slate-300 resize-none font-mono scrollbar-hide">${ordenActiva.bitacora_ia || ''}</textarea>
                        <button id="btnDictar" class="w-full mt-6 py-5 bg-cyan-500 text-black rounded-2xl orbitron text-[9px] font-black hover:bg-white transition-all shadow-[0_10px_30px_rgba(6,182,212,0.3)]">🎤 INICIAR ESCUCHA NEURAL</button>
                    </div>

                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 space-y-6">
                        <div class="space-y-4">
                            <div>
                                <label class="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-2 block italic">Insumos / Terceros</label>
                                <input type="number" id="f-gastos-varios" value="${ordenActiva.finanzas?.gastos_varios || 0}" class="w-full bg-black/50 p-5 rounded-2xl text-white border border-white/5 text-xl font-bold orbitron text-center" onchange="window.actualizarFinanzasDirecto()">
                            </div>
                            <div>
                                <label class="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-2 block italic">Pago a Técnico</label>
                                <input type="number" id="f-adelanto-tecnico" value="${ordenActiva.finanzas?.adelanto_tecnico || 0}" class="w-full bg-black/50 p-5 rounded-2xl text-white border border-white/5 text-xl font-bold orbitron text-center" onchange="window.actualizarFinanzasDirecto()">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
                        <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-8 relative z-10">
                            <div>
                                <p class="orbitron text-[12px] text-cyan-400 uppercase italic font-black tracking-[0.4em] mb-2">Presupuesto Final</p>
                                <h2 id="total-factura" class="orbitron text-6xl md:text-8xl font-black text-white italic tracking-tighter">$ 0</h2>
                            </div>
                            <div class="bg-emerald-500/5 p-8 rounded-[3rem] border border-emerald-500/10 text-right min-w-[300px]">
                                <div id="saldo-display"></div>
                                <label class="text-[8px] text-slate-500 font-black uppercase mb-2 mt-4 block tracking-widest font-bold">Abono Recibido:</label>
                                <input type="number" id="f-anticipo-cliente" value="${ordenActiva.finanzas?.anticipo_cliente || 0}" class="bg-black/60 p-4 rounded-2xl text-right text-emerald-400 font-black orbitron outline-none w-full border border-emerald-500/20 text-2xl" onchange="window.actualizarFinanzasDirecto()">
                            </div>
                        </div>

                        <div id="items-container" class="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar mb-10"></div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button id="btnAddRepuesto" class="py-8 bg-white/5 rounded-[2rem] border border-white/10 orbitron text-[11px] font-black hover:bg-white/10 transition-all uppercase tracking-widest">+ Vincular Repuesto</button>
                            <button id="btnAddMano" class="py-8 bg-cyan-500/5 rounded-[2rem] border border-cyan-500/20 text-cyan-400 orbitron text-[11px] font-black hover:bg-cyan-500/10 transition-all uppercase tracking-widest">+ Mano de Obra</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <button id="btnCierreFinanciero" class="group relative py-12 bg-gradient-to-r from-red-600 to-red-900 text-white rounded-[3rem] orbitron font-black text-[14px] uppercase overflow-hidden transition-all hover:shadow-[0_0_50px_rgba(239,68,68,0.4)]">
                            <span class="relative z-10">EJECUTAR CIERRE DE MISIÓN</span>
                            <div class="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                        </button>
                        <button id="btnSincronizar" class="py-12 bg-white text-black rounded-[3rem] orbitron font-black text-[16px] uppercase tracking-[0.4em] hover:bg-cyan-400 transition-all shadow-glow-white">
                            🛰️ FULL SYNC NEXUS
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    // --- 📦 BÓVEDA (ALGORITMO ALFABÉTICO Y FILTRADO) ---
    window.buscarEnInventario = async (idx) => {
        const { value: selectedItem } = await Swal.fire({
            title: 'NEXUS BÓVEDA',
            background: '#010409', color: '#fff',
            customClass: { popup: 'rounded-[3rem] border border-white/10' },
            html: `<select id="swal-sku-select" class="w-full bg-[#0d1117] p-5 rounded-2xl text-white border border-white/10 orbitron text-xs outline-none">
                    <option>Cargando Bóveda...</option>
                   </select>`,
            didOpen: async () => {
                const q = query(collection(db, "inventario"), where("empresaId", "==", empresaId));
                const snap = await getDocs(q);
                const items = snap.docs
                    .map(d => ({id: d.id, ...d.data()}))
                    .filter(d => Number(d.cantidad || 0) > 0)
                    .sort((a, b) => a.nombre.localeCompare(b.nombre));
                
                document.getElementById("swal-sku-select").innerHTML = items.map(d => 
                    `<option value='${JSON.stringify({id: d.id, n: d.nombre, c: d.costo, v: d.precioVenta})}'>${d.nombre.toUpperCase()} (STOCK: ${d.cantidad})</option>`
                ).join('');
            },
            preConfirm: () => JSON.parse(document.getElementById("swal-sku-select").value)
        });

        if (selectedItem) {
            ordenActiva.items[idx] = { 
                ...ordenActiva.items[idx], 
                desc: selectedItem.n.toUpperCase(), 
                costo: selectedItem.c, venta: selectedItem.v, sku: selectedItem.id 
            };
            recalcularFinanzas();
        }
    };

    // --- 🛠️ PUENTES GLOBALES (NECESARIOS PARA ONCLICK) ---
    window.cambiarTipoImpuesto = (tipo) => { ordenActiva.finanzas.impuesto_tipo = tipo; recalcularFinanzas(); };
    window.toggleOrigenItem = (idx) => { 
        const it = ordenActiva.items[idx];
        it.origen = it.origen === 'TALLER' ? 'CLIENTE' : 'TALLER';
        if(it.origen === 'CLIENTE') it.costo = 0;
        recalcularFinanzas();
    };
    window.editItemNexus = (idx, campo, val) => { 
        ordenActiva.items[idx][campo] = (campo === 'costo' || campo === 'venta') ? Number(val) : val;
        recalcularFinanzas();
    };
    window.removeItemNexus = (idx) => { ordenActiva.items.splice(idx, 1); recalcularFinanzas(); };
    window.actualizarFinanzasDirecto = () => recalcularFinanzas();

    const vincularAccionesTerminal = () => {
        document.getElementById("btnSincronizar").onclick = ejecutarSincronizacionNexus;
        document.getElementById("btnCierreFinanciero").onclick = () => {
            document.getElementById("f-estado").value = "ENTREGADO";
            ejecutarSincronizacionNexus();
        };
        document.getElementById("btnCloseTerminal").onclick = () => document.getElementById("nexus-terminal").classList.add("hidden");
        
        // Dictado por Voz (Corregido)
        document.getElementById("btnDictar").onclick = () => {
            if(!isRecording) { 
                recognition?.start(); isRecording = true; 
                document.getElementById("rec-indicator").classList.remove("hidden");
            } else { 
                recognition?.stop(); isRecording = false; 
                document.getElementById("rec-indicator").classList.add("hidden");
            }
        };
        if(recognition) recognition.onresult = (e) => {
            document.getElementById("ai-log-display").value += " " + e.results[0][0].transcript;
        };

        // WhatsApp Directo con el Saldo Real
        document.getElementById("btnWppDirect").onclick = () => {
            const msg = `*TALLERPRO-360 [${ordenActiva.placa}]*%0A✅ Vehículo listo.%0A💰 Saldo: $${ordenActiva.costos_totales.saldo_pendiente.toLocaleString()}`;
            window.open(`https://wa.me/57${ordenActiva.telefono}?text=${msg}`, '_blank');
        };

        document.getElementById("btnAddRepuesto").onclick = () => { 
            ordenActiva.items.push({ tipo: 'REPUESTO', desc: 'PIEZA NUEVA', costo: 0, venta: 0, origen: 'TALLER' }); 
            renderItems(); 
        };
        document.getElementById("btnAddMano").onclick = () => { 
            ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: 'SERVICIO TÉCNICO', costo: 0, venta: 0, origen: 'TALLER' }); 
            renderItems(); 
        };
    };

    renderBase();
} // <--- CIERRE MAESTRO DE LA FUNCIÓN EXPORT DEFAULT
