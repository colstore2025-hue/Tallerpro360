/**
 * ordenes.js - NEXUS-X COMMAND CENTER V6.0 "PENTAGON" 🛰️
 * SISTEMA DE GESTIÓN OPERATIVA CON ENLACE FINANCIERO Y ALMACÉN
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, 
    setDoc, deleteDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
// 🛰️ IMPORTACIÓN DE SERVICIOS NEXUS-X
import { registrarMovimientoContable, descontarStock } from "../services/dataService.js";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("empresaId"); // Estandarizado con Dashboard
    let ordenActiva = null;
    let faseActual = 'INGRESO';
    let isRecording = false;

    // --- 🏗️ RENDER BASE ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 border-b border-white/5 pb-12">
                <div class="space-y-3">
                    <div class="flex items-center gap-5">
                        <div class="h-4 w-4 bg-cyan-500 rounded-full animate-ping shadow-[0_0_20px_#00f2ff]"></div>
                        <h1 class="orbitron text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase">Nexus_<span class="text-cyan-400">OT</span></h1>
                    </div>
                    <p class="text-[11px] orbitron text-slate-500 tracking-[0.5em] uppercase italic italic">Aerospace Vehicle Logistics System</p>
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

    // --- 🛰️ CARGA DE DATOS (REAL-TIME) ---
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
                <div onclick="window.abrirTerminalNexus('${o.id}')" class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 hover:border-cyan-500/50 transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-4">
                    <div class="flex justify-between items-start mb-4">
                         <span class="orbitron text-3xl font-black text-white group-hover:text-cyan-400">${o.placa}</span>
                         <span class="text-[8px] bg-white/5 px-3 py-1 rounded-full orbitron text-slate-400">${o.estado}</span>
                    </div>
                    <p class="text-[9px] text-slate-500 orbitron italic tracking-widest">${o.cliente || 'ANÓNIMO'}</p>
                    <div class="mt-6 flex justify-between items-center border-t border-white/5 pt-4">
                        <span class="text-xl font-black text-white orbitron">$ ${Number(o.costos_totales?.gran_total || 0).toLocaleString()}</span>
                        <div class="h-10 w-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400"><i class="fas fa-arrow-right"></i></div>
                    </div>
                </div>`).join('');
            }
        });
    };

    // --- 💰 MOTOR FINANCIERO & STOCK ---
    const recalcularFinanzas = () => {
        let sumaVentaBruta = 0;
        let sumaCostoTaller = 0; // Solo lo que el taller pone

        ordenActiva.items.forEach(i => {
            sumaVentaBruta += Number(i.venta || 0);
            // 🛠️ LÓGICA DE ALMACÉN: Si el cliente trae el repuesto, el costo para el taller es 0
            if (i.origen === "TALLER") {
                sumaCostoTaller += Number(i.costo || 0);
            }
        });

        const g_varios = Number(document.getElementById("f-gastos-varios")?.value || 0);
        const a_tecnico = Number(document.getElementById("f-adelanto-tecnico")?.value || 0);
        const a_cliente = Number(document.getElementById("f-anticipo-cliente")?.value || 0);
        
        let valorIVA = (ordenActiva.finanzas?.impuesto_tipo === 'IVA_19') ? sumaVentaBruta * 0.19 : 0;
        const granTotal = sumaVentaBruta + valorIVA;
        const utilidadNeta = sumaVentaBruta - (sumaCostoTaller + g_varios);

        ordenActiva.costos_totales = {
            total_venta: sumaVentaBruta,
            total_costo: sumaCostoTaller + g_varios + a_tecnico,
            iva: valorIVA,
            gran_total: granTotal,
            utilidad: utilidadNeta,
            saldo_pendiente: granTotal - a_cliente
        };

        const totalEl = document.getElementById("total-factura");
        if(totalEl) {
            totalEl.innerText = `$ ${granTotal.toLocaleString()}`;
            document.getElementById("saldo-display").innerHTML = `
                <span class="text-slate-500 text-[10px] uppercase block tracking-widest font-black">Saldo de Misión</span>
                $ ${ordenActiva.costos_totales.saldo_pendiente.toLocaleString()}
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
                <div class="md:col-span-5">
                    <span class="text-[8px] orbitron ${item.tipo === 'REPUESTO' ? 'text-orange-400' : 'text-cyan-400'} uppercase font-black">${item.tipo}</span>
                    <input onchange="window.editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" class="w-full bg-transparent outline-none text-white text-sm uppercase font-bold mt-1" placeholder="Concepto...">
                </div>
                <div class="md:col-span-2">
                    <label class="text-[7px] text-slate-500 block mb-1 uppercase font-black italic">Costo Interno</label>
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

    // --- 🎮 TERMINAL DE COMANDO ---
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
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                </div>
                <div class="flex gap-3">
                    <button id="btnWppDirect" class="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"><i class="fab fa-whatsapp text-xl"></i></button>
                    <button id="btnEliminarOT" class="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"><i class="fas fa-trash text-sm"></i></button>
                    <button id="btnCloseTerminal" class="w-14 h-14 rounded-[1.5rem] bg-white/10 text-white font-black text-2xl hover:bg-white hover:text-black transition-all">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div class="lg:col-span-4 space-y-8">
                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5">
                        <label class="text-[9px] text-slate-500 font-black uppercase mb-4 block tracking-[0.2em]">Expediente del Propietario</label>
                        <div class="space-y-4">
                            <div class="relative">
                                <i class="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                                <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-white/5 p-6 pl-14 rounded-3xl border border-white/5 outline-none font-bold uppercase focus:border-cyan-500/30" placeholder="NOMBRE DEL CLIENTE">
                            </div>
                            <div class="relative">
                                <i class="fas fa-phone absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                                <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-white/5 p-6 pl-14 rounded-3xl border border-white/5 outline-none focus:border-cyan-500/30" placeholder="MÓVIL / WHATSAPP">
                            </div>
                        </div>
                    </div>

                    <div class="bg-black p-10 rounded-[3.5rem] border border-cyan-500/20 shadow-glow-cyan">
                        <div class="flex justify-between items-center mb-6">
                            <span class="orbitron text-[10px] text-cyan-400 font-black italic tracking-widest">NEXUS AI LOG</span>
                            <div id="rec-indicator" class="flex gap-1 items-center ${isRecording ? '' : 'hidden'}">
                                <div class="h-2 w-2 bg-red-600 rounded-full animate-pulse"></div>
                                <span class="text-[7px] text-red-500 font-black orbitron">GRAVANDO</span>
                            </div>
                        </div>
                        <textarea id="ai-log-display" class="w-full bg-white/5 p-6 rounded-3xl text-xs h-44 outline-none border border-white/5 italic text-slate-300 leading-relaxed resize-none focus:border-cyan-500/50 transition-all custom-scrollbar">${ordenActiva.bitacora_ia || ''}</textarea>
                        <button id="btnDictar" class="w-full mt-6 py-5 bg-cyan-500 text-black rounded-2xl orbitron text-[9px] font-black hover:bg-white transition-all">🎤 INICIAR ESCUCHA NEURAL</button>
                    </div>

                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 space-y-6">
                        <p class="orbitron text-[9px] text-slate-500 font-black text-center mb-4 italic">Conciliación de Egresos</p>
                        <div>
                            <label class="text-[8px] text-red-400 font-black uppercase mb-2 block tracking-widest">Insumos / Terceros</label>
                            <input type="number" id="f-gastos-varios" value="${ordenActiva.finanzas?.gastos_varios || 0}" class="w-full bg-black/50 p-5 rounded-2xl text-white border border-white/5 text-xl font-bold" onchange="window.actualizarFinanzasDirecto()">
                        </div>
                        <div>
                            <label class="text-[8px] text-red-400 font-black uppercase mb-2 block tracking-widest">Nómina Técnica (Adelantos)</label>
                            <input type="number" id="f-adelanto-tecnico" value="${ordenActiva.finanzas?.adelanto_tecnico || 0}" class="w-full bg-black/50 p-5 rounded-2xl text-white border border-white/5 text-xl font-bold" onchange="window.actualizarFinanzasDirecto()">
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
                        <div class="absolute top-0 right-0 p-8">
                            <i class="fas fa-satellite text-white/5 text-8xl"></i>
                        </div>
                        <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
                            <div>
                                <p class="orbitron text-[12px] text-cyan-400 uppercase italic font-black tracking-[0.3em]">Total de Liquidación</p>
                                <h2 id="total-factura" class="orbitron text-7xl md:text-9xl font-black text-white italic tracking-tighter">$ 0</h2>
                            </div>
                            <div class="bg-emerald-500/5 p-8 rounded-[2.5rem] border border-emerald-500/20 text-right min-w-[250px]">
                                <div id="saldo-display" class="text-3xl font-black text-emerald-400 orbitron italic"></div>
                                <label class="text-[8px] text-slate-500 font-black uppercase mt-2 block italic tracking-tighter">Anticipo recibido:</label>
                                <input type="number" id="f-anticipo-cliente" value="${ordenActiva.finanzas?.anticipo_cliente || 0}" class="bg-transparent text-right text-white font-bold outline-none w-full" onchange="window.actualizarFinanzasDirecto()">
                            </div>
                        </div>

                        <div id="items-container" class="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar"></div>
                        
                        <div class="grid grid-cols-2 gap-6 mt-12">
                            <button id="btnAddRepuesto" class="py-7 bg-white/5 rounded-3xl border border-white/10 orbitron text-[11px] font-black hover:bg-white/10 transition-all">+ AÑADIR PIEZA</button>
                            <button id="btnAddMano" class="py-7 bg-cyan-500/5 rounded-3xl border border-cyan-500/20 text-cyan-400 orbitron text-[11px] font-black hover:bg-cyan-500/10 transition-all">+ MANO DE OBRA</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button id="btnPagarBold" class="py-10 bg-gradient-to-br from-red-600 to-red-900 text-white rounded-[2.5rem] orbitron font-black text-[12px] uppercase shadow-[0_0_40px_rgba(220,38,38,0.2)]">
                            <i class="fas fa-bolt mr-3"></i> EJECUTAR CIERRE FINANCIERO
                        </button>
                        <button id="btnSincronizar" class="group relative py-10 bg-white text-black rounded-[2.5rem] orbitron font-black text-[15px] uppercase tracking-[0.3em] overflow-hidden">
                            <span class="relative z-10">🛰️ SINCRONIZAR NEXUS</span>
                            <div class="absolute inset-0 bg-cyan-400 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

        // --- 📱 MOTOR DE COMUNICACIÓN NEXUS-X ---
const ejecutarProtocoloSalida = async (orden) => {
    const { placa, cliente, telefono, costos_totales } = orden;
    const saldo = costos_totales.saldo_pendiente;
    
    // 🔗 Link de Pago dinámico
    const linkPago = `https://bold.co/pay/tallerpro360_${orden.id}`; 
    
    const mensaje = `*NEXUS-X AEGIS: INFORME DE MISIÓN*%0A%0A` +
                    `Hola *${cliente.toUpperCase()}*, la misión con el vehículo *[${placa}]* ha finalizado.%0A%0A` +
                    `💰 *Resumen Financiero:*%0A` +
                    `- Total: $${costos_totales.gran_total.toLocaleString()}%0A` +
                    `- Saldo Pendiente: *$${saldo.toLocaleString()}*%0A%0A` +
                    `✅ *Paga aquí:* ${linkPago}%0A%0A` +
                    `_Sistema de Gestión TallerPRO360_`;

    window.open(`https://wa.me/57${telefono}?text=${mensaje}`, '_blank');
};

// --- 🔄 SINCRONIZACIÓN TRANSVERSAL (FEEDBACK DE DATOS) ---
const actualizarEcosistemaNexus = async (data) => {
    try {
        const batch = [];
        // Actualizar Clientes
        const clienteRef = doc(db, "clientes", data.telefono);
        batch.push(setDoc(clienteRef, {
            nombre: data.cliente,
            telefono: data.telefono,
            ultima_placa: data.placa,
            ultimo_servicio: serverTimestamp()
        }, { merge: true }));

        // Actualizar Vehículos
        const vehiculoRef = doc(db, "vehiculos", data.placa);
        batch.push(setDoc(vehiculoRef, {
            placa: data.placa,
            propietario: data.cliente,
            ultima_visita: serverTimestamp()
        }, { merge: true }));

        await Promise.all(batch);
    } catch (e) { console.error("⚠️ Error de replicación:", e); }
};

// --- 📸 PROTOCOLO MULTIMEDIA (EVIDENCIA RÁPIDA) ---
const capturarEvidencia = (tipo) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = tipo === 'FOTO' ? 'image/*' : 'video/*';
    input.capture = 'environment'; // Abre la cámara directamente en móviles

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            hablar(`Enviando ${tipo.toLowerCase()} de evidencia al cliente.`);
            const reader = new FileReader();
            reader.onload = () => {
                // Aquí simulamos el envío directo ya que no lo guardamos en Firestore por ahora
                const mensaje = `*EVIDENCIA DE MISIÓN [${ordenActiva.placa}]*:%0ASe adjunta ${tipo.toLowerCase()} del estado técnico.`;
                window.open(`https://wa.me/57${ordenActiva.telefono}?text=${mensaje}`, '_blank');
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
};

const vincularAccionesTerminal = () => {
    document.getElementById("btnCloseTerminal").onclick = () => {
        document.getElementById("nexus-terminal").classList.add("hidden");
        if(isRecording) recognition?.stop();
    };

    // 🚀 SINCRONIZACIÓN STARLINK (RECONSTRUIDA)
    document.getElementById("btnSincronizar").onclick = async () => {
        const btn = document.getElementById("btnSincronizar");
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-sync fa-spin"></i> ESTABLECIENDO ENLACE...`;
        
        try {
            const data = {
                ...ordenActiva,
                empresaId: localStorage.getItem("empresaId"),
                placa: document.getElementById("f-placa").value.toUpperCase(),
                cliente: document.getElementById("f-cliente").value,
                telefono: document.getElementById("f-telefono").value,
                estado: document.getElementById("f-estado").value,
                bitacora_ia: document.getElementById("ai-log-display").value,
                updatedAt: serverTimestamp()
            };

            await setDoc(doc(db, "ordenes", ordenActiva.id || `OT_${Date.now()}`), data);
            await actualizarEcosistemaNexus(data);

            if (data.estado === "LISTO") {
                hablar("Misión finalizada. Ejecutando protocolo de salida.");
                await registrarMovimientoContable("INGRESO", data.costos_totales.gran_total, `CIERRE OT: ${data.placa}`);
                await ejecutarProtocoloSalida(data);
            }

            Swal.fire({ icon: 'success', title: 'SINCRONÍA EXITOSA', background: '#0d1117', color: '#fff' });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (err) {
            btn.innerHTML = originalText;
            Swal.fire('ERROR', 'Fallo en enlace satelital.', 'error');
        }
    };

    // 📸 BOTONES MULTIMEDIA (AÑADIR AL HTML DE LA TERMINAL)
    // Agrega estos IDs en los botones correspondientes de tu renderTerminal
    document.getElementById("btnCapturePhoto").onclick = () => capturarEvidencia('FOTO');
    document.getElementById("btnCaptureVideo").onclick = () => capturarEvidencia('VIDEO');

    document.getElementById("btnDictar").onclick = () => {
        if(!isRecording) {
            recognition?.start();
            isRecording = true;
            document.getElementById("rec-indicator").classList.remove("hidden");
            document.getElementById("btnDictar").innerText = "🛑 DETENER ESCUCHA";
        } else {
            recognition?.stop();
            isRecording = false;
            document.getElementById("rec-indicator").classList.add("hidden");
            document.getElementById("btnDictar").innerText = "🎤 INICIAR ESCUCHA NEURAL";
        }
    };

    if(recognition) {
        recognition.onresult = (e) => {
            const text = Array.from(e.results).map(r => r[0].transcript).join('');
            document.getElementById("ai-log-display").value = text;
        };
    }

    document.getElementById("btnAddRepuesto").onclick = () => { 
        ordenActiva.items.push({ tipo: 'REPUESTO', desc: 'NUEVA PIEZA', costo: 0, venta: 0, origen: 'TALLER' }); 
        recalcularFinanzas(); 
    };
    document.getElementById("btnAddMano").onclick = () => { 
        ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: 'SERVICIO TÉCNICO', costo: 0, venta: 0, origen: 'TALLER' }); 
        recalcularFinanzas(); 
    };
};

// --- 🌍 FUNCIONES GLOBALES ---
window.toggleOrigenItem = (idx) => {
    const item = ordenActiva.items[idx];
    item.origen = item.origen === 'TALLER' ? 'CLIENTE' : 'TALLER';
    if(item.origen === 'CLIENTE') item.costo = 0;
    recalcularFinanzas();
};

window.editItemNexus = (idx, campo, valor) => { 
    ordenActiva.items[idx][campo] = valor; 
    recalcularFinanzas(); 
};

window.removeItemNexus = (idx) => { 
    ordenActiva.items.splice(idx, 1); 
    recalcularFinanzas(); 
};

window.abrirTerminalNexus = (id) => abrirTerminal(id);
window.actualizarFinanzasDirecto = () => recalcularFinanzas();

const vincularNavegacion = () => {
    document.getElementById("btnNewMission").onclick = () => abrirTerminal();
    document.querySelectorAll(".fase-tab").forEach(tab => {
        tab.onclick = () => {
            faseActual = tab.dataset.fase;
            renderBase();
        };
    });
};

renderBase();
